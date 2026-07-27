"use client";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

export default function CalendarMonthGenerator() {
  const [month, setMonth] = useToolState("calendar-month-generator:month", new Date().toISOString().slice(0, 7));
  const [year, monthNum] = month.split("-").map(Number);
  const valid = !isNaN(year) && !isNaN(monthNum);

  function weeks() {
    const first = new Date(year, monthNum - 1, 1);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const startOffset = first.getDay();
    const cells: (number | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }

  return (
    <ToolShell title="Calendar Month Generator" description="Renders a plain calendar grid for any month.">
      <Field label="Month"><TextInput type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="font-mono-ui" /></Field>
      {valid && (
        <table className="w-full border-collapse text-center text-sm">
          <thead>
            <tr className="text-[var(--ink-faint)]">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => <th key={d} className="pb-2 font-normal">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {weeks().map((row, i) => (
              <tr key={i}>
                {row.map((d, j) => (
                  <td key={j} className="py-2">
                    {d && <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink)] hover:bg-[var(--ground-raised)]">{d}</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ToolShell>
  );
}
