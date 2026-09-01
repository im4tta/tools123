"use client";
import { ToolShell, Field, Row, TextInput } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { CopyButton } from "@/components/CopyButton";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type DayRow = { id: string; start: string; end: string; breakMin: string };

let idCounter = 0;
function nextId() {
  idCounter += 1;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `day-${Date.now()}-${idCounter}`;
}

function timeToMinutes(value: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return NaN;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return NaN;
  return h * 60 + min;
}

function dayMinutes(d: DayRow): number | null {
  const start = timeToMinutes(d.start);
  const end = timeToMinutes(d.end);
  const brk = parseFloat(d.breakMin);
  if (isNaN(start) || isNaN(end) || isNaN(brk) || brk < 0) return null;
  let worked = end - start;
  if (worked <= 0) worked += 1440; // ended after midnight
  return Math.max(0, worked - Math.round(brk));
}

export default function WorkHoursCalculator() {
  const { text: t } = useLanguage();
  const [days, setDays] = useToolState<DayRow[]>("work-hours-calculator:days", [
    { id: "day-0", start: "09:00", end: "17:30", breakMin: "30" },
  ]);
  const [threshold, setThreshold] = useToolState("work-hours-calculator:threshold", "8");
  const [rate, setRate] = useToolState("work-hours-calculator:rate", "");
  const [multiplier, setMultiplier] = useToolState("work-hours-calculator:multiplier", "1.5");

  const thresholdMin = (parseFloat(threshold) || 0) * 60;
  let totalMin = 0;
  let regMin = 0;
  let ovtMin = 0;
  let validDays = 0;
  for (const d of days) {
    const m = dayMinutes(d);
    if (m === null) continue;
    validDays += 1;
    totalMin += m;
    const reg = Math.min(m, thresholdMin);
    regMin += reg;
    ovtMin += m - reg;
  }
  const hourly = parseFloat(rate);
  const hasRate = !isNaN(hourly) && hourly >= 0;
  const mult = parseFloat(multiplier) || 1.5;
  const pay = hasRate ? (regMin / 60) * hourly + (ovtMin / 60) * hourly * mult : 0;

  const fmtHM = (total: number) => {
    const v = Math.max(0, total);
    return `${Math.floor(v / 60)} ${t("h", "ម៉ោង")} ${v % 60} ${t("min", "នាទី")}`;
  };

  const summaryText = [
    ...days.map((d) => {
      const m = dayMinutes(d);
      return `${d.start} → ${d.end} (${t("break", "សម្រាក")} ${d.breakMin || "0"} ${t("min", "នាទី")}) = ${m === null ? "—" : fmtHM(m)}`;
    }),
    `Total: ${fmtHM(totalMin)} | Regular: ${fmtHM(regMin)} | Overtime: ${fmtHM(ovtMin)}${hasRate ? ` | Pay: $${pay.toFixed(2)}` : ""}`,
  ].join("\n");

  function updateDay(id: string, patch: Partial<DayRow>) {
    setDays((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function removeDay(id: string) {
    setDays((prev) => prev.filter((d) => d.id !== id));
  }

  function addDay() {
    setDays((prev) => [...prev, { id: nextId(), start: "09:00", end: "17:00", breakMin: "30" }]);
  }

  return (
    <ToolShell
      title="Work Hours / Time Card Calculator"
      khmerTitle="គណនាម៉ោងធ្វើការ"
      description="Add one or more shifts with start time, end time and break, then see total hours plus regular and overtime splits."
      descriptionKm="បន្ថែមវេនការងារមួយ ឬច្រើន ជាមួយម៉ោងចាប់ផ្តើម ម៉ោងបញ្ចប់ និងពេលសម្រាក រួចមើលម៉ោងសរុប រួមជាមួយការបំបែកម៉ោងធម្មតា និងម៉ោងបន្ថែម។"
    >
      <div className="space-y-3">
        {days.map((d) => (
          <div key={d.id} className="space-y-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                {t("Shift", "វេនការងារ")} {days.indexOf(d) + 1}
              </span>
              <button
                type="button"
                onClick={() => removeDay(d.id)}
                className="text-xs text-[var(--danger)] hover:underline"
              >
                {t("Remove", "លុប")}
              </button>
            </div>
            <Row>
              <Field label={t("Start time", "ម៉ោងចាប់ផ្តើម")}>
                <TextInput type="time" value={d.start} onChange={(e) => updateDay(d.id, { start: e.target.value })} className="font-mono-ui" />
              </Field>
              <Field label={t("End time", "ម៉ោងបញ្ចប់")}>
                <TextInput type="time" value={d.end} onChange={(e) => updateDay(d.id, { end: e.target.value })} className="font-mono-ui" />
              </Field>
              <Field label={t("Break (minutes)", "សម្រាក (នាទី)")}>
                <TextInput inputMode="numeric" value={d.breakMin} onChange={(e) => updateDay(d.id, { breakMin: e.target.value })} className="font-mono-ui" />
              </Field>
            </Row>
          </div>
        ))}
      </div>

      <Button onClick={addDay} className="w-full sm:w-auto">
        {t("Add another day", "បន្ថែមថ្ងៃមួយទៀត")}
      </Button>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
        <div className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
          {t("Overtime & pay settings", "ការកំណត់ម៉ោងបន្ថែម និងប្រាក់ឈ្នួល")}
        </div>
        <Row>
          <Field label={t("Overtime threshold (hours/day)", "កម្រិតម៉ោងបន្ថែម (ម៉ោង/ថ្ងៃ)")}>
            <TextInput inputMode="decimal" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label={t("Overtime rate (×)", "អត្រាម៉ោងបន្ថែម (×)")}>
            <TextInput inputMode="decimal" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label={t("Hourly rate (optional)", "អត្រាម៉ោង (ស្រេចចិត្ត)")} hint={t("$/hour", "$/ម៉ោង")}>
            <TextInput inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} className="font-mono-ui" />
          </Field>
        </Row>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          <Output label={t("Total time", "ម៉ោងសរុប")} value={validDays ? fmtHM(totalMin) : ""} error={validDays === 0} />
          <Output label={t("Regular hours", "ម៉ោងធម្មតា")} value={validDays ? fmtHM(regMin) : ""} error={validDays === 0} />
          <Output label={t("Overtime hours", "ម៉ោងបន្ថែម")} value={validDays ? fmtHM(ovtMin) : ""} error={validDays === 0} />
        </div>
        <div className="shrink-0 pt-6">
          <CopyButton text={summaryText} />
        </div>
      </div>

      {hasRate && <Output label={t("Estimated pay", "ប្រាក់ឈ្នួលប៉ាន់ស្មាន")} value={`$${pay.toFixed(2)}`} />}

      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "A shift that ends before it starts is treated as crossing midnight. Overtime is computed per day against the threshold. Pay is an estimate using the entered rate and overtime multiplier; no taxes or allowances are applied.",
          "វេនដែលបញ្ចប់មុនពេលចាប់ផ្តើម ត្រូវបានចាត់ទុកថាឆ្លងកាត់ពាក់កណ្តាលអធ្រាត្រ។ ម៉ោងបន្ថែមត្រូវបានគណនាក្នុងមួយថ្ងៃ ធៀបនឹងកម្រិតដែលបានកំណត់។ ប្រាក់ឈ្នួលគ្រាន់តែជាការប៉ាន់ស្មាន ដោយប្រើអត្រាដែលបានបញ្ចូល និងមេគុណម៉ោងបន្ថែម ដោយមិនរាប់បញ្ចូលពន្ធ ឬប្រាក់ឧបត្ថម្ភទេ។"
        )}
      </p>
    </ToolShell>
  );
}
