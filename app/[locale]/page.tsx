import { ArrowRight, CheckCircle2, Lock, Rocket, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { JsonLd } from "@/components/JsonLd";
import { ToolCard } from "@/components/ToolCard";
import { ToolSearch } from "@/components/ToolSearch";
import { categoryDescriptions, categoryNames, dictionaries } from "@/lib/i18n";
import { pageMetadata, siteJsonLd } from "@/lib/meta";
import { posts } from "@/lib/blog";
import { categories, isLocale, site, type Locale } from "@/lib/site";
import { disabledToolSlugs } from "@/lib/tool-settings";
import { popularTools, tools } from "@/lib/tools";
import { href } from "@/lib/urls";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const dict = dictionaries[typed];
  return pageMetadata({
    locale: typed,
    path: "",
    title: dict.home.title,
    description: dict.home.subtitle,
    keywords:
      typed === "ar"
        ? ["أدوات أونلاين", "ضغط pdf", "ضغط صور", "أدوات المطورين", "حاسبة تسعير"]
        : ["online tools", "compress pdf", "image compressor", "developer tools", "pricing calculator"],
  });
}

// Listing pages read the admin tool switches on every request, so a tool can be
// paused from the dashboard without waiting for a rebuild or a cache window.
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [{ locale: "en" }];
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const dict = dictionaries[typed];

  // Tools switched off in the admin dashboard stay out of every listing.
  const disabled = await disabledToolSlugs();
  const available = tools.filter((tool) => !disabled.includes(tool.slug));

  const searchable = available.map((tool) => ({
    slug: tool.slug,
    category: tool.category,
    name: tool.copy[typed].name,
    tagline: tool.copy[typed].tagline,
    keywords: tool.copy[typed].keywords,
    popular: tool.popular,
    tool,
  }));

  return (
    <>
      <JsonLd data={siteJsonLd(typed)} />

      <section className="relative overflow-hidden border-b border-slate-200/70 dark:border-white/10">
        <div className="grid-pattern absolute inset-0 -z-10" aria-hidden="true" />
        <div className="container-x py-16 text-center sm:py-24">
          <span className="badge animate-fade-up">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {dict.home.badge}
          </span>
          <h1 className="animate-fade-up mx-auto mt-5 max-w-4xl text-3xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-5xl dark:text-white">
            {dict.home.title}
          </h1>
          <p className="animate-fade-up mx-auto mt-5 max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base dark:text-slate-300">
            {dict.home.subtitle}
          </p>

          <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href={href(typed, "tools")} className="btn-primary !px-5 !py-3">
              {dict.home.ctaBrowse}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
            <Link href={href(typed, "pricing")} className="btn-secondary !px-5 !py-3">
              {dict.home.ctaPricing}
            </Link>
          </div>

          <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {dict.home.stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
                <dt className="text-xl font-extrabold text-slate-900 tabular-nums dark:text-white">{stat.value}</dt>
                <dd className="mt-1 text-[11.5px] leading-4 text-slate-500 dark:text-slate-400">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-x py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">{dict.home.popularTitle}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{dict.home.popularSubtitle}</p>
          </div>
          <Link href={href(typed, "tools")} className="link text-sm">
            {dict.home.ctaBrowse}
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popularTools
            .filter((tool) => !disabled.includes(tool.slug))
            .map((tool) => (
            <ToolCard key={tool.slug} tool={tool} locale={typed} labels={dict.card} />
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200/70 bg-white/50 py-14 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="container-x">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">{dict.home.allToolsTitle}</h2>
          <p className="mt-1 mb-5 text-sm text-slate-600 dark:text-slate-400">{dict.home.allToolsSubtitle}</p>
          <ToolSearch locale={typed} dict={dict} items={searchable} />
        </div>
      </section>

      <section className="container-x py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={href(typed, `tools/${category.slug}`)}
              className="surface surface-hover flex flex-col gap-3 p-5"
            >
              <span className={`grid size-10 place-items-center rounded-xl bg-gradient-to-br ${category.gradient} text-white`}>
                <Icon name={category.icon} className="size-5" />
              </span>
              <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">{categoryNames[typed][category.id]}</h3>
              <p className="text-[13px] leading-6 text-slate-600 dark:text-slate-400">
                {categoryDescriptions[typed][category.id]}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-x pb-14">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="surface p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Lock className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{dict.home.privacyTitle}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{dict.home.privacyText}</p>
          </div>
          <div className="surface p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
              <Zap className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{dict.home.speedTitle}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{dict.home.speedText}</p>
          </div>
        </div>
      </section>

      <section className="container-x pb-14">
        <div className="relative overflow-hidden rounded-3xl border border-brand-200/70 bg-gradient-to-br from-brand-50 via-white to-accent-500/5 p-6 sm:p-10 dark:border-brand-500/20 dark:from-brand-500/10 dark:via-transparent dark:to-accent-500/10">
          <div className="max-w-2xl">
            <span className="badge">
              <Rocket className="size-3.5" aria-hidden="true" />
              {typed === "ar" ? "خطة الطريق" : "Roadmap"}
            </span>
            <h2 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">{dict.home.proTitle}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{dict.home.proText}</p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {[dict.home.proFeature1, dict.home.proFeature2, dict.home.proFeature3, dict.home.proFeature4].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link href={href(typed, "pricing")} className="btn-secondary mt-6">
              {dict.home.ctaPricing}
            </Link>
          </div>
        </div>
      </section>

      <section className="container-x pb-16">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
            {typed === "ar" ? "أدلة سريعة" : "Quick guides"}
          </h2>
          <Link href={href(typed, "blog")} className="link text-sm">
            {dict.nav.blog}
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <Link key={post.slug} href={href(typed, `blog/${post.slug}`)} className="surface surface-hover flex flex-col gap-2 p-5">
              <span className="text-xs font-medium text-brand-700 dark:text-brand-300">
                {post.minutes} {typed === "ar" ? "دقائق قراءة" : "min read"}
              </span>
              <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">{post.copy[typed].title}</h3>
              <p className="text-[13px] leading-6 text-slate-600 dark:text-slate-400">{post.copy[typed].excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
