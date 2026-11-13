"use client";

import { Clock, KeyRound, ShieldAlert, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CopyButton, LimitNotice, Notice, Stat } from "@/components/tools/ui";
import { dictionaries } from "@/lib/i18n";
import { useRunTracker } from "@/lib/session";
import type { Locale } from "@/lib/site";

const sample =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ik5vdXIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDUzMjAwMDAsImV4cCI6MjA1MDk2MDAwMH0.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

function decodeSegment(segment: string): unknown {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

const asObject = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

export function JwtDecoder({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale];
  const [token, setToken] = useState("");
  const { trackOnce, limitReached } = useRunTracker("jwt-decoder");

  const decoded = useMemo(() => {
    const raw = token.trim().replace(/^Bearer\s+/i, "");
    if (!raw) return { state: "empty" as const };
    const parts = raw.split(".");
    if (parts.length < 2) return { state: "malformed" as const };
    try {
      return {
        state: "ok" as const,
        header: decodeSegment(parts[0]),
        payload: decodeSegment(parts[1]),
        signature: parts[2] ?? "",
      };
    } catch {
      return { state: "malformed" as const };
    }
  }, [token]);

  useEffect(() => {
    if (decoded.state === "ok") void trackOnce();
  }, [decoded.state, trackOnce]);

  const payload = decoded.state === "ok" ? asObject(decoded.payload) : null;
  const iat = payload && typeof payload.iat === "number" ? payload.iat : null;
  const exp = payload && typeof payload.exp === "number" ? payload.exp : null;
  const now = Math.floor(Date.now() / 1000);
  const expired = exp !== null && exp < now;

  const formatTime = (seconds: number) =>
    new Date(seconds * 1000).toLocaleString(locale === "ar" ? "ar-EG" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const remaining = (seconds: number) => {
    const diff = seconds - now;
    const absolute = Math.abs(diff);
    const days = Math.floor(absolute / 86400);
    const hours = Math.floor((absolute % 86400) / 3600);
    const minutes = Math.floor((absolute % 3600) / 60);
    const parts = [] as string[];
    if (days) parts.push(locale === "ar" ? `${days} يوم` : `${days}d`);
    if (hours) parts.push(locale === "ar" ? `${hours} ساعة` : `${hours}h`);
    if (!days && minutes) parts.push(locale === "ar" ? `${minutes} دقيقة` : `${minutes}m`);
    return parts.join(" ") || (locale === "ar" ? "أقل من دقيقة" : "less than a minute");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-secondary btn-sm" onClick={() => setToken(sample)}>
          <KeyRound className="size-3.5" />
          {locale === "ar" ? "مثال" : "Example token"}
        </button>
        <button type="button" className="btn-ghost btn-sm" onClick={() => setToken("")}>
          <Trash2 className="size-3.5" />
          {dict.actions.clear}
        </button>
      </div>

      <div>
        <label htmlFor="jwt-input" className="label">
          {locale === "ar" ? "التوكن (JWT)" : "Token (JWT)"}
        </label>
        <textarea
          id="jwt-input"
          dir="ltr"
          spellCheck={false}
          className="code-area h-32 break-all"
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.signature"
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />
      </div>

      {decoded.state === "malformed" && (
        <Notice tone="error">
          {locale === "ar"
            ? "هذا ليس توكن JWT صالحًا. يتكون التوكن من ثلاثة أجزاء يفصل بينها نقطتان: الرأس ثم الحمولة ثم التوقيع."
            : "This does not look like a JWT. A token has three dot-separated parts: header, payload and signature."}
        </Notice>
      )}

      {decoded.state === "ok" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label={locale === "ar" ? "الحالة" : "Status"}
              tone={exp === null ? "default" : expired ? "bad" : "good"}
              value={
                exp === null
                  ? locale === "ar"
                    ? "بلا تاريخ انتهاء"
                    : "No expiry"
                  : expired
                    ? locale === "ar"
                      ? "منتهي"
                      : "Expired"
                    : locale === "ar"
                      ? "صالح"
                      : "Valid"
              }
              hint={exp === null ? undefined : remaining(exp)}
            />
            <Stat
              label="alg"
              value={String(asObject(decoded.header)?.alg ?? "—")}
              hint={locale === "ar" ? "خوارزمية التوقيع" : "signing algorithm"}
            />
            <Stat
              label="typ"
              value={String(asObject(decoded.header)?.typ ?? "—")}
              hint={locale === "ar" ? "نوع التوكن" : "token type"}
            />
            <Stat
              label={locale === "ar" ? "طول التوقيع" : "Signature length"}
              value={`${decoded.signature.length}`}
              hint={locale === "ar" ? "حرف" : "characters"}
            />
          </div>

          {exp !== null && (
            <Notice tone={expired ? "error" : "info"}>
              <p className="flex items-center gap-2">
                <Clock className="size-4 shrink-0" />
                <span>
                  <strong>exp:</strong> {formatTime(exp)} —{" "}
                  {expired
                    ? locale === "ar"
                      ? `انتهى منذ ${remaining(exp)}`
                      : `expired ${remaining(exp)} ago`
                    : locale === "ar"
                      ? `يتبقى ${remaining(exp)}`
                      : `${remaining(exp)} remaining`}
                </span>
              </p>
              {iat !== null && (
                <p className="mt-1 text-[13px]">
                  <strong>iat:</strong> {formatTime(iat)}
                  {payload && typeof payload.nbf === "number" && (
                    <>
                      {" · "}
                      <strong>nbf:</strong> {formatTime(payload.nbf as number)}
                    </>
                  )}
                </p>
              )}
            </Notice>
          )}

          {iat === null && (
            <Notice tone="warn">
              {locale === "ar"
                ? "لا يحتوي هذا التوكن على حقل iat أو exp، لذا لا يمكن معرفة صلاحيته من وقت الإصدار."
                : "This token has no iat or exp claim, so its lifetime cannot be judged from the token alone."}
            </Notice>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {[
              { title: locale === "ar" ? "الرأس (Header)" : "Header", value: decoded.header },
              { title: locale === "ar" ? "الحمولة (Payload)" : "Payload", value: decoded.payload },
            ].map((block) => (
              <div key={block.title} className="panel">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{block.title}</h3>
                  <CopyButton
                    text={JSON.stringify(block.value, null, 2)}
                    label={dict.actions.copy}
                    copiedLabel={dict.actions.copied}
                  />
                </div>
                <pre
                  dir="ltr"
                  className="max-h-72 overflow-auto rounded-xl bg-slate-50 p-3.5 text-[12.5px] leading-6 text-slate-800 dark:bg-ink-950/70 dark:text-slate-100"
                >
                  {JSON.stringify(block.value, null, 2)}
                </pre>
              </div>
            ))}
          </div>

          <div className="panel">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {locale === "ar" ? "التوقيع (Signature)" : "Signature"}
              </h3>
              <CopyButton
                text={decoded.signature}
                label={dict.actions.copy}
                copiedLabel={dict.actions.copied}
              />
            </div>
            <p dir="ltr" className="break-all font-mono text-[12.5px] text-slate-600 dark:text-slate-300">
              {decoded.signature || (locale === "ar" ? "غير موجود" : "not present")}
            </p>
          </div>

          <Notice tone="warn">
            <p className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              <span>
                {locale === "ar"
                  ? "تنبيه مهم: فك التوكن لا يعني التحقق منه. أي شخص يمكنه قراءة هذه البيانات، ولا يُثبت أنها صادرة من جهتك إلا بالتحقق من التوقيع على الخادم باستخدام المفتاح السري أو المفتاح العام."
                  : "Important: decoding is not verification. Anyone can read this data, and only a signature check on your server — with the secret or public key — proves who issued the token."}
              </span>
            </p>
          </Notice>
        </>
      )}

      {limitReached !== null && <LimitNotice locale={locale} limit={limitReached} />}
    </div>
  );
}
