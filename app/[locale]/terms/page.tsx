import { LegalPage } from "@/components/LegalPage";
import { pageMetadata } from "@/lib/meta";
import { legalDocs } from "@/lib/pages";
import { isLocale, site, type Locale } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const doc = legalDocs[typed].terms;
  return pageMetadata({
    locale: typed,
    path: "terms",
    title: doc.title,
    description: doc.intro,
    keywords: [typed === "ar" ? "شروط الاستخدام" : "terms of use", site.brand],
  });
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  return <LegalPage locale={typed} doc={legalDocs[typed].terms} />;
}
