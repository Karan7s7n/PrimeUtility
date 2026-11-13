"use client";

import { AlertCircle, Check, CheckCircle2, Copy, Info, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { dictionaries } from "@/lib/i18n";
import { IMAGE_LIMITS, selectAllowedFiles, type FileLimits, type FileRejection } from "@/lib/limits";
import type { Locale } from "@/lib/site";
import { href } from "@/lib/urls";
import { copyToClipboard, formatBytes, joinClass } from "@/lib/utils";

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn" | "error" | "success";
  children: ReactNode;
}) {
  const styles = {
    info: "border-brand-200 bg-brand-50/70 text-brand-900 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-100",
    warn: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
    error: "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100",
    success:
      "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
  }[tone];

  const Icons = { info: Info, warn: AlertCircle, error: AlertCircle, success: CheckCircle2 };
  const Marker = Icons[tone];

  return (
    <div className={joinClass("flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-6", styles)}>
      <Marker className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function CopyButton({ text, label, copiedLabel }: { text: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn-secondary btn-sm"
      disabled={!text}
      onClick={async () => {
        const ok = await copyToClipboard(text);
        if (ok) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }
      }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? copiedLabel : label}
    </button>
  );
}

export function FileDrop({
  accept,
  multiple = false,
  onFiles,
  title,
  hint,
  icon,
  locale = "en",
  limits = IMAGE_LIMITS,
  existing = [],
  onRejected,
}: {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  title: string;
  hint?: string;
  icon?: ReactNode;
  locale?: Locale;
  limits?: FileLimits;
  /** Files already added, so the count and total size limits stay accurate. */
  existing?: { size: number }[];
  onRejected?: (rejected: FileRejection[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [skipped, setSkipped] = useState<FileRejection[]>([]);

  const effectiveLimits: FileLimits = multiple ? limits : { ...limits, maxFiles: 1 };
  const labels = dictionaries[locale].limits;

  const describe = (rejection: FileRejection) => {
    if (rejection.reason === "too_many_files") {
      return labels.tooManyFiles.replace("{max}", String(effectiveLimits.maxFiles));
    }
    if (rejection.reason === "file_too_large") {
      return labels.fileTooLarge
        .replace("{name}", rejection.name)
        .replace("{max}", formatBytes(effectiveLimits.maxFileBytes));
    }
    return labels.totalTooLarge.replace("{max}", formatBytes(effectiveLimits.maxTotalBytes));
  };

  const handle = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const selection = selectAllowedFiles(Array.from(fileList), existing, effectiveLimits);
    setSkipped(selection.rejected);
    if (selection.rejected.length > 0) onRejected?.(selection.rejected);
    if (selection.accepted.length > 0) onFiles(selection.accepted);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        handle(event.dataTransfer.files);
      }}
      className={joinClass(
        "rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-8",
        over
          ? "border-brand-500 bg-brand-50/80 dark:bg-brand-500/10"
          : "border-slate-300 bg-slate-50/60 hover:border-brand-400 dark:border-white/15 dark:bg-white/[0.03]",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          handle(event.target.files);
          event.target.value = "";
        }}
      />
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-md shadow-brand-600/25">
        {icon ?? <UploadCloud className="size-6" aria-hidden="true" />}
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      <button type="button" className="btn-primary mt-4" onClick={() => inputRef.current?.click()}>
        {title}
      </button>

      {skipped.length > 0 && (
        <div className="mt-4 text-start" onClick={(event) => event.stopPropagation()}>
          <Notice tone="warn">
            <p className="font-semibold">{labels.filesTitle}</p>
            <ul className="mt-1 list-disc space-y-0.5 ps-5 text-[13px]">
              {skipped.map((rejection, index) => (
                <li key={`${rejection.name}-${index}`}>{describe(rejection)}</li>
              ))}
            </ul>
            <button
              type="button"
              className="btn-ghost btn-sm mt-2"
              onClick={() => setSkipped([])}
            >
              {labels.dismiss}
            </button>
          </Notice>
        </div>
      )}
    </div>
  );
}

export function Stat({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "good" | "bad" | "brand";
  hint?: string;
}) {
  const tones = {
    default: "text-slate-900 dark:text-white",
    good: "text-emerald-600 dark:text-emerald-400",
    bad: "text-rose-600 dark:text-rose-400",
    brand: "text-brand-700 dark:text-brand-300",
  }[tone];

  return (
    <div className="stat">
      <p className="stat-label">{label}</p>
      <p className={joinClass("stat-value", tones)}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-white/10 dark:bg-white/5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={joinClass(
            "cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition",
            value === option.value
              ? "bg-white text-brand-700 shadow-sm dark:bg-white/15 dark:text-white"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
  id,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  id?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
  id,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
  id: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor={id}>
          {label}
        </label>
        <span className="text-sm font-semibold text-brand-700 tabular-nums dark:text-brand-300">
          {value}
          {suffix}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600 dark:bg-white/15"
      />
    </div>
  );
}

/** Shown when the daily allowance for the visitor's plan is used up. */
export function LimitNotice({ locale, limit }: { locale: Locale; limit: number }) {
  const dict = dictionaries[locale];
  return (
    <Notice tone="warn">
      <p className="font-semibold">{dict.account.limitReached.replace("{limit}", String(limit))}</p>
      <p className="mt-1 text-[13px]">{dict.account.limitReachedHint}</p>
      <Link href={href(locale, "register")} className="link mt-2 inline-block text-[13px]">
        {dict.auth.signUp}
      </Link>
    </Notice>
  );
}
