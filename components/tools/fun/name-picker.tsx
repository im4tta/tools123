"use client";
import { useMemo, useState } from "react";
import { Shuffle } from "lucide-react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

export default function NamePicker() {
  const { text: t } = useLanguage();
  const [list, setList] = useState("");
  const [winner, setWinner] = useState<string | null>(null);
  const [spin, setSpin] = useState(false);

  const names = useMemo(() => list.split(/\n|,/).map((s) => s.trim()).filter(Boolean), [list]);

  function pick() {
    if (names.length === 0) return;
    setSpin(true);
    let i = 0;
    const interval = setInterval(() => {
      setWinner(names[Math.floor(Math.random() * names.length)]);
      i++;
      if (i >= 15) {
        clearInterval(interval);
        setSpin(false);
      }
    }, 80);
  }

  return (
    <ToolShell
      title="Random Name Picker"
      khmerTitle="ជ្រើសរើសឈ្មោះចៃដន្យ"
      description="Paste a list of names (one per line or comma-separated) and pick a random winner."
      descriptionKm="បិទភ្ជាប់បញ្ជីឈ្មោះ (មួយក្នុងមួយបន្ទាត់ ឬបំបែកដោយសញ្ញាក្បៀស) ហើយជ្រើសរើសអ្នកឈ្នះចៃដន្យ។"
    >
      <Field label={t("Names", "ឈ្មោះ")}>
        <TextArea rows={8} value={list} onChange={(e) => setList(e.target.value)} placeholder={"Sokha\nDara\nRotha\nBopha"} />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={pick}
          disabled={names.length === 0 || spin}
          className="flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40"
        >
          <Shuffle size={15} /> {spin ? t("Picking…", "កំពុងជ្រើស…") : t("Pick a winner", "ជ្រើសរើសអ្នកឈ្នះ")}
        </button>
        {names.length > 0 && (
          <span className="text-xs text-[var(--ink-faint)]">{t(`${names.length} names`, `${names.length} ឈ្មោះ`)}</span>
        )}
      </div>

      {winner && (
        <div className="rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-6 text-center">
          <div className="text-4xl">🎉</div>
          <div className="mt-2 font-display text-2xl font-bold text-[var(--ink)]">{winner}</div>
          <div className="text-xs text-[var(--ink-dim)]">{t("Winner", "អ្នកឈ្នះ")}</div>
        </div>
      )}
    </ToolShell>
  );
}
