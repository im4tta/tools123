"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

const DAY = 86400000;

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function PregnancyDueDate() {
  const { text: t } = useLanguage();
  const [todayTs] = useState(() => Date.now());
  const today = new Date(todayTs).toISOString().slice(0, 10);
  const [lmp, setLmp] = useState(today);
  const [cycle, setCycle] = useState("28");

  const data = useMemo(() => {
    if (!lmp) return null;
    const lmpDate = new Date(`${lmp}T00:00:00`);
    if (isNaN(lmpDate.getTime())) return null;
    const cycleDays = Math.min(45, Math.max(21, Number(cycle) || 28));
    const adjust = cycleDays - 28;
    const due = new Date(lmpDate.getTime() + (280 + adjust) * DAY);
    const daysPregnant = Math.floor((todayTs - lmpDate.getTime()) / DAY);
    const weeks = Math.floor(daysPregnant / 7);
    const days = daysPregnant % 7;
    const t1End = new Date(lmpDate.getTime() + 84 * DAY);
    const t2End = new Date(lmpDate.getTime() + 189 * DAY);
    let trimester = "";
    if (daysPregnant < 84) trimester = t("First trimester", "ត្រីមាសទី១");
    else if (daysPregnant < 189) trimester = t("Second trimester", "ត្រីមាសទី២");
    else trimester = t("Third trimester", "ត្រីមាសទី៣");
    return { due, weeks, days, t1End, t2End, trimester, daysPregnant };
  }, [lmp, cycle, t, todayTs]);

  return (
    <ToolShell
      title="Pregnancy Due Date Calculator"
      khmerTitle="គណនាថ្ងៃសម្រាល"
      description="Estimate the due date, current pregnancy week, and trimester dates from the last menstrual period."
      descriptionKm="ប៉ាន់ប្រមាណថ្ងៃសម្រាល សប្តាហ៍ផ្ទៃពោះបច្ចុប្បន្ន និងកាលបរិច្ឆេទត្រីមាស ពីខែចុងក្រោយ។"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
          <Field label={t("First day of last period", "ថ្ងៃដំបូងនៃខែចុងក្រោយ")}>
            <input
              type="date"
              value={lmp}
              onChange={(e) => setLmp(e.target.value)}
              className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]"
            />
          </Field>
          <Field label={t("Cycle length (days)", "រយៈពេលឆ្នវង់ (ថ្ងៃ)")}>
            <input
              type="number"
              min={21}
              max={45}
              value={cycle}
              onChange={(e) => setCycle(e.target.value)}
              className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 font-mono-ui text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]"
            />
          </Field>
        </div>

        {data && (
          <div className="space-y-3">
            <div className="rounded-xl border border-[var(--teal)]/40 bg-[var(--teal)]/10 p-5 text-center">
              <div className="text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">{t("Estimated due date", "ថ្ងៃសម្រាលប៉ាន់ប្រមាណ")}</div>
              <div className="mt-1 text-xl font-semibold text-[var(--ink)]">{fmtDate(data.due)}</div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-center">
                <div className="text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">{t("Current stage", "ដំណាក់កាលបច្ចុប្បន្ន")}</div>
                <div className="mt-1 text-sm font-semibold text-[var(--ink)]">
                  {data.daysPregnant >= 0 ? `${data.weeks} ${t("weeks", "សប្តាហ៍")} ${data.days} ${t("days", "ថ្ងៃ")}` : t("Not started", "មិនទាន់ចាប់ផ្តើម")}
                </div>
                {data.daysPregnant >= 0 && <div className="text-xs text-[var(--ink-faint)]">{data.trimester}</div>}
              </div>
              <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-center">
                <div className="text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">{t("2nd trimester begins", "ត្រីមាសទី២ចាប់ផ្តើម")}</div>
                <div className="mt-1 text-sm font-semibold text-[var(--ink)]">W13 · {fmtDate(data.t1End)}</div>
              </div>
              <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-center">
                <div className="text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">{t("3rd trimester begins", "ត្រីមាសទី៣ចាប់ផ្តើម")}</div>
                <div className="mt-1 text-sm font-semibold text-[var(--ink)]">W28 · {fmtDate(data.t2End)}</div>
              </div>
            </div>
          </div>
        )}

        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
          {t("Estimate only, based on the standard 280-day rule (Naegele). Ultrasound dating by a healthcare provider is more accurate.", "គ្រាន់តែជាការប៉ាន់ប្រមាណ ដោយផ្អែកលើក្បួន ២៨០ ថ្ងៃ (Naegele)។ ការពិនិត្យដោយអ៊ូត្រាសោនពីគ្រូពេទ្យជាការណាត់ជួបជាក់លាក់ជាង។")}
        </p>
      </div>
    </ToolShell>
  );
}