/** Formats a number for display, dropping a pointless trailing ".0". */
const trimZeros = (value: number, digits: number) => {
  const fixed = value.toFixed(digits);
  return fixed.endsWith("0") ? String(Number(fixed)) : fixed;
};

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? trimZeros(kb, 1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb < 10 ? mb.toFixed(2) : trimZeros(mb, 1)} MB`;
  return `${trimZeros(mb / 1024, 2)} GB`;
};

export const percentChange = (before: number, after: number): number => {
  if (!before || !after) return 0;
  return ((before - after) / before) * 100;
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export const downloadText = (text: string, filename: string, type = "text/plain;charset=utf-8") =>
  downloadBlob(new Blob([text], { type }), filename);

export const downloadDataUrl = (dataUrl: string, filename: string) => {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export const stripExtension = (name: string) => name.replace(/\.[^./\\]+$/, "") || "file";

export const baseName = (name: string) => stripExtension(name).replace(/[/\\]/g, "-");

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export const joinClass = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");
