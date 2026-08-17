"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export default function AgeInWords() {
  const { text: t } = useLanguage();
  const [birth, setBirth] = useToolState("age-in-words:birth", "1990-01-01");
  const [asOf, setAsOf] = useToolState("age-in-words:asof", "");

  const result = useMemo(() => {
    const b = new Date(birth);
    if (Number.isNaN(b.getTime())) return null;
    const now = asOf ? new Date(asOf) : new Date();
    if (Number.isNaN(now.getTime()) || now < b) return null;

    let years = now.getFullYear() - b.getFullYear();
    let months = now.getMonth() - b.getMonth();
    let days = now.getDate() - b.getDate();
    if (days < 0) {
      months--;
      days += daysInMonth(now.getFullYear(), (now.getMonth() - 1 + 12) % 12);
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const totalDays = Math.floor((now.getTime() - b.getTime()) / 86400000);
    const totalWeeks = Math.floor(totalDays / 7);
    const nextBday = new Date(now.getFullYear(), b.getMonth(), b.getDate());
    if (nextBday < now) nextBday.setFullYear(now.getFullYear() + 1);
    const daysToBday = Math.round((nextBday.getTime() - now.getTime()) / 86400000);

    return { years, months, days, totalDays, totalWeeks, daysToBday };
  }, [birth, asOf]);

  return (
    <ToolShell
      title="Age in Words"
      khmerTitle="អាយុជាពាក្យ"
      description="Calculate an exact age in years, months, and days — plus total days, weeks, and days until the next birthday."
      descriptionKm="គណនាអាយុពិតប្រាកដជាឆ្នាំ ខែ និងថ្ងៃ — រួមទាំងថ្ងៃសរុប សប្តាហ៍ និងថ្ងៃដល់ថ្ងៃកំណើតបន្ទាប់។"
    >
      <Row>
        <Field label={t("Birth date", "ថ្ងៃកំណើត")}>
          <TextInput type="date" value={birth} onChange={(e) => setBirth(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("As of (optional)", "គិតត្រឹម (ស្រេចចិត្ត)")}>
          <TextInput type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>
      {result && (
        <div className="space-y-2">
          <Output
            label={t("Age", "អាយុ")}
            value={`${result.years} ${t("years", "ឆ្នាំ")}, ${result.months} ${t("months", "ខែ")}, ${result.days} ${t("days", "ថ្ងៃ")}`}
            mono={false}
          />
          <Output label={t("Total days", "ថ្ងៃសរុប")} value={result.totalDays.toLocaleString()} />
          <Output label={t("Total weeks", "សប្តាហ៍សរុប")} value={result.totalWeeks.toLocaleString()} />
          <Output label={t("Days until next birthday", "ថ្ងៃដល់ថ្ងៃកំណើតបន្ទាប់")} value={String(result.daysToBday)} />
        </div>
      )}
    </ToolShell>
  );
}
