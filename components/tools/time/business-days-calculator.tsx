"use client";
import { ToolShell, Field, Row, Select, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const WEEKDAYS: [string, string][] = [
  ["Sunday", "អាទិត្យ"],
  ["Monday", "ចន្ទ"],
  ["Tuesday", "អង្គារ"],
  ["Wednesday", "ពុធ"],
  ["Thursday", "ព្រហស្បតិ៍"],
  ["Friday", "សុក្រ"],
  ["Saturday", "សៅរ៍"],
];

function dateFromIso(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addBusinessDays(from: Date, n: number): Date {
  const d = new Date(from);
  let remaining = n;
  const step = n >= 0 ? 1 : -1;
  while (remaining !== 0) {
    d.setDate(d.getDate() + step);
    const day = d.getDay();
    if (day !== 0 && day !== 6) remaining -= step;
  }
  return d;
}

export default function BusinessDaysCalculator() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState("business-days-calculator:mode", "count");
  const [start, setStart] = useToolState("business-days-calculator:start", "2026-07-01");
  const [end, setEnd] = useToolState("business-days-calculator:end", "2026-07-31");
  const [date, setDate] = useToolState("business-days-calculator:date", "2026-07-01");
  const [n, setN] = useToolState("business-days-calculator:n", "10");

  const a = dateFromIso(start);
  const b = dateFromIso(end);
  const countValid = a !== null && b !== null && b >= a;

  const startD = dateFromIso(date);
  const addN = parseInt(n, 10);
  const addValid = startD !== null && !isNaN(addN);
  const resultDate = addValid ? addBusinessDays(startD, addN) : null;

  function countResult() {
    if (!countValid) return null;
    let weekdays = 0;
    let weekends = 0;
    const d = new Date(a as Date);
    while (d <= (b as Date)) {
      const day = d.getDay();
      if (day === 0 || day === 6) weekends += 1;
      else weekdays += 1;
      d.setDate(d.getDate() + 1);
    }
    const total = Math.round(((b as Date).getTime() - (a as Date).getTime()) / 86400000) + 1;
    return { weekdays, weekends, total };
  }
  const result = countResult();

  return (
    <ToolShell
      title="Business Days Calculator"
      khmerTitle="គណនាថ្ងៃធ្វើការ"
      description="Count weekdays, weekends and total days between two dates, or add a number of business days to a date."
      descriptionKm="រាប់ថ្ងៃធ្វើការ ថ្ងៃចុងសប្តាហ៍ និងថ្ងៃសរុប រវាងកាលបរិច្ឆេទពីរ ឬបន្ថែមចំនួនថ្ងៃធ្វើការទៅកាលបរិច្ឆេទណាមួយ។"
    >
      <Field label={t("Mode", "របៀប")}>
        <Select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="count">{t("Count between two dates", "រាប់រវាងកាលបរិច្ឆេទពីរ")}</option>
          <option value="add">{t("Add business days to a date", "បន្ថែមថ្ងៃធ្វើការទៅកាលបរិច្ឆេទ")}</option>
        </Select>
      </Field>

      {mode === "count" ? (
        <>
          <Row>
            <Field label={t("Start date", "កាលបរិច្ឆេទចាប់ផ្តើម")}>
              <TextInput type="date" value={start} onChange={(e) => setStart(e.target.value)} className="font-mono-ui" />
            </Field>
            <Field label={t("End date", "កាលបរិច្ឆេទបញ្ចប់")}>
              <TextInput type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="font-mono-ui" />
            </Field>
          </Row>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Output label={t("Business days (Mon–Fri)", "ថ្ងៃធ្វើការ (ចន្ទ–សុក្រ)")} value={result ? String(result.weekdays) : ""} error={!countValid} />
            <Output label={t("Weekend days", "ថ្ងៃចុងសប្តាហ៍")} value={result ? String(result.weekends) : ""} error={!countValid} />
            <Output label={t("Total days (inclusive)", "ថ្ងៃសរុប (រាប់បញ្ចូលទាំងពីរ)")} value={result ? String(result.total) : ""} error={!countValid} />
          </div>
        </>
      ) : (
        <>
          <Row>
            <Field label={t("Start date", "កាលបរិច្ឆេទចាប់ផ្តើម")}>
              <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} className="font-mono-ui" />
            </Field>
            <Field label={t("Business days to add", "ចំនួនថ្ងៃធ្វើការត្រូវបន្ថែម")} hint={t("negative = go backwards", "អវិជ្ជមាន = រាប់ថយក្រោយ")}>
              <TextInput inputMode="numeric" value={n} onChange={(e) => setN(e.target.value)} className="font-mono-ui" />
            </Field>
          </Row>
          <Output
            label={t("Result date", "កាលបរិច្ឆេទលទ្ធផល")}
            value={
              resultDate && addValid
                ? `${toIso(resultDate)}  (${t(WEEKDAYS[resultDate.getDay()][0], WEEKDAYS[resultDate.getDay()][1])})`
                : ""
            }
            error={!addValid}
          />
        </>
      )}

      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Business days are Monday to Friday. Public holidays are not included — the result is calendar-based only.",
          "ថ្ងៃធ្វើការគឺពីថ្ងៃចន្ទ ដល់ថ្ងៃសុក្រ។ ថ្ងៃបុណ្យសាធារណៈមិនត្រូវបានរាប់បញ្ចូលទេ — លទ្ធផលផ្អែកលើប្រតិទិនតែប៉ុណ្ណោះ។"
        )}
      </p>
    </ToolShell>
  );
}
