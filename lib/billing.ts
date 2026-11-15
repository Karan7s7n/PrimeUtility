import "server-only";

import type { PoolClient } from "pg";

export interface CapturedBillingPayment {
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  method?: string | null;
  capturedAt?: Date | null;
}

export interface BillingActivationResult {
  plan: "pro" | "business";
  alreadyActivated: boolean;
  accessStartsAt: Date;
  accessExpiresAt: Date;
}

interface BillingOrderRow {
  id: string | number;
  user_id: string | number;
  plan: "pro" | "business";
  amount: string | number;
  currency: string;
  status: "created" | "paid" | "failed";
  access_starts_at: Date | null;
  access_expires_at: Date | null;
}

interface ExistingPaymentRow {
  id: string | number;
  billing_order_id: string | number | null;
}

/**
 * Activates a captured one-time recharge.
 *
 * IMPORTANT:
 * Call this inside an existing database transaction.
 * The order and user are locked so concurrent webhook/verification requests
 * cannot grant the same payment twice or calculate overlapping access periods.
 */
export async function activateBillingOrder(
  client: PoolClient,
  payment: CapturedBillingPayment,
): Promise<BillingActivationResult> {
  if (
    !payment.orderId ||
    !payment.paymentId ||
    !Number.isSafeInteger(payment.amount) ||
    payment.amount <= 0 ||
    !payment.currency
  ) {
    throw new Error("Invalid captured payment details");
  }

  const orderResult = await client.query<BillingOrderRow>(
    `SELECT id, user_id, plan, amount, currency, status,
            access_starts_at, access_expires_at
       FROM billing_orders
      WHERE razorpay_order_id = $1
      FOR UPDATE`,
    [payment.orderId],
  );

  const order = orderResult.rows[0];

  if (!order) {
    throw new Error("Billing order not found");
  }

  if (Number(order.amount) !== payment.amount || order.currency !== payment.currency) {
    throw new Error("Payment amount or currency does not match the billing order");
  }

  // A repeated webhook or verification request must never extend access again.
  if (order.status === "paid") {
    const existing = await client.query<ExistingPaymentRow>(
      `SELECT id, billing_order_id
         FROM payments
        WHERE razorpay_payment_id = $1`,
      [payment.paymentId],
    );

    if (String(existing.rows[0]?.billing_order_id) !== String(order.id)) {
      throw new Error("Billing order was already activated with another payment");
    }

    if (!order.access_starts_at || !order.access_expires_at) {
      throw new Error("Activated billing order is missing its access dates");
    }

    return {
      plan: order.plan,
      alreadyActivated: true,
      accessStartsAt: order.access_starts_at,
      accessExpiresAt: order.access_expires_at,
    };
  }

  if (order.status !== "created") {
    throw new Error("Billing order is not eligible for activation");
  }

  // Serialize different recharge orders belonging to the same user.
  await client.query(
    "SELECT id FROM users WHERE id = $1 FOR UPDATE",
    [order.user_id],
  );

  const existingPayment = await client.query<ExistingPaymentRow>(
    `SELECT id, billing_order_id
       FROM payments
      WHERE razorpay_payment_id = $1`,
    [payment.paymentId],
  );

  if (existingPayment.rows.length > 0) {
    throw new Error("This Razorpay payment has already been recorded");
  }

  // Extend from the latest unexpired paid period, including legacy subscriptions.
  const accessResult = await client.query<{
    access_starts_at: Date;
    access_expires_at: Date;
  }>(
    `WITH current_access AS (
       SELECT current_end AS expires_at
         FROM subscriptions
        WHERE user_id = $1
          AND status = 'active'
          AND current_end > now()

       UNION ALL

       SELECT access_expires_at AS expires_at
         FROM billing_orders
        WHERE user_id = $1
          AND status = 'paid'
          AND access_expires_at > now()
     )
     SELECT
       GREATEST(now(), COALESCE(MAX(expires_at), now())) AS access_starts_at,
       GREATEST(now(), COALESCE(MAX(expires_at), now()))
         + INTERVAL '30 days' AS access_expires_at
       FROM current_access`,
    [order.user_id],
  );

  const access = accessResult.rows[0];

  if (!access) {
    throw new Error("Could not calculate recharge access period");
  }

  // Record the captured payment before marking the order as paid.
  await client.query(
    `INSERT INTO payments (
       user_id,
       subscription_id,
       billing_order_id,
       razorpay_payment_id,
       amount,
       currency,
       status,
       method,
       captured_at
     )
     VALUES ($1, NULL, $2, $3, $4, $5, 'captured', $6, $7)`,
    [
      order.user_id,
      order.id,
      payment.paymentId,
      payment.amount,
      payment.currency,
      payment.method ?? null,
      payment.capturedAt ?? new Date(),
    ],
  );

  const updateResult = await client.query(
    `UPDATE billing_orders
        SET status = 'paid',
            paid_at = COALESCE($2, now()),
            access_starts_at = $3,
            access_expires_at = $4,
            updated_at = now()
      WHERE id = $1
        AND status = 'created'`,
    [
      order.id,
      payment.capturedAt ?? null,
      access.access_starts_at,
      access.access_expires_at,
    ],
  );

  if (updateResult.rowCount !== 1) {
    throw new Error("Billing order activation could not be completed");
  }

  return {
    plan: order.plan,
    alreadyActivated: false,
    accessStartsAt: access.access_starts_at,
    accessExpiresAt: access.access_expires_at,
  };
}
