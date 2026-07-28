"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function DateDifferenceCalculator() {
  const [start, setStart] = useToolState("date-difference-calculator:start", "2026-01-01");
  const [end, setEnd] = useToolState("date-difference-calculator:end", "2026-07-25");
  const a = new Date(start), b = new Date(end);
  const valid = !isNaN(a.getTime()) && !isNaN(b.getTime());
  const days = valid ? Math.round((b.getTime() - a.getTime()) / 86400000) : 0;

  return (
    <ToolShell title="Date Difference Calculator" description="Number of days, weeks, and years between two dates.">
      <Row>
        <Field label="Start date"><TextInput type="date" value={start} onChange={(e) => setStart(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="End date"><TextInput type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="Difference (days)" value={valid ? String(days) : ""} error={!valid} />
      <Output label="Difference (weeks)" value={valid ? (days / 7).toFixed(1) : ""} error={!valid} />
      <Output label="Difference (years)" value={valid ? (days / 365.25).toFixed(2) : ""} error={!valid} />
    </ToolShell>
  );
}
