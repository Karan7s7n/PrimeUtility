
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  json,
  readJson,
  jsonReadError,
  resolveScope,
} from "@/lib/api";
import { withClient } from "@/lib/db";
import { activateBillingOrder } from "@/lib/billing";
import { getRazorpay } from "@/lib/razorpay";
import { RATE_LIMITS, enforceUserRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface VerifyPaymentBody {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

function verifyCheckoutSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): boolean {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;

  const expected = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest();

  const received = Buffer.from(signature, "hex");

  return received.length === expected.length &&
    timingSafeEqual(expected, received);
}

export async function POST(request: Request) {
  try {
    const scope = await resolveScope();

    if (!scope?.user) {
      return json({ error: "unauthorized" }, 401);
    }

    const rateLimit = await enforceUserRateLimit(
      RATE_LIMITS.billingVerify,
      request,
      scope.user.id,
    );
    if (rateLimit) return rateLimit;

    const body = await readJson<VerifyPaymentBody>(request);

    if (!body.ok) {
      return jsonReadError(body.error);
    }

    const orderId = body.data.razorpay_order_id;
    const paymentId = body.data.razorpay_payment_id;
    const signature = body.data.razorpay_signature;

    if (
      typeof orderId !== "string" ||
      typeof paymentId !== "string" ||
      typeof signature !== "string" ||
      !orderId ||
      !paymentId ||
      !signature ||
      orderId.length > 100 ||
      paymentId.length > 100 ||
      signature.length > 128
    ) {
      return json({ error: "invalid_payment_details" }, 400);
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      throw new Error("Razorpay test credentials are not configured");
    }

    if (!verifyCheckoutSignature(orderId, paymentId, signature, keySecret)) {
      return json({ error: "invalid_payment_signature" }, 400);
    }

    const { client: razorpay } = getRazorpay();

    // Never trust the browser callback alone. Fetch payment status from Razorpay.
    const payment = await razorpay.payments.fetch(paymentId);

    if (
      payment.order_id !== orderId ||
      payment.status !== "captured"
    ) {
      return json({ error: "payment_not_captured" }, 409);
    }

    return await withClient(async (client) => {
      await client.query("BEGIN");

      try {
        const ownedOrder = await client.query<{
          user_id: string | number;
          amount: string | number;
          currency: string;
        }>(
          `SELECT user_id, amount, currency
             FROM billing_orders
            WHERE razorpay_order_id = $1
            FOR UPDATE`,
          [orderId],
        );

        const order = ownedOrder.rows[0];

        if (!order || String(order.user_id) !== String(scope.user!.id)) {
          await client.query("ROLLBACK");
          return json({ error: "billing_order_not_found" }, 404);
        }

        if (
          Number(payment.amount) !== Number(order.amount) ||
          payment.currency !== order.currency
        ) {
          await client.query("ROLLBACK");
          return json({ error: "payment_amount_mismatch" }, 400);
        }

        const result = await activateBillingOrder(client, {
          orderId,
          paymentId,
          amount: Number(payment.amount),
          currency: payment.currency,
          method: payment.method ?? null,
          capturedAt: payment.created_at
            ? new Date(payment.created_at * 1000)
            : new Date(),
        });

        await client.query("COMMIT");

        return json({
          success: true,
          plan: result.plan,
          alreadyActivated: result.alreadyActivated,
          accessStartsAt: result.accessStartsAt,
          accessExpiresAt: result.accessExpiresAt,
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    });
  } catch (error) {
    console.error("Payment verification failed:", error);

    return json({ error: "payment_verification_failed" }, 500);
  }
}
