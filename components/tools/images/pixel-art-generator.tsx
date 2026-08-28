"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Eraser, Upload } from "lucide-react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface Art {
  n: number;
  px: Uint8Array; // n * n * 3 RGB
}

const SIZES = ["16", "32", "64"];
const QUANT_OPTIONS = [
  ["off", "Off"],
  ["8", "8 colors"],
  ["16", "16 colors"],
  ["32", "32 colors"],
];

const PALETTE: [number, number, number][] = [
  [0, 0, 0], [255, 255, 255], [255, 0, 0], [0, 255, 0], [0, 0, 255],
  [255, 255, 0], [255, 0, 255], [0, 255, 255], [128, 128, 128], [192, 192, 192],
  [128, 0, 0], [0, 128, 0], [0, 0, 128], [128, 128, 0], [128, 0, 128], [0, 128, 128],
];

function blankArt(n: number): Art {
  return { n, px: new Uint8Array(n * n * 3).fill(255) };
}

/** Median-cut colour quantization: recursively split the widest colour box until k boxes. */
function medianCut(colors: [number, number, number][], maxColors: number): [number, number, number][] {
  const rangeOf = (box: [number, number, number][]) => {
    let r = 0;
    let g = 0;
    let b = 0;
    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
    for (const c of box) {
      if (c[0] < minR) minR = c[0];
      if (c[0] > maxR) maxR = c[0];
      if (c[1] < minG) minG = c[1];
      if (c[1] > maxG) maxG = c[1];
      if (c[2] < minB) minB = c[2];
      if (c[2] > maxB) maxB = c[2];
    }
    r = maxR - minR;
    g = maxG - minG;
    b = maxB - minB;
    return { range: r + g + b, ch: r >= g && r >= b ? 0 : g >= b ? 1 : 2 };
  };
  const boxes: [number, number, number][][] = [colors];
  while (boxes.length < maxColors) {
    let bi = -1;
    let best = -1;
    for (let i = 0; i < boxes.length; i++) {
      const { range } = rangeOf(boxes[i]);
      if (range > best) {
        best = range;
        bi = i;
      }
    }
    if (bi < 0 || boxes[bi].length < 2) break;
    const { ch } = rangeOf(boxes[bi]);
    const sorted = [...boxes[bi]].sort((a, b) => a[ch] - b[ch]);
    const mid = sorted.length >> 1;
    boxes[bi] = sorted.slice(0, mid);
    boxes.push(sorted.slice(mid));
  }
  return boxes.map((box) => {
    let r = 0, g = 0, b = 0;
    for (const c of box) {
      r += c[0];
      g += c[1];
      b += c[2];
    }
    const n = Math.max(1, box.length);
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)] as [number, number, number];
  });
}

function nearest(px: Uint8Array, i: number, pal: [number, number, number][]): [number, number, number] {
  const r = px[i * 3];
  const g = px[i * 3 + 1];
  const b = px[i * 3 + 2];
  let best = pal[0];
  let bestD = Infinity;
  for (const c of pal) {
    const dr = r - c[0];
    const dg = g - c[1];
    const db = b - c[2];
    const d = dr * dr + dg * dg + db * db;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function artToCanvas(art: Art, zoom: number): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = art.n * zoom;
  canvas.height = art.n * zoom;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  const tmp = document.createElement("canvas");
  tmp.width = art.n;
  tmp.height = art.n;
  const tctx = tmp.getContext("2d");
  if (!tctx) return null;
  const imgData = tctx.createImageData(art.n, art.n);
  for (let i = 0; i < art.n * art.n; i++) {
    imgData.data[i * 4] = art.px[i * 3];
    imgData.data[i * 4 + 1] = art.px[i * 3 + 1];
    imgData.data[i * 4 + 2] = art.px[i * 3 + 2];
    imgData.data[i * 4 + 3] = 255;
  }
  tctx.putImageData(imgData, 0, 0);
  ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export default function PixelArtGenerator() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState("pixel-art:mode", "image");
  const [size, setSize] = useToolState("pixel-art:size", "32");
  const [quant, setQuant] = useToolState("pixel-art:quant", "16");
  const [colorIndex, setColorIndex] = useState(1);
  const [art, setArt] = useState<Art | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const previewRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const paintingRef = useRef(false);

  // Initialise a blank grid when entering draw mode.
  useEffect(() => {
    if (mode === "draw" && (!art || art.n !== Number(size))) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setArt(blankArt(Number(size) || 32));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, size]);

  // Convert the uploaded image into a pixel grid.
  useEffect(() => {
    if (mode !== "image" || !url) return;
    const img = new Image();
    img.onload = () => {
      try {
        const n = Number(size) || 32;
        const canvas = document.createElement("canvas");
        canvas.width = n;
        canvas.height = n;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, 0, 0, n, n);
        const { data } = ctx.getImageData(0, 0, n, n);
        const px = new Uint8Array(n * n * 3);
        for (let i = 0; i < n * n; i++) {
          px[i * 3] = data[i * 4];
          px[i * 3 + 1] = data[i * 4 + 1];
          px[i * 3 + 2] = data[i * 4 + 2];
        }
        let finalPx = px;
        if (quant !== "off") {
          const k = Math.max(2, Number(quant) || 16);
          const colors: [number, number, number][] = [];
          for (let i = 0; i < n * n; i++) colors.push([px[i * 3], px[i * 3 + 1], px[i * 3 + 2]]);
          const pal = medianCut(colors, k);
          finalPx = new Uint8Array(n * n * 3);
          for (let i = 0; i < n * n; i++) {
            const c = nearest(px, i, pal);
            finalPx[i * 3] = c[0];
            finalPx[i * 3 + 1] = c[1];
            finalPx[i * 3 + 2] = c[2];
          }
        }
        setArt({ n, px: finalPx });
        setError("");
      } catch {
        setError(t("Could not process the image.", "មិនអាចដំណើរការរូបភាពបានទេ។"));
      }
    };
    img.onerror = () => setError(t("Could not load the image.", "មិនអាចផ្ទុករូបភាពបានទេ។"));
    img.src = url;
  }, [mode, url, size, quant, t]);

  // Draw the crisp pixelated preview.
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas || !art) return;
    const zoom = Math.max(2, Math.round(256 / art.n));
    canvas.width = art.n * zoom;
    canvas.height = art.n * zoom;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const tmp = document.createElement("canvas");
    tmp.width = art.n;
    tmp.height = art.n;
    const tctx = tmp.getContext("2d");
    if (!tctx) return;
    const imgData = tctx.createImageData(art.n, art.n);
    for (let i = 0; i < art.n * art.n; i++) {
      imgData.data[i * 4] = art.px[i * 3];
      imgData.data[i * 4 + 1] = art.px[i * 3 + 1];
      imgData.data[i * 4 + 2] = art.px[i * 3 + 2];
      imgData.data[i * 4 + 3] = 255;
    }
    tctx.putImageData(imgData, 0, 0);
    ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
  }, [art]);

  function pick(file: File) {
    setError("");
    const reader = new FileReader();
    reader.onload = () => setUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function paintAt(e: React.PointerEvent<HTMLCanvasElement>) {
    if (mode !== "draw" || !art) return;
    const canvas = previewRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * art.n);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * art.n);
    if (x < 0 || y < 0 || x >= art.n || y >= art.n) return;
    const c = PALETTE[colorIndex] ?? PALETTE[1];
    setArt((prev) => {
      if (!prev) return prev;
      const px = new Uint8Array(prev.px);
      const i = (y * prev.n + x) * 3;
      px[i] = c[0];
      px[i + 1] = c[1];
      px[i + 2] = c[2];
      return { n: prev.n, px };
    });
  }

  function clearGrid() {
    if (!art) return;
    setArt(blankArt(art.n));
  }

  function exportPng() {
    if (!art) return;
    const canvas = artToCanvas(art, 8);
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "pixel-art.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, "image/png");
  }

  return (
    <ToolShell
      title="Pixel Art Generator"
      khmerTitle="បង្កើតសិល្បៈ Pixel"
      description="Turn a photo into a pixel-art grid (16/32/64) with optional colour quantization, or draw your own on a blank grid."
      descriptionKm="បម្លែងរូបថតទៅជាក្រឡាចត្រង្គសិល្បៈ Pixel (១៦/៣២/៦៤) ជាមួយការកាត់បន្ថយពណ៌ ឬគូរដោយខ្លួនឯងលើក្រឡាទទេ។"
    >
      <div className="space-y-4">
        <Row>
          <Field label={t("Mode", "របៀប")}>
            <Select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="image">{t("From image", "ពីរូបភាព")}</option>
              <option value="draw">{t("Blank grid (draw)", "ក្រឡាទទេ (គូរ)")}</option>
            </Select>
          </Field>
          <Field label={t("Grid size", "ទំហំក្រឡាចត្រង្គ")}>
            <Select value={size} onChange={(e) => setSize(e.target.value)}>
              {SIZES.map((s) => (
                <option key={s} value={s}>{s} × {s}</option>
              ))}
            </Select>
          </Field>
          {mode === "image" && (
            <Field label={t("Color quantization", "កាត់បន្ថយពណ៌")}>
              <Select value={quant} onChange={(e) => setQuant(e.target.value)}>
                {QUANT_OPTIONS.map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </Select>
            </Field>
          )}
        </Row>

        {mode === "image" && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) pick(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--ground-line)] p-6 text-center transition hover:border-[var(--gold)]/40"
            >
              <Upload size={24} className="text-[var(--ink-dim)]" />
              <span className="text-sm font-semibold text-[var(--ink)]">{t("Upload an image", "ផ្ទុករូបភាពឡើង")}</span>
            </button>
          </>
        )}

        {mode === "draw" && (
          <div>
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Palette", "ក្ដារពណ៌")}</div>
            <div className="flex flex-wrap gap-1.5">
              {PALETTE.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setColorIndex(i)}
                  aria-label={`${t("Color", "ពណ៌")} ${i + 1}`}
                  className={`h-8 w-8 rounded-md border-2 transition ${
                    colorIndex === i ? "border-[var(--gold)]" : "border-[var(--ground-line)]"
                  }`}
                  style={{ background: `rgb(${c[0]}, ${c[1]}, ${c[2]})` }}
                />
              ))}
              <button
                type="button"
                onClick={clearGrid}
                className="flex items-center gap-1 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 text-xs text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
              >
                <Eraser size={13} />
                {t("Clear", "សម្អាត")}
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        {art && (
          <div className="space-y-3">
            <canvas
              ref={previewRef}
              onPointerDown={(e) => {
                paintingRef.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                paintAt(e);
              }}
              onPointerMove={(e) => {
                if (paintingRef.current) paintAt(e);
              }}
              onPointerUp={() => (paintingRef.current = false)}
              onPointerLeave={() => (paintingRef.current = false)}
              className={`mx-auto w-full max-w-md rounded-lg border border-[var(--ground-line)] ${mode === "draw" ? "cursor-crosshair" : ""}`}
              style={{ imageRendering: "pixelated" }}
            />
            <p className="text-center text-xs text-[var(--ink-dim)]">
              {mode === "draw"
                ? t("Click or drag on the grid to paint", "ចុច ឬអូសលើក្រឡាដើម្បីគូរ")
                : t("Preview is upscaled — export is 8× the grid", "ការមើលមុនត្រូវបានពង្រីក — ការនាំចេញជា ៨ ដងនៃក្រឡាចត្រង្គ")}
            </p>
            <Button type="button" onClick={exportPng} className="w-full">
              <Download size={15} className="mr-1.5 inline" />
              {t("Export PNG", "នាំចេញ PNG")}
            </Button>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
