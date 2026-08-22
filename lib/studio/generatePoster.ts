import { PDFDocument } from "happypdf";
import { embedStudioFont, hexToColor } from "@/lib/studio/pdfShared";

export type Align = "left" | "center" | "right";

export interface PosterSize {
  id: string;
  label: string;
  widthPt: number;
  heightPt: number;
}

export const POSTER_SIZES: PosterSize[] = [
  { id: "a4", label: "A4 portrait", widthPt: 595.28, heightPt: 841.89 },
  { id: "a3", label: "A3 portrait", widthPt: 841.89, heightPt: 1190.55 },
  { id: "square", label: "Square", widthPt: 800, heightPt: 800 },
  { id: "story", label: "Story 9:16", widthPt: 675, heightPt: 1200 },
];

export interface PosterSwatch {
  id: string;
  label: string;
  paper: string;
  ink: string;
}

export const POSTER_SWATCHES: PosterSwatch[] = [
  { id: "paper", label: "Paper & ink", paper: "#f4eedd", ink: "#211b12" },
  { id: "night", label: "Lacquer night", paper: "#1c1712", ink: "#f4eedd" },
  { id: "sage", label: "Rice sage", paper: "#e7e6d6", ink: "#2c3a2c" },
  { id: "blush", label: "Kroma clay", paper: "#e9d9c9", ink: "#7a2a1f" },
];

export interface PosterConfig {
  headline: string;
  subline: string;
  caption: string;
  weight: number; // wght axis value
  fontId: string;
  align: Align;
  size: PosterSize;
  paper: string; // hex
  ink: string; // hex
}

// Fit the headline size to the frame: start big, shrink until the (wrapped)
// block fits within the available width and height for this font instance.
function fitHeadlineSize(
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  text: string,
  maxWidth: number,
  maxHeight: number,
) {
  let size = 160;
  const minSize = 28;
  while (size > minSize) {
    const lines = Math.max(
      1,
      Math.ceil(font.widthOfTextAtSize(text, size) / maxWidth),
    );
    const blockHeight = lines * size * 1.15;
    if (blockHeight <= maxHeight) break;
    size -= 2;
  }
  return size;
}

export async function generatePosterPdf(config: PosterConfig): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const { widthPt: w, heightPt: h } = config.size;
  const page = pdfDoc.addPage([w, h]);

  // Background
  page.drawRectangle({ x: 0, y: 0, width: w, height: h, color: hexToColor(config.paper) });

  const margin = w * 0.1;
  const contentWidth = w - margin * 2;
  const inkColor = hexToColor(config.ink);

  // Embed a distinct font instance per weight used on the page — each
  // `variations` combination produces its own instanced glyph outlines.
  const headlineFont = await embedStudioFont(pdfDoc, config.fontId, config.weight);
  const sublineFont = await embedStudioFont(pdfDoc, config.fontId, 400);
  const captionFont = await embedStudioFont(pdfDoc, config.fontId, 500);

  const headline = config.headline.trim() || " ";
  const headlineSize = fitHeadlineSize(headlineFont, headline, contentWidth, h * 0.5);
  const headlineLineHeight = headlineSize * 1.15;
  const headlineLines = Math.max(
    1,
    Math.ceil(headlineFont.widthOfTextAtSize(headline, headlineSize) / contentWidth),
  );
  const headlineBlockHeight = headlineLines * headlineLineHeight;

  const sublineSize = Math.max(14, headlineSize * 0.16);
  const hasSubline = config.subline.trim().length > 0;
  const sublineLineHeight = sublineSize * 1.35;

  const captionSize = 11;
  const hasCaption = config.caption.trim().length > 0;

  // Vertically center the headline (+ subline) block in the page.
  const blockHeight = headlineBlockHeight + (hasSubline ? sublineLineHeight * 2 + sublineSize : 0);
  let cursorY = h / 2 + blockHeight / 2;

  page.drawText(headline, {
    x: margin,
    y: cursorY - headlineSize,
    font: headlineFont,
    size: headlineSize,
    color: inkColor,
    maxWidth: contentWidth,
    lineHeight: headlineLineHeight,
    align: config.align,
  });
  cursorY -= headlineBlockHeight;

  if (hasSubline) {
    cursorY -= sublineSize * 0.6;
    page.drawText(config.subline.trim(), {
      x: margin,
      y: cursorY - sublineSize,
      font: sublineFont,
      size: sublineSize,
      color: inkColor,
      maxWidth: contentWidth,
      lineHeight: sublineLineHeight,
      align: config.align,
    });
  }

  if (hasCaption) {
    page.drawText(config.caption.trim().toUpperCase(), {
      x: margin,
      y: margin * 0.55,
      font: captionFont,
      size: captionSize,
      color: inkColor,
      maxWidth: contentWidth,
      align: "left",
    });
  }

  // Thin rule above the caption, echoing a print colophon
  if (hasCaption) {
    page.drawLine({
      start: { x: margin, y: margin * 0.55 + captionSize * 1.9 },
      end: { x: w - margin, y: margin * 0.55 + captionSize * 1.9 },
      thickness: 0.75,
      color: inkColor,
      opacity: 0.35,
    });
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}
