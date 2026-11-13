import { CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { pricingCopy } from "@/lib/pages";
import { isLocale, site, type Locale } from "@/lib/site";
import { dictionaries } from "@/lib/i18n";
import { pageMetadata } from "@/lib/meta";
import { absoluteUrl, href } from "@/lib/urls";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const copy = pricingCopy[typed];
  return pageMetadata({
    locale: typed,
    path: "pricing",
    title: copy.title,
    description: copy.intro,
    keywords: typed === "ar" ? ["أسعار", "خطط", "اشتراك", "برو"] : ["pricing", "plans", "pro", "business plan"],
  });
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const copy = pricingCopy[typed];
  const dict = dictionaries[typed];

  return (
    <div className="container-x py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          inLanguage: typed,
          mainEntity: copy.faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
          ...(absoluteUrl(typed, "pricing") ? { url: absoluteUrl(typed, "pricing") } : {}),
        }}
      />

      <Breadcrumbs locale={typed} items={[{ label: copy.title }]} />

      <header className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{copy.title}</h1>
        <p className="mt-4 text-[15px] leading-7 text-slate-600 dark:text-slate-300">{copy.intro}</p>
      </header>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {copy.plans.map((plan) => (
          <div
            key={plan.name}
            className={`surface flex flex-col p-6 ${
              plan.available ? "ring-2 ring-brand-500/40" : "opacity-95"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h2>
              {!plan.available && (
                <span className="chip !py-0.5 text-[11px]">{typed === "ar" ? "قريبًا" : "Soon"}</span>
              )}
            </div>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{plan.tagline}</p>
            <p className="mt-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{plan.price}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{plan.period}</span>
            </p>
            <ul className="mt-5 flex-1 space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            {plan.available ? (
              <Link href={href(typed, "tools")} className="btn-primary mt-6">
                <Sparkles className="size-4" />
                {plan.cta}
              </Link>
            ) : (
              <span className="btn-secondary mt-6 cursor-not-allowed opacity-70">{plan.cta}</span>
            )}
          </div>
        ))}
      </div>

      <p className="mx-auto mt-6 max-w-2xl text-center text-[13px] leading-6 text-amber-700 dark:text-amber-300">
        {copy.notChargedNote}
      </p>

      <section className="mx-auto mt-14 max-w-3xl">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{copy.faqTitle}</h2>
        <div className="mt-4 space-y-3">
          {copy.faq.map((item) => (
            <details key={item.q} className="surface px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-800 dark:text-slate-100">
                {item.q}
              </summary>
              <p className="mt-2 text-[13.5px] leading-6 text-slate-600 dark:text-slate-400">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-12 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {typed === "ar"
            ? "هل لديك سؤال عن خطة مناسبة لحجم عملك؟"
            : "Not sure which plan fits your volume?"}{" "}
          <Link href={href(typed, "contact")} className="link">
            {dict.nav.contact}
          </Link>
        </p>
      </section>
    </div>
  );
}
