import { createRequire } from "node:module";
import { existsSync, mkdirSync, copyFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

// pdf.js needs its worker as a real file next to the app, so we copy it into public/.
// Runs before `next dev` and `next build`; harmless when the file is already there.
const require = createRequire(import.meta.url);

let src;
try {
  src = require.resolve("pdfjs-dist/build/pdf.worker.min.mjs");
} catch {
  try {
    src = require.resolve("pdfjs-dist/build/pdf.worker.min.js");
  } catch {
    console.warn("[pdf-worker] pdfjs-dist not installed yet — skipping copy");
    process.exit(0);
  }
}

const dest = resolve("public/pdf.worker.min.mjs");
mkdirSync(dirname(dest), { recursive: true });

if (existsSync(dest) && statSync(dest).size === statSync(src).size) {
  process.exit(0);
}

copyFileSync(src, dest);
console.log("[pdf-worker] copied worker ->", dest);
