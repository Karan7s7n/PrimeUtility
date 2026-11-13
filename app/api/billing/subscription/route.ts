import {
  BILLING_PLANS,
  getRazorpay,
  type BillingPlanId,
} from "@/lib/razorpay";
import { json, readJson, jsonReadError, resolveScope } from "@/lib/api";
import { one, query } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RequestBody {
  plan?: string;
}

interface ExistingSubscription {
  plan: BillingPlanId;
  razorpay_subscription_id: string;
  razorpay_plan_id: string;
}

export async function POST(request: Request) {
  try {
    const scope = await resolveScope();

    if (!scope) {
      return json({ error: "database_unavailable" }, 503);
    }

    if (!scope.user) {
      return json({ error: "authentication_required" }, 401);
    }

    const body = await readJson<RequestBody>(request);

    if (!body.ok) {
      return jsonReadError(body.error);
    }

    const plan = body.data.plan;

    if (plan !== "pro" && plan !== "business") {
      return json({ error: "invalid_plan" }, 400);
    }

    const planId: BillingPlanId = plan;
    const selectedPlan = BILLING_PLANS[planId];

    const active = await one<{ id: string }>(
      `SELECT id
         FROM subscriptions
        WHERE user_id = $1
          AND status = 'active'
          AND current_end > now()
        LIMIT 1`,
      [scope.user.id],
    );

    if (active) {
      return json({ error: "active_subscription_exists" }, 409);
    }

    const existing = await one<ExistingSubscription>(
      `SELECT plan, razorpay_subscription_id, razorpay_plan_id
         FROM subscriptions
        WHERE user_id = $1
          AND plan = $2
          AND razorpay_plan_id = $3
          AND status IN ('created', 'authenticated')
        ORDER BY created_at DESC
        LIMIT 1`,
      [scope.user.id, planId, selectedPlan.razorpayPlanId],
    );

    const { client, keyId } = getRazorpay();

    if (existing) {
      return json({
        ok: true,
        keyId,
        subscriptionId: existing.razorpay_subscription_id,
        plan: planId,
        name: selectedPlan.name,
        amount: selectedPlan.amount,
        currency: selectedPlan.currency,
      });
    }

    const subscription = await client.subscriptions.create({
      plan_id: selectedPlan.razorpayPlanId,
      total_count: 1200,
      quantity: 1,
      customer_notify: true,
      notes: {
        user_id: String(scope.user.id),
        plan: planId,
      },
    });

    await query(
      `INSERT INTO subscriptions (
         user_id,
         plan,
         razorpay_subscription_id,
         razorpay_plan_id,
         status,
         current_start,
         current_end,
         charge_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        scope.user.id,
        planId,
        subscription.id,
        selectedPlan.razorpayPlanId,
        subscription.status,
        subscription.current_start
          ? new Date(subscription.current_start * 1000)
          : null,
        subscription.current_end
          ? new Date(subscription.current_end * 1000)
          : null,
        subscription.charge_at
          ? new Date(subscription.charge_at * 1000)
          : null,
      ],
    );

    return json({
      ok: true,
      keyId,
      subscriptionId: subscription.id,
      plan: planId,
      name: selectedPlan.name,
      amount: selectedPlan.amount,
      currency: selectedPlan.currency,
    });
  } catch (error) {
    console.error("Subscription creation failed:", error);

    return json(
      { error: "subscription_creation_failed" },
      500,
    );
  }
}
