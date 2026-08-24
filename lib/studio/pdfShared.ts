import { rgb, wrapText, type Color, type PDFFont } from "happypdf";

export function hexToColor(hex: string): Color {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

/** Number of wrapped lines a paragraph will take at a given size/width. */
export function countWrappedLines(
  font: PDFFont,
  text: string,
  size: number,
  maxWidth: number,
) {
  if (!text) return 0;
  const lines = wrapText(text, (t) => font.widthOfTextAtSize(t, size), {
    maxWidth,
  });
  return lines.length;
}

export interface StudioFont {
  id: string;
  label: string;
  file: string;
  /** "variable" fonts instance live along wght; "static" fonts ignore the slider. */
  kind: "variable" | "static";
  min: number;
  max: number;
  defaultWeight: number;
  /** Extra variation axes some families require (e.g. Noto's wdth). */
  extraAxes?: Record<string, number>;
}

export const STUDIO_FONTS: StudioFont[] = [
  { id: "kantumruy", label: "Kantumruy Pro", file: "/fonts/KantumruyPro-Variable.ttf", kind: "variable", min: 100, max: 700, defaultWeight: 600 },
  { id: "noto-sans-khmer", label: "Noto Sans Khmer", file: "/fonts/NotoSansKhmer-Variable.ttf", kind: "variable", min: 100, max: 900, defaultWeight: 400, extraAxes: { wdth: 100 } },
  { id: "noto-serif-khmer", label: "Noto Serif Khmer", file: "/fonts/NotoSerifKhmer-Variable.ttf", kind: "variable", min: 100, max: 900, defaultWeight: 400, extraAxes: { wdth: 100 } },
  { id: "moul", label: "Moul", file: "/fonts/Moul-Regular.ttf", kind: "static", min: 400, max: 400, defaultWeight: 400 },
  { id: "bokor", label: "Bokor", file: "/fonts/Bokor-Regular.ttf", kind: "static", min: 400, max: 400, defaultWeight: 400 },
];

export function getStudioFont(id: string): StudioFont {
  return STUDIO_FONTS.find((f) => f.id === id) ?? STUDIO_FONTS[0];
}

const fontCache = new Map<string, ArrayBuffer>();

async function loadStudioFontBytes(id: string): Promise<ArrayBuffer> {
  const cached = fontCache.get(id);
  if (cached) return cached;
  const font = getStudioFont(id);
  const res = await fetch(font.file);
  if (!res.ok) throw new Error(`Could not load the ${font.label} font file.`);
  const bytes = await res.arrayBuffer();
  fontCache.set(id, bytes);
  return bytes;
}

/** Embeds the chosen studio font, instancing the wght axis for variable families. */
export async function embedStudioFont(
  pdfDoc: { embedFont: (bytes: ArrayBuffer, options?: Record<string, unknown>) => Promise<PDFFont> },
  fontId: string,
  weight: number,
): Promise<PDFFont> {
  const font = getStudioFont(fontId);
  const bytes = await loadStudioFontBytes(font.id);
  if (font.kind === "static") {
    return pdfDoc.embedFont(bytes, { subset: true });
  }
  const clamped = Math.min(font.max, Math.max(font.min, Math.round(weight)));
  return pdfDoc.embedFont(bytes, {
    variations: { wght: clamped, ...font.extraAxes },
    subset: true,
  });
}

/** Shrinks text until the wrapped block fits maxW × maxH. */
export function fitLines(
  font: PDFFont,
  text: string,
  maxSize: number,
  minSize: number,
  maxWidth: number,
  maxHeight: number,
  lineHeightFactor = 1.3,
): { size: number; lines: string[] } {
  let size = maxSize;
  while (size > minSize) {
    const lines = wrapText(text, (t) => font.widthOfTextAtSize(t, size), { maxWidth }).map((l) => l.text);
    if (lines.length * size * lineHeightFactor <= maxHeight) return { size, lines };
    size -= 1;
  }
  const lines = wrapText(text, (t) => font.widthOfTextAtSize(t, minSize), { maxWidth }).map((l) => l.text);
  return { size: minSize, lines };
}

type DrawLinePage = {
  drawLine: (opts: {
    start: { x: number; y: number };
    end: { x: number; y: number };
    thickness?: number;
    color?: Color;
    opacity?: number;
  }) => void;
};

/** Draws a dashed straight line between two points. */
export function drawDashedLine(
  page: DrawLinePage,
  opts: {
    start: { x: number; y: number };
    end: { x: number; y: number };
    thickness?: number;
    color?: Color;
    opacity?: number;
    dash?: number;
    gap?: number;
  },
): void {
  const { start, end } = opts;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  const dash = opts.dash ?? 4;
  const gap = opts.gap ?? 3;
  if (length === 0) return;
  const ux = dx / length;
  const uy = dy / length;
  let d = 0;
  while (d < length) {
    const segEnd = Math.min(d + dash, length);
    page.drawLine({
      start: { x: start.x + ux * d, y: start.y + uy * d },
      end: { x: start.x + ux * segEnd, y: start.y + uy * segEnd },
      thickness: opts.thickness ?? 0.75,
      color: opts.color,
      opacity: opts.opacity ?? 1,
    });
    d = segEnd + gap;
  }
}