"use client";
import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

type ChannelKey = "r" | "g" | "b" | "l";

interface Histograms {
  r: number[];
  g: number[];
  b: number[];
  l: number[];
}

interface ChannelStats {
  min: number;
  max: number;
  mean: number;
  median: number;
}

const CHANNELS: { key: ChannelKey; color: string; label: string }[] = [
  { key: "r", color: "rgba(229, 57, 53, 0.55)", label: "R" },
  { key: "g", color: "rgba(67, 160, 71, 0.55)", label: "G" },
  { key: "b", color: "rgba(33, 150, 243, 0.55)", label: "B" },
  { key: "l", color: "rgba(190, 190, 190, 0.85)", label: "L" },
];

function statsOf(hist: number[]): ChannelStats {
  let min = -1;
  let max = -1;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < 256; i++) {
    if (hist[i] > 0) {
      if (min < 0) min = i;
      max = i;
    }
    sum += i * hist[i];
    count += hist[i];
  }
  const mean = count > 0 ? sum / count : 0;
  let half = count / 2;
  let median = 0;
  for (let i = 0; i < 256; i++) {
    half -= hist[i];
    if (half <= 0) {
      median = i;
      break;
    }
  }
  return { min: min < 0 ? 0 : min, max: max < 0 ? 0 : max, mean, median };
}

export default function ImageHistogram() {
  const { text: t } = useLanguage();
  const [url, setUrl] = useState<string | null>(null);
  const [hist, setHist] = useState<Histograms | null>(null);
  const [stats, setStats] = useState<Record<ChannelKey, ChannelStats> | null>(null);
  const [toggles, setToggles] = useState<Record<ChannelKey, boolean>>({ r: true, g: true, b: true, l: true });
  const [error, setError] = useState("");
  const histRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!url) return;
    const img = new Image();
    img.onload = () => {
      try {
        const maxDim = 640;
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          setError(t("Could not read the image.", "មិនអាចអានរូបភាពបានទេ។"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        const hists: Histograms = {
          r: new Array<number>(256).fill(0),
          g: new Array<number>(256).fill(0),
          b: new Array<number>(256).fill(0),
          l: new Array<number>(256).fill(0),
        };
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const l = Math.round((r * 299 + g * 587 + b * 114) / 1000);
          hists.r[r]++;
          hists.g[g]++;
          hists.b[b]++;
          hists.l[l]++;
        }
        setHist(hists);
        setStats({
          r: statsOf(hists.r),
          g: statsOf(hists.g),
          b: statsOf(hists.b),
          l: statsOf(hists.l),
        });
        setError("");
      } catch {
        setError(t("Could not compute the histogram.", "មិនអាចគណនាអ៊ីស្តូក្រាមបានទេ។"));
      }
    };
    img.onerror = () => setError(t("Could not load the image.", "មិនអាចផ្ទុករូបភាពបានទេ។"));
    img.src = url;
  }, [url, t]);

  useEffect(() => {
    const canvas = histRef.current;
    if (!canvas || !hist) return;
    const W = 512;
    const H = 200;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(128, 128, 128, 0.12)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (H / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    for (const ch of CHANNELS) {
      if (!toggles[ch.key]) continue;
      const values = hist[ch.key];
      let max = 1;
      for (const v of values) if (v > max) max = v;
      ctx.fillStyle = ch.color;
      const barW = Math.max(1, W / 256);
      for (let i = 0; i < 256; i++) {
        const bh = (values[i] / max) * H;
        ctx.fillRect((i / 256) * W, H - bh, barW, bh);
      }
    }
  }, [hist, toggles]);

  function pick(file: File) {
    setError("");
    setHist(null);
    setStats(null);
    const reader = new FileReader();
    reader.onload = () => setUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function toggle(key: ChannelKey) {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <ToolShell
      title="Image Histogram"
      khmerTitle="អ៊ីស្តូក្រាមរូបភាព"
      description="Analyse the tone distribution of a photo — RGB channel and luminance histograms with per-channel statistics."
      descriptionKm="វិភាគការចែកចាយសំនៀងនៃរូបថត — អ៊ីស្តូក្រាម RGB និងពន្លឺ ជាមួយស្ថិតិនៃឆានែលនីមួយៗ។"
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
          className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--ground-line)] p-8 text-center transition hover:border-[var(--gold)]/40"
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={t("Image preview", "មើលរូបភាពជាមុន")} className="max-h-40 rounded-lg object-contain" />
          ) : (
            <>
              <Upload size={28} className="text-[var(--ink-dim)]" />
              <span className="text-sm font-semibold text-[var(--ink)]">{t("Upload an image", "ផ្ទុករូបភាពឡើង")}</span>
            </>
          )}
        </button>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        {hist && (
          <>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.key}
                  type="button"
                  onClick={() => toggle(ch.key)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                    toggles[ch.key]
                      ? "border-[var(--gold)] bg-[var(--gold)] text-[#0a0c0d]"
                      : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>

            <canvas ref={histRef} className="w-full rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)]" />

            {stats && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {CHANNELS.map((ch) => {
                  const s = stats[ch.key];
                  return (
                    <div key={ch.key} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm" style={{ background: ch.color }} />
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink)]">{ch.label}</span>
                      </div>
                      <dl className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono-ui text-xs text-[var(--ink-dim)]">
                        <dt>{t("Mean", "មធ្យម")}</dt><dd className="text-right text-[var(--ink)]">{s.mean.toFixed(1)}</dd>
                        <dt>{t("Median", "មេដ្យាន")}</dt><dd className="text-right text-[var(--ink)]">{s.median}</dd>
                        <dt>{t("Min", "តូចបំផុត")}</dt><dd className="text-right text-[var(--ink)]">{s.min}</dd>
                        <dt>{t("Max", "ធំបំផុត")}</dt><dd className="text-right text-[var(--ink)]">{s.max}</dd>
                      </dl>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </ToolShell>
  );
}
