"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function SalaryHourly() {
  const { text: t } = useLanguage();
  const [amount, setAmount] = useToolState("salary:amount", "500000");
  const [unit, setUnit] = useToolState("salary:unit", "month");
  const [hoursPerWeek, setHoursPerWeek] = useToolState("salary:hours", "40");

  const calc = useMemo(() => {
    const a = Number(amount);
    const h = Number(hoursPerWeek) || 40;
    if (Number.isNaN(a) || a < 0) return null;
    const perYear = (u: string) =>
      u === "hour" ? a * h * 52 : u === "day" ? a * 5 * 52 : u === "week" ? a * 52 : u === "month" ? a * 12 : a;
    const annual = perYear(unit);
    const monthly = annual / 12;
    const weekly = annual / 52;
    const daily = annual / 260;
    const hourly = annual / (h * 52);
    return { annual, monthly, weekly, daily, hourly };
  }, [amount, unit, hoursPerWeek]);

  const sym = "៛";
  const fmt = (n: number) => `${Math.round(n).toLocaleString("en-US")} ${sym}`;

  const rows: { label: string; value: number }[] = calc
    ? [
        { label: t("Hourly", "ក្នុងមួយម៉ោង"), value: calc.hourly },
        { label: t("Daily (8h)", "ក្នុងមួយថ្ងៃ (៨ម៉ោង)"), value: calc.daily },
        { label: t("Weekly", "ក្នុងមួយសប្ដាហ៍"), value: calc.weekly },
        { label: t("Monthly", "ក្នុងមួយខែ"), value: calc.monthly },
        { label: t("Annual", "ក្នុងមួយឆ្នាំ"), value: calc.annual },
      ]
    : [];

  return (
    <ToolShell
      title="Hourly ↔ Annual Salary Converter"
      khmerTitle="បម្លែងប្រាក់ខែ"
      description="Convert salary between hourly, daily, weekly, monthly, and annual amounts."
      descriptionKm="បម្លែងប្រាក់ខែរវាងក្នុងមួយម៉ោង ថ្ងៃ សប្ដាហ៍ ខែ និងឆ្នាំ។"
    >
      <Row>
        <Field label={t("Amount", "ចំនួនទឹកប្រាក់")}>
          <TextInput inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label={t("Is this", "នេះជា")}>
          <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="hour">{t("per hour", "ក្នុងមួយម៉ោង")}</option>
            <option value="day">{t("per day", "ក្នុងមួយថ្ងៃ")}</option>
            <option value="week">{t("per week", "ក្នុងមួយសប្ដាហ៍")}</option>
            <option value="month">{t("per month", "ក្នុងមួយខែ")}</option>
            <option value="year">{t("per year", "ក្នុងមួយឆ្នាំ")}</option>
          </Select>
        </Field>
        <Field label={t("Hours / week", "ម៉ោង / សប្ដាហ៍")}>
          <TextInput inputMode="numeric" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} />
        </Field>
      </Row>

      {calc ? (
        <div className="overflow-hidden rounded-md border border-[var(--ground-line)]">
          {rows.map((r, i) => (
            <div key={r.label} className={`flex items-center justify-between px-4 py-2.5 ${i % 2 ? "bg-[var(--ground-raised)]" : ""}`}>
              <span className="text-sm text-[var(--ink-dim)]">{r.label}</span>
              <span className={`font-mono-ui text-base font-semibold ${i === rows.length - 1 ? "text-[var(--gold)]" : "text-[var(--ink)]"}`}>{fmt(r.value)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter a valid amount.", "សូមបញ្ចូលចំនួនទឹកប្រាក់ឱ្យបានត្រឹមត្រូវ។")}</p>
      )}
    </ToolShell>
  );
}