"use client";
import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { ToolShell, Field, TextArea, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { CopyButton } from "@/components/CopyButton";
import { recordExport, getWatermarkEnabled, drawWatermark } from "@/lib/export";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const MAX_WORDS = 12;

interface Dir {
  dr: number;
  dc: number;
  label: [string, string];
}

const DIRS: Dir[] = [
  { dr: 0, dc: 1, label: ["right", "ស្ដាំ"] },
  { dr: 0, dc: -1, label: ["left", "ឆ្វេង"] },
  { dr: 1, dc: 0, label: ["down", "ចុះក្រោម"] },
  { dr: -1, dc: 0, label: ["up", "ឡើងលើ"] },
  { dr: 1, dc: 1, label: ["diagonal ↘", "ទ្រេត ↘"] },
  { dr: -1, dc: -1, label: ["diagonal ↖", "ទ្រេត ↖"] },
  { dr: 1, dc: -1, label: ["diagonal ↙", "ទ្រេត ↙"] },
  { dr: -1, dc: 1, label: ["diagonal ↗", "ទ្រេត ↗"] },
];

interface PlacedWord {
  word: string;
  row: number;
  col: number;
  dir: Dir;
}

interface Result {
  grid: string[][];
  placed: PlacedWord[];
  failed: string[];
}

function parseWords(input: string): string[] {
  return input
    .split(/[\n,]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
}

function generate(words: string[], size: number): Result {
  const grid: string[][] = Array.from({ length: size }, () => Array<string>(size).fill(""));
  const clean = words
    .map((w) => w.toUpperCase().replace(/[^A-Z]/g, ""))
    .filter((w) => w.length > 0 && w.length <= size)
    .slice(0, MAX_WORDS);
  const placed: PlacedWord[] = [];
  const failed: string[] = [];
  const ordered = [...clean].sort((a, b) => b.length - a.length);

  for (const word of ordered) {
    let done = false;
    for (let attempt = 0; attempt < 250 && !done; attempt++) {
      const dir = DIRS[Math.floor(Math.random() * DIRS.length)];
      const rMin = dir.dr === 0 ? 0 : dir.dr > 0 ? 0 : word.length - 1;
      const rMax = dir.dr === 0 ? size - 1 : dir.dr > 0 ? size - word.length : size - 1;
      const cMin = dir.dc === 0 ? 0 : dir.dc > 0 ? 0 : word.length - 1;
      const cMax = dir.dc === 0 ? size - 1 : dir.dc > 0 ? size - word.length : size - 1;
      if (rMin > rMax || cMin > cMax) continue;
      const row = rMin + Math.floor(Math.random() * (rMax - rMin + 1));
      const col = cMin + Math.floor(Math.random() * (cMax - cMin + 1));
      let ok = true;
      for (let k = 0; k < word.length; k++) {
        const cell = grid[row + dir.dr * k][col + dir.dc * k];
        if (cell !== "" && cell !== word[k]) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      for (let k = 0; k < word.length; k++) {
        grid[row + dir.dr * k][col + dir.dc * k] = word[k];
      }
      placed.push({ word, row, col, dir });
      done = true;
    }
    if (!done) failed.push(word);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) {
        grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
    }
  }

  return { grid, placed, failed };
}

export default function WordSearchGenerator() {
  const { text: t } = useLanguage();
  const [wordsInput, setWordsInput] = useToolState("word-search:words", "CAT\nDOG\nSUN");
  const [size, setSize] = useToolState("word-search:size", "12");
  const [result, setResult] = useState<Result>(() => generate(parseWords("CAT\nDOG\nSUN"), 12));

  const regenerate = (sizeNum: number = Number(size) || 12) => {
    setResult(generate(parseWords(wordsInput), sizeNum));
  };

  const gridText = useMemo(() => result.grid.map((row) => row.join(" ")).join("\n"), [result]);

  /** Renders the puzzle (title, word list, letter grid) to a PNG download. */
  const exportPng = () => {
    const n = result.grid.length;
    if (n < 1) return;
    const cell = 44;
    const pad = 30;
    const words = result.placed.map((p) => p.word);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.font = "700 26px 'Segoe UI', 'Noto Sans Khmer', sans-serif";
    ctx.fillText("Word Search", pad, 40); // probe for font load, real text drawn below
    ctx.font = "14px 'Segoe UI', 'Noto Sans Khmer', sans-serif";
    const joined = words.join("  •  ");
    const maxTextW = n * cell;
    const subLines: string[] = [];
    if (joined) {
      let line = "";
      for (const part of joined.split(" ")) {
        const test = line ? `${line} ${part}` : part;
        if (ctx.measureText(test).width > maxTextW && line) {
          subLines.push(line);
          line = part;
        } else {
          line = test;
        }
      }
      if (line) subLines.push(line);
    }
    const gridTop = 62 + Math.max(0, subLines.length - 1) * 20 + 18;
    canvas.width = n * cell + pad * 2;
    canvas.height = gridTop + n * cell + pad;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#111827";
    ctx.font = "700 26px 'Segoe UI', 'Noto Sans Khmer', sans-serif";
    ctx.fillText("Word Search", pad, 40);
    if (subLines.length) {
      ctx.font = "14px 'Segoe UI', 'Noto Sans Khmer', sans-serif";
      ctx.fillStyle = "#374151";
      subLines.forEach((ln, i) => ctx.fillText(ln, pad, 62 + i * 20));
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 19px 'Segoe UI', 'Noto Sans Khmer', sans-serif";
    ctx.fillStyle = "#111827";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        ctx.fillText(result.grid[r][c], pad + c * cell + cell / 2, gridTop + r * cell + cell / 2);
      }
    }
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      ctx.moveTo(pad + i * cell, gridTop);
      ctx.lineTo(pad + i * cell, gridTop + n * cell);
      ctx.moveTo(pad, gridTop + i * cell);
      ctx.lineTo(pad + n * cell, gridTop + i * cell);
    }
    ctx.stroke();
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 2;
    ctx.strokeRect(pad, gridTop, n * cell, n * cell);
    // Respect the global watermark toggle: stamp `123tool.app` in the corner when on.
    if (getWatermarkEnabled()) drawWatermark(ctx, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "word-search.png";
      a.click();
      URL.revokeObjectURL(a.href);
      recordExport();
    }, "image/png");
  };

  /** Builds a crisp vector A4 PDF (title, word list, letter grid) via jsPDF. */
  const exportPdf = () => {
    const n = result.grid.length;
    if (n < 1) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 16;
    const avail = pageW - margin * 2;
    const words = result.placed.map((p) => p.word);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(20);
    doc.text("Word Search", margin, 22);
    let gridTop = 40;
    if (words.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(110);
      doc.text("Find these words:", margin, 30);
      doc.setFontSize(12);
      doc.setTextColor(40);
      const subLines = doc.splitTextToSize(words.join("  •  "), avail);
      doc.text(subLines, margin, 36);
      gridTop = 36 + (subLines.length - 1) * 5 + 14;
    }
    const cell = avail / n;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(cell * 0.45);
    doc.setTextColor(20);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        doc.text(result.grid[r][c], margin + c * cell + cell / 2, gridTop + r * cell + cell / 2 + cell * 0.08, { align: "center" });
      }
    }
    doc.setDrawColor(205);
    doc.setLineWidth(0.15);
    for (let i = 0; i <= n; i++) {
      doc.line(margin + i * cell, gridTop, margin + i * cell, gridTop + n * cell);
      doc.line(margin, gridTop + i * cell, margin + n * cell, gridTop + i * cell);
    }
    doc.setDrawColor(60);
    doc.setLineWidth(0.4);
    doc.rect(margin, gridTop, avail, avail);
    doc.save("word-search.pdf");
    recordExport();
  };
  const wordCount = parseWords(wordsInput).length;

  return (
    <ToolShell
      title="Word Search Generator"
      khmerTitle="បង្កើតល្បែងស្វែងរកពាក្យ"
      description="Create a printable letter grid with your words hidden horizontally, vertically and diagonally, plus the solution list."
      descriptionKm="បង្កើតក្រឡាចត្រង្គអក្សរដែលអាចបោះពុម្ពបាន ដោយលាក់ពាក្យរបស់អ្នកតាមជួរដេក ជួរឈរ និងទ្រេត ព្រមទាំងបញ្ជីចម្លើយ។"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Field label={t("Words (one per line)", "ពាក្យ (មួយក្នុងមួយជួរ)")} hint={t("up to 12", "រហូតដល់ ១២")}>
            <TextArea
              rows={6}
              value={wordsInput}
              onChange={(e) => setWordsInput(e.target.value)}
              placeholder={t("CAT\nDOG\nSUN", "CAT\nDOG\nSUN")}
            />
          </Field>
          <Row>
            <Field label={t("Grid size", "ទំហំក្រឡាចត្រង្គ")}>
              <Select
                value={size}
                onChange={(e) => {
                  setSize(e.target.value);
                  regenerate(Number(e.target.value) || 12);
                }}
              >
                {["8", "10", "12", "14", "16"].map((s) => (
                  <option key={s} value={s}>
                    {s} × {s}
                  </option>
                ))}
              </Select>
            </Field>
          </Row>
          {wordCount > MAX_WORDS && (
            <p className="text-xs text-[var(--danger)]">
              {t("Only the first 12 words are used.", "ប្រើតែពាក្យ ១២ ដំបូងប៉ុណ្ណោះ។")}
            </p>
          )}
          <Button type="button" onClick={() => regenerate()}>
            {t("Generate puzzle", "បង្កើតល្បែង")}
          </Button>
        </div>

        <div className="space-y-3">
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
            <pre className="overflow-x-auto font-mono-ui text-sm leading-6 text-[var(--ink)]">{gridText}</pre>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" onClick={exportPng} className="!bg-[var(--ground-raised)] !text-[var(--ink)]">
              {t("PNG", "PNG")}
            </Button>
            <Button type="button" onClick={exportPdf} className="!bg-[var(--ground-raised)] !text-[var(--ink)]">
              {t("PDF", "PDF")}
            </Button>
            <CopyButton text={gridText} />
          </div>
          <div className="rounded-md border border-[var(--ground-line)]">
            <div className="border-b border-[var(--ground-line)] px-3 py-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
              {t("Solution", "ចម្លើយ")}
            </div>
            <div className="divide-y divide-[var(--ground-line)]">
              {result.placed.map((p) => (
                <div key={p.word} className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm">
                  <span className="font-medium text-[var(--gold)]">{p.word}</span>
                  <span className="text-xs text-[var(--ink-dim)]">
                    ({p.row + 1}, {p.col + 1}) {t(p.dir.label[0], p.dir.label[1])}
                  </span>
                </div>
              ))}
              {result.failed.length > 0 && (
                <div className="px-3 py-1.5 text-xs text-[var(--danger)]">
                  {t("Could not place", "មិនអាចដាក់បាន")}: {result.failed.join(", ")}
                </div>
              )}
              {result.placed.length === 0 && result.failed.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-[var(--ink-faint)]">
                  {t("Add some words to generate a puzzle.", "បន្ថែមពាក្យខ្លះ ដើម្បីបង្កើតល្បែង។")}
                </div>
              )}
            </div>
          </div>
          <p className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
            {t(
              "Words are placed automatically in random directions; words longer than the grid are skipped. Download the puzzle as a PNG image or a print-ready A4 PDF, or copy the plain-text grid.",
              "ពាក្យត្រូវបានដាក់ដោយស្វ័យប្រវត្តិតាមទិសចៃដន្យ ពាក្យវែងជាងក្រឡាត្រូវរំលង។ ទាញយកល្បែងជារូបភាព PNG ឬ PDF ទំហំ A4 ដែលរួចរាល់សម្រាប់ការបោះពុម្ព ឬចម្លងក្រឡាអក្សរធម្មតា។"
            )}
          </p>
        </div>
      </div>
    </ToolShell>
  );
}
