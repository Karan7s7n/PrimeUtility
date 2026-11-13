import { Lock } from "lucide-react";
import Link from "next/link";
import { AdminClaim } from "@/components/admin/AdminClaim";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { adminCount } from "@/lib/admin";
import { resolveScope } from "@/lib/api";
import { isAdminRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { pageMetadata } from "@/lib/meta";
import { isLocale, type Locale } from "@/lib/site";
import { tools } from "@/lib/tools";
import { href } from "@/lib/urls";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const dict = dictionaries[typed];
  return {
    ...pageMetadata({
      locale: typed,
      path: "admin",
      title: dict.admin.title,
      description: dict.admin.subtitle,
    }),
    robots: { index: false, follow: false },
  };
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typed: Locale = isLocale(locale) ? locale : "en";
  const labels = dictionaries[typed].admin;

  // The role is decided here, on the server — the UI never grants access.
  const scope = await resolveScope();
  const user = scope?.user ?? null;

  if (user && !isAdminRole(user.role) && (await adminCount()) === 0) {
    return <AdminClaim locale={typed} />;
  }

  if (!user || !isAdminRole(user.role)) {
    return (
      <div className="container-x py-16">
        <div className="panel mx-auto max-w-lg text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-900/5 text-slate-500 dark:bg-white/10 dark:text-slate-300">
            <Lock className="size-6" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">{labels.noAccess}</h1>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{labels.subtitle}</p>
          <Link href={href(typed, user ? "account" : "login")} className="btn-secondary mt-5 inline-flex">
            {user ? labels.backToAccount : labels.signIn}
          </Link>
        </div>
      </div>
    );
  }

  const toolNames = Object.fromEntries(tools.map((tool) => [tool.slug, tool.copy[typed].name]));

  return <AdminDashboard locale={typed} toolNames={toolNames} role={user.role} />;
}
