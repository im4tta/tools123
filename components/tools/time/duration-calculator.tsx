"use client";
import { useMemo, useState } from "react";
import { ToolShell, TextInput, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";

interface Line {
  id: number;
  h: number;
  m: number;
  s: number;
  op: "+" | "-";
}

export default function DurationCalculatorTool() {
  const [lines, setLines] = useState<Line[]>([
    { id: 1, h: 2, m: 30, s: 0, op: "+" },
    { id: 2, h: 0, m: 45, s: 0, op: "+" },
  ]);
  const [nextId, setNextId] = useState(3);

  const totalSeconds = useMemo(
    () =>
      lines.reduce((acc, l) => {
        const secs = l.h * 3600 + l.m * 60 + l.s;
        return acc + (l.op === "+" ? secs : -secs);
      }, 0),
    [lines]
  );

  const negative = totalSeconds < 0;
  const abs = Math.abs(totalSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;

  function update(id: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { id: nextId, h: 0, m: 0, s: 0, op: "+" }]);
    setNextId((n) => n + 1);
  }

  function removeLine(id: number) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <ToolShell
      title="Duration Adder / Subtractor"
      description="Add or subtract a list of HH:MM:SS durations to get a running total — useful for timesheets or stacked timers."
    >
      <div className="space-y-3">
        {lines.map((l) => (
          <div key={l.id} className="flex items-center gap-2">
            <Select value={l.op} onChange={(e) => update(l.id, { op: e.target.value as "+" | "-" })} className="w-16">
              <option value="+">+</option>
              <option value="-">−</option>
            </Select>
            <TextInput type="number" min={0} value={l.h} onChange={(e) => update(l.id, { h: Number(e.target.value) })} className="w-20" />
            <span className="text-xs text-[var(--ink-faint)]">h</span>
            <TextInput type="number" min={0} max={59} value={l.m} onChange={(e) => update(l.id, { m: Number(e.target.value) })} className="w-20" />
            <span className="text-xs text-[var(--ink-faint)]">m</span>
            <TextInput type="number" min={0} max={59} value={l.s} onChange={(e) => update(l.id, { s: Number(e.target.value) })} className="w-20" />
            <span className="text-xs text-[var(--ink-faint)]">s</span>
            {lines.length > 1 && (
              <button
                onClick={() => removeLine(l.id)}
                className="ml-auto text-xs text-[var(--ink-faint)] hover:text-[var(--danger)]"
                aria-label="Remove line"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={addLine}
        className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs text-[var(--ink-dim)] hover:border-[var(--gold-dim)]"
      >
        + Add line
      </button>
      <Output
        label="Total"
        value={`${negative ? "-" : ""}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`}
      />
    </ToolShell>
  );
}
