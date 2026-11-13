import {
  json,
  readJson,
  jsonReadError,
  resolveScope,
} from "@/lib/api";
import { one, query } from "@/lib/db";
import {
  BILLING_PLANS,
  getRazorpay,
  type BillingPlanId,
} from "@/lib/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateSubscriptionBody {
  plan?: string;
}

export async function POST(request: Request) {
  try {
    // Require an authenticated account.
    const scope = await resolveScope();

    if (!scope?.user) {
      return json({ error: "unauthorized" }, 401);
    }

    const body = await readJson<CreateSubscriptionBody>(request);

    if (!body.ok) {
      return jsonReadError(body.error);
    }

    const requestedPlan = body.data.plan;

    if (requestedPlan !== "pro" && requestedPlan !== "business") {
      return json({ error: "invalid_plan" }, 400);
    }

    const planId: BillingPlanId = requestedPlan;
    const plan = BILLING_PLANS[planId];

    // Avoid creating duplicate subscriptions for the same account.
    const existing = await one<{ id: number }>(
      `SELECT id
         FROM subscriptions
        WHERE user_id = $1
          AND (
            (
              status IN ('active', 'pending', 'halted')
              AND current_end > now()
            )
            OR (
              status IN ('created', 'authenticated')
              AND created_at > now() - interval '30 minutes'
            )
          )
        LIMIT 1`,
      [scope.user.id],
    );

    if (existing) {
      return json(
        { error: "existing_subscription", message: "An existing subscription is already being processed or is active." },
        409,
      );
    }

    const { keyId, client } = getRazorpay();

    // Price and Plan ID always come from server configuration.
    const subscription = await client.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      total_count: 120,
      customer_notify: 1,
      notes: {
        user_id: String(scope.user.id),
        plan: planId,
        product: "PrimeUtility",
      },
    });

    // Save the subscription before returning its ID to the browser.
    await query(
      `INSERT INTO subscriptions (
         user_id,
         plan,
         razorpay_subscription_id,
         razorpay_plan_id,
         status
       )
       VALUES ($1, $2, $3, $4, $5)`,
      [
        scope.user.id,
        planId,
        subscription.id,
        plan.razorpayPlanId,
        subscription.status,
      ],
    );

    return json({
      keyId,
      subscriptionId: subscription.id,
      plan: {
        id: planId,
        name: plan.name,
        amount: plan.amount,
        currency: plan.currency,
        billingCycles: 120,
      },
    });
  } catch (error) {
    console.error("Subscription creation failed:", error);

    return json(
      { error: "subscription_creation_failed" },
      500,
    );
  }
}
