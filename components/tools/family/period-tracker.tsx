"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, TextArea, TextInput, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const DAY = 86400000;

const MONTHS: [string, string][] = [
  ["January", "មករា"],
  ["February", "កុម្ភៈ"],
  ["March", "មីនា"],
  ["April", "មេសា"],
  ["May", "ឧសភា"],
  ["June", "មិថុនា"],
  ["July", "កក្កដា"],
  ["August", "សីហា"],
  ["September", "កញ្ញា"],
  ["October", "តុលា"],
  ["November", "វិច្ឆិកា"],
  ["December", "ធ្នូ"],
];

const WEEKDAYS: [string, string][] = [
  ["Sun", "អាទិត្យ"],
  ["Mon", "ច័ន្ទ"],
  ["Tue", "អង្គារ"],
  ["Wed", "ពុធ"],
  ["Thu", "ព្រហស្បតិ៍"],
  ["Fri", "សុក្រ"],
  ["Sat", "សៅរ៍"],
];

interface LogEntry {
  id: string;
  date: string;
  note: string;
}

export default function PeriodTracker() {
  const { text: t } = useLanguage();
  const today = new Date().toISOString().slice(0, 10);
  const [cycle, setCycle] = useToolState("period-tracker:cycle", "28");
  const [period, setPeriod] = useToolState("period-tracker:period", "5");
  const [lmp, setLmp] = useToolState("period-tracker:lmp", today);
  const [log, setLog] = useToolState<LogEntry[]>("period-tracker:log", []);
  const [logDate, setLogDate] = useState(today);
  const [logNote, setLogNote] = useState("");
  const [view, setView] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const data = useMemo(() => {
    const cycleDays = Math.min(45, Math.max(21, Number(cycle) || 28));
    const periodDays = Math.min(14, Math.max(1, Number(period) || 5));
    const lmpDate = new Date(`${lmp}T00:00:00`);
    if (isNaN(lmpDate.getTime())) return null;
    const cycles = [];
    for (let k = 0; k < 9; k++) {
      const start = new Date(lmpDate.getTime() + k * cycleDays * DAY);
      // Ovulation is assumed ≈ cycle length − 14 days before the next period.
      cycles.push({ start, ovulation: new Date(start.getTime() + (cycleDays - 14) * DAY) });
    }
    return { cycleDays, periodDays, cycles };
  }, [lmp, cycle, period]);

  const flagsFor = (ts: number) => {
    if (!data) return { period: false, fertile: false, ovulation: false };
    for (const c of data.cycles) {
      const s = c.start.getTime();
      if (ts >= s && ts < s + data.periodDays * DAY) return { period: true, fertile: false, ovulation: false };
      const ov = c.ovulation.getTime();
      if (ts === ov) return { period: false, fertile: true, ovulation: true };
      if (ts > ov - 5 * DAY && ts < ov) return { period: false, fertile: true, ovulation: false };
    }
    return { period: false, fertile: false, ovulation: false };
  };

  const upcoming = useMemo(() => {
    if (!data) return [];
    const now = new Date().getTime();
    return data.cycles
      .filter((c) => c.start.getTime() >= now - DAY)
      .slice(0, 4)
      .map((c) => ({
        start: c.start,
        ovulation: c.ovulation,
        days: Math.round((c.start.getTime() - now) / DAY),
      }));
  }, [data]);

  const addLog = () => {
    if (!logDate || !logNote.trim()) return;
    setLog([{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, date: logDate, note: logNote.trim() }, ...log]);
    setLogNote("");
  };

  const monthName = (m: number) => t(MONTHS[m][0], MONTHS[m][1]);
  const fmtDay = (d: Date) => (d.getFullYear() === new Date().getFullYear() ? `${d.getDate()} ${monthName(d.getMonth())}` : `${d.getDate()} ${monthName(d.getMonth())} ${d.getFullYear()}`);

  const firstDay = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const todayTs = new Date(`${today}T00:00:00`).getTime();

  return (
    <ToolShell
      title="Period & Ovulation Tracker"
      khmerTitle="តាមដានវដ្តរដូវ"
      description="Predict upcoming periods, ovulation day, and the fertile window from your last period and cycle length."
      descriptionKm="ទស្សទាយវដ្តរដូវបន្ទាប់ ថ្ងៃបញ្ចេញពង និងរយៈពេលមានជីជាតិ ពីខែចុងក្រោយ និងប្រវែងវដ្ត។"
    >
      <Row>
        <Field label={t("Last period start date", "ថ្ងៃដំបូងនៃខែចុងក្រោយ")}>
          <input
            type="date"
            value={lmp}
            onChange={(e) => setLmp(e.target.value)}
            className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]"
          />
        </Field>
        <Field label={t("Cycle length (days)", "រយៈពេលវដ្ត (ថ្ងៃ)")} hint={t("21–45", "២១–៤៥")}>
          <TextInput inputMode="numeric" value={cycle} onChange={(e) => setCycle(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Period length (days)", "រយៈពេលមករដូវ (ថ្ងៃ)")} hint={t("1–14", "១–១៤")}>
          <TextInput inputMode="numeric" value={period} onChange={(e) => setPeriod(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>

      {data ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Next period starts", "រដូវបន្ទាប់ចាប់ផ្តើម")}</div>
              <div className="mt-1 text-sm font-semibold text-[var(--ink)]">{upcoming[0] ? fmtDay(upcoming[0].start) : "—"}</div>
              <div className="text-xs text-[var(--ink-faint)]">{upcoming[0] ? (upcoming[0].days > 0 ? t(`in ${upcoming[0].days} days`, `ក្នុង ${upcoming[0].days} ថ្ងៃ`) : t("ongoing", "កំពុងកើតឡើង")) : ""}</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Next ovulation", "ការបញ្ចេញពងបន្ទាប់")}</div>
              <div className="mt-1 text-sm font-semibold text-[var(--ink)]">{upcoming[0] ? fmtDay(upcoming[0].ovulation) : "—"}</div>
              <div className="text-xs text-[var(--ink-faint)]">{t("~14 days before next period", "~១៤ ថ្ងៃមុនរដូវបន្ទាប់")}</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Predicted periods", "វដ្តរដូវដែលបានទស្សទាយ")}</div>
              <div className="mt-1 text-sm font-semibold text-[var(--ink)]">
                {upcoming.slice(0, 3).map((u) => fmtDay(u.start)).join(" · ")}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))}
                className="rounded-md border border-[var(--ground-line)] px-3 py-1 text-sm text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
              >
                ‹
              </button>
              <div className="text-sm font-medium text-[var(--ink)]">
                {monthName(view.m)} {view.y}
              </div>
              <button
                type="button"
                onClick={() => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))}
                className="rounded-md border border-[var(--ground-line)] px-3 py-1 text-sm text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map(([en, km]) => (
                <div key={en} className="text-[10px] font-medium uppercase tracking-wide text-[var(--ink-faint)]">{t(en, km)}</div>
              ))}
              {cells.map((d, i) => {
                if (d === null) return <div key={`b${i}`} />;
                const ts = new Date(view.y, view.m, d).getTime();
                const f = flagsFor(ts);
                const isToday = ts === todayTs;
                const cls = f.period
                  ? "bg-[var(--danger)]/15 text-[var(--danger)]"
                  : f.ovulation
                    ? "bg-[var(--gold)]/40 font-semibold text-[var(--ink)]"
                    : f.fertile
                      ? "bg-[var(--gold)]/15 text-[var(--ink)]"
                      : "text-[var(--ink-dim)]";
                return (
                  <div
                    key={d}
                    className={`flex aspect-square items-center justify-center rounded text-xs ${cls} ${isToday ? "ring-1 ring-[var(--gold)]" : ""}`}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--ink-dim)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--danger)]/40" /> {t("Period", "ថ្ងៃរដូវ")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--gold)]/40" /> {t("Fertile window", "ថ្ងៃមានជីជាតិ")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--gold)]" /> {t("Ovulation day", "ថ្ងៃបញ្ចេញពង")}
              </span>
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter a valid last period date.", "សូមបញ្ចូលកាលបរិច្ឆេទខែចុងក្រោយឱ្យបានត្រឹមត្រូវ។")}</p>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-[var(--ink)]">{t("Symptoms & notes log", "កំណត់ហេតុរោគសញ្ញា និងចំណាំ")}</h2>
        <Row>
          <Field label={t("Date", "កាលបរិច្ឆេទ")}>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]"
            />
          </Field>
        </Row>
        <Field label={t("Symptom / note", "រោគសញ្ញា / កំណត់ចំណាំ")}>
          <TextArea
            value={logNote}
            onChange={(e) => setLogNote(e.target.value)}
            rows={2}
            placeholder={t("e.g. cramps, mood, flow…", "ឧ. ឈឺពោះ អារម្មណ៍ បរិមាណ…")}
          />
        </Field>
        <Button type="button" onClick={addLog} disabled={!logNote.trim()}>
          {t("Add entry", "បន្ថែមកំណត់ហេតុ")}
        </Button>
        {log.length > 0 && (
          <div className="space-y-2">
            {log.map((e) => (
              <div key={e.id} className="flex items-start justify-between gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2">
                <div>
                  <div className="text-xs font-medium text-[var(--ink)]">{e.date}</div>
                  <div className="text-sm text-[var(--ink-dim)]">{e.note}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setLog(log.filter((x) => x.id !== e.id))}
                  className="shrink-0 text-xs text-[var(--danger)]"
                >
                  {t("Delete", "លុប")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        {t("Estimates only, based on your average cycle length. Cycles vary — this is not medical advice. Consult a healthcare provider for diagnosis, contraception, or family planning.", "គ្រាន់តែជាការប៉ាន់ស្មាន ដោយផ្អែកលើប្រវែងវដ្តមធ្យមរបស់អ្នក។ វដ្តអាចប្រែប្រួល — មិនមែនជាដំបូន្មានវេជ្ជសាស្ត្រទេ។ សូមពិគ្រោះជាមួយគ្រូពេទ្យសម្រាប់ការវិនិច្ឆ័យ ការពន្យារកំណើត ឬការរៀបចំគ្រួសារ។")}
      </p>
    </ToolShell>
  );
}
