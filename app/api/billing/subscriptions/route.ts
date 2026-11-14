import {
  json,
  readJson,
  jsonReadError,
  resolveScope,
} from "@/lib/api";
import { withClient } from "@/lib/db";
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

interface ExistingSubscription {
  plan: BillingPlanId;
  razorpay_subscription_id: string;
  status: string;
}

export async function POST(request: Request) {
  try {
    const scope = await resolveScope();

    if (!scope?.user) {
      return json({ error: "unauthorized" }, 401);
    }

    const userId = scope.user.id;

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

    return await withClient(async (client) => {
      const lockKey = `primeutility-billing:${userId}`;

      await client.query(
        "SELECT pg_advisory_lock(hashtextextended($1, 0))",
        [lockKey],
      );

      try {
        const existing = await client.query<ExistingSubscription>(
          `SELECT plan, razorpay_subscription_id, status
             FROM subscriptions
            WHERE user_id = $1
              AND (
                (
                  status IN ('active', 'pending', 'halted')
                  AND (current_end IS NULL OR current_end > now())
                )
                OR (
                  status IN ('created', 'authenticated')
                  AND created_at > now() - interval '30 minutes'
                )
              )
            ORDER BY created_at DESC
            LIMIT 1`,
          [userId],
        );

        const current = existing.rows[0];

        if (current) {
          // Reuse a recently created subscription for the same plan.
          if (
            current.status === "created" &&
            current.plan === planId
          ) {
            const { keyId } = getRazorpay();

            return json({
              keyId,
              subscriptionId: current.razorpay_subscription_id,
              plan: {
                id: planId,
                name: plan.name,
                amount: plan.amount,
                currency: plan.currency,
                billingCycles: 120,
              },
            });
          }

          return json(
            {
              error: "existing_subscription",
              message:
                "An existing subscription is already being processed or is active.",
            },
            409,
          );
        }

        const { keyId, client: razorpay } = getRazorpay();

        const subscription = await razorpay.subscriptions.create({
          plan_id: plan.razorpayPlanId,
          total_count: 120,
          customer_notify: 1,
          notes: {
            user_id: String(userId),
            plan: planId,
            product: "PrimeUtility",
          },
        });

        await client.query(
          `INSERT INTO subscriptions (
             user_id,
             plan,
             razorpay_subscription_id,
             razorpay_plan_id,
             status
           )
           VALUES ($1, $2, $3, $4, $5)`,
          [
            userId,
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
      } finally {
        await client.query(
          "SELECT pg_advisory_unlock(hashtextextended($1, 0))",
          [lockKey],
        );
      }
    });
  } catch (error) {
    console.error("Subscription creation failed:", error);

    return json(
      { error: "subscription_creation_failed" },
      500,
    );
  }
}
