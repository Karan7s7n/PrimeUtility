import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Icon } from "@/components/Icon";
import { ToolSearch } from "@/components/ToolSearch";
import { categoryDescriptions, categoryNames, dictionaries } from "@/lib/i18n";
import { pageMetadata } from "@/lib/meta";
import { categories, isLocale, type Locale } from "@/lib/site";
import { disabledToolSlugs } from "@/lib/tool-settings";
import { tools } from "@/lib/tools";
import { href } from "@/lib/urls";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const dict = dictionaries[typed];
  return pageMetadata({
    locale: typed,
    path: "tools",
    title: dict.toolsIndex.title,
    description: dict.toolsIndex.subtitle,
    keywords:
      typed === "ar"
        ? ["كل الأدوات", "أدوات pdf", "أدوات الصور", "أدوات المطورين"]
        : ["all tools", "pdf tools", "image tools", "developer tools", "business tools"],
  });
}

// Listing pages read the admin tool switches on every request, so a tool can be
// paused from the dashboard without waiting for a rebuild or a cache window.
export const dynamic = "force-dynamic";

export default async function ToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const dict = dictionaries[typed];

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
    <div className="container-x py-10">
      <Breadcrumbs locale={typed} items={[{ label: dict.tool.breadcrumbTools }]} />

      <header className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          {dict.toolsIndex.title}
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-slate-600 dark:text-slate-300">{dict.toolsIndex.subtitle}</p>
        <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{available.length} {dict.toolsIndex.countLabel}</p>
      </header>

      <div className="mt-8">
        <ToolSearch locale={typed} dict={dict} items={searchable} />
      </div>

      <section className="mt-14" aria-label={dict.nav.tools}>
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={href(typed, `tools/${category.slug}`)}
              className="surface surface-hover flex items-start gap-3.5 p-5"
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${category.gradient} text-white`}>
                <Icon name={category.icon} className="size-5" />
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-slate-900 dark:text-white">
                  {categoryNames[typed][category.id]}
                </span>
                <span className="mt-1 block text-[13px] leading-6 text-slate-600 dark:text-slate-400">
                  {categoryDescriptions[typed][category.id]}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
