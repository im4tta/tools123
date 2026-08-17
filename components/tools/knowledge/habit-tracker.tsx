"use client";
import { useState } from "react";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { ToolShell, TextInput } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Habit = { name: string; done: boolean; created: string };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function HabitTracker() {
  const { text: t } = useLanguage();
  const [habits, setHabits] = useToolState<Habit[]>("habit-tracker:habits", [
    { name: "Drink water", done: false, created: today() },
    { name: "Exercise 30 min", done: false, created: today() },
  ]);
  const [newHabit, setNewHabit] = useState("");
  const [currentDay] = useState(today());

  const toggle = (i: number) => {
    setHabits((prev) => prev.map((h, j) => (j === i ? { ...h, done: !h.done } : h)));
  };

  const add = () => {
    const name = newHabit.trim();
    if (!name) return;
    setHabits((prev) => [...prev, { name, done: false, created: currentDay }]);
    setNewHabit("");
  };

  const remove = (i: number) => {
    setHabits((prev) => prev.filter((_, j) => j !== i));
  };

  const doneCount = habits.filter((h) => h.done).length;

  return (
    <ToolShell
      title="Habit Tracker"
      khmerTitle="តាមដានទម្លាប់"
      description="Track daily habits and check them off as you complete them."
      descriptionKm="តាមដានទម្លាប់ប្រចាំថ្ងៃ ហើយធីកពេលធ្វើរួច។"
    >
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3">
        <span className="font-display text-2xl font-semibold text-[var(--ink)]">{doneCount}</span>
        <span className="ml-2 text-sm text-[var(--ink-dim)]">
          / {habits.length} {t("done today", "ធ្វើរួចថ្ងៃនេះ")}
        </span>
      </div>

      <div className="space-y-2">
        {habits.map((h, i) => (
          <div key={i} className="flex items-center gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3">
            <button type="button" onClick={() => toggle(i)} className="shrink-0 text-[var(--gold)] transition hover:scale-110">
              {h.done ? <CheckCircle2 size={22} /> : <Circle size={22} className="text-[var(--ink-faint)]" />}
            </button>
            <span className={`flex-1 text-sm ${h.done ? "text-[var(--ink-faint)] line-through" : "text-[var(--ink)]"}`}>{h.name}</span>
            <span className="text-xs text-[var(--ink-faint)]">{h.created}</span>
            <button type="button" onClick={() => remove(i)} className="rounded p-1 text-[var(--ink-faint)] transition hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {habits.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--ink-faint)]">{t("No habits yet — add one below.", "មិនទាន់មានទម្លាប់ទេ — បន្ថែមខាងក្រោម។")}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <TextInput placeholder={t("New habit", "ទម្លាប់ថ្មី")} value={newHabit} onChange={(e) => setNewHabit(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button type="button" onClick={add}>
          <Plus size={15} className="mr-1 inline" />
          {t("Add", "បន្ថែម")}
        </Button>
      </div>
    </ToolShell>
  );
}