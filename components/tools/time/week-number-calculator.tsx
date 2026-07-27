"use client";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function isoWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return { week: Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7), year: d.getUTCFullYear() };
}

export default function WeekNumberCalculator() {
  const [date, setDate] = useToolState("week-number-calculator:date", new Date().toISOString().slice(0, 10));
  const d = new Date(date);
  const valid = !isNaN(d.getTime());
  const result = valid ? isoWeek(d) : null;

  return (
    <ToolShell title="ISO Week Number Calculator" description="Finds the ISO-8601 week number for a given date.">
      <Field label="Date"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} className="font-mono-ui" /></Field>
      <Output label="ISO week" value={result ? `Week ${result.week}, ${result.year}` : ""} error={!valid} />
    </ToolShell>
  );
}
