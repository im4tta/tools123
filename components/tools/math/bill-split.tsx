"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

interface State {
  bill: number;
  tipPercent: number;
  people: number;
}

export default function BillSplitTool() {
  const [s, setS] = useToolState<State>("bill-split", { bill: 42, tipPercent: 10, people: 3 });
  const update = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }));

  const { tipAmount, total, perPerson } = useMemo(() => {
    const tip = s.bill * (s.tipPercent / 100);
    const grandTotal = s.bill + tip;
    const people = Math.max(1, s.people);
    return { tipAmount: tip, total: grandTotal, perPerson: grandTotal / people };
  }, [s.bill, s.tipPercent, s.people]);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <ToolShell title="Tip & Bill Split Calculator" description="Add a tip percentage to a bill and split the total evenly across a group.">
      <Row>
        <Field label="Bill amount">
          <TextInput type="number" value={s.bill} onChange={(e) => update({ bill: Number(e.target.value) })} />
        </Field>
        <Field label="Tip %">
          <TextInput type="number" value={s.tipPercent} onChange={(e) => update({ tipPercent: Number(e.target.value) })} />
        </Field>
      </Row>
      <Field label="Number of people">
        <TextInput type="number" min={1} value={s.people} onChange={(e) => update({ people: Number(e.target.value) })} className="w-32" />
      </Field>
      <Output
        label="Breakdown"
        mono={false}
        value={`Tip amount: ${fmt(tipAmount)}\nGrand total: ${fmt(total)}\nPer person: ${fmt(perPerson)}`}
      />
    </ToolShell>
  );
}
