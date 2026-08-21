import { PDFDocument, PageSizes, wrapText } from "happypdf";
import { embedStudioFont, hexToColor } from "@/lib/studio/pdfShared";
import type { ExamQuestion } from "@/lib/studio/exam";

export interface ExamMeta {
  title: string;
  subtitle: string;
  fontId: string;
  paper: string;
  ink: string;
}

const MARGIN = 46;

export async function generateExamPdf(
  questions: ExamQuestion[],
  meta: ExamMeta,
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const [pageW, pageH] = PageSizes.A4;
  const contentWidth = pageW - MARGIN * 2;

  const titleFont = await embedStudioFont(pdfDoc, meta.fontId, 600);
  const bodyFont = await embedStudioFont(pdfDoc, meta.fontId, 400);
  const numberFont = await embedStudioFont(pdfDoc, meta.fontId, 600);

  const paper = hexToColor(meta.paper);
  const ink = hexToColor(meta.ink);

  let page = pdfDoc.addPage([pageW, pageH]);
  const newPage = () => {
    page = pdfDoc.addPage([pageW, pageH]);
    page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: paper });
    return pageH - MARGIN;
  };
  page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: paper });

  let y = pageH - MARGIN;

  // Header
  const examTitle = meta.title || "Exam";
  const examTitleSize = 22;
  const examTitleLineHeight = examTitleSize * 1.25;
  const examTitleLines = wrapText(
    examTitle,
    (t) => titleFont.widthOfTextAtSize(t, examTitleSize),
    { maxWidth: contentWidth },
  );
  page.drawText(examTitle, {
    x: MARGIN,
    y: y - examTitleSize,
    font: titleFont,
    size: examTitleSize,
    color: ink,
    maxWidth: contentWidth,
    lineHeight: examTitleLineHeight,
  });
  y -= examTitleLines.length * examTitleLineHeight;

  if (meta.subtitle) {
    page.drawText(meta.subtitle, {
      x: MARGIN,
      y: y - 12,
      font: bodyFont,
      size: 11,
      color: ink,
      opacity: 0.75,
      maxWidth: contentWidth,
    });
    y -= 12 * 1.6;
  }

  y -= 8;
  const fieldY = y - 10;
  page.drawText("Name:", { x: MARGIN, y: fieldY, font: bodyFont, size: 10.5, color: ink });
  page.drawLine({
    start: { x: MARGIN + 40, y: fieldY - 2 },
    end: { x: MARGIN + 250, y: fieldY - 2 },
    thickness: 0.75,
    color: ink,
  });
  page.drawText("Date:", {
    x: MARGIN + 280,
    y: fieldY,
    font: bodyFont,
    size: 10.5,
    color: ink,
  });
  page.drawLine({
    start: { x: MARGIN + 316, y: fieldY - 2 },
    end: { x: pageW - MARGIN, y: fieldY - 2 },
    thickness: 0.75,
    color: ink,
  });
  y = fieldY - 26;

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: pageW - MARGIN, y },
    thickness: 0.75,
    color: ink,
    opacity: 0.3,
  });
  y -= 22;

  const promptSize = 12;
  const promptLineHeight = promptSize * 1.35;
  const optionSize = 11;
  const optionLineHeight = optionSize * 1.35;
  const optionIndent = 22;
  const blankLineGap = 22;
  const questionGap = 20;

  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];
    const numberLabel = `${qi + 1}.`;
    const promptX = MARGIN + 22;
    const promptWidth = contentWidth - 22;

    const promptLines = wrapText(q.prompt, (t) => bodyFont.widthOfTextAtSize(t, promptSize), {
      maxWidth: promptWidth,
    });

    let blockHeight = promptLines.length * promptLineHeight;
    if (q.type === "mcq") {
      for (const opt of q.options) {
        const lines = wrapText(
          `${opt.label}) ${opt.text}`,
          (t) => bodyFont.widthOfTextAtSize(t, optionSize),
          { maxWidth: promptWidth - optionIndent },
        );
        blockHeight += lines.length * optionLineHeight;
      }
    } else {
      blockHeight += q.lines * blankLineGap;
    }

    if (y - blockHeight < MARGIN) {
      y = newPage();
    }

    page.drawText(numberLabel, {
      x: MARGIN,
      y: y - promptSize,
      font: numberFont,
      size: promptSize,
      color: ink,
    });
    page.drawText(q.prompt, {
      x: promptX,
      y: y - promptSize,
      font: bodyFont,
      size: promptSize,
      color: ink,
      maxWidth: promptWidth,
      lineHeight: promptLineHeight,
    });
    y -= promptLines.length * promptLineHeight;

    if (q.type === "mcq") {
      for (const opt of q.options) {
        const text = `${opt.label}) ${opt.text}`;
        const lines = wrapText(text, (t) => bodyFont.widthOfTextAtSize(t, optionSize), {
          maxWidth: promptWidth - optionIndent,
        });
        page.drawText(text, {
          x: promptX + optionIndent,
          y: y - optionSize,
          font: bodyFont,
          size: optionSize,
          color: ink,
          maxWidth: promptWidth - optionIndent,
          lineHeight: optionLineHeight,
        });
        y -= lines.length * optionLineHeight;
      }
    } else {
      for (let li = 0; li < q.lines; li++) {
        const lineY = y - blankLineGap * (li + 1) + 6;
        page.drawLine({
          start: { x: promptX, y: lineY },
          end: { x: pageW - MARGIN, y: lineY },
          thickness: 0.6,
          color: ink,
          opacity: 0.5,
        });
      }
      y -= q.lines * blankLineGap;
    }

    y -= questionGap;
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}

export async function generateExamAnswerKeyPdf(
  questions: ExamQuestion[],
  meta: ExamMeta,
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const [pageW, pageH] = PageSizes.A4;
  const contentWidth = pageW - MARGIN * 2;

  const titleFont = await embedStudioFont(pdfDoc, meta.fontId, 600);
  const bodyFont = await embedStudioFont(pdfDoc, meta.fontId, 400);

  const paper = hexToColor(meta.paper);
  const ink = hexToColor(meta.ink);

  let page = pdfDoc.addPage([pageW, pageH]);
  const newPage = () => {
    page = pdfDoc.addPage([pageW, pageH]);
    page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: paper });
    return pageH - MARGIN;
  };
  page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: paper });

  let y = pageH - MARGIN;
  const keyTitle = `${meta.title || "Exam"} — Answer Key`;
  const keyTitleSize = 20;
  const keyTitleLines = wrapText(
    keyTitle,
    (t) => titleFont.widthOfTextAtSize(t, keyTitleSize),
    { maxWidth: contentWidth },
  );
  const keyTitleLineHeight = keyTitleSize * 1.25;
  page.drawText(keyTitle, {
    x: MARGIN,
    y: y - keyTitleSize,
    font: titleFont,
    size: keyTitleSize,
    color: ink,
    maxWidth: contentWidth,
    lineHeight: keyTitleLineHeight,
  });
  y -= keyTitleLines.length * keyTitleLineHeight + keyTitleSize * 0.6;

  const size = 11.5;
  const lineHeight = size * 1.5;

  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];
    const answer =
      q.type === "mcq"
        ? q.correctLabel
          ? `${q.correctLabel}) ${q.options.find((o) => o.label === q.correctLabel)?.text ?? ""}`
          : "—"
        : q.answerText || "—";

    const text = `${qi + 1}. ${answer}`;
    const lines = wrapText(text, (t) => bodyFont.widthOfTextAtSize(t, size), {
      maxWidth: contentWidth,
    });
    const blockHeight = lines.length * lineHeight;

    if (y - blockHeight < MARGIN) y = newPage();

    page.drawText(text, {
      x: MARGIN,
      y: y - size,
      font: bodyFont,
      size,
      color: ink,
      maxWidth: contentWidth,
      lineHeight,
    });
    y -= blockHeight;
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}
