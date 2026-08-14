// Shared export tracking + watermark helpers.
//
// Tools that produce downloadable files call `recordExport()` when a user
// exports a file. This increments a persistent counter and, at the milestone
// counts 1 / 5 / 10 / 20, dispatches a window event that the global share
// toast listens for. Watermark helpers read the user's saved preference and
// only draw the `123tool.app` mark when the user has not hidden it.

import { SITE_DOMAIN } from "@/lib/site";

export const EXPORT_MILESTONES = [1, 5, 10, 20] as const;

const EXPORT_COUNT_KEY = "toolbox123:exportCount";
const WATERMARK_KEY = "toolbox123:watermark";

export function getExportCount(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(EXPORT_COUNT_KEY);
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

/** Increments the export counter and returns the milestone hit (or null). */
export function recordExport(): number | null {
  if (typeof window === "undefined") return null;
  const next = getExportCount() + 1;
  try {
    window.localStorage.setItem(EXPORT_COUNT_KEY, String(next));
  } catch {
    // ignore storage errors
  }
  if ((EXPORT_MILESTONES as readonly number[]).includes(next)) {
    window.dispatchEvent(new CustomEvent("tools123:export-milestone", { detail: { count: next } }));
    return next;
  }
  return null;
}

export function getWatermarkEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(WATERMARK_KEY);
    return raw === null ? true : raw === "true";
  } catch {
    return true;
  }
}

export function setWatermarkEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WATERMARK_KEY, String(enabled));
  } catch {
    // ignore storage errors
  }
}

/**
 * Applies a small `123tool.app` watermark to an image data URL. Returns the
 * new data URL, or the original if the watermark is disabled or decoding fails.
 */
export async function watermarkImageDataUrl(dataUrl: string, mimeType = "image/png", override?: boolean): Promise<string> {
  const enabled = override ?? getWatermarkEnabled();
  if (!enabled) return dataUrl;
  try {
    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("decode failed"));
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0);
    drawWatermark(ctx, canvas.width, canvas.height);
    return canvas.toDataURL(mimeType);
  } catch {
    return dataUrl;
  }
}

/** Draws the watermark text into the bottom-right corner of a 2D canvas. */
export function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const text = SITE_DOMAIN;
  const fontSize = Math.max(12, Math.round(Math.min(width, height) * 0.03));
  const padding = Math.max(8, fontSize * 0.6);
  ctx.save();
  ctx.font = `600 ${fontSize}px "Space Grotesk", system-ui, sans-serif`;
  ctx.textBaseline = "bottom";
  const metrics = ctx.measureText(text);
  const boxW = metrics.width + padding * 2;
  const boxH = fontSize + padding;
  const x = width - boxW - padding;
  const y = height - boxH - padding;
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.roundRect(x, y, boxW, boxH, 6);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText(text, x + padding, y + boxH - padding * 0.5);
  ctx.restore();
}

/** Appends a `123tool.app` credit line to plain-text content (when enabled). */
export function watermarkText(content: string): string {
  if (!getWatermarkEnabled()) return content;
  if (!content.trim()) return content;
  const footer = `\n\n— Created with ${SITE_DOMAIN}`;
  return content.endsWith("\n") ? `${content}${footer.trim()}` : `${content}${footer}`;
}
