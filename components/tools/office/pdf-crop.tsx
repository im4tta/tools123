"use client";

// PDF Crop — trim the margins off every page of a PDF.
// Scanners and phone captures leave wide white borders that waste paper and
// shrink the readable area when printed. This sets each page's CropBox (the
// region viewers and printers actually show) inset from its MediaBox by the
// percentages you choose, so no content is re-rendered or re-compressed — the
// original page objects are untouched, only the visible window changes.
// Runs entirely in your browser. Original Tools123 implementation.

import { useCallback, useState } from "react";
import { FileUp, Download, Crop, RotateCcw } from "lucide-react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";
import { loadPdfJs, formatBytes } from "@/lib/pdfjs";
import { downloadBlob } from "@/lib/download";
import { recordExport } from "@/lib/export";

type Edge = "top" | "right" | "bottom" | "left";
type Trim = Record<Edge, number>;

const ZERO: Trim = { top: 0, right: 0, bottom: 0, left: 0 };
const EDGES: { id: Edge; en: string; km: string }[] = [
  { id: "top", en: "Top", km: "ខាងលើ" },
  { id: "right", en: "Right", km: "ខាងស្តាំ" },
  { id: "bottom", en: "Bottom", km: "ខាងក្រោម" },
  { id: "left", en: "Left", km: "ខាងឆ្វេង" },
];

/** Keep each edge in 0–45% so opposite edges can never cross. */
const clampPct = (v: number) => Math.min(45, Math.max(0, Number.isFinite(v) ? v : 0));

export default function PdfCrop() {
  const { text: t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState("");
  const [preview, setPreview] = useState("");
  const [pageSize, setPageSize] = useState<{ w: number; h: number } | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [trim, setTrim] = useState<Trim>(ZERO);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(
    async (f: File) => {
      if (f.type !== "application/pdf") {
        setError(t("Please choose a PDF file.", "សូមជ្រើសឯកសារ PDF។"));
        return;
      }
      setBusy(true);
      setError("");
      setStatus("");
      setTrim(ZERO);
      try {
        const pdfjs = await loadPdfJs();
        const doc = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
        const page = await doc.getPage(1);
        const base = page.getViewport({ scale: 1 });
        const scale = Math.min(1.5, 900 / base.width);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (ctx) await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        setFile(f);
        setPageCount(doc.numPages);
        setPageSize({ w: base.width, h: base.height });
        setPreview(canvas.toDataURL("image/png"));
        setInfo(`${doc.numPages} ${t("pages", "ទំព័រ")} · ${formatBytes(f.size)}`);
      } catch {
        setError(t("Could not read this PDF — it may be corrupted or password-protected.", "មិនអាចអានឯកសារ PDF នេះ — វាប្រហែលខូច ឬបានការពារដោយពាក្យសម្ងាត់។"));
        setFile(null);
      } finally {
        setBusy(false);
      }
    },
    [t],
  );

  const setEdge = (edge: Edge, raw: string) => {
    const v = clampPct(parseFloat(raw));
    setTrim((prev) => ({ ...prev, [edge]: v }));
    setStatus("");
  };

  const keptW = pageSize ? pageSize.w * (1 - (trim.left + trim.right) / 100) : 0;
  const keptH = pageSize ? pageSize.h * (1 - (trim.top + trim.bottom) / 100) : 0;
  const anyTrim = trim.top + trim.right + trim.bottom + trim.left > 0;

  const exportPdf = useCallback(async () => {
    if (!file || !anyTrim) return;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      for (const page of doc.getPages()) {
        const mb = page.getMediaBox();
        const left = mb.width * (trim.left / 100);
        const right = mb.width * (trim.right / 100);
        const top = mb.height * (trim.top / 100);
        const bottom = mb.height * (trim.bottom / 100);
        const w = mb.width - left - right;
        const h = mb.height - top - bottom;
        if (w > 1 && h > 1) page.setCropBox(mb.x + left, mb.y + bottom, w, h);
      }
      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, `${file.name.replace(/\.pdf$/i, "")}_cropped.pdf`);
      recordExport();
      setStatus(t(`Saved — ${pageCount} page(s) cropped · ${formatBytes(blob.size)}`, `រក្សាទុករួច — កាត់ ${pageCount} ទំព័រ · ${formatBytes(blob.size)}`));
    } catch {
      setError(t("Could not build the PDF — try again or reload the source file.", "មិនអាចបង្កើត PDF បានទេ — សូមព្យាយាមម្តងទៀត ឬផ្ទុកឯកសារឡើងវិញ។"));
    } finally {
      setBusy(false);
    }
  }, [file, trim, anyTrim, pageCount, t]);

  return (
    <ToolShell
      title="PDF Crop"
      khmerTitle="កាត់គែម PDF"
      description="Trim the white margins off every page of a PDF. Set how much to cut from each edge and watch the preview update, then download the cropped file — handy for tightening up scans before printing. Page content is never re-rendered or re-compressed, so nothing loses quality. Everything runs in your browser."
      descriptionKm="កាត់គែមសនៅជុំវិញគ្រប់ទំព័រនៃ PDF។ កំណត់ចំនួនដែលត្រូវកាត់ពីគែមនីមួយៗ ហើយមើលការមើលជាមុនផ្លាស់ប្តូរ រួចទាញយកឯកសារដែលកាត់រួច — មានប្រយោជន៍សម្រាប់រៀបចំរូបស្កេនមុនបោះពុម្ព។ មាតិកាទំព័រមិនត្រូវបង្ហាញ ឬបង្រួមឡើងវិញទេ ដូច្នេះគុណភាពមិនបាត់បង់។ ដំណើរការក្នុងកម្មវិធីរុករករបស់អ្នក។"
    >
      {!file ? (
        <div className="mx-auto max-w-lg">
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] p-10 text-center transition hover:border-[var(--gold-dim)]">
            <FileUp size={30} className="text-[var(--ink-faint)]" />
            <span className="text-sm font-medium text-[var(--ink)]">{busy ? t("Reading…", "កំពុងអាន…") : t("Choose a PDF", "ជ្រើសឯកសារ PDF")}</span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void load(f);
                e.target.value = "";
              }}
            />
          </label>
          {error && <p className="mt-3 text-center text-sm text-[var(--danger)]">{error}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--ink)]">{file.name}</div>
              <div className="text-xs text-[var(--ink-faint)]">{info}</div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setPreview("");
                setTrim(ZERO);
                setStatus("");
              }}
              className="rounded-md px-2.5 py-1.5 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]"
            >
              {t("Choose another", "ជ្រើសផ្សេង")}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {EDGES.map((e) => (
              <Field key={e.id} label={e.en} labelKm={e.km} hint="%" hintKm="%">
                <TextInput
                  inputMode="decimal"
                  value={String(trim[e.id])}
                  onChange={(ev) => setEdge(e.id, ev.target.value)}
                  placeholder="0"
                />
              </Field>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--ink-faint)]">
            <span>{t("Applied to all pages. Preview shows page 1.", "អនុវត្តលើគ្រប់ទំព័រ។ ការមើលជាមុនបង្ហាញទំព័រទី ១។")}</span>
            {pageSize && anyTrim && (
              <span>
                {Math.round(pageSize.w)} × {Math.round(pageSize.h)} pt → <span className="text-[var(--ink-dim)]">{Math.round(keptW)} × {Math.round(keptH)} pt</span>
              </span>
            )}
            {anyTrim && (
              <button onClick={() => setTrim(ZERO)} className="inline-flex items-center gap-1 hover:text-[var(--ink)]">
                <RotateCcw size={11} /> {t("Reset", "កំណត់ឡើងវិញ")}
              </button>
            )}
          </div>

          {preview && (
            <div className="flex justify-center">
              <div className="relative inline-block max-w-full overflow-hidden rounded-md border border-[var(--ground-line)] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt={t("Page 1 preview", "មើលទំព័រទី ១")} className="block max-h-[28rem] w-auto max-w-full" />
                {/* Shaded overlay marks what gets cut away. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    boxShadow: "inset 0 0 0 9999px rgba(0,0,0,0.42)",
                    clipPath: `polygon(
                      0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                      ${trim.left}% ${trim.top}%,
                      ${trim.left}% ${100 - trim.bottom}%,
                      ${100 - trim.right}% ${100 - trim.bottom}%,
                      ${100 - trim.right}% ${trim.top}%,
                      ${trim.left}% ${trim.top}%
                    )`,
                  }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute border-2 border-dashed border-[var(--gold)]"
                  style={{
                    top: `${trim.top}%`,
                    left: `${trim.left}%`,
                    right: `${trim.right}%`,
                    bottom: `${trim.bottom}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={exportPdf} disabled={busy || !anyTrim} className="inline-flex items-center gap-2">
              <Crop size={15} />
              {busy ? t("Working…", "កំពុងដំណើរការ…") : t("Crop & download", "កាត់ និងទាញយក")}
              <Download size={15} />
            </Button>
            {!anyTrim && <span className="text-xs text-[var(--ink-faint)]">{t("Set a trim amount above to enable.", "កំណត់ចំនួនកាត់ខាងលើដើម្បីបើក។")}</span>}
            {status && <span className="text-xs text-[var(--ink-dim)]">{status}</span>}
          </div>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        </div>
      )}

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
        <ul className="list-inside list-disc space-y-0.5">
          <li>{t("Preview: pdf.js (Apache-2.0, Mozilla). Cropping: pdf-lib (MIT).", "ការមើលជាមុន: pdf.js (Apache-2.0, Mozilla)។ ការកាត់: pdf-lib (MIT)។")}</li>
          <li>{t("Crops by setting each page's CropBox, per the PDF specification — page content is left untouched.", "កាត់ដោយកំណត់ CropBox នៃទំព័រនីមួយៗ តាមស្តង់ដារ PDF — មាតិកាទំព័រមិនប៉ះពាល់ទេ។")}</li>
          <li>{t("Files are processed locally and never uploaded.", "ឯកសារដំណើរការក្នុងម៉ាស៊ីន ហើយមិនផ្ទុកឡើងទេ។")}</li>
        </ul>
      </div>
    </ToolShell>
  );
}
