"use client";

import { FormEvent, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useLanguage, type LanguageMode } from "@/components/LanguageProvider";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { CAMBODIA_HOLIDAYS, HOLIDAY_YEARS, type HolidayKind } from "@/lib/cambodia-holidays";
import { parseIsoDateParts, toKhmerDigits } from "@/lib/khmer-date";

const MONTH_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_KM = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
const WEEKDAY_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_KM = ["អាទិត្យ", "ចន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];

type LocalHoliday = { id: string; name: string; nameKm: string; date: string; kind: HolidayKind; custom: true };
type VisibleHoliday = { id: string; name: string; nameKm: string; date: string; kind: HolidayKind; custom?: boolean; year: number };

function dateLabel(date: string) {
  const parsed = parseIsoDateParts(date);
  return parsed ? new Intl.DateTimeFormat(undefined, { weekday: "long", year: "numeric", month: "short", day: "numeric" }).format(parsed.date) : date;
}

export default function CambodiaPublicHolidays() {
  const { text, mode } = useLanguage();
  const [custom, setCustom] = useToolState<LocalHoliday[]>("office-cambodia-holidays-custom", []);
  const [year, setYear] = useState<"all" | "2026" | "2027">("2026");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | HolidayKind>("all");
  const [source, setSource] = useState<"all" | "reference" | "custom">("all");
  const [draft, setDraft] = useState({ name: "", nameKm: "", date: "", kind: "fixed" as HolidayKind });
  const visible = useMemo(() => {
    const supplied: VisibleHoliday[] = CAMBODIA_HOLIDAYS;
    const local: VisibleHoliday[] = custom.map((item) => ({ ...item, year: Number(item.date.slice(0, 4)) }));
    return [...supplied, ...local].filter((holiday) => {
      const needle = query.trim().toLocaleLowerCase();
      return (year === "all" || holiday.year === Number(year))
        && (!needle || `${holiday.name} ${holiday.nameKm} ${holiday.date}`.toLocaleLowerCase().includes(needle))
        && (kind === "all" || holiday.kind === kind)
        && (source === "all" || (source === "custom" ? holiday.custom : !holiday.custom));
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [custom, kind, query, source, year]);

  const monthGroups = useMemo(() => {
    const map = new Map<string, VisibleHoliday[]>();
    for (const holiday of visible) {
      const key = holiday.date.slice(0, 7);
      map.set(key, [...(map.get(key) ?? []), holiday]);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [visible]);

  function addCustom(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim() || !parseIsoDateParts(draft.date)) return;
    setCustom((items) => [...items, { id: crypto.randomUUID(), name: draft.name.trim(), nameKm: draft.nameKm.trim(), date: draft.date, kind: draft.kind, custom: true }]);
    setDraft({ name: "", nameKm: "", date: "", kind: "fixed" });
  }

  const kindLabel = (value: HolidayKind) => value === "fixed" ? text("Fixed-date", "កាលបរិច្ឆេទថេរ") : text("Variable-date", "កាលបរិច្ឆេទប្រែប្រួល");

  return (
    <ToolShell title="Cambodia Public Holidays" khmerTitle="ថ្ងៃឈប់សម្រាកសាធារណៈកម្ពុជា" description="Browse supplied Cambodia holiday lists for 2026 and 2027, and add private local planning dates." descriptionKm="មើលបញ្ជីថ្ងៃឈប់សម្រាកកម្ពុជាឆ្នាំ ២០២៦ និង ២០២៧ ដែលបានផ្តល់ និងបន្ថែមកាលបរិច្ឆេទផែនការឯកជន។">

      <div className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-[var(--ink)]">
        <p><strong>{text("Reference years:", "ឆ្នាំយោង៖")}</strong> {HOLIDAY_YEARS.join(", ")}</p>
        <p><strong>{text("Status:", "ស្ថានភាព៖")}</strong> {text("The 2026 list is official. The 2027 list is provisional and will be updated around September, when the government announces the official schedule.", "បញ្ជីឆ្នាំ ២០២៦ ជាបញ្ជីផ្លូវការ។ បញ្ជីឆ្នាំ ២០២៧ ជាបញ្ជីបណ្តោះអាសន្ន ហើយនឹងត្រូវបានធ្វើបច្ចុប្បន្នភាពប្រហែលខែកញ្ញា នៅពេលរដ្ឋាភិបាលប្រកាសកាលវិភាគផ្លូវការ។")}</p>
        <p className="font-semibold text-amber-800 dark:text-amber-300">{text("Verify every date against a current Cambodian government announcement before making travel, payroll, or office-closure decisions.", "សូមផ្ទៀងផ្ទាត់កាលបរិច្ឆេទនីមួយៗជាមួយសេចក្តីប្រកាសបច្ចុប្បន្នរបស់រាជរដ្ឋាភិបាលកម្ពុជា មុនសម្រេចចិត្តអំពីការធ្វើដំណើរ បើកប្រាក់ខែ ឬបិទការិយាល័យ។")}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Year" labelKm="ឆ្នាំ"><Select value={year} onChange={(event) => setYear(event.target.value as typeof year)}><option value="all">{text("All years", "គ្រប់ឆ្នាំ")}</option>{HOLIDAY_YEARS.map((item) => <option key={item} value={item}>{item}</option>)}</Select></Field>
        <Field label="Search" labelKm="ស្វែងរក"><TextInput type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text("Name or date…", "ឈ្មោះ ឬកាលបរិច្ឆេទ…")} /></Field>
        <Field label="Date type" labelKm="ប្រភេទកាលបរិច្ឆេទ"><Select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="all">{text("All types", "គ្រប់ប្រភេទ")}</option><option value="fixed">{text("Fixed-date", "កាលបរិច្ឆេទថេរ")}</option><option value="variable">{text("Variable-date", "កាលបរិច្ឆេទប្រែប្រួល")}</option></Select></Field>
        <Field label="Entry source" labelKm="ប្រភពទិន្នន័យ"><Select value={source} onChange={(event) => setSource(event.target.value as typeof source)}><option value="all">{text("All entries", "ទិន្នន័យទាំងអស់")}</option><option value="reference">{text("Supplied lists", "បញ្ជីដែលបានផ្តល់")}</option><option value="custom">{text("My local entries", "ទិន្នន័យក្នុងម៉ាស៊ីនរបស់ខ្ញុំ")}</option></Select></Field>
      </div>
      <p className="text-xs text-[var(--ink-dim)]">{text(`${visible.length} dates shown`, `បង្ហាញ ${visible.length} កាលបរិច្ឆេទ`)}</p>
      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <h2 className="flex items-center gap-2 font-medium text-[var(--ink)]">
          <CalendarDays size={16} className="text-[var(--gold)]" />
          {text("Calendar preview", "មើលប្រតិទិន")}
        </h2>
        {monthGroups.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--ink-dim)]">{text("No holiday months to preview.", "មិនមានខែឈប់សម្រាកដើម្បីមើលជាមុនទេ។")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {monthGroups.map(([key, holidays]) => (
              <CalendarMonthCard key={key} year={Number(key.slice(0, 4))} month={Number(key.slice(5, 7))} holidays={holidays} mode={mode} />
            ))}
          </div>
        )}
      </section>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {!visible.length && <p className="col-span-full py-8 text-center text-sm text-[var(--ink-dim)]">{text("No matching dates.", "មិនមានកាលបរិច្ឆេទដែលត្រូវគ្នា។")}</p>}
        {visible.map((holiday) => <article key={holiday.id} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="font-medium text-[var(--ink)]">{holiday.name}</h2>{holiday.nameKm && <p lang="km" className="mt-1 font-khmer text-sm text-[var(--gold)]">{holiday.nameKm}</p>}<p className="mt-2 text-sm font-semibold text-[var(--ink)]">{dateLabel(holiday.date)}</p><p className="mt-1 text-xs text-[var(--ink-dim)]">{kindLabel(holiday.kind)} · {holiday.custom ? text("Local entry", "ទិន្នន័យក្នុងម៉ាស៊ីន") : text(`${holiday.year} supplied list`, `បញ្ជីឆ្នាំ ${holiday.year} ដែលបានផ្តល់`)}</p></div>{holiday.custom && <Button type="button" className="!bg-[var(--danger)] !px-3 !py-1.5 !text-white" onClick={() => setCustom((items) => items.filter((item) => item.id !== holiday.id))}>{text("Delete", "លុប")}</Button>}</div></article>)}
      </div>

      <form onSubmit={addCustom} className="space-y-4 rounded-md border border-[var(--ground-line)] p-4">
        <div><h2 className="font-medium text-[var(--ink)]">{text("Add a local planning date", "បន្ថែមកាលបរិច្ឆេទផែនការក្នុងម៉ាស៊ីន")}</h2><p className="mt-1 text-xs text-[var(--ink-dim)]">{text("Saved only in this browser and clearly marked as your entry—not an official holiday.", "រក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ និងសម្គាល់ច្បាស់ថាជាទិន្នន័យរបស់អ្នក មិនមែនថ្ងៃឈប់សម្រាកផ្លូវការទេ។")}</p></div>
        <Row><Field label="Name" labelKm="ឈ្មោះ"><TextInput required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field><Field label="Khmer name (optional)" labelKm="ឈ្មោះខ្មែរ (ជាជម្រើស)"><TextInput value={draft.nameKm} onChange={(event) => setDraft({ ...draft, nameKm: event.target.value })} /></Field></Row>
        <Row><Field label="Date" labelKm="កាលបរិច្ឆេទ"><TextInput required type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></Field><Field label="Date type" labelKm="ប្រភេទកាលបរិច្ឆេទ"><Select value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as HolidayKind })}><option value="fixed">{text("Fixed-date", "កាលបរិច្ឆេទថេរ")}</option><option value="variable">{text("Variable-date", "កាលបរិច្ឆេទប្រែប្រួល")}</option></Select></Field></Row>
        <Button type="submit">{text("Add local entry", "បន្ថែមទិន្នន័យក្នុងម៉ាស៊ីន")}</Button>
      </form>
    </ToolShell>
  );
}

function monthGrid(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = Array(first.getDay()).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function CalendarMonthCard({ year, month, holidays, mode }: { year: number; month: number; holidays: VisibleHoliday[]; mode: LanguageMode }) {
  const rows = useMemo(() => monthGrid(year, month), [year, month]);
  const byDay = useMemo(() => {
    const map = new Map<number, VisibleHoliday[]>();
    for (const holiday of holidays) {
      const day = Number(holiday.date.slice(8, 10));
      map.set(day, [...(map.get(day) ?? []), holiday]);
    }
    return map;
  }, [holidays]);
  const monthIndex = month - 1;
  const enLabel = `${MONTH_EN[monthIndex]} ${year}`;
  const kmLabel = `${MONTH_KM[monthIndex]} ${toKhmerDigits(year)}`;
  const dayNum = (day: number) => (mode === "en" ? String(day) : toKhmerDigits(day));
  return (
    <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
      <h3 className="mb-1 text-center text-sm font-semibold text-[var(--ink)]">{mode === "km" ? kmLabel : enLabel}</h3>
      {mode === "bi" && <p className="mb-2 text-center font-khmer text-sm text-[var(--gold)]">{kmLabel}</p>}
      <table className="w-full border-collapse text-center">
        <thead>
          <tr>
            {WEEKDAY_EN.map((day, i) => (
              <th key={i} className="pb-1 text-[10px] font-medium text-[var(--ink-faint)]">
                {mode === "km" ? WEEKDAY_KM[i] : WEEKDAY_EN[i]}
                {mode === "bi" && <span className="block font-khmer text-[10px] font-normal text-[var(--gold)]">{WEEKDAY_KM[i]}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((day, ci) => {
                if (!day) return <td key={ci} className="p-0.5" />;
                const hols = byDay.get(day);
                return (
                  <td key={ci} className="p-0.5">
                    <div
                      title={hols ? hols.map((h) => `${h.name}${h.nameKm ? ` · ${h.nameKm}` : ""}`).join("\n") : undefined}
                      className={`flex h-8 flex-col items-center justify-center rounded-md text-xs ${hols ? "bg-[var(--gold)]/15 font-bold text-[var(--gold)]" : "text-[var(--ink-dim)]"}`}
                    >
                      <span>{dayNum(day)}</span>
                      {hols && <span className="mt-0.5 h-1 w-1 rounded-full bg-[var(--gold)]" />}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}