"use client";

import { Languages } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/lib/site";

/**
 * Swaps the locale segment of the current path so the visitor stays on the same page.
 */
export function LocaleSwitch({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() || `/${locale}/`;
  const other: Locale = locales.find((l) => l !== locale) ?? "en";
  const segments = pathname.split("/").filter(Boolean);
  segments[0] = other;
  const target = `/${segments.join("/")}${pathname.endsWith("/") ? "/" : ""}`;

  return (
    <Link href={target} className="btn-ghost btn-sm gap-1.5" aria-label={label} title={label} hrefLang={other}>
      <Languages className="size-4" />
      <span className="font-semibold">{other === "ar" ? "ع" : "EN"}</span>
    </Link>
  );
}
