"use client";
import { useRef, useState } from "react";
import { Loader2, ScanSearch, Shapes } from "lucide-react";
import { ToolShell, Field, Select, TextInput } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// Two counting methods:
//  1. "ai" — YOLOS-tiny object detection (COCO 80 classes: people, vehicles,
//     animals, furniture, food…). Pill/tablet is NOT a COCO class.
//  2. "blob" — blob/shape counting via connected-component labeling. Works for
//     uniform objects on a contrasting background (pills, coins, seeds, beads…).
type Method = "ai" | "blob";

type Detection = { box: { xmin: number; ymin: number; xmax: number; ymax: number }; label: string; score: number };
type Blob = { x: number; y: number; w: number; h: number; area: number };
type BlobResult = { count: number; blobs: Blob[] };

const LABEL_KM: Record<string, string> = {
  person: "មនុស្ស", bicycle: "កង់", car: "រថយន្ត", motorcycle: "ម៉ូតូ", bus: "ឡានក្រុង",
  truck: "ឡានដឹកទំនិញ", animal: "សត្វ", bird: "បក្សី", cat: "ឆ្មា", dog: "ឆ្កែ",
  horse: "សេះ", cow: "គោ", elephant: "ដំរី", bottle: "ដប", cup: "ពែង", bowl: "ចាន",
  banana: "ចេក", apple: "ផ្លែប៉ោម", orange: "ក្រូច", broccoli: "ផ្កាខាត់ណា", carrot: "ការ៉ុត",
  cake: "នំ", donut: "នំដូណាត", pizza: "ភីហ្សា", chair: "កៅអី", couch: "សាឡុង",
  "potted plant": "រុក្ខជាតិ", bed: "គ្រែ", tv: "ទូរទស្សន៍", laptop: "កុំព្យូទ័រ",
  phone: "ទូរស័ព្ទ", book: "សៀវភៅ", clock: "នាឡិកា", flower: "ផ្កា", tree: "ដើមឈើ",
};

// Connected-component labelling with a 4-neighbour flood fill on a binary mask.
function countBlobs(mask: Uint8Array, width: number, height: number, minArea: number, maxArea: number): BlobResult {
  const visited = new Uint8Array(width * height);
  const blobs: Blob[] = [];
  const stack: number[] = [];
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || visited[i]) continue;
    // Flood fill.
    let area = 0, minX = width, minY = height, maxX = 0, maxY = 0;
    stack.push(i);
    visited[i] = 1;
    while (stack.length) {
      const idx = stack.pop()!;
      area++;
      const x = idx % width, y = (idx / width) | 0;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      // 4-neighbours.
      const neighbors = [idx - 1, idx + 1, idx - width, idx + width];
      for (const n of neighbors) {
        if (n < 0 || n >= mask.length || visited[n] || !mask[n]) continue;
        const nx = n % width, ny = (n / width) | 0;
        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
        visited[n] = 1;
        stack.push(n);
      }
    }
    if (area >= minArea && area <= maxArea) {
      blobs.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, area });
    }
  }
  return { count: blobs.length, blobs };
}

function drawBlobs(canvas: HTMLCanvasElement, im: HTMLImageElement, blobs: Blob[]) {
  canvas.width = im.naturalWidth;
  canvas.height = im.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(im, 0, 0);
  ctx.font = `${Math.max(14, im.naturalWidth * 0.016)}px sans-serif`;
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = Math.max(2, im.naturalWidth * 0.002);
  let n = 0;
  for (const b of blobs) {
    n++;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    const label = String(n);
    ctx.fillStyle = "rgba(37,99,235,0.9)";
    const tx = b.x, ty = b.y - 4;
    ctx.fillRect(tx - 2, ty - Math.max(16, im.naturalWidth * 0.014), ctx.measureText(label).width + 6, Math.max(16, im.naturalWidth * 0.014));
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, tx + 1, ty - 2);
  }
}

export default function ObjectCounterTool() {
  const { text: t } = useLanguage();
  const [method, setMethod] = useToolState<Method>("object-counter:method", "ai");
  const [threshold, setThreshold] = useToolState("object-counter:threshold", "128");
  const [invert, setInvert] = useToolState<"0" | "1">("object-counter:invert", "0");
  const [minArea, setMinArea] = useToolState("object-counter:minArea", "20");

  const [img, setImg] = useState<{ url: string; file: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [detections, setDetections] = useState<Detection[] | null>(null);
  const [blobs, setBlobs] = useState<BlobResult | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  function onFile(f: File | null) {
    if (!f) return;
    if (img) URL.revokeObjectURL(img.url);
    setImg({ url: URL.createObjectURL(f), file: f.name });
    setDetections(null);
    setBlobs(null);
    setError("");
  }

  async function runAi() {
    if (!img) return;
    setBusy(true);
    setError("");
    setDetections(null);
    setModelLoading(true);
    try {
      const { pipeline, env } = await import("@huggingface/transformers");
      env.allowLocalModels = false;
      const detector = await pipeline("object-detection", "Xenova/yolos-tiny");
      setModelLoading(false);
      const result = (await detector(img.url)) as Detection[];
      setDetections(result);
      const canvas = canvasRef.current;
      const im = imgRef.current;
      if (canvas && im) {
        canvas.width = im.naturalWidth;
        canvas.height = im.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas");
        ctx.drawImage(im, 0, 0);
        ctx.font = `${Math.max(14, im.naturalWidth * 0.012)}px sans-serif`;
        for (const d of result) {
          const { xmin, ymin, xmax, ymax } = d.box;
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = Math.max(2, im.naturalWidth * 0.002);
          ctx.strokeRect(xmin, ymin, xmax - xmin, ymax - ymin);
          ctx.fillStyle = "rgba(34,197,94,0.85)";
          ctx.fillRect(xmin, ymin - Math.max(16, im.naturalWidth * 0.014), Math.max(60, (d.label + d.score.toFixed(2)).length * im.naturalWidth * 0.007), Math.max(16, im.naturalWidth * 0.014));
          ctx.fillStyle = "#06231a";
          ctx.fillText(`${d.label} ${d.score.toFixed(2)}`, xmin + 4, ymin - 2);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Detection failed.");
    } finally {
      setBusy(false);
    }
  }

  function runBlob() {
    if (!img) return;
    setBusy(true);
    setError("");
    setDetections(null);
    try {
      const im = imgRef.current!;
      const w = im.naturalWidth, h = im.naturalHeight;
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(im, 0, 0);
      const data = ctx.getImageData(0, 0, w, h).data;
      const thr = Number(threshold) || 128;
      const inv = invert === "1";
      const mask = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) {
        const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b);
        const fg = inv ? lum > thr : lum < thr;
        mask[i] = fg ? 1 : 0;
      }
      const minA = Math.max(1, Math.round(Number(minArea) || 20));
      const maxA = w * h;
      const res = countBlobs(mask, w, h, minA, maxA);
      setBlobs(res);
      const canvas = canvasRef.current;
      if (canvas) drawBlobs(canvas, im, res.blobs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Blob count failed.");
    } finally {
      setBusy(false);
    }
  }

  const counts = (() => {
    if (!detections) return [];
    const map = new Map<string, number>();
    for (const d of detections) map.set(d.label, (map.get(d.label) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  })();

  const aiTotal = detections?.length ?? 0;

  return (
    <ToolShell
      title="Object Count Estimator"
      khmerTitle="ប៉ាន់ស្មានចំនួនវត្ថុ"
      description="Count objects in an image on-device. Use AI detection for known classes (people, vehicles, animals, furniture, food) or blob/shape counting for uniform items like pills, coins, seeds and beads. No upload."
      descriptionKm="រាប់វត្ថុក្នុងរូបភាពនៅលើឧបករណ៍។ ប្រើការរកឃើញតាម AI សម្រាប់ប្រភេទដែលគេស្គាល់ ឬការរាប់តាមរូបរាងសម្រាប់វត្ថុដូចគ្នា (ថ្នាំ កាក់ គ្រាប់ អង្កាំ)។ គ្មានការបញ្ចូលទៅម៉ាស៊ីនមេ។"
    >
      <Field label={t("Method", "របៀប")}>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={() => setMethod("ai")} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${method === "ai" ? "bg-[var(--gold)] text-[#0a0c0d]" : "bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}>
            <ScanSearch size={14} className="mr-1 inline" />{t("AI detect (known classes)", "AI រកឃើញ")}
          </button>
          <button type="button" onClick={() => setMethod("blob")} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${method === "blob" ? "bg-[var(--gold)] text-[#0a0c0d]" : "bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}>
            <Shapes size={14} className="mr-1 inline" />{t("Count by shape (blobs)", "រាប់តាមរូបរាង")}
          </button>
        </div>
      </Field>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <ScanSearch size={18} className="text-[var(--ink-faint)]" />
        <span>{img ? img.file : t("Click to choose an image", "ចុចដើម្បីជ្រើសរើសរូបភាព")}</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      </label>

      {img && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-lg border border-[var(--ground-line)] bg-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={imgRef} src={img.url} alt="input" className="block max-h-[520px] w-full object-contain" />
            <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
          </div>

          {method === "blob" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label={t("Threshold (0–255)", "កម្រិត")} hint={t("darker than threshold = object", "ងងឹតជាងកម្រិត = វត្ថុ")}>
                <TextInput type="number" min="1" max="254" step="1" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
              </Field>
              <Field label={t("Invert", "ដាក់បញ្ច្រាស")}>
                <Select value={invert} onChange={(e) => setInvert(e.target.value as "0" | "1")}>
                  <option value="0">{t("No (objects darker)", "ទេ (វត្ថុងងឹត)")}</option>
                  <option value="1">{t("Yes (objects lighter)", "បាទ (វត្ថុភ្លឺ)")}</option>
                </Select>
              </Field>
              <Field label={t("Min blob size (px²)", "ទំហំតូចបំផុត (px²)")}>
                <TextInput type="number" min="1" step="1" value={minArea} onChange={(e) => setMinArea(e.target.value)} />
              </Field>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={method === "ai" ? runAi : runBlob} disabled={busy}>
              {busy ? <Loader2 size={15} className="mr-1 inline animate-spin" /> : method === "ai" ? <ScanSearch size={15} className="mr-1 inline" /> : <Shapes size={15} className="mr-1 inline" />}
              {busy ? t("Counting…", "កំពុងរាប់…") : t("Count objects", "រាប់វត្ថុ")}
            </Button>
            {modelLoading && <span className="text-xs text-[var(--ink-faint)]">{t("Loading detection model (on-device)…", "កំពុងផ្ទុកម៉ូដេល (លើឧបករណ៍)…")}</span>}
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        </div>
      )}

      {method === "blob" && blobs && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gold)]">{t("Blobs counted", "ចំនួនដែលរាប់បាន")}</div>
            <div className="mt-1 text-3xl font-bold text-[var(--gold)]">{blobs.count}</div>
            <div className="text-[11px] text-[var(--ink-faint)]">{t("distinct shapes", "រូបរាងផ្សេងគ្នា")}</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{t("Tip", "គន្លឹះ")}</div>
            <p className="mt-1 text-xs leading-relaxed text-[var(--ink-dim)]">
              {t("Put items on a plain, contrasting background and avoid overlapping/merged shapes. Adjust the threshold and min size until the number of outlines matches what you see.", "ដាក់វត្ថុលើផ្ទៃរាបស្មើដែលផ្ទុយពណ៌ ហើយជៀសវាងវត្ថុត្រួតលើគ្នា។ កែកម្រិត និងទំហំតូចបំផុតរហូតដល់ចំនួនគ្រោងត្រូវនឹងអ្វីដែលអ្នកឃើញ។")}
            </p>
          </div>
        </div>
      )}

      {method === "ai" && detections && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-[var(--success)]/40 bg-[var(--success)]/10 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--success)]">{t("Total detected", "សរុបដែលរកឃើញ")}</div>
            <div className="mt-1 text-3xl font-bold text-[var(--success)]">{aiTotal}</div>
            <div className="text-[11px] text-[var(--ink-faint)]">{t("objects", "វត្ថុ")}</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{t("By category", "តាមប្រភេទ")}</div>
            <div className="mt-2 space-y-1">
              {counts.length === 0 && <p className="text-xs text-[var(--ink-faint)]">{t("No objects detected on this model's class list.", "រកមិនឃើញវត្ថុណាក្នុងបញ្ជីម៉ូដេល។")}</p>}
              {counts.map(([label, n]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--ink)]">{t(label, LABEL_KM[label] ?? label)}</span>
                  <span className="font-bold text-[var(--gold)]">{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-[var(--ink-faint)]">
        {t("AI mode uses YOLOS-tiny (COCO 2017, Apache-2.0) via Transformers.js — it detects 80+ known classes, but pill/tablet is NOT among them. For pills, coins, seeds or other uniform shapes, switch to Count by shape (blobs), which needs no model and runs entirely in your browser.", "របៀប AI ប្រើ YOLOS-tiny (COCO 2017, Apache-2.0) — រកឃើញ ៨០+ ប្រភេទដែលគេស្គាល់ ប៉ុន្តែថ្នាំ/គ្រាប់មិនមែនក្នុងបញ្ជីនោះទេ។ សម្រាប់ថ្នាំ កាក់ គ្រាប់ សូមប្តូរទៅរាប់តាមរូបរាង ដែលមិនត្រូវការម៉ូដេល ហើយដំណើរការពេញក្នុងកម្មវិធីរុករក។")}
      </p>
    </ToolShell>
  );
}
