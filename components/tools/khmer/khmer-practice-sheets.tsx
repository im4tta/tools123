"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import { PDFDocument, PageSizes } from "happypdf";
import {
  embedStudioFont,
  hexToColor,
  STUDIO_FONTS,
} from "@/lib/studio/pdfShared";
import { ToolShell, TextArea, TextInput, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface Item {
  text: string;
}

const PAGE = PageSizes.A4;
const MARGIN = 46;

async function generatePracticePdf(
  items: Item[],
  opts: { title: string; fontId: string; paper: string; ink: string; traces: number },
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const contentWidth = PAGE[0] - MARGIN * 2;

  const titleFont = await embedStudioFont(pdfDoc, opts.fontId, 600);
  const labelFont = await embedStudioFont(pdfDoc, opts.fontId, 400);
  const glyphFont = await embedStudioFont(pdfDoc, opts.fontId, 500);

  const ink = hexToColor(opts.ink);
  const paper = hexToColor(opts.paper);

  let page = pdfDoc.addPage([PAGE[0], PAGE[1]]);
  page.drawRectangle({ x: 0, y: 0, width: PAGE[0], height: PAGE[1], color: paper });

  const newPage = () => {
    page = pdfDoc.addPage([PAGE[0], PAGE[1]]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE[0], height: PAGE[1], color: paper });
    return PAGE[1] - MARGIN;
  };

  let y = PAGE[1] - MARGIN;
  const titleSize = 20;
  page.drawText(opts.title || "Practice", {
    x: MARGIN,
    y: y - titleSize,
    font: titleFont,
    size: titleSize,
    color: ink,
  });
  y -= titleSize * 1.6 + 8;

  const cellW = 78;
  const cellH = 58;
  const perRow = Math.max(1, Math.floor(contentWidth / cellW));
  const exampleCells = 1;

  for (const item of items) {
    if (y - cellH - 26 < MARGIN) y = newPage();

    // Item label above the band
    page.drawText(item.text.slice(0, 40), {
      x: MARGIN,
      y: y - 10,
      font: labelFont,
      size: 9,
      color: ink,
      opacity: 0.65,
    });
    y -= cellH;

    for (let c = 0; c < perRow; c++) {
      const x = MARGIN + c * cellW;
      page.drawRectangle({
        x,
        y: y - cellH,
        width: cellW,
        height: cellH,
        borderColor: ink,
        borderWidth: 0.6,
        opacity: 0,
        borderOpacity: 0.45,
      });
      // Baseline
      page.drawLine({
        start: { x: x + 4, y: y - cellH + 8 },
        end: { x: x + cellW - 4, y: y - cellH + 8 },
        thickness: 0.5,
        color: ink,
        opacity: 0.35,
      });
      // Mid guide
      page.drawLine({
        start: { x: x + 4, y: y - cellH / 2 },
        end: { x: x + cellW - 4, y: y - cellH / 2 },
        thickness: 0.4,
        color: ink,
        opacity: 0.18,
      });

      const g = item.text.trim() || "ក";
      const gSize = Math.min(30, (cellW - 10) / Math.max(g.length * 0.62, 1));
      const w = glyphFont.widthOfTextAtSize(g, gSize);
      const gx = x + (cellW - w) / 2;
      const gy = y - cellH + 12;

      if (c < exampleCells) {
        // Solid model glyph in the first cell
        page.drawText(g, { x: gx, y: gy, font: glyphFont, size: gSize, color: ink });
      } else if (c - exampleCells < opts.traces) {
        // Faint tracing copies
        page.drawText(g, { x: gx, y: gy, font: glyphFont, size: gSize, color: ink, opacity: 0.22 });
      }
    }

    y -= 16;
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}

export default function KhmerPracticeSheets() {
  const { text: t } = useLanguage();
  const [title, setTitle] = useToolState("practice-sheets:title", "ប្រតិបត្តិសរសេរអក្សរខ្មែរ");
  const [raw, setRaw] = useToolState(
    "practice-sheets:input",
    "ក\nខ\nគ\nឃ\nង\nច\nឆ\nជ\nឈ\nញ\nត\nថ\nទ\nធ\nន",
  );
  const [fontId, setFontId] = useToolState("practice-sheets:font", "kantumruy");
  const [traces, setTraces] = useToolState("practice-sheets:traces", 3);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const prevUrlRef = useRef<string | null>(null);

  const items = useMemo(
    () =>
      raw
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((text) => ({ text })),
    [raw],
  );

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (items.length === 0) {
        setPdfUrl(null);
        return;
      }
      setRendering(true);
      generatePracticePdf(items, {
        title,
        fontId,
        paper: "#ffffff",
        ink: "#1a1a1a",
        traces,
      })
        .then((blob) => {
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
          prevUrlRef.current = url;
          setPdfUrl(url);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setRendering(false);
        });
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [items, title, fontId, traces]);

  useEffect(
    () => () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    },
    [],
  );

  function download() {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `${title.trim() || "practice"}.pdf`;
    a.click();
  }

  return (
    <ToolShell
      title="Khmer Practice Sheets"
      khmerTitle="សន្លឹកអនុវត្តសរសេរអក្សរខ្មែរ"
      description="Generate ruled Khmer handwriting practice worksheets — one solid example plus faint tracing cells for each letter or word."
      descriptionKm="បង្កើតសន្លឹកអនុវត្តសរសេរអក្សរខ្មែរ — ឧទាហរណ៍ច្បាស់មួយ និងក្រឡាធំៗសម្រាប់ហ្វឹកហាត់។"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            <Field label={t("Title", "ចំណងជើង")}>
              <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label={t("Letters or words (one per line)", "អក្សរ ឬពាក្យ (មួយក្នុងមួយបន្ទាត់)")}>
              <TextArea rows={10} value={raw} onChange={(e) => setRaw(e.target.value)} className="font-khmer" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("Font", "ពុម្ពអក្សរ")}>
                <select value={fontId} onChange={(e) => setFontId(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)]">
                  {STUDIO_FONTS.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </Field>
              <Field label={t("Tracing cells", "ក្រឡាហ្វឹកហាត់")}>
                <select value={String(traces)} onChange={(e) => setTraces(Number(e.target.value))} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)]">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[var(--ink-faint)]">
              <span>{t("Live PDF preview", "មើល PDF ជាមុន")}</span>
              <span>{rendering ? t("rendering…", "កំពុងបង្កើត…") : ""}</span>
            </div>
            {pdfUrl ? (
              <iframe src={`${pdfUrl}#toolbar=0&view=FitH`} title="Practice preview" className="h-[520px] w-full rounded-xl border border-[var(--ground-line)] bg-white" />
            ) : (
              <div className="flex h-[520px] items-center justify-center rounded-xl border border-dashed border-[var(--ground-line)] text-xs text-[var(--ink-faint)]">
                {t("Enter at least one letter.", "សូមបញ្ចូលអក្សរយ៉ាងតិចមួយ។")}
              </div>
            )}
            <button type="button" onClick={download} disabled={!pdfUrl} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40">
              <Download size={15} />{t("Download PDF", "ទាញយក PDF")}
            </button>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}