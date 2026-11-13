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
    path: "login",
    title: dict.auth.loginTitle,
    description: dict.auth.loginSubtitle,
  });
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  return (
    <div className="container-x py-14">
      <AuthForm mode="login" locale={typed} />
    </div>
  );
}
