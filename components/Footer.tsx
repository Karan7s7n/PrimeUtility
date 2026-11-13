import { Github, Sparkles } from "lucide-react";
import Link from "next/link";
import { site } from "@/lib/site";
import type { CategoryId, Locale } from "@/lib/site";
import { href } from "@/lib/urls";

export function Footer({
  locale,
  brand,
  footer,
  categoryLinks,
}: {
  locale: Locale;
  brand: string;
  footer: {
    tagline: string;
    product: string;
    company: string;
    legal: string;
    allTools: string;
    privacy: string;
    terms: string;
    cookies: string;
    rights: string;
    note: string;
  };
  categoryLinks: { id: CategoryId; slug: string; name: string }[];
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-slate-200/70 bg-white/60 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Link href={href(locale)} className="flex items-center gap-2.5 font-bold">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-600 text-white">
              <Sparkles className="size-4.5" aria-hidden="true" />
            </span>
            <span className="text-[17px] text-slate-900 dark:text-white">{brand}</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">{footer.tagline}</p>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">{footer.note}</p>
          <a
            href={site.github}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
          >
            <Github className="size-3.5" aria-hidden="true" />
            GitHub
          </a>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{footer.product}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href={href(locale, "tools")} className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300">
                {footer.allTools}
              </Link>
            </li>
            {categoryLinks.map((category) => (
              <li key={category.id}>
                <Link
                  href={href(locale, `tools/${category.slug}`)}
                  className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{footer.company}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href={href(locale, "pricing")} className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300">
                {locale === "ar" ? "الأسعار" : "Pricing"}
              </Link>
            </li>
            <li>
              <Link href={href(locale, "blog")} className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300">
                {locale === "ar" ? "أدلة الاستخدام" : "Guides"}
              </Link>
            </li>
            <li>
              <Link href={href(locale, "about")} className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300">
                {locale === "ar" ? "من نحن" : "About"}
              </Link>
            </li>
            <li>
              <Link href={href(locale, "contact")} className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300">
                {locale === "ar" ? "اتصل بنا" : "Contact"}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{footer.legal}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href={href(locale, "privacy")} className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300">
                {footer.privacy}
              </Link>
            </li>
            <li>
              <Link href={href(locale, "terms")} className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300">
                {footer.terms}
              </Link>
            </li>
            <li>
              <Link href={href(locale, "cookies")} className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300">
                {footer.cookies}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200/70 py-5 dark:border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row dark:text-slate-500">
          <p>{footer.rights.replace("{year}", String(year))}</p>
          <p>{footer.legal === "Legal" ? "Made for people who value their time." : "صُنعت لمن يقدّرون وقتهم."}</p>
        </div>
      </div>
    </footer>
  );
}
