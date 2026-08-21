"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function MemeGenerator() {
  const { text: t } = useLanguage();
  const [top, setTop] = useToolState("meme-generator:top", "WHEN THE TOOL");
  const [bottom, setBottom] = useToolState("meme-generator:bottom", "WORKS ON THE FIRST TRY");
  const [sizePct, setSizePct] = useToolState("meme-generator:size", 12);
  const [url, setUrl] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!url) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImg(null);
      return;
    }
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (!cancelled) setImg(image);
    };
    image.src = url;
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!img) {
      canvas.width = 800;
      canvas.height = 450;
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#6b7280";
      ctx.font = "600 20px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(t("Upload an image to start", "បញ្ចូលរូបភាពដើម្បីចាប់ផ្តើម"), 400, 225);
      return;
    }
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    const fontSize = Math.max(14, Math.round((canvas.height * sizePct) / 100));
    ctx.font = `900 ${fontSize}px Impact, "Arial Black", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.lineWidth = Math.max(2, fontSize / 12);
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#ffffff";

    const drawLine = (raw: string, y: number) => {
      const line = raw.toUpperCase();
      if (!line) return;
      // shrink to fit
      let size = fontSize;
      while (ctx.measureText(line).width > canvas.width - 16 && size > 10) {
        size -= 2;
        ctx.font = `900 ${size}px Impact, "Arial Black", system-ui, sans-serif`;
        ctx.lineWidth = Math.max(2, size / 12);
      }
      ctx.strokeText(line, canvas.width / 2, y);
      ctx.fillText(line, canvas.width / 2, y);
    };

    drawLine(top, fontSize + 8);
    drawLine(bottom, canvas.height - 8);
  }, [img, top, bottom, sizePct, t]);

  function pick(file: File) {
    const reader = new FileReader();
    reader.onload = () => setUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "meme.png";
    a.click();
  }

  return (
    <ToolShell
      title="Meme Generator"
      khmerTitle="បង្កើតមីម"
      description="Add classic top and bottom captions to any image and export it as a PNG."
      descriptionKm="បន្ថែមអត្ថបទខាងលើ និងខាងក្រោមទៅលើរូបភាពណាមួយ ហើយនាំចេញជា PNG។"
    >
      <div className="space-y-4">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ""; }} />
        <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--ground-line)] px-4 py-3 text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold)]/40 hover:text-[var(--ink)]">
          <Upload size={15} />{img ? t("Replace image", "ផ្លាស់ប្តូររូបភាព") : t("Upload an image", "បញ្ចូលរូបភាព")}
        </button>

        <canvas ref={canvasRef} className="w-full rounded-xl border border-[var(--ground-line)] bg-black" />

        <Field label={t("Top text", "អត្ថបទខាងលើ")}>
          <TextArea rows={2} value={top} onChange={(e) => setTop(e.target.value)} />
        </Field>
        <Field label={t("Bottom text", "អត្ថបទខាងក្រោម")}>
          <TextArea rows={2} value={bottom} onChange={(e) => setBottom(e.target.value)} />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--ink-dim)]">
            <span>{t("Font size", "ទំហំអក្សរ")}</span>
            <span className="font-mono-ui text-[var(--ink)]">{sizePct}%</span>
          </div>
          <input type="range" min={6} max={20} step={1} value={sizePct} onChange={(e) => setSizePct(Number(e.target.value))} className="h-1 w-full cursor-pointer accent-[var(--gold)]" />
        </div>

        <button type="button" onClick={download} disabled={!img} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40">
          <Download size={16} />{t("Download PNG", "ទាញយក PNG")}
        </button>
      </div>
    </ToolShell>
  );
}