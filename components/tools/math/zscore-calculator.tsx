"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const SQRT2 = Math.SQRT2;
const INV_SQRT_2PI = 1 / Math.sqrt(2 * Math.PI);

/**
 * Error function approximation — Abramowitz & Stegun, "Handbook of
 * Mathematical Functions", formula 7.1.26 (max error 1.5e-7).
 * erf(x) ≈ 1 − (a1·t + a2·t² + a3·t³ + a4·t⁴ + a5·t⁵)·e^(−x²), t = 1/(1 + p·x).
 */
function erf(x: number): number {
  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + p * ax);
  const poly = a1 * t + a2 * t * t + a3 * t * t * t + a4 * t * t * t * t + a5 * t * t * t * t * t;
  return sign * (1 - poly * Math.exp(-ax * ax));
}

/** Standard normal CDF: Φ(z) = ½·(1 + erf(z/√2)). */
function normCdf(z: number): number {
  return 0.5 * (1 + erf(z / SQRT2));
}

/**
 * Inverse standard normal CDF (probit) — Abramowitz & Stegun 26.2.23
 * rational approximation, max error 4.5e-4.
 */
function normInv(p: number): number {
  const c0 = 2.515517;
  const c1 = 0.802853;
  const c2 = 0.010328;
  const d1 = 1.432788;
  const d2 = 0.189269;
  const d3 = 0.001308;
  const q = Math.min(Math.max(p, 1e-12), 1 - 1e-12);
  const t = q < 0.5 ? Math.sqrt(Math.log(1 / (q * q))) : Math.sqrt(Math.log(1 / ((1 - q) * (1 - q))));
  const z = t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
  return q < 0.5 ? -z : z;
}

const fmt = (n: number, digits = 6) => {
  if (!Number.isFinite(n)) return "–";
  return String(parseFloat(n.toFixed(digits)));
};

const ERRORS_KM: Record<string, string> = {
  "Standard deviation must be a positive number.": "គម្លាតស្ដង់ដារត្រូវតែជាចំនួនវិជ្ជមាន។",
  "Enter a valid value.": "សូមបញ្ចូលតម្លៃឱ្យបានត្រឹមត្រូវ។",
  "Probability must be between 0 and 100.": "ប្រូបាប៊ីលីតេត្រូវតែស្ថិតនៅចន្លោះ 0 និង 100។",
};

export default function ZScoreCalculator() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState("zscore:mode", "z");
  const [value, setValue] = useToolState("zscore:value", "85");
  const [mean, setMean] = useToolState("zscore:mean", "70");
  const [stddev, setStddev] = useToolState("zscore:stddev", "10");
  const [prob, setProb] = useToolState("zscore:prob", "93.3");

  const calc = useMemo(() => {
    const mu = Number(mean);
    const sigma = Number(stddev);
    if (!Number.isFinite(mu) || !Number.isFinite(sigma) || sigma <= 0) {
      return { error: "Standard deviation must be a positive number.", z: null };
    }
    if (mode === "z") {
      const x = Number(value);
      if (!Number.isFinite(x)) return { error: "Enter a valid value.", z: null };
      const z = (x - mu) / sigma;
      const phi = normCdf(z);
      return {
        error: null,
        z,
        prob: phi * 100,
        percentile: phi * 100,
        rightTail: (1 - phi) * 100,
        impliedValue: null,
      };
    }
    const p = Number(prob);
    if (!Number.isFinite(p) || p <= 0 || p >= 100) {
      return { error: "Probability must be between 0 and 100.", z: null };
    }
    const z = normInv(p / 100);
    return {
      error: null,
      z,
      prob: p,
      percentile: p,
      rightTail: 100 - p,
      impliedValue: mu + z * sigma,
    };
  }, [mode, value, mean, stddev, prob]);

  // Normal-curve SVG: plot φ(z) over [−4, 4] and shade the left tail up to z.
  const svg = useMemo(() => {
    if (calc.z === null) return null;
    const W = 340;
    const H = 170;
    const pad = 12;
    const xMin = -4;
    const xMax = 4;
    const yMax = 0.42;
    const sx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * (W - 2 * pad);
    const sy = (y: number) => H - pad - (y / yMax) * (H - 2 * pad);
    const zClamped = Math.max(xMin, Math.min(xMax, calc.z));
    let curve = "";
    let area = "";
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + ((xMax - xMin) * i) / steps;
      const y = INV_SQRT_2PI * Math.exp((-x * x) / 2);
      curve += `${i === 0 ? "M" : "L"} ${sx(x).toFixed(1)} ${sy(y).toFixed(1)} `;
    }
    area = `M ${sx(xMin).toFixed(1)} ${sy(0).toFixed(1)} `;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + ((zClamped - xMin) * i) / steps;
      const y = INV_SQRT_2PI * Math.exp((-x * x) / 2);
      area += `L ${sx(x).toFixed(1)} ${sy(y).toFixed(1)} `;
    }
    area += `L ${sx(zClamped).toFixed(1)} ${sy(0).toFixed(1)} Z`;
    return { W, H, curve, area, sx, sy, zX: sx(zClamped), zClamped };
  }, [calc.z]);

  return (
    <ToolShell
      title="Z-Score & Normal Distribution"
      khmerTitle="Z-Score និងការចែកចាយធម្មតា"
      description="Compute the z-score of a value, its cumulative probability and percentile, or invert a probability back into a z-score, with a normal-curve chart."
      descriptionKm="គណនា z-score នៃតម្លៃ ប្រូបាប៊ីលីតេប្រមូល និងភាគរយ ឬបម្លែងប្រូបាប៊ីលីតេត្រឡប់ជា z-score ជាមួយក្រាហ្វខ្សែកោងធម្មតា។"
    >
      <Row>
        <Field label={t("Direction", "ទិសដៅ")}>
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="z">{t("Value → z-score", "តម្លៃ → z-score")}</option>
            <option value="p">{t("Probability → z-score", "ប្រូបាប៊ីលីតេ → z-score")}</option>
          </Select>
        </Field>
        {mode === "z" ? (
          <Field label={t("Value (x)", "តម្លៃ (x)")}>
            <TextInput inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className="font-mono-ui" />
          </Field>
        ) : (
          <Field label={t("Cumulative probability (%)", "ប្រូបាប៊ីលីតេប្រមូល (%)")}>
            <TextInput inputMode="decimal" value={prob} onChange={(e) => setProb(e.target.value)} className="font-mono-ui" />
          </Field>
        )}
        <Field label={t("Mean (μ)", "មធ្យម (μ)")}>
          <TextInput inputMode="decimal" value={mean} onChange={(e) => setMean(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Std dev (σ)", "គម្លាតស្ដង់ដារ (σ)")}>
          <TextInput inputMode="decimal" value={stddev} onChange={(e) => setStddev(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>

      {calc.z !== null ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">z-score</div>
              <div className="mt-1 font-mono-ui text-lg font-semibold text-[var(--gold)]">{fmt(calc.z)}</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Cumulative Φ(z)", "ប្រមូល Φ(z)")}</div>
              <div className="mt-1 font-mono-ui text-lg font-semibold text-[var(--ink)]">{fmt(calc.prob / 100)}</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Percentile", "ភាគរយ")}</div>
              <div className="mt-1 font-mono-ui text-lg font-semibold text-[var(--ink)]">{fmt(calc.percentile)}%</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Right tail", "កន្ទុយស្ដាំ")}</div>
              <div className="mt-1 font-mono-ui text-lg font-semibold text-[var(--gold)]">{fmt(calc.rightTail)}%</div>
            </div>
          </div>

          {calc.impliedValue !== null && (
            <Output label={t("Implied value (x = μ + z·σ)", "តម្លៃបង្កប់ (x = μ + z·σ)")} value={fmt(calc.impliedValue)} />
          )}

          {svg && (
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <svg viewBox={`0 0 ${svg.W} ${svg.H}`} width="100%" height="auto" role="img" aria-label="Standard normal curve with shaded left tail">
                <path d={svg.area} fill="var(--gold)" opacity="0.35" />
                <path d={svg.curve} fill="none" stroke="var(--ink)" strokeWidth="1.5" />
                <line x1={svg.zX} y1="0" x2={svg.zX} y2={svg.H} stroke="var(--gold)" strokeWidth="1.5" strokeDasharray="4 3" />
              </svg>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm font-medium text-[var(--gold)]">{t(calc.error, ERRORS_KM[calc.error] ?? calc.error)}</p>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "z = (x − μ) / σ; cumulative probability Φ(z) = ½(1 + erf(z/√2)) via the Abramowitz & Stegun 7.1.26 approximation; the inverse uses the 26.2.23 rational approximation.",
          "z = (x − μ) / σ; ប្រូបាប៊ីលីតេប្រមូល Φ(z) = ½(1 + erf(z/√2)) តាមរយៈការប៉ាន់ស្មាន Abramowitz & Stegun 7.1.26; ប្រភេទបញ្ច្រាសប្រើការប៉ាន់ស្មានសមហេតុផល 26.2.23។"
        )}
      </p>
    </ToolShell>
  );
}
