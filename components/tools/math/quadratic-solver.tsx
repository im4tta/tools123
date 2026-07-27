"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function QuadraticSolver() {
  const [a, setA] = useToolState("quadratic-solver:a", "1");
  const [b, setB] = useToolState("quadratic-solver:b", "-3");
  const [c, setC] = useToolState("quadratic-solver:c", "2");
  const A = Number(a), B = Number(b), C = Number(c);
  const valid = !isNaN(A) && !isNaN(B) && !isNaN(C) && A !== 0;
  const disc = valid ? B * B - 4 * A * C : 0;

  function roots() {
    if (!valid) return "";
    if (disc > 0) {
      const r1 = (-B + Math.sqrt(disc)) / (2 * A);
      const r2 = (-B - Math.sqrt(disc)) / (2 * A);
      return `x₁ = ${r1.toFixed(4)}, x₂ = ${r2.toFixed(4)}`;
    }
    if (disc === 0) return `x = ${(-B / (2 * A)).toFixed(4)} (double root)`;
    const re = (-B / (2 * A)).toFixed(4);
    const im = (Math.sqrt(-disc) / (2 * A)).toFixed(4);
    return `x = ${re} ± ${im}i`;
  }

  return (
    <ToolShell title="Quadratic Equation Solver" description="Solves ax² + bx + c = 0, including complex roots.">
      <Row>
        <Field label="a"><TextInput value={a} onChange={(e) => setA(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="b"><TextInput value={b} onChange={(e) => setB(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="c"><TextInput value={c} onChange={(e) => setC(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="Discriminant" value={valid ? String(disc) : ""} error={!valid} />
      <Output label="Roots" value={roots()} error={!valid} />
    </ToolShell>
  );
}
