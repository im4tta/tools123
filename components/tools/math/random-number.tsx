"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function RandomNumber() {
  const [min, setMin] = useToolState("random-number:min", "1");
  const [max, setMax] = useToolState("random-number:max", "100");
  const [count, setCount] = useToolState("random-number:count", "1");
  const [unique, setUnique] = useToolState("random-number:unique", false);
  const [result, setResult] = useToolState<number[]>("random-number:result", []);

  function generate() {
    const lo = Math.trunc(Number(min)), hi = Math.trunc(Number(max));
    const n = Math.max(1, Math.min(1000, Math.trunc(Number(count)) || 1));
    if (isNaN(lo) || isNaN(hi) || hi < lo) return setResult([]);
    const range = hi - lo + 1;
    if (unique) {
      if (n > range) return setResult([]);
      const pool = Array.from({ length: range }, (_, i) => lo + i);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      setResult(pool.slice(0, n));
    } else {
      setResult(Array.from({ length: n }, () => lo + Math.floor(Math.random() * range)));
    }
  }

  return (
    <ToolShell title="Random Number Generator" description="Generate random integers in a range, with optional uniqueness.">
      <Row>
        <Field label="Min"><TextInput value={min} onChange={(e) => setMin(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Max"><TextInput value={max} onChange={(e) => setMax(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="How many"><TextInput value={count} onChange={(e) => setCount(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <label className="flex items-center gap-2 text-sm text-[var(--ink-dim)]">
        <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} /> No repeats
      </label>
      <Button onClick={generate}>Generate</Button>
      <Output label="Result" value={result.join(", ")} />
    </ToolShell>
  );
}
