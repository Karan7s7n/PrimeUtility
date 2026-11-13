import { LegalPage } from "@/components/LegalPage";
import { pageMetadata } from "@/lib/meta";
import { legalDocs } from "@/lib/pages";
import { isLocale, site, type Locale } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const doc = legalDocs[typed].privacy;
  return pageMetadata({
    locale: typed,
    path: "privacy",
    title: doc.title,
    description: doc.intro,
    keywords: [typed === "ar" ? "سياسة الخصوصية" : "privacy policy", site.brand],
  });
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  return <LegalPage locale={typed} doc={legalDocs[typed].privacy} />;
}
