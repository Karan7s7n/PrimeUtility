"use client";

import { Download, FileText, ScanText } from "lucide-react";
import { useState } from "react";
import { FileDrop, LimitNotice, Notice, Stat } from "@/components/tools/ui";
import { dictionaries } from "@/lib/i18n";
import { exceedsPageLimit, PDF_LIMITS, SINGLE_PDF_LIMITS } from "@/lib/limits";
import { loadPdfjs } from "@/lib/pdf";
import { useRunTracker } from "@/lib/session";
import type { Locale } from "@/lib/site";
import { baseName, downloadBlob, formatBytes } from "@/lib/utils";

interface PageText {
  page: number;
  lines: string[];
}

export function PdfToWord({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale];
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageText[]>([]);
  const [emptyPages, setEmptyPages] = useState<number[]>([]);
  const [pageBreak, setPageBreak] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [docxReady, setDocxReady] = useState(false);
  const { track, limitReached } = useRunTracker("pdf-to-word");

  const reset = () => {
    setFile(null);
    setPages([]);
    setEmptyPages([]);
    setError("");
    setProgress("");
    setDocxReady(false);
  };

  const extract = async (selected: File) => {
    setBusy(true);
    setError("");
    setDocxReady(false);
    try {
      if (selected.size > PDF_LIMITS.maxFileBytes) {
        setError(dict.limits.pdfTooLarge.replace("{max}", formatBytes(PDF_LIMITS.maxFileBytes)));
        return;
      }
      const pdfjs = await loadPdfjs();
      const document = await pdfjs.getDocument({ data: new Uint8Array(await selected.arrayBuffer()) }).promise;
      if (exceedsPageLimit(document.numPages, PDF_LIMITS.maxPages)) {
        setError(dict.limits.pdfTooManyPages.replace("{max}", String(PDF_LIMITS.maxPages)));
        return;
      }
      const collected: PageText[] = [];
      const empty: number[] = [];

      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        setProgress(
          locale === "ar"
            ? `استخراج النص من الصفحة ${pageNumber} من ${document.numPages}…`
            : `Extracting text from page ${pageNumber} of ${document.numPages}…`,
        );
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        const lines: string[] = [];
        let current = "";
        let lastY: number | null = null;

        for (const raw of content.items) {
          const item = raw as { str?: string; transform?: number[]; hasEOL?: boolean };
          if (typeof item.str !== "string") continue;
          const y = item.transform ? Math.round(item.transform[5]) : null;
          if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
            if (current.trim()) lines.push(current.trim());
            current = "";
          }
          current += item.str;
          if (item.hasEOL) {
            if (current.trim()) lines.push(current.trim());
            current = "";
          }
          lastY = y;
        }
        if (current.trim()) lines.push(current.trim());

        if (lines.length === 0) empty.push(pageNumber);
        collected.push({ page: pageNumber, lines });
      }

      setPages(collected);
      setEmptyPages(empty);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : locale === "ar"
            ? "تعذّرت قراءة الملف."
            : "The file could not be read.",
      );
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  const buildDocx = async () => {
    if (!file || pages.length === 0) return;
    setBusy(true);
    setProgress(locale === "ar" ? "تجهيز مستند Word…" : "Building the Word document…");
    try {
      const { Document, Packer, Paragraph, TextRun } = await import("docx");
      const children: InstanceType<typeof Paragraph>[] = [];

      pages.forEach((page, index) => {
        if (index > 0 && pageBreak) {
          children.push(new Paragraph({ text: "", pageBreakBefore: true }));
        }
        if (page.lines.length === 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: locale === "ar" ? `[صفحة ${page.page} بلا نص قابل للاستخراج]` : `[Page ${page.page} has no extractable text]`,
                  italics: true,
                  color: "888888",
                }),
              ],
            }),
          );
          return;
        }
        page.lines.forEach((line) => {
          children.push(new Paragraph({ children: [new TextRun({ text: line, size: 22 })] }));
        });
      });

      const document = new Document({
        creator: "PrimeUtility",
        title: baseName(file.name),
        description: locale === "ar" ? "نص مستخرج من ملف PDF" : "Text extracted from a PDF",
        sections: [{ children }],
      });

      const blob = await Packer.toBlob(document);
      downloadBlob(blob, `${baseName(file.name)}.docx`);
      setDocxReady(true);
      void track({ inputSize: file.size, outputSize: blob.size, status: "ok" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : locale === "ar" ? "تعذّر إنشاء الملف." : "Could not build the document.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  const words = pages.reduce(
    (sum, page) => sum + page.lines.reduce((lineSum, line) => lineSum + line.split(/\s+/).filter(Boolean).length, 0),
    0,
  );

  return (
    <div className="space-y-5">
      {!file ? (
        <FileDrop
          accept="application/pdf,.pdf"
          onFiles={(files) => {
            const selected = files[0];
            setFile(selected);
            void extract(selected);
          }}
          locale={locale}
          limits={SINGLE_PDF_LIMITS}
          title={locale === "ar" ? "أفلِت ملف PDF هنا" : "Drop your PDF here"}
          hint={
            locale === "ar"
              ? "للملفات النصية: يُقرأ الملف داخل متصفحك ويُستخرج نصه. الملفات الممسوحة ضوئيًا تحتاج OCR وليست مدعومة بعد."
              : "Text-based PDFs: the file is read in your browser and its text extracted. Scanned PDFs need OCR, which is not supported yet."
          }
          icon={<ScanText className="size-6" aria-hidden="true" />}
        />
      ) : (
        <div className="panel flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{file.name}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {formatBytes(file.size)}
              {busy && progress ? ` · ${progress}` : ""}
            </p>
          </div>
          <button type="button" className="btn-ghost btn-sm" onClick={reset} disabled={busy}>
            {dict.actions.tryAgain}
          </button>
        </div>
      )}

      {error && (
        <Notice tone="error">
          {locale === "ar" ? "تعذّرت المعالجة" : "Processing failed"}: {error}
        </Notice>
      )}

      {limitReached !== null && <LimitNotice locale={locale} limit={limitReached} />}

      {pages.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label={locale === "ar" ? "الصفحات" : "Pages"} value={pages.length} />
            <Stat label={locale === "ar" ? "الكلمات المستخرجة" : "Words extracted"} value={words} tone="brand" />
            <Stat
              label={locale === "ar" ? "صفحات بلا نص" : "Pages without text"}
              value={emptyPages.length}
              tone={emptyPages.length ? "bad" : "good"}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              className="size-4 accent-brand-600"
              checked={pageBreak}
              onChange={(event) => setPageBreak(event.target.checked)}
            />
            {locale === "ar" ? "اجعل كل صفحة PDF تبدأ صفحة جديدة في Word" : "Start a new Word page for each PDF page"}
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" disabled={busy || pages.length === 0} onClick={() => void buildDocx()}>
              <Download className="size-4" />
              {busy ? dict.actions.processing : locale === "ar" ? "تحميل ملف Word (‎.docx‎)" : "Download Word file (.docx)"}
            </button>
          </div>

          {docxReady && (
            <Notice tone="success">
              {locale === "ar"
                ? "تم إنشاء الملف وتحميله. افتحه في Word أو Google Docs، وراجع التنسيق قبل الاعتماد عليه."
                : "The file was built and downloaded. Open it in Word or Google Docs and check the formatting before relying on it."}
            </Notice>
          )}

          {emptyPages.length > 0 && (
            <Notice tone="warn">
              {locale === "ar"
                ? `الصفحات ${emptyPages.join("، ")} لا تحتوي نصًا قابلًا للاستخراج، وهذا يعني غالبًا أنها صور ممسوحة ضوئيًا. هذه الملفات تحتاج OCR على الخادم، وهي ميزة مخططة لإصدار لاحق.`
                : `Pages ${emptyPages.join(", ")} contain no extractable text, which usually means they are scans. Those files need server-side OCR, planned for a later version.`}
            </Notice>
          )}

          <div className="panel max-h-80 overflow-auto">
            <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {locale === "ar" ? "معاينة النص المستخرج" : "Extracted text preview"}
            </h3>
            <div dir="auto" className="space-y-3 text-[13.5px] leading-6 whitespace-pre-wrap text-slate-600 dark:text-slate-300">
              {pages.slice(0, 3).map((page) => (
                <div key={page.page}>
                  <p className="mb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                    {locale === "ar" ? `صفحة ${page.page}` : `Page ${page.page}`}
                  </p>
                  {page.lines.slice(0, 12).join("\n") || (locale === "ar" ? "— بلا نص —" : "— no text —")}
                </div>
              ))}
              {pages.length > 3 && (
                <p className="text-xs text-slate-400">
                  {locale === "ar" ? `… و${pages.length - 3} صفحة إضافية` : `… and ${pages.length - 3} more pages`}
                </p>
              )}
            </div>
          </div>

          <Notice tone="info">
            <p className="flex items-start gap-2">
              <FileText className="mt-0.5 size-4 shrink-0" />
              <span>
                {locale === "ar"
                  ? "تُنقل الفقرات وفواصل الصفحات، أما الجداول والأعمدة المتعددة والصور العائمة فتُبسَّط. للحصول على نسخة مطابقة للتصميم الأصلي، احتفظ بملف PDF."
                  : "Paragraphs and page breaks carry over; tables, multiple columns and floating images are simplified. Keep the PDF itself if you need a pixel-perfect copy of the design."}
              </span>
            </p>
          </Notice>
        </>
      )}
    </div>
  );
}
