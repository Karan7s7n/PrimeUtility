import { CheckCircle2, ChevronRight, CircleDollarSign, HelpCircle, Lock, Shapes, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { ToolCard } from "@/components/ToolCard";
import { ToolRunner } from "@/components/tools/ToolRunner";
import { categoryDescriptions, categoryNames, dictionaries } from "@/lib/i18n";
import { pageMetadata, toolJsonLd } from "@/lib/meta";
import { categories, isLocale, categoryBySlug, site, type Locale } from "@/lib/site";
import { getTool, relatedTools, toolSlugs, toolsByCategory } from "@/lib/tools";
import { href } from "@/lib/urls";

// Unknown slugs still 404 through notFound(). On-demand rendering stays allowed so
// an admin tool switch can refresh a page without a rebuild.
export const dynamicParams = true;

export function generateStaticParams() {
  return ["en"].flatMap((locale) => [
    ...toolSlugs.map((slug) => ({ locale, slug })),
    ...categories.map((category) => ({ locale, slug: category.slug })),
  ]);
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";

  const tool = getTool(slug);
  if (tool) {
    const copy = tool.copy[typed];
    return pageMetadata({
      locale: typed,
      path: `tools/${slug}`,
      title: copy.seoTitle,
      description: copy.metaDescription,
      keywords: copy.keywords,
    });
  }

  const category = categoryBySlug(slug);
  if (category) {
    return pageMetadata({
      locale: typed,
      path: `tools/${slug}`,
      title: categoryNames[typed][category.id],
      description: categoryDescriptions[typed][category.id],
    });
  }

  return {};
}

export default async function ToolOrCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const dict = dictionaries[typed];

  const category = categoryBySlug(slug);
  if (category) {
    const list = toolsByCategory(category.id);
    return (
      <div className="container-x py-10">
        <Breadcrumbs locale={typed} items={[{ label: dict.tool.breadcrumbTools, path: "tools" }, { label: categoryNames[typed][category.id] }]} />
        <header className="max-w-3xl">
          <div className="flex items-center gap-3">
            <span className={`grid size-11 place-items-center rounded-xl bg-gradient-to-br ${category.gradient} text-white`}>
              <Shapes className="size-5" aria-hidden="true" />
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              {categoryNames[typed][category.id]}
            </h1>
          </div>
          <p className="mt-3 text-[15px] leading-7 text-slate-600 dark:text-slate-300">
            {categoryDescriptions[typed][category.id]}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            {list.length} {dict.toolsIndex.countLabel}
          </p>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} locale={typed} labels={dict.card} />
          ))}
        </div>

        <section className="mt-12">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{dict.nav.tools}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories
              .filter((entry) => entry.id !== category.id)
              .map((entry) => (
                <Link key={entry.id} href={href(typed, `tools/${entry.slug}`)} className="chip hover:border-brand-400">
                  {categoryNames[typed][entry.id]}
                  <ChevronRight className="size-3 rtl:rotate-180" />
                </Link>
              ))}
            <Link href={href(typed, "tools")} className="chip hover:border-brand-400">
              {dict.toolsIndex.title}
              <ChevronRight className="size-3 rtl:rotate-180" />
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const tool = getTool(slug);
  if (!tool) notFound();

  const copy = tool.copy[typed];
  const related = relatedTools(slug, 3);
  const categoryMeta = categories.find((entry) => entry.id === tool.category)!;

  return (
    <div className="container-x py-10">
      <JsonLd
        data={toolJsonLd({
          locale: typed,
          name: copy.h1,
          description: copy.metaDescription,
          path: `tools/${slug}`,
          category: categoryNames[typed][tool.category],
          faq: copy.faq,
        })}
      />

      <Breadcrumbs
        locale={typed}
        items={[
          { label: dict.tool.breadcrumbTools, path: "tools" },
          { label: categoryNames[typed][tool.category], path: `tools/${categoryMeta.slug}` },
          { label: copy.name },
        ]}
      />

      <header className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{copy.h1}</h1>
        <p className="mt-3 text-[15px] leading-7 text-slate-600 dark:text-slate-300">{copy.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="chip">
            <Sparkles className="size-3.5 text-brand-600 dark:text-brand-300" />
            {dict.card.free}
          </span>
          <span className="chip">
            <Lock className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            {tool.processing === "client" ? dict.card.clientSide : dict.card.serverSide}
          </span>
          <Link href={href(typed, `tools/${categoryMeta.slug}`)} className="chip hover:border-brand-400">
            {categoryNames[typed][tool.category]}
          </Link>
        </div>
      </header>

      <section className="mt-7" aria-label={copy.name}>
        <div className="surface p-4 sm:p-6">
          <ToolRunner slug={tool.slug} locale={typed} />
        </div>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{dict.tool.howToTitle}</h2>
          <ol className="mt-4 space-y-3">
            {copy.howTo.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-600 text-[12px] font-bold text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{step}</p>
              </li>
            ))}
          </ol>

          <h2 className="mt-10 text-xl font-bold text-slate-900 dark:text-white">{dict.tool.examplesTitle}</h2>
          <ul className="mt-4 space-y-2">
            {copy.examples.map((example) => (
              <li
                key={example}
                dir="auto"
                className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 font-mono text-[12.5px] leading-6 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                {example}
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-4">
          <div className="surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <CircleDollarSign className="size-4 text-brand-600 dark:text-brand-300" />
              {typed === "ar" ? "مجاني بالكامل" : "Completely free"}
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-400">
              {typed === "ar"
                ? "لا يحتاج هذا الإصدار حسابًا ولا دفعًا. الخطط المدفوعة تأتي لاحقًا للمعالجة الثقيلة على الخادم."
                : "This version needs no account and no payment. Paid plans come later, for heavy server-side processing."}
            </p>
            <Link href={href(typed, "pricing")} className="btn-secondary btn-sm mt-3">
              {dict.nav.pricing}
            </Link>
          </div>

          <div className="surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Lock className="size-4 text-emerald-600 dark:text-emerald-400" />
              {dict.tool.privacyTitle}
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-400">{dict.tool.privacyNote}</p>
            <Link href={href(typed, "privacy")} className="link mt-3 inline-block text-[13px]">
              {dict.footer.privacy}
            </Link>
          </div>

          <div className="surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <HelpCircle className="size-4 text-brand-600 dark:text-brand-300" />
              {dict.tool.faqTitle}
            </h2>
            <div className="mt-3 space-y-2">
              {copy.faq.map((item) => (
                <details key={item.q} className="group rounded-xl border border-slate-200 px-3.5 py-2.5 dark:border-white/10">
                  <summary className="cursor-pointer list-none text-[13.5px] font-medium text-slate-800 dark:text-slate-100">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-400">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{dict.tool.relatedTitle}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((entry) => (
            <ToolCard key={entry.slug} tool={entry} locale={typed} labels={dict.card} />
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-brand-200/70 bg-gradient-to-br from-brand-50 via-white to-accent-500/5 p-6 sm:p-8 dark:border-brand-500/20 dark:from-brand-500/10 dark:via-transparent dark:to-accent-500/10">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {typed === "ar" ? `${copy.name} وأدوات أخرى، بلا تثبيت` : `${copy.name} and nine more tools, nothing to install`}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          {typed === "ar"
            ? `كل أداة في ${site.brand} صفحة مستقلة تعمل على الهاتف وفي المتصفح، ويمكنك حفظها في المفضلة والعودة إليها وقتما احتجت.`
            : `Every ${site.brand} tool is its own page, works on a phone and in any modern browser, and is worth bookmarking for the next time you need it.`}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={href(typed, "tools")} className="btn-primary">
            {dict.home.ctaBrowse}
          </Link>
          <Link href={href(typed, `tools/${categoryMeta.slug}`)} className="btn-secondary">
            <CheckCircle2 className="size-4" />
            {categoryNames[typed][tool.category]}
          </Link>
        </div>
      </section>
    </div>
  );
}
