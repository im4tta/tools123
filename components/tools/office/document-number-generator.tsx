"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

interface State {
  prefix: string;
  year: string;
  start: number;
  count: number;
  digits: number;
  separator: string;
}

export default function DocumentNumberGeneratorTool() {
  const [s, setS] = useToolState<State>("document-number-generator", {
    prefix: "INV",
    year: String(new Date().getFullYear()),
    start: 1,
    count: 10,
    digits: 4,
    separator: "-",
  });
  const update = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }));

  const list = useMemo(() => {
    const n = Math.max(1, Math.min(500, s.count));
    return Array.from({ length: n }, (_, i) => {
      const seq = String(s.start + i).padStart(Math.max(1, s.digits), "0");
      return [s.prefix, s.year, seq].filter(Boolean).join(s.separator);
    }).join("\n");
  }, [s.prefix, s.year, s.start, s.count, s.digits, s.separator]);

  return (
    <ToolShell
      title="Document / Invoice Number Generator"
      description="Generate a sequential run of formatted reference numbers — invoices, purchase orders, contract addenda, site memos — with a consistent prefix and year."
    >
      <Row>
        <Field label="Prefix">
          <TextInput value={s.prefix} onChange={(e) => update({ prefix: e.target.value })} />
        </Field>
        <Field label="Year / tag">
          <TextInput value={s.year} onChange={(e) => update({ year: e.target.value })} />
        </Field>
      </Row>
      <Row>
        <Field label="Start at">
          <TextInput type="number" min={0} value={s.start} onChange={(e) => update({ start: Number(e.target.value) })} />
        </Field>
        <Field label="How many">
          <TextInput type="number" min={1} max={500} value={s.count} onChange={(e) => update({ count: Number(e.target.value) })} />
        </Field>
      </Row>
      <Row>
        <Field label="Zero-pad digits">
          <TextInput type="number" min={1} max={8} value={s.digits} onChange={(e) => update({ digits: Number(e.target.value) })} />
        </Field>
        <Field label="Separator">
          <TextInput value={s.separator} onChange={(e) => update({ separator: e.target.value })} />
        </Field>
      </Row>
      <Output label="Generated numbers" value={list} />
    </ToolShell>
  );
}
