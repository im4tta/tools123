"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function med(arr: number[]): number {
  const n = arr.length;
  const mid = Math.floor(n / 2);
  return n % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

function analyze(nums: number[]) {
  const sorted = [...nums].sort((a, b) => a - b);
  const n = sorted.length;
  const q2 = med(sorted);
  const mid = Math.floor(n / 2);
  const lower = sorted.slice(0, mid);
  const upper = sorted.slice(n % 2 ? mid + 1 : mid);
  const q1 = med(lower);
  const q3 = med(upper);
  const iqr = q3 - q1;
  const loFence = q1 - 1.5 * iqr;
  const hiFence = q3 + 1.5 * iqr;
  const mean = nums.reduce((s, x) => s + x, 0) / n;
  return {
    sorted,
    count: n,
    min: sorted[0],
    max: sorted[n - 1],
    mean,
    q1,
    q2,
    q3,
    iqr,
    loFence,
    hiFence,
    outliers: sorted.filter((v) => v < loFence || v > hiFence),
  };
}

const STATS: { key: "count" | "min" | "max" | "mean" | "q1" | "q2" | "q3" | "iqr" | "loFence" | "hiFence"; label: [string, string]; fmt: (n: number) => string }[] = [
  { key: "count", label: ["Count", "ចំនួនទិន្នន័យ"], fmt: (n) => String(n) },
  { key: "min", label: ["Min", "អប្បបរមា"], fmt: (n) => String(n) },
  { key: "max", label: ["Max", "អតិបរមា"], fmt: (n) => String(n) },
  { key: "mean", label: ["Mean", "មធ្យម"], fmt: (n) => n.toFixed(4) },
  { key: "q1", label: ["Q1 (lower quartile)", "Q1 (ត្រីមាសទាប)"], fmt: (n) => String(n) },
  { key: "q2", label: ["Q2 (median)", "Q2 (មេដ្យាន)"], fmt: (n) => String(n) },
  { key: "q3", label: ["Q3 (upper quartile)", "Q3 (ត្រីមាសលើ)"], fmt: (n) => String(n) },
  { key: "iqr", label: ["IQR (Q3 − Q1)", "IQR (Q3 − Q1)"], fmt: (n) => String(n) },
  { key: "loFence", label: ["Lower fence", "របងក្រោម"], fmt: (n) => n.toFixed(4) },
  { key: "hiFence", label: ["Upper fence", "របងលើ"], fmt: (n) => n.toFixed(4) },
];

export default function QuartileOutlierAnalyzer() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("quartile-outlier:input", "10, 12, 14, 15, 18, 21, 22, 24, 27, 58");

  const data = useMemo(() => {
    const nums = input
      .split(/[,\s]+/)
      .map(Number)
      .filter((n) => !Number.isNaN(n));
    if (nums.length < 2) return null;
    return analyze(nums);
  }, [input]);

  return (
    <ToolShell
      title="Quartile & Outlier Analyzer"
      khmerTitle="វិភាគ Quartile និង Outlier"
      description="Paste a list of numbers to get Q1/Q2/Q3, IQR, min, max, mean and outliers flagged by Tukey's 1.5×IQR fence rule, with a sorted table."
      descriptionKm="បិទភ្ជាប់បញ្ជីលេខ ដើម្បីទទួលបាន Q1/Q2/Q3, IQR, អប្បបរមា, អតិបរមា, មធ្យម និងចំណុចខុសប្រក្រតីតាមច្បាប់របង 1.5×IQR របស់ Tukey ជាមួយតារាងតម្រៀប។"
    >
      <Field label={t("Numbers", "លេខ")} hint={t("separated by commas or spaces", "ញែកដោយក្បៀស ឬដកឃ្លា")}>
        <TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" />
      </Field>

      {data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {STATS.map((s) => (
              <div key={s.key} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5">
                <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t(s.label[0], s.label[1])}</div>
                <div className="mt-1 font-mono-ui text-sm text-[var(--ink)]">{s.fmt(data[s.key])}</div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--ground-line)] bg-[var(--ground-raised)] text-left text-xs uppercase tracking-wide text-[var(--ink-dim)]">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">{t("Value (sorted)", "តម្លៃ (តម្រៀប)")}</th>
                  <th className="px-3 py-2">{t("Status", "ស្ថានភាព")}</th>
                </tr>
              </thead>
              <tbody>
                {data.sorted.map((v, i) => {
                  const isOut = data.outliers.includes(v);
                  return (
                    <tr key={i} className={`border-b border-[var(--ground-line)] last:border-0 ${isOut ? "bg-[var(--danger)]/10" : ""}`}>
                      <td className="px-3 py-2 font-mono-ui text-[var(--ink-dim)]">{i + 1}</td>
                      <td className={`px-3 py-2 font-mono-ui ${isOut ? "font-semibold text-[var(--danger)]" : "text-[var(--ink)]"}`}>{v}</td>
                      <td className="px-3 py-2 text-xs">
                        {isOut ? (
                          <span className="rounded-full border border-[var(--danger)]/50 px-2 py-0.5 text-[var(--danger)]">
                            {t("outlier", "ចំណុចខុសប្រក្រតី")}
                          </span>
                        ) : (
                          <span className="text-[var(--ink-dim)]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {data.outliers.length > 0 ? (
            <Output
              label={t("Outliers (Tukey 1.5×IQR fence)", "ចំណុចខុសប្រក្រតី (របង 1.5×IQR របស់ Tukey)")}
              value={data.outliers.join(", ")}
            />
          ) : (
            <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5 text-sm text-[var(--ink-dim)]">
              {t("No outliers detected by Tukey's fence rule.", "រកមិនឃើញចំណុចខុសប្រក្រតីតាមច្បាប់របងរបស់ Tukey ទេ។")}
            </p>
          )}

          <p className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
            {t(
              "Quartiles use the median-of-halves method (median of the lower and upper halves; the overall median is excluded when the count is odd). Outliers are flagged by John Tukey's fence rule (Exploratory Data Analysis, Addison-Wesley, 1977): values below Q1 − 1.5×IQR or above Q3 + 1.5×IQR.",
              "Quartile ប្រើវិធីមេដ្យាននៃពាក់កណ្តាលនីមួយៗ (មេដ្យាននៃពាក់កណ្តាលក្រោម និងលើ ដោយដកមេដ្យានកណ្តាលចេញនៅពេលចំនួនទិន្នន័យសេស)។ ចំណុចខុសប្រក្រតីត្រូវបានសម្គាល់តាមច្បាប់របងរបស់ John Tukey (Exploratory Data Analysis, Addison-Wesley, 1977): តម្លៃក្រោម Q1 − 1.5×IQR ឬលើស Q3 + 1.5×IQR។"
            )}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter at least two numbers.", "សូមបញ្ចូលយ៉ាងតិចពីរលេខ។")}</p>
      )}
    </ToolShell>
  );
}
