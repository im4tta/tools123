"use client";
import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { ToolShell, Field, Select } from "@/components/ui/Shell";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";

interface Swatch {
  hex: string;
  r: number;
  g: number;
  b: number;
  pct: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function extractPalette(img: HTMLImageElement, count: number): Swatch[] {
  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const buckets = new Map<number, number>();
  const levels = 4;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue;
    const r = (data[i] >> (8 - levels)) << (8 - levels);
    const g = (data[i + 1] >> (8 - levels)) << (8 - levels);
    const b = (data[i + 2] >> (8 - levels)) << (8 - levels);
    const key = (r << 16) | (g << 8) | b;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const total = [...buckets.values()].reduce((s, v) => s + v, 0) || 1;
  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([key, n]) => ({
      r: (key >> 16) & 0xff,
      g: (key >> 8) & 0xff,
      b: key & 0xff,
      hex: rgbToHex((key >> 16) & 0xff, (key >> 8) & 0xff, key & 0xff),
      pct: (n / total) * 100,
    }));
}

export default function ImagePaletteExtractor() {
  const { text: t } = useLanguage();
  const [url, setUrl] = useState<string | null>(null);
  const [count, setCount] = useState("6");
  const [colors, setColors] = useState<Swatch[]>([]);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      try {
        setColors(extractPalette(img, Number(count) || 6));
        setError("");
      } catch {
        setError("Could not read the image.");
      }
    };
    img.onerror = () => !cancelled && setError("Could not load the image.");
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url, count]);

  function pick(file: File) {
    const reader = new FileReader();
    reader.onload = () => setUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <ToolShell
      title="Image Palette Extractor"
      description="Extract the dominant colors from an image — quantized swatches with hex codes and coverage."
    >
      <div className="space-y-4">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ""; }} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--ground-line)] p-10 text-center transition hover:border-[var(--gold)]/40"
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Preview" className="max-h-40 rounded-lg object-contain" />
          ) : (
            <>
              <Upload size={32} className="text-[var(--ink-faint)]" />
              <div className="text-sm font-semibold text-[var(--ink)]">{t("Drop an image or click to browse", "អូសរូបភាពមក ឬចុចដើម្បីជ្រើសរើស")}</div>
            </>
          )}
        </button>

        <Field label="Number of colors">
          <Select value={count} onChange={(e) => setCount(e.target.value)}>
            {["3", "4", "5", "6", "8", "10"].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Select>
        </Field>

        {error && <p className="text-sm text-[var(--danger)]">{t(error, error)}</p>}

        {colors.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {colors.map((c) => (
              <div key={c.hex} className="flex items-center gap-3 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2.5">
                <span className="h-10 w-10 shrink-0 rounded-md border border-[var(--ground-line)]" style={{ background: c.hex }} />
                <div className="min-w-0 flex-1">
                  <div className="font-mono-ui text-sm font-semibold text-[var(--ink)]">{c.hex}</div>
                  <div className="text-xs text-[var(--ink-faint)]">{c.pct.toFixed(1)}% · rgb({c.r}, {c.g}, {c.b})</div>
                </div>
                <CopyButton text={c.hex} compact />
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolShell>
  );
}