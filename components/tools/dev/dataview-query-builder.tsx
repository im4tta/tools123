"use client";
import { useMemo } from "react";
import { Plus, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { CopyButton } from "@/components/CopyButton";
import { Field, Select, TextInput, ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

type QType = "TABLE" | "LIST" | "TASK";
type Cond = { field: string; op: string; value: string };

const OPS = ["=", "!=", ">", ">=", "<", "<=", "contains"];

function fmtValue(v: string): string {
  const s = v.trim();
  if (s === "") return '""';
  if (/^-?\d+(\.\d+)?$/.test(s)) return s;
  if (/^(true|false)$/i.test(s)) return s.toLowerCase();
  if (/^(date\(|\[\[|this\.)/.test(s)) return s; // dataview expression, leave raw
  return JSON.stringify(s);
}

function buildCond(c: Cond): string | null {
  const field = c.field.trim();
  if (!field) return null;
  if (c.op === "contains") return `contains(${field}, ${fmtValue(c.value)})`;
  return `${field} ${c.op} ${fmtValue(c.value)}`;
}

function buildQuery(type: QType, fields: string, from: string, conds: Cond[], sortField: string, sortDir: string, limit: string): string {
  const lines: string[] = [];
  lines.push(type === "TABLE" && fields.trim() ? `TABLE ${fields.trim()}` : type);
  if (from.trim()) lines.push(`FROM ${from.trim()}`);
  const where = conds.map(buildCond).filter(Boolean);
  if (where.length) lines.push(`WHERE ${where.join(" AND ")}`);
  if (sortField.trim()) lines.push(`SORT ${sortField.trim()} ${sortDir}`);
  if (limit.trim() && Number(limit) > 0) lines.push(`LIMIT ${Number(limit)}`);
  return "```dataview\n" + lines.join("\n") + "\n```";
}

export default function DataviewQueryBuilder() {
  const { text: t } = useLanguage();
  const [type, setType] = useToolState<QType>("dataview:type", "TABLE");
  const [fields, setFields] = useToolState("dataview:fields", "file.ctime as Created");
  const [from, setFrom] = useToolState("dataview:from", "#project");
  const [conds, setConds] = useToolState<Cond[]>("dataview:conds", [{ field: "status", op: "=", value: "active" }]);
  const [sortField, setSortField] = useToolState("dataview:sortField", "file.ctime");
  const [sortDir, setSortDir] = useToolState("dataview:sortDir", "DESC");
  const [limit, setLimit] = useToolState("dataview:limit", "");

  const query = useMemo(() => buildQuery(type, fields, from, conds, sortField, sortDir, limit), [type, fields, from, conds, sortField, sortDir, limit]);

  const update = (i: number, patch: Partial<Cond>) => setConds((prev) => prev.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  return (
    <ToolShell
      title="Obsidian Dataview Query Builder"
      khmerTitle="ឧបករណ៍បង្កើត Query សម្រាប់ Dataview"
      description={'Build Dataview queries for Obsidian without memorising the syntax. Choose TABLE, LIST, or TASK, set the source (a #tag, "folder", or [[link]]), add WHERE conditions, sorting, and a limit, then copy a ready-to-paste dataview code block. Runs in your browser.'}
      descriptionKm={'បង្កើត Dataview query សម្រាប់ Obsidian ដោយមិនចាំបាច់ចងចាំវាក្យសម្ព័ន្ធ។ ជ្រើស TABLE, LIST ឬ TASK កំណត់ប្រភព (#tag, "folder" ឬ [[link]]) បន្ថែមលក្ខខណ្ឌ WHERE ការតម្រៀប និងដែនកំណត់ រួចចម្លងប្លុកកូដ dataview ត្រៀមបិទភ្ជាប់។ ដំណើរការក្នុងកម្មវិធីរុករក។'}
    >
      <div className="flex flex-wrap items-center gap-2">
        {(["TABLE", "LIST", "TASK"] as QType[]).map((q) => (
          <button key={q} type="button" onClick={() => setType(q)} className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${type === q ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}>{q}</button>
        ))}
      </div>

      {type === "TABLE" && (
        <Field label="Columns" labelKm="ជួរឈរ" hint="comma-separated, e.g. field as Name" hintKm="បំបែកដោយ, ឧ. field as Name">
          <TextInput value={fields} onChange={(e) => setFields(e.target.value)} autoComplete="off" />
        </Field>
      )}
      <Field label="From (source)" labelKm="ពី (ប្រភព)" hint='#tag, "folder", or [[link]]' hintKm='#tag, "folder" ឬ [[link]]'>
        <TextInput value={from} onChange={(e) => setFrom(e.target.value)} autoComplete="off" />
      </Field>

      <div>
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Where conditions", "លក្ខខណ្ឌ Where")}</span>
        <div className="space-y-2">
          {conds.map((c, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
              <TextInput value={c.field} onChange={(e) => update(i, { field: e.target.value })} placeholder={t("field", "វាល")} autoComplete="off" />
              <Select value={c.op} onChange={(e) => update(i, { op: e.target.value })} className="w-auto">
                {OPS.map((o) => <option key={o} value={o}>{o}</option>)}
              </Select>
              <TextInput value={c.value} onChange={(e) => update(i, { value: e.target.value })} placeholder={t("value", "តម្លៃ")} autoComplete="off" />
              <button type="button" onClick={() => setConds((prev) => prev.filter((_, j) => j !== i))} aria-label={t("Remove", "លុប")} className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--ground-line)] text-[var(--ink-faint)] transition hover:border-[var(--danger)]/50 hover:text-[var(--danger)]">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setConds((prev) => [...prev, { field: "", op: "=", value: "" }])} className="mt-2 flex w-fit items-center gap-1.5 rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--ink-faint)]">
          <Plus size={13} />{t("Add condition", "បន្ថែមលក្ខខណ្ឌ")}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Sort by" labelKm="តម្រៀបតាម"><TextInput value={sortField} onChange={(e) => setSortField(e.target.value)} placeholder="file.name" autoComplete="off" /></Field>
        <Field label="Direction" labelKm="ទិសដៅ">
          <Select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
            <option value="ASC">ASC</option>
            <option value="DESC">DESC</option>
          </Select>
        </Field>
        <Field label="Limit" labelKm="ដែនកំណត់"><TextInput type="number" min={0} value={limit} onChange={(e) => setLimit(e.target.value)} placeholder={t("none", "គ្មាន")} autoComplete="off" /></Field>
      </div>

      <div className="flex items-center gap-2"><span className="text-xs text-[var(--ink-faint)]">{t("Copy query", "ចម្លង query")}</span><CopyButton text={query} compact /></div>
      <Output label="Dataview" value={query} />

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "The query follows the Dataview Query Language (the community Dataview plugin for Obsidian by Michael Brenan / blacksmithgu, MIT). String values are quoted automatically; numbers, booleans, and dataview expressions like date(today) or [[link]] are left raw. Built in your browser. Not affiliated with Obsidian or the Dataview plugin.",
          "Query អនុវត្តតាម Dataview Query Language (កម្មវិធីជំនួយ Dataview សម្រាប់ Obsidian ដោយ Michael Brenan / blacksmithgu, MIT)។ តម្លៃខ្សែអក្សរត្រូវដាក់សញ្ញាសម្រង់ដោយស្វ័យប្រវត្តិ ចំណែកលេខ ប៊ូលៀន និងកន្សោម dataview ដូចជា date(today) ឬ [[link]] ត្រូវទុកដើម។ បង្កើតក្នុងកម្មវិធីរុករក។ មិនពាក់ព័ន្ធនឹង Obsidian ឬកម្មវិធីជំនួយ Dataview ទេ។",
        )}</p>
      </section>
    </ToolShell>
  );
}
