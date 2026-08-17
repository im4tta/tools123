"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const RATE = 4000;

const BRACKETS: [number, number, number][] = [
  [0, 1_500_000, 0],
  [1_500_001, 2_000_000, 0.05],
  [2_000_001, 8_500_000, 0.1],
  [8_500_001, 12_500_000, 0.15],
  [12_500_001, Infinity, 0.2],
];

function taxOn(taxable: number): number {
  let tax = 0;
  for (const [lo, hi, rate] of BRACKETS) {
    if (taxable <= lo) break;
    tax += (Math.min(taxable, hi) - lo + 1) * rate;
  }
  return tax;
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export default function CambodiaTax() {
  const { text: t } = useLanguage();
  const [gross, setGross] = useToolState("cambodia-tax:gross", "1500000");
  const [currency, setCurrency] = useToolState("cambodia-tax:currency", "khr");
  const [dependents, setDependents] = useToolState("cambodia-tax:dependents", "0");

  const calc = useMemo(() => {
    const g = parseFloat(gross);
    if (Number.isNaN(g) || g < 0) return null;
    const khr = currency === "usd" ? g * RATE : g;
    const dependAllowance = Number(dependents) * 75_000;
    const taxable = Math.max(0, khr - dependAllowance);
    const tax = taxOn(taxable);
    const net = khr - tax;
    return {
      taxableKhr: taxable,
      taxKhr: tax,
      netKhr: net,
      effectiveRate: taxable > 0 ? (tax / taxable) * 100 : 0,
      usd: currency === "usd" ? g : net / RATE,
    };
  }, [gross, currency, dependents]);

  return (
    <ToolShell
      title="Cambodian Income Tax Calculator"
      khmerTitle="គណនាពន្ធលើប្រាក់ខែ"
      description="Calculate monthly salary tax (Cambodia progressive brackets) and net take-home pay."
      descriptionKm="គណនាពន្ធលើប្រាក់ខែប្រចាំខែ (តាមប្រព័ន្ធជណ្ដើរនៃកម្ពុជា) និងប្រាក់សុទ្ធ។"
    >
      <Row>
        <Field label={t("Gross monthly salary", "ប្រាក់ខែសរុបប្រចាំខែ")}>
          <TextInput inputMode="decimal" value={gross} onChange={(e) => setGross(e.target.value)} placeholder="1500000" />
        </Field>
        <Field label={t("Currency", "រូបិយប័ណ្ណ")}>
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="khr">៛ Riel (KHR)</option>
            <option value="usd">$ USD (×4000)</option>
          </Select>
        </Field>
      </Row>
      <Field label={t("Dependents", "អ្នកនៅក្នុងបន្ទុក")} hint={t("75,000 ៛ allowance each", "កាត់ ៧៥,០០០៛ ក្នុងម្នាក់")}>
        <TextInput inputMode="numeric" value={dependents} onChange={(e) => setDependents(e.target.value)} placeholder="0" />
      </Field>

      {calc ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            [t("Taxable income", "ចំណូលជាប់ពន្ធ"), fmt(calc.taxableKhr) + " ៛"],
            [t("Monthly tax", "ពន្ធប្រចាំខែ"), fmt(calc.taxKhr) + " ៛"],
            [t("Net salary", "ប្រាក់ខែសុទ្ធ"), fmt(calc.netKhr) + " ៛"],
            [t("Effective rate", "អត្រាមធ្យម"), calc.effectiveRate.toFixed(2) + "%"],
            [t("In USD", "ជាដុល្លារ"), "$" + calc.usd.toFixed(2)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{k}</div>
              <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{v}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter a valid salary", "សូមបញ្ចូលប្រាក់ខែឱ្យបានត្រឹមត្រូវ")}</p>
      )}
    </ToolShell>
  );
}