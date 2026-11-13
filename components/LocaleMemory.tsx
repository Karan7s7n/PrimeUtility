"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/site";

/** Remembers the language a visitor actually chose, so "/" sends them back to it. */
export function LocaleMemory({ locale }: { locale: Locale }) {
  useEffect(() => {
    try {
      localStorage.setItem("locale", locale);
    } catch {
      /* storage disabled — the browser language is used instead */
    }
  }, [locale]);

  return null;
}
