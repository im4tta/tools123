"use client";

import { useRef, useState } from "react";
import { Copy, Download, Check } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const FONTS = ["Noto Sans Khmer", "Noto Serif Khmer", "Battambang", "Kantumruy Pro"] as const;
type FontName = (typeof FONTS)[number];

const DEFAULT_TEXT = "សួស្តី! នេះជាឧបករណ៍សាកល្បងអក្សរខ្មែរ។";

function cssFor(font: FontName, size: number, weight: number, lineHeight: number, letterSpacing: number, color: string, background: string) {
  return `.khmer-text {
  font-family: "${font}", sans-serif;
  font-size: ${size}px;
  font-weight: ${weight};
  line-height: ${lineHeight};
  letter-spacing: ${letterSpacing}px;
  color: ${color};
  background: ${background};
}`;
}

export default function FontPreview() {
  const [text, setText] = useToolState("font-preview:text", DEFAULT_TEXT);
  const [font, setFont] = useState<FontName>("Noto Sans Khmer");
  const [size, setSize] = useState(28);
  const [weight, setWeight] = useState(400);
  const [lineHeight, setLineHeight] = useState(1.7);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [background, setBackground] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#17202a");
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const css = cssFor(font, size, weight, lineHeight, letterSpacing, textColor, background);

  function copyCss() {
    void navigator.clipboard.writeText(css).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  }

  async function downloadPng() {
    const preview = previewRef.current;
    if (!preview) return;
    await document.fonts.ready;
    const scale = 2;
    const padding = 32;
    const lines = text.split("\n");
    const canvas = document.createElement("canvas");
    canvas.width = preview.clientWidth * scale;
    canvas.height = Math.max(180, lines.length * size * lineHeight + padding * 2) * scale;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(scale, scale);
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
    context.fillStyle = textColor;
    context.font = `${weight} ${size}px "${font}"`;
    context.textBaseline = "top";
    lines.forEach((line, index) => {
      const y = padding + index * size * lineHeight;
      if (!letterSpacing) {
        context.fillText(line, padding, y);
        return;
      }
      let x = padding;
      for (const character of Array.from(line)) {
        context.fillText(character, x, y);
        x += context.measureText(character).width + letterSpacing;
      }
    });
    const link = document.createElement("a");
    link.download = "khmer-font-preview.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <ToolShell
      title="Khmer Font Tester"
      khmerTitle="ឧបករណ៍សាកល្បងអក្សរខ្មែរ"
      description="Compare Khmer fonts, tune typography, export a PNG, and copy production-ready CSS."
      descriptionKm="ប្រៀបធៀបពុម្ពអក្សរខ្មែរ កែសម្រួលការកំណត់ ទាញយក PNG និងចម្លង CSS សម្រាប់ប្រើក្នុងគម្រោង។"
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&family=Noto+Sans+Khmer:wght@400;500;600;700&family=Noto+Serif+Khmer:wght@400;500;600;700&display=swap');`}</style>

      <div className="space-y-4">
        <section className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 sm:p-5">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--ink-faint)]">Input</label>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={3}
            className="w-full resize-y rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-4 font-khmer text-lg leading-relaxed text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]"
            placeholder="សរសេរអត្ថបទខ្មែររបស់អ្នក…"
          />
        </section>

        <section className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 sm:grid-cols-4 lg:grid-cols-7">
          <label className="text-xs text-[var(--ink-dim)]">Font<select value={font} onChange={(event) => setFont(event.target.value as FontName)} className="mt-1 w-full rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-2 text-xs text-[var(--ink)]">{FONTS.map((name) => <option key={name}>{name}</option>)}</select></label>
          <label className="text-xs text-[var(--ink-dim)]">Size<select value={size} onChange={(event) => setSize(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-2 text-xs text-[var(--ink)]">{[16, 20, 24, 28, 32, 40, 48].map((value) => <option key={value} value={value}>{value}px</option>)}</select></label>
          <label className="text-xs text-[var(--ink-dim)]">Weight<select value={weight} onChange={(event) => setWeight(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-2 text-xs text-[var(--ink)]">{[400, 500, 600, 700].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label className="text-xs text-[var(--ink-dim)]">Line height<select value={lineHeight} onChange={(event) => setLineHeight(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-2 text-xs text-[var(--ink)]">{[1.2, 1.4, 1.6, 1.7, 1.8, 2].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label className="text-xs text-[var(--ink-dim)]">Letter spacing<input type="number" min={-2} max={8} step={0.25} value={letterSpacing} onChange={(event) => setLetterSpacing(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-2 text-xs text-[var(--ink)]" /></label>
          <label className="text-xs text-[var(--ink-dim)]">Background<input type="color" value={background} onChange={(event) => setBackground(event.target.value)} className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-1" /></label>
          <label className="text-xs text-[var(--ink-dim)]">Text color<input type="color" value={textColor} onChange={(event) => setTextColor(event.target.value)} className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-1" /></label>
        </section>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={downloadPng} className="inline-flex items-center gap-2 rounded-xl bg-[var(--gold)] px-4 py-2.5 text-sm font-bold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]"><Download size={15} /> Download PNG</button>
          <button type="button" onClick={copyCss} className="inline-flex items-center gap-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2.5 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--gold-dim)]">{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied CSS" : "Copy CSS"}</button>
        </div>

        <section ref={previewRef} className="overflow-hidden rounded-2xl border border-[var(--gold)] bg-[var(--ground-raised)]">
          <div className="flex items-center justify-between border-b border-[var(--ground-line)] px-4 py-3">
            <h2 className="text-sm font-bold text-[var(--ink)]">Live preview</h2>
            <span className="text-xs text-[var(--gold)]">{font}</span>
          </div>
          <div className="min-h-[180px] whitespace-pre-wrap break-words p-8" style={{ fontFamily: `"${font}", sans-serif`, fontSize: `${size}px`, fontWeight: weight, lineHeight, letterSpacing: `${letterSpacing}px`, color: textColor, background }}>{text || "​"}</div>
        </section>

        <h2 className="pt-2 text-sm font-bold text-[var(--ink)]">Font comparison</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {FONTS.map((name) => (
            <article key={name} className={`overflow-hidden rounded-2xl border bg-[var(--ground-raised)] ${name === font ? "border-[var(--gold)]" : "border-[var(--ground-line)]"}`}>
              <div className="border-b border-[var(--ground-line)] px-4 py-3"><h2 className="text-sm font-bold text-[var(--ink)]">{name}</h2><p className="text-[10px] text-[var(--ink-faint)]">Khmer sample preview</p></div>
              <div className="min-h-[180px] whitespace-pre-wrap break-words p-6" style={{ fontFamily: `"${name}", sans-serif`, fontSize: `${size}px`, fontWeight: weight, lineHeight, letterSpacing: `${letterSpacing}px`, color: textColor, background }}>{text || "​"}</div>
            </article>
          ))}
        </div>

        <pre className="overflow-x-auto rounded-xl border border-[var(--ground-line)] bg-[#0b1017] p-4 text-xs leading-relaxed text-slate-200"><code>{css}</code></pre>
      </div>
    </ToolShell>
  );
}
