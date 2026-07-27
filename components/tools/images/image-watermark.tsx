"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

interface Settings {
  text: string;
  size: number;
  opacity: number;
  color: string;
  position: "center" | "tiled" | "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

const initial: Settings = { text: "© Your Name", size: 32, opacity: 0.5, color: "#ffffff", position: "bottom-right" };

export default function ImageWatermarkTool() {
  const [s, setS] = useToolState<Settings>("image-watermark", initial);
  const update = (patch: Partial<Settings>) => setS((prev) => ({ ...prev, ...patch }));
  const [file, setFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function apply() {
    if (!file) return;
    setBusy(true);
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("load failed"));
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no context");
      ctx.drawImage(img, 0, 0);

      ctx.globalAlpha = s.opacity;
      ctx.fillStyle = s.color;
      ctx.font = `700 ${s.size}px "Inter", sans-serif`;
      const metrics = ctx.measureText(s.text);
      const pad = s.size * 0.6;

      if (s.position === "tiled") {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 8);
        const stepX = metrics.width + pad * 4;
        const stepY = s.size * 3;
        for (let y = -canvas.height; y < canvas.height; y += stepY) {
          for (let x = -canvas.width; x < canvas.width; x += stepX) {
            ctx.fillText(s.text, x, y);
          }
        }
        ctx.restore();
      } else {
        let x = pad;
        let y = pad + s.size;
        if (s.position === "center") { x = (canvas.width - metrics.width) / 2; y = canvas.height / 2; }
        if (s.position === "bottom-right") { x = canvas.width - metrics.width - pad; y = canvas.height - pad; }
        if (s.position === "bottom-left") { x = pad; y = canvas.height - pad; }
        if (s.position === "top-right") { x = canvas.width - metrics.width - pad; y = pad + s.size; }
        ctx.fillText(s.text, x, y);
      }

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (blob) setResultUrl(URL.createObjectURL(blob));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      title="Image Watermark"
      description="Overlay a text watermark — a signature, copyright notice, or brand mark — on a photo, tiled or positioned, entirely in your browser."
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{file ? file.name : "Click to choose an image"}</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setResultUrl(null); } }} />
      </label>

      <Field label="Watermark text"><TextInput value={s.text} onChange={(e) => update({ text: e.target.value })} /></Field>

      <Row>
        <Field label="Position">
          <Select value={s.position} onChange={(e) => update({ position: e.target.value as Settings["position"] })}>
            <option value="bottom-right">Bottom right</option>
            <option value="bottom-left">Bottom left</option>
            <option value="top-right">Top right</option>
            <option value="top-left">Top left</option>
            <option value="center">Center</option>
            <option value="tiled">Tiled diagonal</option>
          </Select>
        </Field>
        <Field label="Color">
          <div className="flex items-center gap-2">
            <input type="color" value={s.color} onChange={(e) => update({ color: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
            <TextInput value={s.color} onChange={(e) => update({ color: e.target.value })} />
          </div>
        </Field>
      </Row>

      <Row>
        <Field label="Font size" hint={`${s.size}px`}>
          <input type="range" min={12} max={120} value={s.size} onChange={(e) => update({ size: Number(e.target.value) })} className="w-full" />
        </Field>
        <Field label="Opacity" hint={`${Math.round(s.opacity * 100)}%`}>
          <input type="range" min={0.05} max={1} step={0.05} value={s.opacity} onChange={(e) => update({ opacity: Number(e.target.value) })} className="w-full" />
        </Field>
      </Row>

      <Button onClick={apply} disabled={!file || busy}>{busy ? "Applying…" : "Apply watermark"}</Button>

      {resultUrl && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resultUrl} alt="Result" className="max-h-72 w-full rounded-md border border-[var(--ground-line)] object-contain" />
          <a href={resultUrl} download="watermarked.png" className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] hover:bg-[var(--gold-dim)]">
            <Download size={13} /> Download
          </a>
        </div>
      )}
    </ToolShell>
  );
}
