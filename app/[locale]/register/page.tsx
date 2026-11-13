import { AuthForm } from "@/components/auth/AuthForm";
import { dictionaries } from "@/lib/i18n";
import { pageMetadata } from "@/lib/meta";
import { isLocale, type Locale } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const dict = dictionaries[typed];
  return pageMetadata({
    locale: typed,
    path: "register",
    title: dict.auth.registerTitle,
    description: dict.auth.registerSubtitle,
  });
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  return (
    <div className="container-x py-14">
      <AuthForm mode="register" locale={typed} />
    </div>
  );
}
