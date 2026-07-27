"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { ToolShell, Field, Select } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";

type Quality = "isnet_fp16" | "isnet" | "isnet_quint8";

export default function BackgroundRemoverTool() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [quality, setQuality] = useState<Quality>("isnet_fp16");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function pickFile(f: File) {
    setFile(f);
    setOriginalUrl(URL.createObjectURL(f));
    setResultUrl(null);
    setError(null);
  }

  async function process() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setProgress("Loading model…");
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(file, {
        model: quality,
        progress: (key: string, current: number, total: number) => {
          if (key.startsWith("fetch")) setProgress(`Downloading model… ${Math.round((current / total) * 100)}%`);
          else setProgress("Removing background…");
        },
      });
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } catch {
      setError("Could not process this image — try a smaller file or a different browser (WebAssembly + WebGPU/WASM required).");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  const fmt = (n: number) => (n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`);

  return (
    <ToolShell
      title="Background Remover"
      description="Cut a subject out from its background automatically — powered by a local AI segmentation model that runs entirely in your browser via WebAssembly. Nothing is uploaded; the first run downloads the model (cached after that)."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{file ? file.name : "Click to choose an image"}</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
      </label>

      <Field label="Model quality" hint="fp16 is a good balance of speed and accuracy">
        <Select value={quality} onChange={(e) => setQuality(e.target.value as Quality)}>
          <option value="isnet_fp16">Balanced (recommended)</option>
          <option value="isnet">Highest quality (slower, larger download)</option>
          <option value="isnet_quint8">Fastest (lower quality)</option>
        </Select>
      </Field>

      <Button onClick={process} disabled={!file || busy}>{busy ? progress ?? "Processing…" : "Remove background"}</Button>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {(originalUrl || resultUrl) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {originalUrl && (
            <div>
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Original</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={originalUrl} alt="Original" className="max-h-72 w-full rounded-md border border-[var(--ground-line)] object-contain" />
            </div>
          )}
          {resultUrl && (
            <div>
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Result — {fmt(resultSize)}</div>
              <div className="rounded-md border border-[var(--ground-line)] bg-[repeating-conic-gradient(#2a2e31_0%_25%,#1c1f21_0%_50%)] bg-[length:16px_16px] p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="Background removed" className="max-h-64 w-full object-contain" />
              </div>
              <a href={resultUrl} download="no-background.png" className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] hover:bg-[var(--gold-dim)]">
                <Download size={13} /> Download PNG
              </a>
            </div>
          )}
        </div>
      )}
    </ToolShell>
  );
}
