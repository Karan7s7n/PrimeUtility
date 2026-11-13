"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ToolCard } from "@/components/ToolCard";
import type { Dictionary } from "@/lib/i18n";
import type { CategoryId, Locale } from "@/lib/site";
import { categoryNames } from "@/lib/i18n";
import type { Tool } from "@/lib/tools";

export interface SearchableTool {
  slug: string;
  category: CategoryId;
  name: string;
  tagline: string;
  keywords: string[];
  popular?: boolean;
  tool: Tool;
}

export function ToolSearch({
  locale,
  dict,
  items,
  showFilters = true,
  popularOnly = false,
}: {
  locale: Locale;
  dict: Dictionary;
  items: SearchableTool[];
  showFilters?: boolean;
  popularOnly?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (popularOnly && !item.popular) return false;
      if (category !== "all" && item.category !== category) return false;
      if (!q) return true;
      const haystack = [item.name, item.tagline, ...item.keywords, item.slug].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query, category, popularOnly]);

  const categoryIds = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={dict.home.searchPlaceholder}
          aria-label={dict.home.searchLabel}
          className="input !rounded-2xl !py-3.5 ps-11 shadow-sm"
        />
      </div>

      {showFilters && (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={dict.nav.tools}>
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`chip cursor-pointer transition ${
              category === "all" ? "!border-brand-500 !bg-brand-50 !text-brand-700 dark:!bg-brand-500/20 dark:!text-brand-100" : ""
            }`}
          >
            {dict.nav.tools}
          </button>
          {categoryIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setCategory(id)}
              className={`chip cursor-pointer transition ${
                category === id ? "!border-brand-500 !bg-brand-50 !text-brand-700 dark:!bg-brand-500/20 dark:!text-brand-100" : ""
              }`}
            >
              {categoryNames[locale][id]}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">{dict.home.noResults}</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <ToolCard key={item.slug} tool={item.tool} locale={locale} labels={dict.card} />
          ))}
        </div>
      )}
    </div>
  );
}
