"use client";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { CopyButton } from "@/components/CopyButton";
import { Field, ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { downloadBlob, downloadDataUrl } from "@/lib/download";
import { svgStringToPngDataUrl } from "@/lib/svg-raster";

const SIZE = 480;
type Shape = "triangles" | "diamonds" | "chevron" | "scales" | "plus";

const SHAPES: { id: Shape; en: string; km: string }[] = [
  { id: "triangles", en: "Triangles", km: "ត្រីកោណ" },
  { id: "diamonds", en: "Diamonds", km: "ពេជ្រ" },
  { id: "chevron", en: "Chevron", km: "ស្នៀត" },
  { id: "scales", en: "Fish scales", km: "ស្រកាត្រី" },
  { id: "plus", en: "Crosses", km: "ឈើឆ្កាង" },
];

function tile(shape: Shape, w: number, fg: string, bg: string): { h: number; body: string } {
  switch (shape) {
    case "triangles": {
      const h = Math.round(w * 0.87);
      return { h, body: `<rect width="${w}" height="${h}" fill="${bg}"/><polygon points="0,${h} ${w / 2},0 ${w},${h}" fill="${fg}"/>` };
    }
    case "diamonds":
      return { h: w, body: `<rect width="${w}" height="${w}" fill="${bg}"/><polygon points="${w / 2},0 ${w},${w / 2} ${w / 2},${w} 0,${w / 2}" fill="${fg}"/>` };
    case "chevron": {
      const h = Math.round(w / 2);
      return { h, body: `<rect width="${w}" height="${h}" fill="${bg}"/><path d="M0,${h} L${w / 2},0 L${w},${h}" fill="none" stroke="${fg}" stroke-width="${Math.max(2, w / 6)}"/>` };
    }
    case "scales": {
      const h = Math.round(w / 2);
      return { h, body: `<rect width="${w}" height="${h}" fill="${bg}"/><path d="M0,${h} A ${w / 2} ${h} 0 0 1 ${w} ${h} Z" fill="${fg}"/>` };
    }
    case "plus": {
      const a = w / 3;
      return { h: w, body: `<rect width="${w}" height="${w}" fill="${bg}"/><path d="M${a},0 h${a} v${a} h${a} v${a} h-${a} v${a} h-${a} v-${a} h-${a} v-${a} h${a} Z" fill="${fg}"/>` };
    }
  }
}

function buildSvg(shape: Shape, w: number, fg: string, bg: string): string {
  const { h, body } = tile(shape, w, fg, bg);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}"><defs><pattern id="tess" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${body}</pattern></defs><rect width="${SIZE}" height="${SIZE}" fill="url(#tess)"/></svg>`;
}

export default function TessellationGenerator() {
  const { text: t } = useLanguage();
  const [shape, setShape] = useToolState<Shape>("tessellation:shape", "scales");
  const [size, setSize] = useToolState("tessellation:size", 60);
  const [fg, setFg] = useToolState("tessellation:fg", "#c9a24b");
  const [bg, setBg] = useToolState("tessellation:bg", "#1a1e27");
  const [busy, setBusy] = useState(false);

  const svg = useMemo(() => buildSvg(shape, size, fg, bg), [shape, size, fg, bg]);

  async function downloadPng() {
    setBusy(true);
    try { downloadDataUrl(await svgStringToPngDataUrl(svg, SIZE, SIZE, 2), `tessellation-${shape}.png`); }
    finally { setBusy(false); }
  }

  return (
    <ToolShell
      title="Geometric Tessellation Generator"
      khmerTitle="ឧបករណ៍បង្កើតលំនាំធរណីមាត្រ"
      description="Create seamless tiling patterns from geometric shapes — triangles, diamonds, chevrons, fish scales, and crosses — for backgrounds, textures, and wrapping-paper style fills. Pick two colours and the tile size, then copy the SVG (with a repeating <pattern>) or download SVG/PNG. Runs in your browser."
      descriptionKm="បង្កើតលំនាំក្រាលឥតថ្នេរពីរូបរាងធរណីមាត្រ — ត្រីកោណ ពេជ្រ ស្នៀត ស្រកាត្រី និងឈើឆ្កាង — សម្រាប់ផ្ទៃខាងក្រោយ វាយនភាព និងការបំពេញបែបក្រដាសខ្ចប់។ ជ្រើសពណ៌ពីរ និងទំហំក្រឡា រួចចម្លង SVG (ជាមួយ <pattern> ដដែលៗ) ឬទាញយក SVG/PNG។ ដំណើរការក្នុងកម្មវិធីរុករក។"
    >
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-xl border border-[var(--ground-line)]">
        <div className="w-full" style={{ aspectRatio: "1 / 1" }} dangerouslySetInnerHTML={{ __html: svg.replace("<svg ", '<svg style="width:100%;height:100%;display:block" ') }} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {SHAPES.map((s) => (
          <button key={s.id} type="button" onClick={() => setShape(s.id)} className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${shape === s.id ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}>
            {t(s.en, s.km)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Tile size" labelKm="ទំហំក្រឡា">
          <input type="range" min={24} max={120} step={4} value={size} onChange={(e) => setSize(Number(e.target.value))} className="mt-2 w-full accent-[var(--gold)]" />
        </Field>
        <Field label="Shape colour" labelKm="ពណ៌រូបរាង"><input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-9 w-full rounded-md border border-[var(--ground-line)] bg-transparent" /></Field>
        <Field label="Background" labelKm="ផ្ទៃខាងក្រោយ"><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-9 w-full rounded-md border border-[var(--ground-line)] bg-transparent" /></Field>
        <div className="flex items-end gap-2">
          <button type="button" onClick={downloadPng} disabled={busy} className="flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-2 text-xs font-medium text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-50">
            <Download size={13} />{busy ? t("…", "…") : "PNG"}
          </button>
          <button type="button" onClick={() => downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `tessellation-${shape}.svg`)} className="rounded-md border border-[var(--ground-line)] px-3 py-2 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--ink-faint)]">SVG</button>
        </div>
      </div>

      <div className="flex items-center gap-2"><span className="text-xs text-[var(--ink-faint)]">{t("Copy SVG", "ចម្លង SVG")}</span><CopyButton text={svg} compact /></div>
      <Output label="SVG" value={svg} />

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Each shape is drawn once into an SVG <pattern> tile that repeats seamlessly, so the output stays tiny and scales to any size. Generation and PNG rasterisation run entirely in your browser — nothing is uploaded.",
          "រូបរាងនីមួយៗត្រូវគូរម្តងក្នុងក្រឡា SVG <pattern> ដែលដដែលៗឥតថ្នេរ ដូច្នេះលទ្ធផលនៅតូច និងពង្រីកបានគ្រប់ទំហំ។ ការបង្កើត និងការបម្លែង PNG ដំណើរការទាំងស្រុងក្នុងកម្មវិធីរុករក — គ្មានការផ្ញើឡើងទេ។",
        )}</p>
      </section>
    </ToolShell>
  );
}
