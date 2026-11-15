
import {
  json,
  readJson,
  jsonReadError,
  resolveScope,
} from "@/lib/api";
import { query } from "@/lib/db";
import { RATE_LIMITS, enforceUserRateLimit } from "@/lib/ratelimit";
import {
  BILLING_PLANS,
  getRazorpay,
  type BillingPlanId,
} from "@/lib/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateOrderBody {
  plan?: string;
}

export async function POST(request: Request) {
  try {
    const scope = await resolveScope();

    if (!scope?.user) {
      return json({ error: "unauthorized" }, 401);
    }

    const rateLimit = await enforceUserRateLimit(
      RATE_LIMITS.billingOrder,
      request,
      scope.user.id,
    );
    if (rateLimit) return rateLimit;

    const body = await readJson<CreateOrderBody>(request);

    if (!body.ok) {
      return jsonReadError(body.error);
    }

    if (body.data.plan !== "pro" && body.data.plan !== "business") {
      return json({ error: "invalid_plan" }, 400);
    }

    const userId = scope.user.id;
    const planId: BillingPlanId = body.data.plan;
    const plan = BILLING_PLANS[planId];

    const { keyId, client: razorpay } = getRazorpay();

    // The amount and currency always come from server-side plan configuration.
    const receipt = `pu_${userId}_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount: plan.amount,
      currency: plan.currency,
      receipt,
      notes: {
        user_id: String(userId),
        plan: planId,
        product: "PrimeUtility",
        purchase_type: "one_time_recharge",
      },
    });

    if (
      !order.id ||
      order.amount !== plan.amount ||
      order.currency !== plan.currency
    ) {
      throw new Error("Razorpay returned an unexpected order");
    }

    await query(
      `INSERT INTO billing_orders (
         user_id,
         plan,
         razorpay_order_id,
         amount,
         currency,
         status
       )
       VALUES ($1, $2, $3, $4, $5, 'created')`,
      [
        userId,
        planId,
        order.id,
        plan.amount,
        plan.currency,
      ],
    );

    return json({
      keyId,
      orderId: order.id,
      plan: {
        id: planId,
        name: plan.name,
        amount: plan.amount,
        currency: plan.currency,
        durationDays: 30,
      },
    });
  } catch (error) {
    console.error("Billing order creation failed:", error);

    return json(
      { error: "billing_order_creation_failed" },
      500,
    );
  }
}
