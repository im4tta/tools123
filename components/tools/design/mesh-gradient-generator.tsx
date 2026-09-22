"use client";
import { useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { mulberry32, randInt } from "@/lib/prng";
import { downloadBlob, downloadDataUrl } from "@/lib/download";
import { svgStringToPngDataUrl } from "@/lib/svg-raster";

const W = 800;
const H = 600;

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

type Point = { x: number; y: number; color: string };

function buildPoints(seed: number, count: number): { points: Point[]; base: string } {
  const rand = mulberry32(seed);
  const baseHue = randInt(rand, 0, 359);
  const scheme = randInt(rand, 0, 2); // 0 analogous, 1 triadic-ish, 2 spread
  const spread = scheme === 0 ? 40 : scheme === 1 ? 120 : 220;
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const hue = (baseHue + (rand() - 0.5) * spread + i * (spread / count)) % 360;
    const color = hslToHex((hue + 360) % 360, randInt(rand, 60, 90), randInt(rand, 55, 72));
    points.push({ x: randInt(rand, 5, 95), y: randInt(rand, 5, 95), color });
  }
  const base = hslToHex(baseHue, randInt(rand, 40, 70), randInt(rand, 22, 38));
  return { points, base };
}

function cssImage(points: Point[]): string {
  return points.map((p) => `radial-gradient(at ${p.x}% ${p.y}%, ${p.color} 0px, transparent 55%)`).join(", ");
}

function toCss(points: Point[], base: string): string {
  const layers = points.map((p) => `radial-gradient(at ${p.x}% ${p.y}%, ${p.color} 0px, transparent 55%)`).join(",\n    ");
  return `background-color: ${base};\nbackground-image:\n    ${layers};`;
}

function toSvg(points: Point[], base: string): string {
  const grads = points
    .map((p, i) => `<radialGradient id="mg${i}" cx="${p.x}%" cy="${p.y}%" r="60%"><stop offset="0%" stop-color="${p.color}" stop-opacity="0.9"/><stop offset="100%" stop-color="${p.color}" stop-opacity="0"/></radialGradient>`)
    .join("");
  const rects = points.map((_, i) => `<rect width="${W}" height="${H}" fill="url(#mg${i})"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${grads}<filter id="b"><feGaussianBlur stdDeviation="24"/></filter></defs><rect width="${W}" height="${H}" fill="${base}"/><g filter="url(#b)">${rects}</g></svg>`;
}

export default function MeshGradientGenerator() {
  const { text: t } = useLanguage();
  const [seed, setSeed] = useToolState("mesh-gradient:seed", 7);
  const [count, setCount] = useToolState("mesh-gradient:count", 5);
  const [busy, setBusy] = useState(false);

  const { points, base } = useMemo(() => buildPoints(seed, count), [seed, count]);
  const css = useMemo(() => toCss(points, base), [points, base]);
  const bgImage = useMemo(() => cssImage(points), [points]);
  const svg = useMemo(() => toSvg(points, base), [points, base]);

  async function downloadPng() {
    setBusy(true);
    try {
      const dataUrl = await svgStringToPngDataUrl(svg, W, H, 2);
      downloadDataUrl(dataUrl, "mesh-gradient.png");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      title="Mesh Gradient Maker"
      khmerTitle="ឧបករណ៍បង្កើតជម្រាលពណ៌មេស"
      description="Generate soft, multi-colour mesh gradients — the smooth, blurry blends used as hero and card backgrounds. Randomise until you like one, adjust the number of colour points, then copy the CSS or download a PNG. Everything is generated in your browser."
      descriptionKm="បង្កើតជម្រាលពណ៌មេសពហុពណ៌ដ៏ទន់ភ្លន់ — ការលាយពណ៌រលោងព្រិលៗដែលប្រើជាផ្ទៃខាងក្រោយ។ ចាក់ឆ្នោតរហូតដល់អ្នកពេញចិត្ត កែចំនួនចំណុចពណ៌ រួចចម្លង CSS ឬទាញយក PNG។ អ្វីៗបង្កើតក្នុងកម្មវិធីរុករក។"
    >
      <div className="overflow-hidden rounded-xl border border-[var(--ground-line)]" style={{ aspectRatio: "4 / 3" }}>
        <div className="h-full w-full" style={{ backgroundColor: base, backgroundImage: bgImage }} aria-label={t("Gradient preview", "ការមើលជម្រាលពណ៌")} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setSeed((s) => s + 1)} className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--ink-faint)]">
          <RefreshCw size={13} />{t("Randomize", "ចាក់ឆ្នោត")}
        </button>
        <span className="text-xs text-[var(--ink-faint)]">{t("Colour points", "ចំណុចពណ៌")}:</span>
        {[3, 4, 5, 6, 7].map((n) => (
          <button key={n} type="button" onClick={() => setCount(n)} className={`h-8 w-8 rounded-md border text-xs font-medium transition ${count === n ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}>{n}</button>
        ))}
        <button type="button" onClick={downloadPng} disabled={busy} className="flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-50">
          <Download size={13} />{busy ? t("Rendering…", "កំពុងបង្កើត…") : t("Download PNG", "ទាញយក PNG")}
        </button>
      </div>

      <Output label="CSS" value={css} />
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--ink-faint)]">{t("Copy SVG", "ចម្លង SVG")}</span><CopyButton text={svg} compact />
        <button type="button" onClick={() => downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "mesh-gradient.svg")} className="rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--ink-faint)]">
          {t("Download SVG", "ទាញយក SVG")}
        </button>
      </div>

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Colours and positions are generated with a small seeded random-number generator in your browser, using a harmonious HSL palette. The PNG is rasterised from an SVG (blurred radial gradients) on a canvas locally — nothing is uploaded. The CSS uses standard layered radial-gradients supported by all modern browsers.",
          "ពណ៌ និងទីតាំងត្រូវបានបង្កើតដោយកម្មវិធីបង្កើតលេខចៃដន្យតូចក្នុងកម្មវិធីរុករក ដោយប្រើក្រុមពណ៌ HSL ចុះសម្រុង។ PNG ត្រូវបម្លែងពី SVG (ជម្រាលរ៉ាឌ្យាល់ព្រិល) លើ canvas ក្នុងមូលដ្ឋាន — គ្មានការផ្ញើឡើងទេ។ CSS ប្រើ radial-gradient ស្តង់ដារដែលកម្មវិធីរុករកទំនើបទាំងអស់គាំទ្រ។",
        )}</p>
      </section>
    </ToolShell>
  );
}
