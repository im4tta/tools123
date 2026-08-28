"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Segment = { cmd: string; params: number[] };
type BBox = { minX: number; minY: number; maxX: number; maxY: number };

const ARITY: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
const TOKEN_RE = /[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;

/** Tokenizes a path "d" string into command segments. Never throws. */
function parsePath(d: string): Segment[] {
  const segments: Segment[] = [];
  let cur: Segment | null = null;
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(d)) !== null) {
    const tok = m[0];
    if (/[A-Za-z]/.test(tok)) {
      cur = { cmd: tok, params: [] };
      segments.push(cur);
    } else if (cur) {
      cur.params.push(Number(tok));
    }
  }
  return segments;
}

type Ctx = {
  x: number;
  y: number;
  startX: number;
  startY: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  length: number;
  prevCx: number;
  prevCy: number;
};

function analyze(segments: Segment[]): { bbox: BBox | null; length: number; counts: Record<string, number> } {
  const ctx: Ctx = { x: 0, y: 0, startX: 0, startY: 0, minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity, length: 0, prevCx: 0, prevCy: 0 };
  const counts: Record<string, number> = {};

  const track = (px: number, py: number) => {
    if (px < ctx.minX) ctx.minX = px;
    if (py < ctx.minY) ctx.minY = py;
    if (px > ctx.maxX) ctx.maxX = px;
    if (py > ctx.maxY) ctx.maxY = py;
  };
  const addLen = (px: number, py: number) => {
    ctx.length += Math.hypot(px - ctx.x, py - ctx.y);
  };
  const rel = (v: number, base: number, isRel: boolean) => (isRel ? v + base : v);

  for (const seg of segments) {
    const u = seg.cmd.toUpperCase();
    const isRel = seg.cmd !== u;
    counts[u] = (counts[u] || 0) + 1;
    const p = seg.params;
    const arity = ARITY[u];

    if (arity === 0) {
      addLen(ctx.startX, ctx.startY);
      ctx.x = ctx.startX;
      ctx.y = ctx.startY;
      continue;
    }

    let first = true;
    let i = 0;
    while (i + arity <= p.length) {
      const c = p.slice(i, i + arity);
      i += arity;
      const implicitLine = u === "M" && !first;
      first = false;

      if (u === "M" || u === "L") {
        const nx = rel(c[0], ctx.x, isRel);
        const ny = rel(c[1], ctx.y, isRel);
        if (u === "L" || implicitLine) addLen(nx, ny);
        track(nx, ny);
        ctx.x = nx;
        ctx.y = ny;
        if (u === "M" && !implicitLine) {
          ctx.startX = nx;
          ctx.startY = ny;
        }
      } else if (u === "H") {
        const nx = isRel ? ctx.x + c[0] : c[0];
        addLen(nx, ctx.y);
        track(nx, ctx.y);
        ctx.x = nx;
      } else if (u === "V") {
        const ny = isRel ? ctx.y + c[0] : c[0];
        addLen(ctx.x, ny);
        track(ctx.x, ny);
        ctx.y = ny;
      } else if (u === "C" || u === "S") {
        const c1x = u === "C" ? rel(c[0], ctx.x, isRel) : 2 * ctx.x - ctx.prevCx;
        const c1y = u === "C" ? rel(c[1], ctx.y, isRel) : 2 * ctx.y - ctx.prevCy;
        const off = u === "C" ? 2 : 0;
        const c2x = rel(c[off], ctx.x, isRel);
        const c2y = rel(c[off + 1], ctx.y, isRel);
        const ex = rel(c[off + 2], ctx.x, isRel);
        const ey = rel(c[off + 3], ctx.y, isRel);
        track(c1x, c1y);
        track(c2x, c2y);
        track(ex, ey);
        addLen(c1x, c1y);
        addLen(c2x, c2y);
        addLen(ex, ey);
        ctx.prevCx = c2x;
        ctx.prevCy = c2y;
        ctx.x = ex;
        ctx.y = ey;
      } else if (u === "Q" || u === "T") {
        const cx = u === "Q" ? rel(c[0], ctx.x, isRel) : 2 * ctx.x - ctx.prevCx;
        const cy = u === "Q" ? rel(c[1], ctx.y, isRel) : 2 * ctx.y - ctx.prevCy;
        const off = u === "Q" ? 2 : 0;
        const ex = rel(c[off], ctx.x, isRel);
        const ey = rel(c[off + 1], ctx.y, isRel);
        track(cx, cy);
        track(ex, ey);
        addLen(cx, cy);
        addLen(ex, ey);
        ctx.prevCx = cx;
        ctx.prevCy = cy;
        ctx.x = ex;
        ctx.y = ey;
      } else if (u === "A") {
        // Chord distance is a rough estimate of an elliptical arc's length.
        const ex = rel(c[5], ctx.x, isRel);
        const ey = rel(c[6], ctx.y, isRel);
        track(ex, ey);
        addLen(ex, ey);
        ctx.x = ex;
        ctx.y = ey;
      }
    }
  }

  const bbox: BBox | null =
    ctx.minX === Infinity ? null : { minX: ctx.minX, minY: ctx.minY, maxX: ctx.maxX, maxY: ctx.maxY };
  return { bbox, length: ctx.length, counts };
}

const SAMPLE = "M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80";
const pad = 8;

export default function SvgPathInspector() {
  const { text: t } = useLanguage();
  const [d, setD] = useToolState("svg-path-inspector:d", SAMPLE);

  const result = useMemo(() => {
    const segments = parsePath(d);
    if (segments.length === 0) return { segments, stats: null };
    return { segments, stats: analyze(segments) };
  }, [d]);

  const { segments, stats } = result;

  const viewBox = stats?.bbox
    ? `${stats.bbox.minX - pad} ${stats.bbox.minY - pad} ${stats.bbox.maxX - stats.bbox.minX + pad * 2} ${stats.bbox.maxY - stats.bbox.minY + pad * 2}`
    : "0 0 200 200";

  return (
    <ToolShell
      title="SVG Path Inspector"
      khmerTitle="ពិនិត្យ SVG Path"
      description="Paste an SVG path 'd' attribute to tokenize every command, see segment statistics, and render it."
      descriptionKm="បិទភ្ជាប់លក្ខណៈ 'd' របស់ SVG path ដើម្បីបំបែកពាក្យបញ្ជានីមួយៗ មើលស្ថិតិ និងបង្ហាញរាង។"
    >
      <Field label="Path d" labelKm="ផ្លូវ d">
        <TextArea rows={3} value={d} onChange={(e) => setD(e.target.value)} placeholder='M10 80 C 40 10, 65 10, 95 80' />
      </Field>

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => setD(SAMPLE)}>
          {t("Load sample", "ផ្ទុកឧទាហរណ៍")}
        </Button>
        <Button type="button" onClick={() => setD("")}>
          {t("Clear", "សម្អាត")}
        </Button>
      </div>

      {stats ? (
        <>
          <svg
            viewBox={viewBox}
            className="h-56 w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]"
          >
            <path d={d} fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
          </svg>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Segments", "ចំនួនផ្នែក")}</div>
              <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{segments.length}</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Est. length", "ប្រវែងប្រហាក់ប្រហែល")}</div>
              <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{stats.length.toFixed(1)}</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Bounds min", "ព្រំដែនតូច")}</div>
              <div className="mt-1 font-mono-ui text-sm text-[var(--ink)]">
                {stats.bbox ? `${stats.bbox.minX.toFixed(1)}, ${stats.bbox.minY.toFixed(1)}` : "–"}
              </div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Bounds max", "ព្រំដែនធំ")}</div>
              <div className="mt-1 font-mono-ui text-sm text-[var(--ink)]">
                {stats.bbox ? `${stats.bbox.maxX.toFixed(1)}, ${stats.bbox.maxY.toFixed(1)}` : "–"}
              </div>
            </div>
          </div>

          <div className="overflow-auto rounded-md border border-[var(--ground-line)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--ground-raised)]">
                <tr className="border-b border-[var(--ground-line)] text-[var(--ink-dim)]">
                  <th className="py-2 pl-3 pr-2 font-medium">#</th>
                  <th className="px-2 py-2 font-medium">{t("Cmd", "ពាក្យបញ្ជា")}</th>
                  <th className="px-2 py-2 font-medium">{t("Params", "ប៉ារ៉ាម៉ែត្រ")}</th>
                  <th className="px-2 py-2 font-medium">{t("Values", "តម្លៃ")}</th>
                  <th className="py-2 pl-2 pr-3 text-right font-medium">{t("Count", "ចំនួន")}</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((s, i) => (
                  <tr key={i} className="border-b border-[var(--ground-line)] last:border-b-0">
                    <td className="py-1.5 pl-3 pr-2 text-[var(--ink-dim)]">{i + 1}</td>
                    <td className="px-2 py-1.5 font-mono-ui text-[var(--gold)]">{s.cmd}</td>
                    <td className="px-2 py-1.5 font-mono-ui">{s.params.length}</td>
                    <td className="break-all px-2 py-1.5 font-mono-ui text-[var(--ink-dim)]">{s.params.join(", ") || "–"}</td>
                    <td className="py-1.5 pl-2 pr-3 text-right font-mono-ui text-[var(--ink-dim)]">{stats.counts[s.cmd.toUpperCase()]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
            {t("Length and bounds are estimates: curves are approximated by their control-point polyline and arcs by their chord.", "ប្រវែង និងព្រំដែនជាតម្លៃប្រហាក់ប្រហែល៖ ខ្សែកោងត្រូវបានប៉ាន់ស្មានតាមបន្ទាត់ពហុកោណនៃចំណុចត្រួតពិនិត្យ ហើយធ្នូតាមខ្សែអង្កត់។")}
          </p>
        </>
      ) : (
        <p className="text-sm text-[var(--ink-dim)]">
          {t("No path commands found. Paste a valid SVG path 'd' attribute.", "រកមិនឃើញពាក្យបញ្ជាផ្លូវទេ។ សូមបិទភ្ជាប់លក្ខណៈ 'd' ដែលត្រឹមត្រូវ។")}
        </p>
      )}
    </ToolShell>
  );
}
