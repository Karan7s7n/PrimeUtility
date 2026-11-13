/**
 * Input limits shared by the browser tools and their tests.
 * They exist to protect the visitor's own machine (memory) and our API.
 */
export const MB = 1024 * 1024;

export interface FileLimits {
  maxFiles: number;
  maxFileBytes: number;
  maxTotalBytes: number;
}

export const IMAGE_LIMITS: FileLimits = {
  maxFiles: 20,
  maxFileBytes: 25 * MB,
  maxTotalBytes: 100 * MB,
};

export const MERGE_PDF_LIMITS: FileLimits & { maxPages: number } = {
  maxFiles: 20,
  maxFileBytes: 50 * MB,
  maxTotalBytes: 100 * MB,
  maxPages: 300,
};

export const PDF_LIMITS = {
  maxFileBytes: 50 * MB,
  maxPages: 300,
};

export const SINGLE_PDF_LIMITS: FileLimits = {
  maxFiles: 1,
  maxFileBytes: PDF_LIMITS.maxFileBytes,
  maxTotalBytes: PDF_LIMITS.maxFileBytes,
};

export const REGEX_LIMITS = {
  maxPatternChars: 2000,
  maxTextChars: 500_000,
};

export const JSON_LIMITS = {
  maxBytes: 2 * MB,
};

export type FileRejectionReason = "too_many_files" | "file_too_large" | "total_too_large";

export interface FileRejection {
  name: string;
  reason: FileRejectionReason;
}

export interface FileSelection {
  accepted: File[];
  rejected: FileRejection[];
  totalBytes: number;
}

const sizeOf = (file: { size: number }) => (Number.isFinite(file.size) ? file.size : 0);

/**
 * Picks the files that fit inside the limits and reports why the rest were
 * skipped, so the visitor is never left guessing.
 */
export function selectAllowedFiles(
  incoming: File[],
  existing: { size: number }[] = [],
  limits: FileLimits,
): FileSelection {
  const accepted: File[] = [];
  const rejected: FileRejection[] = [];
  let usedFiles = existing.length;
  let totalBytes = existing.reduce((sum, item) => sum + sizeOf(item), 0);

  for (const file of incoming) {
    if (usedFiles >= limits.maxFiles) {
      rejected.push({ name: file.name, reason: "too_many_files" });
      continue;
    }
    if (sizeOf(file) > limits.maxFileBytes) {
      rejected.push({ name: file.name, reason: "file_too_large" });
      continue;
    }
    if (totalBytes + sizeOf(file) > limits.maxTotalBytes) {
      rejected.push({ name: file.name, reason: "total_too_large" });
      continue;
    }
    accepted.push(file);
    usedFiles += 1;
    totalBytes += sizeOf(file);
  }

  return { accepted, rejected, totalBytes };
}

export const exceedsPageLimit = (pages: number, maxPages: number): boolean =>
  Number.isFinite(pages) && pages > maxPages;
