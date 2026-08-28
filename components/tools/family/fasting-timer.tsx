"use client";
import { useEffect, useState } from "react";
import { ToolShell, Field, Select, TextInput } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface FastLog {
  id: string;
  start: number;
  end: number;
  hours: number;
}

export default function FastingTimer() {
  const { text: t } = useLanguage();
  const [preset, setPreset] = useToolState("fasting:preset", "16:8");
  const [customFast, setCustomFast] = useToolState("fasting:custom", "16");
  const [phase, setPhase] = useToolState<"fasting" | "eating">("fasting:phase", "fasting");
  const [running, setRunning] = useToolState("fasting:running", false);
  const [elapsed, setElapsed] = useToolState("fasting:elapsed", 0);
  const [startedAt, setStartedAt] = useToolState<number | null>("fasting:startedAt", null);
  const [fastStartedAt, setFastStartedAt] = useToolState<number | null>("fasting:fastStartedAt", null);
  const [history, setHistory] = useToolState<FastLog[]>("fasting:history", []);
  const [now, setNow] = useState(() => Date.now());

  const fastHours = preset === "custom" ? Math.min(23, Math.max(1, Number(customFast) || 16)) : Number(preset.split(":")[0]);
  const eatHours = 24 - fastHours;
  const duration = (phase === "fasting" ? fastHours : eatHours) * 3600000;

  // Tick once per second while the clock is running.
  useEffect(() => {
    if (!running || startedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running, startedAt]);

  // Catch-up / phase-switch: when the current phase elapses, roll the
  // remainder into the next phase and log completed fasts automatically.
  useEffect(() => {
    if (!running || startedAt === null) return;
    const total = elapsed + (now - startedAt);
    if (total < duration) return;
    const over = total - duration;
    if (phase === "fasting" && fastStartedAt !== null) {
      setHistory((h) => [
        { id: `${fastStartedAt}-${Math.random().toString(36).slice(2, 8)}`, start: fastStartedAt, end: fastStartedAt + duration, hours: fastHours },
        ...h,
      ]);
    }
    setPhase(phase === "fasting" ? "eating" : "fasting");
    setElapsed(over % duration);
    setStartedAt(Date.now());
    if (phase === "eating") setFastStartedAt(Date.now());
  }, [running, startedAt, now, elapsed, phase, duration, fastHours, fastStartedAt, setHistory, setPhase, setElapsed, setStartedAt, setFastStartedAt]);

  const active = running && startedAt !== null;
  const displayElapsed = active ? elapsed + (now - startedAt) : elapsed;
  const remaining = Math.max(0, duration - displayElapsed);
  const pct = Math.min(100, (displayElapsed / duration) * 100);

  const fmt = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const fmtStamp = (ts: number) =>
    new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const start = () => {
    setRunning(true);
    setStartedAt(Date.now());
    if (phase === "fasting" && fastStartedAt === null) setFastStartedAt(Date.now());
  };

  const pause = () => {
    if (startedAt === null) {
      setRunning(false);
      return;
    }
    setElapsed(elapsed + (Date.now() - startedAt));
    setStartedAt(null);
    setRunning(false);
  };

  const reset = () => {
    setRunning(false);
    setStartedAt(null);
    setElapsed(0);
    setFastStartedAt(null);
    setPhase("fasting");
  };

  return (
    <ToolShell
      title="Intermittent Fasting Timer"
      khmerTitle="ម៉ោងតមអាហារ"
      description="Count down your fasting and eating windows for popular intermittent-fasting schedules."
      descriptionKm="រាប់ថយក្រោយម៉ោងតមអាហារ និងម៉ោងញ៉ាំអាហារ តាមកាលវិភាគតមអាហារពេញនិយម។"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("Schedule", "កាលវិភាគ")}>
          <Select value={preset} onChange={(e) => setPreset(e.target.value)}>
            <option value="16:8">16:8</option>
            <option value="18:6">18:6</option>
            <option value="20:4">20:4</option>
            <option value="custom">{t("Custom", "ផ្ទាល់ខ្លួន")}</option>
          </Select>
        </Field>
        {preset === "custom" && (
          <Field label={t("Fasting hours", "ចំនួនម៉ោងតម")} hint={t("1–23", "១–២៣")}>
            <TextInput inputMode="numeric" value={customFast} onChange={(e) => setCustomFast(e.target.value)} className="font-mono-ui" />
          </Field>
        )}
      </div>

      <div className="mx-auto max-w-md rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 text-center">
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-faint)]">
          {phase === "fasting" ? t("Fasting", "កំពុងតមអាហារ") : t("Eating window", "ម៉ោងញ៉ាំអាហារ")}
        </div>
        <div className="mt-2 font-mono-ui text-5xl tabular-nums text-[var(--ink)]">{fmt(remaining)}</div>
        <div className="mt-1 text-xs text-[var(--ink-dim)]">
          {t("Elapsed", "កន្លងផុត")}: {fmt(displayElapsed)} · {t("Total", "សរុប")}: {fmt(duration)}
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--ground-line)]">
          <div className="h-full rounded-full bg-[var(--gold)] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-5 flex justify-center gap-3">
          {active ? (
            <Button onClick={pause}>{t("Pause", "ផ្អាក")}</Button>
          ) : (
            <Button onClick={start}>{t("Start", "ចាប់ផ្តើម")}</Button>
          )}
          <Button onClick={reset} className="!bg-[var(--ground-raised)] !text-[var(--ink)]">
            {t("Reset", "កំណត់ឡើងវិញ")}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-[var(--ink)]">{t("History", "ប្រវត្តិ")}</h2>
          {history.length > 0 && (
            <Button onClick={() => setHistory([])} className="!bg-[var(--ground-raised)] !text-[var(--ink)] px-3 py-1 text-xs">
              {t("Clear", "សម្អាត")}
            </Button>
          )}
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)]">{t("No completed fasts logged yet.", "មិនទាន់មានការតមអាហារដែលបានកត់ត្រាទេ។")}</p>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 20).map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm">
                <span className="text-[var(--ink)]">{fmtStamp(h.start)} → {fmtStamp(h.end)}</span>
                <span className="font-mono-ui text-xs text-[var(--gold)]">{h.hours}h</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        {t("Fasting is a lifestyle choice, not a medical prescription. If you are pregnant, diabetic, or managing a health condition, talk to a doctor before fasting.", "ការតមអាហារជាជម្រើសរបៀបរស់នៅ មិនមែនជាវេជ្ជបញ្ជាទេ។ បើអ្នកមានផ្ទៃពោះ ទឹកនោមផ្អែម ឬកំពុងព្យាបាលជំងឺ សូមពិគ្រោះជាមួយគ្រូពេទ្យមុនពេលតមអាហារ។")}
      </p>
    </ToolShell>
  );
}
