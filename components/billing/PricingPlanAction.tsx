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
  subscriptionId: string;
  plan: {
    id: PaidPlan;
    name: string;
    amount: number;
    currency: string;
    billingCycles: number;
  };
}

interface RazorpayCheckoutResult {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  subscription_id: string;
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
      const response = await fetch("/api/billing/subscriptions/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = (await response.json()) as CheckoutResponse & {
        error?: string;
      };

      if (!response.ok) {
        if (data.error === "existing_subscription") {
          setMessage(
            isArabic
              ? "يوجد اشتراك قيد المعالجة أو اشتراك نشط بالفعل. تحقق من حسابك."
              : "An active or pending subscription already exists. Please check your account.",
          );
        } else if (data.error === "unauthorized") {
  const next = `${href(locale, "pricing")}?plan=${plan}`;
  window.location.assign(
    `${href(locale, "login")}?next=${encodeURIComponent(next)}`,
  );
} else {
          throw new Error(data.error ?? "subscription_creation_failed");
        }

        setMessageType("error");
        setBusy(false);
        return;
      }

      const checkout = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "PrimeUtility",
        description: `${data.plan.name} monthly subscription`,
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: "#b51c00" },
        handler: async () => {
          setMessage(
            isArabic
              ? "تم إرسال تأكيد الدفع. ننتظر تأكيد الاشتراك من بوابة الدفع."
              : "Payment authorization received. Waiting for subscription confirmation.",
          );
          setMessageType("info");

          try {
            for (let attempt = 0; attempt < 8; attempt++) {
              const updated = await refreshSession();

              if (updated.usage?.plan === plan) {
                setMessage(
                  isArabic
                    ? "تم تفعيل اشتراكك بنجاح."
                    : `${data.plan.name} is now active on your account.`,
                );
                setBusy(false);
                return;
              }

              if (attempt < 7) {
                await new Promise((resolve) => setTimeout(resolve, 1500));
              }
            }
          } catch {
            // The webhook remains authoritative; the account can be refreshed later.
          }

          setMessage(
            isArabic
              ? "تم استلام الدفع. قد يستغرق تفعيل الاشتراك بعض الوقت. تحقق من حسابك لاحقًا."
              : "Payment authorization was received. Activation may take a little longer. Please check your account shortly.",
          );
          setBusy(false);
        },
        modal: {
          ondismiss: () => {
            setMessage(
              isArabic
                ? "أُغلقت نافذة الدفع. لم يتم تأكيد تفعيل الاشتراك."
                : "Checkout was closed. Subscription activation has not been confirmed.",
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
          ? "تعذر بدء الاشتراك. حاول مرة أخرى."
          : "Could not start the subscription. Please try again.",
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
