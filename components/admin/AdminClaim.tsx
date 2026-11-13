"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Notice } from "@/components/tools/ui";
import { dictionaries } from "@/lib/i18n";
import type { Locale } from "@/lib/site";
import { href } from "@/lib/urls";

/**
 * The one-time bootstrap: while the deployment has no admin at all, the first
 * signed-in visitor can take the seat. It stops working the moment one exists.
 */
export function AdminClaim({ locale }: { locale: Locale }) {
  const labels = dictionaries[locale].admin;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const claim = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/claim/", { method: "POST" });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError((labels.errors as Record<string, string>)[data.error ?? ""] ?? labels.loadError);
        return;
      }
      window.location.reload();
    } catch {
      setError(labels.loadError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-x flex min-h-[60vh] items-center justify-center py-12">
      <div className="panel w-full max-w-lg text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 text-white">
          <ShieldCheck className="size-6" />
        </span>
        <h1 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">{labels.title}</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{labels.subtitle}</p>

        {error && (
          <div className="mt-4 text-start">
            <Notice tone="error">{error}</Notice>
          </div>
        )}

        <button type="button" className="btn-primary mt-5" onClick={() => void claim()} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          {labels.claim}
        </button>

        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          <Link href={href(locale, "account")} className="underline">
            {labels.backToAccount}
          </Link>
        </p>
      </div>
    </div>
  );
}
