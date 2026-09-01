"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const fmt = (n: number) => String(Math.round(n * 1e6) / 1e6);

export default function StatisticsCalculator() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("statistics-calculator:input", "4, 8, 15, 16, 23, 42");

  const stats = useMemo(() => {
    const tokens = input.split(/[,\s;]+/).map((s) => s.trim()).filter(Boolean);
    const nums = tokens.map(Number).filter((n) => !isNaN(n));
    if (nums.length === 0) return null;
    const sorted = [...nums].sort((a, b) => a - b);
    const count = nums.length;
    const sum = nums.reduce((acc, n) => acc + n, 0);
    const mean = sum / count;
    const mid = Math.floor(count / 2);
    const median = count % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const min = sorted[0];
    const max = sorted[count - 1];
    const range = max - min;
    const variance = count > 1 ? nums.reduce((acc, n) => acc + (n - mean) ** 2, 0) / (count - 1) : 0;
    const stddev = Math.sqrt(variance);
    const freq = new Map<number, number>();
    for (const n of nums) freq.set(n, (freq.get(n) ?? 0) + 1);
    const maxFreq = Math.max(...freq.values());
    const modes = maxFreq > 1 ? [...freq.entries()].filter(([, c]) => c === maxFreq).map(([v]) => v).sort((a, b) => a - b) : [];
    return { count, sum, mean, median, min, max, range, variance, stddev, modes, invalid: tokens.length - nums.length };
  }, [input]);

  const cards: [string, string][] = stats
    ? [
        [t("Count", "ចំនួន"), String(stats.count)],
        [t("Sum", "ផលបូក"), fmt(stats.sum)],
        [t("Mean", "មធ្យម"), fmt(stats.mean)],
        [t("Median", "មេដ្យាន"), fmt(stats.median)],
        [t("Mode(s)", "ម៉ូដ"), stats.modes.length ? stats.modes.join(", ") : t("none", "គ្មាន")],
        [t("Min", "អប្បបរមា"), fmt(stats.min)],
        [t("Max", "អតិបរមា"), fmt(stats.max)],
        [t("Range", "ជួរ"), fmt(stats.range)],
        [t("Variance (sample)", "វ៉ារ្យង់ (គំរូ)"), fmt(stats.variance)],
        [t("Std deviation (sample)", "គម្លាតស្តង់ដារ (គំរូ)"), fmt(stats.stddev)],
      ]
    : [];

  return (
    <ToolShell
      title="Statistics Calculator"
      khmerTitle="គណនាស្ថិតិ"
      description="Paste or type a list of numbers and get count, sum, mean, median, mode, min, max, range, sample variance and sample standard deviation."
      descriptionKm="បិទភ្ជាប់ ឬវាយបញ្ចូលបញ្ជីលេខ រួចទទួលបានចំនួន ផលបូក មធ្យម មេដ្យាន ម៉ូដ អប្បបរមា អតិបរមា ជួរ វ៉ារ្យង់គំរូ និងគម្លាតស្តង់ដារគំរូ។"
    >
      <Field label={t("Numbers", "លេខ")} hint={t("comma, space or newline separated", "បំបែកដោយក្បៀស ដកឃ្លា ឬបន្ទាត់ថ្មី")}>
        <TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" placeholder="4, 8, 15, 16, 23, 42" />
      </Field>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {cards.map(([label, value]) => (
            <div key={label} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5">
              <div className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">{label}</div>
              <div className="mt-1 break-all font-mono-ui text-[var(--ink)]">{value}</div>
            </div>
          ))}
        </div>
      )}

      {stats && stats.invalid > 0 && (
        <p className="text-xs text-[var(--ink-faint)]">
          {t(`${stats.invalid} token(s) ignored (not numeric)`, `${stats.invalid} ធាតុត្រូវបានរំលង (មិនមែនជាលេខ)`)}
        </p>
      )}

      {!stats && <Output label={t("Status", "ស្ថានភាព")} value={t("Enter at least one number", "សូមបញ្ចូលយ៉ាងហោចណាស់លេខមួយ")} error />}

      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Variance and standard deviation use the sample formula (divide by n − 1, Bessel's correction).",
          "វ៉ារ្យង់ និងគម្លាតស្តង់ដារប្រើរូបមន្តគំរូ (ចែកនឹង n − 1, ការកែតម្រូវរបស់ Bessel)។"
        )}
      </p>
    </ToolShell>
  );
}
