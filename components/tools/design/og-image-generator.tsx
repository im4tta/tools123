"use client";
import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { ToolShell, Field, TextInput, TextArea, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { recordExport, watermarkImageDataUrl } from "@/lib/export";

interface Settings {
  title: string;
  subtitle: string;
  eyebrow: string;
  bg1: string;
  bg2: string;
  textColor: string;
  align: "left" | "center";
  logo: string | null;
}

const W = 1200;
const H = 630;

const initial: Settings = {
  title: "Your Headline Goes Here",
  subtitle: "A short supporting line that describes the page.",
  eyebrow: "yourdomain.com",
  bg1: "#141719",
  bg2: "#2a2116",
  textColor: "#f4f1ea",
  align: "left",
  logo: null,
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export default function OgImageGeneratorTool() {
  const [s, setS] = useToolState<Settings>("og-image-generator", initial);
  const update = (patch: Partial<Settings>) => setS((prev) => ({ ...prev, ...patch }));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  function pickLogo(file: File) {
    const reader = new FileReader();
    reader.onload = () => update({ logo: reader.result as string });
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = W;
    canvas.height = H;

    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, s.bg1);
    gradient.addColorStop(1, s.bg2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // subtle vignette for depth
    const radial = ctx.createRadialGradient(W * 0.8, H * 0.15, 0, W * 0.8, H * 0.15, W * 0.6);
    radial.addColorStop(0, "rgba(255,255,255,0.06)");
    radial.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, W, H);

    const padX = 90;
    const centered = s.align === "center";
    ctx.textAlign = centered ? "center" : "left";
    const anchorX = centered ? W / 2 : padX;
    const maxWidth = centered ? W - padX * 2 : W - padX * 2 - 60;

    let cursorY = centered ? H / 2 - 60 : 240;

    if (s.eyebrow) {
      ctx.font = "600 26px 'Inter', sans-serif";
      ctx.fillStyle = "#c9a24b";
      ctx.fillText(s.eyebrow.toUpperCase(), anchorX, centered ? cursorY - 90 : 150);
    }

    ctx.font = "700 64px 'Inter', sans-serif";
    ctx.fillStyle = s.textColor;
    const titleLines = wrapText(ctx, s.title, maxWidth).slice(0, 3);
    for (const line of titleLines) {
      ctx.fillText(line, anchorX, cursorY);
      cursorY += 74;
    }

    if (s.subtitle) {
      cursorY += 12;
      ctx.font = "400 30px 'Inter', sans-serif";
      ctx.fillStyle = "rgba(244,241,234,0.72)";
      const subLines = wrapText(ctx, s.subtitle, maxWidth).slice(0, 2);
      for (const line of subLines) {
        ctx.fillText(line, anchorX, cursorY);
        cursorY += 42;
      }
    }

    if (s.logo) {
      const img = new Image();
      img.onload = () => {
        const logoH = 64;
        const logoW = (img.naturalWidth / img.naturalHeight) * logoH;
        ctx.drawImage(img, centered ? W / 2 - logoW / 2 : padX, H - 100, logoW, logoH);
        setResultUrl(canvas.toDataURL("image/png"));
      };
      img.src = s.logo;
    } else {
      setResultUrl(canvas.toDataURL("image/png"));
    }
  }, [s]);

  return (
    <ToolShell
      title="Social Preview (OG) Image Generator"
      description="Compose a 1200×630 Open Graph image for link previews on X, LinkedIn, Slack, and iMessage — live preview, rendered locally, exported as PNG."
    >
      <Field label="Eyebrow / site name"><TextInput value={s.eyebrow} onChange={(e) => update({ eyebrow: e.target.value })} /></Field>
      <Field label="Title"><TextInput value={s.title} onChange={(e) => update({ title: e.target.value })} /></Field>
      <Field label="Subtitle"><TextArea rows={2} value={s.subtitle} onChange={(e) => update({ subtitle: e.target.value })} /></Field>

      <Row>
        <Field label="Alignment">
          <Select value={s.align} onChange={(e) => update({ align: e.target.value as Settings["align"] })}>
            <option value="left">Left</option>
            <option value="center">Center</option>
          </Select>
        </Field>
        <Field label="Text color">
          <div className="flex items-center gap-2">
            <input type="color" value={s.textColor} onChange={(e) => update({ textColor: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
            <TextInput value={s.textColor} onChange={(e) => update({ textColor: e.target.value })} />
          </div>
        </Field>
      </Row>

      <Row>
        <Field label="Background — start">
          <div className="flex items-center gap-2">
            <input type="color" value={s.bg1} onChange={(e) => update({ bg1: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
            <TextInput value={s.bg1} onChange={(e) => update({ bg1: e.target.value })} />
          </div>
        </Field>
        <Field label="Background — end">
          <div className="flex items-center gap-2">
            <input type="color" value={s.bg2} onChange={(e) => update({ bg2: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
            <TextInput value={s.bg2} onChange={(e) => update({ bg2: e.target.value })} />
          </div>
        </Field>
      </Row>

      <Field label="Logo (optional)">
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs text-[var(--ink-dim)] hover:border-[var(--gold-dim)]">
            {s.logo ? "Replace logo" : "Upload logo"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickLogo(f); }} />
          </label>
          {s.logo && <button onClick={() => update({ logo: null })} className="rounded-md border border-[var(--ground-line)] px-2 py-1 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">Remove</button>}
        </div>
      </Field>

      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Preview (1200×630)</div>
        <canvas ref={canvasRef} className="w-full rounded-md border border-[var(--ground-line)]" style={{ aspectRatio: "1200/630" }} />
      </div>

      {resultUrl && (
        <a
          href={resultUrl}
          download="og-image.png"
          onClick={async (e) => {
            e.preventDefault();
            const watermarked = await watermarkImageDataUrl(resultUrl, "image/png");
            const a = document.createElement("a");
            a.href = watermarked;
            a.download = "og-image.png";
            a.click();
            recordExport();
          }}
        >
          <Button className="w-full"><Download size={13} className="mr-1.5 inline" />Download PNG</Button>
        </a>
      )}
    </ToolShell>
  );
}
