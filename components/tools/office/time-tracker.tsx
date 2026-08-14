"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Button, Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { recordExport } from "@/lib/export";

type TimerState = { activity: string; status: "idle" | "running" | "paused"; accumulatedMs: number; startedAt: number | null };
type Session = { id: string; activity: string; startedAt: string; endedAt: string; durationMs: number; manual: boolean };
type TrackerState = { timer: TimerState; sessions: Session[] };
const INITIAL: TrackerState = { timer: { activity: "", status: "idle", accumulatedMs: 0, startedAt: null }, sessions: [] };
const formatDuration = (ms: number) => {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  return [h, m, s].map((part) => String(part).padStart(2, "0")).join(":");
};
const csvCell = (value: unknown) => {
  let text = String(value ?? "");
  if (/^[\t\r ]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};
const downloadCsv = (sessions: Session[]) => {
  const rows = [["Activity", "Started", "Ended", "Duration seconds", "Entry type"], ...sessions.map((item) => [item.activity, item.startedAt, item.endedAt, Math.round(item.durationMs / 1000), item.manual ? "manual" : "timer"])];
  const content = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = "time-sessions.csv"; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  recordExport();
};

export default function TimeTracker() {
  const { text } = useLanguage();
  const [state, setState] = useToolState<TrackerState>("office-time-tracker", INITIAL);
  const [now, setNow] = useState(() => Date.now());
  const [manual, setManual] = useState({ activity: "", date: new Date().toISOString().slice(0, 10), minutes: "" });
  const [manualError, setManualError] = useState("");

  const running = state.timer.status === "running";
  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [running]);
  const elapsedMs = state.timer.accumulatedMs + (running && state.timer.startedAt ? Math.max(0, now - state.timer.startedAt) : 0);
  const totalMs = useMemo(() => state.sessions.reduce((sum, item) => sum + Math.max(0, item.durationMs), 0), [state.sessions]);

  function setActivity(activity: string) {
    setState((current) => ({ ...current, timer: { ...current.timer, activity } }));
  }
  function startOrResume() {
    if (!state.timer.activity.trim()) return;
    const timestamp = Date.now(); setNow(timestamp);
    setState((current) => ({ ...current, timer: { ...current.timer, activity: current.timer.activity.trim(), status: "running", startedAt: timestamp } }));
  }
  function pause() {
    const timestamp = Date.now(); setNow(timestamp);
    setState((current) => current.timer.status !== "running" || !current.timer.startedAt ? current : ({ ...current, timer: { ...current.timer, status: "paused", accumulatedMs: current.timer.accumulatedMs + Math.max(0, timestamp - current.timer.startedAt), startedAt: null } }));
  }
  function stop() {
    const ended = Date.now();
    const duration = state.timer.accumulatedMs + (running && state.timer.startedAt ? Math.max(0, ended - state.timer.startedAt) : 0);
    if (!state.timer.activity.trim() || duration < 1000) return;
    const session: Session = { id: crypto.randomUUID(), activity: state.timer.activity.trim(), startedAt: new Date(ended - duration).toISOString(), endedAt: new Date(ended).toISOString(), durationMs: duration, manual: false };
    setState((current) => ({ timer: INITIAL.timer, sessions: [session, ...current.sessions] })); setNow(ended);
  }
  function addManual(event: FormEvent) {
    event.preventDefault(); setManualError("");
    const minutes = Number(manual.minutes);
    if (!manual.activity.trim() || !manual.date || !Number.isFinite(minutes) || minutes <= 0 || minutes > 1440) {
      setManualError(text("Enter an activity, date, and 1–1,440 minutes.", "បញ្ចូលសកម្មភាព កាលបរិច្ឆេទ និងចន្លោះពី ១ ដល់ ១៤៤០ នាទី។")); return;
    }
    const started = new Date(`${manual.date}T12:00:00`);
    if (Number.isNaN(started.getTime())) { setManualError(text("Enter a valid date.", "បញ្ចូលកាលបរិច្ឆេទត្រឹមត្រូវ។")); return; }
    const durationMs = Math.round(minutes * 60_000);
    const session: Session = { id: crypto.randomUUID(), activity: manual.activity.trim(), startedAt: started.toISOString(), endedAt: new Date(started.getTime() + durationMs).toISOString(), durationMs, manual: true };
    setState((current) => ({ ...current, sessions: [session, ...current.sessions] }));
    setManual({ ...manual, activity: "", minutes: "" });
  }

  return (
    <ToolShell title="Time Tracker" khmerTitle="កម្មវិធីតាមដានពេលវេលា" description="Track named activities and keep a private work log in this browser." descriptionKm="តាមដានសកម្មភាពដែលមានឈ្មោះ និងរក្សាកំណត់ត្រាការងារឯកជនក្នុងកម្មវិធីរុករកនេះ។">
      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs text-[var(--ink-dim)]">{text("Local storage: the current timer and session log stay on this device. No data is sent anywhere.", "ការផ្ទុកក្នុងម៉ាស៊ីន៖ កម្មវិធីកំណត់ពេល និងកំណត់ត្រារក្សាទុកលើឧបករណ៍នេះ។ គ្មានទិន្នន័យត្រូវបានផ្ញើចេញទេ។")}</p>
      <div className="rounded-md border border-[var(--ground-line)] p-5 text-center">
        <div className="font-mono-ui text-4xl font-semibold tabular-nums text-[var(--ink)]" role="timer" aria-live="off">{formatDuration(elapsedMs)}</div>
        <div className="mx-auto mt-5 max-w-md text-left"><Field label="Current activity" labelKm="សកម្មភាពបច្ចុប្បន្ន"><TextInput value={state.timer.activity} onChange={(event) => setActivity(event.target.value)} placeholder={text("What are you working on?", "តើអ្នកកំពុងធ្វើអ្វី?")} disabled={running} /></Field></div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {state.timer.status !== "running" && <Button type="button" onClick={startOrResume} disabled={!state.timer.activity.trim()}>{state.timer.status === "paused" ? text("Resume", "បន្ត") : text("Start", "ចាប់ផ្តើម")}</Button>}
          {running && <Button type="button" onClick={pause}>{text("Pause", "ផ្អាក")}</Button>}
          <Button type="button" onClick={stop} disabled={elapsedMs < 1000}>{text("Stop & save", "បញ្ឈប់ និងរក្សាទុក")}</Button>
          <Button type="button" className="!bg-[var(--ground-raised)] !text-[var(--ink)]" onClick={() => setState((current) => ({ ...current, timer: INITIAL.timer }))} disabled={state.timer.status === "idle" && !state.timer.activity}>{text("Discard", "បោះបង់")}</Button>
        </div>
      </div>
      <Output label={text("Totals", "សរុប")} value={`${text("Sessions", "វគ្គ")}: ${state.sessions.length}\n${text("Recorded time", "ពេលវេលាបានកត់ត្រា")}: ${formatDuration(totalMs)}`} />
      <form onSubmit={addManual} className="space-y-4 rounded-md border border-[var(--ground-line)] p-4">
        <h2 className="font-medium text-[var(--ink)]">{text("Add a manual session", "បន្ថែមវគ្គដោយដៃ")}</h2>
        <Field label="Activity" labelKm="សកម្មភាព"><TextInput value={manual.activity} onChange={(event) => setManual({ ...manual, activity: event.target.value })} /></Field>
        <Row><Field label="Date" labelKm="កាលបរិច្ឆេទ"><TextInput type="date" value={manual.date} onChange={(event) => setManual({ ...manual, date: event.target.value })} /></Field><Field label="Minutes" labelKm="នាទី" hint="1–1,440"><TextInput type="number" min="1" max="1440" step="1" inputMode="numeric" value={manual.minutes} onChange={(event) => setManual({ ...manual, minutes: event.target.value })} /></Field></Row>
        {manualError && <p role="alert" className="text-sm text-[var(--danger)]">{manualError}</p>}<Button type="submit">{text("Add session", "បន្ថែមវគ្គ")}</Button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-medium text-[var(--ink)]">{text("Session log", "កំណត់ត្រាវគ្គ")}</h2><Button type="button" onClick={() => downloadCsv(state.sessions)} disabled={!state.sessions.length}>{text("Export safe CSV", "នាំចេញ CSV សុវត្ថិភាព")}</Button></div>
      <div className="space-y-3">
        {!state.sessions.length && <p className="py-5 text-center text-sm text-[var(--ink-dim)]">{text("No sessions recorded yet.", "មិនទាន់មានវគ្គបានកត់ត្រា។")}</p>}
        {state.sessions.map((session) => <article key={session.id} className="flex flex-col gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h3 className="break-words font-medium text-[var(--ink)]">{session.activity}</h3><p className="mt-1 text-xs text-[var(--ink-dim)]">{new Date(session.startedAt).toLocaleString()} · {session.manual ? text("Manual", "ដោយដៃ") : text("Timer", "កម្មវិធីកំណត់ពេល")}</p></div><div className="flex items-center gap-3"><span className="font-mono-ui text-sm text-[var(--ink)]">{formatDuration(session.durationMs)}</span><Button type="button" className="!bg-[var(--danger)] !px-3 !py-1.5 !text-white" onClick={() => setState((current) => ({ ...current, sessions: current.sessions.filter((item) => item.id !== session.id) }))}>{text("Delete", "លុប")}</Button></div></article>)}
      </div>
    </ToolShell>
  );
}
