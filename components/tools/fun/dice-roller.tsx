"use client";
import { useState } from "react";
import { Dices, Trash2 } from "lucide-react";
import { ToolShell, Field } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

const DICE = [4, 6, 8, 10, 12, 20, 100];

function rollDie(die: number): number {
  return Math.floor(Math.random() * die) + 1;
}

export default function DiceRoller() {
  const { text: t } = useLanguage();
  const [lastRoll, setLastRoll] = useState<{ die: number; value: number; total: number } | null>(null);
  const [history, setHistory] = useState<{ die: number; value: number }[]>([]);

  function roll(die: number) {
    const value = rollDie(die);
    setLastRoll({ die, value, total: value });
    setHistory((prev) => [{ die, value }, ...prev].slice(0, 20));
  }

  return (
    <ToolShell
      title="Dice Roller"
      khmerTitle="គ្រាប់ឡុកឡាក់"
      description="Roll a die — d4 through d100 — and keep a short history of your rolls."
      descriptionKm="គ្រវែងគ្រាប់ឡុកឡាក់ — ពី d4 ដល់ d100 — ហើយរក្សាប្រវត្តិការគ្រវែង។"
    >
      <Field label={t("Roll a die", "គ្រវែងគ្រាប់ឡុកឡាក់")}>
        <div className="flex flex-wrap gap-2">
          {DICE.map((die) => (
            <button
              key={die}
              type="button"
              onClick={() => roll(die)}
              className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--gold-dim)] hover:bg-[var(--ground-raised-hi)]"
            >
              <Dices size={15} className="text-[var(--gold)]" />d{die}
            </button>
          ))}
        </div>
      </Field>

      {lastRoll && (
        <div className="rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4 text-center">
          <span className="text-xs uppercase tracking-wide text-[var(--ink-dim)]">{t("You rolled", "អ្នកបានគ្រវែង")} d{lastRoll.die}</span>
          <div className="font-display text-5xl font-bold text-[var(--gold)]">{lastRoll.total}</div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("History", "ប្រវត្តិ")}</span>
            <button type="button" onClick={() => setHistory([])} className="flex items-center gap-1 text-xs text-[var(--ink-faint)] hover:text-[var(--danger)]">
              <Trash2 size={12} /> {t("Clear", "សម្អាត")}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <span key={i} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2.5 py-1 font-mono-ui text-xs text-[var(--ink)]">
                d{h.die} → {h.value}
              </span>
            ))}
          </div>
        </div>
      )}
    </ToolShell>
  );
}
