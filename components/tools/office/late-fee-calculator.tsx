"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function LateFeeCalculator() {
  const { text: t } = useLanguage();
  const [principal, setPrincipal] = useToolState("late-fee:principal", "1000");
  const [rate, setRate] = useToolState("late-fee:rate", "12");
  const [days, setDays] = useToolState("late-fee:days", "30");

  const calc = useMemo(() => {
    const p = Number(principal);
    const r = Number(rate);
    const d = Number(days);
    if ([p, r, d].some((n) => Number.isNaN(n)) || p < 0 || r < 0 || d < 0) return null;
    // Simple interest, 365-day year.
    const fee = p * (r / 100) * (d / 365);
    const perDay = (p * (r / 100)) / 365;
    return { fee, perDay, total: p + fee };
  }, [principal, rate, days]);

  return (
    <ToolShell
      title="Late Fee Calculator"
      khmerTitle="គណនាការបង់ប្រាក់យឺតយ៉ាវ"
      description="Estimate simple-interest late fees from principal, annual interest rate and days late. Formula: Late fee = Principal × (annual rate ÷ 100) × (days ÷ 365)."
      descriptionKm="ប៉ាន់ស្មានការបង់ប្រាក់យឺតយ៉ាវតាមការប្រាក់សាមញ្ញ ពីទឹកប្រាក់ដើម អត្រាការប្រាក់ប្រចាំឆ្នាំ និងចំនួនថ្ងៃយឺត។ រូបមន្ត៖ ការបង់យឺត = ទឹកប្រាក់ដើម × (អត្រាប្រចាំឆ្នាំ ÷ ១០០) × (ថ្ងៃ ÷ ៣៦៥)។"
    >
      <Row>
        <Field label={t("Principal amount", "ទឹកប្រាក់ដើម")}>
          <TextInput
            inputMode="decimal"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            className="font-mono-ui"
            placeholder="1000"
          />
        </Field>
        <Field label={t("Annual interest rate", "អត្រាការប្រាក់ប្រចាំឆ្នាំ")} hint={t("% per year", "% ក្នុងមួយឆ្នាំ")}>
          <TextInput
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="font-mono-ui"
            placeholder="12"
          />
        </Field>
        <Field label={t("Days late", "ចំនួនថ្ងៃយឺត")}>
          <TextInput
            inputMode="numeric"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="font-mono-ui"
            placeholder="30"
          />
        </Field>
      </Row>

      {calc ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                {t("Late fee / interest due", "ការបង់យឺត / ការប្រាក់ត្រូវសង")}
              </div>
              <div className="mt-1 text-2xl font-semibold text-[var(--gold)]">{calc.fee.toFixed(2)}</div>
              <div className="mt-0.5 text-[10px] text-[var(--ink-dim)]">
                {t("per day", "ក្នុងមួយថ្ងៃ")}: {calc.perDay.toFixed(2)}
              </div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                {t("Principal", "ទឹកប្រាក់ដើម")}
              </div>
              <div className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                {Number(principal).toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                {t("Total to pay", "សរុបត្រូវបង់")}
              </div>
              <div className="mt-1 text-2xl font-semibold text-[var(--ink)]">{calc.total.toFixed(2)}</div>
            </div>
          </div>

          <p className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
            {t(
              "Simple interest on a 365-day year. Results use the same currency as the principal you entered. Actual late fees may be set by contract or law — this is a general estimate, not legal or financial advice.",
              "ការប្រាក់សាមញ្ញ គិតតាមឆ្នាំ ៣៦៥ ថ្ងៃ។ លទ្ធផលប្រើរូបិយប័ណ្ណដូចទឹកប្រាក់ដើមដែលអ្នកបញ្ចូល។ ការបង់យឺតពិតប្រាកដអាចកំណត់ដោយកិច្ចសន្យា ឬច្បាប់ — នេះគ្រាន់តែជាការប៉ាន់ស្មានទូទៅ មិនមែនជាដំបូន្មានផ្នែកច្បាប់ ឬហិរញ្ញវត្ថុទេ។"
            )}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">
          {t("Enter valid non-negative numbers.", "សូមបញ្ចូលលេខមិនអវិជ្ជមានឱ្យបានត្រឹមត្រូវ។")}
        </p>
      )}
    </ToolShell>
  );
}
