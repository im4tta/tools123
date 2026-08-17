"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function LoanCalculator() {
  const { text: t } = useLanguage();
  const [principal, setPrincipal] = useToolState("loan-calculator:principal", "10000");
  const [annualRate, setAnnualRate] = useToolState("loan-calculator:rate", "12");
  const [years, setYears] = useToolState("loan-calculator:years", "5");

  const result = useMemo(() => {
    const p = Number(principal);
    const annual = Number(annualRate);
    const y = Number(years);
    if (!Number.isFinite(p) || !Number.isFinite(annual) || !Number.isFinite(y) || p <= 0 || annual <= 0 || y <= 0) return null;

    const r = annual / 100 / 12;
    const n = Math.round(y * 12);
    let monthly: number;
    if (r === 0) monthly = p / n;
    else monthly = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    const total = monthly * n;
    return { monthly, total, interest: total - p, payments: n };
  }, [principal, annualRate, years]);

  return (
    <ToolShell
      title="Loan & EMI Calculator"
      khmerTitle="គណនាកម្ចី និង EMI"
      description="Estimate a loan's monthly payment (EMI), total repayment, and total interest from principal, annual rate, and term."
      descriptionKm="ប៉ាន់ស្មានការបង់ប្រចាំខែ (EMI) ការសងសរុប និងការប្រាក់សរុប ពីដើមទុន អត្រាការប្រាក់ប្រចាំឆ្នាំ និងរយៈពេល។"
    >
      <Row>
        <Field label={t("Principal", "ដើមទុន")}>
          <TextInput type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Annual rate (%)", "អត្រាការប្រាក់ប្រចាំឆ្នាំ (%)")}>
          <TextInput type="number" value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>
      <Field label={t("Term (years)", "រយៈពេល (ឆ្នាំ)")}>
        <TextInput type="number" value={years} onChange={(e) => setYears(e.target.value)} className="font-mono-ui" />
      </Field>
      {result && (
        <div className="space-y-2">
          <Output label={t("Monthly payment (EMI)", "ការបង់ប្រចាំខែ (EMI)")} value={fmt(result.monthly)} />
          <Output label={t("Total repayment", "ការសងសរុប")} value={fmt(result.total)} />
          <Output label={t("Total interest", "ការប្រាក់សរុប")} value={fmt(result.interest)} />
        </div>
      )}
      <p className="text-xs text-[var(--ink-faint)]">
        {t("Estimate only — uses the standard EMI formula and does not include fees, taxes, or insurance.", "ជាការប៉ាន់ស្មានតែប៉ុណ្ណោះ — ប្រើរូបមន្ត EMI ស្តង់ដារ និងមិនរាប់បញ្ចូលថ្លៃសេវា ពន្ធ ឬធានារ៉ាប់រងទេ។")}
      </p>
    </ToolShell>
  );
}
