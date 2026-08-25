"use client";
import { useMemo } from "react";
import { GraduationCap, Info } from "lucide-react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function parseDate(v: string): Date | null {
  if (!v) return null;
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
function fmt(d: Date) { return d.toLocaleDateString(); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

export default function SchoolYearPlanner() {
  const { text: t } = useLanguage();
  const [start, setStart] = useToolState("school:start", "2026-11-01");
  const [semesterWeeks, setSemesterWeeks] = useToolState("school:semWeeks", "16");
  const [termBreakWeeks, setTermBreakWeeks] = useToolState("school:breakWeeks", "2");

  const result = useMemo(() => {
    const s = parseDate(start);
    if (!s) return null;
    const semDays = (Number(semesterWeeks) || 16) * 7;
    const breakDays = (Number(termBreakWeeks) || 2) * 7;
    const sem1Start = s;
    const sem1End = addDays(s, semDays - 1);
    const breakStart = addDays(s, semDays);
    const breakEnd = addDays(s, semDays + breakDays - 1);
    const sem2Start = addDays(s, semDays + breakDays);
    const sem2End = addDays(s, semDays + breakDays + semDays - 1);
    const yearEnd = addDays(sem2End, 1);
    return { s, sem1Start, sem1End, breakStart, breakEnd, sem2Start, sem2End, yearEnd, semDays, breakDays };
  }, [start, semesterWeeks, termBreakWeeks]);

  return (
    <ToolShell
      title="Cambodia School-Year Planner"
      khmerTitle="ផែនការឆ្នាំសិក្សា"
      description="Plan a Cambodian school year into two semesters with a mid-year break, from a configurable start date — useful for teachers, students and curriculum planning."
      descriptionKm="រៀបចំផែនការឆ្នាំសិក្សាកម្ពុជាជាពីរឆមាស ជាមួយរយៈពេលឈប់សម្រាកពាក់កណ្តាលឆ្នាំ ពីកាលបរិច្ឆេទចាប់ផ្តើមដែលអាចកំណត់បាន — សម្រាប់គ្រូ សិស្ស និងការរៀបចំកម្មវិធីសិក្សា។"
    >
      <Row>
        <Field label={t("First semester start", "ថ្ងៃចាប់ផ្តើមឆមាសទី១")}>
          <TextInput type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label={t("Semester length (weeks)", "រយៈពេលឆមាស (សប្តាហ៍)")}>
          <TextInput type="number" min="4" max="30" step="1" value={semesterWeeks} onChange={(e) => setSemesterWeeks(e.target.value)} />
        </Field>
      </Row>
      <Field label={t("Mid-year break (weeks)", "រយៈពេលឈប់សម្រាកពាក់កណ្តាលឆ្នាំ (សប្តាហ៍)")}>
        <TextInput type="number" min="0" max="12" step="1" value={termBreakWeeks} onChange={(e) => setTermBreakWeeks(e.target.value)} />
      </Field>

      {result && (
        <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="mb-3 flex items-center gap-2 font-medium text-[var(--ink)]">
            <GraduationCap size={16} className="text-[var(--gold)]" />
            {t("Academic timeline", "បន្ទាត់ពេលវេលាសិក្សា")}
          </div>
          <TimelineRow color="var(--gold)" label={t("Semester 1", "ឆមាសទី១")} start={result.sem1Start} end={result.sem1End} />
          <TimelineRow color="var(--teal)" label={t("Mid-year break", "ការឈប់សម្រាក")} start={result.breakStart} end={result.breakEnd} />
          <TimelineRow color="var(--gold)" label={t("Semester 2", "ឆមាសទី២")} start={result.sem2Start} end={result.sem2End} />
          <div className="mt-2 flex justify-between border-t border-[var(--ground-line)] pt-2 text-xs text-[var(--ink-dim)]">
            <span>{t("Full year", "ឆ្នាំពេញ")}: {fmt(result.s)} → {fmt(result.yearEnd)}</span>
            <span>{t("Total", "សរុប")}: {result.semDays * 2 + result.breakDays} {t("days", "ថ្ងៃ")}</span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <Info size={14} className="mt-0.5 shrink-0 text-[var(--gold)]" />
        <span>
          {t("This is a generic two-semester planner. Actual Cambodian school-year dates and breaks are set by the Ministry of Education, Youth and Sport and differ between public/private schools and grade levels — adjust the dates to your school.", "នេះគឺជាផែនការឆមាសពីរទូទៅ។ កាលបរិច្ឆេទពិតប្រាកដនៃឆ្នាំសិក្សាកម្ពុជា និងការឈប់សម្រាក ត្រូវបានកំណត់ដោយក្រសួងអប់រំ យុវជន និងកីឡា ហើយខុសគ្នារវាងសាលារដ្ឋ/ឯកជន និងកម្រិតថ្នាក់ — សូមកែកាលបរិច្ឆេទតាមសាលារបស់អ្នក។")}
        </span>
      </div>
    </ToolShell>
  );
}

function TimelineRow({ color, label, start, end }: { color: string; label: string; start: Date; end: Date }) {
  const { text: t } = useLanguage();
  return (
    <div className="flex items-center gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-xs">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <span className="min-w-28 font-semibold text-[var(--ink)]">{label}</span>
      <span className="ml-auto text-[var(--ink-dim)]">{fmt(start)} → {fmt(end)}</span>
      <span className="text-[var(--ink-faint)]">{Math.round((end.getTime() - start.getTime()) / 86400000) + 1} {t("days", "ថ្ងៃ")}</span>
    </div>
  );
}
