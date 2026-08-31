"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type SegmentKind = "warmup" | "work" | "rest" | "cooldown";

type Segment = { kind: SegmentKind; dur: number; round?: number };

const PRESETS = [
  { name: "Tabata 20/10", work: 20, rest: 10 },
  { name: "30/30", work: 30, rest: 30 },
  { name: "45/15", work: 45, rest: 15 },
];

/** Short, subtle confirmation beep using Web Audio. */
function beep() {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    osc.onended = () => {
      void ctx.close();
    };
  } catch {
    // Audio unavailable — ignore.
  }
}

export default function HiitTimer() {
  const { text: t } = useLanguage();
  const [work, setWork] = useToolState("hiit-timer:work", "20");
  const [rest, setRest] = useToolState("hiit-timer:rest", "10");
  const [rounds, setRounds] = useToolState("hiit-timer:rounds", "8");
  const [warmup, setWarmup] = useToolState("hiit-timer:warmup", "0");
  const [cooldown, setCooldown] = useToolState("hiit-timer:cooldown", "0");
  const [running, setRunning] = useState(false);
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(0);
  const endRef = useRef(0);
  const remainRef = useRef(0);

  const segments = useMemo<Segment[]>(() => {
    const w = Math.max(1, Math.floor(Number(work)) || 1);
    const r = Math.max(0, Math.floor(Number(rest)) || 0);
    const n = Math.max(1, Math.floor(Number(rounds)) || 1);
    const wu = Math.max(0, Math.floor(Number(warmup)) || 0);
    const cd = Math.max(0, Math.floor(Number(cooldown)) || 0);
    const segs: Segment[] = [];
    if (wu > 0) segs.push({ kind: "warmup", dur: wu });
    for (let i = 1; i <= n; i++) {
      segs.push({ kind: "work", dur: w, round: i });
      if (i < n) segs.push({ kind: "rest", dur: r });
    }
    if (cd > 0) segs.push({ kind: "cooldown", dur: cd });
    return segs;
  }, [work, rest, rounds, warmup, cooldown]);

  const seg = idx < segments.length ? segments[idx] : null;
  const done = idx >= segments.length;
  const shownSeconds = done ? 0 : seg ? (running || idx > 0 || left > 0 ? left : seg.dur) : 0;

  useEffect(() => {
    if (!running) return;
    setLeft(Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000)));
    const id = window.setInterval(() => {
      const remain = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
      setLeft(remain);
      if (remain <= 0) {
        if (idx + 1 < segments.length) {
          setIdx(idx + 1);
          endRef.current = Date.now() + segments[idx + 1].dur * 1000;
          beep();
        } else {
          setRunning(false);
          setIdx(segments.length);
          beep();
        }
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [running, idx, segments]);

  const toggle = () => {
    if (running) {
      remainRef.current = Math.max(0, endRef.current - Date.now());
      setRunning(false);
      return;
    }
    if (done) {
      setIdx(0);
      setLeft(segments[0].dur);
      endRef.current = Date.now() + segments[0].dur * 1000;
      setRunning(true);
      beep();
      return;
    }
    const remaining = remainRef.current > 0 ? remainRef.current : left * 1000;
    endRef.current = Date.now() + (remaining > 0 ? remaining : segments[idx].dur * 1000);
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setIdx(0);
    remainRef.current = 0;
    setLeft(segments[0]?.dur ?? 0);
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setWork(String(p.work));
    setRest(String(p.rest));
  };

  const totalSec = segments.reduce((s, x) => s + x.dur, 0);
  const progress = done
    ? 100
    : !running && idx === 0 && left === 0
      ? 0
      : ((idx + (seg ? 1 - left / seg.dur : 0)) / segments.length) * 100;

  const phaseLabel =
    seg?.kind === "work"
      ? t("WORK", "ហាត់")
      : seg?.kind === "rest"
        ? t("REST", "សម្រាក")
        : seg?.kind === "warmup"
          ? t("WARM-UP", "កម្តៅសាច់ដុំ")
          : seg?.kind === "cooldown"
            ? t("COOL-DOWN", "បន្ធូរសាច់ដុំ")
            : done
              ? t("COMPLETE!", "បញ្ចប់ហើយ!")
              : t("READY", "ត្រៀម");

  return (
    <ToolShell
      title="HIIT Interval Timer"
      khmerTitle="កម្មវិធីរាប់ម៉ោង HIIT"
      description="Interval timer with work/rest phases, rounds, and optional warm-up and cool-down."
      descriptionKm="កម្មវិធីរាប់ម៉ោងហាត់ប្រាណ ជាមួយដំណាក់កាលហាត់/សម្រាក ចំនួនជុំ និងកម្តៅសាច់ដុំ និងបន្ធូរសាច់ដុំ តាមតម្រូវការ។"
    >
      <Row>
        <Field label={t("Work (seconds)", "ហាត់ (វិនាទី)")}>
          <TextInput inputMode="numeric" value={work} onChange={(e) => setWork(e.target.value)} />
        </Field>
        <Field label={t("Rest (seconds)", "សម្រាក (វិនាទី)")}>
          <TextInput inputMode="numeric" value={rest} onChange={(e) => setRest(e.target.value)} />
        </Field>
        <Field label={t("Rounds", "ចំនួនជុំ")}>
          <TextInput inputMode="numeric" value={rounds} onChange={(e) => setRounds(e.target.value)} />
        </Field>
        <Field label={t("Warm-up (seconds)", "កម្តៅសាច់ដុំ (វិនាទី)")}>
          <TextInput inputMode="numeric" value={warmup} onChange={(e) => setWarmup(e.target.value)} />
        </Field>
        <Field label={t("Cool-down (seconds)", "បន្ធូរសាច់ដុំ (វិនាទី)")}>
          <TextInput inputMode="numeric" value={cooldown} onChange={(e) => setCooldown(e.target.value)} />
        </Field>
      </Row>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
          {t("Presets", "លំនាំដើម")}:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => applyPreset(p)}
            className="rounded-full border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1 text-xs text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className={`font-display text-2xl font-semibold ${seg?.kind === "work" ? "text-[var(--gold)]" : "text-[var(--ink)]"}`}>
            {phaseLabel}
          </div>
          {seg?.round && (
            <div className="text-sm text-[var(--ink-dim)]">
              {t("Round", "ជុំទី")} {seg.round}/{rounds}
            </div>
          )}
        </div>
        <div className="mt-2 font-display text-6xl font-semibold tabular-nums text-[var(--ink)]">
          {shownSeconds}
          <span className="text-lg text-[var(--ink-dim)]">s</span>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--ground-line)]">
          <div
            className="h-full rounded-full bg-[var(--gold)] transition-all duration-200"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-[var(--ink-dim)]">
          <span>
            {t("Total", "សរុប")}: {Math.floor(totalSec / 60)}:{String(totalSec % 60).padStart(2, "0")}
          </span>
          <span>
            {t("Progress", "វឌ្ឍនភាព")}: {Math.round(progress)}%
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={toggle}>
          {running
            ? t("Pause", "ផ្អាក")
            : done
              ? t("Start again", "ចាប់ផ្ដើមម្ដងទៀត")
              : t("Start", "ចាប់ផ្ដើម")}
        </Button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--gold)]"
        >
          {t("Reset", "កំណត់ឡើងវិញ")}
        </button>
      </div>
    </ToolShell>
  );
}
