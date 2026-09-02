"use client";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const MAX_SAFE = Number.MAX_SAFE_INTEGER;

function factorize(n: number): { factor: number; power: number }[] {
  const out: { factor: number; power: number }[] = [];
  let x = n;
  let d = 2;
  while (d * d <= x) {
    let power = 0;
    while (x % d === 0) {
      x /= d;
      power += 1;
    }
    if (power > 0) out.push({ factor: d, power });
    d = d === 2 ? 3 : d + 2;
  }
  if (x > 1) out.push({ factor: x, power: 1 });
  return out;
}

export default function PrimeFactorization() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("prime-factorization:input", "720");

  const trimmed = input.trim();
  let result: { n: number; factors: { factor: number; power: number }[]; divisorCount: number } | { error: string } | null = null;
  if (trimmed !== "") {
    const n = Number(trimmed);
    if (isNaN(n) || !Number.isInteger(n)) {
      result = { error: t("Enter a whole number", "សូមបញ្ចូលចំនួនគត់") };
    } else if (n === 0) {
      result = { error: t("0 has no prime factorization", "0 គ្មានការបំបែកកត្តាបឋមទេ") };
    } else if (Math.abs(n) === 1) {
      result = { error: t("1 has no prime factors", "1 គ្មានកត្តាបឋមទេ") };
    } else if (Math.abs(n) > MAX_SAFE) {
      result = { error: t("Too large — maximum is 9,007,199,254,740,991", "ធំពេក — អតិបរមាគឺ 9,007,199,254,740,991") };
    } else {
      const factors = factorize(Math.abs(n));
      const divisorCount = factors.reduce((acc, f) => acc * (f.power + 1), 1);
      result = { n, factors, divisorCount };
    }
  }

  return (
    <ToolShell
      title="Prime Factorization"
      khmerTitle="បំបែកជាលេខបឋម"
      description="Break any integer into its prime factors with exponents, and see how many divisors it has."
      descriptionKm="បំបែកចំនួនគត់ណាមួយទៅជាកត្តាបឋម ជាមួយអិចស្ប៉ូណង់ស្យែល រួចមើលចំនួនចែកសរុប។"
    >
      <Field label={t("Integer", "ចំនួនគត់")}>
        <TextInput inputMode="numeric" value={input} onChange={(e) => setInput(e.target.value)} placeholder="720" className="font-mono-ui" />
      </Field>

      {result && "error" in result ? (
        input.trim() !== "" && <p className="text-sm text-[var(--danger)]">{result.error}</p>
      ) : (
        result && (
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
            <div className="font-mono-ui text-2xl font-semibold text-[var(--ink)]">
              {input.trim()} = {result.n < 0 && <span>−1 × </span>}
              {result.factors.map((f, i) => (
                <span key={f.factor}>
                  {i > 0 && <span> × </span>}
                  {f.factor}
                  {f.power > 1 && <sup>{f.power}</sup>}
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-[var(--gold)]/10 px-2 py-1 font-mono-ui text-[var(--gold)]">
                {t("Distinct prime factors", "កត្តាបឋមផ្សេងគ្នា")}: {result.factors.length}
              </span>
              <span className="rounded bg-[var(--gold)]/10 px-2 py-1 font-mono-ui text-[var(--gold)]">
                {t("Total divisors", "ចំនួនចែកសរុប")}: {result.divisorCount}
              </span>
            </div>
          </div>
        )
      )}
    </ToolShell>
  );
}
