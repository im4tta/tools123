"use client";
import { useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { CopyButton } from "@/components/CopyButton";
import { Field, ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { mulberry32 } from "@/lib/prng";
import { downloadBlob, downloadDataUrl } from "@/lib/download";
import { svgStringToPngDataUrl } from "@/lib/svg-raster";

const W = 1440;
const H = 320;

function wavePath(amp: number, wavelength: number, phase: number, baseline: number, flip: boolean): string {
  const steps = 40;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * W;
    const y = baseline + Math.sin((x / wavelength) * Math.PI * 2 + phase) * amp * (flip ? -1 : 1);
    pts.push(`${x.toFixed(0)},${y.toFixed(1)}`);
  }
  const bottom = flip ? 0 : H;
  return `M0,${baseline} L${pts.join(" L")} L${W},${bottom} L0,${bottom} Z`;
}

function buildSvg(seed: number, layers: number, amp: number, colors: string[], flip: boolean): string {
  const rand = mulberry32(seed);
  const paths: string[] = [];
  for (let i = 0; i < layers; i++) {
    const t = layers === 1 ? 0.5 : i / (layers - 1);
    const baseline = flip ? H * (0.3 + t * 0.4) : H * (0.6 - t * 0.4);
    const wavelength = W / (1.2 + rand() * 1.5);
    const phase = rand() * Math.PI * 2;
    const a = amp * (0.6 + t * 0.6);
    const color = colors[i % colors.length];
    const opacity = (0.45 + 0.55 * (i / Math.max(1, layers - 1))).toFixed(2);
    paths.push(`<path d="${wavePath(a, wavelength, phase, baseline, flip)}" fill="${color}" fill-opacity="${layers === 1 ? "1" : opacity}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${paths.join("")}</svg>`;
}

export default function SvgWaveGenerator() {
  const { text: t } = useLanguage();
  const [seed, setSeed] = useToolState("svg-wave:seed", 3);
  const [layers, setLayers] = useToolState("svg-wave:layers", 3);
  const [amp, setAmp] = useToolState("svg-wave:amp", 50);
  const [c1, setC1] = useToolState("svg-wave:c1", "#c9a24b");
  const [c2, setC2] = useToolState("svg-wave:c2", "#7c9a6b");
  const [c3, setC3] = useToolState("svg-wave:c3", "#4a6b8a");
  const [flip, setFlip] = useToolState("svg-wave:flip", false);
  const [busy, setBusy] = useState(false);

  const svg = useMemo(() => buildSvg(seed, layers, amp, [c1, c2, c3], flip), [seed, layers, amp, c1, c2, c3, flip]);

  async function downloadPng() {
    setBusy(true);
    try { downloadDataUrl(await svgStringToPngDataUrl(svg, W, H, 1.5), "wave.png"); }
    finally { setBusy(false); }
  }

  return (
    <ToolShell
      title="SVG Wave Generator"
      khmerTitle="ឧបករណ៍បង្កើតរលក SVG"
      description="Make layered wave shapes for section dividers, page headers, and footers — the smooth curved edges between coloured blocks on modern websites. Set the number of layers, height, and colours, shuffle for a new shape, then copy the SVG or download SVG/PNG. Runs in your browser."
      descriptionKm="បង្កើតរូបរលកជាស្រទាប់សម្រាប់បំបែកផ្នែក ក្បាល និងជើងទំព័រ — គែមកោងរលោងរវាងប្លុកពណ៌នៅលើគេហទំព័រទំនើប។ កំណត់ចំនួនស្រទាប់ កម្ពស់ និងពណ៌ ចាក់ឆ្នោតរូបរាងថ្មី រួចចម្លង SVG ឬទាញយក SVG/PNG។ ដំណើរការក្នុងកម្មវិធីរុករក។"
    >
      <div className="overflow-hidden rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)]">
        <div className="w-full" style={{ aspectRatio: "1440 / 320" }} dangerouslySetInnerHTML={{ __html: svg.replace("<svg ", '<svg style="width:100%;height:100%;display:block" ') }} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setSeed((s) => s + 1)} className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--ink-faint)]">
          <RefreshCw size={13} />{t("Shuffle", "ចាក់ឆ្នោត")}
        </button>
        <button type="button" onClick={() => setFlip((v) => !v)} className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${flip ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}>
          {t("Flip", "ត្រឡប់")}
        </button>
        <span className="text-xs text-[var(--ink-faint)]">{t("Layers", "ស្រទាប់")}:</span>
        {[1, 2, 3].map((n) => (
          <button key={n} type="button" onClick={() => setLayers(n)} className={`h-8 w-8 rounded-md border text-xs font-medium transition ${layers === n ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}>{n}</button>
        ))}
        <button type="button" onClick={downloadPng} disabled={busy} className="flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-50">
          <Download size={13} />{busy ? t("Rendering…", "កំពុងបង្កើត…") : t("Download PNG", "ទាញយក PNG")}
        </button>
        <button type="button" onClick={() => downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "wave.svg")} className="rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--ink-faint)]">
          {t("Download SVG", "ទាញយក SVG")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Height" labelKm="កម្ពស់">
          <input type="range" min={10} max={120} step={5} value={amp} onChange={(e) => setAmp(Number(e.target.value))} className="mt-2 w-full accent-[var(--gold)]" />
        </Field>
        <Field label="Colour 1" labelKm="ពណ៌ ១"><input type="color" value={c1} onChange={(e) => setC1(e.target.value)} className="h-9 w-full rounded-md border border-[var(--ground-line)] bg-transparent" /></Field>
        <Field label="Colour 2" labelKm="ពណ៌ ២"><input type="color" value={c2} onChange={(e) => setC2(e.target.value)} className="h-9 w-full rounded-md border border-[var(--ground-line)] bg-transparent" /></Field>
        <Field label="Colour 3" labelKm="ពណ៌ ៣"><input type="color" value={c3} onChange={(e) => setC3(e.target.value)} className="h-9 w-full rounded-md border border-[var(--ground-line)] bg-transparent" /></Field>
      </div>

      <div className="flex items-center gap-2"><span className="text-xs text-[var(--ink-faint)]">{t("Copy SVG", "ចម្លង SVG")}</span><CopyButton text={svg} compact /></div>
      <Output label="SVG" value={svg} />

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Each layer is a sine curve sampled across the width and filled down to the edge; a small seeded random-number generator varies the wavelength and phase so every shuffle is different. Generation and PNG rasterisation run entirely in your browser — nothing is uploaded.",
          "ស្រទាប់នីមួយៗជាខ្សែកោង sine ដែលគំរូតាមទទឹង ហើយបំពេញចុះដល់គែម កម្មវិធីបង្កើតលេខចៃដន្យតូចប្តូររលកនិងផេស ដូច្នេះការចាក់ឆ្នោតនីមួយៗខុសគ្នា។ ការបង្កើត និងការបម្លែង PNG ដំណើរការទាំងស្រុងក្នុងកម្មវិធីរុករក — គ្មានការផ្ញើឡើងទេ។",
        )}</p>
      </section>
    </ToolShell>
  );
}
