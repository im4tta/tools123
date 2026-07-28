"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }

export default function GcdLcm() {
  const [a, setA] = useToolState("gcd-lcm:a", "48");
  const [b, setB] = useToolState("gcd-lcm:b", "18");
  const x = Math.abs(Math.trunc(Number(a)));
  const y = Math.abs(Math.trunc(Number(b)));
  const valid = !isNaN(x) && !isNaN(y) && x > 0 && y > 0;
  const g = valid ? gcd(x, y) : 0;
  const l = valid ? (x / g) * y : 0;

  return (
    <ToolShell title="GCD & LCM Calculator" description="Greatest common divisor and least common multiple of two integers.">
      <Row>
        <Field label="A"><TextInput value={a} onChange={(e) => setA(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="B"><TextInput value={b} onChange={(e) => setB(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="GCD" value={valid ? String(g) : ""} error={!valid} />
      <Output label="LCM" value={valid ? String(l) : ""} error={!valid} />
    </ToolShell>
  );
}
