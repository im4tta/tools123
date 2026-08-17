"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function factorize(n: number): { factor: number; power: number }[] {
  const out: { factor: number; power: number }[] = [];
  let x = n;
  let d = 2;
  while (d * d <= x) {
    let power = 0;
    while (x % d === 0) {
      x /= d;
      power++;
    }
    if (power > 0) out.push({ factor: d, power });
    d = d === 2 ? 3 : d + 2;
  }
  if (x > 1) out.push({ factor: x, power: 1 });
  return out;
}

export default function PrimeFactorization() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("prime-factors:input", "720");

  const result = useMemo(() => {
    const n = parseInt(input, 10);
    if (Number.isNaN(n) || n < 2 || n > 9007199254740991) return null;
    return factorize(n);
  }, [input]);

  return (
    <ToolShell
      title="Prime Factorization"
      khmerTitle="បំបែកជាលេខបឋម"
      description="Break any integer into its prime factors with exponents."
      descriptionKm="បំបែកចំនួនគត់ណាមួយទៅជាកត្តាបឋម ជាមួយនឹងអិចស្ប៉ូណង់ស្យែល។"
    >
      <Field label={t("Integer", "ចំនួនគត់")}>
        <TextInput inputMode="numeric" value={input} onChange={(e) => setInput(e.target.value)} placeholder="720" />
      </Field>
      {result ? (
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
          <div className="font-mono-ui text-2xl font-semibold text-[var(--ink)]">
            {input} = {result.map((f) => `${f.factor}${f.power > 1 ? `<sup>${f.power}</sup>` : ""}`).join(" × ")}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.map((f) => (
              <span key={f.factor} className="rounded bg-[var(--gold)]/10 px-2 py-1 text-xs font-mono-ui text-[var(--gold)]">
                {f.factor}
                {f.power > 1 ? `^${f.power}` : ""}
              </span>
            ))}
          </div>
        </div>
      ) : (
        input.trim() && <p className="text-sm text-[var(--danger)]">{t("Enter an integer ≥ 2", "សូមបញ្ចូលចំនួនគត់ ≥ 2")}</p>
      )}
    </ToolShell>
  );
}