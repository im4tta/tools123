"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field, Select } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function SleepCalculator() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState<"wake" | "sleep">("sleep-calculator:mode", "wake");
  const [time, setTime] = useToolState("sleep-calculator:time", "23:00");

  const results = useMemo(() => {
    const [h, m] = time.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return [];
    const base = new Date(2026, 0, 1, h, m, 0, 0);
    const cycle = 90 * 60 * 1000;
    const settle = 15 * 60 * 1000;
    const out: { label: string; time: string }[] = [];

    if (mode === "sleep") {
      // You want to sleep at `time`; show wake-up times after 3–6 cycles.
      for (let cycles = 3; cycles <= 6; cycles++) {
        const t = new Date(base.getTime() + cycles * cycle + settle);
        out.push({ label: `${cycles * 1.5}h (${cycles} cycles)`, time: t.toTimeString().slice(0, 5) });
      }
    } else {
      // You want to wake at `time`; show sleep times (working backwards).
      for (let cycles = 3; cycles <= 6; cycles++) {
        const t = new Date(base.getTime() - cycles * cycle - settle);
        out.push({ label: `${cycles * 1.5}h (${cycles} cycles)`, time: t.toTimeString().slice(0, 5) });
      }
    }
    return out;
  }, [time, mode]);

  return (
    <ToolShell
      title="Sleep Calculator"
      khmerTitle="គណនាម៉ោងគេង"
      description="Plan your sleep around 90-minute sleep cycles to wake up refreshed."
      descriptionKm="រៀបចំម៉ោងគេងដោយផ្អែកលើវដ្តគេង ៩០ នាទី ដើម្បីក្រោកឡើងមានអារម្មណ៍ស្រស់ស្រាយ។"
    >
      <Field label={t("Mode", "របៀប")}>
        <Select value={mode} onChange={(e) => setMode(e.target.value as "wake" | "sleep")} className="w-48">
          <option value="sleep">{t("I sleep at…", "ខ្ញុំចូលគេងនៅ…")}</option>
          <option value="wake">{t("I want to wake at…", "ខ្ញុំចង់ក្រោកនៅ…")}</option>
        </Select>
      </Field>
      <Field label={mode === "sleep" ? t("Bedtime", "ម៉ោងចូលគេង") : t("Wake time", "ម៉ោងក្រោក")}>
        <TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} className="font-mono-ui" />
      </Field>
      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((r) => (
            <div key={r.label} className="flex items-center justify-between rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2.5">
              <span className="text-xs text-[var(--ink-dim)]">{r.label}</span>
              <span className="font-mono-ui text-lg font-semibold text-[var(--gold)]">{r.time}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-[var(--ink-faint)]">
        {t("Based on 90-minute sleep cycles with ~15 minutes to fall asleep. Aim to wake at the end of a cycle.", "ផ្អែកលើវដ្តគេង ៩០ នាទី ដោយមាន ~១៥ នាទីដើម្បីដេកលក់។ គួរក្រោកនៅចុងបញ្ចប់នៃវដ្តគេង។")}
      </p>
    </ToolShell>
  );
}
