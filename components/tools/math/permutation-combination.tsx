"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function fact(n: number): bigint {
  let acc = BigInt(1);
  for (let i = BigInt(2); i <= BigInt(n); i += BigInt(1)) acc *= i;
  return acc;
}

function permutations(n: number, r: number): bigint {
  let acc = BigInt(1);
  for (let i = n - r + 1; i <= n; i++) acc *= BigInt(i);
  return acc;
}

function combinations(n: number, r: number): bigint {
  return permutations(n, r) / fact(r);
}

function group(x: bigint): string {
  return x.toLocaleString("en-US");
}

function approx(x: bigint): string {
  const s = x.toString();
  if (s.length <= 18) return "";
  const n = Number(x);
  return `≈ ${n.toExponential(10)}`;
}

export default function PermutationCombination() {
  const [nStr, setN] = useToolState("permutation-combination:n", "10");
  const [rStr, setR] = useToolState("permutation-combination:r", "3");

  const n = Number(nStr);
  const r = Number(rStr);
  const valid = Number.isInteger(n) && Number.isInteger(r) && n >= 0 && r >= 0 && r <= n && n <= 500;

  const nFact = valid ? fact(n) : BigInt(0);
  const nPr = valid ? permutations(n, r) : BigInt(0);
  const nCr = valid ? combinations(n, r) : BigInt(0);

  return (
    <ToolShell
      title="Permutation & Combination Calculator"
      description="Compute nPr, nCr, and n! exactly for integers, with the working formula."
    >
      <Row>
        <Field label="n (total items)">
          <TextInput inputMode="numeric" value={nStr} onChange={(e) => setN(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label="r (chosen items)">
          <TextInput inputMode="numeric" value={rStr} onChange={(e) => setR(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>

      <Output label="Permutations  P(n,r) = n! / (n−r)!" value={valid ? group(nPr) : ""} error={!valid} />
      <Output label="Combinations  C(n,r) = n! / (r!(n−r)!)" value={valid ? group(nCr) : ""} error={!valid} />
      <Output label="Factorial  n!" value={valid ? group(nFact) : ""} error={!valid} />

      {valid && nCr.toString().length > 18 && (
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs text-[var(--ink-faint)]">
          C({n},{r}) {approx(nCr)}
        </div>
      )}
    </ToolShell>
  );
}