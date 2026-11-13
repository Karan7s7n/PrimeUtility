import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { Doc } from "@/lib/pages";
import { dictionaries } from "@/lib/i18n";
import type { Locale } from "@/lib/site";

export function LegalPage({ locale, doc }: { locale: Locale; doc: Doc }) {
  const dict = dictionaries[locale];

  return (
    <div className="container-x py-10">
      <Breadcrumbs locale={locale} items={[{ label: doc.title }]} />
      <article className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{doc.title}</h1>
        <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{doc.updated}</p>
        <p className="mt-5 text-[15px] leading-7 text-slate-600 dark:text-slate-300">{doc.intro}</p>

        <div className="prose-copy mt-8">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>

        <p className="mt-10 text-xs text-slate-500 dark:text-slate-400">{dict.footer.note}</p>
      </article>
    </div>
  );
}
