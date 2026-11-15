export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Recurring subscriptions are no longer offered.
 * Historical subscriptions and webhook processing remain intact.
 */
export async function POST() {
  return Response.json(
    {
      error: "recurring_subscriptions_disabled",
      message: "Please use the one-time recharge plans.",
    },
    { status: 410 },
  );
}
