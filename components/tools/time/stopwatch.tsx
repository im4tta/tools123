"use client";
import { useEffect, useRef, useState } from "react";
import { ToolShell } from "@/components/ui/Shell";
import { Button, Output } from "@/components/ui/Output";

export default function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const startRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now() - elapsed;
    const t = setInterval(() => setElapsed(Date.now() - startRef.current), 50);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function format(ms: number) {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  }

  return (
    <ToolShell title="Stopwatch" description="Simple stopwatch with lap tracking, running in your browser.">
      <div className="text-center font-mono-ui text-4xl text-[var(--ink)]">{format(elapsed)}</div>
      <div className="flex justify-center gap-3">
        <Button onClick={() => setRunning((r) => !r)}>{running ? "Pause" : "Start"}</Button>
        <Button onClick={() => setLaps((l) => [elapsed, ...l])} disabled={!running}>Lap</Button>
        <Button onClick={() => { setRunning(false); setElapsed(0); setLaps([]); }} className="!bg-[var(--ground-raised)] !text-[var(--ink)]">Reset</Button>
      </div>
      {laps.length > 0 && <Output label="Laps" value={laps.map((l, i) => `#${laps.length - i}  ${format(l)}`).join("\n")} />}
    </ToolShell>
  );
}
