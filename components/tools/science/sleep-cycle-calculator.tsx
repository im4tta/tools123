"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const CYCLE_MIN = 90;
// Average time to fall asleep — an approximation; it varies a lot between people.
const LATENCY_MIN = 14;
const CYCLE_COUNTS = [4, 5, 6];

function parseMinutes(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function formatTime(total: number): string {
  const wrapped = ((total % 1440) + 1440) % 1440;
  const h24 = Math.floor(wrapped / 60);
  const mm = wrapped % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const suffix = h24 < 12 ? "AM" : "PM";
  return `${String(h24).padStart(2, "0")}:${String(mm).padStart(2, "0")}  (${h12}:${String(mm).padStart(2, "0")} ${suffix})`;
}

export default function SleepCycleCalculator() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState("sleep-cycle:mode", "wake");
  const [time, setTime] = useToolState("sleep-cycle:time", "07:00");

  const results = useMemo(() => {
    const base = parseMinutes(time);
    if (base === null) return null;
    return CYCLE_COUNTS.map((cycles) => {
      const shift = LATENCY_MIN + cycles * CYCLE_MIN;
      return { cycles, value: mode === "wake" ? base - shift : base + shift };
    });
  }, [mode, time]);

  return (
    <ToolShell
      title="Sleep Cycle Calculator"
      khmerTitle="គណនាវដ្តនៃការគេង"
      description="Work back from a wake-up time to ideal bedtimes, or forward from a bedtime to recommended wake times, based on 90-minute sleep cycles. General guidance only, not medical advice."
      descriptionKm="គណនាថយក្រោយពីម៉ោងភ្ញាក់ ទៅរកម៉ោងគេងល្អបំផុត ឬគណនាទៅមុខពីម៉ោងគេង ទៅរកម៉ោងភ្ញាក់ដែលគួរណែនាំ ដោយផ្អែកលើវដ្តគេង ៩០ នាទី។ គ្រាន់តែជាការណែនាំទូទៅ មិនមែនជាដំបូន្មានផ្នែកវេជ្ជសាស្ត្រទេ។"
    >
      <Row>
        <Field label={t("Direction", "ទិសដៅ")}>
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="wake">{t("I wake up at… (show bedtimes)", "ខ្ញុំភ្ញាក់នៅ… (បង្ហាញម៉ោងគេង)")}</option>
            <option value="sleep">{t("I go to bed at… (show wake times)", "ខ្ញុំចូលគេងនៅ… (បង្ហាញម៉ោងភ្ញាក់)")}</option>
          </Select>
        </Field>
        <Field
          label={
            mode === "wake"
              ? t("Wake-up time", "ម៉ោងភ្ញាក់")
              : t("Bedtime", "ម៉ោងចូលគេង")
          }
          hint={t("24h HH:MM", "២៤ ម៉ោង ម៉ោង:នាទី")}
        >
          <TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </Row>

      {results ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {results.map((r) => (
              <div key={r.cycles} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                  {mode === "wake"
                    ? `${t("Bedtime for", "ម៉ោងគេងសម្រាប់")} ${r.cycles} ${t("cycles", "វដ្ត")}`
                    : `${t("Wake time for", "ម៉ោងភ្ញាក់សម្រាប់")} ${r.cycles} ${t("cycles", "វដ្ត")}`}
                </div>
                <div className="mt-1 text-xl font-semibold text-[var(--gold)]">{formatTime(r.value)}</div>
                <div className="mt-0.5 text-[11px] text-[var(--ink-faint)]">
                  {r.cycles * CYCLE_MIN} {t("min of sleep", "នាទីនៃការគេង")}
                </div>
              </div>
            ))}
          </div>
          <p className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
            {t(
              "Each cycle is assumed to be 90 minutes, plus about 14 minutes average time to fall asleep. Sleep needs vary by age and person, so treat these times as general guidance — this is not medical advice.",
              "វដ្តនីមួយៗសន្មតថា ៩០ នាទី បូកប្រហែល ១៤ នាទីជាមធ្យមដើម្បីងងុយគេង។ តម្រូវការគេងប្រែប្រួលតាមអាយុ និងបុគ្គលម្នាក់ៗ ដូច្នេះសូមចាត់ទុកម៉ោងទាំងនេះជាការណែនាំទូទៅ — មិនមែនជាដំបូន្មានផ្នែកវេជ្ជសាស្ត្រទេ។"
            )}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">
          {t("Enter a valid time (HH:MM).", "សូមបញ្ចូលម៉ោងឱ្យបានត្រឹមត្រូវ (ម៉ោង:នាទី)។")}
        </p>
      )}
    </ToolShell>
  );
}
