"use client";

import { Loader2, LockKeyhole, Sparkles } from "lucide-react";
import { useState } from "react";
import Script from "next/script";
import { useSession, refreshSession } from "@/lib/session";
import type { Locale } from "@/lib/site";
import { href } from "@/lib/urls";

type PaidPlan = "pro" | "business";

interface CheckoutResponse {
  keyId: string;
  orderId: string;
  plan: {
    id: PaidPlan;
    name: string;
    amount: number;
    currency: string;
    durationDays: number;
  };
}

interface RazorpayCheckoutResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
  };
  theme?: { color: string };
  handler: (response: RazorpayCheckoutResult) => void;
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

export function PricingPlanAction({
  locale,
  plan,
  cta,
}: {
  locale: Locale;
  plan: PaidPlan;
  cta: string;
}) {
  const { user, status } = useSession();
  const [busy, setBusy] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "info">("info");

  const isArabic = locale === "ar";

  const startCheckout = async () => {
    setMessage("");

    if (status === "loading") {
      setMessage(isArabic ? "جارٍ التحقق من الحساب..." : "Checking your account...");
      return;
    }

    if (status === "error") {
      setMessage(isArabic ? "تعذر التحقق من جلستك. حاول مرة أخرى." : "Could not verify your session. Please try again.");
      setMessageType("error");
      return;
    }

    if (!user) {
      const next = `${href(locale, "pricing")}?plan=${plan}`;
      window.location.assign(`${href(locale, "login")}?next=${encodeURIComponent(next)}`);
      return;
    }

    if (!scriptReady || !window.Razorpay) {
      setMessage(isArabic ? "بوابة الدفع لم تُحمّل بعد. حدّث الصفحة وحاول مجددًا." : "Checkout has not loaded yet. Refresh the page and try again.");
      setMessageType("error");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/billing/orders/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = (await response.json()) as Partial<CheckoutResponse> & {
        error?: string;
      };

      if (!response.ok) {
        if (data.error === "unauthorized") {
          const next = `${href(locale, "pricing")}?plan=${plan}`;
          window.location.assign(
            `${href(locale, "login")}?next=${encodeURIComponent(next)}`,
          );
          setBusy(false);
          return;
        }

        throw new Error(data.error ?? "billing_order_creation_failed");
      }

      if (
        !data.keyId ||
        !data.orderId ||
        !data.plan ||
        data.plan.id !== plan ||
        !data.plan.amount ||
        !data.plan.currency
      ) {
        throw new Error("invalid_checkout_response");
      }

      const checkoutPlan = data.plan;

      const checkout = new window.Razorpay({
        key: data.keyId,
        order_id: data.orderId,
        amount: data.plan.amount,
        currency: data.plan.currency,
        name: "PrimeUtility",
        description: `${data.plan.name} — 30-day recharge`,
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: "#b51c00" },
        handler: async (paymentResult) => {
          setMessage(
            isArabic
              ? "جارٍ التحقق من الدفع وتفعيل الرصيد..."
              : "Verifying payment and activating your recharge...",
          );
          setMessageType("info");

          try {
            const verification = await fetch("/api/billing/verify/", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(paymentResult),
            });

            const verificationData = (await verification.json()) as {
              success?: boolean;
              plan?: PaidPlan;
              error?: string;
            };

            if (!verification.ok || !verificationData.success) {
              throw new Error(
                verificationData.error ?? "payment_verification_failed",
              );
            }

            // The server has already activated the recharge.
            // Refresh the client session so the new plan appears immediately.
            try {
              await refreshSession();
            } catch {
              // The verified activation is saved; the user can refresh later.
            }

            setMessage(
              isArabic
                ? "تم تأكيد الدفع وتفعيل باقتك بنجاح لمدة 30 يومًا."
                : `${checkoutPlan.name} recharge successful! Your plan is active for 30 days.`,
            );
            setMessageType("info");
          } catch {
            setMessage(
              isArabic
                ? "تعذر تأكيد الدفع تلقائيًا. لا تحاول الدفع مرة أخرى الآن؛ تحقق من حسابك أو تواصل مع الدعم."
                : "We couldn't verify the payment automatically. Please don't pay again yet. Check your account or contact support.",
            );
            setMessageType("error");
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            setMessage(
              isArabic
                ? "أُغلقت نافذة الدفع. لم يتم تأكيد إعادة الشحن."
                : "Checkout was closed. Payment has not been confirmed.",
            );
            setMessageType("info");
            setBusy(false);
          },
        },
      });

      checkout.open();
    } catch {
      setMessage(
        isArabic
          ? "تعذر بدء عملية الدفع. حاول مرة أخرى."
          : "Could not start checkout. Please try again.",
      );
      setMessageType("error");
      setBusy(false);
    }
  };

  return (
    <div className="mt-6">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setScriptError(true)}
      />
      <button
        type="button"
        className="btn-primary w-full"
        onClick={startCheckout}
        disabled={busy || status === "loading" || !scriptReady}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        {busy
          ? isArabic ? "جارٍ التحضير..." : "Preparing checkout..."
          : !scriptReady
            ? isArabic ? "جارٍ تحميل الدفع..." : "Loading checkout..."
            : cta}
        <LockKeyhole className="ml-auto size-3.5 opacity-70" />
      </button>

      {scriptError && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">
          {isArabic ? "تعذر تحميل بوابة الدفع." : "Could not load the payment gateway."}
        </p>
      )}

      {message && (
        <p
          role="status"
          className={`mt-3 text-xs leading-5 ${
            messageType === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
