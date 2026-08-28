"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const EPS = 1e-9;

function parseTerms(raw: string): number[] | null {
  const nums = raw.split(/[,\s;]+/).filter((s) => s !== "").map(Number);
  if (nums.length === 0 || nums.some((n) => !Number.isFinite(n))) return null;
  return nums;
}

type Result =
  | { ok: true; kind: "ap" | "gp"; a1: number; diff: number | null; ratio: number | null; nth: number; sum: number; formulaN: string; formulaS: string }
  | { ok: false; error: string };

const ERRORS_KM: Record<string, string> = {
  "n must be a positive integer.": "n ត្រូវតែជាចំនួនគត់វិជ្ជមាន។",
  "Enter valid numbers for the first term and the common difference.": "សូមបញ្ចូលតួទីមួយ និងផលសងធម្មតាឱ្យបានត្រឹមត្រូវ។",
  "Enter valid numbers for the first term and the common ratio.": "សូមបញ្ចូលតួទីមួយ និងសមាមាត្រធម្មតាឱ្យបានត្រឹមត្រូវ។",
  "Enter at least 2 terms separated by commas.": "សូមបញ្ចូលយ៉ាងតិច ២ តួ បំបែកដោយក្បៀស។",
  "The terms are neither arithmetic (constant difference) nor geometric (constant ratio).":
    "តួទាំងនេះមិនមែនជាលំដាប់នព្វន្ត (ផលសងថេរ) ឬធរណីមាត្រ (សមាមាត្រថេរ) ទេ។",
};

function apResult(a1: number, d: number, n: number): Result {
  const nth = a1 + (n - 1) * d;
  const sum = (n / 2) * (2 * a1 + (n - 1) * d);
  return {
    ok: true,
    kind: "ap",
    a1,
    diff: d,
    ratio: null,
    nth,
    sum,
    formulaN: `aₙ = a₁ + (n − 1)·d = ${a1} + (${n} − 1)·${d}`,
    formulaS: `Sₙ = n/2·(2a₁ + (n − 1)·d) = ${n}/2·(2·${a1} + (${n} − 1)·${d})`,
  };
}

function gpResult(a1: number, r: number, n: number): Result {
  const nth = a1 * Math.pow(r, n - 1);
  const sum = r === 1 ? n * a1 : (a1 * (1 - Math.pow(r, n))) / (1 - r);
  return {
    ok: true,
    kind: "gp",
    a1,
    diff: null,
    ratio: r,
    nth,
    sum,
    formulaN: `aₙ = a₁·rⁿ⁻¹ = ${a1}·${r}^(${n} − 1)`,
    formulaS: r === 1 ? `Sₙ = n·a₁ = ${n}·${a1}` : `Sₙ = a₁·(1 − rⁿ)/(1 − r) = ${a1}·(1 − ${r}^${n})/(1 − ${r})`,
  };
}

export default function SequenceSolver() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState("sequence:mode", "ap");
  const [first, setFirst] = useToolState("sequence:first", "3");
  const [diff, setDiff] = useToolState("sequence:diff", "2");
  const [ratio, setRatio] = useToolState("sequence:ratio", "2");
  const [n, setN] = useToolState("sequence:n", "5");
  const [terms, setTerms] = useToolState("sequence:terms", "3, 6, 12, 24");

  const result = useMemo((): Result => {
    const nNum = Number(n);
    if (!Number.isInteger(nNum) || nNum < 1) {
      return { ok: false, error: "n must be a positive integer." };
    }
    if (mode === "ap") {
      const a1 = Number(first);
      const d = Number(diff);
      if (!Number.isFinite(a1) || !Number.isFinite(d)) {
        return { ok: false, error: "Enter valid numbers for the first term and the common difference." };
      }
      return apResult(a1, d, nNum);
    }
    if (mode === "gp") {
      const a1 = Number(first);
      const r = Number(ratio);
      if (!Number.isFinite(a1) || !Number.isFinite(r)) {
        return { ok: false, error: "Enter valid numbers for the first term and the common ratio." };
      }
      return gpResult(a1, r, nNum);
    }
    // Auto-detect from a few given terms.
    const nums = parseTerms(terms);
    if (!nums || nums.length < 2) {
      return { ok: false, error: "Enter at least 2 terms separated by commas." };
    }
    const a1 = nums[0];
    const diffs = nums.slice(1).map((v, i) => v - nums[i]);
    const isAP = diffs.every((d) => Math.abs(d - diffs[0]) < EPS);
    if (isAP) return apResult(a1, diffs[0], nNum);
    const ratios = nums.slice(1).map((v, i) => (nums[i] === 0 ? NaN : v / nums[i]));
    const isGP = ratios.every((r) => Number.isFinite(r) && Math.abs(r - ratios[0]) < EPS);
    if (isGP) return gpResult(a1, ratios[0], nNum);
    return {
      ok: false,
      error: "The terms are neither arithmetic (constant difference) nor geometric (constant ratio).",
    };
  }, [mode, first, diff, ratio, n, terms]);

  const preview = useMemo(() => {
    if (!result.ok) return "";
    const items: string[] = [];
    for (let i = 0; i < Math.min(6, Number(n)); i++) {
      items.push(
        result.kind === "ap"
          ? String(result.a1 + i * (result.diff ?? 0))
          : String(result.a1 * Math.pow(result.ratio ?? 1, i))
      );
    }
    return items.join(", ") + (Number(n) > 6 ? ", …" : "");
  }, [result, n]);

  return (
    <ToolShell
      title="Arithmetic & Geometric Sequences"
      khmerTitle="លំដាប់ស្វ័យគុណនព្វន្ត និងធរណីមាត្រ"
      description="Compute the n-th term and the sum of the first n terms of an arithmetic or geometric sequence, or auto-detect the sequence type from given terms."
      descriptionKm="គណនាតួទី n និងផលបូកនៃតួ n ដំបូងនៃលំដាប់នព្វន្ត ឬធរណីមាត្រ ឬស្វ័យប្រវត្តិកម្មរកប្រភេទលំដាប់ពីតួដែលផ្ដល់ឱ្យ។"
    >
      <Row>
        <Field label={t("Mode", "របៀប")}>
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="ap">{t("Arithmetic (AP)", "នព្វន្ត (AP)")}</option>
            <option value="gp">{t("Geometric (GP)", "ធរណីមាត្រ (GP)")}</option>
            <option value="detect">{t("Auto-detect from terms", "ស្វែងរកដោយស្វ័យប្រវត្តិពីតួ")}</option>
          </Select>
        </Field>
        <Field label={t("n (term index)", "n (លេខរៀងតួ)")}>
          <TextInput inputMode="numeric" value={n} onChange={(e) => setN(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>

      {mode === "ap" && (
        <Row>
          <Field label={t("First term (a₁)", "តួទីមួយ (a₁)")}>
            <TextInput inputMode="decimal" value={first} onChange={(e) => setFirst(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label={t("Common difference (d)", "ផលសងធម្មតា (d)")}>
            <TextInput inputMode="decimal" value={diff} onChange={(e) => setDiff(e.target.value)} className="font-mono-ui" />
          </Field>
        </Row>
      )}
      {mode === "gp" && (
        <Row>
          <Field label={t("First term (a₁)", "តួទីមួយ (a₁)")}>
            <TextInput inputMode="decimal" value={first} onChange={(e) => setFirst(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label={t("Common ratio (r)", "សមាមាត្រធម្មតា (r)")}>
            <TextInput inputMode="decimal" value={ratio} onChange={(e) => setRatio(e.target.value)} className="font-mono-ui" />
          </Field>
        </Row>
      )}
      {mode === "detect" && (
        <Field label={t("Given terms (comma separated)", "តួដែលផ្ដល់ឱ្យ (បំបែកដោយក្បៀស)")}>
          <TextInput inputMode="text" value={terms} onChange={(e) => setTerms(e.target.value)} className="font-mono-ui" />
        </Field>
      )}

      {result.ok ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Sequence type", "ប្រភេទលំដាប់")}</div>
              <div className="mt-1 text-lg font-semibold text-[var(--gold)]">
                {result.kind === "ap" ? t("Arithmetic", "នព្វន្ត") : t("Geometric", "ធរណីមាត្រ")}
              </div>
              <div className="mt-1 text-xs text-[var(--ink-dim)]">
                {result.diff !== null ? `${t("d", "d")} = ${result.diff}` : `${t("r", "r")} = ${result.ratio}`}
              </div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("First terms", "តួដំបូងៗ")}</div>
              <div className="mt-1 break-all font-mono-ui text-sm leading-relaxed text-[var(--ink)]">{preview}</div>
            </div>
          </div>
          <Output label={t("n-th term (aₙ)", "តួទី n (aₙ)")} value={`${result.formulaN}  =  ${result.nth}`} />
          <Output label={t("Sum of first n terms (Sₙ)", "ផលបូកតួ n ដំបូង (Sₙ)")} value={`${result.formulaS}  =  ${result.sum}`} />
        </>
      ) : (
        <p className="text-sm font-medium text-[var(--gold)]">{t(result.error, ERRORS_KM[result.error] ?? result.error)}</p>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Arithmetic: aₙ = a₁ + (n−1)·d and Sₙ = n/2·(2a₁ + (n−1)·d). Geometric: aₙ = a₁·rⁿ⁻¹ and Sₙ = a₁·(1−rⁿ)/(1−r) for r ≠ 1, else Sₙ = n·a₁.",
          "នព្វន្ត៖ aₙ = a₁ + (n−1)·d និង Sₙ = n/2·(2a₁ + (n−1)·d)។ ធរណីមាត្រ៖ aₙ = a₁·rⁿ⁻¹ និង Sₙ = a₁·(1−rⁿ)/(1−r) សម្រាប់ r ≠ 1, បើមិនដូច្នោះ Sₙ = n·a₁។"
        )}
      </p>
    </ToolShell>
  );
}
