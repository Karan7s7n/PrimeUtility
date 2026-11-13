/**
 * Builds the sample files the end-to-end specs upload.
 * They are generated (not committed) so the repo stays free of binaries.
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { deflateSync } from "node:zlib";
import path from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";

const outDir = path.join(process.cwd(), "e2e", ".fixtures");

/* ---------------------------------------------------------------- PNG ---- */
const crcTable = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

const crc32 = (buffer: Buffer) => {
  let crc = -1;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
};

const chunk = (type: string, data: Buffer) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
};

/** A deliberately busy RGB image, so compressing it shows a real difference. */
const makePhotoPng = (width = 1400, height = 900) => {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let offset = 0;
  for (let y = 0; y < height; y += 1) {
    raw[offset] = 0; // filter: none
    offset += 1;
    for (let x = 0; x < width; x += 1) {
      const noise = (x * 7 + y * 13) % 97;
      raw[offset] = (x * 255) / width;
      raw[offset + 1] = (y * 255) / height;
      raw[offset + 2] = (x * y + noise * 3) % 256;
      offset += 3;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 6 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

/* ---------------------------------------------------------------- PDF ---- */
const makePdf = async (pages: number, label: string) => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let index = 1; index <= pages; index += 1) {
    const page = doc.addPage([595, 842]);
    page.drawText(`${label} — page ${index} of ${pages}`, { x: 60, y: 760, size: 16, font });
    page.drawText("PrimeUtility end-to-end fixture. This page contains selectable text.", {
      x: 60,
      y: 730,
      size: 11,
      font,
    });
    page.drawText(`Identifier ${label}-${index}`, { x: 60, y: 700, size: 11, font });
  }
  return Buffer.from(await doc.save());
};

const exists = async (file: string) => {
  try {
    await access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

export default async function globalSetup() {
  await mkdir(outDir, { recursive: true });

  const files = {
    "sample.pdf": await makePdf(3, "SAMPLE"),
    "second.pdf": await makePdf(2, "SECOND"),
    "many-pages.pdf": await makePdf(301, "LONG"),
    "photo.png": makePhotoPng(),
  };

  for (const [name, contents] of Object.entries(files)) {
    const target = path.join(outDir, name);
    // Regenerated on every run so a stale fixture can never mask a regression.
    await writeFile(target, contents);
  }

  if (!(await exists(path.join(outDir, "sample.pdf")))) throw new Error("fixture generation failed");
}
