"use client";
import { useEffect, useState } from "react";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

interface Settings {
  maxWidth: number;
  quality: number;
  format: "image/jpeg" | "image/webp" | "image/png";
}

export default function ImageOptimizerTool() {
  const [settings, setSettings] = useToolState<Settings>("image-optimizer", { maxWidth: 1600, quality: 0.8, format: "image/jpeg" });
  const update = (patch: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...patch }));

  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [resultSize, setResultSize] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => { if (originalUrl) URL.revokeObjectURL(originalUrl); }, [originalUrl]);
  useEffect(() => () => { if (resultUrl) URL.revokeObjectURL(resultUrl); }, [resultUrl]);

  function pickFile(f: File) {
    setFile(f);
    setOriginalSize(f.size);
    setOriginalUrl(URL.createObjectURL(f));
    setResultUrl(null);
    setResultSize(0);
  }

  async function process() {
    if (!file) return;
    setBusy(true);
    try {
      const img = new Image();
      const loadUrl = originalUrl ?? URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("load failed"));
        img.src = loadUrl;
      });
      const scale = Math.min(1, settings.maxWidth / img.naturalWidth);
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no canvas context");
      ctx.drawImage(img, 0, 0, w, h);
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, settings.format, settings.format === "image/png" ? undefined : settings.quality)
      );
      if (!blob) throw new Error("encode failed");
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } finally {
      setBusy(false);
    }
  }

  const fmt = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / (1024 * 1024)).toFixed(2)} MB`);
  const ext = settings.format === "image/jpeg" ? "jpg" : settings.format === "image/webp" ? "webp" : "png";

  return (
    <ToolShell
      title="Image Resizer & Compressor"
      description="Resize and re-compress an image entirely in your browser — pick a max width, quality, and output format, then download the result."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{file ? file.name : "Click to choose an image"}</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pickFile(f);
          }}
        />
      </label>

      <Row>
        <Field label="Max width (px)">
          <TextInput type="number" min={16} value={settings.maxWidth} onChange={(e) => update({ maxWidth: Number(e.target.value) })} />
        </Field>
        <Field label="Format">
          <Select value={settings.format} onChange={(e) => update({ format: e.target.value as Settings["format"] })}>
            <option value="image/jpeg">JPEG</option>
            <option value="image/webp">WebP</option>
            <option value="image/png">PNG (lossless)</option>
          </Select>
        </Field>
      </Row>
      {settings.format !== "image/png" && (
        <Field label="Quality" hint={`${Math.round(settings.quality * 100)}%`}>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={settings.quality}
            onChange={(e) => update({ quality: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
      )}

      <Button onClick={process} disabled={!file || busy}>
        {busy ? "Processing…" : "Resize & Compress"}
      </Button>

      {originalUrl && resultUrl ? (
        <div className="space-y-3">
          <BeforeAfterSlider before={originalUrl} after={resultUrl} beforeAlt="Original image" afterAlt="Optimized image" />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-dim)]">
            <span>Original {fmt(originalSize)} → Result {fmt(resultSize)} ({originalSize > 0 ? Math.round((1 - resultSize / originalSize) * 100) : 0}% smaller)</span>
            <a href={resultUrl} download={`optimized.${ext}`} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 hover:border-[var(--gold-dim)]">Download</a>
          </div>
        </div>
      ) : originalUrl ? (
        <div>
          <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Original — {fmt(originalSize)}</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={originalUrl} alt="Original" className="max-h-56 w-full rounded-md border border-[var(--ground-line)] object-contain" />
        </div>
      ) : null}
    </ToolShell>
  );
}
