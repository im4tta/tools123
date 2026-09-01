"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface Bracket {
  lo: number;
  hi: number;
  rate: number;
}

interface TaxTable {
  id: string;
  label: [string, string];
  currency: string;
  brackets: Bracket[];
}

// Reference / illustrative tax tables only. The Cambodia table mirrors the
// widely published monthly salary-tax scale used by reference calculators; it
// is NOT official tax advice and may not reflect the latest official rules.
const TABLES: TaxTable[] = [
  {
    id: "cambodia",
    label: ["Cambodia (reference)", "កម្ពុជា (យោង)"],
    currency: "KHR",
    brackets: [
      { lo: 0, hi: 1_500_000, rate: 0 },
      { lo: 1_500_000, hi: 2_000_000, rate: 0.05 },
      { lo: 2_000_000, hi: 8_500_000, rate: 0.1 },
      { lo: 8_500_000, hi: 12_500_000, rate: 0.15 },
      { lo: 12_500_000, hi: Infinity, rate: 0.2 },
    ],
  },
  {
    id: "generic",
    label: ["Generic progressive (illustrative)", "ប្រព័ន្ធជណ្ដើរទូទៅ (ឧទាហរណ៍)"],
    currency: "USD",
    brackets: [
      { lo: 0, hi: 1_000, rate: 0 },
      { lo: 1_000, hi: 3_000, rate: 0.1 },
      { lo: 3_000, hi: 8_000, rate: 0.2 },
      { lo: 8_000, hi: Infinity, rate: 0.3 },
    ],
  },
  {
    id: "flat",
    label: ["Flat 10% (illustrative)", "អត្រារាបស្មើ ១០% (ឧទាហរណ៍)"],
    currency: "USD",
    brackets: [{ lo: 0, hi: Infinity, rate: 0.1 }],
  },
];

function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export default function SalaryCalculator() {
  const { text: t } = useLanguage();
  const [tableId, setTableId] = useToolState("salary:table", "cambodia");
  const [gross, setGross] = useToolState("salary:gross", "1500000");

  const calc = useMemo(() => {
    const g = Number(gross);
    if (Number.isNaN(g) || g < 0) return null;
    const table = TABLES.find((x) => x.id === tableId) ?? TABLES[0];
    const rows = table.brackets.map((b) => {
      const amount = Math.max(0, Math.min(g, b.hi) - b.lo);
      return { ...b, amount, tax: amount * b.rate };
    });
    const totalTax = rows.reduce((sum, r) => sum + r.tax, 0);
    const net = g - totalTax;
    return {
      g,
      table,
      rows,
      totalTax,
      net,
      effective: g > 0 ? (totalTax / g) * 100 : 0,
    };
  }, [tableId, gross]);

  return (
    <ToolShell
      title="Salary Calculator"
      khmerTitle="គណនាប្រាក់ខែ"
      description="Estimate net monthly pay from gross salary using a selectable tax-bracket table. Reference/illustrative only — not official tax advice."
      descriptionKm="ប៉ាន់ស្មានប្រាក់ខែសុទ្ធប្រចាំខែ ពីប្រាក់ខែសរុប ដោយប្រើតារាងជណ្ដើរពន្ធដែលអាចជ្រើសរើសបាន។ គ្រាន់តែជាឯកសារយោង/ឧទាហរណ៍ — មិនមែនជាដំបូន្មានពន្ធផ្លូវការទេ។"
    >
      <Row>
        <Field label={t("Tax table", "តារាងពន្ធ")}>
          <Select value={tableId} onChange={(e) => setTableId(e.target.value)}>
            {TABLES.map((tb) => (
              <option key={tb.id} value={tb.id}>
                {t(tb.label[0], tb.label[1])}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label={t("Gross monthly salary", "ប្រាក់ខែសរុបប្រចាំខែ")}
          hint={calc ? calc.table.currency : ""}
        >
          <TextInput
            inputMode="decimal"
            value={gross}
            onChange={(e) => setGross(e.target.value)}
            className="font-mono-ui"
            placeholder="1500000"
          />
        </Field>
      </Row>

      {calc ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                {t("Gross", "សរុប")}
              </div>
              <div className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                {fmt(calc.g)} <span className="text-xs font-normal text-[var(--ink-dim)]">{calc.table.currency}</span>
              </div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                {t("Estimated tax", "ពន្ធប៉ាន់ស្មាន")}
              </div>
              <div className="mt-1 text-2xl font-semibold text-[var(--danger)]">
                −{fmt(calc.totalTax)} <span className="text-xs font-normal text-[var(--ink-dim)]">{calc.table.currency}</span>
              </div>
              <div className="mt-0.5 text-[10px] text-[var(--ink-dim)]">
                {t("effective rate", "អត្រាមធ្យម")} {calc.effective.toFixed(2)}%
              </div>
            </div>
            <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                {t("Estimated net", "ប្រាក់សុទ្ធប៉ាន់ស្មាន")}
              </div>
              <div className="mt-1 text-2xl font-semibold text-[var(--gold)]">
                {fmt(calc.net)} <span className="text-xs font-normal text-[var(--ink-dim)]">{calc.table.currency}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--ground-line)] text-left text-xs uppercase tracking-wide text-[var(--ink-dim)]">
                  <th className="px-3 py-2 font-medium">{t("Bracket", "ជួរពន្ធ")}</th>
                  <th className="px-3 py-2 font-medium">{t("Rate", "អត្រា")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("Amount in bracket", "ចំនួនក្នុងជួរ")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("Tax", "ពន្ធ")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ground-line)]">
                {calc.rows.map((r, i) => (
                  <tr key={i} className={r.amount > 0 ? "text-[var(--ink)]" : "text-[var(--ink-faint)]"}>
                    <td className="px-3 py-2">
                      {r.lo.toLocaleString("en-US")} – {r.hi === Infinity ? "∞" : r.hi.toLocaleString("en-US")}
                    </td>
                    <td className="px-3 py-2">{(r.rate * 100).toFixed(0)}%</td>
                    <td className="px-3 py-2 text-right font-mono-ui">{fmt(r.amount)}</td>
                    <td className="px-3 py-2 text-right font-mono-ui">{fmt(r.tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
            {t(
              "Tax tables here are reference/illustrative only and may not reflect current official rules or personal allowances. This is not tax advice — verify with an official source or a professional.",
              "តារាងពន្ធនៅទីនេះគ្រាន់តែជាឯកសារយោង/ឧទាហរណ៍ ហើយអាចមិនឆ្លុះបញ្ចាំងច្បាប់ផ្លូវការបច្ចុប្បន្ន ឬប្រាក់ឧបត្ថម្ភផ្ទាល់ខ្លួនទេ។ នេះមិនមែនជាដំបូន្មានពន្ធទេ — សូមផ្ទៀងផ្ទាត់ជាមួយប្រភពផ្លូវការ ឬអ្នកជំនាញ។"
            )}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">
          {t("Enter a valid gross salary.", "សូមបញ្ចូលប្រាក់ខែសរុបឱ្យបានត្រឹមត្រូវ។")}
        </p>
      )}
    </ToolShell>
  );
}
