"use client";

import { ArrowDown, ArrowUp, Download, Layers, Trash2 } from "lucide-react";
import { useState } from "react";
import { FileDrop, LimitNotice, Notice, Stat } from "@/components/tools/ui";
import { dictionaries } from "@/lib/i18n";
import { exceedsPageLimit, MERGE_PDF_LIMITS } from "@/lib/limits";
import { useRunTracker } from "@/lib/session";
import type { Locale } from "@/lib/site";
import { downloadBlob, formatBytes } from "@/lib/utils";

interface PdfItem {
  id: string;
  file: File;
  pages: number | null;
  error?: string;
}

export function MergePdf({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale];
  const [items, setItems] = useState<PdfItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState("");
  const [skippedPages, setSkippedPages] = useState<string[]>([]);
  const { track, limitReached } = useRunTracker("merge-pdf");

  const addFiles = async (files: File[]) => {
    const pdfs = files.filter((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
    if (pdfs.length === 0) return;
    setBusy(true);
    setError("");
    setSkippedPages([]);
    const { PDFDocument } = await import("pdf-lib");
    const prepared: PdfItem[] = [];
    const overLimit: string[] = [];
    // Page counts are only known after reading a file, so they are checked as
    // each one is opened and the running total is capped too.
    let runningPages = items.reduce((sum, item) => sum + (item.pages ?? 0), 0);

    for (const file of pdfs) {
      const id = `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`;
      try {
        const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
        const pages = doc.getPageCount();
        if (exceedsPageLimit(runningPages + pages, MERGE_PDF_LIMITS.maxPages)) {
          overLimit.push(file.name);
          continue;
        }
        runningPages += pages;
        prepared.push({ id, file, pages });
      } catch {
        prepared.push({
          id,
          file,
          pages: null,
          error:
            locale === "ar"
              ? "تعذّرت قراءة هذا الملف، وقد يكون محميًا بكلمة مرور أو تالفًا."
              : "This file could not be read — it may be password protected or damaged.",
        });
      }
    }
    setSkippedPages(overLimit);
    setItems((prev) => [...prev, ...prepared]);
    setBusy(false);
  };

  const move = (index: number, direction: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setResultUrl(null);
  };

  const merge = async () => {
    const usable = items.filter((item) => item.pages !== null);
    if (usable.length < 2) return;
    if (exceedsPageLimit(usable.reduce((sum, item) => sum + (item.pages ?? 0), 0), MERGE_PDF_LIMITS.maxPages)) {
      setError(
        locale === "ar"
          ? `إجمالي الصفحات يتجاوز ${MERGE_PDF_LIMITS.maxPages} صفحة. احذف بعض الملفات ثم أعد المحاولة.`
          : `The total is over ${MERGE_PDF_LIMITS.maxPages} pages. Remove some files and try again.`,
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const merged = await PDFDocument.create();
      merged.setTitle(locale === "ar" ? "ملف مدمج" : "Merged document");
      merged.setProducer("PrimeUtility");
      merged.setCreator("PrimeUtility");

      for (const item of usable) {
        const source = await PDFDocument.load(await item.file.arrayBuffer(), { ignoreEncryption: true });
        const pages = await merged.copyPages(source, source.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }

      const bytes = await merged.save({ useObjectStreams: true });
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      void track({ inputSize: totalSize, outputSize: blob.size });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : locale === "ar"
            ? "تعذّر دمج الملفات."
            : "Merging failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const totalPages = items.reduce((sum, item) => sum + (item.pages ?? 0), 0);
  const totalSize = items.reduce((sum, item) => sum + item.file.size, 0);

  return (
    <div className="space-y-5">
      <FileDrop
        multiple
        accept="application/pdf,.pdf"
        onFiles={(files) => void addFiles(files)}
        locale={locale}
        limits={MERGE_PDF_LIMITS}
        existing={items.map((item) => ({ size: item.file.size }))}
        title={locale === "ar" ? "أضف ملفات PDF" : "Add PDF files"}
        hint={
          locale === "ar"
            ? "يمكنك إضافة عدة ملفات ثم إعادة ترتيبها"
            : "Add several files, then put them in the right order"
        }
        icon={<Layers className="size-6" aria-hidden="true" />}
      />

      {items.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label={locale === "ar" ? "عدد الملفات" : "Files"} value={items.length} />
            <Stat label={locale === "ar" ? "إجمالي الصفحات" : "Total pages"} value={totalPages} />
            <Stat label={locale === "ar" ? "الحجم الكلي" : "Total size"} value={formatBytes(totalSize)} />
          </div>

          <ol className="space-y-3">
            {items.map((item, index) => (
              <li key={item.id} className="panel flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{item.file.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {formatBytes(item.file.size)}
                    {item.pages !== null && (
                      <>
                        {" · "}
                        {locale === "ar" ? `${item.pages} صفحة` : `${item.pages} pages`}
                      </>
                    )}
                  </p>
                  {item.error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{item.error}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={locale === "ar" ? "أعلى" : "Move up"}
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    aria-label={locale === "ar" ? "أسفل" : "Move down"}
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => {
                      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
                      setResultUrl(null);
                    }}
                    aria-label={dict.actions.remove}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" disabled={busy || items.filter((i) => i.pages !== null).length < 2} onClick={() => void merge()}>
              <Layers className="size-4" />
              {busy ? dict.actions.processing : locale === "ar" ? "دمج الملفات" : "Merge files"}
            </button>
            {resultUrl && (
              <a className="btn-secondary" href={resultUrl} download="merged.pdf">
                <Download className="size-4" />
                {dict.actions.download} ({formatBytes(resultSize)})
              </a>
            )}
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setItems([]);
                if (resultUrl) URL.revokeObjectURL(resultUrl);
                setResultUrl(null);
              }}
            >
              {dict.actions.reset}
            </button>
          </div>
        </>
      )}

      {skippedPages.length > 0 && (
        <Notice tone="warn">
          <p className="font-semibold">{dict.limits.filesTitle}</p>
          <ul className="mt-1 list-disc space-y-0.5 ps-5 text-[13px]">
            {skippedPages.map((name) => (
              <li key={name}>{dict.limits.pageLimit.replace("{name}", name).replace("{max}", String(MERGE_PDF_LIMITS.maxPages))}</li>
            ))}
          </ul>
        </Notice>
      )}

      {items.filter((i) => i.pages !== null).length === 1 && (
        <Notice tone="info">
          {locale === "ar"
            ? "أضف ملفًا آخر ليصبح الدمج ممكنًا، فالدمج يحتاج ملفين على الأقل."
            : "Add one more file — merging needs at least two PDFs."}
        </Notice>
      )}

      {error && (
        <Notice tone="error">
          {locale === "ar" ? "تعذّر الدمج" : "Merging failed"}: {error}
        </Notice>
      )}

      {limitReached !== null && <LimitNotice locale={locale} limit={limitReached} />}
    </div>
  );
}
