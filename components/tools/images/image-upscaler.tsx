"use client";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

interface Settings {
  factor: 2 | 3 | 4;
  sharpen: number; // 0..1
  format: "image/png" | "image/jpeg";
}

function drawScaled(src: HTMLCanvasElement | HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, w, h);
  return canvas;
}

// Progressive 2x steps read much better than one large jump — each pass gives
// the browser's bicubic-ish resampler a smaller, easier scale factor to work with.
function progressiveUpscale(img: HTMLImageElement, targetW: number, targetH: number): HTMLCanvasElement {
  let current: HTMLCanvasElement | HTMLImageElement = img;
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  while (w * 1.9 < targetW) {
    w = Math.round(w * 2);
    h = Math.round(h * 2);
    current = drawScaled(current, w, h);
  }
  return drawScaled(current, targetW, targetH);
}

function unsharpMask(canvas: HTMLCanvasElement, amount: number) {
  if (amount <= 0) return;
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const src = ctx.getImageData(0, 0, width, height);
  // 3x3 box-blur pass for the "unsharp" base, then push original away from it.
  const blurred = new Uint8ClampedArray(src.data);
  const w = width;
  const d = src.data;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            sum += d[((y + dy) * w + (x + dx)) * 4 + c];
          }
        }
        blurred[(y * w + x) * 4 + c] = sum / 9;
      }
    }
  }
  const out = ctx.createImageData(width, height);
  for (let i = 0; i < d.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const orig = d[i + c];
      const blur = blurred[i + c];
      out.data[i + c] = Math.max(0, Math.min(255, orig + (orig - blur) * amount));
    }
    out.data[i + 3] = d[i + 3];
  }
  ctx.putImageData(out, 0, 0);
}

const initial: Settings = { factor: 2, sharpen: 0.35, format: "image/png" };

export default function ImageUpscalerTool() {
  const [s, setS] = useToolState<Settings>("image-upscaler", initial);
  const update = (patch: Partial<Settings>) => setS((prev) => ({ ...prev, ...patch }));
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [originalDims, setOriginalDims] = useState({ w: 0, h: 0 });
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => { if (originalUrl) URL.revokeObjectURL(originalUrl); }, [originalUrl]);
  useEffect(() => () => { if (resultUrl) URL.revokeObjectURL(resultUrl); }, [resultUrl]);

  function pickFile(f: File) {
    setFile(f);
    const url = URL.createObjectURL(f);
    setOriginalUrl(url);
    setResultUrl(null);
    const img = new Image();
    img.onload = () => setOriginalDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  }

  async function process() {
    if (!file || !originalUrl) return;
    setBusy(true);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("load failed"));
        img.src = originalUrl;
      });
      const targetW = Math.round(img.naturalWidth * s.factor);
      const targetH = Math.round(img.naturalHeight * s.factor);
      const canvas = progressiveUpscale(img, targetW, targetH);
      unsharpMask(canvas, s.sharpen);

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, s.format, s.format === "image/jpeg" ? 0.95 : undefined)
      );
      if (!blob) throw new Error("encode failed");
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } finally {
      setBusy(false);
    }
  }

  const ext = s.format === "image/jpeg" ? "jpg" : "png";

  return (
    <ToolShell
      title="Image Upscaler"
      description="Scale an image up 2×, 3×, or 4× using progressive high-quality resampling with edge-sharpening — all done locally. This uses advanced interpolation, not a neural super-resolution model, so it works best on photos that aren't already heavily compressed or blurry."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{file ? file.name : "Click to choose an image"}</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
      </label>

      {originalDims.w > 0 && (
        <p className="text-xs text-[var(--ink-faint)]">
          Original: {originalDims.w}×{originalDims.h}px → Result: {originalDims.w * s.factor}×{originalDims.h * s.factor}px
        </p>
      )}

      <Row>
        <Field label="Scale factor">
          <Select value={s.factor} onChange={(e) => update({ factor: Number(e.target.value) as Settings["factor"] })}>
            <option value={2}>2×</option>
            <option value={3}>3×</option>
            <option value={4}>4×</option>
          </Select>
        </Field>
        <Field label="Format">
          <Select value={s.format} onChange={(e) => update({ format: e.target.value as Settings["format"] })}>
            <option value="image/png">PNG (lossless)</option>
            <option value="image/jpeg">JPEG</option>
          </Select>
        </Field>
      </Row>

      <Field label="Sharpening" hint={`${Math.round(s.sharpen * 100)}%`}>
        <input type="range" min={0} max={1} step={0.05} value={s.sharpen} onChange={(e) => update({ sharpen: Number(e.target.value) })} className="w-full" />
      </Field>

      <Button onClick={process} disabled={!file || busy}>{busy ? "Upscaling…" : "Upscale"}</Button>

      {originalUrl && resultUrl ? (
        <div className="space-y-3">
          <BeforeAfterSlider before={originalUrl} after={resultUrl} beforeAlt="Original image" afterAlt="Upscaled image" />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-dim)]">
            <span>Result — {(resultSize / 1024 / 1024).toFixed(2)} MB</span>
            <a href={resultUrl} download={`upscaled.${ext}`} className="inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 font-medium text-[#0a0c0d] hover:bg-[var(--gold-dim)]">
              <Download size={13} /> Download
            </a>
          </div>
        </div>
      ) : originalUrl ? (
        <div>
          <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Original</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={originalUrl} alt="Original" className="max-h-64 w-full rounded-md border border-[var(--ground-line)] object-contain" />
        </div>
      ) : null}
    </ToolShell>
  );
}
