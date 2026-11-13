"use client";

import { Download, FileDown, Gauge, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Field, FileDrop, LimitNotice, Notice, Segmented, Slider, Stat } from "@/components/tools/ui";
import { dictionaries } from "@/lib/i18n";
import { exceedsPageLimit, PDF_LIMITS, SINGLE_PDF_LIMITS } from "@/lib/limits";
import { loadPdfjs } from "@/lib/pdf";
import { useRunTracker } from "@/lib/session";
import type { Locale } from "@/lib/site";
import { baseName, downloadBlob, formatBytes, percentChange } from "@/lib/utils";

type Mode = "safe" | "strong";

export function PdfCompressor({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale];
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>("safe");
  const [dpi, setDpi] = useState(150);
  const [quality, setQuality] = useState(72);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<{ blob: Blob; pages: number } | null>(null);
  const [error, setError] = useState("");
  const { track, limitReached } = useRunTracker("pdf-compressor");

  const reset = () => {
    setFile(null);
    setResult(null);
    setError("");
    setProgress("");
  };

  const compress = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      if (file.size > PDF_LIMITS.maxFileBytes) {
        setError(
          dict.limits.pdfTooLarge.replace("{max}", formatBytes(PDF_LIMITS.maxFileBytes)),
        );
        return;
      }

      if (mode === "safe") {
        setProgress(locale === "ar" ? "إعادة بناء بنية الملف…" : "Rebuilding the file structure…");
        const { PDFDocument } = await import("pdf-lib");
        const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
        if (exceedsPageLimit(doc.getPageCount(), PDF_LIMITS.maxPages)) {
          setError(dict.limits.pdfTooManyPages.replace("{max}", String(PDF_LIMITS.maxPages)));
          return;
        }
        doc.setProducer("PrimeUtility");
        doc.setCreator("PrimeUtility");
        doc.setTitle("");
        doc.setSubject("");
        doc.setKeywords([]);
        const bytes = await doc.save({ useObjectStreams: true, objectsPerTick: 200 });
        const output = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
        setResult({ blob: output, pages: doc.getPageCount() });
        void track({ inputSize: file.size, outputSize: output.size });
      } else {
        const pdfjs = await loadPdfjs();
        const { PDFDocument } = await import("pdf-lib");
        const source = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
        if (exceedsPageLimit(source.numPages, PDF_LIMITS.maxPages)) {
          setError(dict.limits.pdfTooManyPages.replace("{max}", String(PDF_LIMITS.maxPages)));
          return;
        }
        const target = await PDFDocument.create();

        for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
          setProgress(
            locale === "ar"
              ? `معالجة الصفحة ${pageNumber} من ${source.numPages}…`
              : `Processing page ${pageNumber} of ${source.numPages}…`,
          );
          const page = await source.getPage(pageNumber);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: dpi / 72 });

          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.floor(viewport.width));
          canvas.height = Math.max(1, Math.floor(viewport.height));
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas is not available in this browser");
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({ canvasContext: context, viewport }).promise;
          const jpeg = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", quality / 100),
          );
          if (!jpeg) throw new Error("The browser could not encode a page image");

          const embedded = await target.embedJpg(new Uint8Array(await jpeg.arrayBuffer()));
          const newPage = target.addPage([base.width, base.height]);
          newPage.drawImage(embedded, { x: 0, y: 0, width: base.width, height: base.height });
        }

        target.setProducer("PrimeUtility");
        target.setCreator("PrimeUtility");
        const bytes = await target.save({ useObjectStreams: true });
        const output = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
        setResult({ blob: output, pages: target.getPageCount() });
        void track({ inputSize: file.size, outputSize: output.size });
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : locale === "ar"
            ? "تعذّرت معالجة الملف. تأكد أنه ليس محميًا بكلمة مرور."
            : "The file could not be processed. Check that it is not password protected.",
      );
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  const saved = result ? percentChange(file!.size, result.blob.size) : 0;

  return (
    <div className="space-y-5">
      {!file ? (
        <FileDrop
          accept="application/pdf,.pdf"
          onFiles={(files) => {
            setFile(files[0]);
            setResult(null);
            setError("");
          }}
          locale={locale}
          limits={SINGLE_PDF_LIMITS}
          title={locale === "ar" ? "أفلِت ملف PDF هنا" : "Drop your PDF here"}
          hint={locale === "ar" ? "ملف واحد في كل مرة — يبقى داخل متصفحك" : "One file at a time — it stays inside your browser"}
          icon={<FileDown className="size-6" aria-hidden="true" />}
        />
      ) : (
        <>
          <div className="panel flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{file.name}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</p>
            </div>
            <button type="button" className="btn-ghost btn-sm" onClick={reset}>
              {dict.actions.tryAgain}
            </button>
          </div>

          <div className="panel space-y-4">
            <Segmented
              label={locale === "ar" ? "مستوى الضغط" : "Compression level"}
              value={mode}
              onChange={setMode}
              options={[
                { value: "safe", label: locale === "ar" ? "آمن (يحفظ النص)" : "Safe (keeps text)" },
                { value: "strong", label: locale === "ar" ? "قوي (صور)" : "Strong (images)" },
              ]}
            />

            {mode === "safe" ? (
              <Notice tone="info">
                <p className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {locale === "ar"
                      ? "يعيد الوضع الآمن بناء بنية الملف ويحذف البيانات الوصفية والكائنات المكرّرة. يبقى النص قابلًا للبحث والتحديد، والتوفير عادة بين 5% و25%."
                      : "Safe mode rebuilds the file structure and strips metadata and duplicate objects. Text stays searchable and selectable; savings are usually 5–25%."}
                  </span>
                </p>
              </Notice>
            ) : (
              <>
                <Notice tone="warn">
                  {locale === "ar"
                    ? "الوضع القوي يحوّل كل صفحة إلى صورة مضغوطة: التوفير كبير في الملفات الممسوحة ضوئيًا، لكن النص يصبح غير قابل للتحديد أو البحث."
                    : "Strong mode turns each page into a compressed image: big savings on scanned files, but the text stops being selectable or searchable."}
                </Notice>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="label">{locale === "ar" ? "دقة الصفحات" : "Page resolution"}</p>
                    <Segmented
                      label={locale === "ar" ? "دقة الصفحات" : "Page resolution"}
                      value={String(dpi)}
                      onChange={(value) => setDpi(Number(value))}
                      options={[
                        { value: "110", label: "110 dpi" },
                        { value: "150", label: "150 dpi" },
                        { value: "200", label: "200 dpi" },
                      ]}
                    />
                  </div>
                  <Slider
                    id="pdf-quality"
                    label={locale === "ar" ? "جودة الصور" : "Image quality"}
                    min={40}
                    max={95}
                    suffix="%"
                    value={quality}
                    onChange={setQuality}
                  />
                </div>
              </>
            )}

            <button type="button" className="btn-primary" disabled={busy} onClick={() => void compress()}>
              <Gauge className="size-4" />
              {busy
                ? progress || dict.actions.processing
                : locale === "ar"
                  ? "اضغط الملف"
                  : "Compress PDF"}
            </button>
          </div>
        </>
      )}

      {error && (
        <Notice tone="error">
          {locale === "ar" ? "تعذّرت المعالجة" : "Processing failed"}: {error}
        </Notice>
      )}

      {limitReached !== null && <LimitNotice locale={locale} limit={limitReached} />}

      {result && file && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label={locale === "ar" ? "قبل" : "Before"} value={formatBytes(file.size)} />
            <Stat label={locale === "ar" ? "بعد" : "After"} value={formatBytes(result.blob.size)} tone="brand" />
            <Stat
              label={saved > 0 ? (locale === "ar" ? "التوفير" : "Saved") : locale === "ar" ? "الفرق" : "Change"}
              value={
                saved > 0
                  ? `−${saved.toFixed(1)}%`
                  : `+${Math.abs(saved) > 999 ? "999+" : Math.abs(saved).toFixed(1)}%`
              }
              tone={saved > 0 ? "good" : "bad"}
              hint={locale === "ar" ? `${result.pages} صفحة` : `${result.pages} pages`}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => downloadBlob(result.blob, `${baseName(file.name)}-compressed.pdf`)}
            >
              <Download className="size-4" />
              {dict.actions.download}
            </button>
          </div>

          {saved <= 0 ? (
            <Notice tone="warn">
              {mode === "strong"
                ? locale === "ar"
                  ? "الحجم زاد: هذا يحدث مع ملف نصي خفيف، لأن تحويل الصفحات إلى صور يجعله أثقل. استخدم الوضع الآمن لهذا النوع من الملفات — فهو يحفظ النص ولا يحوّله إلى صور. والأصل عندك لم يتغير."
                  : "The file got bigger. That happens with a light text-based PDF, because turning pages into images adds weight. Use safe mode for that kind of file — it keeps the text as text. Your original is untouched."
                : locale === "ar"
                  ? "الحجم لم ينخفض — وهذا يحدث مع ملف محسّن مسبقًا. جرّب الوضع القوي إذا كان الملف ممسوحًا ضوئيًا، واحتفظ بالأصل."
                  : "The file did not get smaller — that happens with an already-optimised PDF. Try strong mode if it is a scan, and keep the original either way."}
            </Notice>
          ) : (
            <Notice tone="success">
              {locale === "ar"
                ? "تم الضغط. افتح الملف وتحقق من صفحة مزدحمة قبل حذف الأصل."
                : "Done. Open the result and check a dense page before you delete the original."}
            </Notice>
          )}
        </div>
      )}
    </div>
  );
}
