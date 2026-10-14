// Shared client-only loader for pdf.js. Kept in one place so every PDF tool
// configures the worker identically. The worker is bundled from the installed
// pdfjs-dist (same version as the library, served from this origin) instead of
// being fetched from a third-party CDN.
import type * as PdfJsLib from "pdfjs-dist";

let cached: typeof PdfJsLib | null = null;

export async function loadPdfJs(): Promise<typeof PdfJsLib> {
  if (cached) return cached;
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  cached = lib;
  return lib;
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
