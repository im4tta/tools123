import { PDFDocument, PageSizes, wrapText } from "happypdf";
import { embedStudioFont, hexToColor } from "@/lib/studio/pdfShared";
import type { WordSearchGrid } from "@/lib/studio/wordsearch";

export interface WordSearchMeta {
  title: string;
  fontId: string;
  paper: string;
  ink: string;
}

const MARGIN = 42;

async function buildDoc(grid: WordSearchGrid, meta: WordSearchMeta, showAnswers: boolean) {
  const pdfDoc = await PDFDocument.create();
  const [pageW, pageH] = PageSizes.A4;

  const titleFont = await embedStudioFont(pdfDoc, meta.fontId, 600);
  const labelFont = await embedStudioFont(pdfDoc, meta.fontId, 400);
  const cellFont = await embedStudioFont(pdfDoc, meta.fontId, 500);

  const paper = hexToColor(meta.paper);
  const ink = hexToColor(meta.ink);
  const highlight = hexToColor(meta.ink);

  let page = pdfDoc.addPage([pageW, pageH]);
  page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: paper });

  const contentWidth = pageW - MARGIN * 2;
  let cursorY = pageH - MARGIN;

  // Title
  const wsTitle = meta.title || "Word Search";
  const wsTitleSize = 24;
  const wsTitleLineHeight = wsTitleSize * 1.25;
  const wsTitleLines = wrapText(
    wsTitle,
    (t) => titleFont.widthOfTextAtSize(t, wsTitleSize),
    { maxWidth: contentWidth },
  );
  page.drawText(wsTitle, {
    x: MARGIN,
    y: cursorY - wsTitleSize,
    font: titleFont,
    size: wsTitleSize,
    color: ink,
    maxWidth: contentWidth,
    lineHeight: wsTitleLineHeight,
  });
  cursorY -= wsTitleLines.length * wsTitleLineHeight;

  if (showAnswers) {
    page.drawText("ANSWER KEY", {
      x: MARGIN,
      y: cursorY - 11,
      font: labelFont,
      size: 10,
      color: ink,
      opacity: 0.6,
    });
  }
  cursorY -= 30;

  // Grid — sized to fit the content width and a portion of the page height.
  const maxGridSide = Math.min(contentWidth, pageH * 0.58);
  const cell = maxGridSide / grid.size;
  const gridX = MARGIN + (contentWidth - cell * grid.size) / 2;
  const gridTopY = cursorY;

  // Highlights for found words (answer key only) — one rectangle per letter
  // cell, so single-grapheme words (very common in Khmer, where a whole
  // stacked syllable can be one cell) still show a visible highlight instead
  // of a zero-length line.
  if (showAnswers) {
    for (const p of grid.placements) {
      const [dr, dc] = p.dir;
      for (let i = 0; i < p.graphemes.length; i++) {
        const r = p.row + dr * i;
        const c = p.col + dc * i;
        page.drawRectangle({
          x: gridX + c * cell + cell * 0.06,
          y: gridTopY - (r + 1) * cell + cell * 0.06,
          width: cell * 0.88,
          height: cell * 0.88,
          color: highlight,
          opacity: 0.16,
        });
      }
    }
  }

  // Grid border
  page.drawRectangle({
    x: gridX,
    y: gridTopY - cell * grid.size,
    width: cell * grid.size,
    height: cell * grid.size,
    borderColor: ink,
    borderWidth: 0.75,
  });

  // Letters
  const letterSize = cell * 0.5;
  for (let r = 0; r < grid.size; r++) {
    for (let c = 0; c < grid.size; c++) {
      const g = grid.cells[r][c];
      const w = cellFont.widthOfTextAtSize(g, letterSize);
      const x = gridX + c * cell + (cell - w) / 2;
      const y = gridTopY - (r + 1) * cell + cell * 0.24;
      page.drawText(g, { x, y, font: cellFont, size: letterSize, color: ink });
    }
  }

  cursorY = gridTopY - cell * grid.size - 24;

  // Word list — measured as one block and moved to a fresh page if it
  // wouldn't fit, rather than letting rows run off the bottom of the page.
  const listHeaderSize = 12;
  const wordSize = 11;
  const colGap = 20;
  const colWidth = (contentWidth - colGap * 2) / 3;
  const rowsPerCol = Math.ceil(grid.placements.length / 3) || 1;
  const rowHeight = wordSize * 1.7;
  const listBlockHeight = listHeaderSize * 1.9 + rowsPerCol * rowHeight;

  if (cursorY - listBlockHeight < MARGIN) {
    page = pdfDoc.addPage([pageW, pageH]);
    page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: paper });
    cursorY = pageH - MARGIN;
  }

  page.drawText(showAnswers ? "WORDS FOUND" : "FIND THESE WORDS", {
    x: MARGIN,
    y: cursorY - listHeaderSize,
    font: titleFont,
    size: listHeaderSize,
    color: ink,
  });
  cursorY -= listHeaderSize * 1.9;

  const listTopY = cursorY;

  grid.placements.forEach((p, i) => {
    const col = Math.floor(i / rowsPerCol);
    const rowInCol = i % rowsPerCol;
    const x = MARGIN + col * (colWidth + colGap);
    const y = listTopY - rowInCol * rowHeight;
    const label = p.clue ? `${p.text} — ${p.clue}` : p.text;
    page.drawText(label, {
      x,
      y: y - wordSize,
      font: labelFont,
      size: wordSize,
      color: ink,
      maxWidth: colWidth,
    });
  });
  cursorY = listTopY - rowsPerCol * rowHeight - 10;

  if (grid.skipped.length > 0) {
    page.drawText(
      `Not placed (grid too small): ${grid.skipped.map((s) => s.text).join(", ")}`,
      {
        x: MARGIN,
        y: cursorY - 9,
        font: labelFont,
        size: 9,
        color: ink,
        opacity: 0.55,
      },
    );
  }

  return pdfDoc;
}

export async function generateWordSearchPuzzlePdf(
  grid: WordSearchGrid,
  meta: WordSearchMeta,
): Promise<Blob> {
  const pdfDoc = await buildDoc(grid, meta, false);
  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}

export async function generateWordSearchAnswerPdf(
  grid: WordSearchGrid,
  meta: WordSearchMeta,
): Promise<Blob> {
  const pdfDoc = await buildDoc(grid, meta, true);
  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}
