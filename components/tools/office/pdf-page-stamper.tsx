"use client";

// PDF Page Stamper — add page numbers, headers/footers, or Bates numbering
// (PREFIX-000123) to every page of a PDF. Text is drawn as real PDF text with
// pdf-lib, so the file stays lossless. Everything runs locally.

import { useCallback, useRef, useState } from "react";
import { FileUp, Download } from "lucide-react";
import { ToolShell, Field, TextInput, Select } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";
import { loadPdfJs, formatBytes } from "@/lib/pdfjs";
import { recordExport } from "@/lib/export";

type Pos = "tl" | "tc" | "tr" | "bl" | "bc" | "br";
type Fmt = "n" | "page" | "nOfT" | "bates";

interface Opts {
  format: Fmt; prefix: string; start: number; digits: number;
  position: Pos; size: number; margin: number; color: string; skipFirst: boolean;
}

const INITIAL: Opts = { format: "page", prefix: "DOC-", start: 1, digits: 6, position: "br", size: 10, margin: 28, color: "#333333", skipFirst: false };

function stampText(o: Opts, num: number, total: number): string {
  const padded = String(num).padStart(Math.max(1, o.digits), "0");
  switch (o.format) {
    case "n": return String(num);
    case "nOfT": return `${num} / ${total}`;
    case "bates": return `${o.prefix}${padded}`;
    default: return `Page ${num}`;
  }
}

function hexToRgb(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { r: 0.2, g: 0.2, b: 0.2 };
  const n = parseInt(m[1], 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

export default function PdfPageStamper() {
  const { text: t } = useLanguage();
  const [opts, setOpts] = useState<Opts>(INITIAL);
  const [fileName, setFileName] = useState("");
  const [fileInfo, setFileInfo] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const bytesRef = useRef<ArrayBuffer | null>(null);

  const set = <K extends keyof Opts>(k: K, v: Opts[K]) => setOpts((o) => ({ ...o, [k]: v }));

  const load = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") { setStatus(t("Please choose a PDF file.", "សូមជ្រើសឯកសារ PDF។")); return; }
    setBusy(true);
    setStatus("");
    try {
      const bytes = await file.arrayBuffer();
      bytesRef.current = bytes;
      const pdfjs = await loadPdfJs();
      const doc = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
      setTotal(doc.numPages);
      const page = await doc.getPage(1);
      const vp = page.getViewport({ scale: 640 / Math.max(page.getViewport({ scale: 1 }).width, page.getViewport({ scale: 1 }).height) });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(vp.width);
      canvas.height = Math.round(vp.height);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp, canvas } as any).promise;
      setPreviewUrl(canvas.toDataURL("image/png"));
      setFileName(file.name);
      setFileInfo(`${doc.numPages} ${t("pages", "ទំព័រ")} · ${formatBytes(file.size)}`);
    } catch {
      setStatus(t("Could not read this PDF.", "មិនអាចអានឯកសារ PDF នេះ។"));
    } finally { setBusy(false); }
  }, [t]);

  const save = useCallback(async () => {
    if (!bytesRef.current) return;
    setBusy(true);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const doc = await PDFDocument.load(bytesRef.current, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const c = hexToRgb(opts.color);
      let num = opts.start;
      pages.forEach((page, i) => {
        if (opts.skipFirst && i === 0) return;
        const { width, height } = page.getSize();
        const text = stampText(opts, num, opts.skipFirst ? pages.length - 1 : pages.length);
        const tw = font.widthOfTextAtSize(text, opts.size);
        const left = opts.position.endsWith("l");
        const center = opts.position.endsWith("c");
        const top = opts.position.startsWith("t");
        const x = left ? opts.margin : center ? (width - tw) / 2 : width - opts.margin - tw;
        const y = top ? height - opts.margin - opts.size : opts.margin;
        page.drawText(text, { x, y, size: opts.size, font, color: rgb(c.r, c.g, c.b) });
        num++;
      });
      const out = await doc.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(/\.pdf$/i, "")}_stamped.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      recordExport();
      setStatus(t("Saved stamped PDF.", "រក្សាទុក PDF ដែលបានបោះត្រា។"));
    } catch {
      setStatus(t("Could not write the file.", "មិនអាចសរសេរឯកសារបានទេ។"));
    } finally { setBusy(false); }
  }, [opts, fileName, t]);

  // Preview overlay position (CSS) mirroring the export math.
  const posStyle: React.CSSProperties = {
    position: "absolute",
    [opts.position.startsWith("t") ? "top" : "bottom"]: `${(opts.margin / 792) * 100}%`,
    ...(opts.position.endsWith("l") ? { left: `${(opts.margin / 612) * 100}%` }
      : opts.position.endsWith("r") ? { right: `${(opts.margin / 612) * 100}%` }
        : { left: "50%", transform: "translateX(-50%)" }),
    color: opts.color,
    fontSize: `${opts.size}px`,
    fontFamily: "Arial, sans-serif",
    whiteSpace: "nowrap",
  };

  return (
    <ToolShell
      title="PDF Page Stamper"
      khmerTitle="បោះលេខទំព័រ PDF"
      description="Add page numbers, footers, or Bates numbering (PREFIX-000123) to every page of a PDF. Text is drawn as real PDF text, so the file stays lossless. Everything runs locally in your browser."
      descriptionKm="បន្ថែមលេខទំព័រ ឬលេខ Bates (PREFIX-000123) ទៅគ្រប់ទំព័រនៃ PDF។ អក្សរត្រូវសរសេរជាអក្សរ PDF ពិត ដូច្នេះឯកសាររក្សាគុណភាពដើម។ ដំណើរការក្នុងកម្មវិធីរុករករបស់អ្នក។"
    >
      {!previewUrl ? (
        <div className="mx-auto max-w-lg">
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] p-10 text-center transition hover:border-[var(--gold-dim)]">
            <FileUp size={30} className="text-[var(--ink-faint)]" />
            <span className="text-sm font-medium text-[var(--ink)]">{t("Choose a PDF", "ជ្រើសឯកសារ PDF")}</span>
            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void load(f); e.target.value = ""; }} />
          </label>
          {status && <p className="mt-3 text-center text-sm text-[var(--danger)]">{status}</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--ink-faint)]"><span className="truncate">{fileName} · {fileInfo}</span><button onClick={() => { setPreviewUrl(null); bytesRef.current = null; }} className="shrink-0 hover:text-[var(--ink)]">{t("Choose another", "ជ្រើសផ្សេង")}</button></div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("Format", "ទ្រង់ទ្រាយ")}>
                <Select value={opts.format} onChange={(e) => set("format", e.target.value as Fmt)}>
                  <option value="page">Page 1</option>
                  <option value="n">1</option>
                  <option value="nOfT">1 / N</option>
                  <option value="bates">{t("Bates (prefix)", "Bates (បុព្វបទ)")}</option>
                </Select>
              </Field>
              <Field label={t("Position", "ទីតាំង")}>
                <Select value={opts.position} onChange={(e) => set("position", e.target.value as Pos)}>
                  <option value="tl">{t("Top left", "លើឆ្វេង")}</option>
                  <option value="tc">{t("Top center", "លើកណ្តាល")}</option>
                  <option value="tr">{t("Top right", "លើស្តាំ")}</option>
                  <option value="bl">{t("Bottom left", "ក្រោមឆ្វេង")}</option>
                  <option value="bc">{t("Bottom center", "ក្រោមកណ្តាល")}</option>
                  <option value="br">{t("Bottom right", "ក្រោមស្តាំ")}</option>
                </Select>
              </Field>
            </div>
            {opts.format === "bates" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("Prefix", "បុព្វបទ")}><TextInput value={opts.prefix} onChange={(e) => set("prefix", e.target.value)} /></Field>
                <Field label={t("Zero-pad digits", "ចំនួនខ្ទង់")}><TextInput type="number" value={opts.digits} onChange={(e) => set("digits", Math.max(1, Number(e.target.value) || 1))} /></Field>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <Field label={t("Start #", "ចាប់ផ្តើម")}><TextInput type="number" value={opts.start} onChange={(e) => set("start", Number(e.target.value) || 1)} /></Field>
              <Field label={t("Font size", "ទំហំអក្សរ")}><TextInput type="number" value={opts.size} onChange={(e) => set("size", Math.max(5, Number(e.target.value) || 10))} /></Field>
              <Field label={t("Margin", "គែម")}><TextInput type="number" value={opts.margin} onChange={(e) => set("margin", Math.max(0, Number(e.target.value) || 0))} /></Field>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Field label={t("Color", "ពណ៌")}>
                <input type="color" value={opts.color} onChange={(e) => set("color", e.target.value)} className="h-9 w-16 cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1" />
              </Field>
              <label className="flex cursor-pointer items-center gap-2 pt-4 text-sm text-[var(--ink-dim)]">
                <input type="checkbox" checked={opts.skipFirst} onChange={(e) => set("skipFirst", e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
                {t("Skip the first page", "រំលងទំព័រទីមួយ")}
              </label>
            </div>
            <Button onClick={save} disabled={busy} className="inline-flex items-center gap-2"><Download size={15} />{busy ? t("Working…", "កំពុងដំណើរការ…") : t("Save stamped PDF", "រក្សាទុក PDF")}</Button>
            {status && <p className="text-xs text-[var(--ink-dim)]">{status}</p>}
          </div>

          <div>
            <div className="mb-1.5 text-xs uppercase tracking-wide text-[var(--ink-faint)]">{t("Preview — page 1", "មើលជាមុន — ទំព័រ ១")}</div>
            <div className="relative inline-block w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="" className="w-full rounded-md border border-[var(--ground-line)] bg-white" />
              {!(opts.skipFirst) && <span style={posStyle}>{stampText(opts, opts.start, total)}</span>}
            </div>
            {opts.skipFirst && <p className="mt-1 text-[11px] text-[var(--ink-faint)]">{t("Page 1 is skipped; stamping starts on page 2.", "ទំព័រ ១ ត្រូវរំលង; ការបោះត្រាចាប់ពីទំព័រ ២។")}</p>}
          </div>
        </div>
      )}
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
        <ul className="list-inside list-disc space-y-0.5">
          <li>{t("Preview rendering: pdf.js (Apache-2.0, Mozilla). Stamping: pdf-lib (MIT).", "ការបង្ហាញ: pdf.js (Apache-2.0, Mozilla)។ ការបោះត្រា: pdf-lib (MIT)។")}</li>
          <li>{t("Original Tools123 implementation; files are processed locally and never uploaded.", "ការសរសេរដើមរបស់ Tools123; ឯកសារត្រូវដំណើរការក្នុងម៉ាស៊ីន ហើយមិនផ្ទុកឡើងទេ។")}</li>
        </ul>
      </div>
    </ToolShell>
  );
}
