"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export default function LeapYearChecker() {
  const { text: t } = useLanguage();
  const [year, setYear] = useToolState<string>("leap-year:year", String(new Date().getFullYear()));
  const num = Number(year);

  const result = useMemo(() => {
    if (!Number.isInteger(num) || num < 1) return null;
    return { leap: isLeap(num), next: (() => { let y = num + 1; while (!isLeap(y)) y++; return y; })() };
  }, [num]);

  return (
    <ToolShell
      title="Leap Year Checker"
      khmerTitle="ពិនិត្យឆ្នាំបង្គ្រប់"
      description="Check whether a year is a leap year and find the next leap year."
      descriptionKm="ពិនិត្យមើលថាឆ្នាំណាជាឆ្នាំបង្គ្រប់ និងរកឆ្នាំបង្គ្រប់បន្ទាប់។"
    >
      <Field label={t("Year", "ឆ្នាំ")}>
        <TextInput type="number" value={year} onChange={(e) => setYear(e.target.value)} className="font-mono-ui" />
      </Field>
      {result && (
        <Output
          label={t("Result", "លទ្ធផល")}
          value={result.leap
            ? t(`${num} is a leap year.`, `${num} ជាឆ្នាំបង្គ្រប់។`)
            : t(`${num} is not a leap year. Next: ${result.next}`, `${num} មិនមែនជាឆ្នាំបង្គ្រប់ទេ។ បន្ទាប់៖ ${result.next}`)}
        />
      )}
    </ToolShell>
  );
}
