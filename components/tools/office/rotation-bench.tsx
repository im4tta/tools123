"use client";

// Rotation Bench — fix scanned-PDF page orientation and skew, in the browser.
//
// Adapted from an in-house "rotation-bench" HTML prototype and rebuilt on this
// app's shared components. Pages are rendered with pdf.js, orientation is
// auto-detected with Tesseract's OSD (orientation & script detection) model,
// and fine skew is measured with a projection-profile estimate. Coarse 90°
// corrections are written back losslessly with pdf-lib by setting each page's
// /Rotate; because PDF /Rotate can only store 90° multiples, pages that need a
// fine straighten are the only ones re-rendered as an image on export. Nothing
// is uploaded. See the Source & Credits section for library attribution.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FileUp, RotateCw, RotateCcw, Download, Loader2, Check, AlertTriangle,
  Maximize2, X, ScanLine, Play, Pause, Wand2,
} from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";
import { loadPdfJs, formatBytes } from "@/lib/pdfjs";
import { recordExport } from "@/lib/export";

/* ------------------------------------------------------------------ tuning */

// Tesseract's OSD "confidence" is not a 0–1 probability — it's an unbounded
// margin between the best and second-best orientation guess. ~15 is "very
// confident"; genuine hits run ~2–20; noise usually sits under ~1. Below this
// threshold we don't trust the auto-rotation and flag the page for a look.
const CONFIDENCE_THRESHOLD = 3.0;
const RENDER_TARGET_PX = 720; // longest side for the on-screen thumbnail
const OSD_RENDER_PX = 1300; // longest side for the first OSD pass
const OSD_RETRY_PX = 2200; // longest side for the retry pass on marginal pages
const WORKER_POOL_SIZE =
  typeof navigator !== "undefined"
    ? Math.min(4, Math.max(2, (navigator.hardwareConcurrency || 4) - 1))
    : 2;

// Deskew: search ±SKEW_MAX_DEG in SKEW_STEP increments; ignore anything below
// SKEW_MIN_DEG (imperceptible, and re-rasterising for it isn't worth the loss).
const SKEW_MAX_DEG = 8;
const SKEW_STEP = 0.2;
const SKEW_MIN_DEG = 0.4;
const EXPORT_RASTER_PX = 1700; // longest side when a straightened page is baked to an image

/* ------------------------------------------------------------------- types */

type PageStatus = "pending" | "ok" | "auto" | "flagged" | "manual";

interface PageState {
  index: number;
  thumb: string; // data URL
  ratio: number; // width / height of the rendered thumbnail
  extra: number; // 0 / 90 / 180 / 270 clockwise, applied on top of the PDF's own rotation
  deskew: number; // fine straighten angle in degrees (clockwise), applied after `extra`
  status: PageStatus;
  confidence: number | null;
  note: string | null;
}

type OsdData = { orientation_degrees?: number | null; orientation_confidence?: number | null };
interface OsdWorker {
  detect: (image: unknown) => Promise<{ data: OsdData }>;
  terminate: () => Promise<unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPdf = any;

/* ----------------------------------------------------------------- helpers */

function parseOsd(data: OsdData | undefined): { deg: number | null; conf: number | null } {
  if (!data) return { deg: null, conf: null };
  const deg = typeof data.orientation_degrees === "number" ? data.orientation_degrees : null;
  const conf = typeof data.orientation_confidence === "number" ? data.orientation_confidence : null;
  return { deg, conf };
}

// Grayscale + histogram stretch, with a conservative invert only when a page is
// strongly dark-on-light-reversed. Used on the OSD retry pass to give the
// detector a cleaner signal on faint scans.
function preprocessForOsd(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext("2d");
  if (!ctx) return canvas;
  ctx.drawImage(canvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, out.width, out.height);
  const d = imgData.data;

  let min = 255;
  let max = 0;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = d[i + 1] = d[i + 2] = gray;
    if (gray < min) min = gray;
    if (gray > max) max = gray;
  }
  const range = Math.max(1, max - min);
  let darkCount = 0;
  let lightCount = 0;
  const total = d.length / 4;
  for (let i = 0; i < d.length; i += 4) {
    const stretched = ((d[i] - min) / range) * 255;
    d[i] = d[i + 1] = d[i + 2] = stretched;
    if (stretched < 60) darkCount++;
    else if (stretched > 195) lightCount++;
  }
  if (darkCount > lightCount * 2 && darkCount > total * 0.4) {
    for (let i = 0; i < d.length; i += 4) {
      const inverted = 255 - d[i];
      d[i] = d[i + 1] = d[i + 2] = inverted;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return out;
}

// Rotates a canvas by a multiple of 90° (clockwise) into a new canvas, swapping
// dimensions for 90/270. Used to bring an OSD-oriented page upright before
// measuring its fine skew.
function rotateCanvas(src: HTMLCanvasElement, deg: number): HTMLCanvasElement {
  const d = ((deg % 360) + 360) % 360;
  if (d === 0) return src;
  const out = document.createElement("canvas");
  const swap = d === 90 || d === 270;
  out.width = swap ? src.height : src.width;
  out.height = swap ? src.width : src.height;
  const ctx = out.getContext("2d");
  if (!ctx) return src;
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((d * Math.PI) / 180);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return out;
}

// Projection-profile skew estimate. For each candidate angle we shear the
// binarised ink map and score how sharply it concentrates into rows (a
// well-aligned page piles ink into distinct text lines, giving a spiky row
// profile). The best angle is the correction that flattens the lines. Returns
// the correction to APPLY, in degrees (clockwise, matching CSS/canvas), or 0
// when the page has too little ink or no clear peak. Independent implementation
// of a classic algorithm — see the Source & Credits note.
function estimateSkew(source: HTMLCanvasElement): number {
  const maxSide = 480;
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const w = Math.max(1, Math.round(source.width * scale));
  const h = Math.max(1, Math.round(source.height * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return 0;
  ctx.drawImage(source, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  const gray = new Float32Array(w * h);
  let sum = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[p] = g;
    sum += g;
  }
  const thresh = (sum / (w * h)) * 0.82;
  const dark = new Uint8Array(w * h);
  let ink = 0;
  for (let p = 0; p < gray.length; p++) if (gray[p] < thresh) { dark[p] = 1; ink++; }
  if (ink < w * h * 0.003) return 0;

  const cx = w / 2;
  let best = 0;
  let bestScore = -1;
  let secondScore = -1;
  for (let deg = -SKEW_MAX_DEG; deg <= SKEW_MAX_DEG + 1e-9; deg += SKEW_STEP) {
    const t = Math.tan((deg * Math.PI) / 180);
    const offset = Math.ceil(Math.abs(t) * w) + 1;
    const len = h + 2 * offset;
    const acc = new Float32Array(len);
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        if (dark[row + x]) acc[((y + (x - cx) * t) | 0) + offset]++;
      }
    }
    let score = 0;
    for (let i = 1; i < len; i++) { const diff = acc[i] - acc[i - 1]; score += diff * diff; }
    if (score > bestScore) { secondScore = bestScore; bestScore = score; best = deg; }
    else if (score > secondScore) secondScore = score;
  }
  // Reject a flat/ambiguous landscape, or a peak so small it's just noise.
  if (bestScore <= 0 || secondScore / bestScore > 0.985) return 0;
  if (Math.abs(best) < SKEW_MIN_DEG) return 0;
  return Math.round(best * 10) / 10;
}

/* ---------------------------------------------------------------- page card */

const STATUS_COLOR: Record<PageStatus, string> = {
  pending: "var(--ink-faint)",
  ok: "var(--success)",
  auto: "var(--success)",
  flagged: "var(--danger)",
  manual: "var(--ink-dim)",
};

const PageCard = ({
  page, selected, deskewOn, onRotate, onToggleSelect, onExpand,
}: {
  page: PageState;
  selected: boolean;
  deskewOn: boolean;
  onRotate: (index: number) => void;
  onToggleSelect: (index: number, checked: boolean) => void;
  onExpand: (index: number) => void;
}) => {
  const { text: t } = useLanguage();
  const color = STATUS_COLOR[page.status];
  const skew = deskewOn ? page.deskew : 0;
  const badge =
    page.status === "pending" ? <Loader2 size={12} className="animate-spin" />
      : page.status === "flagged" ? <AlertTriangle size={12} />
        : <Check size={12} />;
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex w-full items-center justify-center rounded-md p-1"
        style={{ aspectRatio: "3 / 4", boxShadow: selected ? "0 0 0 2px var(--gold)" : undefined }}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onToggleSelect(page.index, e.target.checked)}
          aria-label={t(`Select page ${page.index + 1}`, `ជ្រើសទំព័រ ${page.index + 1}`)}
          className="absolute left-1 top-1 z-10 h-4 w-4 accent-[var(--gold)]"
        />
        <span
          className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full text-white"
          style={{ background: color }}
          title={page.confidence != null ? `OSD ${page.confidence.toFixed(1)}` : page.note ?? ""}
        >
          {badge}
        </span>
        <button
          type="button"
          onClick={() => onRotate(page.index)}
          aria-label={t(`Rotate page ${page.index + 1} by 90°`, `បង្វិលទំព័រ ${page.index + 1} ៩០°`)}
          className="flex h-full w-full items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.thumb}
            alt=""
            style={{
              maxWidth: "100%", maxHeight: "100%",
              transform: `rotate(${page.extra + skew}deg)`,
              transition: "transform 0.2s ease",
              background: "#fff",
              border: "1px solid var(--ground-line)",
              opacity: page.status === "pending" ? 0.55 : 1,
            }}
          />
        </button>
        <button
          type="button"
          onClick={() => onExpand(page.index)}
          aria-label={t(`Preview page ${page.index + 1}`, `មើលទំព័រ ${page.index + 1}`)}
          className="absolute bottom-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-80 hover:opacity-100"
        >
          <Maximize2 size={12} />
        </button>
      </div>
      <div className="mt-1.5 flex flex-col items-center gap-0.5">
        <span className="text-[10px] text-[var(--ink-faint)]">{t(`Page ${page.index + 1}`, `ទំព័រ ${page.index + 1}`)}</span>
        <div className="flex items-center gap-1">
          <span
            className="rounded-full border px-2 font-mono-ui text-[11px] font-semibold"
            style={{ color, borderColor: "var(--ground-line)" }}
          >
            {page.extra}°
          </span>
          {skew !== 0 && (
            <span
              className="inline-flex items-center gap-0.5 rounded-full border border-[var(--gold-dim)] px-1.5 font-mono-ui text-[10px] font-semibold text-[var(--gold)]"
              title={t("Straighten", "តម្រង់")}
            >
              <Wand2 size={9} />{skew > 0 ? "+" : ""}{skew.toFixed(1)}°
            </span>
          )}
        </div>
        <span className="min-h-[12px] font-mono-ui text-[9px] text-[var(--ink-faint)]">
          {page.confidence != null ? `conf ${page.confidence.toFixed(1)}` : page.note ?? ""}
        </span>
      </div>
    </div>
  );
};
PageCard.displayName = "PageCard";

/* -------------------------------------------------------------------- tool */

type Filter = "all" | "flagged";

export default function RotationBench() {
  const { text: t } = useLanguage();

  const [phase, setPhase] = useState<"intro" | "work">("intro");
  const [fileName, setFileName] = useState("");
  const [fileMeta, setFileMeta] = useState("");
  const [pages, setPages] = useState<PageState[]>([]);
  const [ocrEnabled, setOcrEnabled] = useState(true);
  const [deskewOn, setDeskewOn] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<{ text: string; count: string; pct: number; show: boolean }>({ text: "", count: "", pct: 0, show: false });
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const pdfDocRef = useRef<AnyPdf>(null);
  const fileRef = useRef<File | null>(null);
  const workerPoolRef = useRef<OsdWorker[]>([]);
  const stoppedRef = useRef(false);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);

  const updatePage = useCallback((index: number, patch: Partial<PageState> | ((p: PageState) => Partial<PageState>)) => {
    setPages((ps) => ps.map((p) => (p.index === index ? { ...p, ...(typeof patch === "function" ? patch(p) : patch) } : p)));
  }, []);

  const stats = useMemo(() => {
    let ok = 0, flagged = 0, manual = 0;
    for (const p of pages) {
      if (p.status === "flagged") flagged++;
      else if (p.status === "manual") manual++;
      else if (p.status === "ok" || p.status === "auto") ok++;
    }
    return { total: pages.length, ok, flagged, manual };
  }, [pages]);

  const terminateWorkerPool = useCallback(async () => {
    const pool = workerPoolRef.current;
    workerPoolRef.current = [];
    await Promise.all(pool.map((w) => w.terminate().catch(() => {})));
  }, []);

  useEffect(() => () => { void terminateWorkerPool(); }, [terminateWorkerPool]);

  /* ---- pdf rendering ---- */
  const renderPageAtScale = useCallback(async (pageIndex: number, targetPx: number): Promise<HTMLCanvasElement> => {
    const pageProxy = await pdfDocRef.current.getPage(pageIndex + 1);
    const base = pageProxy.getViewport({ scale: 1 });
    const scale = targetPx / Math.max(base.width, base.height);
    const viewport = pageProxy.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await pageProxy.render({ canvasContext: ctx, viewport, canvas } as any).promise;
    return canvas;
  }, []);

  const renderAllPages = useCallback(async (file: File) => {
    const buf = await file.arrayBuffer();
    const pdfjs = await loadPdfJs();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    pdfDocRef.current = doc;
    const total = doc.numPages as number;
    setFileMeta(`${total} ${t(total === 1 ? "page" : "pages", "ទំព័រ")} · ${formatBytes(file.size)}`);

    for (let i = 0; i < total; i++) {
      if (stoppedRef.current) return;
      const canvas = await renderPageAtScale(i, RENDER_TARGET_PX);
      const page: PageState = {
        index: i,
        thumb: canvas.toDataURL("image/png"),
        ratio: canvas.width / canvas.height,
        extra: 0,
        deskew: 0,
        status: "pending",
        confidence: null,
        note: null,
      };
      setPages((ps) => [...ps, page]);
      setProgress({ text: t("Reading pages…", "កំពុងអានទំព័រ…"), count: `${i + 1} / ${total}`, pct: Math.round(((i + 1) / total) * 40), show: true });
    }
  }, [renderPageAtScale, t]);

  /* ---- OSD ---- */
  const ensureWorkerPool = useCallback(async (): Promise<OsdWorker[]> => {
    if (workerPoolRef.current.length) return workerPoolRef.current;
    const mod = await import("tesseract.js");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createWorker = ((mod as any).createWorker ?? (mod as any).default?.createWorker) as (langs: string, oem: number, opts: Record<string, unknown>) => Promise<OsdWorker>;
    // 'osd' is the small orientation/script model; OSD is a Legacy-engine
    // feature, so legacyCore/legacyLang must be enabled (they're off by default
    // in v5+). Worker/core/lang assets load from Tesseract's own CDN defaults.
    const opts = { legacyCore: true, legacyLang: true };
    workerPoolRef.current = await Promise.all(Array.from({ length: WORKER_POOL_SIZE }, () => createWorker("osd", 0, opts)));
    return workerPoolRef.current;
  }, []);

  const detectOnePage = useCallback(async (worker: OsdWorker, index: number) => {
    try {
      // Render once at OSD resolution; the same canvas is reused (rotated) for
      // the fine-skew measurement, so a confident page needs no extra render.
      const baseCanvas = await renderPageAtScale(index, OSD_RENDER_PX);
      const base = parseOsd((await worker.detect(baseCanvas)).data);
      let final = base;
      let note: string | null = null;

      const weak = base.deg === null || base.conf === null || base.conf < CONFIDENCE_THRESHOLD;
      if (weak && !stoppedRef.current) {
        const retryCanvas = preprocessForOsd(await renderPageAtScale(index, OSD_RETRY_PX));
        const retry = parseOsd((await worker.detect(retryCanvas)).data);
        if (base.deg !== null && retry.deg !== null && base.deg !== retry.deg) {
          // Low-res and high-res passes disagreed — that disagreement is itself
          // the signal; flag rather than pick one.
          final = { deg: null, conf: null };
          note = t("passes disagreed", "លទ្ធផលមិនត្រូវគ្នា");
        } else if (retry.conf !== null && (base.conf === null || retry.conf > base.conf)) {
          final = retry;
        }
      }

      if (final.deg === null || final.conf === null) {
        updatePage(index, { status: "flagged", confidence: null, note, deskew: 0 });
      } else if (final.conf < CONFIDENCE_THRESHOLD) {
        updatePage(index, { status: "flagged", confidence: final.conf, note: null, deskew: 0 });
      } else {
        const extra = ((final.deg % 360) + 360) % 360;
        // Measure skew on the orientation-corrected image so text is roughly
        // horizontal before we look for tilt.
        let deskew = 0;
        try { deskew = estimateSkew(rotateCanvas(baseCanvas, extra)); } catch { deskew = 0; }
        updatePage(index, { status: extra === 0 ? "ok" : "auto", confidence: final.conf, extra, deskew, note: null });
      }
    } catch {
      updatePage(index, { status: "flagged", confidence: null, note: t("detection error", "កំហុសពិនិត្យ"), deskew: 0 });
    }
  }, [renderPageAtScale, updatePage, t]);

  // Runs `task` over `indices` across the whole worker pool concurrently.
  const runPooled = useCallback(async (indices: number[], pool: OsdWorker[], task: (index: number, worker: OsdWorker) => Promise<void>) => {
    let next = 0;
    const lane = async (worker: OsdWorker) => {
      while (next < indices.length) {
        if (stoppedRef.current) return;
        while (pausedRef.current && !stoppedRef.current) await new Promise((r) => setTimeout(r, 200));
        if (stoppedRef.current) return;
        const i = next++;
        await task(indices[i], worker);
      }
    };
    await Promise.all(pool.map(lane));
  }, []);

  const detectAll = useCallback(async (count: number) => {
    if (count === 0) return;
    if (!ocrEnabled) {
      setPages((ps) => ps.map((p) => ({ ...p, status: "flagged", confidence: null })));
      setProgress((s) => ({ ...s, show: false }));
      return;
    }
    let pool: OsdWorker[];
    try {
      setProgress((s) => ({ ...s, text: t("Loading OCR engine…", "កំពុងផ្ទុកម៉ាស៊ីន OCR…") }));
      pool = await ensureWorkerPool();
    } catch {
      setPages((ps) => ps.map((p) => ({ ...p, status: "flagged", confidence: null })));
      setProgress({ text: t("OCR unavailable — every page flagged for manual rotation.", "OCR មិនអាចប្រើបាន — គ្រប់ទំព័រត្រូវសម្គាល់សម្រាប់បង្វិលដោយដៃ។"), count: "", pct: 100, show: true });
      return;
    }
    let done = 0;
    setProgress((s) => ({ ...s, text: t("Checking orientation…", "កំពុងពិនិត្យទិសដៅ…") }));
    const indices = Array.from({ length: count }, (_, i) => i);
    await runPooled(indices, pool, async (index, worker) => {
      await detectOnePage(worker, index);
      done++;
      setProgress({ text: t("Checking orientation…", "កំពុងពិនិត្យទិសដៅ…"), count: `${done} / ${count}`, pct: 40 + Math.round((done / count) * 60), show: true });
    });
    if (stoppedRef.current) return;
    setProgress({ text: t("Done.", "រួចរាល់។"), count: `${count} / ${count}`, pct: 100, show: true });
    setTimeout(() => setProgress((s) => ({ ...s, show: false })), 900);
  }, [ocrEnabled, ensureWorkerPool, runPooled, detectOnePage, t]);

  /* ---- main flow ---- */
  const handleFile = useCallback(async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      setProgress({ text: t("Please choose a PDF file.", "សូមជ្រើសឯកសារ PDF។"), count: "", pct: 0, show: true });
      return;
    }
    stoppedRef.current = false;
    pausedRef.current = false;
    setPaused(false);
    fileRef.current = file;
    setPages([]);
    setSelected(new Set());
    setFilter("all");
    setFileName(file.name);
    setFileMeta(t("Reading…", "កំពុងអាន…"));
    setPhase("work");
    setProgress({ text: t("Reading pages…", "កំពុងអានទំព័រ…"), count: "", pct: 0, show: true });
    try {
      await renderAllPages(file);
      if (stoppedRef.current) return;
      // Read the freshly-rendered count from the DOM-independent source.
      const total = (pdfDocRef.current?.numPages as number) ?? 0;
      await detectAll(total);
    } catch {
      setProgress({ text: t("Something went wrong reading this file.", "មានបញ្ហាពេលអានឯកសារនេះ។"), count: "", pct: 0, show: true });
    }
  }, [renderAllPages, detectAll, t]);

  const retryFlagged = useCallback(async () => {
    const flaggedIndices = pages.filter((p) => p.status === "flagged").map((p) => p.index);
    if (flaggedIndices.length === 0 || retrying) return;
    setRetrying(true);
    setProgress({ text: t("Retrying flagged pages…", "កំពុងព្យាយាមម្តងទៀត…"), count: "", pct: 0, show: true });
    try {
      const pool = await ensureWorkerPool();
      flaggedIndices.forEach((i) => updatePage(i, { status: "pending" }));
      let done = 0;
      await runPooled(flaggedIndices, pool, async (index, worker) => {
        await detectOnePage(worker, index);
        done++;
        setProgress({ text: t("Retrying flagged pages…", "កំពុងព្យាយាមម្តងទៀត…"), count: `${done} / ${flaggedIndices.length}`, pct: Math.round((done / flaggedIndices.length) * 100), show: true });
      });
    } catch {
      /* ignore — pages stay flagged */
    } finally {
      setRetrying(false);
      setProgress({ text: t("Done.", "រួចរាល់។"), count: "", pct: 100, show: true });
      setTimeout(() => setProgress((s) => ({ ...s, show: false })), 900);
    }
  }, [pages, retrying, ensureWorkerPool, runPooled, detectOnePage, updatePage, t]);

  /* ---- rotation + selection ---- */
  const rotatePage = useCallback((index: number) => {
    updatePage(index, (p) => ({ extra: (p.extra + 90) % 360, status: "manual", note: null }));
  }, [updatePage]);

  // Fine skew adjustment from the preview overlay (delta in degrees; 0 resets).
  const nudgeSkew = useCallback((index: number, delta: number) => {
    updatePage(index, (p) => ({
      deskew: delta === 0 ? 0 : Math.max(-SKEW_MAX_DEG, Math.min(SKEW_MAX_DEG, Math.round((p.deskew + delta) * 10) / 10)),
    }));
  }, [updatePage]);

  const toggleSelect = useCallback((index: number, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(index); else next.delete(index);
      return next;
    });
  }, []);

  const bulkRotate = useCallback((delta: number) => {
    if (selected.size === 0) return;
    setPages((ps) => ps.map((p) => (selected.has(p.index) ? { ...p, extra: (((p.extra + delta) % 360) + 360) % 360, status: "manual", note: null } : p)));
    setSelected(new Set());
  }, [selected]);

  const selectFlagged = useCallback(() => {
    setSelected(new Set(pages.filter((p) => p.status === "flagged").map((p) => p.index)));
  }, [pages]);

  const startOver = useCallback(() => {
    stoppedRef.current = true;
    void terminateWorkerPool();
    pdfDocRef.current = null;
    fileRef.current = null;
    setPages([]);
    setSelected(new Set());
    setPhase("intro");
    setProgress({ text: "", count: "", pct: 0, show: false });
  }, [terminateWorkerPool]);

  /* ---- export ---- */

  // Bakes a page's full correction (coarse 90° + fine skew) into an upright,
  // straight raster at print resolution. Only used for pages that need a
  // straighten, since this is the one step that can't be stored losslessly.
  const renderCorrectedRaster = useCallback(async (index: number, extra: number, deskew: number) => {
    const pageProxy = await pdfDocRef.current.getPage(index + 1);
    const vp1 = pageProxy.getViewport({ scale: 1 });
    const scale = EXPORT_RASTER_PX / Math.max(vp1.width, vp1.height);
    const vp = pageProxy.getViewport({ scale });
    const raw = document.createElement("canvas");
    raw.width = Math.round(vp.width);
    raw.height = Math.round(vp.height);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await pageProxy.render({ canvasContext: raw.getContext("2d"), viewport: vp, canvas: raw } as any).promise;
    const swap = extra === 90 || extra === 270;
    const out = document.createElement("canvas");
    out.width = swap ? raw.height : raw.width;
    out.height = swap ? raw.width : raw.height;
    const ctx = out.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.translate(out.width / 2, out.height / 2);
      ctx.rotate(((extra + deskew) * Math.PI) / 180);
      ctx.drawImage(raw, -raw.width / 2, -raw.height / 2);
    }
    return { canvas: out, ptW: swap ? vp1.height : vp1.width, ptH: swap ? vp1.width : vp1.height };
  }, []);

  const exportPdf = useCallback(async () => {
    if (!fileRef.current) return;
    setExporting(true);
    try {
      const bytes = await fileRef.current.arrayBuffer();
      const { PDFDocument, degrees } = await import("pdf-lib");
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const straighten = new Set(pages.filter((p) => deskewOn && Math.abs(p.deskew) >= SKEW_MIN_DEG).map((p) => p.index));

      let out = src;
      if (straighten.size === 0) {
        // Fully lossless: just rewrite /Rotate on the original document.
        const pdfPages = src.getPages();
        pages.forEach((p) => {
          const target = pdfPages[p.index];
          if (!target || p.extra % 360 === 0) return;
          const current = target.getRotation().angle || 0;
          target.setRotation(degrees((((current + p.extra) % 360) + 360) % 360));
        });
      } else {
        // Hybrid: copy untouched pages losslessly (with /Rotate); rasterise only
        // the pages that need a fine straighten.
        out = await PDFDocument.create();
        setProgress({ text: t("Building PDF…", "កំពុងបង្កើត PDF…"), count: "", pct: 0, show: true });
        for (const p of pages) {
          if (!straighten.has(p.index)) {
            const [copied] = await out.copyPages(src, [p.index]);
            if (p.extra % 360 !== 0) {
              const current = copied.getRotation().angle || 0;
              copied.setRotation(degrees((((current + p.extra) % 360) + 360) % 360));
            }
            out.addPage(copied);
          } else {
            const raster = await renderCorrectedRaster(p.index, p.extra, p.deskew);
            const jpg = await out.embedJpg(raster.canvas.toDataURL("image/jpeg", 0.92));
            const page = out.addPage([raster.ptW, raster.ptH]);
            page.drawImage(jpg, { x: 0, y: 0, width: raster.ptW, height: raster.ptH });
          }
        }
      }

      const outBytes = await out.save();
      const blob = new Blob([outBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(fileRef.current.name || "document.pdf").replace(/\.pdf$/i, "")}_fixed.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setProgress((s) => ({ ...s, show: false }));
      recordExport();
    } catch {
      setProgress({ text: t("Could not build the corrected PDF.", "មិនអាចបង្កើត PDF កែតម្រូវបានទេ។"), count: "", pct: 0, show: true });
    } finally {
      setExporting(false);
    }
  }, [pages, deskewOn, renderCorrectedRaster, t]);

  const togglePause = useCallback(() => {
    setPaused((prev) => {
      const next = !prev;
      pausedRef.current = next;
      return next;
    });
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  }, [handleFile]);

  const visiblePages = filter === "flagged" ? pages.filter((p) => p.status === "flagged") : pages;
  const rasterCount = deskewOn ? pages.reduce((n, p) => n + (Math.abs(p.deskew) >= SKEW_MIN_DEG ? 1 : 0), 0) : 0;
  const previewPage = previewIndex != null ? pages.find((p) => p.index === previewIndex) ?? null : null;

  return (
    <ToolShell
      title="Rotation Bench"
      khmerTitle="តុបង្វិលទំព័រ PDF"
      description="Fix the orientation and skew of a scanned PDF — sideways and upside-down pages are auto-corrected, crooked pages are straightened, low-confidence pages are flagged for a click, and the file is exported keeping every rotation-only page lossless. Everything runs locally in your browser."
      descriptionKm="កែទិសដៅ និងភាពផ្អៀងនៃឯកសារ PDF ស្កេន — ទំព័រផ្ដេក និងបញ្ច្រាសត្រូវកែស្វ័យប្រវត្តិ ទំព័រផ្អៀងត្រូវតម្រង់ ទំព័រដែលមិនប្រាកដត្រូវសម្គាល់ឲ្យចុច រួចនាំចេញឯកសារដោយរក្សាទំព័របង្វិលៗឲ្យនៅគុណភាពដើម។ ដំណើរការទាំងស្រុងក្នុងកម្មវិធីរុករករបស់អ្នក។"
    >
      {phase === "intro" ? (
        <div className="mx-auto max-w-xl">
          <div
            onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
            onDrop={onDrop}
            className={`relative overflow-hidden rounded-xl border-2 border-dashed p-10 text-center transition ${dragging ? "border-[var(--gold)] bg-[var(--ground-raised-hi)]" : "border-[var(--ground-line)] bg-[var(--ground-raised)]"}`}
          >
            {dragging && <ScanLine className="mx-auto mb-3 text-[var(--gold)]" />}
            <FileUp size={34} className="mx-auto mb-4 text-[var(--ink-faint)]" />
            <h3 className="font-display text-lg font-semibold text-[var(--ink)]">{t("Drop a scanned PDF here", "ទម្លាក់ឯកសារ PDF ស្កេននៅទីនេះ")}</h3>
            <p className="mt-1 text-sm text-[var(--ink-dim)]">{t("or", "ឬ")}</p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]">
              <FileUp size={15} /> {t("Choose a file", "ជ្រើសឯកសារ")}
              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }} />
            </label>
            <p className="mt-5 text-xs text-[var(--ink-faint)]">{t("Works with multi-hundred-page files. Nothing is uploaded anywhere.", "ដំណើរការជាមួយឯកសាររាប់រយទំព័រ។ គ្មានអ្វីត្រូវផ្ទុកឡើងកន្លែងណាទេ។")}</p>
          </div>

          <details className="mt-4 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-sm">
            <summary className="cursor-pointer font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</summary>
            <div className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-[var(--ink-dim)]">
              <p>{t("Adapted from an in-house HTML prototype and rebuilt on this app's shared components.", "កែសម្រួលពីគំរូ HTML ផ្ទៃក្នុង ហើយបង្កើតឡើងវិញលើសមាសភាគរួមរបស់កម្មវិធីនេះ។")}</p>
              <p>{t("Rendering: pdf.js (Apache-2.0, Mozilla). Rewriting: pdf-lib (MIT). Orientation detection: Tesseract.js OSD (Apache-2.0).", "ការបង្ហាញ: pdf.js (Apache-2.0, Mozilla)។ ការសរសេរឡើងវិញ: pdf-lib (MIT)។ ការពិនិត្យទិសដៅ: Tesseract.js OSD (Apache-2.0)។")}</p>
              <p>{t("Skew detection is an independent implementation of the classic projection-profile method.", "ការពិនិត្យភាពផ្អៀងជាការអនុវត្តឯករាជ្យនៃវិធីសាស្ត្រ projection-profile ដ៏ល្បី។")}</p>
            </div>
          </details>
        </div>
      ) : (
        <div className="space-y-4">
          {/* toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--ink)]">{fileName}</div>
              <div className="text-xs text-[var(--ink-faint)]">{fileMeta}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-[var(--ink-dim)]">
                <input type="checkbox" checked={ocrEnabled} onChange={(e) => setOcrEnabled(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--gold)]" />
                {t("Auto-detect with OCR", "ពិនិត្យស្វ័យប្រវត្តិ OCR")}
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-[var(--ink-dim)]" title={t("Straighten pages tilted by a few degrees. Straightened pages are re-rendered as images on export.", "តម្រង់ទំព័រដែលផ្អៀងពីរបីដឺក្រេ។ ទំព័រដែលបានតម្រង់ត្រូវបង្ហាញឡើងវិញជារូបភាពពេលនាំចេញ។")}>
                <input type="checkbox" checked={deskewOn} onChange={(e) => setDeskewOn(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--gold)]" />
                {t("Auto-straighten (deskew)", "តម្រង់ស្វ័យប្រវត្តិ")}
              </label>
              <button onClick={retryFlagged} disabled={stats.flagged === 0 || retrying} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] px-2.5 py-1.5 text-xs text-[var(--ink)] transition hover:border-[var(--gold-dim)] disabled:opacity-40">{t("Retry flagged", "ព្យាយាមឡើងវិញ")}</button>
              <button onClick={selectFlagged} disabled={stats.flagged === 0} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] px-2.5 py-1.5 text-xs text-[var(--ink)] transition hover:border-[var(--gold-dim)] disabled:opacity-40">{t("Select flagged", "ជ្រើសទំព័រសម្គាល់")}</button>
              <button onClick={togglePause} className="flex items-center gap-1 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] px-2.5 py-1.5 text-xs text-[var(--ink)] transition hover:border-[var(--gold-dim)]">{paused ? <Play size={12} /> : <Pause size={12} />}{paused ? t("Resume", "បន្ត") : t("Pause", "ផ្អាក")}</button>
              <button onClick={startOver} className="rounded-md px-2.5 py-1.5 text-xs text-[var(--ink-faint)] transition hover:text-[var(--ink)]">{t("Start over", "ចាប់ផ្ដើមឡើងវិញ")}</button>
            </div>
          </div>

          {/* progress */}
          {progress.show && (
            <div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ground-line)]">
                <div className="h-full rounded-full bg-[var(--gold)] transition-[width] duration-300" style={{ width: `${progress.pct}%` }} />
              </div>
              <div className="mt-1 flex justify-between font-mono-ui text-[11px] text-[var(--ink-faint)]"><span>{progress.text}</span><span>{progress.count}</span></div>
            </div>
          )}

          {/* legend + filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--ink-dim)]">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "var(--success)" }} />{t("corrected", "កែរួច")}</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "var(--danger)" }} />{t("needs a look — click to rotate", "ត្រូវពិនិត្យ — ចុចដើម្បីបង្វិល")}</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "var(--ink-dim)" }} />{t("rotated by hand", "បង្វិលដោយដៃ")}</span>
            </div>
            <div className="flex gap-1.5">
              <button className="chip" data-active={filter === "all"} onClick={() => setFilter("all")}>{t("All", "ទាំងអស់")} <span className="font-mono-ui">{stats.total}</span></button>
              <button className="chip" data-active={filter === "flagged"} onClick={() => setFilter("flagged")}>{t("Needs a look", "ត្រូវពិនិត្យ")} <span className="font-mono-ui">{stats.flagged}</span></button>
            </div>
          </div>

          {/* bulk bar */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--gold-dim)] bg-[var(--ground-raised)] p-3 text-sm">
              <span className="font-medium text-[var(--ink)]">{selected.size} {t("selected", "បានជ្រើស")}</span>
              <button onClick={() => bulkRotate(90)} className="inline-flex items-center gap-1 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] px-2.5 py-1.5 text-xs text-[var(--ink)] hover:border-[var(--gold-dim)]"><RotateCw size={12} />+90°</button>
              <button onClick={() => bulkRotate(180)} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] px-2.5 py-1.5 text-xs text-[var(--ink)] hover:border-[var(--gold-dim)]">+180°</button>
              <button onClick={() => bulkRotate(270)} className="inline-flex items-center gap-1 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] px-2.5 py-1.5 text-xs text-[var(--ink)] hover:border-[var(--gold-dim)]"><RotateCcw size={12} />+270°</button>
              <button onClick={() => setSelected(new Set())} className="ml-auto rounded-md px-2.5 py-1.5 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">{t("Clear selection", "សម្អាតការជ្រើស")}</button>
            </div>
          )}

          {/* page grid */}
          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            {visiblePages.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--ink-faint)]">{filter === "flagged" ? t("No flagged pages.", "គ្មានទំព័រត្រូវពិនិត្យ។") : t("Reading…", "កំពុងអាន…")}</p>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
                {visiblePages.map((p) => (
                  <PageCard key={p.index} page={p} selected={selected.has(p.index)} deskewOn={deskewOn} onRotate={rotatePage} onToggleSelect={toggleSelect} onExpand={setPreviewIndex} />
                ))}
              </div>
            )}
          </div>

          {/* summary + export */}
          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <span className="text-[var(--ink-dim)]"><b className="font-mono-ui text-[var(--ink)]">{stats.total}</b> {t("pages", "ទំព័រ")}</span>
              <span className="text-[var(--ink-dim)]"><b className="font-mono-ui text-[var(--success)]">{stats.ok}</b> {t("auto-corrected", "កែស្វ័យប្រវត្តិ")}</span>
              <span className="text-[var(--ink-dim)]"><b className="font-mono-ui text-[var(--danger)]">{stats.flagged}</b> {t("need a look", "ត្រូវពិនិត្យ")}</span>
              <span className="text-[var(--ink-dim)]"><b className="font-mono-ui text-[var(--ink)]">{stats.manual}</b> {t("by hand", "ដោយដៃ")}</span>
              {rasterCount > 0 && <span className="text-[var(--ink-dim)]"><b className="font-mono-ui text-[var(--gold)]">{rasterCount}</b> {t("straightened", "តម្រង់")}</span>}
              <Button className="inline-flex items-center gap-2" onClick={exportPdf} disabled={stats.total === 0 || exporting}>
                {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                {exporting ? t("Building PDF…", "កំពុងបង្កើត PDF…") : t("Export corrected PDF", "នាំចេញ PDF កែតម្រូវ")}
              </Button>
            </div>
            {rasterCount > 0 && (
              <p className="mt-2 text-center text-[11px] leading-relaxed text-[var(--ink-faint)]">
                {t(`${rasterCount} straightened page${rasterCount === 1 ? "" : "s"} will be re-rendered as an image on export; every other page stays lossless (rotation-only).`,
                  `ទំព័រតម្រង់ ${rasterCount} នឹងត្រូវបង្ហាញឡើងវិញជារូបភាពពេលនាំចេញ; ទំព័រផ្សេងទៀតរក្សាគុណភាពដើម (បង្វិលតែប៉ុណ្ណោះ)។`)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* preview overlay */}
      {previewPage && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-black/80 p-8" onClick={() => setPreviewIndex(null)}>
          <button className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ground-raised)] text-[var(--ink)]" onClick={() => setPreviewIndex(null)} aria-label={t("Close preview", "បិទ")}><X size={18} /></button>
          <div className="flex min-h-0 flex-1 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewPage.thumb} alt="" style={{ maxWidth: "100%", maxHeight: "100%", transform: `rotate(${previewPage.extra + previewPage.deskew}deg)`, background: "#fff" }} onClick={(e) => e.stopPropagation()} />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2 text-sm" onClick={(e) => e.stopPropagation()}>
            <span className="px-1 text-xs text-[var(--ink-dim)]">{t(`Page ${previewPage.index + 1}`, `ទំព័រ ${previewPage.index + 1}`)}</span>
            <button onClick={() => rotatePage(previewPage.index)} className="inline-flex items-center gap-1 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] px-2.5 py-1.5 text-xs text-[var(--ink)] hover:border-[var(--gold-dim)]"><RotateCw size={12} />{t("Rotate 90°", "បង្វិល ៩០°")}</button>
            <span className="mx-1 h-4 w-px bg-[var(--ground-line)]" />
            <span className="text-xs text-[var(--ink-dim)]">{t("Straighten", "តម្រង់")}</span>
            <button onClick={() => nudgeSkew(previewPage.index, -0.2)} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] px-2.5 py-1.5 text-xs text-[var(--ink)] hover:border-[var(--gold-dim)]" aria-label={t("Tilt left", "ផ្អៀងឆ្វេង")}><RotateCcw size={12} /></button>
            <span className="w-14 text-center font-mono-ui text-xs font-semibold text-[var(--gold)]">{previewPage.deskew > 0 ? "+" : ""}{previewPage.deskew.toFixed(1)}°</span>
            <button onClick={() => nudgeSkew(previewPage.index, 0.2)} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] px-2.5 py-1.5 text-xs text-[var(--ink)] hover:border-[var(--gold-dim)]" aria-label={t("Tilt right", "ផ្អៀងស្តាំ")}><RotateCw size={12} /></button>
            <button onClick={() => nudgeSkew(previewPage.index, 0)} className="rounded-md px-2.5 py-1.5 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">{t("Reset", "កំណត់ឡើងវិញ")}</button>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
