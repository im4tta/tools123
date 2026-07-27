"use client";
import { useRef, useState } from "react";
import { Download, FileText, Image as ImageIcon, Package, X } from "lucide-react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { loadPdfJs, formatBytes } from "@/lib/pdfjs";
import { useToolState } from "@/lib/storage";

/**
 * File Compressor — ported from Sralify (github.com/im4tta/Sralify), the
 * author's standalone PDF/image compressor PWA. Same core ideas (presets,
 * before/after comparison, batch + ZIP, live savings tracker) rebuilt as a
 * toolbox tool: images are re-encoded via Canvas, PDFs are re-rasterized
 * page-by-page and re-embedded as JPEG through pdf-lib (already a toolbox
 * dependency, so no jsPDF needed like the original).
 */

type Preset = "low" | "recommended" | "extreme" | "custom";
type ImageFormat = "auto" | "webp" | "jpeg" | "png";

interface Settings {
  preset: Preset;
  scale: number; // PDF render scale
  quality: number; // 0-1, shared by PDF JPEG re-encode + lossy image formats
  format: ImageFormat;
  maxDimension: number; // 0 = no resize
}

const PRESETS: Record<Exclude<Preset, "custom">, { scale: number; quality: number; label: string; desc: string }> = {
  low: { scale: 2.0, quality: 0.85, label: "Low", desc: "High quality · larger file" },
  recommended: { scale: 1.5, quality: 0.72, label: "Recommended", desc: "Good quality · good compression" },
  extreme: { scale: 1.1, quality: 0.55, label: "Extreme", desc: "Smaller file · lower quality" },
};

const initial: Settings = { preset: "recommended", scale: 1.5, quality: 0.72, format: "auto", maxDimension: 0 };

type Kind = "pdf" | "image";
type Status = "pending" | "processing" | "done" | "error";

interface Item {
  id: string;
  file: File;
  kind: Kind;
  status: Status;
  error?: string;
  originalUrl?: string; // image only — for the before/after slider
  resultUrl?: string;
  resultBlob?: Blob;
  resultSize?: number;
  resultExt?: string;
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1];
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function getBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through to <img> fallback
    }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("decode failed"));
    img.src = url;
  });
  return img;
}

function pickOutput(file: File, format: ImageFormat) {
  if (format === "jpeg") return { mime: "image/jpeg", ext: "jpg" };
  if (format === "webp") return { mime: "image/webp", ext: "webp" };
  if (format === "png") return { mime: "image/png", ext: "png" };
  if (/^image\/(jpeg|png|webp)$/.test(file.type)) {
    const sub = file.type.split("/")[1];
    return { mime: file.type, ext: sub === "jpeg" ? "jpg" : sub };
  }
  return { mime: "image/jpeg", ext: "jpg" };
}

async function compressImage(file: File, s: Settings) {
  const source = await getBitmap(file);
  let width = "width" in source ? source.width : (source as HTMLImageElement).naturalWidth;
  let height = "height" in source ? source.height : (source as HTMLImageElement).naturalHeight;

  if (s.maxDimension && Math.max(width, height) > s.maxDimension) {
    const ratio = s.maxDimension / Math.max(width, height);
    width = Math.max(1, Math.round(width * ratio));
    height = Math.max(1, Math.round(height * ratio));
  }

  const { mime, ext } = pickOutput(file, s.format);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  if (mime === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  if ("close" in source) (source as ImageBitmap).close();

  const quality = mime === "image/png" ? undefined : s.quality;
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), mime, quality)
  );
  canvas.width = 0;
  canvas.height = 0;
  return { blob, ext };
}

async function compressPdf(file: File, s: Settings) {
  const pdfjs = await loadPdfJs();
  const { PDFDocument } = await import("pdf-lib");
  const buf = await file.arrayBuffer();
  const srcDoc = await pdfjs.getDocument({ data: buf }).promise;
  const outDoc = await PDFDocument.create();

  for (let i = 1; i <= srcDoc.numPages; i++) {
    const page = await srcDoc.getPage(i);
    const viewport = page.getViewport({ scale: s.scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

    const jpegBytes = dataUrlToBytes(canvas.toDataURL("image/jpeg", s.quality));
    const jpg = await outDoc.embedJpg(jpegBytes);
    const ptViewport = page.getViewport({ scale: 1 });
    const pdfPage = outDoc.addPage([ptViewport.width, ptViewport.height]);
    pdfPage.drawImage(jpg, { x: 0, y: 0, width: ptViewport.width, height: ptViewport.height });

    canvas.width = 0;
    canvas.height = 0;
    await new Promise((r) => setTimeout(r, 0)); // yield so the UI can update between pages
  }

  const bytes = await outDoc.save();
  return { blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), ext: "pdf" };
}

export default function FileCompressorTool() {
  const [s, setS] = useToolState<Settings>("file-compressor", initial);
  const update = (patch: Partial<Settings>) => setS((prev) => ({ ...prev, ...patch, preset: "custom" }));
  const applyPreset = (p: Exclude<Preset, "custom">) => setS((prev) => ({ ...prev, preset: p, scale: PRESETS[p].scale, quality: PRESETS[p].quality }));

  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasPdf = items.some((i) => i.kind === "pdf");
  const totalOriginal = items.reduce((sum, i) => sum + i.file.size, 0);
  const totalResult = items.reduce((sum, i) => sum + (i.resultSize ?? i.file.size), 0);
  const doneCount = items.filter((i) => i.status === "done").length;
  const savedPct = totalOriginal > 0 ? Math.round((1 - totalResult / totalOriginal) * 100) : 0;

  function addFiles(files: FileList | File[]) {
    const list: Item[] = Array.from(files)
      .filter((f) => f.type === "application/pdf" || f.type.startsWith("image/"))
      .map((file) => ({
        id: `${file.name}-${file.size}-${Math.random()}`,
        file,
        kind: file.type === "application/pdf" ? "pdf" : "image",
        status: "pending",
        originalUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      }));
    setItems((prev) => [...prev, ...list]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function compressAll() {
    setBusy(true);
    for (const item of items) {
      if (item.status === "done") continue;
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "processing" } : i)));
      try {
        const { blob, ext } = item.kind === "pdf" ? await compressPdf(item.file, s) : await compressImage(item.file, s);
        const resultUrl = URL.createObjectURL(blob);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "done", resultUrl, resultBlob: blob, resultSize: blob.size, resultExt: ext } : i))
        );
      } catch {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "error", error: "Could not compress this file." } : i)));
      }
    }
    setBusy(false);
  }

  async function downloadZip() {
    const done = items.filter((i) => i.status === "done" && i.resultBlob);
    if (done.length === 0) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const usedNames = new Set<string>();
    for (const item of done) {
      const base = item.file.name.replace(/\.[^.]+$/, "");
      let name = `${base}.${item.resultExt}`;
      let n = 1;
      while (usedNames.has(name)) name = `${base}-${n++}.${item.resultExt}`;
      usedNames.add(name);
      zip.file(name, item.resultBlob!);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compressed-files.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <ToolShell
      title="File Compressor"
      description="Shrink PDFs and images — batch, in your browser, nothing uploaded. Ported from the author's standalone tool, Sralify (ស្រាល, Khmer for 'light')."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>Drop or click to add PDFs / JPG / PNG / WebP (multiple files OK)</span>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
        />
      </label>

      <div>
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Presets</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(Object.keys(PRESETS) as Exclude<Preset, "custom">[]).map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className={`rounded-md border px-3 py-2.5 text-left transition ${
                s.preset === p
                  ? "border-[var(--gold)] bg-[var(--ground-raised-hi)]"
                  : "border-[var(--ground-line)] bg-[var(--ground-raised)] hover:border-[var(--gold-dim)]"
              }`}
            >
              <div className="text-sm font-medium text-[var(--ink)]">{PRESETS[p].label}</div>
              <div className="text-[11px] text-[var(--ink-faint)]">{PRESETS[p].desc}</div>
            </button>
          ))}
        </div>
      </div>

      {hasPdf && (
        <Field label="PDF render scale" hint={`${s.scale.toFixed(1)}×`}>
          <input type="range" min={0.5} max={3} step={0.1} value={s.scale} onChange={(e) => update({ scale: Number(e.target.value) })} className="w-full" />
        </Field>
      )}
      <Field label="Quality" hint={s.quality.toFixed(2)}>
        <input type="range" min={0.1} max={1} step={0.05} value={s.quality} onChange={(e) => update({ quality: Number(e.target.value) })} className="w-full" />
      </Field>

      <Row>
        <Field label="Image output format">
          <Select value={s.format} onChange={(e) => update({ format: e.target.value as ImageFormat })}>
            <option value="auto">Keep original</option>
            <option value="webp">WebP (smallest)</option>
            <option value="jpeg">JPEG</option>
            <option value="png">PNG (lossless)</option>
          </Select>
        </Field>
        <Field label="Image resize">
          <Select value={String(s.maxDimension)} onChange={(e) => update({ maxDimension: Number(e.target.value) })}>
            <option value="0">No resize</option>
            <option value="1920">Max 1920px</option>
            <option value="1280">Max 1280px</option>
            <option value="1024">Max 1024px</option>
            <option value="800">Max 800px</option>
          </Select>
        </Field>
      </Row>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} onRemove={() => removeItem(item.id)} />
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={compressAll} disabled={busy || items.every((i) => i.status === "done")}>
            {busy ? "Compressing…" : `Compress ${items.filter((i) => i.status !== "done").length || items.length} file${items.length === 1 ? "" : "s"}`}
          </Button>
          {doneCount > 0 && (
            <button
              onClick={downloadZip}
              className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs text-[var(--ink-dim)] hover:border-[var(--gold-dim)] hover:text-[var(--ink)]"
            >
              <Package size={13} /> Download all as ZIP
            </button>
          )}
        </div>
      )}

      {doneCount > 0 && (
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3 text-sm">
          <div className="flex items-center justify-between text-[var(--ink)]">
            <span>Live savings</span>
            <span className="font-medium text-[var(--gold)]">{savedPct}% smaller</span>
          </div>
          <div className="mt-1 text-xs text-[var(--ink-faint)]">
            {formatBytes(totalOriginal)} → {formatBytes(totalResult)} across {doneCount} file{doneCount === 1 ? "" : "s"}
          </div>
        </div>
      )}
    </ToolShell>
  );
}

function ItemRow({ item, onRemove }: { item: Item; onRemove: () => void }) {
  const [sliderPos, setSliderPos] = useState(50);
  const savedPct = item.resultSize ? Math.round((1 - item.resultSize / item.file.size) * 100) : null;

  return (
    <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
      <div className="flex items-center gap-2 text-xs text-[var(--ink-dim)]">
        {item.kind === "pdf" ? <FileText size={13} className="shrink-0 text-[var(--gold)]" /> : <ImageIcon size={13} className="shrink-0 text-[var(--gold)]" />}
        <span className="min-w-0 flex-1 truncate">{item.file.name}</span>
        <span className="shrink-0 text-[var(--ink-faint)]">{formatBytes(item.file.size)}</span>
        {item.status === "done" && item.resultSize !== undefined && (
          <>
            <span className="shrink-0 text-[var(--ink-faint)]">→</span>
            <span className="shrink-0 text-[var(--gold)]">{formatBytes(item.resultSize)} ({savedPct}% smaller)</span>
          </>
        )}
        {item.status === "processing" && <span className="shrink-0 text-[var(--ink-faint)]">Compressing…</span>}
        {item.status === "error" && <span className="shrink-0 text-[var(--danger)]">{item.error}</span>}
        {item.status === "done" && item.resultUrl && (
          <a
            href={item.resultUrl}
            download={`${item.file.name.replace(/\.[^.]+$/, "")}.${item.resultExt}`}
            className="shrink-0 rounded p-1 text-[var(--ink-faint)] hover:bg-[var(--ground-raised-hi)] hover:text-[var(--ink)]"
            title="Download"
          >
            <Download size={13} />
          </a>
        )}
        <button onClick={onRemove} className="shrink-0 rounded p-1 text-[var(--ink-faint)] hover:bg-[var(--ground-raised-hi)] hover:text-[var(--danger)]" title="Remove">
          <X size={13} />
        </button>
      </div>

      {/* Before/after drag slider — image results only; PDFs show size stats above instead. */}
      {item.kind === "image" && item.status === "done" && item.originalUrl && item.resultUrl && (
        <div className="mt-2">
          <div className="relative h-40 w-full overflow-hidden rounded border border-[var(--ground-line)] bg-[var(--ground)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.originalUrl} alt="Original" className="absolute inset-0 h-full w-full object-contain" />
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.resultUrl} alt="Compressed" className="h-full w-full object-contain" />
            </div>
            <div className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-[var(--gold)]" style={{ left: `${sliderPos}%` }} />
            <div className="pointer-events-none absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">compressed</div>
            <div className="pointer-events-none absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">original</div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="mt-1.5 w-full"
            aria-label="Compare original and compressed"
          />
        </div>
      )}
    </div>
  );
}
