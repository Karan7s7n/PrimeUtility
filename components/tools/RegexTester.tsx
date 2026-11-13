"use client";

import { AlertTriangle, Regex as RegexIcon, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CopyButton, LimitNotice, Notice } from "@/components/tools/ui";
import { dictionaries } from "@/lib/i18n";
import { REGEX_LIMITS } from "@/lib/limits";
import { useRunTracker } from "@/lib/session";
import type { Locale } from "@/lib/site";

interface MatchInfo {
  index: number;
  value: string;
  groups: { name: string | null; value: string | undefined; index: number }[];
}

const presets = [
  {
    label: { en: "Email address", ar: "بريد إلكتروني" },
    pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.]{2,}",
    flags: "g",
    sample: "Support: help@primeutility.app, sales@example.co.uk — not an email@",
  },
  {
    label: { en: "URL", ar: "رابط" },
    pattern: "https?://[^\\s]+",
    flags: "g",
    sample: "Docs at https://docs.example.com/api and https://example.com",
  },
  {
    label: { en: "Date (YYYY-MM-DD)", ar: "تاريخ (YYYY-MM-DD)" },
    pattern: "(\\d{4})-(\\d{2})-(\\d{2})",
    flags: "g",
    sample: "Created 2026-01-12, updated 2026-02-14, invalid 2026-2-1",
  },
  {
    label: { en: "Hex colour", ar: "لون hex" },
    pattern: "#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\b",
    flags: "g",
    sample: "Primary #4f46e5, accent #8b5cf6, not-a-colour #12345",
  },
  {
    label: { en: "Digits with groups", ar: "أرقام مع مجموعات" },
    pattern: "(?<code>\\+\\d{1,3})[\\s-]?(?<number>\\d{6,12})",
    flags: "g",
    sample: "Call +20 1001234567 or +1-4155550100 for support",
  },
];

export function RegexTester({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale];
  const [pattern, setPattern] = useState("");
  const [text, setText] = useState("");
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false, u: false });
  const [preset, setPreset] = useState(0);
  const [copiedMode, setCopiedMode] = useState<"highlight" | "list">("highlight");
  const { trackOnce, limitReached } = useRunTracker("regex-tester");

  const flagString = Object.entries(flags)
    .filter(([, on]) => on)
    .map(([flag]) => flag)
    .join("");

  // Guards against huge inputs before any regular expression is executed.
  const limitError = useMemo(() => {
    if (pattern.length > REGEX_LIMITS.maxPatternChars) {
      return dict.limits.patternTooLong.replace("{max}", String(REGEX_LIMITS.maxPatternChars));
    }
    if (text.length > REGEX_LIMITS.maxTextChars) {
      return dict.limits.textTooLong.replace("{max}", REGEX_LIMITS.maxTextChars.toLocaleString());
    }
    return "";
  }, [pattern, text, dict]);

  const result = useMemo(() => {
    if (limitError) return { error: "", matches: [] as MatchInfo[] };
    if (!pattern) return { error: "", matches: [] as MatchInfo[] };
    let regex: RegExp;
    try {
      regex = new RegExp(pattern, flagString);
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error), matches: [] as MatchInfo[] };
    }

    const names = [...pattern.matchAll(/\(\?<([A-Za-z_$][\w$]*)>/g)].map((m) => m[1]);
    const toGroups = (values: (string | undefined)[]) =>
      values.map((value, i) => ({ name: names[i] ?? null, value, index: i + 1 }));

    const matches: MatchInfo[] = [];
    if (flagString.includes("g")) {
      let match: RegExpExecArray | null;
      let guard = 0;
      while ((match = regex.exec(text)) !== null && guard < 5000) {
        guard += 1;
        matches.push({
          index: match.index,
          value: match[0],
          groups: toGroups(match.slice(1)),
        });
        if (match[0] === "") regex.lastIndex += 1;
      }
    } else {
      const match = regex.exec(text);
      if (match) {
        matches.push({
          index: match.index,
          value: match[0],
          groups: toGroups(match.slice(1)),
        });
      }
    }
    return { error: "", matches };
  }, [pattern, text, flagString, limitError]);

  useEffect(() => {
    if (result.matches.length > 0) void trackOnce();
  }, [result.matches.length, trackOnce]);

  const segments = useMemo(() => {
    if (result.matches.length === 0) return [{ text, match: false }];
    const parts: { text: string; match: boolean; index?: number }[] = [];
    let cursor = 0;
    result.matches.forEach((match, i) => {
      if (match.index > cursor) parts.push({ text: text.slice(cursor, match.index), match: false });
      parts.push({ text: match.value, match: true, index: i });
      cursor = match.index + match.value.length;
    });
    if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false });
    return parts;
  }, [result.matches, text]);

  const explainError = (message: string) => {
    if (/Unterminated group|Missing \)/i.test(message))
      return locale === "ar" ? "يوجد قوس فتح بدون قوس إغلاق." : "An opening parenthesis has no matching close.";
    if (/Unterminated character class/i.test(message))
      return locale === "ar" ? "قوس مربع [ بدون إغلاق." : "A character class [ is never closed.";
    if (/Nothing to repeat/i.test(message))
      return locale === "ar"
        ? "يوجد مُكمِّم (* أو +) قبل أي عنصر يمكن تكراره."
        : "A quantifier (* or +) appears before anything it can repeat.";
    if (/Invalid escape/i.test(message))
      return locale === "ar" ? "يوجد مَحرف مُهرَّب غير معروف بعد الشرطة المائلة." : "Unknown escape after a backslash.";
    if (/Invalid group/i.test(message))
      return locale === "ar" ? "صيغة المجموعة غير صحيحة." : "The group syntax is not valid.";
    return locale === "ar"
      ? "راجع الصيغة: قد يكون هناك قوس أو مُكمِّم غير مكتمل."
      : "Check the syntax — a bracket or quantifier is probably unfinished.";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="regex-pattern" className="label">
            {locale === "ar" ? "النمط" : "Pattern"}
          </label>
          <div className="flex items-center gap-0" dir="ltr">
            <span className="rounded-s-xl border border-e-0 border-slate-300 bg-slate-100 px-3 py-2.5 font-mono text-sm text-slate-500 dark:border-white/15 dark:bg-white/10 dark:text-slate-300">
              /
            </span>
            <input
              id="regex-pattern"
              dir="ltr"
              spellCheck={false}
              className="input !rounded-none font-mono"
              placeholder="[a-z]+"
              value={pattern}
              onChange={(event) => setPattern(event.target.value)}
            />
            <span className="rounded-e-xl border border-s-0 border-slate-300 bg-slate-100 px-3 py-2.5 font-mono text-sm text-slate-500 dark:border-white/15 dark:bg-white/10 dark:text-slate-300">
              /{flagString}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={locale === "ar" ? "الأعلام" : "Flags"}>
          {(
            [
              { key: "g", hint: { en: "global (all matches)", ar: "عام (كل المطابقات)" } },
              { key: "i", hint: { en: "ignore case", ar: "تجاهل حالة الأحرف" } },
              { key: "m", hint: { en: "multiline ^ $", ar: "متعدد الأسطر ^ $" } },
              { key: "s", hint: { en: "dot matches newline", ar: "النقطة تطابق سطرًا جديدًا" } },
              { key: "u", hint: { en: "unicode", ar: "يونيكود" } },
            ] as const
          ).map((flag) => (
            <button
              key={flag.key}
              type="button"
              title={flag.hint[locale]}
              onClick={() => setFlags((prev) => ({ ...prev, [flag.key]: !prev[flag.key] }))}
              className={`cursor-pointer rounded-lg border px-2.5 py-1 font-mono text-sm font-semibold transition ${
                flags[flag.key]
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-100"
                  : "border-slate-300 text-slate-500 hover:border-brand-400 dark:border-white/15 dark:text-slate-400"
              }`}
            >
              {flag.key}
            </button>
          ))}
        </div>

        <div className="ms-auto flex flex-wrap gap-1.5">
          {presets.map((item, index) => (
            <button
              key={item.pattern}
              type="button"
              className="chip cursor-pointer hover:border-brand-400"
              onClick={() => {
                setPreset(index);
                setPattern(item.pattern);
                setText(item.sample);
                setFlags({ g: true, i: false, m: false, s: false, u: false });
              }}
            >
              <Wand2 className="size-3" />
              {item.label[locale]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="regex-text" className="label">
          {locale === "ar" ? "النص المراد اختباره" : "Test text"}
        </label>
        <textarea
          id="regex-text"
          dir="auto"
          spellCheck={false}
          className="code-area h-40"
          placeholder={locale === "ar" ? "الصق النص هنا…" : "Paste your text here…"}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </div>

      {limitError && (
        <Notice tone="warn">
          <p className="font-semibold">{dict.limits.filesTitle}</p>
          <p className="mt-1 text-[13px]">{limitError}</p>
        </Notice>
      )}

      {result.error && (
        <Notice tone="error">
          <p className="font-semibold">{locale === "ar" ? "خطأ في النمط" : "Pattern error"}</p>
          <p dir="ltr" className="mt-1 font-mono text-[12.5px]">
            {result.error}
          </p>
          <p className="mt-1 text-[13px]">{explainError(result.error)}</p>
        </Notice>
      )}

      {!result.error && !limitError && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="panel">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {locale === "ar" ? `المطابقات (${result.matches.length})` : `Matches (${result.matches.length})`}
              </h3>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => setCopiedMode(copiedMode === "highlight" ? "list" : "highlight")}
              >
                <RegexIcon className="size-3.5" />
                {copiedMode === "highlight" ? (locale === "ar" ? "قائمة" : "List") : locale === "ar" ? "عرض مميز" : "Highlight"}
              </button>
            </div>
            <div dir="auto" className="max-h-72 overflow-auto rounded-xl bg-slate-50 p-3.5 text-[13.5px] leading-7 whitespace-pre-wrap dark:bg-ink-950/70 dark:text-slate-100">
              {text ? (
                copiedMode === "highlight" ? (
                  segments.map((segment, i) =>
                    segment.match ? (
                      <mark key={i} className={`match ${segment.index! % 2 ? "alt" : ""}`}>
                        {segment.text}
                      </mark>
                    ) : (
                      <span key={i}>{segment.text}</span>
                    ),
                  )
                ) : (
                  <span>{result.matches.map((m) => m.value).join("\n")}</span>
                )
              ) : (
                <span className="text-slate-400">{locale === "ar" ? "لا يوجد نص بعد" : "No text yet"}</span>
              )}
            </div>
          </div>

          <div className="panel">
            <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {locale === "ar" ? "تفاصيل المطابقات والمجموعات" : "Match details and groups"}
            </h3>
            {result.matches.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {locale === "ar" ? "لا توجد مطابقات." : "No matches found."}
              </p>
            ) : (
              <ol className="max-h-72 space-y-2 overflow-auto">
                {result.matches.map((match, index) => (
                  <li key={`${match.index}-${index}`} className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="badge">#{index + 1}</span>
                      <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                        {locale === "ar" ? `الموضع ${match.index}` : `index ${match.index}`}
                      </span>
                    </div>
                    <p dir="ltr" className="mt-1.5 break-all font-mono text-[12.5px] text-slate-800 dark:text-slate-100">
                      {match.value || "∅"}
                    </p>
                    {match.groups.length > 0 && (
                      <ul className="mt-2 space-y-1 border-t border-slate-200 pt-2 dark:border-white/10">
                        {match.groups.map((group, gi) => (
                          <li key={gi} className="flex items-baseline justify-between gap-3 text-[12.5px]">
                            <span className="text-slate-500 dark:text-slate-400">
                              {group.name ?? `${locale === "ar" ? "مجموعة" : "group"} ${group.index}`}
                            </span>
                            <span dir="ltr" className="truncate font-mono text-slate-800 dark:text-slate-100">
                              {group.value ?? "undefined"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <CopyButton
          text={result.matches.map((m) => m.value).join("\n")}
          label={locale === "ar" ? "نسخ المطابقات" : "Copy matches"}
          copiedLabel={dict.actions.copied}
        />
        <CopyButton
          text={`/${pattern}/${flagString}`}
          label={locale === "ar" ? "نسخ النمط" : "Copy pattern"}
          copiedLabel={dict.actions.copied}
        />
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => {
            setPattern(presets[preset].pattern);
            setText(presets[preset].sample);
          }}
        >
          <AlertTriangle className="size-3.5" />
          {locale === "ar" ? "استعادة المثال" : "Reset to example"}
        </button>
      </div>

      {limitReached !== null && <LimitNotice locale={locale} limit={limitReached} />}
    </div>
  );
}
