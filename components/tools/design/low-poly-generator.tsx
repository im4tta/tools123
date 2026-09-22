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

const W = 800;
const H = 600;

function hexToRgb(h: string): [number, number, number] {
  const m = h.replace("#", "");
  const n = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}
function lerpHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a), [r2, g2, b2] = hexToRgb(b);
  const cl = (x: number) => Math.max(0, Math.min(255, Math.round(x)));
  const mix = (x: number, y: number) => cl(x + (y - x) * t);
  return `#${[mix(r1, r2), mix(g1, g2), mix(b1, b2)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function buildSvg(seed: number, cell: number, c1: string, c2: string, jitter: number): string {
  const rand = mulberry32(seed);
  const cols = Math.ceil(W / cell);
  const rows = Math.ceil(H / cell);
  const gx = (i: number, j: number) => {
    const edge = i === 0 || i === cols || j === 0 || j === rows;
    const x = (i / cols) * W + (edge ? 0 : (rand() - 0.5) * cell * jitter);
    const y = (j / rows) * H + (edge ? 0 : (rand() - 0.5) * cell * jitter);
    return [x, y];
  };
  // Precompute jittered vertices.
  const pts: number[][][] = [];
  for (let j = 0; j <= rows; j++) { pts[j] = []; for (let i = 0; i <= cols; i++) pts[j][i] = gx(i, j); }
  const tris: string[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const tl = pts[j][i], tr = pts[j][i + 1], bl = pts[j + 1][i], br = pts[j + 1][i + 1];
      for (const tri of [[tl, tr, bl], [tr, br, bl]]) {
        const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
        const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
        const base = (cx / W + cy / H) / 2;
        const shade = Math.max(0, Math.min(1, base + (rand() - 0.5) * 0.12));
        const fill = lerpHex(c1, c2, shade);
        tris.push(`<polygon points="${tri.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")}" fill="${fill}"/>`);
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">${tris.join("")}</svg>`;
}

export default function LowPolyGenerator() {
  const { text: t } = useLanguage();
  const [seed, setSeed] = useToolState("low-poly:seed", 5);
  const [cell, setCell] = useToolState("low-poly:cell", 90);
  const [c1, setC1] = useToolState("low-poly:c1", "#1a1e27");
  const [c2, setC2] = useToolState("low-poly:c2", "#c9a24b");
  const [jitter, setJitter] = useToolState("low-poly:jitter", 0.7);
  const [busy, setBusy] = useState(false);

  const svg = useMemo(() => buildSvg(seed, cell, c1, c2, jitter), [seed, cell, c1, c2, jitter]);

  async function downloadPng() {
    setBusy(true);
    try { downloadDataUrl(await svgStringToPngDataUrl(svg, W, H, 2), "low-poly.png"); }
    finally { setBusy(false); }
  }

  return (
    <ToolShell
      title="Low-Poly Background Generator"
      khmerTitle="ឧបករណ៍បង្កើតផ្ទៃខាងក្រោយ Low-Poly"
      description="Generate faceted low-poly backgrounds — the triangulated 'crystal' gradients popular for hero sections, wallpapers, and cover images. Choose two colours for the gradient, set the triangle size and jitter, shuffle for a new pattern, then copy the SVG or download SVG/PNG. Runs in your browser."
      descriptionKm="បង្កើតផ្ទៃខាងក្រោយ low-poly ជាមុខ — ជម្រាល «គ្រីស្តាល់» ត្រីកោណដែលពេញនិយមសម្រាប់ផ្នែកសំខាន់ ផ្ទាំងរូបភាព និងរូបគម្រប។ ជ្រើសពណ៌ពីរសម្រាប់ជម្រាល កំណត់ទំហំត្រីកោណ និងការរើ ចាក់ឆ្នោតលំនាំថ្មី រួចចម្លង SVG ឬទាញយក SVG/PNG។ ដំណើរការក្នុងកម្មវិធីរុករក។"
    >
      <div className="overflow-hidden rounded-xl border border-[var(--ground-line)]">
        <div className="w-full" style={{ aspectRatio: "4 / 3" }} dangerouslySetInnerHTML={{ __html: svg.replace("<svg ", '<svg style="width:100%;height:100%;display:block" ') }} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setSeed((s) => s + 1)} className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--ink-faint)]">
          <RefreshCw size={13} />{t("Shuffle", "ចាក់ឆ្នោត")}
        </button>
        <button type="button" onClick={downloadPng} disabled={busy} className="flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-50">
          <Download size={13} />{busy ? t("Rendering…", "កំពុងបង្កើត…") : t("Download PNG", "ទាញយក PNG")}
        </button>
        <button type="button" onClick={() => downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "low-poly.svg")} className="rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--ink-faint)]">
          {t("Download SVG", "ទាញយក SVG")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Triangle size" labelKm="ទំហំត្រីកោណ">
          <input type="range" min={40} max={160} step={10} value={cell} onChange={(e) => setCell(Number(e.target.value))} className="mt-2 w-full accent-[var(--gold)]" />
        </Field>
        <Field label="Jitter" labelKm="ការរើ">
          <input type="range" min={0} max={1} step={0.05} value={jitter} onChange={(e) => setJitter(Number(e.target.value))} className="mt-2 w-full accent-[var(--gold)]" />
        </Field>
        <Field label="Colour 1" labelKm="ពណ៌ ១"><input type="color" value={c1} onChange={(e) => setC1(e.target.value)} className="h-9 w-full rounded-md border border-[var(--ground-line)] bg-transparent" /></Field>
        <Field label="Colour 2" labelKm="ពណ៌ ២"><input type="color" value={c2} onChange={(e) => setC2(e.target.value)} className="h-9 w-full rounded-md border border-[var(--ground-line)] bg-transparent" /></Field>
      </div>

      <div className="flex items-center gap-2"><span className="text-xs text-[var(--ink-faint)]">{t("Copy SVG", "ចម្លង SVG")}</span><CopyButton text={svg} compact /></div>
      <Output label="SVG" value={svg} />

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "A grid of points is jittered by a small seeded random-number generator, split into triangles, and each triangle is filled by blending your two colours according to its position (with a little random shading for the faceted look). All generation and PNG rasterisation run in your browser — nothing is uploaded.",
          "ក្រឡាចំណុចត្រូវបានរើដោយកម្មវិធីបង្កើតលេខចៃដន្យតូច បំបែកជាត្រីកោណ ហើយត្រីកោណនីមួយៗបំពេញដោយលាយពណ៌ទាំងពីររបស់អ្នកតាមទីតាំង (មានស្រមោលចៃដន្យបន្តិចសម្រាប់រូបរាងជាមុខ)។ ការបង្កើត និងការបម្លែង PNG ទាំងអស់ដំណើរការក្នុងកម្មវិធីរុករក — គ្មានការផ្ញើឡើងទេ។",
        )}</p>
      </section>
    </ToolShell>
  );
}
