"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Point = { x: number; y: number };

/** Parses CSV or "x,y" (also space/semicolon separated) lines into (x, y) points. */
function parsePoints(text: string): Point[] {
  const points: Point[] = [];
  for (const line of text.split(/\r?\n/)) {
    const tokens = line.split(/[,\s;]+/).filter((s) => s !== "");
    const nums: number[] = [];
    for (const token of tokens) {
      const n = Number(token);
      if (Number.isFinite(n)) {
        nums.push(n);
        if (nums.length === 2) break;
      }
    }
    if (nums.length >= 2) points.push({ x: nums[0], y: nums[1] });
  }
  return points;
}

type Fit =
  | { ok: true; n: number; slope: number; intercept: number; r2: number; r: number; sse: number; points: Point[] }
  | { ok: false; error: string; points: Point[] };

function fit(points: Point[]): Fit {
  if (points.length < 2) {
    return { ok: false, error: "At least 2 data points are required.", points };
  }
  const n = points.length;
  let meanX = 0;
  let meanY = 0;
  for (const p of points) {
    meanX += p.x;
    meanY += p.y;
  }
  meanX /= n;
  meanY /= n;

  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const p of points) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }

  // slope = Σ(x-x̄)(y-ȳ) / Σ(x-x̄)²  — undefined when all x are identical.
  if (sxx === 0) {
    return { ok: false, error: "All x values are identical; the slope is undefined.", points };
  }

  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;
  let sse = 0;
  for (const p of points) {
    const e = p.y - (intercept + slope * p.x);
    sse += e * e;
  }
  // R² = 1 − SSE / SST ; r = Pearson correlation coefficient.
  const r2 = syy === 0 ? (sse === 0 ? 1 : 0) : 1 - sse / syy;
  const r = syy === 0 || sxx === 0 ? 0 : sxy / Math.sqrt(sxx * syy);
  return { ok: true, n, slope, intercept, r2, r, sse, points };
}

const fmt = (n: number) => {
  if (!Number.isFinite(n)) return "–";
  return String(parseFloat(n.toPrecision(6)));
};

const ERRORS_KM: Record<string, string> = {
  "At least 2 data points are required.": "ត្រូវការទិន្នន័យយ៉ាងតិច ២ ពិន្ទុ។",
  "All x values are identical; the slope is undefined.": "តម្លៃ x ទាំងអស់ដូចគ្នា; ជម្រាលមិនអាចកំណត់បានទេ។",
};

export default function LinearRegression() {
  const { text: t } = useLanguage();
  const [data, setData] = useToolState(
    "linear-regression:data",
    "1,2\n2,3\n3,5\n4,4\n5,6\n6,7"
  );
  const [predictX, setPredictX] = useToolState("linear-regression:predict", "7");

  const { result, prediction } = useMemo(() => {
    const points = parsePoints(data);
    const result = fit(points);
    if (!result.ok || result.points.length === 0) return { result, prediction: null };
    const px = Number(predictX);
    const prediction = Number.isFinite(px) ? result.intercept + result.slope * px : null;
    return { result, prediction };
  }, [data, predictX]);

  const { minX, maxX, view } = useMemo(() => {
    const pts = result.ok ? result.points : [];
    if (pts.length === 0) return { minX: 0, maxX: 1, view: null };
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    if (maxX === minX) {
      minX -= 1;
      maxX += 1;
    }
    if (maxY === minY) {
      minY -= 1;
      maxY += 1;
    }
    const pad = 16;
    const W = 320;
    const H = 200;
    const sx = (x: number) => pad + ((x - minX) / (maxX - minX)) * (W - 2 * pad);
    const sy = (y: number) => H - pad - ((y - minY) / (maxY - minY)) * (H - 2 * pad);
    return { minX, maxX, view: { W, H, sx, sy } };
  }, [result]);

  const trendLine = useMemo(() => {
    if (!view || !result.ok) return null;
    const y1 = result.intercept + result.slope * minX;
    const y2 = result.intercept + result.slope * maxX;
    return `M ${view.sx(minX)} ${view.sy(y1)} L ${view.sx(maxX)} ${view.sy(y2)}`;
  }, [view, result, minX, maxX]);

  return (
    <ToolShell
      title="Linear Regression"
      khmerTitle="តំរែតំរង់លីនេអ៊ែរ"
      description={'Fit a straight line to pasted X,Y pairs (CSV or "x,y" lines): slope, intercept, R², SSE, Pearson r, and predictions.'}
      descriptionKm={'បន្ទាត់តំរែតំរង់លើគូ X,Y ដែលបានបិទភ្ជាប់ (CSV ឬបន្ទាត់ "x,y")៖ ជម្រាល ចំនុចប្រសព្វ R², SSE, មេគុណសហទំនាក់ទំនង Pearson និងការព្យាករណ៍។'}
    >
      <Row>
        <Field label={t("Data (CSV or x,y per line)", "ទិន្នន័យ (CSV ឬ x,y ក្នុងមួយបន្ទាត់)")}>
          <TextArea rows={7} value={data} onChange={(e) => setData(e.target.value)} />
        </Field>
        <Field label={t("Predict y for x", "ព្យាករណ៍ y សម្រាប់ x")}>
          <TextInput inputMode="decimal" value={predictX} onChange={(e) => setPredictX(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>

      {result.ok ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Slope", "ជម្រាល")}</div>
              <div className="mt-1 font-mono-ui text-lg font-semibold text-[var(--gold)]">{fmt(result.slope)}</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Intercept", "ចំនុចប្រសព្វ")}</div>
              <div className="mt-1 font-mono-ui text-lg font-semibold text-[var(--ink)]">{fmt(result.intercept)}</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">R²</div>
              <div className="mt-1 font-mono-ui text-lg font-semibold text-[var(--ink)]">{fmt(result.r2)}</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">SSE</div>
              <div className="mt-1 font-mono-ui text-lg font-semibold text-[var(--ink)]">{fmt(result.sse)}</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Pearson r</div>
              <div className="mt-1 font-mono-ui text-lg font-semibold text-[var(--gold)]">{fmt(result.r)}</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Points (n)", "ចំនួនពិន្ទុ (n)")}</div>
              <div className="mt-1 font-mono-ui text-lg font-semibold text-[var(--ink)]">{result.n}</div>
            </div>
          </div>

          {prediction !== null && (
            <Output
              label={t("Prediction", "ការព្យាករណ៍")}
              value={`y = ${fmt(result.intercept)} + ${fmt(result.slope)} × ${fmt(prediction !== null ? Number(predictX) : 0)} = ${fmt(prediction)}`}
            />
          )}

          {view && (
            <div className="overflow-x-auto rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <svg viewBox={`0 0 ${view.W} ${view.H}`} width="100%" height="auto" role="img" aria-label="Scatter plot with trend line">
                {trendLine && <path d={trendLine} fill="none" stroke="var(--gold)" strokeWidth="2" />}
                {result.ok &&
                  result.points.map((p, i) => (
                    <circle key={i} cx={view.sx(p.x)} cy={view.sy(p.y)} r="3.5" fill="var(--ink)" stroke="var(--gold)" strokeWidth="1" />
                  ))}
              </svg>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm font-medium text-[var(--gold)]">{t(result.error, ERRORS_KM[result.error] ?? result.error)}</p>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Formulas: slope b = Σ(x−x̄)(y−ȳ) / Σ(x−x̄)²; intercept a = ȳ − b·x̄; SSE = Σ(y − (a + b·x))²; R² = 1 − SSE/SST; r = Σ(x−x̄)(y−ȳ) / √(Σ(x−x̄)²·Σ(y−ȳ)²).",
          "រូបមន្ត៖ ជម្រាល b = Σ(x−x̄)(y−ȳ) / Σ(x−x̄)²; ចំនុចប្រសព្វ a = ȳ − b·x̄; SSE = Σ(y − (a + b·x))²; R² = 1 − SSE/SST; r = Σ(x−x̄)(y−ȳ) / √(Σ(x−x̄)²·Σ(y−ȳ)²)។"
        )}
      </p>
    </ToolShell>
  );
}
