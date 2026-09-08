"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Select, TextInput, ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { CAMBODIA_HOLIDAYS, HOLIDAY_YEARS } from "@/lib/cambodia-holidays";

// Working days = Monday–Friday, excluding Cambodian public holidays from
// lib/cambodia-holidays.ts (the official gazetted list). Holiday data currently
// covers 2026–2027 only; outside that range weekends are still excluded but
// holidays cannot be applied, which the tool states plainly.
const HOLIDAY_BY_DATE = new Map(CAMBODIA_HOLIDAYS.map((h) => [h.date, h]));
const COVERAGE_MIN = `${HOLIDAY_YEARS[0]}-01-01`;
const COVERAGE_MAX = `${HOLIDAY_YEARS[HOLIDAY_YEARS.length - 1]}-12-31`;

function parseDate(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIso(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function outsideCoverage(iso: string): boolean {
  return iso < COVERAGE_MIN || iso > COVERAGE_MAX;
}

export default function CambodiaWorkingDays() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useState<"count" | "add">("count");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [addDays, setAddDays] = useState("10");

  const result = useMemo(() => {
    const start = parseDate(startDate);
    if (!start) return null;

    if (mode === "count") {
      const end = parseDate(endDate);
      if (!end || end < start) return null;
      let calendar = 0;
      let weekends = 0;
      let working = 0;
      const holidaysHit: { date: string; name: string; nameKm: string }[] = [];
      let anyOutside = outsideCoverage(toIso(start)) || outsideCoverage(toIso(end));
      const cur = new Date(start);
      while (cur <= end) {
        calendar += 1;
        const iso = toIso(cur);
        if (isWeekend(cur)) {
          weekends += 1;
        } else {
          const holiday = HOLIDAY_BY_DATE.get(iso);
          if (holiday) {
            holidaysHit.push({ date: iso, name: holiday.name, nameKm: holiday.nameKm });
          } else {
            working += 1;
          }
        }
        if (outsideCoverage(iso)) anyOutside = true;
        cur.setDate(cur.getDate() + 1);
      }
      return { mode, calendar, weekends, working, holidaysHit, anyOutside } as const;
    }

    const n = Number(addDays);
    if (!Number.isFinite(n) || n <= 0) return null;
    let counted = 0;
    let anyOutside = outsideCoverage(toIso(start));
    const skipped: { date: string; name: string; nameKm: string }[] = [];
    const cur = new Date(start);
    let guard = 0;
    while (counted < n && guard < 100000) {
      cur.setDate(cur.getDate() + 1);
      guard += 1;
      const iso = toIso(cur);
      if (outsideCoverage(iso)) anyOutside = true;
      if (isWeekend(cur)) continue;
      const holiday = HOLIDAY_BY_DATE.get(iso);
      if (holiday) {
        skipped.push({ date: iso, name: holiday.name, nameKm: holiday.nameKm });
        continue;
      }
      counted += 1;
    }
    return { mode, resultDate: new Date(cur), skipped, anyOutside } as const;
  }, [mode, startDate, endDate, addDays]);

  const summary = useMemo(() => {
    if (!result) return "";
    const lines: string[] = [];
    if (result.mode === "count") {
      lines.push(t("WORKING DAYS", "ថ្ងៃធ្វើការ"));
      lines.push("─".repeat(40));
      lines.push(`${t("Calendar days", "ថ្ងៃប្រតិទិន")}: ${result.calendar}`);
      lines.push(`${t("Weekend days", "ថ្ងៃចុងសប្តាហ៍")}: ${result.weekends}`);
      lines.push(`${t("Public holidays (weekdays)", "ថ្ងៃឈប់សម្រាក (ថ្ងៃធ្វើការ)")}: ${result.holidaysHit.length}`);
      lines.push(`${t("Net working days", "ថ្ងៃធ្វើការសុទ្ធ")}: ${result.working}`);
    } else {
      lines.push(t("RESULT DATE", "កាលបរិច្ឆេទលទ្ធផល"));
      lines.push("─".repeat(40));
      lines.push(`${t("Working days added", "ថ្ងៃធ្វើការបានបន្ថែម")}: ${Number(addDays)}`);
      lines.push(`${t("Result", "លទ្ធផល")}: ${fmtDate(result.resultDate)}`);
      lines.push(`${t("Weekends & holidays skipped", "ថ្ងៃចុងសប្តាហ៍ និងឈប់សម្រាកបានរំលង")}: ${result.skipped.length} ${t("holidays", "ថ្ងៃឈប់សម្រាក")}`);
    }
    return lines.join("\n");
  }, [result, addDays, t]);

  const holidayList = result?.mode === "count" ? result.holidaysHit : result?.mode === "add" ? result.skipped : [];

  return (
    <ToolShell
      title="Cambodia Working Days Calculator"
      khmerTitle="ម៉ាស៊ីនគណនាថ្ងៃធ្វើការកម្ពុជា"
      description="Count working days between two dates, or add working days to a date — excluding weekends and Cambodian public holidays."
      descriptionKm="គណនាថ្ងៃធ្វើការរវាងកាលបរិច្ឆេទពីរ ឬបន្ថែមថ្ងៃធ្វើការទៅកាលបរិច្ឆេទ ដោយដកថ្ងៃចុងសប្តាហ៍ និងថ្ងៃឈប់សម្រាកជាតិកម្ពុជាចេញ។"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Mode" labelKm="របៀប">
          <Select value={mode} onChange={(e) => setMode(e.target.value as "count" | "add")}>
            <option value="count">{t("Count working days between dates", "រាប់ថ្ងៃធ្វើការរវាងកាលបរិច្ឆេទ")}</option>
            <option value="add">{t("Add working days to a date", "បន្ថែមថ្ងៃធ្វើការទៅកាលបរិច្ឆេទ")}</option>
          </Select>
        </Field>
        <Field label={mode === "count" ? t("Start date", "កាលបរិច្ឆេទចាប់ផ្តើម") : t("From date", "ចាប់ពីកាលបរិច្ឆេទ")}>
          <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        {mode === "count" ? (
          <Field label="End date" labelKm="កាលបរិច្ឆេទបញ្ចប់" hint="inclusive of both dates" hintKm="រាប់បញ្ចូលកាលបរិច្ឆេទទាំងពីរ">
            <TextInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        ) : (
          <Field label="Working days to add" labelKm="ចំនួនថ្ងៃធ្វើការត្រូវបន្ថែម">
            <TextInput type="number" min="1" value={addDays} onChange={(e) => setAddDays(e.target.value)} />
          </Field>
        )}
      </div>

      {!result && (
        <p role="status" className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
          {mode === "count"
            ? t("Enter a start date and an end date on or after it.", "សូមបញ្ចូលកាលបរិច្ឆេទចាប់ផ្តើម និងកាលបរិច្ឆេទបញ្ចប់ដែលស្មើ ឬក្រោយវា។")
            : t("Enter a start date and a positive number of working days.", "សូមបញ្ចូលកាលបរិច្ឆេទចាប់ផ្តើម និងចំនួនថ្ងៃធ្វើការវិជ្ជមាន។")}
        </p>
      )}

      {result && <Output label={t("Result", "លទ្ធផល")} value={summary} mono={false} />}

      {result && holidayList.length > 0 && (
        <section className="space-y-2 rounded-md border border-[var(--ground-line)] p-4">
          <h2 className="text-sm font-medium text-[var(--ink)]">
            {result.mode === "count"
              ? t("Public holidays excluded", "ថ្ងៃឈប់សម្រាកដែលបានដកចេញ")
              : t("Holidays skipped while counting", "ថ្ងៃឈប់សម្រាកបានរំលងពេលរាប់")}
          </h2>
          <ul className="divide-y divide-[var(--ground-line)] text-sm">
            {holidayList.map((h) => (
              <li key={h.date} className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-[var(--ink)]">{t(h.name, h.nameKm)}</span>
                <span className="font-mono-ui text-xs text-[var(--ink-dim)]">{h.date}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result?.anyOutside && (
        <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
          {t(
            `Public-holiday data covers ${HOLIDAY_YEARS[0]}–${HOLIDAY_YEARS[HOLIDAY_YEARS.length - 1]} only. Dates outside that range still exclude weekends but may miss holidays — verify against an official calendar.`,
            `ទិន្នន័យថ្ងៃឈប់សម្រាកគ្របតែឆ្នាំ ${HOLIDAY_YEARS[0]}–${HOLIDAY_YEARS[HOLIDAY_YEARS.length - 1]} ប៉ុណ្ណោះ។ កាលបរិច្ឆេទក្រៅចន្លោះនេះនៅតែដកថ្ងៃចុងសប្តាហ៍ ប៉ុន្តែអាចខកខានថ្ងៃឈប់សម្រាក — សូមផ្ទៀងផ្ទាត់ជាមួយប្រតិទិនផ្លូវការ។`
          )}
        </p>
      )}
    </ToolShell>
  );
}
