import { PDFDocument, PageSizes } from "happypdf";
import { embedStudioFont, hexToColor } from "@/lib/studio/pdfShared";

export interface FlashcardEntry {
  front: string;
  back: string;
}

export interface FlashcardMeta {
  title: string;
  fontId: string;
  paper: string;
  ink: string;
  weight: number;
}

const MARGIN = 46;
const COLS = 3;
const ROWS = 4;
const PER_PAGE = COLS * ROWS;

type PDFPage = Awaited<ReturnType<PDFDocument["addPage"]>>;

/** Shrinks font size until `text` fits within `maxWidth`. */
function fitSize(
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  text: string,
  startSize: number,
  minSize: number,
  maxWidth: number,
) {
  let size = startSize;
  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) size -= 1;
  return size;
}

async function buildDeck(cards: FlashcardEntry[], meta: FlashcardMeta, side: "front" | "back") {
  const pdfDoc = await PDFDocument.create();
  const [pageW, pageH] = PageSizes.A4;

  const frontFont = await embedStudioFont(pdfDoc, meta.fontId, meta.weight);
  const backFont = await embedStudioFont(pdfDoc, meta.fontId, 400);
  const labelFont = await embedStudioFont(pdfDoc, meta.fontId, 500);

  const paper = hexToColor(meta.paper);
  const ink = hexToColor(meta.ink);

  const contentWidth = pageW - MARGIN * 2;
  const cardW = contentWidth / COLS;
  const cardH = (pageH - MARGIN * 2 - 26) / ROWS;
  const top = pageH - MARGIN - 20;

  let page: PDFPage = pdfDoc.addPage([pageW, pageH]);
  page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: paper });

  const deckHeader = `${meta.title || "Flashcards"} — ${side === "front" ? "Front" : "Back"}`;
  page.drawText(deckHeader, {
    x: MARGIN,
    y: pageH - MARGIN,
    font: labelFont,
    size: 10,
    color: ink,
    opacity: 0.5,
  });

  const pageCount = Math.ceil(cards.length / PER_PAGE) || 1;

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    if (pageIndex > 0) {
      page = pdfDoc.addPage([pageW, pageH]);
      page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: paper });
      page.drawText(deckHeader, {
        x: MARGIN,
        y: pageH - MARGIN,
        font: labelFont,
        size: 10,
        color: ink,
        opacity: 0.5,
      });
    }

    const slice = cards.slice(pageIndex * PER_PAGE, pageIndex * PER_PAGE + PER_PAGE);

    for (let i = 0; i < slice.length; i++) {
      const r = Math.floor(i / COLS);
      // Mirror column order on the back deck so a duplex "flip on long
      // edge" print lines each card's back up with its front.
      const c = side === "back" ? COLS - 1 - (i % COLS) : i % COLS;

      const x = MARGIN + c * cardW;
      const y = top - (r + 1) * cardH;
      const card = slice[i];

      page.drawRectangle({
        x,
        y,
        width: cardW,
        height: cardH,
        borderColor: ink,
        borderWidth: 0.75,
        borderDashArray: [3, 3],
        opacity: 0,
        borderOpacity: 0.45,
      });

      const pad = 10;
      if (side === "front") {
        const text = card.front || " ";
        const size = fitSize(frontFont, text, 30, 12, cardW - pad * 2);
        const w = frontFont.widthOfTextAtSize(text, size);
        page.drawText(text, {
          x: x + (cardW - w) / 2,
          y: y + cardH / 2 - size * 0.36,
          font: frontFont,
          size,
          color: ink,
        });
      } else {
        const text = card.back || " ";
        const size = fitSize(backFont, text, 15, 8, (cardW - pad * 2) * 2.2);
        const maxWidth = cardW - pad * 2;
        const lineHeight = size * 1.3;
        page.drawText(text, {
          x: x + pad,
          y: y + cardH / 2 + size * 0.5 - size,
          font: backFont,
          size,
          color: ink,
          maxWidth,
          align: "center",
          lineHeight,
        });
      }
    }
  }

  return pdfDoc;
}

export async function generateFlashcardsFrontPdf(
  cards: FlashcardEntry[],
  meta: FlashcardMeta,
): Promise<Blob> {
  const pdfDoc = await buildDeck(cards, meta, "front");
  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}

export async function generateFlashcardsBackPdf(
  cards: FlashcardEntry[],
  meta: FlashcardMeta,
): Promise<Blob> {
  const pdfDoc = await buildDeck(cards, meta, "back");
  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}
