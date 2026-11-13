/** pdf.js is loaded lazily so tool pages that do not need it stay light. */
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

function polyfillPromiseWithResolvers() {
  const target = Promise as unknown as { withResolvers?: () => unknown };
  if (typeof target.withResolvers === "function") return;
  target.withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

export async function loadPdfjs() {
  if (!pdfjsPromise) {
    polyfillPromiseWithResolvers();
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return mod;
    });
  }
  return pdfjsPromise;
}

export const bytesFromBlob = async (blob: Blob): Promise<Uint8Array> => new Uint8Array(await blob.arrayBuffer());
