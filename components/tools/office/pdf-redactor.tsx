"use client";

// PDF Redactor — draw boxes over sensitive areas; on export the covered
// content is truly removed, not just hidden. Because the only reliable way to
// guarantee that in the browser is to flatten each page, the exported PDF is a
// black-boxed image of every page — the underlying text/vectors are gone.
// Everything runs locally.

import { useCallback, useRef, useState } from "react";
import { FileUp, Download, Undo2, Eraser, ChevronLeft, ChevronRight } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";
import { loadPdfJs, formatBytes } from "@/lib/pdfjs";
import { recordExport } from "@/lib/export";

interface Box { x: number; y: number; w: number; h: number } // normalised 0..1
interface Rendered { thumb: string; ratio: number }

const EXPORT_PX = 1700;

export default function PdfRedactor() {
  const { text: t } = useLanguage();
  const [pages, setPages] = useState<Rendered[]>([]);
  const [boxes, setBoxes] = useState<Box[][]>([]);
  const [current, setCurrent] = useState(0);
  const [fileName, setFileName] = useState("");
  const [fileInfo, setFileInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [drawing, setDrawing] = useState<Box | null>(null);
  const bytesRef = useRef<ArrayBuffer | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const areaRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") { setStatus(t("Please choose a PDF file.", "សូមជ្រើសឯកសារ PDF។")); return; }
    setBusy(true);
    setStatus("");
    try {
      const bytes = await file.arrayBuffer();
      bytesRef.current = bytes;
      const pdfjs = await loadPdfJs();
      const doc = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
      const out: Rendered[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: 900 / Math.max(base.width, base.height) });
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(vp.width);
        canvas.height = Math.round(vp.height);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp, canvas } as any).promise;
        out.push({ thumb: canvas.toDataURL("image/png"), ratio: canvas.width / canvas.height });
      }
      setPages(out);
      setBoxes(out.map(() => []));
      setCurrent(0);
      setFileName(file.name);
      setFileInfo(`${doc.numPages} ${t("pages", "ទំព័រ")} · ${formatBytes(file.size)}`);
    } catch {
      setStatus(t("Could not read this PDF.", "មិនអាចអានឯកសារ PDF នេះ។"));
    } finally { setBusy(false); }
  }, [t]);

  const relPoint = (e: React.PointerEvent) => {
    const rect = areaRef.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)), y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)) };
  };
  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startRef.current = relPoint(e);
    setDrawing({ ...startRef.current, w: 0, h: 0 });
  };
  const onMove = (e: React.PointerEvent) => {
    if (!startRef.current) return;
    const p = relPoint(e);
    const s = startRef.current;
    setDrawing({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
  };
  const onUp = () => {
    if (drawing && drawing.w > 0.01 && drawing.h > 0.01) {
      setBoxes((bs) => bs.map((b, i) => (i === current ? [...b, drawing] : b)));
    }
    startRef.current = null;
    setDrawing(null);
  };

  const undo = () => setBoxes((bs) => bs.map((b, i) => (i === current ? b.slice(0, -1) : b)));
  const clearPage = () => setBoxes((bs) => bs.map((b, i) => (i === current ? [] : b)));
  const totalBoxes = boxes.reduce((n, b) => n + b.length, 0);

  const save = useCallback(async () => {
    if (!bytesRef.current) return;
    setBusy(true);
    setStatus(t("Flattening and redacting…", "កំពុងបំបែក និងលុប…"));
    try {
      const pdfjs = await loadPdfJs();
      const { PDFDocument } = await import("pdf-lib");
      const src = await pdfjs.getDocument({ data: bytesRef.current.slice(0) }).promise;
      const out = await PDFDocument.create();
      for (let i = 0; i < src.numPages; i++) {
        const page = await src.getPage(i + 1);
        const base = page.getViewport({ scale: 1 });
        const scale = EXPORT_PX / Math.max(base.width, base.height);
        const vp = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(vp.width);
        canvas.height = Math.round(vp.height);
        const ctx = canvas.getContext("2d")!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvasContext: ctx, viewport: vp, canvas } as any).promise;
        ctx.fillStyle = "#000";
        for (const b of boxes[i] ?? []) ctx.fillRect(b.x * canvas.width, b.y * canvas.height, b.w * canvas.width, b.h * canvas.height);
        const jpg = await out.embedJpg(canvas.toDataURL("image/jpeg", 0.9));
        const p = out.addPage([base.width, base.height]);
        p.drawImage(jpg, { x: 0, y: 0, width: base.width, height: base.height });
      }
      const bytes = await out.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(/\.pdf$/i, "")}_redacted.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      recordExport();
      setStatus(t("Saved redacted PDF.", "រក្សាទុក PDF ដែលបានលុប។"));
    } catch {
      setStatus(t("Could not build the redacted PDF.", "មិនអាចបង្កើត PDF បានទេ។"));
    } finally { setBusy(false); }
  }, [boxes, fileName, t]);

  return (
    <ToolShell
      title="PDF Redactor"
      khmerTitle="លុបព័ត៌មានសម្ងាត់ PDF"
      description="Draw boxes over sensitive text or images and export a PDF where the covered content is truly gone — the whole page is flattened to an image, so nothing can be copied out from underneath. Everything runs locally in your browser."
      descriptionKm="គូសប្រអប់លើអត្ថបទ ឬរូបភាពសម្ងាត់ រួចនាំចេញ PDF ដែលមាតិកាដែលគ្របត្រូវបានលុបពិតប្រាកដ — ទំព័រទាំងមូលត្រូវបំបែកជារូបភាព ដូច្នេះគ្មានអ្វីអាចចម្លងចេញពីខាងក្រោមបានទេ។ ដំណើរការក្នុងកម្មវិធីរុករករបស់អ្នក។"
    >
      {pages.length === 0 ? (
        <div className="mx-auto max-w-lg">
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] p-10 text-center transition hover:border-[var(--gold-dim)]">
            <FileUp size={30} className="text-[var(--ink-faint)]" />
            <span className="text-sm font-medium text-[var(--ink)]">{busy ? t("Reading…", "កំពុងអាន…") : t("Choose a PDF", "ជ្រើសឯកសារ PDF")}</span>
            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void load(f); e.target.value = ""; }} />
          </label>
          {status && <p className="mt-3 text-center text-sm text-[var(--danger)]">{status}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
            <div className="min-w-0"><div className="truncate text-sm font-semibold text-[var(--ink)]">{fileName}</div><div className="text-xs text-[var(--ink-faint)]">{fileInfo} · {totalBoxes} {t("boxes", "ប្រអប់")}</div></div>
            <div className="flex items-center gap-2">
              <button onClick={undo} disabled={(boxes[current] ?? []).length === 0} className="inline-flex items-center gap-1 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] px-2.5 py-1.5 text-xs text-[var(--ink)] disabled:opacity-40"><Undo2 size={13} />{t("Undo", "មិនធ្វើ")}</button>
              <button onClick={clearPage} disabled={(boxes[current] ?? []).length === 0} className="inline-flex items-center gap-1 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] px-2.5 py-1.5 text-xs text-[var(--ink)] disabled:opacity-40"><Eraser size={13} />{t("Clear page", "សម្អាតទំព័រ")}</button>
              <button onClick={() => { setPages([]); bytesRef.current = null; }} className="rounded-md px-2.5 py-1.5 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">{t("Choose another", "ជ្រើសផ្សេង")}</button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] p-1.5 text-[var(--ink)] disabled:opacity-40"><ChevronLeft size={16} /></button>
            <span className="font-mono-ui text-xs text-[var(--ink-dim)]">{t("Page", "ទំព័រ")} {current + 1} / {pages.length}</span>
            <button onClick={() => setCurrent((c) => Math.min(pages.length - 1, c + 1))} disabled={current === pages.length - 1} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] p-1.5 text-[var(--ink)] disabled:opacity-40"><ChevronRight size={16} /></button>
          </div>

          <div className="flex justify-center">
            <div
              ref={areaRef}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              className="relative touch-none select-none"
              style={{ width: "min(560px, 100%)", cursor: "crosshair" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pages[current].thumb} alt="" draggable={false} className="w-full rounded-md border border-[var(--ground-line)] bg-white" />
              {(boxes[current] ?? []).map((b, i) => (
                <div key={i} className="absolute bg-black" style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }} />
              ))}
              {drawing && <div className="absolute border border-[var(--gold)] bg-black/60" style={{ left: `${drawing.x * 100}%`, top: `${drawing.y * 100}%`, width: `${drawing.w * 100}%`, height: `${drawing.h * 100}%` }} />}
            </div>
          </div>
          <p className="text-center text-[11px] text-[var(--ink-faint)]">{t("Drag to draw a redaction box. Export flattens every page to an image so covered content can't be recovered.", "អូសដើម្បីគូសប្រអប់លុប។ ការនាំចេញបំបែកគ្រប់ទំព័រជារូបភាព ដូច្នេះមាតិកាដែលគ្របមិនអាចយកមកវិញបានទេ។")}</p>

          <div className="flex items-center justify-center gap-3">
            <Button onClick={save} disabled={busy || totalBoxes === 0} className="inline-flex items-center gap-2"><Download size={15} />{busy ? t("Working…", "កំពុងដំណើរការ…") : t("Export redacted PDF", "នាំចេញ PDF ដែលបានលុប")}</Button>
            {status && <span className="text-xs text-[var(--ink-dim)]">{status}</span>}
          </div>
        </div>
      )}
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
        <ul className="list-inside list-disc space-y-0.5">
          <li>{t("Rendering: pdf.js (Apache-2.0, Mozilla). Flattening/rebuilding: pdf-lib (MIT).", "ការបង្ហាញ: pdf.js (Apache-2.0, Mozilla)។ ការបំបែក/សាងសង់ឡើងវិញ: pdf-lib (MIT)។")}</li>
          <li>{t("Original Tools123 implementation; files are processed locally and never uploaded.", "ការសរសេរដើមរបស់ Tools123; ឯកសារត្រូវដំណើរការក្នុងម៉ាស៊ីន ហើយមិនផ្ទុកឡើងទេ។")}</li>
        </ul>
      </div>
    </ToolShell>
  );
}
