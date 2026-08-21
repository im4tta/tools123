import { PDFDocument, PageSizes, wrapText } from "happypdf";
import { embedStudioFont, hexToColor } from "@/lib/studio/pdfShared";
import type { CrosswordGrid } from "@/lib/studio/crossword";

export interface CrosswordMeta {
  title: string;
  fontId: string;
  paper: string;
  ink: string;
}

const MARGIN = 42;
const GAP_ABOVE_CLUES = 24;

async function buildDoc(grid: CrosswordGrid, meta: CrosswordMeta, showLetters: boolean) {
  const pdfDoc = await PDFDocument.create();
  const [pageW, pageH] = PageSizes.A4;

  const titleFont = await embedStudioFont(pdfDoc, meta.fontId, 600);
  const labelFont = await embedStudioFont(pdfDoc, meta.fontId, 400);
  const cellFont = await embedStudioFont(pdfDoc, meta.fontId, 600);
  const numberFont = await embedStudioFont(pdfDoc, meta.fontId, 500);

  const paper = hexToColor(meta.paper);
  const ink = hexToColor(meta.ink);

  let page = pdfDoc.addPage([pageW, pageH]);
  page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: paper });

  const contentWidth = pageW - MARGIN * 2;
  let cursorY = pageH - MARGIN;

  // Title
  const cwTitle = meta.title || "Crossword";
  const cwTitleSize = 24;
  const cwTitleLineHeight = cwTitleSize * 1.25;
  const cwTitleLines = wrapText(
    cwTitle,
    (t) => titleFont.widthOfTextAtSize(t, cwTitleSize),
    { maxWidth: contentWidth },
  );
  page.drawText(cwTitle, {
    x: MARGIN,
    y: cursorY - cwTitleSize,
    font: titleFont,
    size: cwTitleSize,
    color: ink,
    maxWidth: contentWidth,
    lineHeight: cwTitleLineHeight,
  });
  cursorY -= cwTitleLines.length * cwTitleLineHeight;

  page.drawText(showLetters ? "ANSWER KEY" : "", {
    x: MARGIN,
    y: cursorY - 11,
    font: labelFont,
    size: 10,
    color: ink,
    opacity: 0.6,
  });
  cursorY -= 34;

  // Grid — sized to fit the content width, capped so a tall grid still fits
  // above the clue lists.
  const maxGridHeight = pageH * 0.5;
  const cell = Math.max(
    14,
    Math.min(
      contentWidth / Math.max(grid.width, 1),
      maxGridHeight / Math.max(grid.height, 1),
      34,
    ),
  );
  const gridH = cell * grid.height;
  const gridX = MARGIN;
  const gridTopY = cursorY;
  const gridBottomY = gridTopY - gridH;

  // Cell fills + borders
  for (let r = 0; r < grid.height; r++) {
    for (let c = 0; c < grid.width; c++) {
      const has = grid.cells.has(`${r},${c}`);
      const x = gridX + c * cell;
      const y = gridTopY - (r + 1) * cell;
      if (has) {
        page.drawRectangle({
          x,
          y,
          width: cell,
          height: cell,
          borderColor: ink,
          borderWidth: 0.75,
          color: paper,
        });
      }
    }
  }

  // Numbers
  const numberSize = Math.max(6, cell * 0.26);
  for (const [k, num] of grid.numbers) {
    const [r, c] = k.split(",").map(Number);
    const x = gridX + c * cell + cell * 0.08;
    const y = gridTopY - r * cell - numberSize - cell * 0.06;
    page.drawText(String(num), {
      x,
      y,
      font: numberFont,
      size: numberSize,
      color: ink,
    });
  }

  // Letters (answer key only)
  if (showLetters) {
    const letterSize = cell * 0.55;
    for (const word of grid.words) {
      for (let i = 0; i < word.graphemes.length; i++) {
        const r = word.dir === "down" ? word.row + i : word.row;
        const c = word.dir === "across" ? word.col + i : word.col;
        const g = word.graphemes[i];
        const w = cellFont.widthOfTextAtSize(g, letterSize);
        const x = gridX + c * cell + (cell - w) / 2;
        const y = gridTopY - (r + 1) * cell + cell * 0.22;
        page.drawText(g, { x, y, font: cellFont, size: letterSize, color: ink });
      }
    }
  }

  cursorY = gridBottomY - GAP_ABOVE_CLUES;

  // Clue lists — two columns, Across then Down.
  const across = grid.words.filter((w) => w.dir === "across");
  const down = grid.words.filter((w) => w.dir === "down");
  const colGap = 24;
  const colWidth = (contentWidth - colGap) / 2;
  const clueSize = 10.5;
  const clueLineHeight = clueSize * 1.4;
  const headerSize = 12;

  function drawClueColumn(
    heading: string,
    words: typeof across,
    x: number,
  ) {
    let y = cursorY;
    y -= headerSize;
    page.drawText(heading, { x, y, font: titleFont, size: headerSize, color: ink });
    y -= headerSize * 0.9;

    for (const w of words) {
      const text = `${w.number}. ${w.clue || w.text}`;
      const lines = wrapText(text, (t) => labelFont.widthOfTextAtSize(t, clueSize), {
        maxWidth: colWidth,
      });
      const blockHeight = lines.length * clueLineHeight;

      if (y - blockHeight < MARGIN) {
        page = pdfDoc.addPage([pageW, pageH]);
        page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: paper });
        y = pageH - MARGIN;
      }

      y -= clueSize;
      page.drawText(text, {
        x,
        y,
        font: labelFont,
        size: clueSize,
        color: ink,
        maxWidth: colWidth,
        lineHeight: clueLineHeight,
      });
      y -= blockHeight - clueSize + clueSize * 0.5;
    }
  }

  drawClueColumn("ACROSS", across, MARGIN);
  drawClueColumn("DOWN", down, MARGIN + colWidth + colGap);

  return pdfDoc;
}

export async function generateCrosswordPuzzlePdf(
  grid: CrosswordGrid,
  meta: CrosswordMeta,
): Promise<Blob> {
  const pdfDoc = await buildDoc(grid, meta, false);
  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}

export async function generateCrosswordAnswerPdf(
  grid: CrosswordGrid,
  meta: CrosswordMeta,
): Promise<Blob> {
  const pdfDoc = await buildDoc(grid, meta, true);
  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}
