import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/lib/site";
import { href } from "@/lib/urls";

export interface Crumb {
  label: string;
  path?: string;
}

export function Breadcrumbs({ locale, items }: { locale: Locale; items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <li>
          <Link href={href(locale)} className="inline-flex items-center gap-1 hover:text-brand-700 dark:hover:text-brand-300">
            <Home className="size-3.5" aria-hidden="true" />
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
            {item.path ? (
              <Link href={href(locale, item.path)} className="hover:text-brand-700 dark:hover:text-brand-300">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
