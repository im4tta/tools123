"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function StatisticsCalculator() {
  const [input, setInput] = useToolState("statistics-calculator:input", "4, 8, 15, 16, 23, 42");

  const stats = useMemo(() => {
    const nums = input.split(/[,\s]+/).map(Number).filter((n) => !isNaN(n));
    if (nums.length === 0) return null;
    const sorted = [...nums].sort((a, b) => a - b);
    const sum = nums.reduce((s, n) => s + n, 0);
    const mean = sum / nums.length;
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const variance = nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length;
    const freq = new Map<number, number>();
    nums.forEach((n) => freq.set(n, (freq.get(n) ?? 0) + 1));
    const maxFreq = Math.max(...freq.values());
    const modes = maxFreq > 1 ? [...freq.entries()].filter(([, c]) => c === maxFreq).map(([v]) => v) : [];
    return { count: nums.length, sum, mean, median, stddev: Math.sqrt(variance), min: sorted[0], max: sorted[sorted.length - 1], modes };
  }, [input]);

  return (
    <ToolShell title="Mean / Median / Mode / StdDev Calculator" description="Enter numbers separated by commas or spaces.">
      <Field label="Numbers"><TextArea rows={3} value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" /></Field>
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            ["Count", stats.count], ["Sum", stats.sum], ["Mean", stats.mean.toFixed(4)],
            ["Median", stats.median], ["Std. deviation", stats.stddev.toFixed(4)],
            ["Range", `${stats.min} – ${stats.max}`],
            ["Mode(s)", stats.modes.length ? stats.modes.join(", ") : "none"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5">
              <div className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">{label}</div>
              <div className="mt-1 font-mono-ui text-[var(--ink)]">{value}</div>
            </div>
          ))}
        </div>
      )}
      <Output label="Status" value={stats ? "" : "Enter at least one number"} error={!stats} />
    </ToolShell>
  );
}
