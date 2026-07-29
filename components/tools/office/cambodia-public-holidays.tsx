"use client";

import { FormEvent, useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { CAMBODIA_HOLIDAYS, HOLIDAY_YEARS, type HolidayKind } from "@/lib/cambodia-holidays";
import { parseIsoDateParts } from "@/lib/khmer-date";

type LocalHoliday = { id: string; name: string; nameKm: string; date: string; kind: HolidayKind; custom: true };
type VisibleHoliday = { id: string; name: string; nameKm: string; date: string; kind: HolidayKind; custom?: boolean; year: number };

function dateLabel(date: string) {
  const parsed = parseIsoDateParts(date);
  return parsed ? new Intl.DateTimeFormat(undefined, { weekday: "long", year: "numeric", month: "short", day: "numeric" }).format(parsed.date) : date;
}

export default function CambodiaPublicHolidays() {
  const { text } = useLanguage();
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
        <p><strong>{text("Source:", "ប្រភព៖")}</strong> {text("Data files supplied with this workspace; malformed trailing citation markup in the 2026 file was ignored.", "ឯកសារទិន្នន័យដែលបានផ្តល់ក្នុងគម្រោងនេះ; សញ្ញាយោងមិនត្រឹមត្រូវនៅចុងឯកសារឆ្នាំ ២០២៦ ត្រូវបានមិនរាប់បញ្ចូល។")}</p>
        <p><strong>{text("Accuracy:", "ភាពត្រឹមត្រូវ៖")}</strong> {text("Supplied data, not independently verified against an official government publication.", "ទិន្នន័យដែលបានផ្តល់ មិនទាន់បានផ្ទៀងផ្ទាត់ដោយឯករាជ្យជាមួយឯកសារផ្លូវការរបស់រដ្ឋាភិបាលទេ។")}</p>
        <p className="font-semibold text-amber-800 dark:text-amber-300">{text("Verify every date against a current Cambodian government announcement before making travel, payroll, or office-closure decisions.", "សូមផ្ទៀងផ្ទាត់កាលបរិច្ឆេទនីមួយៗជាមួយសេចក្តីប្រកាសបច្ចុប្បន្នរបស់រាជរដ្ឋាភិបាលកម្ពុជា មុនសម្រេចចិត្តអំពីការធ្វើដំណើរ បើកប្រាក់ខែ ឬបិទការិយាល័យ។")}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Year" labelKm="ឆ្នាំ"><Select value={year} onChange={(event) => setYear(event.target.value as typeof year)}><option value="all">{text("All years", "គ្រប់ឆ្នាំ")}</option>{HOLIDAY_YEARS.map((item) => <option key={item} value={item}>{item}</option>)}</Select></Field>
        <Field label="Search" labelKm="ស្វែងរក"><TextInput type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text("Name or date…", "ឈ្មោះ ឬកាលបរិច្ឆេទ…")} /></Field>
        <Field label="Date type" labelKm="ប្រភេទកាលបរិច្ឆេទ"><Select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="all">{text("All types", "គ្រប់ប្រភេទ")}</option><option value="fixed">{text("Fixed-date", "កាលបរិច្ឆេទថេរ")}</option><option value="variable">{text("Variable-date", "កាលបរិច្ឆេទប្រែប្រួល")}</option></Select></Field>
        <Field label="Entry source" labelKm="ប្រភពទិន្នន័យ"><Select value={source} onChange={(event) => setSource(event.target.value as typeof source)}><option value="all">{text("All entries", "ទិន្នន័យទាំងអស់")}</option><option value="reference">{text("Supplied lists", "បញ្ជីដែលបានផ្តល់")}</option><option value="custom">{text("My local entries", "ទិន្នន័យក្នុងម៉ាស៊ីនរបស់ខ្ញុំ")}</option></Select></Field>
      </div>
      <p className="text-xs text-[var(--ink-dim)]">{text(`${visible.length} dates shown`, `បង្ហាញ ${visible.length} កាលបរិច្ឆេទ`)}</p>
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