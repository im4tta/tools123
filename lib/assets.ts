// Base URL for large static assets that used to live under public/ — the Khmer
// OCR ONNX models (~55 MB) and the Coeng Ta/Da WASM (~2.5 MB). Bundling them in
// public/ put a copy in every Vercel deployment (Deployment Storage) and served
// every download from Vercel (Fast Data Transfer). They are now fetched from a
// CDN instead: jsDelivr, pinned to a commit of this public MIT repo, so the URL
// is immutable and CORS-enabled for in-browser fetch.
//
// Override with NEXT_PUBLIC_ASSETS_BASE_URL to point at your own host (e.g. a
// Vercel Blob store or Cloudflare R2 bucket) without a code change. The path
// layout under the base mirrors the old public/ paths (e.g. /models/…, /vendor/…).
const DEFAULT_ASSETS_BASE =
  "https://cdn.jsdelivr.net/gh/im4tta/tools123@a50a6361320abd05021ddb6707de71c8cf59f651/public";

const override = process.env.NEXT_PUBLIC_ASSETS_BASE_URL?.trim();
export const ASSETS_BASE = (override && override.length > 0 ? override : DEFAULT_ASSETS_BASE).replace(/\/+$/, "");

/** Absolute URL for a large asset, given its old public/-relative path (leading slash optional). */
export function assetUrl(path: string): string {
  return `${ASSETS_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
