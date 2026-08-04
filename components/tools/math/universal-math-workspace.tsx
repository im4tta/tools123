"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Calculator, Clock3, Copy, History, Percent, Ruler } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { UNIT_CATEGORY_FACTORS } from "./unit-pair";

type Category = keyof typeof UNIT_CATEGORY_FACTORS;
const CATEGORY_LABELS: Record<Category, string> = { length: "Length", mass: "Mass", volume: "Volume", area: "Area", speed: "Speed", pressure: "Pressure", energy: "Energy", power: "Power", data: "Data", time: "Time" };
const UNIT_ALIASES: Record<string, [Category, string]> = {
  m: ["length", "meter"], meter: ["length", "meter"], meters: ["length", "meter"], km: ["length", "kilometer"], cm: ["length", "centimeter"], mm: ["length", "millimeter"], ft: ["length", "foot"], in: ["length", "inch"], mi: ["length", "mile"],
  g: ["mass", "gram"], kg: ["mass", "kilogram"], lb: ["mass", "pound"], oz: ["mass", "ounce"],
  l: ["volume", "liter"], liter: ["volume", "liter"], ml: ["volume", "milliliter"], gal: ["volume", "gallon"],
  s: ["time", "second"], sec: ["time", "second"], min: ["time", "minute"], h: ["time", "hour"], hr: ["time", "hour"], day: ["time", "day"],
  b: ["data", "byte"], kb: ["data", "kilobyte"], mb: ["data", "megabyte"], gb: ["data", "gigabyte"],
};

function format(value: number) { return Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 8 }) : "—"; }

export default function UniversalMathWorkspace() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("math-workspace:input", "25% of 480");
  const [category, setCategory] = useState<Category>("length");
  const [from, setFrom] = useState("meter");
  const [value, setValue] = useState("100");
  const [history, setHistory] = useToolState<string[]>("math-workspace:history", []);

  const parsed = useMemo(() => {
    const q = input.trim();
    if (!q) return null;
    const percent = q.match(/^([\d.]+)%\s+of\s+([\d.]+)$/i);
    if (percent) { const result = Number(percent[1]) * Number(percent[2]) / 100; return { kind: "Percentage", result: `${percent[1]}% of ${percent[2]} = ${format(result)}`, related: [`Decimal: ${format(Number(percent[1]) / 100)}`, `Fraction: ${percent[1]}/100`] }; }
    const fraction = q.match(/^(-?[\d.]+)\s*\/\s*(-?[\d.]+)$/);
    if (fraction && Number(fraction[2]) !== 0) { const n = Number(fraction[1]), d = Number(fraction[2]), decimal = n / d; return { kind: "Fraction", result: `${n}/${d} = ${format(decimal)}`, related: [`Percent: ${format(decimal * 100)}%`, `Ratio: ${n}:${d}`] }; }
    const duration = q.match(/^(?:(\d+(?:\.\d+)?)h)?\s*(?:(\d+(?:\.\d+)?)m)?$/i);
    if (duration && (duration[1] || duration[2]) && q.includes("h")) { const hours = Number(duration[1] || 0) + Number(duration[2] || 0) / 60; return { kind: "Duration", result: `${format(hours)} hours`, related: [`${format(hours * 60)} minutes`, `${format(hours * 3600)} seconds`] }; }
    const unit = q.match(/^(-?[\d.]+)\s*([a-z]+)$/i);
    if (unit && UNIT_ALIASES[unit[2].toLowerCase()]) { const [cat, source] = UNIT_ALIASES[unit[2].toLowerCase()]; const base = Number(unit[1]) * UNIT_CATEGORY_FACTORS[cat][source]; const outputs = Object.entries(UNIT_CATEGORY_FACTORS[cat]).slice(0, 8).map(([name, factor]) => `${name}: ${format(base / factor)}`); return { kind: CATEGORY_LABELS[cat], result: `${unit[1]} ${unit[2]} =`, related: outputs }; }
    return null;
  }, [input]);

  const factors = UNIT_CATEGORY_FACTORS[category];
  const base = Number(value) * (factors[from] ?? 1);
  const conversions = Object.entries(factors).map(([unit, factor]) => ({ unit, result: base / factor }));
  const runInput = () => { if (input.trim()) setHistory((prev) => [input.trim(), ...prev.filter((x) => x !== input.trim())].slice(0, 10)); };

  return <ToolShell title="Universal Math Workspace" khmerTitle="កន្លែងធ្វើការគណិតវិទ្យាសកល" description="Parse natural math input and convert one value to every compatible unit in a single workspace." descriptionKm="បញ្ចូលលំហាត់គណិតវិទ្យាតាមភាសាធម្មតា និងបម្លែងតម្លៃទៅគ្រប់ឯកតាដែលពាក់ព័ន្ធក្នុងទំព័រតែមួយ។">
    <div className="space-y-5">
      <section className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
        <div className="mb-3 flex items-center gap-2"><Calculator size={16} className="text-[var(--gold)]" /><h2 className="font-semibold text-[var(--ink)]">{t("Smart calculation input", "បញ្ចូលការគណនាឆ្លាតវៃ")}</h2></div>
        <div className="flex gap-2"><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runInput()} placeholder="25% of 480 · 3/8 · 100m · 2h30m" className="w-full rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-3 font-mono-ui text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" /><button onClick={runInput} className="rounded-lg bg-[var(--gold)] px-4 text-sm font-semibold text-[#0a0c0d]">Run</button></div>
        {parsed ? <div className="mt-4 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-[var(--gold)]">{parsed.kind}</div><div className="mt-1 text-lg font-bold text-[var(--ink)]">{parsed.result}</div><div className="mt-3 grid gap-1 text-xs text-[var(--ink-dim)]">{parsed.related.map((line) => <div key={line}>{line}</div>)}</div></div> : <p className="mt-3 text-xs text-[var(--ink-faint)]">Try natural input such as `25% of 480`, `3/8`, `100m`, or `2h30m`.</p>}
      </section>

      <section className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5"><div className="mb-3 flex items-center gap-2"><Ruler size={16} className="text-[var(--teal)]" /><h2 className="font-semibold text-[var(--ink)]">{t("Universal converter", "កម្មវិធីបម្លែងសកល")}</h2></div><div className="grid gap-3 sm:grid-cols-3"><select value={category} onChange={(e) => { const next = e.target.value as Category; setCategory(next); setFrom(Object.keys(UNIT_CATEGORY_FACTORS[next])[0]); }} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-sm text-[var(--ink)]">{Object.keys(UNIT_CATEGORY_FACTORS).map((key) => <option key={key} value={key}>{CATEGORY_LABELS[key as Category]}</option>)}</select><select value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-sm text-[var(--ink)]">{Object.keys(factors).map((unit) => <option key={unit}>{unit}</option>)}</select><input value={value} onChange={(e) => setValue(e.target.value)} type="number" className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 font-mono-ui text-sm text-[var(--ink)]" /></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{conversions.map((conversion) => <div key={conversion.unit} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-3"><div className="text-xs text-[var(--ink-faint)]">{conversion.unit}</div><div className="mt-1 font-mono-ui font-bold text-[var(--ink)]">{format(conversion.result)}</div></div>)}</div></section>

      {history.length > 0 && <section className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]"><History size={14} className="text-[var(--gold)]" />{t("Calculation history", "ប្រវត្តិការគណនា")}</div><div className="flex flex-wrap gap-2">{history.map((entry) => <button key={entry} onClick={() => setInput(entry)} className="rounded-md border border-[var(--ground-line)] px-2.5 py-1 text-xs text-[var(--ink-dim)] hover:text-[var(--ink)]">{entry}</button>)}</div></section>}
    </div>
  </ToolShell>;
}
