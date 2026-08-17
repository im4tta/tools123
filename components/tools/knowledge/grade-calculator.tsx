"use client";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ToolShell, TextInput } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Row = { name: string; score: number; weight: number };

function gradeOf(pct: number): { letter: string; points: string } {
  if (pct >= 90) return { letter: "A", points: "4.00" };
  if (pct >= 80) return { letter: "B", points: "3.00" };
  if (pct >= 70) return { letter: "C", points: "2.00" };
  if (pct >= 60) return { letter: "D", points: "1.00" };
  return { letter: "F", points: "0.00" };
}

export default function GradeCalculator() {
  const { text: t } = useLanguage();
  const [rows, setRows] = useToolState<Row[]>("grade-calc:rows", [
    { name: "Midterm", score: 80, weight: 40 },
    { name: "Final", score: 90, weight: 60 },
  ]);

  const [newName, setNewName] = useState("");
  const [newScore, setNewScore] = useState("85");
  const [newWeight, setNewWeight] = useState("20");

  const calc = useMemo(() => {
    const totalWeight = rows.reduce((s, r) => s + (r.weight || 0), 0);
    const weighted = rows.reduce((s, r) => s + (r.score || 0) * (r.weight || 0), 0);
    const avg = totalWeight > 0 ? weighted / totalWeight : null;
    return { totalWeight, avg, grade: avg === null ? null : gradeOf(avg) };
  }, [rows]);

  const add = () => {
    const name = newName.trim() || `Item ${rows.length + 1}`;
    const score = Number(newScore);
    const weight = Number(newWeight);
    if (Number.isNaN(score) || Number.isNaN(weight)) return;
    setRows([...rows, { name, score, weight }]);
    setNewName("");
  };

  return (
    <ToolShell
      title="Grade Calculator"
      khmerTitle="គណនាពិន្ទុមធ្យម"
      description="Weighted final-grade planner for students — enter scores and weights to see your average, letter grade, and GPA points."
      descriptionKm="កម្មវិធីរៀបចំពិន្ទុថ្លឹងទម្ងន់សម្រាប់សិស្សនិស្សិត — បញ្ចូលពិន្ទុ និងទម្ងន់ ដើម្បីមើលពិន្ទុមធ្យម និងថ្នាក់អក្សរ។"
    >
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <TextInput className="flex-1" value={r.name} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            <TextInput className="w-20 text-right" inputMode="decimal" value={String(r.score)} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, score: Number(e.target.value) } : x)))} />
            <TextInput className="w-20 text-right" inputMode="decimal" value={String(r.weight)} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)))} />
            <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="rounded-md p-2 text-[var(--ink-faint)] transition hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <TextInput className="flex-1" placeholder={t("Item name", "ឈ្មោះ")} value={newName} onChange={(e) => setNewName(e.target.value)} />
        <TextInput className="w-20 text-right" inputMode="decimal" value={newScore} onChange={(e) => setNewScore(e.target.value)} />
        <TextInput className="w-20 text-right" inputMode="decimal" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} />
        <Button type="button" onClick={add}>
          <Plus size={15} className="mr-1 inline" />
          {t("Add", "បន្ថែម")}
        </Button>
      </div>
      <p className="text-xs text-[var(--ink-faint)]">{t("Name · Score % · Weight %", "ឈ្មោះ · ពិន្ទុ % · ទម្ងន់ %")}</p>

      {calc.avg !== null && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Weighted average", "ពិន្ទុមធ្យម")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{calc.avg.toFixed(2)}%</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Letter grade", "ថ្នាក់អក្សរ")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{calc.grade?.letter}</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("GPA points", "ពិន្ទុ GPA")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{calc.grade?.points}</div>
          </div>
        </div>
      )}
      {calc.avg !== null && calc.totalWeight > 0 && Math.abs(calc.totalWeight - 100) > 0.5 && (
        <p className="text-sm text-[var(--gold)]">
          {t("Note: weights total", "ចំណាំ៖ ទម្ងន់សរុប")} {calc.totalWeight}% — {t("not 100%.", "មិនមែន ១០០% ទេ។")}
        </p>
      )}
    </ToolShell>
  );
}