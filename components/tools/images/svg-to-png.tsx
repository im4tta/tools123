"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { ToolShell, TextArea, TextInput, Field, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { recordExport, watermarkImageDataUrl } from "@/lib/export";

function renderSvg(svg: string, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas"));
        return;
      }
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("invalid svg"));
    };
    img.src = url;
  });
}

const SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#7ec9a0"/>
  <circle cx="256" cy="256" r="120" fill="#ffffff"/>
  <path d="M256 176 L236 256 L176 236 Z" fill="#0a0c0d"/>
</svg>`;

export default function SvgToPng() {
  const { text: t } = useLanguage();
  const [svg, setSvg] = useToolState("svg-to-png:svg", SAMPLE);
  const [widthStr, setWidth] = useToolState("svg-to-png:width", "512");
  const [heightStr, setHeight] = useToolState("svg-to-png:height", "512");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const width = Math.max(1, Math.round(Number(widthStr) || 512));
  const height = Math.max(1, Math.round(Number(heightStr) || 512));

  useEffect(() => {
    if (!svg.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult(null);
      setError("");
      return;
    }
    let cancelled = false;
    renderSvg(svg, width, height)
      .then((url) => {
        if (!cancelled) {
          setResult(url);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult(null);
          setError(t("Could not parse this SVG.", "មិនអាចញែក SVG នេះបានទេ។"));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [svg, width, height, t]);

  function pick(file: File) {
    const reader = new FileReader();
    reader.onload = () => setSvg(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function download() {
    if (!result) return;
    const watermarked = await watermarkImageDataUrl(result, "image/png");
    const a = document.createElement("a");
    a.href = watermarked;
    a.download = "image.png";
    a.click();
    recordExport();
  }

  return (
    <ToolShell
      title="SVG to PNG Converter"
      description="Render SVG markup to a PNG at any size — entirely in your browser."
    >
      <div className="space-y-4">
        <input ref={fileRef} type="file" accept="image/svg+xml,.svg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ""; }} />
        <Field label="SVG markup">
          <TextArea rows={7} value={svg} onChange={(e) => setSvg(e.target.value)} className="font-mono-ui" />
        </Field>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs text-[var(--ink-dim)] hover:border-[var(--gold-dim)]">
            <Upload size={13} />{t("Upload .svg", "បញ្ចូលឯកសារ .svg")}
          </button>
        </div>

        <Row>
          <Field label="Width (px)">
            <TextInput inputMode="numeric" value={widthStr} onChange={(e) => setWidth(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label="Height (px)">
            <TextInput inputMode="numeric" value={heightStr} onChange={(e) => setHeight(e.target.value)} className="font-mono-ui" />
          </Field>
        </Row>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        {result && (
          <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Preview", "មើលជាមុន")} · {width} × {height}</div>
            <div className="flex items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground)] p-4 [background-image:linear-gradient(45deg,rgba(127,127,127,0.15)_25%,transparent_25%,transparent_75%,rgba(127,127,127,0.15)_75%),linear-gradient(45deg,rgba(127,127,127,0.15)_25%,transparent_25%,transparent_75%,rgba(127,127,127,0.15)_75%)] [background-size:16px_16px] [background-position:0_0,8px_8px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result} alt="PNG preview" className="max-h-80 max-w-full" />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={download}
          disabled={!result}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40"
        >
          <Download size={16} /> {t("Download PNG", "ទាញយក PNG")}
        </button>
      </div>
    </ToolShell>
  );
}