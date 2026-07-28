"use client";
import { useMemo } from "react";
import { ToolShell, Field, Select, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

interface PronounRow {
  km: string;
  latin: string;
  person: "1st" | "2nd" | "3rd";
  register: "Royal / Clergy" | "Formal" | "Neutral / Polite" | "Informal" | "Intimate / Caution";
  note: string;
}

// A quick-reference sketch of Khmer's register system, not an exhaustive
// grammar — Khmer pronoun choice depends heavily on the relative age,
// status, and closeness of speaker and listener, and the same word can
// shift register depending on tone and context. Useful for a translator or
// developer sanity-checking copy, not a substitute for a native reviewer.
const ROWS: PronounRow[] = [
  { km: "ព្រះករុណា", latin: "preăh karŭnéa", person: "1st", register: "Royal / Clergy", note: "\"I\", speaking to the King" },
  { km: "ទូលបង្គំ", latin: "tuol bangkum", person: "1st", register: "Royal / Clergy", note: "\"I\", to royalty or very senior monks" },
  { km: "អាត្មា", latin: "aatmaa", person: "1st", register: "Royal / Clergy", note: "\"I\", used by monks" },
  { km: "ខ្ញុំ", latin: "khnhom", person: "1st", register: "Neutral / Polite", note: "Standard, safe default \"I\" in almost any context" },
  { km: "ខ្ញុំបាទ", latin: "khnhom baat", person: "1st", register: "Formal", note: "Male speaker, more deferential" },
  { km: "ខ្ញុំម្ចាស់", latin: "khnhom mchah", person: "1st", register: "Formal", note: "Female speaker, more deferential" },
  { km: "អញ", latin: "anh", person: "1st", register: "Intimate / Caution", note: "Very casual among close peers; rude/aggressive toward strangers" },
  { km: "គង់", latin: "kong / koat", person: "3rd", register: "Neutral / Polite", note: "\"He/she\", respectful, common for someone senior" },
  { km: "លោក", latin: "look", person: "2nd", register: "Formal", note: "\"Mr. / Sir\", polite address for a man" },
  { km: "លោកស្រី", latin: "look srei", person: "2nd", register: "Formal", note: "\"Mrs. / Madam\", polite address for a woman" },
  { km: "អ្នក", latin: "neak", person: "2nd", register: "Neutral / Polite", note: "\"You\", safe default in most everyday contexts" },
  { km: "គាត់", latin: "koat", person: "3rd", register: "Neutral / Polite", note: "\"He/she\", respectful, most common third-person" },
  { km: "គេ", latin: "ke", person: "3rd", register: "Informal", note: "\"He/she/they\", casual, or generic \"people/someone\"" },
  { km: "ឯង", latin: "aeng", person: "2nd", register: "Intimate / Caution", note: "Very casual among close friends/family; can read as blunt otherwise" },
  { km: "មិត្ត", latin: "mit", person: "2nd", register: "Formal", note: "\"Friend/comrade\", used in speeches and some official contexts" },
  { km: "វា", latin: "vea", person: "3rd", register: "Intimate / Caution", note: "\"It\" for animals/objects; for a person it's dismissive or derogatory" },
];

const REGISTERS = ["All", "Royal / Clergy", "Formal", "Neutral / Polite", "Informal", "Intimate / Caution"] as const;
const PERSONS = ["All", "1st", "2nd", "3rd"] as const;

export default function PronounRegister() {
  const [register, setRegister] = useToolState<(typeof REGISTERS)[number]>("pronoun-register:register", "All");
  const [person, setPerson] = useToolState<(typeof PERSONS)[number]>("pronoun-register:person", "All");
  const [query, setQuery] = useToolState("pronoun-register:query", "");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ROWS.filter(
      (r) =>
        (register === "All" || r.register === register) &&
        (person === "All" || r.person === person) &&
        (q === "" || r.km.includes(q) || r.latin.toLowerCase().includes(q) || r.note.toLowerCase().includes(q))
    );
  }, [register, person, query]);

  return (
    <ToolShell
      title="Khmer Pronoun & Register Reference"
      khmerTitle="សព្វនាមតាមកម្រិត"
      description="Khmer picks pronouns based on the relative age, status, and closeness of speaker and listener rather than grammatical rules. This is a quick-reference sketch for translators and content writers — treat it as a starting point, not a substitute for a native reviewer on anything sensitive or official."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Register">
          <Select value={register} onChange={(e) => setRegister(e.target.value as (typeof REGISTERS)[number])}>
            {REGISTERS.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </Field>
        <Field label="Person">
          <Select value={person} onChange={(e) => setPerson(e.target.value as (typeof PERSONS)[number])}>
            {PERSONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Search">
          <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="km, latin, or note…" />
        </Field>
      </div>

      <div className="overflow-hidden rounded-md border border-[var(--ground-line)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--ground-raised)] text-xs uppercase tracking-wide text-[var(--ink-dim)]">
            <tr>
              <th className="px-3 py-2">Khmer</th>
              <th className="px-3 py-2">Latin</th>
              <th className="px-3 py-2">Person</th>
              <th className="px-3 py-2">Register</th>
              <th className="px-3 py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-[var(--ground-line)]">
                <td className="px-3 py-2 font-khmer text-base">{r.km}</td>
                <td className="px-3 py-2 text-[var(--ink-dim)]">{r.latin}</td>
                <td className="px-3 py-2 text-[var(--ink-dim)]">{r.person}</td>
                <td className="px-3 py-2 text-[var(--ink-dim)]">{r.register}</td>
                <td className="px-3 py-2 text-[var(--ink-faint)]">{r.note}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-[var(--ink-faint)]">No matches</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </ToolShell>
  );
}
