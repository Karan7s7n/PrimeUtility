export type ImageFormat = "image/jpeg" | "image/png" | "image/webp";

export const formatExtension = (format: ImageFormat) =>
  format === "image/jpeg" ? "jpg" : format === "image/webp" ? "webp" : "png";

export const formatLabel = (format: ImageFormat) =>
  format === "image/jpeg" ? "JPG" : format === "image/webp" ? "WebP" : "PNG";

export const detectFormat = (file: File): ImageFormat => {
  const type = file.type.toLowerCase();
  if (type === "image/png") return "image/png";
  if (type === "image/webp") return "image/webp";
  return "image/jpeg";
};

export interface RenderedImage {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

/**
 * Reads an image, optionally resizes it and re-encodes it — all inside the browser.
 */
export async function renderImage(
  file: File,
  options: { format: ImageFormat; quality: number; maxWidth?: number },
): Promise<RenderedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  const scale = options.maxWidth && bitmap.width > options.maxWidth ? options.maxWidth / bitmap.width : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available in this browser");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  // JPEG cannot store transparency — fill white so nothing turns black.
  if (options.format === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, options.format, options.format === "image/png" ? undefined : options.quality),
  );

  if (!blob) throw new Error("The browser could not encode this image");

  return { blob, url: URL.createObjectURL(blob), width, height };
}
