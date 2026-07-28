"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

interface State {
  start: string;
  end: string;
  unpaidBreakMinutes: number;
}

export default function ShiftDurationTool() {
  const [s, setS] = useToolState<State>("shift-duration", { start: "22:00", end: "06:30", unpaidBreakMinutes: 30 });
  const update = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => {
    const [sh, sm] = s.start.split(":").map(Number);
    const [eh, em] = s.end.split(":").map(Number);
    if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null;
    const startMin = sh * 60 + sm;
    let endMin = eh * 60 + em;
    const overnight = endMin <= startMin;
    if (overnight) endMin += 24 * 60;
    const rawMinutes = endMin - startMin;
    const netMinutes = Math.max(0, rawMinutes - s.unpaidBreakMinutes);
    return { overnight, rawMinutes, netMinutes };
  }, [s.start, s.end, s.unpaidBreakMinutes]);

  const fmt = (mins: number) => `${Math.floor(mins / 60)}h ${mins % 60}m`;

  return (
    <ToolShell
      title="Shift Duration Calculator"
      description="Work out how long a shift lasts, including shifts that cross midnight, minus an unpaid break."
    >
      <Row>
        <Field label="Start time">
          <TextInput type="time" value={s.start} onChange={(e) => update({ start: e.target.value })} />
        </Field>
        <Field label="End time">
          <TextInput type="time" value={s.end} onChange={(e) => update({ end: e.target.value })} />
        </Field>
      </Row>
      <Field label="Unpaid break (minutes)">
        <TextInput type="number" min={0} value={s.unpaidBreakMinutes} onChange={(e) => update({ unpaidBreakMinutes: Number(e.target.value) })} className="w-40" />
      </Field>
      <Output
        label="Result"
        mono={false}
        error={!result}
        value={
          result
            ? `${result.overnight ? "Overnight shift\n" : ""}Total time: ${fmt(result.rawMinutes)}\nNet worked (after break): ${fmt(result.netMinutes)}`
            : "Enter valid start and end times"
        }
      />
    </ToolShell>
  );
}
