"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function TriangleSolver() {
  const [a, setA] = useToolState("triangle-solver:a", "3");
  const [b, setB] = useToolState("triangle-solver:b", "4");
  const A = Number(a), B = Number(b);
  const valid = !isNaN(A) && !isNaN(B) && A > 0 && B > 0;
  const c = valid ? Math.sqrt(A * A + B * B) : 0;
  const angleA = valid ? (Math.atan(A / B) * 180) / Math.PI : 0;
  const angleB = valid ? 90 - angleA : 0;

  return (
    <ToolShell title="Right Triangle Solver" description="Given the two legs, finds the hypotenuse and both acute angles.">
      <Row>
        <Field label="Leg A"><TextInput value={a} onChange={(e) => setA(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Leg B"><TextInput value={b} onChange={(e) => setB(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="Hypotenuse (C)" value={valid ? c.toFixed(4) : ""} error={!valid} />
      <Output label="Angle opposite A / opposite B" value={valid ? `${angleA.toFixed(2)}° / ${angleB.toFixed(2)}°` : ""} error={!valid} />
    </ToolShell>
  );
}
