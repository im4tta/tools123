"use client";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function FibonacciGenerator() {
  const [count, setCount] = useToolState("fibonacci-generator:count", "15");
  const n = Math.max(0, Math.min(500, Math.trunc(Number(count)) || 0));

  function sequence() {
    const seq: bigint[] = [];
    let a = BigInt(0), b = BigInt(1);
    for (let i = 0; i < n; i++) { seq.push(a); [a, b] = [b, a + b]; }
    return seq;
  }

  return (
    <ToolShell title="Fibonacci Sequence Generator" description="Generates the first N Fibonacci numbers using exact big-integer arithmetic.">
      <Field label="Count (max 500)"><TextInput value={count} onChange={(e) => setCount(e.target.value)} className="font-mono-ui" /></Field>
      <Output label="Sequence" value={sequence().join(", ")} />
    </ToolShell>
  );
}
