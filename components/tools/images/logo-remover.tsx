"use client";
import { useRef, useState, useCallback, MouseEvent as ReactMouseEvent } from "react";
import { Download, RotateCcw } from "lucide-react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";

type Corner = "bottom-left" | "bottom-right" | "top-left" | "top-right" | "custom";

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const CORNER_PRESETS: Record<Exclude<Corner, "custom">, string> = {
  "bottom-left": "Bottom left",
  "bottom-right": "Bottom right",
  "top-left": "Top left",
  "top-right": "Top right",
};

/**
 * Fills the rectangle `box` on `ctx` using a patch-sampled + diffusion
 * inpaint: it seeds the hole with mirrored/tiled pixels sampled from
 * just outside the box, then relaxes the interior with a few Gauss-Seidel
 * smoothing passes so the seam blends into surrounding texture/gradient.
 * Works well for small watermark/logo marks sitting on relatively
 * continuous backgrounds (photos, UI chrome, gradients, sky, etc).
 */
function inpaintRegion(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number, box: Box) {
  const bx = Math.max(0, Math.floor(box.x));
  const by = Math.max(0, Math.floor(box.y));
  const bw = Math.min(canvasW - bx, Math.ceil(box.w));
  const bh = Math.min(canvasH - by, Math.ceil(box.h));
  if (bw <= 0 || bh <= 0) return;

  // Sample a margin around the box so we have real texture to diffuse inward from.
  const margin = Math.max(8, Math.round(Math.max(bw, bh) * 0.35));
  const sx = Math.max(0, bx - margin);
  const sy = Math.max(0, by - margin);
  const sw = Math.min(canvasW - sx, bw + margin * 2);
  const sh = Math.min(canvasH - sy, bh + margin * 2);

  const region = ctx.getImageData(sx, sy, sw, sh);
  const data = region.data;
  const localBx = bx - sx;
  const localBy = by - sy;

  const idx = (x: number, y: number) => (y * sw + x) * 4;
  const isHole = (x: number, y: number) =>
    x >= localBx && x < localBx + bw && y >= localBy && y < localBy + bh;

  // 1) Seed: mirror the nearest non-hole pixel horizontally/vertically into the hole.
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      if (!isHole(x, y)) continue;
      let srcX = x;
      let srcY = y;
      if (x < localBx + bw / 2) srcX = Math.max(0, localBx - (x - localBx) - 1);
      else srcX = Math.min(sw - 1, localBx + bw + (localBx + bw - x) - 1);
      if (y < localBy + bh / 2) srcY = Math.max(0, localBy - (y - localBy) - 1);
      else srcY = Math.min(sh - 1, localBy + bh + (localBy + bh - y) - 1);
      // Clamp source outside hole; fall back to edge pixel if it still lands inside.
      if (isHole(srcX, srcY)) { srcX = x < localBx + bw / 2 ? 0 : sw - 1; }
      const s = idx(srcX, srcY);
      const d = idx(x, y);
      data[d] = data[s];
      data[d + 1] = data[s + 1];
      data[d + 2] = data[s + 2];
      data[d + 3] = data[s + 3];
    }
  }

  // 2) Relax: iterative averaging (Gauss-Seidel diffusion) pulls the seeded
  // pixels toward a smooth blend of their neighbors, erasing the seam.
  const iterations = 60;
  for (let it = 0; it < iterations; it++) {
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        if (!isHole(x, y)) continue;
        let rs = 0, gs = 0, bs = 0, as = 0, n = 0;
        const neighbors = [
          [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
        ];
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || ny < 0 || nx >= sw || ny >= sh) continue;
          const p = idx(nx, ny);
          rs += data[p]; gs += data[p + 1]; bs += data[p + 2]; as += data[p + 3];
          n++;
        }
        if (n === 0) continue;
        const d = idx(x, y);
        data[d] = rs / n;
        data[d + 1] = gs / n;
        data[d + 2] = bs / n;
        data[d + 3] = as / n;
      }
    }
  }

  ctx.putImageData(region, sx, sy);
}

export default function LogoRemoverTool() {
  const [file, setFile] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [corner, setCorner] = useState<Corner>("bottom-right");
  const [boxSizePct, setBoxSizePct] = useState(18);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayRef = useRef<HTMLImageElement | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  function pickFile(f: File) {
    setFile(f);
    const url = URL.createObjectURL(f);
    setImgUrl(url);
    setResultUrl(null);
    setHistory([]);
    setBox(null);
    const img = new Image();
    img.onload = () => setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  }

  function applyPreset(c: Corner) {
    setCorner(c);
    if (!imgDims || c === "custom") return;
    const w = Math.round((imgDims.w * boxSizePct) / 100);
    const h = Math.round(w * 0.45);
    const pad = Math.round(imgDims.w * 0.02);
    let x = pad, y = pad;
    if (c === "bottom-right") { x = imgDims.w - w - pad; y = imgDims.h - h - pad; }
    if (c === "bottom-left") { x = pad; y = imgDims.h - h - pad; }
    if (c === "top-right") { x = imgDims.w - w - pad; y = pad; }
    if (c === "top-left") { x = pad; y = pad; }
    setBox({ x, y, w, h });
  }

  const naturalFromDisplay = useCallback((clientX: number, clientY: number) => {
    const el = displayRef.current;
    if (!el || !imgDims) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const scaleX = imgDims.w / rect.width;
    const scaleY = imgDims.h / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, [imgDims]);

  function onMouseDown(e: ReactMouseEvent) {
    if (!imgDims) return;
    const p = naturalFromDisplay(e.clientX, e.clientY);
    dragStart.current = p;
    setCorner("custom");
    setBox({ x: p.x, y: p.y, w: 0, h: 0 });
  }
  function onMouseMove(e: ReactMouseEvent) {
    if (!dragStart.current || !imgDims) return;
    const p = naturalFromDisplay(e.clientX, e.clientY);
    const x0 = Math.min(dragStart.current.x, p.x);
    const y0 = Math.min(dragStart.current.y, p.y);
    const w = Math.abs(p.x - dragStart.current.x);
    const h = Math.abs(p.y - dragStart.current.y);
    setBox({ x: x0, y: y0, w, h });
  }
  function onMouseUp() {
    dragStart.current = null;
  }

  async function removeLogo() {
    if (!file || !imgDims || !box || box.w < 2 || box.h < 2) return;
    setBusy(true);
    try {
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvasRef.current = canvas;
      canvas.width = imgDims.w;
      canvas.height = imgDims.h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no context");

      // Draw current state: previous result if we have one, else the original.
      const baseUrl = resultUrl ?? imgUrl!;
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("load failed"));
        img.src = baseUrl;
      });
      ctx.drawImage(img, 0, 0, imgDims.w, imgDims.h);

      inpaintRegion(ctx, imgDims.w, imgDims.h, box);

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (blob) {
        if (resultUrl) setHistory((h) => [...h, resultUrl]);
        setResultUrl(URL.createObjectURL(blob));
      }
    } finally {
      setBusy(false);
    }
  }

  function undo() {
    setHistory((h) => {
      if (h.length === 0) {
        setResultUrl(null);
        return h;
      }
      const next = [...h];
      const last = next.pop()!;
      setResultUrl(last);
      return next;
    });
  }

  const previewSrc = resultUrl ?? imgUrl;

  return (
    <ToolShell
      title="Logo / Watermark Remover"
      description="Draw a box over a small logo or watermark — like the corner mark some AI image generators stamp onto exports — and blend it away with an in-browser content-aware fill. Nothing leaves your device. Works best on small marks over relatively plain or gradient backgrounds; busy/detailed backgrounds behind the mark won't be reconstructed perfectly."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{file ? file.name : "Click to choose an image"}</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
      </label>

      {imgDims && (
        <>
          <Row>
            <Field label="Snap to corner" hint="or drag on the image below">
              <Select value={corner} onChange={(e) => applyPreset(e.target.value as Corner)}>
                {Object.entries(CORNER_PRESETS).map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
                <option value="custom">Custom (drag)</option>
              </Select>
            </Field>
            <Field label="Mark size" hint={`${boxSizePct}% of width`}>
              <input
                type="range"
                min={6}
                max={40}
                value={boxSizePct}
                onChange={(e) => { const v = Number(e.target.value); setBoxSizePct(v); if (corner !== "custom") setTimeout(() => applyPreset(corner), 0); }}
                className="w-full"
              />
            </Field>
          </Row>

          <div className="relative select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={displayRef}
              src={previewSrc ?? undefined}
              alt="Editable preview"
              className="w-full cursor-crosshair rounded-md border border-[var(--ground-line)] object-contain"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              draggable={false}
            />
            {box && imgDims && (
              <div
                className="pointer-events-none absolute border-2 border-[var(--gold)] bg-[var(--gold)]/20"
                style={{
                  left: `${(box.x / imgDims.w) * 100}%`,
                  top: `${(box.y / imgDims.h) * 100}%`,
                  width: `${(box.w / imgDims.w) * 100}%`,
                  height: `${(box.h / imgDims.h) * 100}%`,
                }}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={removeLogo} disabled={!box || box.w < 2 || busy}>
              {busy ? "Filling…" : "Remove mark"}
            </Button>
            <Button
              onClick={undo}
              disabled={history.length === 0 && !resultUrl}
              className="!bg-[var(--ground-raised)] !text-[var(--ink)] border border-[var(--ground-line)] hover:!bg-[var(--ground-line)]"
            >
              <span className="inline-flex items-center gap-1.5"><RotateCcw size={13} /> Undo</span>
            </Button>
          </div>

          {resultUrl && (
            <a
              href={resultUrl}
              download="logo-removed.png"
              className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] hover:bg-[var(--gold-dim)]"
            >
              <Download size={13} /> Download PNG
            </a>
          )}
        </>
      )}
    </ToolShell>
  );
}
