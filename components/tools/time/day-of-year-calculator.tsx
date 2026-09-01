"use client";
import { ToolShell, Field, Row, Select, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const DAYS_BEFORE_MONTH = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInYear(year: number): number {
  return isLeap(year) ? 366 : 365;
}

function dayOfYear(year: number, month: number, day: number): number {
  let doy = DAYS_BEFORE_MONTH[month - 1] + day;
  if (month > 2 && isLeap(year)) doy += 1;
  return doy;
}

/** ISO 8601 week number (weeks start on Monday; week 1 contains the first Thursday). */
function isoWeek(year: number, month: number, day: number): number {
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function parseIso(iso: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  if (d > daysInMonth(y, mo)) return null;
  return { y, m: mo, d };
}

function daysInMonth(year: number, month: number): number {
  return [31, isLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

export default function DayOfYearCalculator() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState("day-of-year-calculator:mode", "from-date");
  const [date, setDate] = useToolState("day-of-year-calculator:date", new Date().toISOString().slice(0, 10));
  const [year, setYear] = useToolState("day-of-year-calculator:year", String(new Date().getFullYear()));
  const [dayNum, setDayNum] = useToolState("day-of-year-calculator:daynum", "1");

  const parsed = parseIso(date);
  const y = parseInt(year, 10);
  const n = parseInt(dayNum, 10);
  const validYear = !isNaN(y) && y >= 1 && y <= 9999;
  const validDay = validYear && !isNaN(n) && n >= 1 && n <= daysInYear(y);
  const resultDate = validDay ? new Date(y, 0, n) : null;

  return (
    <ToolShell
      title="Day of Year Calculator"
      khmerTitle="គណនាថ្ងៃទីប៉ុន្មាននៃឆ្នាំ"
      description="Find the day-of-year number, ISO week number and days remaining for a date — or convert a day number and year back into a date."
      descriptionKm="ស្វែងរកលេខថ្ងៃនៃឆ្នាំ លេខសប្តាហ៍ ISO និងថ្ងៃដែលនៅសល់សម្រាប់កាលបរិច្ឆេទណាមួយ — ឬបំលែងលេខថ្ងៃ និងឆ្នាំ ត្រឡប់ទៅជាកាលបរិច្ឆេទវិញ។"
    >
      <Field label={t("Mode", "របៀប")}>
        <Select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="from-date">{t("Date → day of year", "កាលបរិច្ឆេទ → ថ្ងៃទីប៉ុន្មាននៃឆ្នាំ")}</option>
          <option value="from-day">{t("Day number + year → date", "លេខថ្ងៃ + ឆ្នាំ → កាលបរិច្ឆេទ")}</option>
        </Select>
      </Field>

      {mode === "from-date" ? (
        <>
          <Field label={t("Date", "កាលបរិច្ឆេទ")}>
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} className="font-mono-ui" />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Output label={t("Day of year", "ថ្ងៃទីប៉ុន្មាននៃឆ្នាំ")} value={parsed ? `${dayOfYear(parsed.y, parsed.m, parsed.d)} / ${daysInYear(parsed.y)}` : ""} error={!parsed} />
            <Output label={t("ISO week number", "លេខសប្តាហ៍ ISO")} value={parsed ? String(isoWeek(parsed.y, parsed.m, parsed.d)) : ""} error={!parsed} />
            <Output label={t("Days remaining in year", "ថ្ងៃដែលនៅសល់ក្នុងឆ្នាំ")} value={parsed ? String(daysInYear(parsed.y) - dayOfYear(parsed.y, parsed.m, parsed.d)) : ""} error={!parsed} />
            <Output label={t("Days in year (365/366)", "ចំនួនថ្ងៃក្នុងឆ្នាំ (365/366)")} value={parsed ? String(daysInYear(parsed.y)) : ""} error={!parsed} />
          </div>
        </>
      ) : (
        <>
          <Row>
            <Field label={t("Year", "ឆ្នាំ")}>
              <TextInput inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} className="font-mono-ui" />
            </Field>
            <Field label={t("Day number", "លេខថ្ងៃ")} hint={t(`1 – ${validYear ? daysInYear(y) : 366}`, `1 – ${validYear ? daysInYear(y) : 366}`)}>
              <TextInput inputMode="numeric" value={dayNum} onChange={(e) => setDayNum(e.target.value)} className="font-mono-ui" />
            </Field>
          </Row>
          <Output
            label={t("Result date", "កាលបរិច្ឆេទលទ្ធផល")}
            value={
              resultDate
                ? `${resultDate.getFullYear()}-${String(resultDate.getMonth() + 1).padStart(2, "0")}-${String(resultDate.getDate()).padStart(2, "0")}`
                : ""
            }
            error={!validDay}
          />
        </>
      )}

      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "The week number follows ISO 8601 (Monday-based weeks). February has 29 days in leap years.",
          "លេខសប្តាហ៍ត្រូវបានគណនាតាម ISO 8601 (សប្តាហ៍ចាប់ផ្តើមពីថ្ងៃចន្ទ)។ ខែកុម្ភៈមាន 29 ថ្ងៃក្នុងឆ្នាំបង្គ្រប់។"
        )}
      </p>
    </ToolShell>
  );
}
