"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function FlatVsDeclining() {
  const { text: t } = useLanguage();
  const [principal, setPrincipal] = useToolState("loan:principal", "1000000");
  const [months, setMonths] = useToolState("loan:months", "12");
  const [flatRate, setFlatRate] = useToolState("loan:flat", "1.5");
  const [decliningRate, setDecliningRate] = useToolState("loan:declining", "1.5");

  const calc = useMemo(() => {
    const p = Number(principal);
    const n = Number(months);
    const fr = Number(flatRate) / 100;
    const dr = Number(decliningRate) / 100;
    if ([p, n, fr, dr].some(Number.isNaN) || p <= 0 || n <= 0) return null;

    // Flat: interest on full principal every month
    const flatMonthly = p / n + p * fr;
    const flatTotal = flatMonthly * n;
    const flatInterest = flatTotal - p;

    // Declining balance: principal fixed, interest on remaining balance
    const principalPerMonth = p / n;
    let remaining = p;
    let decliningInterest = 0;
    for (let i = 0; i < n; i++) {
      decliningInterest += remaining * dr;
      remaining -= principalPerMonth;
    }
    const decliningTotal = p + decliningInterest;
    const decliningMonthly = decliningTotal / n;

    return {
      flatMonthly,
      flatTotal,
      flatInterest,
      decliningMonthly,
      decliningTotal,
      decliningInterest,
      savings: flatTotal - decliningTotal,
    };
  }, [principal, months, flatRate, decliningRate]);

  const fmt = (n: number) => Math.round(n).toLocaleString("en-US") + " ៛";

  return (
    <ToolShell
      title="Flat vs Declining Interest"
      khmerTitle="ការប្រៀបធៀបអត្រាការប្រាក់ស្មើ និងថយចុះ"
      description="Compare flat-rate and declining-balance loan interest — common for Cambodian microfinance and bank loans."
      descriptionKm="ប្រៀបធៀបការប្រាក់ប្រភេទស្មើ និងប្រភេទថយចុះ — ទូទៅសម្រាប់អតិសុខុមហិរញ្ញវត្ថុ និងធនាគារនៅកម្ពុជា។"
    >
      <Row>
        <Field label={t("Loan amount (៛)", "ចំនួនប្រាក់កម្ចី (៛)")}>
          <TextInput inputMode="decimal" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
        </Field>
        <Field label={t("Term (months)", "រយៈពេល (ខែ)")}>
          <TextInput inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} />
        </Field>
        <Field label={t("Flat rate (%/month)", "អត្រាស្មើ (%/ខែ)")}>
          <TextInput inputMode="decimal" value={flatRate} onChange={(e) => setFlatRate(e.target.value)} />
        </Field>
        <Field label={t("Declining rate (%/month)", "អត្រាថយចុះ (%/ខែ)")}>
          <TextInput inputMode="decimal" value={decliningRate} onChange={(e) => setDecliningRate(e.target.value)} />
        </Field>
      </Row>

      {calc ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--gold)]">{t("Flat rate", "អត្រាស្មើ")}</div>
              <div className="mt-2 space-y-1 text-sm text-[var(--ink-dim)]">
                <div>{t("Monthly payment", "បង់ប្រចាំខែ")}: <b className="text-[var(--ink)]">{fmt(calc.flatMonthly)}</b></div>
                <div>{t("Total interest", "ការប្រាក់សរុប")}: <b className="text-[var(--ink)]">{fmt(calc.flatInterest)}</b></div>
                <div>{t("Total repaid", "សរុបសងវិញ")}: <b className="text-[var(--ink)]">{fmt(calc.flatTotal)}</b></div>
              </div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--gold)]">{t("Declining balance", "អត្រាថយចុះ")}</div>
              <div className="mt-2 space-y-1 text-sm text-[var(--ink-dim)]">
                <div>{t("Monthly payment", "បង់ប្រចាំខែ")}: <b className="text-[var(--ink)]">{fmt(calc.decliningMonthly)}</b></div>
                <div>{t("Total interest", "ការប្រាក់សរុប")}: <b className="text-[var(--ink)]">{fmt(calc.decliningInterest)}</b></div>
                <div>{t("Total repaid", "សរុបសងវិញ")}: <b className="text-[var(--ink)]">{fmt(calc.decliningTotal)}</b></div>
              </div>
            </div>
          </div>
          <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4 text-center">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("You save with declining balance", "អ្នកសន្សំបានជាមួយអត្រាថយចុះ")}</div>
            <div className="font-display text-2xl font-semibold text-[var(--ink)]">{fmt(calc.savings)}</div>
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter valid loan details.", "សូមបញ្ចូលព័ត៌មានកម្ចីឱ្យបានត្រឹមត្រូវ។")}</p>
      )}
    </ToolShell>
  );
}