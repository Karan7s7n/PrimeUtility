import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import type { Locale } from "@/lib/site";
import { categoryNames } from "@/lib/i18n";
import type { Tool } from "@/lib/tools";
import { href } from "@/lib/urls";

export function ToolCard({
  tool,
  locale,
  labels,
}: {
  tool: Tool;
  locale: Locale;
  labels: { open: string; free: string; clientSide: string };
}) {
  const copy = tool.copy[locale];

  return (
    <Link
      href={href(locale, `tools/${tool.slug}`)}
      className="surface surface-hover group flex h-full flex-col gap-3 p-5"
    >
      <span className={`grid size-11 place-items-center rounded-xl bg-gradient-to-br ${tool.gradient} text-white shadow-sm`}>
        <Icon name={tool.icon} className="size-5" />
      </span>
      <div className="flex-1">
        <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">{copy.name}</h3>
        <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-400">{copy.tagline}</p>
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="chip !py-0.5 text-[11px]">{categoryNames[locale][tool.category]}</span>
        <span className="flex items-center gap-1 text-xs font-semibold text-brand-700 opacity-0 transition group-hover:opacity-100 dark:text-brand-300">
          {labels.open}
          <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
