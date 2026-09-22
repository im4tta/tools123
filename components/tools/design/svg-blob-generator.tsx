"use client";
import { useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { CopyButton } from "@/components/CopyButton";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { mulberry32 } from "@/lib/prng";
import { downloadBlob, downloadDataUrl } from "@/lib/download";
import { svgStringToPngDataUrl } from "@/lib/svg-raster";

const S = 512;

type Pt = { x: number; y: number };

function blobPath(seed: number, count: number, contrast: number): string {
  const rand = mulberry32(seed);
  const cx = S / 2, cy = S / 2, baseR = S * 0.36;
  const pts: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r = baseR * (1 - contrast / 2 + rand() * contrast);
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  const n = pts.length;
  const at = (i: number) => pts[((i % n) + n) % n];
  let d = `M ${at(0).x.toFixed(1)} ${at(0).y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d + " Z";
}

function toSvg(d: string, c1: string, c2: string, gradient: boolean): string {
  const fill = gradient ? "url(#bg)" : c1;
  const defs = gradient ? `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${defs}<path fill="${fill}" d="${d}"/></svg>`;
}

export default function SvgBlobGenerator() {
  const { text: t } = useLanguage();
  const [seed, setSeed] = useToolState("svg-blob:seed", 12);
  const [count, setCount] = useToolState("svg-blob:count", 6);
  const [contrast, setContrast] = useToolState("svg-blob:contrast", 0.5);
  const [c1, setC1] = useToolState("svg-blob:c1", "#c9a24b");
  const [c2, setC2] = useToolState("svg-blob:c2", "#7c9a6b");
  const [gradient, setGradient] = useToolState("svg-blob:gradient", true);
  const [busy, setBusy] = useState(false);

  const d = useMemo(() => blobPath(seed, count, contrast), [seed, count, contrast]);
  const svg = useMemo(() => toSvg(d, c1, c2, gradient), [d, c1, c2, gradient]);

  async function downloadPng() {
    setBusy(true);
    try { downloadDataUrl(await svgStringToPngDataUrl(svg, S, S, 2), "blob.png"); }
    finally { setBusy(false); }
  }

  return (
    <ToolShell
      title="SVG Blob Generator"
      khmerTitle="ឧបករណ៍បង្កើតរូបប្លុប SVG"
      description="Create smooth, organic blob shapes — the soft rounded blobs used behind headings, avatars, and illustrations. Randomise the shape, tune how many points and how wobbly it is, pick a solid or gradient fill, then copy the SVG or download SVG/PNG. Runs entirely in your browser."
      descriptionKm="បង្កើតរូបរាងប្លុបរលោងធម្មជាតិ — រូបប្លុបមូលទន់ដែលប្រើនៅពីក្រោយចំណងជើង រូបតំណាង និងរូបភាព។ ចាក់ឆ្នោតរូបរាង កែចំនួនចំណុច និងកម្រិតរលាក់ ជ្រើសពណ៌តាន់ ឬជម្រាល រួចចម្លង SVG ឬទាញយក SVG/PNG។ ដំណើរការទាំងស្រុងក្នុងកម្មវិធីរុករក។"
    >
      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <div className="mx-auto aspect-square w-full" dangerouslySetInnerHTML={{ __html: svg.replace("<svg ", '<svg style="width:100%;height:100%" ') }} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setSeed((s) => s + 1)} className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--ink-faint)]">
          <RefreshCw size={13} />{t("Randomize", "ចាក់ឆ្នោត")}
        </button>
        <button type="button" onClick={() => setGradient((v) => !v)} className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${gradient ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}>
          {t("Gradient fill", "ពណ៌ជម្រាល")}
        </button>
        <button type="button" onClick={downloadPng} disabled={busy} className="flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-50">
          <Download size={13} />{busy ? t("Rendering…", "កំពុងបង្កើត…") : t("Download PNG", "ទាញយក PNG")}
        </button>
        <button type="button" onClick={() => downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "blob.svg")} className="rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--ink-faint)]">
          {t("Download SVG", "ទាញយក SVG")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Points" labelKm="ចំណុច">
          <TextInput type="number" min={3} max={16} value={count} onChange={(e) => setCount(Math.max(3, Math.min(16, Number(e.target.value) || 6)))} />
        </Field>
        <Field label="Wobble" labelKm="កម្រិតរលាក់">
          <input type="range" min={0.1} max={0.9} step={0.05} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="mt-2 w-full accent-[var(--gold)]" />
        </Field>
        <Field label="Colour 1" labelKm="ពណ៌ ១">
          <input type="color" value={c1} onChange={(e) => setC1(e.target.value)} className="h-9 w-full rounded-md border border-[var(--ground-line)] bg-transparent" />
        </Field>
        <Field label="Colour 2" labelKm="ពណ៌ ២">
          <input type="color" value={c2} onChange={(e) => setC2(e.target.value)} className="h-9 w-full rounded-md border border-[var(--ground-line)] bg-transparent" />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--ink-faint)]">{t("Copy SVG", "ចម្លង SVG")}</span><CopyButton text={svg} compact />
        <span className="ml-2 text-xs text-[var(--ink-faint)]">{t("Copy path", "ចម្លង path")}</span><CopyButton text={d} compact />
      </div>
      <Output label="SVG" value={svg} />

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "The shape is built from points placed around a circle at random radii, then smoothed into a closed curve with a Catmull-Rom → cubic-Bézier spline. All generation and the PNG rasterisation happen in your browser — nothing is uploaded.",
          "រូបរាងបង្កើតពីចំណុចដែលដាក់ជុំវិញរង្វង់ក្នុងកាំចៃដន្យ រួចធ្វើឱ្យរលោងជាខ្សែកោងបិទដោយ Catmull-Rom → cubic-Bézier។ ការបង្កើត និងការបម្លែង PNG ទាំងអស់កើតឡើងក្នុងកម្មវិធីរុករក — គ្មានការផ្ញើឡើងទេ។",
        )}</p>
      </section>
    </ToolShell>
  );
}
