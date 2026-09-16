"use client";

// Benford's Law Analyzer — paste a set of numbers and compare their leading-digit
// distribution to Benford's law, P(d) = log10(1 + 1/d). Naturally occurring data
// that spans several orders of magnitude (populations, invoice amounts, physical
// constants…) tends to follow it, so a large deviation can be a prompt to look
// closer — it is a heuristic, never proof of anything. All maths runs locally.

import { useMemo } from "react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";
import { useToolState } from "@/lib/storage";

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
// Benford expected proportion for each leading digit d = log10(1 + 1/d).
const EXPECTED: Record<number, number> = Object.fromEntries(DIGITS.map((d) => [d, Math.log10(1 + 1 / d)]));
// Chi-square critical value, 8 degrees of freedom, alpha = 0.05.
const CHI2_CRIT = 15.507;

/** Extract the leading significant digit (1-9) from each number-like token. */
function leadingDigits(text: string): number[] {
  const out: number[] = [];
  const tokens = text.match(/-?\d[\d,]*\.?\d*/g) ?? [];
  for (const tok of tokens) {
    const cleaned = tok.replace(/[^0-9]/g, "");
    const first = cleaned.replace(/^0+/, "")[0];
    if (first && first !== "0") out.push(Number(first));
  }
  return out;
}

function fibonacciExample(): string {
  const nums: number[] = [1, 1];
  for (let i = 2; i < 50; i++) nums.push(nums[i - 1] + nums[i - 2]);
  return nums.join(", ");
}

export default function BenfordAnalyzer() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("benford-analyzer:input", "");

  const result = useMemo(() => {
    const digits = leadingDigits(input);
    const n = digits.length;
    const counts: Record<number, number> = Object.fromEntries(DIGITS.map((d) => [d, 0]));
    for (const d of digits) counts[d] += 1;
    const rows = DIGITS.map((d) => {
      const observed = counts[d];
      const observedPct = n ? (observed / n) * 100 : 0;
      const expectedPct = EXPECTED[d] * 100;
      return { d, observed, observedPct, expectedPct };
    });
    const chi2 = n
      ? DIGITS.reduce((sum, d) => {
          const expectedCount = EXPECTED[d] * n;
          return sum + (counts[d] - expectedCount) ** 2 / expectedCount;
        }, 0)
      : 0;
    const axisMax = Math.max(30.2, ...rows.map((r) => r.observedPct)) * 1.08;
    return { n, rows, chi2, axisMax };
  }, [input]);

  const loadExample = () => {
    setInput(fibonacciExample());
  };

  const conforms = result.chi2 <= CHI2_CRIT;

  return (
    <ToolShell
      title="Benford's Law Analyzer"
      khmerTitle="វិភាគច្បាប់ Benford"
      description="Paste a set of numbers and see how their first digits compare to Benford's law — the pattern where 1 leads about 30% of the time and 9 under 5% in many real-world datasets. Useful as a first-pass check on accounting, election, or survey data. It is a heuristic that flags datasets worth a closer look, not proof of fraud; many legitimate datasets do not follow it. Runs entirely in your browser."
      descriptionKm="បិទភ្ជាប់សំណុំលេខ ហើយមើលពីរបៀបដែលលេខដំបូងរបស់វាប្រៀបធៀបនឹងច្បាប់ Benford — គំរូដែលលេខ ១ នាំមុខប្រហែល ៣០% ហើយលេខ ៩ តិចជាង ៥% ក្នុងសំណុំទិន្នន័យជាក់ស្ដែងជាច្រើន។ មានប្រយោជន៍ជាការត្រួតពិនិត្យដំបូងលើទិន្នន័យគណនេយ្យ ការបោះឆ្នោត ឬការស្ទង់មតិ។ វាជាការប៉ាន់ស្មានដែលសម្គាល់ទិន្នន័យគួរពិនិត្យបន្ថែម មិនមែនជាភស្តុតាងនៃការក្លែងបន្លំទេ; ទិន្នន័យស្របច្បាប់ជាច្រើនក៏មិនអនុវត្តតាមវាដែរ។ ដំណើរការក្នុងកម្មវិធីរុករករបស់អ្នក។"
    >
      <Field label="Numbers" labelKm="លេខ" hint="Separated by spaces, commas, or new lines" hintKm="បំបែកដោយដកឃ្លា សញ្ញាក្បៀស ឬបន្ទាត់ថ្មី">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={5} />
      </Field>

      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ink-faint)]">
        <span>{result.n} {t("numbers detected", "លេខរកឃើញ")}</span>
        <button onClick={loadExample} className="hover:text-[var(--ink)]">{t("Load example (Fibonacci)", "ផ្ទុកឧទាហរណ៍ (Fibonacci)")}</button>
        {input && (
          <button onClick={() => setInput("")} className="hover:text-[var(--ink)]">{t("Clear", "សម្អាត")}</button>
        )}
      </div>

      {result.n === 0 ? (
        <p className="text-sm text-[var(--ink-faint)]">{t("Paste some numbers above to see their leading-digit distribution.", "បិទភ្ជាប់លេខខាងលើ ដើម្បីមើលការបែងចែកលេខនាំមុខ។")}</p>
      ) : (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">
              <span className="w-4" />
              <span className="flex-1">{t("Observed (bar) vs Benford expected (marker)", "ការសង្កេត (របារ) ធៀបនឹង Benford (សញ្ញា)")}</span>
              <span className="w-28 text-right">{t("obs · exp", "សង្កេត · រំពឹង")}</span>
            </div>
            {result.rows.map((r) => (
              <div key={r.d} className="flex items-center gap-3">
                <span className="w-4 text-center text-sm font-medium text-[var(--ink)]">{r.d}</span>
                <div className="relative h-5 flex-1 overflow-hidden rounded bg-[var(--ground-raised)]">
                  <div className="h-full rounded bg-[var(--gold)]" style={{ width: `${(r.observedPct / result.axisMax) * 100}%` }} />
                  <div
                    className="absolute top-0 h-full w-[2px] bg-[var(--ink)]"
                    style={{ left: `${(r.expectedPct / result.axisMax) * 100}%` }}
                    title={`${t("Benford expected", "Benford រំពឹង")}: ${r.expectedPct.toFixed(1)}%`}
                  />
                </div>
                <span className="w-28 text-right text-xs text-[var(--ink-dim)]">
                  {r.observedPct.toFixed(1)}% · {r.expectedPct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[var(--ink-dim)]">
                χ² = <span className="font-mono-ui text-[var(--ink)]">{result.chi2.toFixed(2)}</span> · {t("0.05 critical (df 8)", "តម្លៃវិបត្តិ 0.05 (df 8)")} = 15.51
              </span>
              <span className={conforms ? "text-[var(--success)]" : "text-[var(--danger)]"}>
                {conforms
                  ? t("Consistent with Benford's law", "ស្របនឹងច្បាប់ Benford")
                  : t("Deviates from Benford's law", "ខុសពីច្បាប់ Benford")}
              </span>
            </div>
            {result.n < 50 && (
              <p className="mt-2 text-xs text-[var(--ink-faint)]">
                {t(
                  "Small sample — Benford's law only holds meaningfully for large datasets spanning several orders of magnitude.",
                  "សំណាកតូច — ច្បាប់ Benford មានន័យតែសម្រាប់សំណុំទិន្នន័យធំដែលលាតសន្ធឹងច្រើនលំដាប់ប៉ុណ្ណោះ។",
                )}
              </p>
            )}
            <p className="mt-2 text-xs text-[var(--ink-faint)]">
              {t(
                "A deviation is a prompt to investigate, not evidence of fraud on its own. Bounded data (ages, prices with a fixed range, IDs) legitimately does not follow Benford's law.",
                "ភាពខុសគ្នាជាការជំរុញឲ្យស៊ើបអង្កេត មិនមែនជាភស្តុតាងនៃការក្លែងបន្លំដោយខ្លួនឯងទេ។ ទិន្នន័យមានព្រំដែន (អាយុ តម្លៃក្នុងចន្លោះថេរ លេខសម្គាល់) ស្របច្បាប់មិនអនុវត្តតាមច្បាប់ Benford ទេ។",
              )}
            </p>
          </div>
        </>
      )}

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
        <ul className="list-inside list-disc space-y-0.5">
          <li>
            {t("Implements Benford's law, P(d) = log10(1 + 1/d) — first noted by Simon Newcomb (1881) and popularised by Frank Benford (1938):", "អនុវត្តច្បាប់ Benford, P(d) = log10(1 + 1/d) — កត់សម្គាល់ដំបូងដោយ Simon Newcomb (១៨៨១) និងធ្វើឲ្យល្បីដោយ Frank Benford (១៩៣៨)៖")}{" "}
            <a className="underline" href="https://en.wikipedia.org/wiki/Benford%27s_law" target="_blank" rel="noreferrer">Benford&apos;s law</a>
          </li>
          <li>{t("Original Tools123 implementation. The χ² critical value 15.51 is the standard value for 8 degrees of freedom at α = 0.05.", "ការសរសេរដើមរបស់ Tools123។ តម្លៃវិបត្តិ χ² 15.51 ជាតម្លៃស្ដង់ដារសម្រាប់សេរីភាព ៨ ដឺក្រេ នៅ α = 0.05។")}</li>
        </ul>
      </div>
    </ToolShell>
  );
}
