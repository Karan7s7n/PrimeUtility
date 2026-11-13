import { describe, expect, it } from "vitest";
import {
  exceedsPageLimit,
  JSON_LIMITS,
  MB,
  MERGE_PDF_LIMITS,
  PDF_LIMITS,
  REGEX_LIMITS,
  selectAllowedFiles,
} from "@/lib/limits";

const file = (name: string, size: number) => ({ name, size }) as File;

describe("selectAllowedFiles", () => {
  it("accepts files that fit", () => {
    const result = selectAllowedFiles([file("a.pdf", 1 * MB), file("b.pdf", 2 * MB)], [], MERGE_PDF_LIMITS);
    expect(result.accepted.map((entry) => entry.name)).toEqual(["a.pdf", "b.pdf"]);
    expect(result.rejected).toEqual([]);
    expect(result.totalBytes).toBe(3 * MB);
  });

  it("rejects files over the per-file size limit", () => {
    const result = selectAllowedFiles([file("big.pdf", 60 * MB)], [], MERGE_PDF_LIMITS);
    expect(result.accepted).toHaveLength(0);
    expect(result.rejected).toEqual([{ name: "big.pdf", reason: "file_too_large" }]);
  });

  it("stops at the file count, counting the files already added", () => {
    const existing = Array.from({ length: 19 }, (_, i) => ({ size: 1 * MB, name: `old-${i}.pdf` }));
    const result = selectAllowedFiles([file("new-1.pdf", MB), file("new-2.pdf", MB)], existing, MERGE_PDF_LIMITS);
    expect(result.accepted.map((entry) => entry.name)).toEqual(["new-1.pdf"]);
    expect(result.rejected).toEqual([{ name: "new-2.pdf", reason: "too_many_files" }]);
  });

  it("rejects files that would push the total over the limit", () => {
    const existing = [{ size: 90 * MB }];
    const result = selectAllowedFiles([file("fits.pdf", 5 * MB), file("extra.pdf", 20 * MB)], existing, MERGE_PDF_LIMITS);
    expect(result.accepted.map((entry) => entry.name)).toEqual(["fits.pdf"]);
    expect(result.rejected).toEqual([{ name: "extra.pdf", reason: "total_too_large" }]);
  });

  it("still accepts a smaller file that arrives after a rejected one", () => {
    const result = selectAllowedFiles([file("huge.pdf", 80 * MB), file("small.pdf", MB)], [], MERGE_PDF_LIMITS);
    expect(result.accepted.map((entry) => entry.name)).toEqual(["small.pdf"]);
    expect(result.rejected).toHaveLength(1);
  });

  it("treats a missing size as zero instead of failing", () => {
    const result = selectAllowedFiles([{ name: "odd.pdf" } as File], [], MERGE_PDF_LIMITS);
    expect(result.accepted).toHaveLength(1);
    expect(result.totalBytes).toBe(0);
  });
});

describe("page limits", () => {
  it("flags only documents above the cap", () => {
    expect(exceedsPageLimit(300, PDF_LIMITS.maxPages)).toBe(false);
    expect(exceedsPageLimit(301, PDF_LIMITS.maxPages)).toBe(true);
    expect(exceedsPageLimit(Number.NaN, PDF_LIMITS.maxPages)).toBe(false);
  });
});

describe("documented constants", () => {
  it("keeps the limits the product promises", () => {
    expect(MERGE_PDF_LIMITS).toMatchObject({ maxFiles: 20, maxFileBytes: 50 * MB, maxTotalBytes: 100 * MB, maxPages: 300 });
    expect(PDF_LIMITS).toMatchObject({ maxFileBytes: 50 * MB, maxPages: 300 });
    expect(REGEX_LIMITS).toMatchObject({ maxPatternChars: 2000, maxTextChars: 500_000 });
    expect(JSON_LIMITS.maxBytes).toBe(2 * MB);
  });
});

describe("api body limit", () => {
  it("is one megabyte", async () => {
    const { MAX_JSON_BYTES } = await import("@/lib/api");
    expect(MAX_JSON_BYTES).toBe(MB);
  });
});
