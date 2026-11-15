import "server-only";

import type { Locale } from "./site";
import { ensureSchema, one } from "./db";

export type PlanId = "guest" | "free" | "pro" | "business";

export interface PlanDefinition {
  id: PlanId;
  dailyLimit: number;
  name: Record<Locale, string>;
  note: Record<Locale, string>;
}

export const plans: Record<PlanId, PlanDefinition> = {
  guest: {
    id: "guest",
    dailyLimit: 5,
    name: { en: "Guest", ar: "زائر" },
    note: {
      en: "No account: a small daily allowance per browser.",
      ar: "بدون حساب: رصيد يومي صغير لكل متصفح.",
    },
  },
  free: {
    id: "free",
    dailyLimit: 40,
    name: { en: "Free account", ar: "حساب مجاني" },
    note: {
      en: "Signed in, with your own history and a higher daily allowance.",
      ar: "بحساب، مع سجل خاص بك ورصيد يومي أعلى.",
    },
  },
  pro: {
    id: "pro",
    dailyLimit: 2000,
    name: { en: "Pro", ar: "برو" },
    note: {
      en: "Heavy use, batch work and priority processing.",
      ar: "استخدام مكثّف ومعالجة بالدفعات وأولوية في التنفيذ.",
    },
  },
  business: {
    id: "business",
    dailyLimit: 10000,
    name: { en: "Business", ar: "الأعمال" },
    note: {
      en: "Teams, API keys and bulk processing.",
      ar: "فرق عمل ومفاتيح API ومعالجة بالجملة.",
    },
  },
};

const PLAN_IDS: PlanId[] = ["guest", "free", "pro", "business"];

/**
 * A user's plan is stored on the account. Roles such as `pro`/`business` from
 * the first release are still honoured so no existing account loses its limits.
 */
export const planForRole = (role?: string | null): PlanId => {
  if (role === "pro") return "pro";
  if (role === "business") return "business";
  return "free";
};

export const planForUser = (user: { role: string; plan?: string } | null): PlanId => {
  if (!user) return "guest";
  if (user.plan && PLAN_IDS.includes(user.plan as PlanId)) return user.plan as PlanId;
  return planForRole(user.role);
};

export const planCopy = (plan: PlanId, locale: Locale) => plans[plan].name[locale];

/**
 * Resolves the effective plan using server-side billing state.
 * Explicit admin assignments always take priority.
 * Legacy subscriptions and one-time recharges are both supported.
 */
export async function effectivePlanForUser(
  user: { id: number; role: string; plan?: string } | null,
): Promise<PlanId> {
  if (!user) return "guest";

  await ensureSchema();

  const override = await one<{ admin_plan_override: boolean }>(
    "SELECT admin_plan_override FROM users WHERE id = $1",
    [user.id],
  );

  if (override?.admin_plan_override) {
    return planForUser(user);
  }

  const paidAccess = await one<{ plan: "pro" | "business" }>(
    `SELECT plan
       FROM (
         SELECT plan, current_end AS expires_at, created_at
           FROM subscriptions
          WHERE user_id = $1
            AND status = 'active'
            AND current_end > now()

         UNION ALL

         SELECT plan, access_expires_at AS expires_at, created_at
           FROM billing_orders
          WHERE user_id = $1
  AND status = 'paid'
  AND access_starts_at <= now()
  AND access_expires_at > now()
       ) AS active_paid_access
      ORDER BY expires_at DESC, created_at DESC
      LIMIT 1`,
    [user.id],
  );

  return paidAccess?.plan ?? "free";
}
