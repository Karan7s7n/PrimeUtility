"use client";

import { Download, QrCode } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CopyButton, Field, LimitNotice, Notice, Segmented, Slider } from "@/components/tools/ui";
import { dictionaries } from "@/lib/i18n";
import { useRunTracker } from "@/lib/session";
import type { Locale } from "@/lib/site";
import { downloadDataUrl, downloadText } from "@/lib/utils";

type QrType = "url" | "text" | "email" | "phone" | "wifi";

export function QrCodeGenerator({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale];
  const [type, setType] = useState<QrType>("url");
  const [url, setUrl] = useState("https://example.com");
  const [text, setText] = useState("");
  const [email, setEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [phone, setPhone] = useState("");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [hidden, setHidden] = useState(false);
  const [encryption, setEncryption] = useState<"WPA" | "WEP" | "nopass">("WPA");

  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(2);
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [dark, setDark] = useState("#0f172a");
  const [light, setLight] = useState("#ffffff");

  const { track, limitReached } = useRunTracker("qr-code-generator");
  const [png, setPng] = useState("");
  const [svg, setSvg] = useState("");

  const payload = useMemo(() => {
    switch (type) {
      case "url":
        return url.trim();
      case "text":
        return text;
      case "email":
        return email.trim()
          ? `mailto:${email.trim()}${emailSubject.trim() ? `?subject=${encodeURIComponent(emailSubject.trim())}` : ""}`
          : "";
      case "phone":
        return phone.trim() ? `tel:${phone.replace(/[^\d+]/g, "")}` : "";
      case "wifi": {
        if (!ssid.trim()) return "";
        const escape = (value: string) => value.replace(/([\\;,":])/g, "\\$1");
        const passwordPart = encryption === "nopass" ? "" : `P:${escape(password)};`;
        return `WIFI:T:${encryption};S:${escape(ssid)};${passwordPart}${hidden ? "H:true;" : ""};`;
      }
    }
  }, [type, url, text, email, emailSubject, phone, ssid, password, hidden, encryption]);

  useEffect(() => {
    let cancelled = false;
    if (!payload.trim()) {
      setPng("");
      setSvg("");
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const options = { errorCorrectionLevel: level, margin, color: { dark, light } };
        const [pngResult, svgResult] = await Promise.all([
          QRCode.toDataURL(payload, { ...options, width: size }),
          QRCode.toString(payload, { ...options, type: "svg" }),
        ]);
        if (!cancelled) {
          setPng(pngResult);
          setSvg(svgResult);
        }
      } catch {
        if (!cancelled) {
          setPng("");
          setSvg("");
        }
      }
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [payload, level, margin, dark, light, size]);

  const fileBase = type === "wifi" ? ssid.replace(/\s+/g, "-") || "wifi" : "qr-code";

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <Segmented
          label={locale === "ar" ? "نوع المحتوى" : "Content type"}
          value={type}
          onChange={setType}
          options={[
            { value: "url", label: locale === "ar" ? "رابط" : "Link" },
            { value: "text", label: locale === "ar" ? "نص" : "Text" },
            { value: "email", label: locale === "ar" ? "بريد" : "Email" },
            { value: "phone", label: locale === "ar" ? "هاتف" : "Phone" },
            { value: "wifi", label: "Wi-Fi" },
          ]}
        />

        {type === "url" && (
          <Field label={locale === "ar" ? "الرابط" : "URL"} id="qr-url">
            <input
              id="qr-url"
              dir="ltr"
              className="input"
              placeholder="https://example.com"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          </Field>
        )}

        {type === "text" && (
          <Field label={locale === "ar" ? "النص" : "Text"} id="qr-text">
            <textarea
              id="qr-text"
              dir="auto"
              className="code-area h-28"
              placeholder={locale === "ar" ? "أي نص…" : "Any text…"}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </Field>
        )}

        {type === "email" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={locale === "ar" ? "البريد الإلكتروني" : "Email address"} id="qr-email">
              <input
                id="qr-email"
                dir="ltr"
                type="email"
                className="input"
                placeholder="hello@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label={locale === "ar" ? "الموضوع (اختياري)" : "Subject (optional)"} id="qr-subject">
              <input
                id="qr-subject"
                dir="auto"
                className="input"
                value={emailSubject}
                onChange={(event) => setEmailSubject(event.target.value)}
              />
            </Field>
          </div>
        )}

        {type === "phone" && (
          <Field label={locale === "ar" ? "رقم الهاتف" : "Phone number"} id="qr-phone">
            <input
              id="qr-phone"
              dir="ltr"
              className="input"
              placeholder="+20 100 123 4567"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </Field>
        )}

        {type === "wifi" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={locale === "ar" ? "اسم الشبكة (SSID)" : "Network name (SSID)"} id="qr-ssid">
              <input
                id="qr-ssid"
                dir="auto"
                className="input"
                value={ssid}
                onChange={(event) => setSsid(event.target.value)}
              />
            </Field>
            <Field label={locale === "ar" ? "نوع الحماية" : "Security"} id="qr-enc">
              <select
                id="qr-enc"
                className="input"
                value={encryption}
                onChange={(event) => setEncryption(event.target.value as "WPA" | "WEP" | "nopass")}
              >
                <option value="WPA">WPA / WPA2 / WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">{locale === "ar" ? "بدون كلمة مرور" : "No password"}</option>
              </select>
            </Field>
            {encryption !== "nopass" && (
              <Field label={locale === "ar" ? "كلمة المرور" : "Password"} id="qr-pass">
                <input
                  id="qr-pass"
                  dir="ltr"
                  className="input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>
            )}
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                className="size-4 accent-brand-600"
                checked={hidden}
                onChange={(event) => setHidden(event.target.checked)}
              />
              {locale === "ar" ? "شبكة مخفية" : "Hidden network"}
            </label>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Slider
            id="qr-size"
            label={locale === "ar" ? "حجم الصورة" : "Image size"}
            min={128}
            max={1024}
            step={32}
            suffix=" px"
            value={size}
            onChange={setSize}
          />
          <Slider
            id="qr-margin"
            label={locale === "ar" ? "الهامش" : "Quiet zone"}
            min={0}
            max={8}
            value={margin}
            onChange={setMargin}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={locale === "ar" ? "تصحيح الأخطاء" : "Error correction"} id="qr-level">
            <select
              id="qr-level"
              className="input"
              value={level}
              onChange={(event) => setLevel(event.target.value as "L" | "M" | "Q" | "H")}
            >
              <option value="L">L — 7%</option>
              <option value="M">M — 15%</option>
              <option value="Q">Q — 25%</option>
              <option value="H">H — 30%</option>
            </select>
          </Field>
          <Field label={locale === "ar" ? "لون الرمز" : "Code colour"} id="qr-dark">
            <input
              id="qr-dark"
              type="color"
              className="input h-11 p-1"
              value={dark}
              onChange={(event) => setDark(event.target.value)}
            />
          </Field>
          <Field label={locale === "ar" ? "لون الخلفية" : "Background"} id="qr-light">
            <input
              id="qr-light"
              type="color"
              className="input h-11 p-1"
              value={light}
              onChange={(event) => setLight(event.target.value)}
            />
          </Field>
        </div>

        <Notice tone="info">
          {locale === "ar"
            ? "الرموز ساكنة ولا تنتهي صلاحيتها: المحتوى مدمج داخل الرمز نفسه ولا يمر عبر أي خدمة توجيه."
            : "These are static codes with no expiry: the content is embedded in the pattern itself, with no redirect service in the middle."}
        </Notice>
      </div>

      <div className="panel flex flex-col items-center justify-start gap-4">
        {png ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={png}
            alt={locale === "ar" ? "رمز QR الناتج" : "Generated QR code"}
            width={size}
            height={size}
            className="aspect-square w-full max-w-xs rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10"
          />
        ) : (
          <div className="grid aspect-square w-full max-w-xs place-items-center rounded-xl border border-dashed border-slate-300 text-slate-400 dark:border-white/15">
            <QrCode className="size-10" />
          </div>
        )}

        <div className="flex w-full flex-col gap-2">
          <button
            type="button"
            className="btn-primary"
            disabled={!png}
            onClick={() => {
              downloadDataUrl(png, `${fileBase}.png`);
              void track({ outputSize: Math.round(png.length * 0.75) });
            }}
          >
            <Download className="size-4" />
            PNG
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={!svg}
            onClick={() => {
              downloadText(svg, `${fileBase}.svg`, "image/svg+xml");
              void track({ outputSize: svg.length });
            }}
          >
            <Download className="size-4" />
            SVG
          </button>
          <CopyButton
            text={payload}
            label={locale === "ar" ? "نسخ المحتوى" : "Copy content"}
            copiedLabel={dict.actions.copied}
          />
        </div>

        {payload && (
          <p dir="ltr" className="w-full break-all rounded-xl bg-slate-50 p-3 font-mono text-[11.5px] text-slate-500 dark:bg-ink-950/60 dark:text-slate-400">
            {payload}
          </p>
        )}

        {limitReached !== null && (
          <div className="w-full">
            <LimitNotice locale={locale} limit={limitReached} />
          </div>
        )}
      </div>
    </div>
  );
}
