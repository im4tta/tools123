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
