"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { dictionaries } from "@/lib/i18n";
import type { Locale } from "@/lib/site";
import { href } from "@/lib/urls";

function Loading() {
  return (
    <div className="panel flex h-40 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
      <span className="animate-pulse">…</span>
    </div>
  );
}

/* Each tool is loaded on its own so a JSON page never ships the PDF engine. */
const JsonFormatter = dynamic(() => import("./JsonFormatter").then((m) => m.JsonFormatter), {
  ssr: false,
  loading: Loading,
});
const JwtDecoder = dynamic(() => import("./JwtDecoder").then((m) => m.JwtDecoder), { ssr: false, loading: Loading });
const RegexTester = dynamic(() => import("./RegexTester").then((m) => m.RegexTester), {
  ssr: false,
  loading: Loading,
});
const QrCodeGenerator = dynamic(() => import("./QrCodeGenerator").then((m) => m.QrCodeGenerator), {
  ssr: false,
  loading: Loading,
});
const ImageTool = dynamic(() => import("./ImageTool").then((m) => m.ImageTool), { ssr: false, loading: Loading });
const MergePdf = dynamic(() => import("./MergePdf").then((m) => m.MergePdf), { ssr: false, loading: Loading });
const PdfCompressor = dynamic(() => import("./PdfCompressor").then((m) => m.PdfCompressor), {
  ssr: false,
  loading: Loading,
});
const PdfToWord = dynamic(() => import("./PdfToWord").then((m) => m.PdfToWord), { ssr: false, loading: Loading });
const SmartPricingCalculator = dynamic(
  () => import("./SmartPricingCalculator").then((m) => m.SmartPricingCalculator),
  { ssr: false, loading: Loading },
);

/**
 * The page itself stays static, so the pause is checked once in the browser
 * against a tiny endpoint. That keeps the switch instant and the HTML fast.
 */
function usePaused(slug: string) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/tools/availability/", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { paused?: string[] } | null) => {
        if (active && data?.paused) setPaused(data.paused.includes(slug));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [slug]);

  return paused;
}

export function ToolRunner({ slug, locale }: { slug: string; locale: Locale }) {
  const paused = usePaused(slug);
  const dict = dictionaries[locale];

  if (paused) {
    return (
      <div className="panel">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">{dict.tool.unavailableTitle}</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{dict.tool.unavailableNote}</p>
        <Link href={href(locale, "tools")} className="btn-secondary mt-4 inline-flex">
          {dict.nav.tools}
        </Link>
      </div>
    );
  }

  switch (slug) {
    case "json-formatter":
      return <JsonFormatter locale={locale} />;
    case "jwt-decoder":
      return <JwtDecoder locale={locale} />;
    case "regex-tester":
      return <RegexTester locale={locale} />;
    case "qr-code-generator":
      return <QrCodeGenerator locale={locale} />;
    case "image-compressor":
      return <ImageTool locale={locale} mode="compress" />;
    case "image-converter":
      return <ImageTool locale={locale} mode="convert" />;
    case "merge-pdf":
      return <MergePdf locale={locale} />;
    case "pdf-compressor":
      return <PdfCompressor locale={locale} />;
    case "pdf-to-word":
      return <PdfToWord locale={locale} />;
    case "smart-pricing-calculator":
      return <SmartPricingCalculator locale={locale} />;
    default:
      return null;
  }
}
