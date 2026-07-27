"use client";
import { useEffect, useState } from "react";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";

export default function PomodoroTimer() {
  const [workMin, setWorkMin] = useState("25");
  const [breakMin, setBreakMin] = useState("5");
  const [secondsLeft, setSecondsLeft] = useState(Number(workMin) * 60);
  const [phase, setPhase] = useState<"work" | "break">("work");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          const nextPhase = phase === "work" ? "break" : "work";
          setPhase(nextPhase);
          return (nextPhase === "work" ? Number(workMin) : Number(breakMin)) * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, phase, workMin, breakMin]);

  function reset() {
    setRunning(false);
    setPhase("work");
    setSecondsLeft(Number(workMin) * 60);
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <ToolShell title="Pomodoro Timer" description="Alternating work/break intervals for focused sessions.">
      <Row>
        <Field label="Work minutes"><TextInput value={workMin} onChange={(e) => { setWorkMin(e.target.value); if (phase === "work" && !running) setSecondsLeft(Number(e.target.value) * 60); }} className="font-mono-ui" /></Field>
        <Field label="Break minutes"><TextInput value={breakMin} onChange={(e) => setBreakMin(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <div className="text-center">
        <div className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">{phase === "work" ? "Focus" : "Break"}</div>
        <div className="font-mono-ui text-5xl text-[var(--ink)]">{mm}:{ss}</div>
      </div>
      <div className="flex justify-center gap-3">
        <Button onClick={() => setRunning((r) => !r)}>{running ? "Pause" : "Start"}</Button>
        <Button onClick={reset} className="!bg-[var(--ground-raised)] !text-[var(--ink)]">Reset</Button>
      </div>
    </ToolShell>
  );
}
