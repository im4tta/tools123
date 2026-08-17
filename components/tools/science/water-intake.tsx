"use client";
import { useState } from "react";
import { Droplets, Plus, RotateCcw, Minus } from "lucide-react";
import { ToolShell, Field, TextInput, Select } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const GOALS = [
  { key: "2", label: "2 L (~8 cups)", value: 2 },
  { key: "2.5", label: "2.5 L (~10 cups)", value: 2.5 },
  { key: "3", label: "3 L (~12 cups)", value: 3 },
];

export default function WaterIntake() {
  const { text: t } = useLanguage();
  const today = new Date().toISOString().slice(0, 10);
  const [day, setDay] = useToolState("water:day", today);
  const [goal, setGoal] = useToolState("water:goal", "2");
  const [amounts, setAmounts] = useToolState<number[]>("water:amounts", []);
  const [custom, setCustom] = useState("0.25");

  const total = amounts.reduce((s, x) => s + x, 0);
  const goalL = GOALS.find((g) => g.key === goal)?.value ?? 2;
  const pct = Math.min(100, (total / goalL) * 100);

  const add = (liters: number) => {
    setAmounts((prev) => [...prev, liters]);
    setDay(today);
  };

  const addCustom = () => {
    const v = Number(custom);
    if (Number.isNaN(v) || v <= 0) return;
    add(v);
  };

  const reset = () => {
    setAmounts([]);
    setDay(today);
  };

  const undrink = () => setAmounts((prev) => prev.slice(0, -1));

  return (
    <ToolShell
      title="Water Intake Tracker"
      khmerTitle="តាមដានការផឹកទឹក"
      description="Log how much water you drink each day and track progress toward your goal."
      descriptionKm="កត់ត្រាទឹកដែលអ្នកផឹកក្នុងមួយថ្ងៃ និងតាមដានវឌ្ឍនភាពឆ្ពោះទៅគោលដៅ។"
    >
      <Field label={t("Daily goal", "គោលដៅប្រចាំថ្ងៃ")}>
        <Select value={goal} onChange={(e) => setGoal(e.target.value)}>
          {GOALS.map((g) => (
            <option key={g.key} value={g.key}>
              {g.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="overflow-hidden rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]">
        <div className="h-3 w-full bg-[var(--ground-line)]/50">
          <div className="h-full bg-[var(--gold)] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-display text-2xl font-semibold text-[var(--ink)]">{total.toFixed(2)} L</span>
          <span className="text-sm text-[var(--ink-dim)]">
            {t("of", "ក្នុង")} {goalL} L · {pct.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[0.25, 0.5, 1].map((v) => (
          <Button key={v} type="button" onClick={() => add(v)}>
            <Plus size={14} className="mr-1 inline" /> +{v} L
          </Button>
        ))}
        <div className="flex items-center gap-2">
          <TextInput className="w-24" inputMode="decimal" value={custom} onChange={(e) => setCustom(e.target.value)} />
          <Button type="button" onClick={addCustom}>
            {t("Add", "បន្ថែម")}
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" onClick={undrink} className="flex-1">
          <Minus size={14} className="mr-1 inline" />
          {t("Undo last", "មិនកាត់ចុងក្រោយ")}
        </Button>
        <Button type="button" onClick={reset} className="flex-1">
          <RotateCcw size={14} className="mr-1 inline" />
          {t("Reset day", "កំណត់ថ្ងៃឡើងវិញ")}
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3 text-sm text-[var(--ink-dim)]">
        <Droplets size={16} className="text-[var(--gold)]" />
        {t("Logged", "បានកត់ត្រា")}: {amounts.length} {t("glass(es)", "កែវ")} · {day}
      </div>
    </ToolShell>
  );
}