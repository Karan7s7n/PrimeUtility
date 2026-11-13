"use client";

import { ChevronDown, Menu, Search, ShieldCheck, Sparkles, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSession } from "@/lib/session";
import type { CategoryId, Locale } from "@/lib/site";
import { href } from "@/lib/urls";

export interface HeaderCategory {
  id: CategoryId;
  slug: string;
  icon: string;
  name: string;
}

export function Header({
  locale,
  brand,
  nav,
  categories,
  auth,
}: {
  locale: Locale;
  brand: string;
  nav: {
    home: string;
    tools: string;
    pricing: string;
    blog: string;
    about: string;
    menu: string;
    theme: string;
    language: string;
    admin: string;
  };
  categories: HeaderCategory[];
  auth: { signIn: string; account: string };
}) {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
  const session = useSession();

  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { label: nav.tools, path: "tools" },
    { label: nav.blog, path: "blog" },
    { label: nav.pricing, path: "pricing" },
    { label: nav.about, path: "about" },
  ];

  const isActive = (path: string) => pathname.startsWith(href(locale, path));

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-ink-950/80">
      <div className="container-x flex h-16 items-center gap-3">
        <Link href={href(locale)} className="flex items-center gap-2.5 font-bold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-md shadow-brand-600/30">
            <Sparkles className="size-4.5" aria-hidden="true" />
          </span>
          <span className="text-[17px] text-slate-900 dark:text-white">{brand}</span>
        </Link>

        <nav className="ms-4 hidden items-center gap-1 lg:flex" aria-label="Main">
          <div className="group/tools relative flex items-center">
            <Link
              href={href(locale, "tools")}
              className={`nav-link flex items-center gap-1 ${isActive("tools") ? "bg-slate-900/5 text-slate-900 dark:bg-white/10 dark:text-white" : ""}`}
            >
              {nav.tools}
              <ChevronDown className="size-3.5" aria-hidden="true" />
            </Link>
            <span className="pointer-events-none absolute start-0 top-full z-50 pt-2 opacity-0 transition group-hover/tools:pointer-events-auto group-hover/tools:opacity-100 group-focus-within/tools:pointer-events-auto group-focus-within/tools:opacity-100">
              <span className="surface block w-60 p-1.5">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={href(locale, `tools/${category.slug}`)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-brand-50 dark:text-slate-200 dark:hover:bg-white/5"
                  >
                    <Icon name={category.icon} className="size-4 text-brand-600 dark:text-brand-300" />
                    {category.name}
                  </Link>
                ))}
              </span>
            </span>
          </div>
          {links.slice(1).map((link) => (
            <Link
              key={link.path}
              href={href(locale, link.path)}
              className={`nav-link ${isActive(link.path) ? "bg-slate-900/5 text-slate-900 dark:bg-white/10 dark:text-white" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-1.5">
          <Link href={href(locale, "tools")} className="btn-ghost btn-sm" aria-label={nav.tools} title={nav.tools}>
            <Search className="size-4" />
          </Link>
          {session.user ? (
            <>
              {(session.user.role === "admin" || session.user.role === "super_admin") && (
                <Link href={href(locale, "admin")} className="btn-ghost btn-sm hidden gap-1.5 sm:inline-flex">
                  <ShieldCheck className="size-4" />
                  <span className="hidden md:inline">{nav.admin}</span>
                </Link>
              )}
              <Link href={href(locale, "account")} className="btn-secondary btn-sm hidden gap-1.5 sm:inline-flex">
                <UserRound className="size-3.5" />
                <span className="max-w-24 truncate">{session.user.name || auth.account}</span>
              </Link>
            </>
          ) : (
            <Link href={href(locale, "login")} className="btn-secondary btn-sm hidden sm:inline-flex">
              {auth.signIn}
            </Link>
          )}
          <ThemeToggle label={nav.theme} />
          <button
            type="button"
            className="btn-ghost btn-sm lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={nav.menu}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200/70 bg-white lg:hidden dark:border-white/10 dark:bg-ink-950">
          <nav className="container-x flex flex-col gap-1 py-3" aria-label="Mobile">
            {links.map((link) => (
              <Link key={link.path} href={href(locale, link.path)} className="nav-link">
                {link.label}
              </Link>
            ))}
            <Link
              href={href(locale, session.user ? "account" : "login")}
              className="nav-link flex items-center gap-2"
            >
              <UserRound className="size-4" />
              {session.user ? auth.account : auth.signIn}
            </Link>
            <p className="px-3 pt-3 pb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
              {nav.tools}
            </p>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={href(locale, `tools/${category.slug}`)}
                className="nav-link flex items-center gap-2.5"
              >
                <Icon name={category.icon} className="size-4 text-brand-600 dark:text-brand-300" />
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
