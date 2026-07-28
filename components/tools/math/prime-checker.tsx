"use client";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function factorize(n: number) {
  const factors: number[] = [];
  let x = n;
  for (let d = 2; d * d <= x; d++) {
    while (x % d === 0) { factors.push(d); x /= d; }
  }
  if (x > 1) factors.push(x);
  return factors;
}

export default function PrimeChecker() {
  const [input, setInput] = useToolState("prime-checker:input", "97");
  const n = Math.trunc(Number(input));
  const valid = !isNaN(n) && n > 1 && Number.isFinite(n) && n < 1e12;
  const factors = valid ? factorize(n) : [];
  const isPrime = valid && factors.length === 1;

  return (
    <ToolShell title="Prime Number Checker & Factorizer" description="Checks primality and shows the full prime factorization.">
      <Field label="Number"><TextInput value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" /></Field>
      <Output label="Result" value={!valid ? "" : isPrime ? `${n} is prime` : `${n} is composite`} />
      <Output label="Prime factorization" value={valid ? factors.join(" × ") : ""} error={!valid} />
    </ToolShell>
  );
}
