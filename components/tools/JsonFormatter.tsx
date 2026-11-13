"use client";

import { Braces, Eraser, FileJson, Minimize2, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { CopyButton, LimitNotice, Notice, Segmented } from "@/components/tools/ui";
import { dictionaries } from "@/lib/i18n";
import { JSON_LIMITS } from "@/lib/limits";
import { useRunTracker } from "@/lib/session";
import type { Locale } from "@/lib/site";
import { downloadText, formatBytes } from "@/lib/utils";

interface ParseIssue {
  message: string;
  line: number;
  column: number;
  snippet: string;
}

const sample = `{
  "project": "Digital Tools Platform",
  "version": 1,
  "tools": ["json-formatter", "jwt-decoder", "pdf-compressor"],
  "clientSide": true,
  "limits": { "guest": 5, "free": 20, "pro": 500 },
  "owner": { "name": "Nour", "active": true }
}`;

function locate(text: string, error: unknown): ParseIssue {
  const message = error instanceof Error ? error.message : String(error);
  const positionMatch = /position (\d+)/.exec(message);
  const lineMatch = /line (\d+) column (\d+)/.exec(message);

  let line = 1;
  let column = 1;

  if (lineMatch) {
    line = Number(lineMatch[1]);
    column = Number(lineMatch[2]);
  } else if (positionMatch) {
    const position = Number(positionMatch[1]);
    const before = text.slice(0, position);
    const lines = before.split("\n");
    line = lines.length;
    column = lines[lines.length - 1].length + 1;
  }

  const sourceLine = text.split("\n")[line - 1] ?? "";
  const clean = message.replace(/^JSON\.parse:\s*/, "");

  return {
    message: clean,
    line,
    column,
    snippet: `${sourceLine}\n${" ".repeat(Math.max(0, column - 1))}^`,
  };
}

export function JsonFormatter({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale];
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState<"2" | "4">("2");
  const [issue, setIssue] = useState<ParseIssue | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);
  const [status, setStatus] = useState("");
  const [limitError, setLimitError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { track, limitReached } = useRunTracker("json-formatter");

  const inputSize = useMemo(() => new TextEncoder().encode(input).length, [input]);

  const run = (mode: "format" | "minify" | "validate") => {
    const text = input.trim();
    if (new TextEncoder().encode(text).byteLength > JSON_LIMITS.maxBytes) {
      setLimitError(dict.limits.jsonTooLarge.replace("{max}", formatBytes(JSON_LIMITS.maxBytes)));
      setIssue(null);
      setOutput("");
      setStatus("");
      return;
    }
    setLimitError("");
    if (!text) {
      setIssue(null);
      setValid(null);
      setStatus("");
      setOutput("");
      return;
    }
    try {
      const parsed: unknown = JSON.parse(text);
      setIssue(null);
      setValid(true);
      if (mode === "validate") {
        setStatus(locale === "ar" ? "ملف JSON صحيح وسليم." : "Valid JSON — no problems found.");
        return;
      }
      const result = mode === "minify" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, Number(indent));
      setOutput(result);
      void track({ inputSize, outputSize: new TextEncoder().encode(result).length });
      setStatus(
        mode === "minify"
          ? locale === "ar"
            ? `تم التصغير إلى ${formatBytes(new TextEncoder().encode(result).length)}.`
            : `Minified to ${formatBytes(new TextEncoder().encode(result).length)}.`
          : locale === "ar"
            ? "تم التنسيق بنجاح."
            : "Formatted successfully.",
      );
    } catch (error) {
      setValid(false);
      setOutput("");
      setStatus("");
      setIssue(locate(input, error));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-primary" onClick={() => run("format")}>
          <Sparkles className="size-4" />
          {locale === "ar" ? "تنسيق" : "Format"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => run("minify")}>
          <Minimize2 className="size-4" />
          {locale === "ar" ? "تصغير" : "Minify"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => run("validate")}>
          <ShieldCheck className="size-4" />
          {locale === "ar" ? "فحص" : "Validate"}
        </button>
        <Segmented
          label={locale === "ar" ? "عدد المسافات" : "Indentation"}
          value={indent}
          onChange={setIndent}
          options={[
            { value: "2", label: "2" },
            { value: "4", label: "4" },
          ]}
        />
        <div className="ms-auto flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json,text/plain"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              if (file.size > JSON_LIMITS.maxBytes) {
                setLimitError(dict.limits.jsonTooLarge.replace("{max}", formatBytes(JSON_LIMITS.maxBytes)));
                setOutput("");
                setIssue(null);
                setStatus("");
                return;
              }
              setLimitError("");
              setInput(await file.text());
              setOutput("");
              setIssue(null);
              setValid(null);
              setStatus("");
            }}
          />
          <button type="button" className="btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
            <Upload className="size-3.5" />
            {locale === "ar" ? "تحميل ملف" : "Load file"}
          </button>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => {
              setInput(sample);
              setOutput("");
              setIssue(null);
              setValid(null);
              setStatus("");
            }}
          >
            <FileJson className="size-3.5" />
            {locale === "ar" ? "مثال" : "Example"}
          </button>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => {
              setInput("");
              setOutput("");
              setIssue(null);
              setValid(null);
              setStatus("");
            }}
          >
            <Eraser className="size-3.5" />
            {dict.actions.clear}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="json-input"
              className="text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              {locale === "ar" ? "الملف الأصلي" : "Input JSON"}
            </label>
            <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">{formatBytes(inputSize)}</span>
          </div>
          <textarea
            id="json-input"
            className="code-area h-80"
            dir="ltr"
            spellCheck={false}
            placeholder='{ "hello": "world" }'
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {locale === "ar" ? "النتيجة" : "Result"}
            </span>
            <CopyButton
              text={output}
              label={dict.actions.copy}
              copiedLabel={dict.actions.copied}
            />
          </div>
          <textarea
            className="code-area h-80 bg-slate-50/80 dark:bg-ink-950/50"
            dir="ltr"
            readOnly
            spellCheck={false}
            placeholder={locale === "ar" ? "ستظهر النتيجة هنا" : "The result appears here"}
            value={output}
          />
          {output && (
            <button
              type="button"
              className="btn-secondary btn-sm mt-2"
              onClick={() => downloadText(output, "formatted.json", "application/json")}
            >
              {dict.actions.download} .json
            </button>
          )}
        </div>
      </div>

      {limitError && (
        <Notice tone="warn">
          <p className="font-semibold">{dict.limits.filesTitle}</p>
          <p className="mt-1 text-[13px]">{limitError}</p>
        </Notice>
      )}

      {issue && (
        <Notice tone="error">
          <p className="font-semibold">
            {locale === "ar" ? "ملف JSON غير صحيح" : "Invalid JSON"} —{" "}
            {locale === "ar" ? `السطر ${issue.line}، العمود ${issue.column}` : `line ${issue.line}, column ${issue.column}`}
          </p>
          <p className="mt-1 text-[13px]">{issue.message}</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-white/70 p-2.5 text-[12px] leading-5 text-rose-900 dark:bg-black/30 dark:text-rose-200" dir="ltr">
            {issue.snippet}
          </pre>
        </Notice>
      )}

      {status && (
        <Notice tone="success">
          <p>{status}</p>
        </Notice>
      )}

      {limitReached !== null && <LimitNotice locale={locale} limit={limitReached} />}

      <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Braces className="size-3.5" />
        {locale === "ar"
          ? "الأداة تعمل داخل متصفحك ولا ترسل أي نص إلى الخادم."
          : "Everything runs in your browser — the JSON is never sent anywhere."}
      </p>
    </div>
  );
}
