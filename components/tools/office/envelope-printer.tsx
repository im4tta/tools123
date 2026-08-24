"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import { PDFDocument } from "happypdf";
import {
  embedStudioFont,
  fitLines,
  hexToColor,
  STUDIO_FONTS,
} from "@/lib/studio/pdfShared";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const A4: [number, number] = [595.28, 841.89];
const FORMATS = [
  { id: "dl", label: "DL envelope (220 × 110 mm)", w: 623.62, h: 311.81 },
  { id: "c6", label: "C6 envelope (162 × 114 mm)", w: 459.21, h: 323.15 },
  { id: "labels", label: "A4 label sheet — 3 × 8", w: 0, h: 0 },
] as const;

interface Block {
  lines: string[];
}

export default function EnvelopePrinter() {
  const { text: t } = useLanguage();
  const [format, setFormat] = useToolState<"dl" | "c6" | "labels">("envelope:format", "dl");
  const [fontId, setFontId] = useToolState("envelope:font", "kantumruy");
  const [sender, setSender] = useToolState("envelope:sender", "");
  const [raw, setRaw] = useToolState(
    "envelope:input",
    "លោក សុខ ដារា\nផ្ទះលេខ ១២៣ ផ្លូវ ស៊ីសូវត្ថ\nសង្កាត់បឹងរាំង ខណ្ឌ៧មករា\nរាជធានីភ្នំពេញ",
  );
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const prevUrlRef = useRef<string | null>(null);

  const blocks = useMemo<Block[]>(
    () =>
      raw
        .split(/\n\s*\n+/)
        .map((b) => b.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))
        .filter((lines) => lines.length > 0)
        .map((lines) => ({ lines })),
    [raw],
  );

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (blocks.length === 0) {
        setPdfUrl(null);
        return;
      }
      setRendering(true);
      generate().catch(() => {}).finally(() => { if (!cancelled) setRendering(false); });

      async function generate() {
        const pdfDoc = await PDFDocument.create();
        const ink = hexToColor("#111111");
        const paper = hexToColor("#ffffff");

        if (format === "labels") {
          // 3 × 8 grid on A4
          const [pw, ph] = A4;
          const page = pdfDoc.addPage([pw, ph]);
          page.drawRectangle({ x: 0, y: 0, width: pw, height: ph, color: paper });
          const cols = 3;
          const rowsN = 8;
          const gapX = 12;
          const gapY = 4;
          const cellW = (pw - 24 - gapX * (cols - 1)) / cols;
          const cellH = (ph - 48 - gapY * (rowsN - 1)) / rowsN;
          const font = await embedStudioFont(pdfDoc, fontId, 400);
          let idx = 0;
          for (let r = 0; r < rowsN && idx < blocks.length; r++) {
            for (let cI = 0; cI < cols && idx < blocks.length; cI++) {
              const x = 12 + cI * (cellW + gapX);
              const yTop = ph - 24 - r * (cellH + gapY);
              const block = blocks[idx];
              const fit = fitLines(font, block.lines.join("\n"), 10, 5, cellW - 8, cellH - 6, 1.25);
              fit.lines.forEach((line, li) => {
                page.drawText(line, {
                  x: x + 4,
                  y: yTop - 12 - li * fit.size * 1.25,
                  font,
                  size: fit.size,
                  color: ink,
                  maxWidth: cellW - 8,
                  lineHeight: fit.size * 1.25,
                });
              });
              idx++;
            }
          }
        } else {
          const fmt = FORMATS.find((f) => f.id === format)!;
          const [ew, eh] = [fmt.w, fmt.h];
          for (const block of blocks) {
            const page = pdfDoc.addPage([ew, eh]);
            page.drawRectangle({ x: 0, y: 0, width: ew, height: eh, color: paper });
            const font = await embedStudioFont(pdfDoc, fontId, 400);
            const textW = ew * (sender.trim() ? 0.55 : 0.72);
            const x = ew * 0.36;
            const addressText = block.lines.join("\n");
            const fit = fitLines(font, addressText, 14, 7, textW, eh * 0.6, 1.35);
            const blockH = fit.lines.length * fit.size * 1.35;
            let y = eh / 2 + blockH / 2 - fit.size;
            fit.lines.forEach((line) => {
              const lw = font.widthOfTextAtSize(line, fit.size);
              const lx = sender.trim() ? x : x + (textW - lw) / 2;
              page.drawText(line, { x: lx, y, font, size: fit.size, color: ink });
              y -= fit.size * 1.35;
            });
            if (sender.trim()) {
              const sFont = await embedStudioFont(pdfDoc, fontId, 400);
              const sFit = fitLines(sFont, sender.trim(), 9, 6, ew * 0.28, eh * 0.3, 1.3);
              sFit.lines.forEach((line, i) => {
                page.drawText(line, { x: ew * 0.06, y: eh - 40 - i * sFit.size * 1.3, font: sFont, size: sFit.size, color: ink, opacity: 0.75 });
              });
            }
          }
        }

        const bytes = await pdfDoc.save();
        return new Blob([bytes], { type: "application/pdf" });
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [blocks, format, fontId, sender]);

  useEffect(
    () => () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    },
    [],
  );

  return (
    <ToolShell
      title="Envelope & Label Printer"
      khmerTitle="បោះពុម្ពសំបុត្រ និងស្លាក"
      description="Print Khmer addresses onto DL/C6 envelopes or A4 label sheets — correctly shaped, batch-ready."
      descriptionKm="បោះពុម្ពអាសយដ្ឋានខ្មែរលើសំបុត្រ DL/C6 ឬស្លាក A4 — បង្ហាញត្រឹមត្រូវ រួចរាល់ជាបាច់។"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            <Field label={t("Addresses", "អាសយដ្ឋាន")} hint={t("One address per block — separate with a blank line", "មួយអាសយដ្ឋានក្នុងមួយប្លុក — ញែកដោយបន្ទាត់ទំនេរ")}>
              <TextArea rows={11} value={raw} onChange={(e) => setRaw(e.target.value)} className="font-khmer" />
            </Field>
            <Field label={t("Sender (top-left, optional)", "អ្នកផ្ញើរ (ខាងលើឆ្វេង បើចង់)")}>
              <TextArea rows={2} value={sender} onChange={(e) => setSender(e.target.value)} className="font-khmer" />
            </Field>
          </div>

          <div className="space-y-3">
            <Field label={t("Format", "ទម្រង់")}>
              <Select value={format} onChange={(e) => setFormat(e.target.value as "dl" | "c6" | "labels")}>
                {FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </Select>
            </Field>
            <Field label={t("Font", "ពុម្ពអក្សរ")}>
              <select value={fontId} onChange={(e) => setFontId(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)]">
                {STUDIO_FONTS.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </Field>

            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[var(--ink-faint)]">
              <span>{t("Live PDF preview", "មើល PDF ជាមុន")}</span>
              <span>{rendering ? t("rendering…", "កំពុងបង្កើត…") : `${blocks.length} ${t("addresses", "អាសយដ្ឋាន")}`}</span>
            </div>
            {pdfUrl ? (
              <iframe src={`${pdfUrl}#toolbar=0&view=FitH`} title="Envelope preview" className="h-[420px] w-full rounded-xl border border-[var(--ground-line)] bg-white" />
            ) : (
              <div className="flex h-[420px] items-center justify-center rounded-xl border border-dashed border-[var(--ground-line)] text-xs text-[var(--ink-faint)]">
                {t("Enter at least one address.", "សូមបញ្ចូលអាសយដ្ឋានយ៉ាងតិចមួយ។")}
              </div>
            )}
            <button type="button" onClick={() => { if (!pdfUrl) return; const a = document.createElement("a"); a.href = pdfUrl; a.download = "envelopes.pdf"; a.click(); }} disabled={!pdfUrl} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40">
              <Download size={15} />{t("Download PDF", "ទាញយក PDF")}
            </button>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}