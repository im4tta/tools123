"use client";
import { ToolShell, TextInput, Field, Row, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function PercentageCalculator() {
  const [mode, setMode] = useToolState<"of" | "isWhat" | "change">("percentage-calculator:mode", "of");
  const [a, setA] = useToolState("percentage-calculator:a", "15");
  const [b, setB] = useToolState("percentage-calculator:b", "200");

  function result() {
    const x = Number(a), y = Number(b);
    if (isNaN(x) || isNaN(y)) return "";
    if (mode === "of") return `${((x / 100) * y).toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
    if (mode === "isWhat") return y !== 0 ? `${((x / y) * 100).toLocaleString(undefined, { maximumFractionDigits: 4 })}%` : "";
    return y !== 0 ? `${(((y - x) / x) * 100).toLocaleString(undefined, { maximumFractionDigits: 4 })}%` : "";
  }

  return (
    <ToolShell title="Percentage Calculator" description="Three common percentage questions in one tool.">
      <Field label="Mode">
        <Select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
          <option value="of">A% of B</option>
          <option value="isWhat">A is what % of B</option>
          <option value="change">% change from A to B</option>
        </Select>
      </Field>
      <Row>
        <Field label="A"><TextInput value={a} onChange={(e) => setA(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="B"><TextInput value={b} onChange={(e) => setB(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="Result" value={result()} />
    </ToolShell>
  );
}
