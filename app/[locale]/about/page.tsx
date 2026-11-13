import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { dictionaries } from "@/lib/i18n";
import { pageMetadata } from "@/lib/meta";
import { aboutCopy } from "@/lib/pages";
import { isLocale, site, type Locale } from "@/lib/site";
import { href } from "@/lib/urls";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const copy = aboutCopy[typed];
  return pageMetadata({
    locale: typed,
    path: "about",
    title: copy.title,
    description: copy.intro,
    keywords: [site.brand, typed === "ar" ? "عن المنصة" : "about the platform"],
  });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const copy = aboutCopy[typed];
  const dict = dictionaries[typed];

  return (
    <div className="container-x py-10">
      <Breadcrumbs locale={typed} items={[{ label: copy.title }]} />
      <article className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{copy.title}</h1>
        <p className="mt-4 text-[15px] leading-7 text-slate-600 dark:text-slate-300">{copy.intro}</p>

        <div className="prose-copy mt-8">
          {copy.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>

        <div className="surface mt-8 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {typed === "ar" ? "ما تستطيع فعله الآن" : "What you can do right now"}
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              typed === "ar" ? "اضغط ملفات PDF" : "Compress a PDF",
              typed === "ar" ? "حوّل صورة إلى WebP" : "Convert an image to WebP",
              typed === "ar" ? "نسّق JSON وتحقّق منه" : "Format and validate JSON",
              typed === "ar" ? "احسب هامش ربحك" : "Work out your profit margin",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-500" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <Link href={href(typed, "tools")} className="btn-primary mt-5">
            {dict.home.ctaBrowse}
          </Link>
        </div>
      </article>
    </div>
  );
}
