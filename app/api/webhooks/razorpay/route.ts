import { createHmac, timingSafeEqual } from "node:crypto";
import { withClient } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonObject = Record<string, unknown>;

const SUBSCRIPTION_EVENTS = new Set([
  "subscription.created",
  "subscription.authenticated",
  "subscription.activated",
  "subscription.charged",
  "subscription.pending",
  "subscription.halted",
  "subscription.cancelled",
  "subscription.completed",
  "subscription.paused",
  "subscription.resumed",
]);

const SUBSCRIPTION_STATUSES = new Set([
  "created",
  "authenticated",
  "active",
  "pending",
  "halted",
  "cancelled",
  "completed",
  "paused",
]);

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nestedEntity(payload: JsonObject, key: string): JsonObject | null {
  const resource = payload[key];
  if (!isObject(resource)) return null;

  return isObject(resource.entity) ? resource.entity : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
    ? value
    : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0
    ? value
    : null;
}

function verifySignature(body: string, signature: string, secret: string) {
  if (!/^[a-fA-F0-9]{64}$/.test(signature)) return false;

  const expected = createHmac("sha256", secret).update(body).digest();
  const received = Buffer.from(signature, "hex");

  return received.length === expected.length &&
    timingSafeEqual(received, expected);
}

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("Razorpay webhook secret is not configured");
    return Response.json({ error: "webhook_not_configured" }, { status: 500 });
  }

  const signature = request.headers.get("x-razorpay-signature");
  const eventId = request.headers.get("x-razorpay-event-id");

  if (!signature || !eventId || eventId.length > 255) {
    return Response.json({ error: "missing_or_invalid_webhook_headers" }, { status: 400 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (contentLength > 1024 * 1024) {
    return Response.json({ error: "payload_too_large" }, { status: 413 });
  }

  const rawBody = await request.text();

  if (Buffer.byteLength(rawBody, "utf8") > 1024 * 1024) {
    return Response.json({ error: "payload_too_large" }, { status: 413 });
  }

  if (!verifySignature(rawBody, signature, secret)) {
    return Response.json({ error: "invalid_signature" }, { status: 401 });
  }

  let body: JsonObject;

  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (!isObject(parsed)) throw new Error("Invalid JSON object");
    body = parsed;
  } catch {
    return Response.json({ error: "invalid_payload" }, { status: 400 });
  }

  const eventType = stringOrNull(body.event);
  const eventCreatedAt = numberOrNull(body.created_at);
  const payload = isObject(body.payload) ? body.payload : null;

  if (!eventType || !eventCreatedAt || !payload) {
    return Response.json({ error: "invalid_event_payload" }, { status: 400 });
  }

  const subscription = nestedEntity(payload, "subscription");
  const payment = nestedEntity(payload, "payment");
  const invoice = nestedEntity(payload, "invoice");

  try {
    await withClient(async (client) => {
      await client.query("BEGIN");

      try {
        // Deduplication and event effects are committed atomically.
        const inserted = await client.query<{ id: string }>(
          `INSERT INTO razorpay_webhook_events (event_id, event_type)
           VALUES ($1, $2)
           ON CONFLICT (event_id) DO NOTHING
           RETURNING id`,
          [eventId, eventType],
        );

        if (inserted.rows.length === 0) {
          await client.query("COMMIT");
          return;
        }

        let localSubscriptionId: string | null = null;
        let localUserId: string | null = null;

        if (SUBSCRIPTION_EVENTS.has(eventType)) {
          const razorpaySubscriptionId = stringOrNull(subscription?.id);
          const status = stringOrNull(subscription?.status);

          if (
            !razorpaySubscriptionId ||
            !status ||
            !SUBSCRIPTION_STATUSES.has(status) ||
            !subscription
          ) {
            throw new Error("Invalid subscription event entity");
          }

          const updated = await client.query<{
            id: string;
            user_id: string;
          }>(
            `UPDATE subscriptions
                SET status = $2,
                    current_start = COALESCE(
                      CASE WHEN $3::double precision IS NULL
                        THEN NULL ELSE to_timestamp($3::double precision) END,
                      current_start
                    ),
                    current_end = COALESCE(
                      CASE WHEN $4::double precision IS NULL
                        THEN NULL ELSE to_timestamp($4::double precision) END,
                      current_end
                    ),
                    charge_at = COALESCE(
                      CASE WHEN $5::double precision IS NULL
                        THEN NULL ELSE to_timestamp($5::double precision) END,
                      charge_at
                    ),
                    ended_at = COALESCE(
                      CASE WHEN $6::double precision IS NULL
                        THEN NULL ELSE to_timestamp($6::double precision) END,
                      ended_at
                    ),
                    cancel_at_cycle_end = COALESCE($7::boolean, cancel_at_cycle_end),
                    last_event_created_at = $8,
                    updated_at = now()
              WHERE razorpay_subscription_id = $1
                AND (
                  last_event_created_at IS NULL
                  OR last_event_created_at <= $8
                )
              RETURNING id, user_id`,
            [
              razorpaySubscriptionId,
              status,
              numberOrNull(subscription.current_start),
              numberOrNull(subscription.current_end),
              numberOrNull(subscription.charge_at),
              numberOrNull(subscription.ended_at),
              typeof subscription.cancel_at_cycle_end === "boolean"
                ? subscription.cancel_at_cycle_end
                : null,
              eventCreatedAt,
            ],
          );

          if (updated.rows[0]) {
            localSubscriptionId = updated.rows[0].id;
            localUserId = updated.rows[0].user_id;
          } else {
            // A stale event must not overwrite newer state, but its payment
            // can still be recorded against the existing subscription.
            const existing = await client.query<{
              id: string;
              user_id: string;
            }>(
              `SELECT id, user_id
                 FROM subscriptions
                WHERE razorpay_subscription_id = $1`,
              [razorpaySubscriptionId],
            );

            localSubscriptionId = existing.rows[0]?.id ?? null;
            localUserId = existing.rows[0]?.user_id ?? null;
          }

          if (!localSubscriptionId || !localUserId) {
            throw new Error("Webhook references an unknown subscription");
          }
        }

        // A failed payment can be associated through payment.subscription_id.
        if (eventType === "payment.failed") {
          const razorpaySubscriptionId = stringOrNull(payment?.subscription_id);

          if (razorpaySubscriptionId) {
            const existing = await client.query<{
              id: string;
              user_id: string;
            }>(
              `SELECT id, user_id
                 FROM subscriptions
                WHERE razorpay_subscription_id = $1`,
              [razorpaySubscriptionId],
            );

            localSubscriptionId = existing.rows[0]?.id ?? null;
            localUserId = existing.rows[0]?.user_id ?? null;

            if (!localSubscriptionId || !localUserId) {
              throw new Error("Failed payment references an unknown subscription");
            }
          }
        }

        // Record successful subscription charges.
        if (eventType === "subscription.charged") {
          if (!payment || !localUserId || !localSubscriptionId) {
            throw new Error("Charged event is missing its payment or subscription");
          }

          const paymentId = stringOrNull(payment.id);
          const amount = numberOrNull(payment.amount);

          if (!paymentId || amount === null) {
            throw new Error("Charged event contains invalid payment details");
          }

          await client.query(
            `INSERT INTO payments (
               user_id,
               subscription_id,
               razorpay_payment_id,
               razorpay_invoice_id,
               amount,
               currency,
               status,
               method,
               captured_at
             )
             VALUES (
               $1, $2, $3, $4, $5, $6, $7, $8,
               CASE WHEN $9::double precision IS NULL
                 THEN now() ELSE to_timestamp($9::double precision) END
             )
             ON CONFLICT (razorpay_payment_id) DO NOTHING`,
            [
              localUserId,
              localSubscriptionId,
              paymentId,
              stringOrNull(invoice?.id) ?? stringOrNull(payment.invoice_id),
              amount,
              stringOrNull(payment.currency) ?? "INR",
              stringOrNull(payment.status) ?? "captured",
              stringOrNull(payment.method),
              numberOrNull(payment.created_at),
            ],
          );
        }

        // Record failed subscription payment attempts without changing
        // subscription entitlement or status.
        if (eventType === "payment.failed" && payment && localUserId) {
          const paymentId = stringOrNull(payment.id);
          const amount = numberOrNull(payment.amount);

          if (paymentId && amount !== null) {
            await client.query(
              `INSERT INTO payments (
                 user_id,
                 subscription_id,
                 razorpay_payment_id,
                 razorpay_invoice_id,
                 amount,
                 currency,
                 status,
                 method,
                 captured_at
               )
               VALUES ($1, $2, $3, $4, $5, $6, 'failed', $7, NULL)
               ON CONFLICT (razorpay_payment_id) DO NOTHING`,
              [
                localUserId,
                localSubscriptionId,
                paymentId,
                stringOrNull(invoice?.id) ?? stringOrNull(payment.invoice_id),
                amount,
                stringOrNull(payment.currency) ?? "INR",
                stringOrNull(payment.method),
              ],
            );
          }
        }

        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      }
    });

    return Response.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook processing failed:", error);
    return Response.json({ error: "webhook_processing_failed" }, { status: 500 });
  }
}
