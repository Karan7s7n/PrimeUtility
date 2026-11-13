import { AccountDashboard } from "@/components/account/AccountDashboard";
import { dictionaries } from "@/lib/i18n";
import { pageMetadata } from "@/lib/meta";
import { isLocale, type Locale } from "@/lib/site";
import { tools } from "@/lib/tools";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const dict = dictionaries[typed];
  return {
    ...pageMetadata({
      locale: typed,
      path: "account",
      title: dict.account.title,
      description: dict.account.historyHint,
    }),
    robots: { index: false, follow: true },
  };
}

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";

  const toolNames = Object.fromEntries(tools.map((tool) => [tool.slug, tool.copy[typed].name]));

  return <AccountDashboard locale={typed} toolNames={toolNames} />;
}
