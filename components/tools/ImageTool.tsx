"use client";

import { Download, Images, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Field, FileDrop, LimitNotice, Notice, Slider, Stat } from "@/components/tools/ui";
import { dictionaries } from "@/lib/i18n";
import { IMAGE_LIMITS } from "@/lib/limits";
import {
  detectFormat,
  formatExtension,
  formatLabel,
  renderImage,
  type ImageFormat,
  type RenderedImage,
} from "@/lib/images";
import { useRunTracker } from "@/lib/session";
import type { Locale } from "@/lib/site";
import { baseName, downloadBlob, formatBytes, percentChange } from "@/lib/utils";

interface Item {
  id: string;
  file: File;
  result?: RenderedImage;
  /** Format actually produced — may differ from the source when PNG cannot shrink. */
  format?: ImageFormat;
  error?: string;
}

export function ImageTool({ locale, mode }: { locale: Locale; mode: "compress" | "convert" }) {
  const dict = dictionaries[locale];
  const [items, setItems] = useState<Item[]>([]);
  const [quality, setQuality] = useState(78);
  const [maxWidth, setMaxWidth] = useState<number | "">("");
  const [target, setTarget] = useState<ImageFormat | "auto">(mode === "convert" ? "image/webp" : "auto");
  const [busy, setBusy] = useState(false);
  const [notImages, setNotImages] = useState<string[]>([]);
  const { track, limitReached } = useRunTracker(mode === "compress" ? "image-compressor" : "image-converter");

  const isCompress = mode === "compress";

  const process = async (list: Item[], formatChoice: ImageFormat | "auto") => {
    setBusy(true);
    const next: Item[] = [];
    for (const item of list) {
      try {
        const source = detectFormat(item.file);
        let format = formatChoice === "auto" ? source : formatChoice;
        let result = await renderImage(item.file, {
          format,
          quality: quality / 100,
          maxWidth: typeof maxWidth === "number" ? maxWidth : undefined,
        });

        // A PNG re-encoded as PNG often does not get smaller at all. When the
        // visitor asked to compress and keep the format, quietly try WebP — the
        // result is only kept if it really is smaller.
        if (isCompress && formatChoice === "auto" && format === "image/png" && result.blob.size >= item.file.size) {
          const alternative = await renderImage(item.file, {
            format: "image/webp",
            quality: quality / 100,
            maxWidth: typeof maxWidth === "number" ? maxWidth : undefined,
          });
          if (alternative.blob.size < result.blob.size) {
            URL.revokeObjectURL(result.url);
            result = alternative;
            format = "image/webp";
          } else {
            URL.revokeObjectURL(alternative.url);
          }
        }

        next.push({ ...item, result, format, error: undefined });
      } catch (error) {
        next.push({
          ...item,
          result: undefined,
          error: error instanceof Error ? error.message : dict.actions.error,
        });
      }
    }
    setItems(next);
    setBusy(false);

    const produced = next.filter((entry) => entry.result);
    if (produced.length > 0) {
      await track({
        inputSize: produced.reduce((sum, entry) => sum + entry.file.size, 0),
        outputSize: produced.reduce((sum, entry) => sum + (entry.result?.blob.size ?? 0), 0),
      });
    }
  };

  const addFiles = (files: File[]) => {
    const accepted = files.filter((file) => file.type.startsWith("image/"));
    const rejectedNames = files.filter((file) => !file.type.startsWith("image/")).map((file) => file.name);
    setNotImages(rejectedNames);
    if (accepted.length === 0) return;
    const fresh = accepted.map((file) => ({ id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`, file }));
    const combined = [...items, ...fresh];
    setItems(combined);
    void process(combined, target);
  };

  const clearAll = () => {
    items.forEach((item) => item.result && URL.revokeObjectURL(item.result.url));
    setItems([]);
  };

  const downloadAll = async () => {
    const ready = items.filter((item) => item.result);
    for (const item of ready) {
      const format = item.format ?? detectFormat(item.file);
      downloadBlob(item.result!.blob, `${baseName(item.file.name)}.${formatExtension(format)}`);
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  };

  const totalBefore = items.reduce((sum, item) => sum + item.file.size, 0);
  const totalAfter = items.reduce((sum, item) => sum + (item.result?.blob.size ?? 0), 0);
  const saved = totalBefore && totalAfter ? percentChange(totalBefore, totalAfter) : 0;

  return (
    <div className="space-y-5">
      <FileDrop
        multiple
        accept="image/*"
        locale={locale}
        limits={IMAGE_LIMITS}
        existing={items.map((item) => ({ size: item.file.size }))}
        onFiles={addFiles}
        title={isCompress ? (locale === "ar" ? "أفلِت صورك هنا" : "Drop your images here") : dict.actions.uploadFiles}
        hint={
          locale === "ar"
            ? "JPG · PNG · WebP — تعالج داخل المتصفح ولا تُرفع"
            : "JPG · PNG · WebP — processed in your browser, never uploaded"
        }
        icon={<Images className="size-6" aria-hidden="true" />}
      />

      {notImages.length > 0 && (
        <Notice tone="warn">
          <p className="font-semibold">{dict.limits.filesTitle}</p>
          <ul className="mt-1 list-disc space-y-0.5 ps-5 text-[13px]">
            {notImages.map((name) => (
              <li key={name}>{dict.limits.notAnImage.replace("{name}", name)}</li>
            ))}
          </ul>
        </Notice>
      )}

      <div className="panel grid gap-4 sm:grid-cols-3">
        <Field
          label={locale === "ar" ? "الصيغة الناتجة" : "Output format"}
          id="img-format"
          hint={
            isCompress
              ? locale === "ar"
                ? "أبقِ الصيغة كما هي أو حوّل إلى WebP لتوفير أكبر."
                : "Keep the original format or switch to WebP for a bigger saving."
              : locale === "ar"
                ? "WebP تعطي أصغر حجم لمعظم الصور."
                : "WebP gives the smallest file for most images."
          }
        >
          <select
            id="img-format"
            className="input"
            value={target}
            onChange={(event) => setTarget(event.target.value as ImageFormat | "auto")}
          >
            {(isCompress
              ? [
                  { value: "auto", label: locale === "ar" ? "كما هي (بدون تحويل)" : "Keep original format" },
                  { value: "image/webp", label: "WebP" },
                  { value: "image/jpeg", label: "JPG" },
                  { value: "image/png", label: "PNG" },
                ]
              : [
                  { value: "image/webp", label: "WebP" },
                  { value: "image/jpeg", label: "JPG" },
                  { value: "image/png", label: "PNG" },
                ]
            ).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="self-end pb-1">
          <Slider
            id="img-quality"
            label={locale === "ar" ? "الجودة" : "Quality"}
            min={30}
            max={100}
            suffix="%"
            value={quality}
            onChange={setQuality}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {quality >= 90
              ? locale === "ar"
                ? "أعلى جودة، حجم أكبر."
                : "Highest quality, larger file."
              : quality >= 70
                ? locale === "ar"
                  ? "التوازن المناسب لأغلب الصور."
                  : "The sweet spot for most images."
                : locale === "ar"
                  ? "حجم أصغر مع احتمال ظهور تشويش."
                  : "Smaller file, some visible artefacts."}
          </p>
        </div>

        <Field
          label={locale === "ar" ? "أقصى عرض (اختياري)" : "Maximum width (optional)"}
          id="img-width"
          hint={locale === "ar" ? "مثال: 1600 لصور الويب." : "For example 1600 for web images."}
        >
          <input
            id="img-width"
            type="number"
            min={64}
            max={8000}
            className="input"
            placeholder={locale === "ar" ? "بدون تغيير" : "No resizing"}
            value={maxWidth}
            onChange={(event) => setMaxWidth(event.target.value === "" ? "" : Number(event.target.value))}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" disabled={items.length === 0 || busy} onClick={() => void process(items, target)}>
          <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />
          {busy
            ? dict.actions.processing
            : isCompress
              ? locale === "ar"
                ? "أعد الضغط بالإعدادات الحالية"
                : "Apply these settings"
              : locale === "ar"
                ? "حوّل الآن"
                : "Convert now"}
        </button>
        {items.length > 0 && (
          <>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => void downloadAll()}>
              <Download className="size-4" />
              {dict.actions.downloadAll}
            </button>
            <button type="button" className="btn-ghost" onClick={clearAll}>
              <Trash2 className="size-4" />
              {dict.actions.clear}
            </button>
          </>
        )}
      </div>

      {items.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label={locale === "ar" ? "الحجم الأصلي" : "Original size"} value={formatBytes(totalBefore)} />
          <Stat
            label={locale === "ar" ? "الحجم بعد المعالجة" : "After processing"}
            value={formatBytes(totalAfter)}
            tone="brand"
          />
          <Stat
            label={locale === "ar" ? "التوفير" : "Saved"}
            value={`${saved.toFixed(1)}%`}
            tone={saved > 0 ? "good" : "default"}
          />
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="panel flex flex-col gap-3 sm:flex-row sm:items-center">
            {item.result && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.result.url}
                alt={item.file.name}
                className="size-20 shrink-0 rounded-xl border border-slate-200 object-cover dark:border-white/10"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{item.file.name}</p>
              {item.error ? (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{item.error}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {formatBytes(item.file.size)}
                  {item.result && (
                    <>
                      {" → "}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {formatBytes(item.result.blob.size)}
                      </span>
                      {" · "}
                      {item.result.width}×{item.result.height}
                      {item.format && item.format !== detectFormat(item.file) && (
                        <>
                          {" · "}
                          <span className="font-semibold text-brand-700 dark:text-brand-300">
                            {formatLabel(item.format)}
                          </span>
                        </>
                      )}
                      {" · "}
                      <span className={percentChange(item.file.size, item.result.blob.size) > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                        {percentChange(item.file.size, item.result.blob.size) > 0
                          ? `−${percentChange(item.file.size, item.result.blob.size).toFixed(1)}%`
                          : `+${Math.abs(percentChange(item.file.size, item.result.blob.size)).toFixed(1)}%`}
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {item.result && (
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => {
                    const format = item.format ?? detectFormat(item.file);
                    downloadBlob(item.result!.blob, `${baseName(item.file.name)}.${formatExtension(format)}`);
                  }}
                >
                  <Download className="size-3.5" />
                  {formatLabel(item.format ?? detectFormat(item.file))}
                </button>
              )}
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => {
                  if (item.result) URL.revokeObjectURL(item.result.url);
                  setItems((prev) => prev.filter((entry) => entry.id !== item.id));
                }}
                aria-label={dict.actions.remove}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length > 0 && saved <= 0 && (
        <Notice tone="warn">
          {locale === "ar"
            ? "لم ينخفض الحجم. جرّب رفع نسبة الجودة أو استخدام WebP، أو لاحظ أن ملفات PNG المحسّنة أصلًا قد لا تستفيد من الضغط بفقدان."
            : "The file did not get smaller. Try a lower quality or WebP — and note an already-optimised PNG may not benefit from lossy compression at all."}
        </Notice>
      )}

      {limitReached !== null && <LimitNotice locale={locale} limit={limitReached} />}

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {locale === "ar"
          ? "ملاحظة: إعادة الترميز تحذف بيانات EXIF مثل موقع التصوير ونوع الكاميرا، وتثبّت اتجاه الصورة الصحيح."
          : "Note: re-encoding removes EXIF data such as camera and GPS information, and bakes in the correct orientation."}
      </p>
    </div>
  );
}
