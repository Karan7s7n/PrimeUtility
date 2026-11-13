import { ContactForm } from "@/components/ContactForm";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { dictionaries } from "@/lib/i18n";
import { pageMetadata } from "@/lib/meta";
import { contactText } from "@/lib/pages";
import { isLocale, site, type Locale } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const copy = contactText[typed];
  return pageMetadata({
    locale: typed,
    path: "contact",
    title: copy.title,
    description: copy.intro,
  });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const copy = contactText[typed];
  const dict = dictionaries[typed];

  return (
    <div className="container-x py-10">
      <Breadcrumbs locale={typed} items={[{ label: copy.title }]} />
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{copy.title}</h1>
          <p className="mt-3 text-[15px] leading-7 text-slate-600 dark:text-slate-300">{copy.intro}</p>
          <ul className="mt-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>
              <strong className="font-semibold text-slate-900 dark:text-white">
                {typed === "ar" ? "الأخطاء والتقارير:" : "Bugs and reports:"}
              </strong>{" "}
              {typed === "ar"
                ? "اذكر اسم الأداة ونوع المتصفح وحجم الملف إن أمكن."
                : "Mention the tool, your browser and the file type if you can."}
            </li>
            <li>
              <strong className="font-semibold text-slate-900 dark:text-white">
                {typed === "ar" ? "طلبات أدوات جديدة:" : "Tool requests:"}
              </strong>{" "}
              {typed === "ar"
                ? "وضّح المهمة التي تريد إنجازها، لا اسم الأداة فقط."
                : "Describe the job you need done, not just a tool name."}
            </li>
            <li>
              <strong className="font-semibold text-slate-900 dark:text-white">
                {typed === "ar" ? "الخصوصية:" : "Privacy:"}
              </strong>{" "}
              {typed === "ar"
                ? "لا ترسل ملفات حساسة بالبريد؛ استخدم الأدوات فهي لا ترفع شيئًا."
                : "Never email sensitive files — the tools never upload anything, so use them directly."}
            </li>
          </ul>
          <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">{dict.footer.tagline}</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
            {typed === "ar"
              ? `عنوان البريد مؤقت: ${site.contactEmail}`
              : `Working contact address: ${site.contactEmail}`}
          </p>
        </header>

        <ContactForm labels={copy.form} email={site.contactEmail} />
      </div>
    </div>
  );
}
