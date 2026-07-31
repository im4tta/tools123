"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Check, Zap, X } from "lucide-react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

type SourceMode = "image" | "text";
type OgBgMode = "gradient" | "dark" | "light" | "custom";
type OgLayout = "split" | "centered";
type PreviewMode = "light" | "dark";

interface Settings {
  sourceMode: SourceMode;
  textIconChar: string;
  textIconColor: string;
  bg: string;
  padding: number;
  radius: number;
  adaptive: boolean;
  adaptiveDarkBg: string;
  previewMode: PreviewMode;
  ogEnabled: boolean;
  ogBgMode: OgBgMode;
  ogLayout: OgLayout;
  ogCustomColor: string;
  ogTitle: string;
  ogDesc: string;
  appName: string;
  shortName: string;
  domain: string;
  themeColor: string;
  manifestBg: string;
  tileColor: string;
}

interface ImageSource {
  canvas: HTMLCanvasElement;
  isVector: boolean;
  nativeW: number;
  nativeH: number;
  dataUrl: string;
  name: string;
}

interface BatchItem extends ImageSource {
  id: string;
}

interface CheckResult {
  level: "ok" | "warn" | "bad";
  title: string;
  msg: string;
}

const DEFAULT_SETTINGS: Settings = {
  sourceMode: "image",
  textIconChar: "A",
  textIconColor: "#FFFFFF",
  bg: "transparent",
  padding: 8,
  radius: 0,
  adaptive: false,
  adaptiveDarkBg: "#FFFFFF",
  previewMode: "light",
  ogEnabled: true,
  ogBgMode: "gradient",
  ogLayout: "split",
  ogCustomColor: "#FF5A1F",
  ogTitle: "My Site",
  ogDesc: "A short line about what this is.",
  appName: "My Site",
  shortName: "Site",
  domain: "yoursite.com",
  themeColor: "#FF5A1F",
  manifestBg: "#FFFFFF",
  tileColor: "#FF5A1F",
};

const PACK_SIZES = [16, 32, 48, 96, 180, 192, 512];
const ICO_SIZES = [16, 32, 48];
const MASTER_SIZE = 1024;
const DARK_CHROME_HEX = "#1c1e24";

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrastRatio(hexA: string, hexB: string) {
  const l1 = luminance(hexA), l2 = luminance(hexB);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function darken(hex: string, amt: number) {
  const { r, g, b } = hexToRgb(hex);
  const d = (v: number) => Math.max(0, Math.round(v * (1 - amt)));
  return `rgb(${d(r)},${d(g)},${d(b)})`;
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function buildMasterSource(img: HTMLImageElement, isVector: boolean): HTMLCanvasElement {
  let iw = img.naturalWidth || img.width || 512;
  let ih = img.naturalHeight || img.height || 512;
  if (!iw || !ih) { iw = 512; ih = 512; }
  const scale = isVector ? MASTER_SIZE / Math.max(iw, ih) : Math.min(1, MASTER_SIZE / Math.max(iw, ih));
  const cw = Math.max(1, Math.round(iw * scale));
  const ch = Math.max(1, Math.round(ih * scale));
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const cx = c.getContext("2d")!;
  cx.imageSmoothingEnabled = true;
  if ("imageSmoothingQuality" in cx) cx.imageSmoothingQuality = "high";
  cx.drawImage(img, 0, 0, cw, ch);
  return c;
}

function computeDominantColor(img: HTMLCanvasElement | HTMLImageElement): string {
  const s = 48;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const cx = c.getContext("2d")!;
  try { cx.drawImage(img, 0, 0, s, s); } catch { return "#FF5A1F"; }
  let data: Uint8ClampedArray;
  try { data = cx.getImageData(0, 0, s, s).data; } catch { return "#FF5A1F"; }
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 40) continue;
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  }
  if (!n) return "#FF5A1F";
  r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function drawTextGlyph(
  ctx: CanvasRenderingContext2D,
  size: number,
  offsetX: number,
  offsetY: number,
  paddingPct: number,
  s: Settings
) {
  const pad = (size * paddingPct) / 100;
  const box = Math.max(4, size - pad * 2);
  const text = (s.textIconChar || "A").toUpperCase();
  ctx.save();
  ctx.fillStyle = s.textIconColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let fs = box;
  ctx.font = `700 ${fs}px "Space Grotesk", sans-serif`;
  while (ctx.measureText(text).width > box && fs > 4) {
    fs -= 2;
    ctx.font = `700 ${fs}px "Space Grotesk", sans-serif`;
  }
  ctx.fillText(text, offsetX + size / 2, offsetY + size / 2 + fs * 0.04);
  ctx.restore();
}

function drawIcon(
  size: number,
  s: Settings,
  source: ImageSource | null,
  zoom: number,
  panX: number,
  panY: number,
  bgOverride?: string
): HTMLCanvasElement {
  const bg = bgOverride !== undefined ? bgOverride : s.bg;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  if (s.radius > 0) {
    const r = (size * s.radius) / 100;
    roundedRectPath(ctx, 0, 0, size, size, r);
    ctx.clip();
  }
  if (bg !== "transparent") {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
  }
  if (s.sourceMode === "text") {
    drawTextGlyph(ctx, size, 0, 0, s.padding, s);
  } else if (source) {
    const pad = (size * s.padding) / 100;
    const box = size - pad * 2;
    const iw = source.canvas.width;
    const ih = source.canvas.height;
    const scale = Math.min(box / iw, box / ih) * zoom;
    const dw = iw * scale, dh = ih * scale;
    const cx = size / 2 + panX * size;
    const cy = size / 2 + panY * size;
    ctx.drawImage(source.canvas, cx - dw / 2, cy - dh / 2, dw, dh);
  }
  return canvas;
}

function drawMaskableIcon(size: number, s: Settings, source: ImageSource | null, zoom: number, panX: number, panY: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const bg = s.bg !== "transparent" ? s.bg : (s.manifestBg || "#FFFFFF");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  const safePadding = Math.max(s.padding, 22);
  if (s.sourceMode === "text") {
    drawTextGlyph(ctx, size, 0, 0, safePadding, s);
  } else if (source) {
    const pad = (size * safePadding) / 100;
    const box = size - pad * 2;
    const iw = source.canvas.width;
    const ih = source.canvas.height;
    const scale = Math.min(box / iw, box / ih) * zoom;
    const dw = iw * scale, dh = ih * scale;
    const cx = size / 2 + panX * size;
    const cy = size / 2 + panY * size;
    ctx.drawImage(source.canvas, cx - dw / 2, cy - dh / 2, dw, dh);
  }
  return canvas;
}

function ogRepresentativeHex(s: Settings): string {
  if (s.ogBgMode === "gradient") return s.themeColor;
  if (s.ogBgMode === "dark") return "#111318";
  if (s.ogBgMode === "light") return "#FAFAF9";
  return s.ogCustomColor;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = words[i];
      if (lines.length === maxLines - 1) {
        let rest = words.slice(i).join(" ");
        while (ctx.measureText(`${rest}…`).width > maxWidth && rest.length > 1) rest = rest.slice(0, -1);
        lines.push(rest.replace(/\s+$/, "") + (rest.length < text.length ? "…" : ""));
        return lines;
      }
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

function drawOgLogoCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  cardFill: string,
  s: Settings,
  source: ImageSource | null
) {
  roundedRectPath(ctx, x, y, size, size, size * 0.19);
  ctx.fillStyle = cardFill;
  ctx.fill();
  if (s.sourceMode === "text") {
    ctx.save();
    roundedRectPath(ctx, x, y, size, size, size * 0.19);
    ctx.clip();
    const savedColor = s.textIconColor;
    s.textIconColor = "#111318";
    drawTextGlyph(ctx, size, x, y, 18, s);
    s.textIconColor = savedColor;
    ctx.restore();
    return;
  }
  if (!source) return;
  const iw = source.canvas.width;
  const ih = source.canvas.height;
  const innerPad = size * 0.18;
  const box = size - innerPad * 2;
  const scale = Math.min(box / iw, box / ih);
  const dw = iw * scale, dh = ih * scale;
  ctx.drawImage(source.canvas, x + (size - dw) / 2, y + (size - dh) / 2, dw, dh);
}

function hasSource(s: Settings, source: ImageSource | null): boolean {
  return s.sourceMode === "text" ? !!(s.textIconChar && s.textIconChar.trim()) : !!source;
}

function drawOg(s: Settings, source: ImageSource | null): HTMLCanvasElement {
  const W = 1200, H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const repHex = ogRepresentativeHex(s);
  const bgIsDark = luminance(repHex) < 0.5;

  if (s.ogBgMode === "gradient") {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, s.themeColor);
    g.addColorStop(1, darken(s.themeColor, 0.55));
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = repHex;
  }
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W - 80, H + 60, 40, W - 80, H + 60, 520);
  glow.addColorStop(0, bgIsDark ? "rgba(255,255,255,0.10)" : "rgba(17,19,24,0.06)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const textColor = bgIsDark ? "#FFFFFF" : "#111318";
  const subColor = bgIsDark ? "rgba(255,255,255,0.7)" : "rgba(17,19,24,0.62)";
  const cardFill = bgIsDark ? "rgba(255,255,255,0.97)" : "#FFFFFF";

  if (s.ogLayout === "centered") {
    drawOgCentered(ctx, W, H, textColor, subColor, cardFill, s, source);
  } else {
    drawOgSplit(ctx, W, H, textColor, subColor, cardFill, s, source);
  }
  return canvas;
}

function drawOgSplit(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  textColor: string,
  subColor: string,
  cardFill: string,
  s: Settings,
  source: ImageSource | null
) {
  const padX = 96;
  let textX = padX;
  const cardSize = 176;
  const cardY = H / 2 - cardSize / 2 - 34;
  if (hasSource(s, source)) {
    drawOgLogoCard(ctx, padX, cardY, cardSize, cardFill, s, source);
    textX = padX + cardSize + 56;
  }
  const maxTextWidth = W - textX - padX;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = textColor;
  ctx.font = '700 58px "Space Grotesk", sans-serif';
  const titleLines = wrapText(ctx, s.ogTitle || "My Site", maxTextWidth, 2);
  let ty = H / 2 - (titleLines.length - 1) * 34;
  titleLines.forEach((line) => { ctx.fillText(line, textX, ty); ty += 68; });
  if (s.ogDesc) {
    ctx.font = '400 28px "Space Grotesk", sans-serif';
    ctx.fillStyle = subColor;
    const descLines = wrapText(ctx, s.ogDesc, maxTextWidth, 2);
    let dy = ty + 12;
    descLines.forEach((line) => { ctx.fillText(line, textX, dy); dy += 38; });
  }
  ctx.font = '500 20px "JetBrains Mono", monospace';
  ctx.fillStyle = subColor;
  ctx.fillText((s.domain || "yoursite.com").toLowerCase(), textX, H - 64);
}

function drawOgCentered(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  textColor: string,
  subColor: string,
  cardFill: string,
  s: Settings,
  source: ImageSource | null
) {
  const cx = W / 2;
  const maxTextWidth = W - 220;
  let cy = 108;
  if (hasSource(s, source)) {
    const size = 140;
    drawOgLogoCard(ctx, cx - size / 2, cy, size, cardFill, s, source);
    cy += size + 46;
  } else {
    cy += 24;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = textColor;
  ctx.font = '700 54px "Space Grotesk", sans-serif';
  const titleLines = wrapText(ctx, s.ogTitle || "My Site", maxTextWidth, 2);
  let ty = cy + 44;
  titleLines.forEach((line) => { ctx.fillText(line, cx, ty); ty += 64; });
  if (s.ogDesc) {
    ctx.font = '400 26px "Space Grotesk", sans-serif';
    ctx.fillStyle = subColor;
    const descLines = wrapText(ctx, s.ogDesc, maxTextWidth, 2);
    let dy = ty + 14;
    descLines.forEach((line) => { ctx.fillText(line, cx, dy); dy += 36; });
  }
  ctx.font = '500 19px "JetBrains Mono", monospace';
  ctx.fillStyle = subColor;
  ctx.fillText((s.domain || "yoursite.com").toLowerCase(), cx, H - 56);
  ctx.textAlign = "left";
}

function buildSnippet(s: Settings): string {
  const lines: string[] = [];
  if (s.adaptive) lines.push('<link rel="icon" href="/favicon.svg" type="image/svg+xml">');
  lines.push(
    '<link rel="icon" type="image/x-icon" href="/favicon.ico">',
    '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
    '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
    '<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">',
    '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
    '<link rel="manifest" href="/site.webmanifest">',
    `<meta name="theme-color" content="${s.themeColor}">`,
    `<meta name="msapplication-TileColor" content="${s.tileColor}">`,
    '<meta name="msapplication-config" content="/browserconfig.xml">'
  );
  if (s.ogEnabled) {
    lines.push(
      "",
      `<meta property="og:title" content="${s.ogTitle}">`,
      `<meta property="og:description" content="${s.ogDesc}">`,
      `<meta property="og:image" content="https://${s.domain}/og-image.png">`,
      `<meta property="og:url" content="https://${s.domain}">`,
      '<meta name="twitter:card" content="summary_large_image">',
      `<meta name="twitter:title" content="${s.ogTitle}">`,
      `<meta name="twitter:description" content="${s.ogDesc}">`,
      `<meta name="twitter:image" content="https://${s.domain}/og-image.png">`
    );
  }
  return lines.join("\n");
}

// ---------------- ZIP / ICO binary builders ----------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function u8(a: Uint8Array, o: number, v: number) { a[o] = v & 0xff; }
function u16(a: Uint8Array, o: number, v: number) { a[o] = v & 0xff; a[o + 1] = (v >>> 8) & 0xff; }
function u32(a: Uint8Array, o: number, v: number) { a[o] = v & 0xff; a[o + 1] = (v >>> 8) & 0xff; a[o + 2] = (v >>> 16) & 0xff; a[o + 3] = (v >>> 24) & 0xff; }

function concatBytes(chunks: Uint8Array[]) {
  let total = 0;
  chunks.forEach((c) => (total += c.length));
  const out = new Uint8Array(total);
  let pos = 0;
  chunks.forEach((c) => { out.set(c, pos); pos += c.length; });
  return out;
}

function buildZip(files: { name: string; data: Uint8Array }[]) {
  const localChunks: Uint8Array[] = [], centralChunks: Uint8Array[] = [];
  let offset = 0;
  const time = 0, date = 0x21;
  files.forEach((f) => {
    const nameBytes = new TextEncoder().encode(f.name);
    const data = f.data;
    const crc = crc32(data);
    const size = data.length;
    const local = new Uint8Array(30);
    u32(local, 0, 0x04034b50); u16(local, 4, 20); u16(local, 6, 0); u16(local, 8, 0);
    u16(local, 10, time); u16(local, 12, date); u32(local, 14, crc);
    u32(local, 18, size); u32(local, 22, size); u16(local, 26, nameBytes.length); u16(local, 28, 0);
    localChunks.push(local, nameBytes, data);
    const central = new Uint8Array(46);
    u32(central, 0, 0x02014b50); u16(central, 4, 20); u16(central, 6, 20); u16(central, 8, 0); u16(central, 10, 0);
    u16(central, 12, time); u16(central, 14, date); u32(central, 16, crc);
    u32(central, 20, size); u32(central, 24, size); u16(central, 28, nameBytes.length); u32(central, 42, offset);
    centralChunks.push(central, nameBytes);
    offset += local.length + nameBytes.length + data.length;
  });
  const centralStart = offset;
  let centralSize = 0;
  centralChunks.forEach((c) => (centralSize += c.length));
  const end = new Uint8Array(22);
  u32(end, 0, 0x06054b50); u16(end, 8, files.length); u16(end, 10, files.length);
  u32(end, 12, centralSize); u32(end, 16, centralStart);
  return concatBytes([...localChunks, ...centralChunks, end]);
}

function buildIco(entries: { size: number; png: Uint8Array }[]) {
  const count = entries.length;
  const header = new Uint8Array(6);
  u16(header, 2, 1); u16(header, 4, count);
  const dir: Uint8Array[] = [], data: Uint8Array[] = [];
  let dataOffset = 6 + 16 * count;
  entries.forEach((e) => {
    const wh = e.size >= 256 ? 0 : e.size;
    const entry = new Uint8Array(16);
    u8(entry, 0, wh); u8(entry, 1, wh); u16(entry, 4, 1); u16(entry, 6, 32);
    u32(entry, 8, e.png.length); u32(entry, 12, dataOffset);
    dir.push(entry); data.push(e.png);
    dataOffset += e.png.length;
  });
  return concatBytes([header, ...dir, ...data]);
}

function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(new Uint8Array(0));
      blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
    }, "image/png");
  });
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return btoa(binary);
}

function buildAdaptiveSvg(lightPngBytes: Uint8Array, darkPngBytes: Uint8Array, size: number) {
  const lightB64 = bytesToBase64(lightPngBytes);
  const darkB64 = bytesToBase64(darkPngBytes);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">`,
    "<style>",
    "  .ff-light{display:inline}",
    "  .ff-dark{display:none}",
    "  @media (prefers-color-scheme: dark){",
    "    .ff-light{display:none}",
    "    .ff-dark{display:inline}",
    "  }",
    "</style>",
    `<image class="ff-light" href="data:image/png;base64,${lightB64}" width="${size}" height="${size}"/>`,
    `<image class="ff-dark" href="data:image/png;base64,${darkB64}" width="${size}" height="${size}"/>`,
    "</svg>",
  ].join("\n");
}

// ---------------- React component ----------------
export default function IconsmithTool() {
  const [s, setS] = useToolState<Settings>("iconsmith", DEFAULT_SETTINGS);
  const update = useCallback((patch: Partial<Settings>) => setS((prev) => ({ ...prev, ...patch })), [setS]);

  const [source, setSource] = useState<ImageSource | null>(null);
  const [batchQueue, setBatchQueue] = useState<BatchItem[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [autoColor, setAutoColor] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [statusOk, setStatusOk] = useState(false);
  const [snippet, setSnippet] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);
  const repoStageRef = useRef<HTMLDivElement>(null);
  const repoCanvasRef = useRef<HTMLCanvasElement>(null);
  const tabIconRef = useRef<HTMLImageElement>(null);
  const homeCanvasRef = useRef<HTMLCanvasElement>(null);
  const ogCanvasRef = useRef<HTMLCanvasElement>(null);
  const rawCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const dragState = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  const batchIdCounter = useRef(0);

  const previewSource = useMemo(() => {
    if (batchMode && batchQueue.length > 0) return batchQueue[0];
    return source;
  }, [batchMode, batchQueue, source]);

  const ready = batchMode ? batchQueue.length > 0 : hasSource(s, source);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      document.fonts.load('700 58px "Space Grotesk"'),
      document.fonts.load('400 28px "Space Grotesk"'),
      document.fonts.load('500 20px "JetBrains Mono"'),
    ]).then(() => {
      if (mounted) setFontsReady(true);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  function loadFile(file: File) {
    if (!/^image\//.test(file.type)) {
      setStatus("That doesn't look like an image — try PNG, JPG, WebP, or SVG.");
      setStatusOk(false);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const isVector = /^image\/svg/.test(file.type);
        const master = buildMasterSource(img, isVector);
        setSource({
          canvas: master,
          isVector,
          nativeW: img.naturalWidth || 0,
          nativeH: img.naturalHeight || 0,
          dataUrl: reader.result as string,
          name: file.name,
        });
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setAutoColor(computeDominantColor(master));
        setStatus("Logo loaded. Adjust settings, then forge the pack.");
        setStatusOk(false);
        setSnippet(null);
      };
      img.onerror = () => { setStatus("Could not read that image — try a different file."); };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  function addBatchFiles(fileList: FileList | File[]) {
    Array.from(fileList).forEach((file) => {
      if (!/^image\//.test(file.type)) return;
      const id = "batch-" + (++batchIdCounter.current);
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const isVector = /^image\/svg/.test(file.type);
          setBatchQueue((prev) => [
            ...prev,
            {
              id,
              name: file.name,
              dataUrl: reader.result as string,
              canvas: buildMasterSource(img, isVector),
              isVector,
              nativeW: img.naturalWidth || 0,
              nativeH: img.naturalHeight || 0,
            },
          ]);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  function setPreviewMode(mode: PreviewMode) {
    update({ previewMode: mode });
  }

  // Reposition drag handlers
  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (s.sourceMode !== "image" || !source) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragState.current) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPan({
      x: clamp(dragState.current.panX + (e.clientX - dragState.current.startX) / rect.width, -0.45, 0.45),
      y: clamp(dragState.current.panY + (e.clientY - dragState.current.startY) / rect.height, -0.45, 0.45),
    });
  }
  function onPointerUp() {
    dragState.current = null;
  }
  function onWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    if (s.sourceMode !== "image" || !source) return;
    e.preventDefault();
    setZoom((z) => clamp(z + (e.deltaY > 0 ? -0.05 : 0.05), 0.5, 2.5));
  }

  // Redraw all previews whenever inputs change
  useEffect(() => {
    if (!ready) return;
    const preview = previewSource;

    if (s.sourceMode === "image" && source) {
      const repo = drawIcon(160, s, source, zoom, pan.x, pan.y);
      const rctx = repoCanvasRef.current?.getContext("2d");
      if (rctx && repoCanvasRef.current) {
        rctx.clearRect(0, 0, 160, 160);
        rctx.drawImage(repo, 0, 0);
      }
    }

    rawCanvasRefs.current.forEach((c, i) => {
      if (!c) return;
      const size = PACK_SIZES[i];
      const src = drawIcon(size, s, preview, zoom, pan.x, pan.y);
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(src, 0, 0);
    });

    const previewBg = s.previewMode === "dark"
      ? (s.adaptive ? s.adaptiveDarkBg : s.bg)
      : s.bg;
    const tab = drawIcon(32, s, preview, zoom, pan.x, pan.y, previewBg);
    if (tabIconRef.current) tabIconRef.current.src = tab.toDataURL("image/png");

    const home = drawIcon(512, s, preview, zoom, pan.x, pan.y);
    const hctx = homeCanvasRef.current?.getContext("2d");
    if (hctx && homeCanvasRef.current) {
      hctx.clearRect(0, 0, 512, 512);
      hctx.drawImage(home, 0, 0);
    }

    if (fontsReady && ogCanvasRef.current) {
      const og = drawOg(s, preview);
      const octx = ogCanvasRef.current.getContext("2d")!;
      octx.clearRect(0, 0, 1200, 630);
      octx.drawImage(og, 0, 0);
    }
  }, [s, source, previewSource, zoom, pan, ready, fontsReady]);

  const checks = useMemo<CheckResult[]>(() => {
    if (!ready) return [];
    const preview = previewSource;
    const out: CheckResult[] = [];

    let sLevel: CheckResult["level"], sMsg: string;
    if (s.sourceMode === "text") {
      sLevel = "ok"; sMsg = "Lettermark — vector text, pixel-perfect at every export size.";
    } else if (preview?.isVector) {
      sLevel = "ok"; sMsg = "Vector (SVG) source — rendered at high resolution, pixel-perfect at every size.";
    } else if (preview) {
      const maxNative = Math.max(preview.nativeW, preview.nativeH);
      if (maxNative >= 512) {
        sLevel = "ok"; sMsg = `Source is ${preview.nativeW}×${preview.nativeH}px — sharp even at the largest 512×512 export.`;
      } else if (maxNative >= 192) {
        sLevel = "warn"; sMsg = `Source is ${preview.nativeW}×${preview.nativeH}px — the 512×512 export will be upscaled and may look soft.`;
      } else if (maxNative > 0) {
        sLevel = "bad"; sMsg = `Source is only ${preview.nativeW}×${preview.nativeH}px — icons above that size will look noticeably blurry. A 512×512+ source (or SVG) is best.`;
      } else {
        sLevel = "warn"; sMsg = "Could not read the source resolution.";
      }
    } else {
      sLevel = "warn"; sMsg = "Upload an image to check its resolution.";
    }
    out.push({ level: sLevel, title: "Source resolution", msg: sMsg });

    let mLevel: CheckResult["level"], mMsg: string;
    if (s.padding >= 20) {
      mLevel = "ok"; mMsg = "Safe inside Android's maskable circle.";
    } else if (s.padding >= 10) {
      mLevel = "warn"; mMsg = "Close to the maskable edge — raise padding to 20%+ to be fully safe.";
    } else {
      mLevel = "bad"; mMsg = "Likely to get clipped by Android's maskable mask. Raise padding to ~20%.";
    }
    out.push({ level: mLevel, title: "Maskable safe zone", msg: mMsg });

    let dLevel: CheckResult["level"], dMsg: string;
    if (s.adaptive) {
      if (s.adaptiveDarkBg === "transparent") {
        dLevel = "warn";
        dMsg = "Adaptive icon is on, but its dark-mode background is transparent — give it a solid backing color so the artwork stays visible on dark tab bars.";
      } else {
        const ratio = contrastRatio(s.adaptiveDarkBg, DARK_CHROME_HEX);
        if (ratio >= 1.8) {
          dLevel = "ok";
          dMsg = `favicon.svg swaps in a ${s.adaptiveDarkBg.toUpperCase()} backing plate automatically when the browser or OS is in dark mode.`;
        } else {
          dLevel = "warn";
          dMsg = "That dark-mode background is close in tone to dark browser chrome — pick something with a bit more contrast.";
        }
      }
    } else if (s.bg === "transparent") {
      dLevel = "warn";
      dMsg = "This icon has no background — if the artwork itself is dark, it can disappear against dark browser tab bars. Turn on the adaptive favicon above to fix it automatically.";
    } else {
      const ratio = contrastRatio(s.bg, DARK_CHROME_HEX);
      if (ratio >= 1.8) {
        dLevel = "ok"; dMsg = "Icon background holds up fine against dark browser chrome.";
      } else {
        dLevel = "warn";
        dMsg = "Icon background is close in tone to dark browser chrome, so it may blend in for dark-mode users. Consider the adaptive favicon.";
      }
    }
    out.push({ level: dLevel, title: "Dark-mode visibility", msg: dMsg });

    const repHex = ogRepresentativeHex(s);
    const bgIsDark = luminance(repHex) < 0.5;
    const textHex = bgIsDark ? "#FFFFFF" : "#111318";
    const ratio = contrastRatio(repHex, textHex);
    let cLevel: CheckResult["level"], cMsg: string;
    if (ratio >= 7) { cLevel = "ok"; cMsg = `AAA (${ratio.toFixed(1)}:1) — title reads clearly at any size.`; }
    else if (ratio >= 4.5) { cLevel = "ok"; cMsg = `AA (${ratio.toFixed(1)}:1) — solid contrast for title and description.`; }
    else if (ratio >= 3) { cLevel = "warn"; cMsg = `AA for large text only (${ratio.toFixed(1)}:1) — fine for the bold title, tight for the description.`; }
    else { cLevel = "bad"; cMsg = `Low contrast (${ratio.toFixed(1)}:1) — try a different card background.`; }
    out.push({ level: cLevel, title: "OG card contrast", msg: cMsg });

    return out;
  }, [ready, previewSource, s]);

  async function forgePack() {
    if (!ready) return;
    setBusy(true);
    setStatusOk(false);
    setStatus("Forging — resizing, encoding, zipping…");
    try {
      if (!fontsReady) await document.fonts.ready;
      const src = previewSource;
      const pngBySize: Record<number, Uint8Array> = {};
      for (const size of PACK_SIZES) {
        pngBySize[size] = await canvasToPngBytes(drawIcon(size, s, src, zoom, pan.x, pan.y));
      }
      const icoEntries = ICO_SIZES.map((size) => ({ size, png: pngBySize[size] }));
      const icoBytes = buildIco(icoEntries);
      const maskable192 = await canvasToPngBytes(drawMaskableIcon(192, s, src, zoom, pan.x, pan.y));
      const maskable512 = await canvasToPngBytes(drawMaskableIcon(512, s, src, zoom, pan.x, pan.y));
      const mstileBytes = await canvasToPngBytes(drawIcon(150, s, src, zoom, pan.x, pan.y, s.tileColor));

      const manifest = {
        name: s.appName,
        short_name: s.shortName,
        icons: [
          { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/maskable-icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        theme_color: s.themeColor,
        background_color: s.manifestBg,
        display: "standalone",
      };
      const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest, null, 2));

      const browserconfig = [
        '<?xml version="1.0" encoding="utf-8"?>',
        "<browserconfig>",
        "  <msapplication>",
        "    <tile>",
        '      <square150x150logo src="/mstile-150x150.png"/>',
        `      <TileColor>${s.tileColor}</TileColor>`,
        "    </tile>",
        "  </msapplication>",
        "</browserconfig>",
      ].join("\n");

      const files: { name: string; data: Uint8Array }[] = [
        { name: "favicon.ico", data: icoBytes },
        { name: "favicon-16x16.png", data: pngBySize[16] },
        { name: "favicon-32x32.png", data: pngBySize[32] },
        { name: "favicon-48x48.png", data: pngBySize[48] },
        { name: "favicon-96x96.png", data: pngBySize[96] },
        { name: "apple-touch-icon.png", data: pngBySize[180] },
        { name: "android-chrome-192x192.png", data: pngBySize[192] },
        { name: "android-chrome-512x512.png", data: pngBySize[512] },
        { name: "maskable-icon-192x192.png", data: maskable192 },
        { name: "maskable-icon-512x512.png", data: maskable512 },
        { name: "mstile-150x150.png", data: mstileBytes },
        { name: "browserconfig.xml", data: new TextEncoder().encode(browserconfig) },
        { name: "site.webmanifest", data: manifestBytes },
      ];

      if (s.ogEnabled) {
        const ogBytes = await canvasToPngBytes(drawOg(s, src));
        files.push({ name: "og-image.png", data: ogBytes });
      }
      if (s.adaptive) {
        const ADAPTIVE_SVG_SIZE = 128;
        const lightBytes = await canvasToPngBytes(drawIcon(ADAPTIVE_SVG_SIZE, s, src, zoom, pan.x, pan.y, s.bg));
        const darkBytes = await canvasToPngBytes(drawIcon(ADAPTIVE_SVG_SIZE, s, src, zoom, pan.x, pan.y, s.adaptiveDarkBg));
        files.push({ name: "favicon.svg", data: new TextEncoder().encode(buildAdaptiveSvg(lightBytes, darkBytes, ADAPTIVE_SVG_SIZE)) });
      }

      const snippetText = buildSnippet(s);
      const readme = [
        "Iconsmith pack contents",
        "========================",
        "",
        ...files.map((f) => f.name),
        "",
        "Drop these into your site root, then paste this into <head>:",
        "",
        snippetText,
      ].join("\n");
      files.push({ name: "README.txt", data: new TextEncoder().encode(readme) });

      const zipBytes = buildZip(files);
      const blob = new Blob([zipBytes], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "iconsmith-pack.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);

      setStatus(`Pack forged — ${files.length} files, ${(zipBytes.length / 1024).toFixed(1)} KB.`);
      setStatusOk(true);
      setSnippet(snippetText);
    } catch (err) {
      setStatus(`Something went wrong: ${(err as Error).message}`);
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  function copySnippet() {
    if (!snippet) return;
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <ToolShell
      title="Iconsmith"
      description="Forge a complete favicon pack — browser icons, Apple touch icon, Android/PWA icons, maskable variants, an adaptive favicon.svg, a Windows tile, a 1200×630 Open Graph card, and the manifest — from a logo or initials, all in your browser."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-5">
      {/* ---- Source ---- */}
      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Source</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => update({ sourceMode: "image" })}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition ${
              s.sourceMode === "image"
                ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--ground)]"
                : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
            }`}
          >
            Image
          </button>
          <button
            type="button"
            onClick={() => update({ sourceMode: "text" })}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition ${
              s.sourceMode === "text"
                ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--ground)]"
                : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
            }`}
          >
            Text / initials
          </button>
        </div>
      </div>

      {s.sourceMode === "image" ? (
        <div className="space-y-4">
          {!batchMode && (
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-lg border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-6 text-center transition hover:border-[var(--gold-dim)]"
              >
                {source ? (
                  <span className="flex items-center justify-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={source.dataUrl} alt="" className="h-10 w-10 rounded object-contain" />
                    <span className="min-w-0 text-left">
                      <span className="block truncate text-sm font-medium text-[var(--ink)]">{source.name}</span>
                      <span className="block text-xs text-[var(--gold)]">Ready — click to change</span>
                    </span>
                  </span>
                ) : (
                  <span className="block text-sm font-medium text-[var(--ink)]">Drop a logo, or click to browse</span>
                )}
                <span className="mt-1 block text-xs text-[var(--ink-faint)]">PNG, JPG, WebP, SVG · 512×512+</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ""; }} />
            </div>
          )}

          {!batchMode && s.sourceMode === "image" && source && (
            <div>
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Reposition &amp; zoom</div>
              <div ref={repoStageRef} className="mx-auto h-40 w-40 touch-none overflow-hidden rounded-md border border-[var(--ground-line)] bg-[repeating-conic-gradient(var(--ground-line)_0%_25%,var(--ground-raised)_0%_50%)] bg-[length:12px_12px]">
                <canvas
                  ref={repoCanvasRef}
                  width={160}
                  height={160}
                  className="h-full w-full cursor-grab active:cursor-grabbing"
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onWheel={onWheel}
                />
              </div>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="range"
                  min={50}
                  max={250}
                  value={Math.round(zoom * 100)}
                  onChange={(e) => setZoom(+e.target.value / 100)}
                  className="flex-1 accent-[var(--gold)]"
                />
                <span className="w-12 text-right font-mono-ui text-xs text-[var(--ink-faint)]">{Math.round(zoom * 100)}%</span>
              </div>
              <button
                type="button"
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                className="mt-1 text-xs text-[var(--gold)] hover:underline"
              >
                Reset
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--ink)]">Batch mode — multiple logos, one export</span>
            <button
              type="button"
              role="switch"
              aria-checked={batchMode}
              onClick={() => setBatchMode((v) => !v)}
              className={`relative h-5 w-9 rounded-full transition ${batchMode ? "bg-[var(--gold)]" : "bg-[var(--ground-line)]"}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${batchMode ? "left-4.5" : "left-0.5"}`} />
            </button>
          </div>

          {batchMode && (
            <div>
              <button
                type="button"
                onClick={() => batchInputRef.current?.click()}
                className="w-full rounded-lg border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-6 text-center text-sm font-medium text-[var(--ink)] transition hover:border-[var(--gold-dim)]"
              >
                Drop multiple logos, or click to browse
                <span className="mt-1 block text-xs font-normal text-[var(--ink-faint)]">One full favicon pack is forged per logo</span>
              </button>
              <input ref={batchInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) addBatchFiles(e.target.files); e.target.value = ""; }} />
              {batchQueue.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {batchQueue.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2.5 py-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.dataUrl} alt="" className="h-6 w-6 rounded object-contain" />
                      <span className="min-w-0 flex-1 truncate text-xs text-[var(--ink)]">{item.name}</span>
                      <span className="font-mono-ui text-[10px] text-[var(--ink-faint)]">{item.isVector ? "SVG" : `${item.nativeW}×${item.nativeH}`}</span>
                      <button
                        type="button"
                        onClick={() => setBatchQueue((prev) => prev.filter((it) => it.id !== item.id))}
                        aria-label={`Remove ${item.name}`}
                        className="rounded p-1 text-[var(--ink-faint)] transition hover:text-[var(--danger)]"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Letters (1–3 characters)">
            <TextInput value={s.textIconChar} maxLength={3} onChange={(e) => update({ textIconChar: e.target.value })} />
          </Field>
          <Field label="Letter color">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                {["#FFFFFF", "#111318"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => update({ textIconColor: c })}
                    aria-label={c}
                    className={`h-7 w-7 rounded border-2 ${s.textIconColor.toLowerCase() === c.toLowerCase() ? "border-[var(--gold)]" : "border-[var(--ground-line)]"}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <input type="color" value={s.textIconColor} onChange={(e) => update({ textIconColor: e.target.value })} className="h-7 w-10 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
            </div>
          </Field>
        </div>
      )}

      {/* ---- Icon ---- */}
      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Icon</div>
        <div className="space-y-3">
          <Field label="Background">
            <div className="flex flex-wrap items-center gap-1.5">
              {[{ label: "transparent", sw: "transparent" }, { label: "#FFFFFF", sw: "#FFFFFF" }, { label: "#111318", sw: "#111318" }].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => update({ bg: opt.label === "transparent" ? "transparent" : opt.label })}
                  aria-label={opt.label}
                  title={opt.label}
                  className={`h-7 w-7 rounded border-2 ${s.bg === opt.label ? "border-[var(--gold)]" : "border-[var(--ground-line)]"}`}
                  style={{
                    background: opt.sw === "transparent"
                      ? "repeating-conic-gradient(var(--ground-line) 0% 25%, var(--ground-raised) 0% 50%)"
                      : opt.sw,
                    backgroundSize: "8px 8px",
                  }}
                />
              ))}
              {autoColor && (
                <button
                  type="button"
                  onClick={() => update({ bg: autoColor })}
                  aria-label="Auto, picked from your logo"
                  title="Auto — picked from your logo"
                  className={`h-7 w-7 rounded border-2 ${s.bg === autoColor ? "border-[var(--gold)]" : "border-[var(--ground-line)]"}`}
                  style={{ background: autoColor }}
                />
              )}
              <input type="color" value={s.bg === "transparent" ? "#FF5A1F" : s.bg} onChange={(e) => update({ bg: e.target.value })} className="h-7 w-10 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
            </div>
          </Field>
          <Field label="Padding" hint={`${s.padding}%`}>
            <input type="range" min={0} max={30} value={s.padding} onChange={(e) => update({ padding: +e.target.value })} className="w-full accent-[var(--gold)]" />
          </Field>
          <Field label="Corner rounding" hint={`${s.radius}%`}>
            <input type="range" min={0} max={50} value={s.radius} onChange={(e) => update({ radius: +e.target.value })} className="w-full accent-[var(--gold)]" />
          </Field>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--ink)]">Adaptive favicon.svg (auto light/dark)</span>
            <button
              type="button"
              role="switch"
              aria-checked={s.adaptive}
              onClick={() => update({ adaptive: !s.adaptive })}
              className={`relative h-5 w-9 rounded-full transition ${s.adaptive ? "bg-[var(--gold)]" : "bg-[var(--ground-line)]"}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${s.adaptive ? "left-4.5" : "left-0.5"}`} />
            </button>
          </div>

          {s.adaptive && (
            <Field label="Dark-mode background">
              <div className="flex flex-wrap items-center gap-1.5">
                {["transparent", "#FFFFFF", "#111318"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => update({ adaptiveDarkBg: opt })}
                    aria-label={opt}
                    title={opt}
                    className={`h-7 w-7 rounded border-2 ${s.adaptiveDarkBg === opt ? "border-[var(--gold)]" : "border-[var(--ground-line)]"}`}
                    style={{
                      background: opt === "transparent"
                        ? "repeating-conic-gradient(var(--ground-line) 0% 25%, var(--ground-raised) 0% 50%)"
                        : opt,
                      backgroundSize: "8px 8px",
                    }}
                  />
                ))}
                <input type="color" value={s.adaptiveDarkBg === "transparent" ? "#FFFFFF" : s.adaptiveDarkBg} onChange={(e) => update({ adaptiveDarkBg: e.target.value })} className="h-7 w-10 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
              </div>
            </Field>
          )}
        </div>
      </div>

      {/* ---- OG card ---- */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
          <span>Social card (OG)</span>
          <button
            type="button"
            role="switch"
            aria-checked={s.ogEnabled}
            onClick={() => update({ ogEnabled: !s.ogEnabled })}
            className={`relative h-5 w-9 rounded-full transition ${s.ogEnabled ? "bg-[var(--gold)]" : "bg-[var(--ground-line)]"}`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${s.ogEnabled ? "left-4.5" : "left-0.5"}`} />
          </button>
        </div>
        {s.ogEnabled && (
          <div className="space-y-3">
            <Field label="Card title"><TextInput value={s.ogTitle} maxLength={60} onChange={(e) => update({ ogTitle: e.target.value })} /></Field>
            <Field label="Card description"><TextInput value={s.ogDesc} maxLength={110} onChange={(e) => update({ ogDesc: e.target.value })} /></Field>
            <Field label="Card background">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: "gradient", label: "Gradient", sw: "linear-gradient(135deg,#FF5A1F,#111318)" },
                  { key: "dark", label: "Dark", sw: "#111318" },
                  { key: "light", label: "Light", sw: "#FAFAF9" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => update({ ogBgMode: opt.key as OgBgMode })}
                    aria-label={opt.label}
                    title={opt.label}
                    className={`h-7 w-7 rounded border-2 ${s.ogBgMode === opt.key ? "border-[var(--gold)]" : "border-[var(--ground-line)]"}`}
                    style={{ background: opt.sw }}
                  />
                ))}
                {autoColor && (
                  <button
                    type="button"
                    onClick={() => { setS((prev) => ({ ...prev, ogBgMode: "custom", ogCustomColor: autoColor })); }}
                    aria-label="Auto, picked from your logo"
                    title="Auto — picked from your logo"
                    className={`h-7 w-7 rounded border-2 ${s.ogBgMode === "custom" && s.ogCustomColor === autoColor ? "border-[var(--gold)]" : "border-[var(--ground-line)]"}`}
                    style={{ background: autoColor }}
                  />
                )}
                <input type="color" value={s.ogCustomColor} onChange={(e) => update({ ogBgMode: "custom", ogCustomColor: e.target.value })} className="h-7 w-10 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
              </div>
            </Field>
            <div>
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Layout</div>
              <div className="flex gap-2">
                {(["split", "centered"] as OgLayout[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => update({ ogLayout: l })}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold capitalize transition ${
                      s.ogLayout === l
                        ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--ground)]"
                        : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---- Meta ---- */}
      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Meta</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="App name"><TextInput value={s.appName} onChange={(e) => update({ appName: e.target.value })} /></Field>
          <Field label="Short name"><TextInput value={s.shortName} onChange={(e) => update({ shortName: e.target.value })} /></Field>
          <Field label="Domain (for card preview)"><TextInput value={s.domain} onChange={(e) => update({ domain: e.target.value })} /></Field>
          <Field label="Theme color">
            <div className="flex items-center gap-2">
              <input type="color" value={s.themeColor} onChange={(e) => update({ themeColor: e.target.value })} className="h-7 w-10 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
              <TextInput value={s.themeColor} onChange={(e) => update({ themeColor: e.target.value })} />
            </div>
          </Field>
          <Field label="Manifest bg">
            <div className="flex items-center gap-2">
              <input type="color" value={s.manifestBg} onChange={(e) => update({ manifestBg: e.target.value })} className="h-7 w-10 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
              <TextInput value={s.manifestBg} onChange={(e) => update({ manifestBg: e.target.value })} />
            </div>
          </Field>
          <Field label="Windows tile color">
            <div className="flex items-center gap-2">
              <input type="color" value={s.tileColor} onChange={(e) => update({ tileColor: e.target.value })} className="h-7 w-10 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
              <TextInput value={s.tileColor} onChange={(e) => update({ tileColor: e.target.value })} />
            </div>
          </Field>
        </div>
      </div>

      {/* ---- Forge ---- */}
      <button
        type="button"
        onClick={forgePack}
        disabled={!ready || busy}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40"
      >
        <Zap size={15} />
        {batchMode ? `Forge ${batchQueue.length} pack${batchQueue.length === 1 ? "" : "s"}` : "Forge pack"}
      </button>
      <p className={`text-xs ${statusOk ? "text-[var(--success)]" : status ? "text-[var(--ink-dim)]" : ""}`}>
        {status || (batchMode ? "Add logos to begin." : "Upload a logo or switch to Text mode to begin.")}
      </p>
        </div>

      {/* ---- Preview ---- */}
      <div className="min-w-0 space-y-5 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto">
      {ready ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-[var(--ink)]">Live preview</h3>
            <div className="flex rounded-full border border-[var(--ground-line)] p-0.5">
              {(["light", "dark"] as PreviewMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPreviewMode(m)}
                  aria-label={`Preview in ${m} mode`}
                  className={`rounded-full px-2.5 py-0.5 text-xs transition ${
                    s.previewMode === m ? "bg-[var(--ground-line)] text-[var(--ink)]" : "text-[var(--ink-faint)]"
                  }`}
                >
                  {m === "light" ? "☀" : "☾"}
                </button>
              ))}
            </div>
          </div>

          {/* Browser tab mock */}
          <div className="overflow-hidden rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)]">
            <div className="flex items-end gap-1.5 border-b border-[var(--ground-line)] bg-[var(--ground)] px-2.5 pt-2">
              <div className="mb-1.5 flex gap-1.5 px-1">
                <span className="h-2 w-2 rounded-full bg-[var(--ground-line)]" />
                <span className="h-2 w-2 rounded-full bg-[var(--ground-line)]" />
                <span className="h-2 w-2 rounded-full bg-[var(--ground-line)]" />
              </div>
              <div className="flex items-center gap-1.5 rounded-t-md border border-[var(--ground-line)] border-b-0 bg-[var(--ground-raised)] px-2.5 py-1.5 text-xs text-[var(--ink-dim)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img ref={tabIconRef} alt="" className="h-3.5 w-3.5 rounded" />
                <span className="max-w-36 truncate">{s.appName}</span>
              </div>
            </div>
            <div className="border-b border-[var(--ground-line)] px-3 py-1.5 font-mono-ui text-[11px] text-[var(--ink-faint)]">{s.domain}</div>
            <div className="h-14 bg-[repeating-linear-gradient(var(--ground-raised),var(--ground-raised)_8px,var(--ground-line)_8px,var(--ground-line)_9px)]" />
          </div>

          {/* Home screen tile + OG card */}
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex flex-col items-center gap-2 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-4">
              <canvas ref={homeCanvasRef} width={512} height={512} className="h-16 w-16 rounded-2xl border border-[var(--ground-line)]" />
              <span className="font-mono-ui text-[10px] text-[var(--ink-faint)]">home screen</span>
            </div>
            <div className="min-w-0 flex-1">
              {s.ogEnabled && (
                <div className="overflow-hidden rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)]">
                  <canvas ref={ogCanvasRef} width={1200} height={630} className="block w-full" style={{ aspectRatio: "1200/630" }} />
                  <div className="border-t border-[var(--ground-line)] px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--ink-faint)]">{s.domain}</div>
                    <div className="text-sm font-semibold text-[var(--ink)]">{s.ogTitle}</div>
                    <div className="line-clamp-2 text-xs text-[var(--ink-dim)]">{s.ogDesc}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quality checks */}
          <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4">
            {checks.map((c) => (
              <div key={c.title} className="flex items-start gap-2.5 border-b border-[var(--ground-line)] py-2.5 text-xs text-[var(--ink-dim)] last:border-b-0">
                <span
                  className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                    c.level === "ok" ? "bg-[var(--success)]" : c.level === "warn" ? "bg-[var(--gold)]" : "bg-[var(--danger)]"
                  }`}
                />
                <span><b className="font-medium text-[var(--ink)]">{c.title}</b> — {c.msg}</span>
              </div>
            ))}
          </div>

          {/* Raw sizes */}
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Raw icon sizes</div>
            <div className="flex flex-wrap gap-4">
              {PACK_SIZES.map((size, i) => (
                <div key={size} className="text-center">
                  <canvas
                    ref={(el) => { rawCanvasRefs.current[i] = el; }}
                    width={size}
                    height={size}
                    className="rounded border border-[var(--ground-line)] bg-[repeating-conic-gradient(var(--ground-line)_0%_25%,var(--ground-raised)_0%_50%)] bg-[length:8px_8px]"
                    style={{ width: Math.min(size, 56), height: Math.min(size, 56) }}
                  />
                  <div className="font-mono-ui text-[10px] text-[var(--ink-faint)]">{size}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Snippet */}
          {snippet && (
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">&lt;head&gt; snippet</div>
              <pre className="overflow-x-auto rounded-md bg-[#14161c] p-3 font-mono-ui text-xs leading-relaxed text-[#e9e9e7]">{snippet}</pre>
              <button
                type="button"
                onClick={copySnippet}
                className="mt-2 flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 font-mono-ui text-xs text-[var(--ink)] transition hover:border-[var(--gold-dim)]"
              >
                {copied ? <Check size={12} className="text-[var(--success)]" /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy snippet"}
              </button>
            </div>
          )}
        </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--ground-line)] px-4 py-12 text-center text-sm text-[var(--ink-faint)]">
            Add a logo (or switch to Text mode) and the live preview appears here.
          </div>
        )}
      </div>
      </div>
    </ToolShell>
  );
}
