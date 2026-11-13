import "server-only";
import Razorpay from "razorpay";

export const BILLING_PLANS = {
  pro: {
    name: "Pro",
    amount: 29900,
    currency: "INR",
    razorpayPlanId: "plan_TzYXYGUQI8sNFA",
  },
  business: {
    name: "Business",
    amount: 99900,
    currency: "INR",
    razorpayPlanId: "plan_TzYYFikVOul0mT",
  },
} as const;

export type BillingPlanId = keyof typeof BILLING_PLANS;

export function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay test credentials are not configured");
  }

  return {
    keyId,
    client: new Razorpay({ key_id: keyId, key_secret: keySecret }),
  };
}
