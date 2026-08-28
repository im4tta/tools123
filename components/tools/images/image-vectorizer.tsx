"use client";
import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { ToolShell, Field } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface Point {
  x: number;
  y: number;
}

interface GrayImage {
  w: number;
  h: number;
  gray: Uint8Array;
}

function loadGray(img: HTMLImageElement, maxDim: number): GrayImage | null {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  const gray = new Uint8Array(w * h);
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
  }
  return { w, h, gray };
}

/** Moore-neighbour boundary tracing: returns closed pixel contours of the foreground. */
function traceContours(bin: Uint8Array, w: number, h: number): Point[][] {
  // Clockwise order starting from north.
  const DX = [0, 1, 1, 1, 0, -1, -1, -1];
  const DY = [-1, -1, 0, 1, 1, 1, 0, -1];
  const visited = new Uint8Array(w * h);
  const contours: Point[][] = [];
  const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h;
  const isFg = (x: number, y: number) => inBounds(x, y) && bin[y * w + x] === 1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (bin[idx] !== 1 || visited[idx]) continue;
      const hasBgNeighbor =
        !isFg(x + 1, y) || !isFg(x - 1, y) || !isFg(x, y + 1) || !isFg(x, y - 1);
      if (!hasBgNeighbor) continue;

      // Find an adjacent background neighbour to anchor the walk.
      let cIdx = -1;
      for (let k = 0; k < 8; k++) {
        const nx = x + DX[k];
        const ny = y + DY[k];
        if (!isFg(nx, ny)) {
          cIdx = k;
          break;
        }
      }
      if (cIdx === -1) continue;

      const startC = cIdx;
      let bx = x;
      let by = y;
      const contour: Point[] = [];
      let ok = true;
      let guard = 0;
      for (;;) {
        let found = -1;
        for (let s = 1; s <= 8; s++) {
          const k = (cIdx + s) % 8;
          const nx = bx + DX[k];
          const ny = by + DY[k];
          if (isFg(nx, ny)) {
            found = k;
            break;
          }
        }
        if (found === -1) {
          ok = false;
          break;
        }
        cIdx = (found + 7) % 8;
        bx += DX[found];
        by += DY[found];
        contour.push({ x: bx, y: by });
        guard++;
        if (bx === x && by === y && cIdx === startC) break;
        if (guard > w * h * 2) {
          ok = false;
          break;
        }
      }
      if (!ok || contour.length < 3) continue;
      for (const p of contour) visited[p.y * w + p.x] = 1;
      contours.push(contour);
    }
  }
  return contours;
}

function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Ramer–Douglas–Peucker polyline simplification. */
function simplify(pts: Point[], eps: number): Point[] {
  if (pts.length < 3) return pts;
  const first = pts[0];
  const last = pts[pts.length - 1];
  let maxD = -1;
  let idx = -1;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = distToSegment(pts[i], first, last);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD > eps && idx > 0) {
    const left = simplify(pts.slice(0, idx + 1), eps);
    const right = simplify(pts.slice(idx), eps);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}

function buildSvg(contours: Point[][], w: number, h: number, eps: number): string {
  const paths: string[] = [];
  for (const c of contours) {
    const pts = simplify(c, eps);
    if (pts.length < 3) continue;
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
    paths.push(d);
  }
  if (paths.length === 0) return "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
    `<rect width="100%" height="100%" fill="#ffffff"/>` +
    `<path d="${paths.join(" ")}" fill="#000000" fill-rule="evenodd"/>` +
    `</svg>`
  );
}

export default function ImageVectorizer() {
  const { text: t } = useLanguage();
  const [url, setUrl] = useState<string | null>(null);
  const [threshold, setThreshold] = useToolState("image-vectorizer:threshold", "128");
  const [tolerance, setTolerance] = useToolState("image-vectorizer:tolerance", "1");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!url) return;
    const img = new Image();
    img.onload = () => {
      try {
        const data = loadGray(img, 320);
        if (!data) {
          setError(t("Could not read the image.", "មិនអាចអានរូបភាពបានទេ។"));
          return;
        }
        const th = Math.max(1, Math.min(254, Number(threshold) || 128));
        const bin = new Uint8Array(data.w * data.h);
        for (let i = 0; i < bin.length; i++) bin[i] = data.gray[i] < th ? 1 : 0;
        const contours = traceContours(bin, data.w, data.h);
        const eps = Math.max(0, Number(tolerance) || 0);
        const result = buildSvg(contours, data.w, data.h, eps);
        setSvg(result);
        setError("");
        if (!result) {
          setError(t("No shapes found. Try a lower threshold.", "រកមិនឃើញរាងទេ។ សូមបន្ថយកម្រិត Threshold។"));
        }
      } catch {
        setError(t("Could not trace the image.", "មិនអាចគូសរូបភាពបានទេ។"));
      }
    };
    img.onerror = () => setError(t("Could not load the image.", "មិនអាចផ្ទុករូបភាពបានទេ។"));
    img.src = url;
  }, [url, threshold, tolerance, t]);

  function pick(file: File) {
    setError("");
    setSvg("");
    const reader = new FileReader();
    reader.onload = () => setUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function download() {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vector-trace.svg";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  const previewSrc = svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : "";

  return (
    <ToolShell
      title="Image → SVG Vectorizer"
      khmerTitle="បម្លែងរូបទៅជា SVG"
      description="Convert a photo or drawing into a simplified black-and-white SVG outline (grayscale → threshold → contour tracing)."
      descriptionKm="បម្លែងរូបថត ឬគំនូរទៅជាគ្រោង SVG ស និងខ្មៅសាមញ្ញ (ប្រផេះ → Threshold → តាមគ្រោង)។"
    >
      <div className="space-y-4">
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
          className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[var(--ground-line)] p-8 text-center transition hover:border-[var(--gold)]/40"
        >
          <span className="text-sm font-semibold text-[var(--ink)]">
            {url ? t("Change image", "ប្តូររូបភាព") : t("Upload an image", "ផ្ទុករូបភាពឡើង")}
          </span>
          <span className="text-xs text-[var(--ink-dim)]">{t("PNG, JPG or WebP", "PNG, JPG ឬ WebP")}</span>
        </button>

        {url && (
          <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-3 text-xs leading-relaxed text-[var(--ink)]">
            {t(
              "Simplified trace — not production vectorization. Good for logos, signatures and sketches; use a dedicated tracer for professional results.",
              "គ្រោងសាមញ្ញ — មិនមែនជាការបំលែង Vector កម្រិតផលិតកម្មទេ។ ស័ក្តិសមសម្រាប់ស្លាកសញ្ញា ហត្ថលេខា និងគំនូស។"
            )}
          </div>
        )}

        {url && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("Threshold", "កម្រិត Threshold")} hint={t("lower = more shapes", "ទាប = រាងកាន់តែច្រើន")}>
              <input
                type="range"
                min={1}
                max={254}
                value={Number(threshold) || 128}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full accent-[var(--gold)]"
              />
              <span className="font-mono-ui text-xs text-[var(--ink-dim)]">{threshold}</span>
            </Field>
            <Field label={t("Simplify tolerance", "កម្រិតសម្រួល")} hint={t("higher = smoother", "ខ្ពស់ = រលោង")}>
              <input
                type="range"
                min={0}
                max={10}
                step={0.1}
                value={Number(tolerance) || 0}
                onChange={(e) => setTolerance(e.target.value)}
                className="w-full accent-[var(--gold)]"
              />
              <span className="font-mono-ui text-xs text-[var(--ink-dim)]">{tolerance}</span>
            </Field>
          </div>
        )}

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        {url && (
          <>
            {previewSrc && (
              <div className="rounded-lg border border-[var(--ground-line)] bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewSrc} alt={t("SVG preview", "មើល SVG ជាមុន")} className="mx-auto max-h-80" />
              </div>
            )}
            {svg && (
              <div className="space-y-3">
                <Output value={svg} label={t("SVG output", "លទ្ធផល SVG")} />
                <Button type="button" onClick={download} className="w-full">
                  <Download size={15} className="mr-1.5 inline" />
                  {t("Download SVG", "ទាញយក SVG")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </ToolShell>
  );
}
