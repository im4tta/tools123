"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const DAY = 86400000;
const WEEKDAYS: [string, string][] = [
  ["Sunday", "អាទិត្យ"],
  ["Monday", "ច័ន្ទ"],
  ["Tuesday", "អង្គារ"],
  ["Wednesday", "ពុធ"],
  ["Thursday", "ព្រហស្បតិ៍"],
  ["Friday", "សុក្រ"],
  ["Saturday", "សៅរ៍"],
];

// ---------------------------------------------------------------------------
// Excel serial date (1900 date system): serial 1 = 1900-01-01. Excel inherits
// the Lotus 1-2-3 bug that treats 1900 as a leap year, so serial 60 is the
// fictitious date 1900-02-29, and every real date from 1900-03-01 (serial ≥ 61)
// is counted from 1899-12-30. Convention per Microsoft KB 214326.
// Julian Day Number (JDN) is the integer day count starting at noon; the
// Julian Date (JD) at 0h UT = JDN − 0.5, and MJD = JD − 2400000.5, so
// MJD at 0h UT = JDN − 2400001. JDN for 1900-01-01 is 2415021 (Meeus ch. 7).
// ---------------------------------------------------------------------------

function jdn(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

function fromJDN(j: number): { y: number; m: number; d: number } {
  const a = j + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d2 = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d2) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d2 - 4800 + Math.floor(m / 10);
  return { y: year, m: month, d: day };
}

function dateToSerial(y: number, m: number, d: number): number {
  const utc = Date.UTC(y, m - 1, d);
  const daysEarly = Math.round((utc - Date.UTC(1899, 11, 31)) / DAY);
  if (daysEarly <= 59) return daysEarly; // up to and including 1900-02-28
  return Math.round((utc - Date.UTC(1899, 11, 30)) / DAY); // from 1900-03-01
}

function serialToDate(serial: number): { y: number; m: number; d: number; fictitious?: boolean } | null {
  if (!Number.isInteger(serial) || serial < 0) return null;
  if (serial === 60) return { y: 1900, m: 2, d: 29, fictitious: true }; // does not exist
  const epoch = serial <= 59 ? Date.UTC(1899, 11, 31) : Date.UTC(1899, 11, 30);
  const date = new Date(epoch + serial * DAY);
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() };
}

function dayOfYear(y: number, m: number, d: number): number {
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / DAY) + 1;
}

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

export default function SerialDateConverter() {
  const { text: t } = useLanguage();
  const [dateStr, setDateStr] = useToolState("serial-date-converter:date", new Date().toISOString().slice(0, 10));
  const [serialStr, setSerialStr] = useToolState("serial-date-converter:serial", "1");
  const [jdnStr, setJdnStr] = useToolState("serial-date-converter:jdn", "2415021");

  const parsed = useMemo(() => {
    const j = Number(jdnStr);
    if (jdnStr.trim() !== "" && Number.isFinite(j) && Number.isInteger(j) && j >= 0) {
      const { y, m, d } = fromJDN(j);
      const serial = dateToSerial(y, m, d);
      const weekday = WEEKDAYS[(j + 1) % 7];
      return {
        ok: true as const,
        j,
        mjd: j - 2400001,
        serial,
        doy: dayOfYear(y, m, d),
        weekdayEn: weekday[0],
        weekdayKm: weekday[1],
        dateISO: iso(y, m, d),
      };
    }
    const s = Number(serialStr);
    if (Number.isFinite(s) && Number.isInteger(s) && s === 60) {
      return { ok: false as const };
    }
    return null;
  }, [jdnStr, serialStr]);

  const onDateChange = (v: string) => {
    setDateStr(v);
    if (v.trim() === "") return;
    const parts = v.split("-").map(Number);
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return;
    const [y, m, d] = parts;
    if (y < 100 || y > 9999) return;
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return; // reject e.g. 1900-02-29
    setJdnStr(String(jdn(y, m, d)));
    setSerialStr(String(dateToSerial(y, m, d)));
  };

  const onSerialChange = (v: string) => {
    setSerialStr(v);
    if (v.trim() === "") return;
    const s = Number(v);
    if (!Number.isFinite(s) || !Number.isInteger(s) || s < 0) return;
    const d = serialToDate(s);
    if (!d) return;
    if (d.fictitious) {
      setJdnStr("");
      setDateStr("");
      return;
    }
    setJdnStr(String(jdn(d.y, d.m, d.d)));
    setDateStr(iso(d.y, d.m, d.d));
  };

  const onJdnChange = (v: string) => {
    setJdnStr(v);
    if (v.trim() === "") return;
    const j = Number(v);
    if (!Number.isFinite(j) || !Number.isInteger(j) || j < 0) return;
    const { y, m, d } = fromJDN(j);
    setDateStr(iso(y, m, d));
    setSerialStr(String(dateToSerial(y, m, d)));
  };

  return (
    <ToolShell
      title="Excel Serial & Julian Day Converter"
      khmerTitle="បម្លែងលេខស៊េរីកាលបរិច្ឆេទ"
      description="Convert a calendar date to an Excel serial number, Julian Day Number (JDN) and Modified Julian Date (MJD) — and back."
      descriptionKm="បម្លែងកាលបរិច្ឆេទទៅជាលេខស៊េរី Excel លេខ Julian Day (JDN) និងលេខ MJD — និងបម្លែងត្រឡប់មកវិញ។"
    >
      <Row>
        <Field label={t("Calendar date", "កាលបរិច្ឆេទ")}>
          <TextInput type="date" value={dateStr} onChange={(e) => onDateChange(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Excel serial (1900 system)", "លេខស៊េរី Excel (ប្រព័ន្ធ ១៩០០)")}>
          <TextInput inputMode="numeric" value={serialStr} onChange={(e) => onSerialChange(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Julian Day Number (JDN)", "លេខ Julian Day (JDN)")}>
          <TextInput inputMode="numeric" value={jdnStr} onChange={(e) => onJdnChange(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Modified Julian Date (MJD)", "លេខ Modified Julian Date (MJD)")}>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 font-mono-ui text-sm text-[var(--ink)]">
            {parsed?.ok === true ? parsed.mjd : "—"}
          </div>
        </Field>
      </Row>

      {parsed?.ok === true ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Output label={t("Calendar date", "កាលបរិច្ឆេទ")} value={parsed.dateISO} mono={false} />
          <Output label={t("Excel serial", "លេខស៊េរី Excel")} value={String(parsed.serial)} />
          <Output label={t("JDN", "JDN")} value={String(parsed.j)} />
          <Output label={t("MJD", "MJD")} value={String(parsed.mjd)} />
          <Output label={t("Day of year", "ថ្ងៃទីប៉ុន្មាននៃឆ្នាំ")} value={`${parsed.doy}`} />
          <Output label={t("Weekday", "ថ្ងៃនៃសប្ដាហ៍")} value={t(parsed.weekdayEn, parsed.weekdayKm)} mono={false} />
        </div>
      ) : parsed ? (
        <p className="text-sm text-[var(--danger)]">
          {t(
            "Excel serial 60 is the fictitious 1900-02-29 (the Excel 1900 leap-year bug) and has no real date.",
            "លេខស៊េរី Excel ៦០ គឺជាថ្ងៃទី ២៩ កុម្ភៈ ១៩០០ ដែលមិនមានពិតប្រាកដ (កំហុសឆ្នាំបង្គ្រប់របស់ Excel ១៩០០) ដូច្នេះគ្មានកាលបរិច្ឆេទពិតទេ។"
          )}
        </p>
      ) : (
        <p className="text-sm text-[var(--danger)]">
          {t("Enter a valid date or integer serial / JDN value.", "សូមបញ្ចូលកាលបរិច្ឆេទ ឬលេខស៊េរី / JDN ជាចំនួនគត់ឱ្យបានត្រឹមត្រូវ។")}
        </p>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Conventions: Excel serial 1 = 1900-01-01 (1900 treated as a leap year per the Lotus bug, so serial 60 is fictitious). JDN of 1900-01-01 = 2415021; MJD = JD − 2400000.5.",
          "កំណត់សម្គាល់៖ លេខស៊េរី Excel ១ = ១៩០០-០១-០១ (ឆ្នាំ ១៩០០ រាប់ជាឆ្នាំបង្គ្រប់តាមកំហុស Lotus ដូច្នេះលេខ ៦០ មិនមានពិតទេ)។ JDN នៃថ្ងៃ ១៩០០-០១-០១ = ២៤១៥០២១; MJD = JD − ២៤០០០០០.៥។"
        )}
      </p>
    </ToolShell>
  );
}
