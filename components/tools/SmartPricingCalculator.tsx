"use client";

import { Calculator, Info, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Field, LimitNotice, Notice, Segmented, Stat } from "@/components/tools/ui";
import { useRunTracker } from "@/lib/session";
import type { Locale } from "@/lib/site";

const currencies = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "SAR", symbol: "ر.س" },
  { code: "AED", symbol: "د.إ" },
  { code: "EGP", symbol: "ج.م" },
  { code: "KWD", symbol: "د.ك" },
  { code: "MAD", symbol: "د.م" },
];

type ProfitMode = "margin" | "markup";
type Rounding = "exact" | "half" | "one" | "five";

const roundUp = (value: number, rounding: Rounding) => {
  if (rounding === "exact") return value;
  const step = rounding === "half" ? 0.5 : rounding === "one" ? 1 : 5;
  return Math.ceil(value / step) * step;
};

export function SmartPricingCalculator({ locale }: { locale: Locale }) {
  const [currency, setCurrency] = useState(currencies[0]);
  const [purchase, setPurchase] = useState("40");
  const [shipping, setShipping] = useState("6");
  const [customs, setCustoms] = useState("3");
  const [packaging, setPackaging] = useState("1.5");
  const [other, setOther] = useState("0");
  const [batchCost, setBatchCost] = useState("0");
  const [quantity, setQuantity] = useState("50");
  const [commission, setCommission] = useState("15");
  const [tax, setTax] = useState("0");
  const [mode, setMode] = useState<ProfitMode>("margin");
  const [target, setTarget] = useState("25");
  const [fixedMonthly, setFixedMonthly] = useState("0");
  const [rounding, setRounding] = useState<Rounding>("exact");
  const { trackOnce, limitReached } = useRunTracker("smart-pricing-calculator");

  // Counts one run per page view, once the visitor actually changes something.
  const touched =
    purchase !== "40" || shipping !== "6" || customs !== "3" || packaging !== "1.5" || commission !== "15" || target !== "25";

  useEffect(() => {
    if (touched) void trackOnce();
  }, [touched, trackOnce]);

  const n = (value: string) => {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const model = useMemo(() => {
    const qty = Math.max(1, n(quantity));
    const unitCost = n(purchase) + n(shipping) + n(customs) + n(packaging) + n(other) + n(batchCost) / qty;
    const commissionRate = Math.min(0.95, Math.max(0, n(commission) / 100));
    const taxRate = Math.min(0.95, Math.max(0, n(tax) / 100));
    const takeRate = commissionRate + taxRate;
    const targetRate = Math.max(0, n(target) / 100);

    const floor = takeRate < 1 ? unitCost / (1 - takeRate) : Number.POSITIVE_INFINITY;

    let exactPrice = Number.NaN;
    if (mode === "margin") {
      const denominator = 1 - takeRate - targetRate;
      exactPrice = denominator > 0 ? unitCost / denominator : Number.POSITIVE_INFINITY;
    } else {
      exactPrice = takeRate < 1 ? (unitCost * (1 + targetRate)) / (1 - takeRate) : Number.POSITIVE_INFINITY;
    }

    const price = Number.isFinite(exactPrice) ? roundUp(exactPrice, rounding) : Number.POSITIVE_INFINITY;
    const platformFee = Number.isFinite(price) ? price * commissionRate : 0;
    const taxes = Number.isFinite(price) ? price * taxRate : 0;
    const profit = Number.isFinite(price) ? price - platformFee - taxes - unitCost : 0;
    const margin = Number.isFinite(price) && price > 0 ? (profit / price) * 100 : 0;
    const markup = unitCost > 0 ? (profit / unitCost) * 100 : 0;
    const breakEven = profit > 0 ? Math.ceil(n(fixedMonthly) / profit) : Number.POSITIVE_INFINITY;

    return {
      unitCost,
      floor,
      price,
      platformFee,
      taxes,
      profit,
      margin,
      markup,
      breakEven,
      impossible: !Number.isFinite(price),
    };
  }, [purchase, shipping, customs, packaging, other, batchCost, quantity, commission, tax, mode, target, rounding, fixedMonthly]);

  const money = (value: number) =>
    Number.isFinite(value)
      ? `${currency.symbol} ${value.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : "—";

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <Calculator className="size-4 text-brand-600 dark:text-brand-300" />
            {locale === "ar" ? "التكاليف لكل وحدة" : "Cost per unit"}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={locale === "ar" ? "سعر الشراء" : "Purchase price"} id="purchase">
              <input id="purchase" type="number" min="0" step="0.01" className="input" value={purchase} onChange={(e) => setPurchase(e.target.value)} />
            </Field>
            <Field label={locale === "ar" ? "الشحن للوحدة" : "Shipping per unit"} id="shipping">
              <input id="shipping" type="number" min="0" step="0.01" className="input" value={shipping} onChange={(e) => setShipping(e.target.value)} />
            </Field>
            <Field label={locale === "ar" ? "الجمارك والرسوم" : "Customs & duties"} id="customs">
              <input id="customs" type="number" min="0" step="0.01" className="input" value={customs} onChange={(e) => setCustoms(e.target.value)} />
            </Field>
            <Field label={locale === "ar" ? "التغليف" : "Packaging"} id="packaging">
              <input id="packaging" type="number" min="0" step="0.01" className="input" value={packaging} onChange={(e) => setPackaging(e.target.value)} />
            </Field>
            <Field label={locale === "ar" ? "مصاريف أخرى للوحدة" : "Other cost per unit"} id="other">
              <input id="other" type="number" min="0" step="0.01" className="input" value={other} onChange={(e) => setOther(e.target.value)} />
            </Field>
            <Field
              label={locale === "ar" ? "تكلفة ثابتة للدفعة" : "Fixed cost per batch"}
              id="batchCost"
              hint={locale === "ar" ? "تخليص، نقل، رسوم تُقسَّم على الكمية" : "Clearance, freight or fees split across the batch"}
            >
              <input id="batchCost" type="number" min="0" step="0.01" className="input" value={batchCost} onChange={(e) => setBatchCost(e.target.value)} />
            </Field>
            <Field label={locale === "ar" ? "عدد الوحدات في الدفعة" : "Units in the batch"} id="quantity">
              <input id="quantity" type="number" min="1" step="1" className="input" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </Field>
            <Field label={locale === "ar" ? "العملة" : "Currency"} id="currency">
              <select
                id="currency"
                className="input"
                value={currency.code}
                onChange={(e) => setCurrency(currencies.find((c) => c.code === e.target.value) ?? currencies[0])}
              >
                {currencies.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.code} ({item.symbol})
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="panel space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <TrendingUp className="size-4 text-brand-600 dark:text-brand-300" />
            {locale === "ar" ? "نسب البيع والربح" : "Sale rates and target profit"}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={locale === "ar" ? "عمولة المنصة %" : "Platform commission %"}
              id="commission"
              hint={locale === "ar" ? "نسبة من سعر البيع" : "Percentage of the sale price"}
            >
              <input id="commission" type="number" min="0" max="95" step="0.1" className="input" value={commission} onChange={(e) => setCommission(e.target.value)} />
            </Field>
            <Field label={locale === "ar" ? "الضريبة على البيع %" : "Tax on the sale %"} id="tax">
              <input id="tax" type="number" min="0" max="95" step="0.1" className="input" value={tax} onChange={(e) => setTax(e.target.value)} />
            </Field>
          </div>

          <div>
            <p className="label">{locale === "ar" ? "طريقة تحديد الربح" : "How you set the profit"}</p>
            <Segmented
              label={locale === "ar" ? "طريقة تحديد الربح" : "How you set the profit"}
              value={mode}
              onChange={setMode}
              options={[
                { value: "margin", label: locale === "ar" ? "هامش من سعر البيع" : "Margin on sale price" },
                { value: "markup", label: locale === "ar" ? "زيادة على التكلفة" : "Markup on cost" },
              ]}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={mode === "margin" ? (locale === "ar" ? "الهامش المطلوب %" : "Target margin %") : locale === "ar" ? "الزيادة المطلوبة %" : "Target markup %"}
              id="target"
            >
              <input id="target" type="number" min="0" step="0.5" className="input" value={target} onChange={(e) => setTarget(e.target.value)} />
            </Field>
            <Field
              label={locale === "ar" ? "مصاريف ثابتة شهريًا" : "Fixed monthly costs"}
              id="fixed"
              hint={locale === "ar" ? "اشتراك متجر، إعلانات… لحساب نقطة التعادل" : "Store fee, ads… used for break-even"}
            >
              <input id="fixed" type="number" min="0" step="1" className="input" value={fixedMonthly} onChange={(e) => setFixedMonthly(e.target.value)} />
            </Field>
          </div>

          <div>
            <p className="label">{locale === "ar" ? "تقريب السعر" : "Round the price"}</p>
            <Segmented
              label={locale === "ar" ? "تقريب السعر" : "Round the price"}
              value={rounding}
              onChange={setRounding}
              options={[
                { value: "exact", label: locale === "ar" ? "دقيق" : "Exact" },
                { value: "half", label: "0.5" },
                { value: "one", label: "1" },
                { value: "five", label: "5" },
              ]}
            />
          </div>
        </div>
      </div>

      {model.impossible ? (
        <Notice tone="error">
          {locale === "ar"
            ? "مجموع النسب (العمولة + الضريبة + الهامش المطلوب) يبلغ 100% أو أكثر، وهذا يعني أن لا سعر يحقق ربحًا. خفّض الهامش المطلوب أو راجع النسب."
            : "The rates add up to 100% or more (commission + tax + target), so no price can produce a profit. Lower the target or review the rates."}
        </Notice>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label={locale === "ar" ? "التكلفة الحقيقية للوحدة" : "Real cost per unit"}
              value={money(model.unitCost)}
              hint={locale === "ar" ? "تشمل كل التكاليف المباشرة" : "All direct costs included"}
            />
            <Stat
              label={locale === "ar" ? "سعر البيع المقترح" : "Suggested selling price"}
              value={money(model.price)}
              tone="brand"
              hint={rounding === "exact" ? undefined : locale === "ar" ? "مقرّب لأعلى" : "rounded up"}
            />
            <Stat
              label={locale === "ar" ? "الربح لكل وحدة" : "Profit per unit"}
              value={money(model.profit)}
              tone={model.profit > 0 ? "good" : "bad"}
            />
            <Stat
              label={locale === "ar" ? "أقل سعر مقبول" : "Break-even price"}
              value={money(model.floor)}
              hint={locale === "ar" ? "عنده يكون الربح صفرًا" : "profit is exactly zero here"}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={locale === "ar" ? "هامش الربح" : "Profit margin"} value={`${model.margin.toFixed(1)}%`} tone={model.margin > 0 ? "good" : "bad"} hint={locale === "ar" ? "من سعر البيع" : "of the sale price"} />
            <Stat label={locale === "ar" ? "معدل الزيادة (Markup)" : "Markup"} value={`${model.markup.toFixed(1)}%`} hint={locale === "ar" ? "من التكلفة" : "of the cost"} />
            <Stat label={locale === "ar" ? "عمولة المنصة" : "Platform commission"} value={money(model.platformFee)} />
            <Stat
              label={locale === "ar" ? "نقطة التعادل" : "Break-even point"}
              value={
                n(fixedMonthly) > 0 && Number.isFinite(model.breakEven)
                  ? locale === "ar"
                    ? `${model.breakEven} وحدة`
                    : `${model.breakEven} units`
                  : "—"
              }
              hint={
                n(fixedMonthly) > 0
                  ? locale === "ar"
                    ? "لتغطية المصاريف الثابتة"
                    : "to cover fixed monthly costs"
                  : locale === "ar"
                    ? "أدخل مصاريف ثابتة"
                    : "add fixed costs to see it"
              }
            />
          </div>

          <div className="panel">
            <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {locale === "ar" ? "توزيع سعر البيع" : "Where the sale price goes"}
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: locale === "ar" ? "تكاليف مباشرة" : "Direct costs", value: model.unitCost },
                { label: locale === "ar" ? "عمولة المنصة" : "Platform commission", value: model.platformFee },
                { label: locale === "ar" ? "الضريبة" : "Tax", value: model.taxes },
                { label: locale === "ar" ? "ربحك" : "Your profit", value: model.profit },
              ].map((row) => {
                const share = model.price > 0 ? (row.value / model.price) * 100 : 0;
                return (
                  <li key={row.label}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="text-slate-600 dark:text-slate-300">{row.label}</span>
                      <span className="font-semibold text-slate-900 tabular-nums dark:text-white">
                        {money(row.value)} · {share.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                        style={{ width: `${Math.max(0, Math.min(100, share))}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      {limitReached !== null && <LimitNotice locale={locale} limit={limitReached} />}

      <Notice tone="info">
        <p className="flex items-start gap-2">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            {locale === "ar"
              ? "الهامش هو الربح كنسبة من سعر البيع، والزيادة هي الربح كنسبة من التكلفة. هامش 25% يعادل زيادة 33% — استخدم الطريقة التي يتفق بها حسابك أو تقارير منصتك، ولا تخلط بينهما."
              : "Margin is profit as a share of the sale price; markup is profit as a share of cost. A 25% margin equals a 33% markup — pick the one your accounting or marketplace reports use and stay consistent."}
          </span>
        </p>
      </Notice>
    </div>
  );
}
