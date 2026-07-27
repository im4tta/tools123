"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }

export default function RatioSimplifier() {
  const [a, setA] = useToolState("ratio-simplifier:a", "24");
  const [b, setB] = useToolState("ratio-simplifier:b", "36");
  const x = Math.trunc(Number(a)), y = Math.trunc(Number(b));
  const valid = !isNaN(x) && !isNaN(y) && x !== 0 && y !== 0;
  const g = valid ? gcd(Math.abs(x), Math.abs(y)) : 1;

  return (
    <ToolShell title="Ratio Simplifier" description="Reduces a ratio to its simplest whole-number form.">
      <Row>
        <Field label="A"><TextInput value={a} onChange={(e) => setA(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="B"><TextInput value={b} onChange={(e) => setB(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="Simplified ratio" value={valid ? `${x / g} : ${y / g}` : ""} error={!valid} />
    </ToolShell>
  );
}
