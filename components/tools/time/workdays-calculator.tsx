"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function WorkdaysCalculator() {
  const [start, setStart] = useToolState("workdays-calculator:start", "2026-07-01");
  const [end, setEnd] = useToolState("workdays-calculator:end", "2026-07-31");
  const a = new Date(start), b = new Date(end);
  const valid = !isNaN(a.getTime()) && !isNaN(b.getTime()) && b >= a;

  function count() {
    let workdays = 0;
    const d = new Date(a);
    while (d <= b) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) workdays++;
      d.setDate(d.getDate() + 1);
    }
    return workdays;
  }

  return (
    <ToolShell title="Business Days Calculator" description="Counts weekdays (Mon–Fri) between two dates, inclusive.">
      <Row>
        <Field label="Start date"><TextInput type="date" value={start} onChange={(e) => setStart(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="End date"><TextInput type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="Business days" value={valid ? String(count()) : ""} error={!valid} />
    </ToolShell>
  );
}
