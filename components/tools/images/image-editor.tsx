"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import { Download, FlipHorizontal, FlipVertical, RotateCcw, RotateCw } from "lucide-react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

interface Crop {
  x: number; // 0..1 fraction of natural width
  y: number;
  w: number;
  h: number;
}

interface Filters {
  brightness: number; // %
  contrast: number;
  saturate: number;
  grayscale: number;
  sepia: number;
  blur: number; // px
}

interface Settings {
  aspect: "free" | "1:1" | "4:3" | "3:2" | "16:9";
  rotation: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  outWidth: number | null;
  format: "image/jpeg" | "image/webp" | "image/png";
  quality: number;
  filters: Filters;
}

const DEFAULT_FILTERS: Filters = { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, blur: 0 };
const initial: Settings = {
  aspect: "free",
  rotation: 0,
  flipH: false,
  flipV: false,
  outWidth: null,
  format: "image/jpeg",
  quality: 0.85,
  filters: DEFAULT_FILTERS,
};

const PREVIEW_W = 560;

function aspectRatio(a: Settings["aspect"]): number | null {
  switch (a) {
    case "1:1": return 1;
    case "4:3": return 4 / 3;
    case "3:2": return 3 / 2;
    case "16:9": return 16 / 9;
    default: return null;
  }
}

function filterCss(f: Filters) {
  return `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) grayscale(${f.grayscale}%) sepia(${f.sepia}%) blur(${f.blur}px)`;
}

type Handle = "move" | "nw" | "ne" | "sw" | "se" | null;

export default function ImageEditorTool() {
  const [s, setS] = useToolState<Settings>("image-editor", initial);
  const update = (patch: Partial<Settings>) => setS((prev) => ({ ...prev, ...patch }));
  const updateFilters = (patch: Partial<Filters>) => setS((prev) => ({ ...prev, filters: { ...prev.filters, ...patch } }));

  const [file, setFile] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, w: 1, h: 1 });
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [busy, setBusy] = useState(false);

  const dragRef = useRef<{ handle: Handle; startX: number; startY: number; startCrop: Crop } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  function pickFile(f: File) {
    setFile(f);
    const url = URL.createObjectURL(f);
    setImgUrl(url);
    setResultUrl(null);
    const img = new Image();
    img.onload = () => {
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setCrop({ x: 0, y: 0, w: 1, h: 1 });
      update({ outWidth: img.naturalWidth });
    };
    img.src = url;
  }

  const previewH = natural.w ? Math.round((PREVIEW_W * natural.h) / natural.w) : 0;

  const applyAspect = useCallback(
    (c: Crop, aspect: Settings["aspect"] = s.aspect): Crop => {
      const ratio = aspectRatio(aspect);
      if (!ratio || !natural.w) return c;
      const naturalRatio = ratio;
      const cropPxW = c.w * natural.w;
      const cropPxH = c.h * natural.h;
      let w = cropPxW;
      let h = w / naturalRatio;
      if (h > natural.h) {
        h = cropPxH;
        w = h * naturalRatio;
      }
      return { x: c.x, y: c.y, w: Math.min(1, w / natural.w), h: Math.min(1, h / natural.h) };
    },
    [s.aspect, natural]
  );

  function setAspect(aspect: Settings["aspect"]) {
    update({ aspect });
    setCrop((c) => applyAspect({ ...c }, aspect));
  }

  function onHandleDown(handle: Handle, e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { handle, startX: e.clientX, startY: e.clientY, startCrop: crop };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function onMove(e: PointerEvent) {
    const d = dragRef.current;
    if (!d || !natural.w) return;
    const dxFrac = (e.clientX - d.startX) / PREVIEW_W;
    const dyFrac = (e.clientY - d.startY) / previewH;
    let next = { ...d.startCrop };

    if (d.handle === "move") {
      next.x = Math.min(1 - next.w, Math.max(0, d.startCrop.x + dxFrac));
      next.y = Math.min(1 - next.h, Math.max(0, d.startCrop.y + dyFrac));
    } else {
      const c = d.startCrop;
      if (d.handle === "se") {
        next.w = Math.min(1 - c.x, Math.max(0.05, c.w + dxFrac));
        next.h = Math.min(1 - c.y, Math.max(0.05, c.h + dyFrac));
      } else if (d.handle === "nw") {
        const newX = Math.min(c.x + c.w - 0.05, Math.max(0, c.x + dxFrac));
        const newY = Math.min(c.y + c.h - 0.05, Math.max(0, c.y + dyFrac));
        next = { x: newX, y: newY, w: c.x + c.w - newX, h: c.y + c.h - newY };
      } else if (d.handle === "ne") {
        const newY = Math.min(c.y + c.h - 0.05, Math.max(0, c.y + dyFrac));
        next.y = newY;
        next.h = c.y + c.h - newY;
        next.w = Math.min(1 - c.x, Math.max(0.05, c.w + dxFrac));
      } else if (d.handle === "sw") {
        const newX = Math.min(c.x + c.w - 0.05, Math.max(0, c.x + dxFrac));
        next.x = newX;
        next.w = c.x + c.w - newX;
        next.h = Math.min(1 - c.y, Math.max(0.05, c.h + dyFrac));
      }
      next = applyAspect(next);
    }
    setCrop(next);
  }

  function onUp() {
    dragRef.current = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  }

  async function process() {
    if (!file || !imgUrl) return;
    setBusy(true);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("load failed"));
        img.src = imgUrl;
      });

      const sx = crop.x * natural.w;
      const sy = crop.y * natural.h;
      const sw = crop.w * natural.w;
      const sh = crop.h * natural.h;

      const rotated90 = s.rotation === 90 || s.rotation === 270;
      const cropOutW = rotated90 ? sh : sw;
      const cropOutH = rotated90 ? sw : sh;
      const targetW = s.outWidth && s.outWidth > 0 ? Math.min(s.outWidth, cropOutW * 4) : cropOutW;
      const scale = targetW / cropOutW;
      const outW = Math.max(1, Math.round(cropOutW * scale));
      const outH = Math.max(1, Math.round(cropOutH * scale));

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no context");

      ctx.filter = filterCss(s.filters);
      ctx.save();
      ctx.translate(outW / 2, outH / 2);
      ctx.rotate((s.rotation * Math.PI) / 180);
      ctx.scale(s.flipH ? -1 : 1, s.flipV ? -1 : 1);
      const drawW = rotated90 ? outH : outW;
      const drawH = rotated90 ? outW : outH;
      ctx.drawImage(img, sx, sy, sw, sh, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, s.format, s.format === "image/png" ? undefined : s.quality)
      );
      if (!blob) throw new Error("encode failed");
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } finally {
      setBusy(false);
    }
  }

  const ext = s.format === "image/jpeg" ? "jpg" : s.format === "image/webp" ? "webp" : "png";
  const cssFilter = useMemo(() => filterCss(s.filters), [s.filters]);

  return (
    <ToolShell
      title="Image Editor"
      description="Crop, rotate, flip, adjust color, and export — a full editing pass in your browser, no upload, no watermark."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{file ? file.name : "Click to choose an image"}</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
      </label>

      {imgUrl && natural.w > 0 && (
        <>
          <div>
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Crop — drag the box or its corners</div>
            <div
              className="relative select-none overflow-hidden rounded-md border border-[var(--ground-line)] bg-[repeating-conic-gradient(#2a2e31_0%_25%,#1c1f21_0%_50%)] bg-[length:16px_16px]"
              style={{ width: PREVIEW_W, height: previewH }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={imgRef} src={imgUrl} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-contain" style={{ filter: cssFilter }} />
              <div
                onPointerDown={(e) => onHandleDown("move", e)}
                className="absolute cursor-move border-2 border-[var(--gold)]"
                style={{
                  left: crop.x * PREVIEW_W,
                  top: crop.y * previewH,
                  width: crop.w * PREVIEW_W,
                  height: crop.h * previewH,
                  boxShadow: "0 0 0 1000px rgba(0,0,0,0.5)",
                }}
              >
                {(["nw", "ne", "sw", "se"] as const).map((h) => (
                  <div
                    key={h}
                    onPointerDown={(e) => onHandleDown(h, e)}
                    className="absolute h-3 w-3 rounded-full border border-[#0a0c0d] bg-[var(--gold)]"
                    style={{
                      top: h.includes("n") ? -6 : undefined,
                      bottom: h.includes("s") ? -6 : undefined,
                      left: h.includes("w") ? -6 : undefined,
                      right: h.includes("e") ? -6 : undefined,
                      cursor: h === "nw" || h === "se" ? "nwse-resize" : "nesw-resize",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <Row>
            <Field label="Crop aspect">
              <Select value={s.aspect} onChange={(e) => setAspect(e.target.value as Settings["aspect"])}>
                <option value="free">Free</option>
                <option value="1:1">Square 1:1</option>
                <option value="4:3">4:3</option>
                <option value="3:2">3:2</option>
                <option value="16:9">16:9</option>
              </Select>
            </Field>
            <Field label="Output width (px)">
              <input
                type="number"
                min={1}
                value={s.outWidth ?? ""}
                onChange={(e) => update({ outWidth: Number(e.target.value) || null })}
                className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]"
              />
            </Field>
          </Row>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => update({ rotation: ((s.rotation + 270) % 360) as Settings["rotation"] })} className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs text-[var(--ink-dim)] hover:border-[var(--gold-dim)]"><RotateCcw size={13} /> Rotate left</button>
            <button onClick={() => update({ rotation: ((s.rotation + 90) % 360) as Settings["rotation"] })} className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs text-[var(--ink-dim)] hover:border-[var(--gold-dim)]"><RotateCw size={13} /> Rotate right</button>
            <button onClick={() => update({ flipH: !s.flipH })} className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs ${s.flipH ? "border-[var(--gold)] text-[var(--gold)]" : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}><FlipHorizontal size={13} /> Flip H</button>
            <button onClick={() => update({ flipV: !s.flipV })} className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs ${s.flipV ? "border-[var(--gold)] text-[var(--gold)]" : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}><FlipVertical size={13} /> Flip V</button>
            <button onClick={() => updateFilters(DEFAULT_FILTERS)} className="ml-auto text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">Reset filters</button>
          </div>

          <Row>
            <Field label="Brightness" hint={`${s.filters.brightness}%`}>
              <input type="range" min={0} max={200} value={s.filters.brightness} onChange={(e) => updateFilters({ brightness: Number(e.target.value) })} className="w-full" />
            </Field>
            <Field label="Contrast" hint={`${s.filters.contrast}%`}>
              <input type="range" min={0} max={200} value={s.filters.contrast} onChange={(e) => updateFilters({ contrast: Number(e.target.value) })} className="w-full" />
            </Field>
          </Row>
          <Row>
            <Field label="Saturation" hint={`${s.filters.saturate}%`}>
              <input type="range" min={0} max={200} value={s.filters.saturate} onChange={(e) => updateFilters({ saturate: Number(e.target.value) })} className="w-full" />
            </Field>
            <Field label="Blur" hint={`${s.filters.blur}px`}>
              <input type="range" min={0} max={10} step={0.5} value={s.filters.blur} onChange={(e) => updateFilters({ blur: Number(e.target.value) })} className="w-full" />
            </Field>
          </Row>
          <Row>
            <Field label="Grayscale" hint={`${s.filters.grayscale}%`}>
              <input type="range" min={0} max={100} value={s.filters.grayscale} onChange={(e) => updateFilters({ grayscale: Number(e.target.value) })} className="w-full" />
            </Field>
            <Field label="Sepia" hint={`${s.filters.sepia}%`}>
              <input type="range" min={0} max={100} value={s.filters.sepia} onChange={(e) => updateFilters({ sepia: Number(e.target.value) })} className="w-full" />
            </Field>
          </Row>

          <Row>
            <Field label="Export format">
              <Select value={s.format} onChange={(e) => update({ format: e.target.value as Settings["format"] })}>
                <option value="image/jpeg">JPEG</option>
                <option value="image/webp">WebP</option>
                <option value="image/png">PNG (lossless)</option>
              </Select>
            </Field>
            {s.format !== "image/png" && (
              <Field label="Quality" hint={`${Math.round(s.quality * 100)}%`}>
                <input type="range" min={0.1} max={1} step={0.05} value={s.quality} onChange={(e) => update({ quality: Number(e.target.value) })} className="w-full" />
              </Field>
            )}
          </Row>

          <Button onClick={process} disabled={busy}>{busy ? "Rendering…" : "Apply & Export"}</Button>

          {resultUrl && (
            <div>
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Result — {(resultSize / 1024).toFixed(1)} KB</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultUrl} alt="Result" className="max-h-72 w-full rounded-md border border-[var(--ground-line)] object-contain" />
              <a href={resultUrl} download={`edited.${ext}`} className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] hover:bg-[var(--gold-dim)]">
                <Download size={13} /> Download
              </a>
            </div>
          )}
        </>
      )}
    </ToolShell>
  );
}
