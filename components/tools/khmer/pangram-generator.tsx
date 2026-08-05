"use client";

import { Copy, RefreshCw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { CopyButton } from "@/components/CopyButton";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { KHMER_CONSONANTS, KHMER_DIACRITICS, KHMER_INDEPENDENT_VOWELS, KHMER_SUBSCRIPTS, KHMER_VOWELS } from "@/lib/data/khmer-romanization";

type CoverageGroup = { key: string; label: string; khmer: string; chars: string[] };

const GROUPS: CoverageGroup[] = [
  { key: "consonants", label: "Consonants", khmer: "ព្យញ្ជនៈ", chars: Object.keys(KHMER_CONSONANTS) },
  { key: "subscripts", label: "Subscripts", khmer: "ជើងអក្សរ", chars: Object.keys(KHMER_SUBSCRIPTS) },
  { key: "vowels", label: "Dependent vowels", khmer: "ស្រៈនិស្ស័យ", chars: Object.keys(KHMER_VOWELS) },
  { key: "independent", label: "Independent vowels", khmer: "ស្រៈពេញតួ", chars: Object.keys(KHMER_INDEPENDENT_VOWELS) },
  { key: "signs", label: "Signs", khmer: "សញ្ញា", chars: Object.keys(KHMER_DIACRITICS) },
];

const DEFAULT_TEXT = "សួស្តី! នេះជាអត្ថបទសាកល្បងអក្សរខ្មែរ។";

function uniqueChars(value: string) { return [...new Set([...value])]; }

export default function PangramGenerator() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("pangram-generator:input", DEFAULT_TEXT);
  const [generated, setGenerated] = useState("");
  const coverage = useMemo(() => GROUPS.map((group) => {
    const missing = group.chars.filter((character) => !input.includes(character));
    return { ...group, present: group.chars.length - missing.length, missing };
  }), [input]);
  const allMissing = coverage.flatMap((group) => group.missing);

  function generateMissingSentence() {
    const missing = uniqueChars(allMissing.join("")).join(" ");
    setGenerated(missing ? `សាកល្បងបង្ហាញតួអក្សរខ្មែរ៖ ${missing}។` : "អត្ថបទនេះគ្របដណ្តប់តួអក្សរគ្រប់ប្រភេទដែលបានកំណត់។");
  }

  function generateFullSet() {
    const chars = uniqueChars(GROUPS.flatMap((group) => group.chars).join(""));
    setGenerated(`សំណុំតួអក្សរសម្រាប់សាកល្បង៖ ${chars.join(" ")}។`);
  }

  return <ToolShell title="Khmer Pangram & Character Coverage Generator" khmerTitle="កម្មវិធីបង្កើត Pangram និងពិនិត្យគ្របដណ្តប់តួអក្សរខ្មែរ" description="Generate Khmer font test sentences and measure coverage across consonants, subscripts, vowels, independent vowels, and signs." descriptionKm="បង្កើតប្រយោគសាកល្បង Font ខ្មែរ និងវាស់ការគ្របដណ្តប់លើព្យញ្ជនៈ ជើងអក្សរ ស្រៈ ស្រៈពេញតួ និងសញ្ញា។">
    <div className="space-y-5">
      <Field label={t("Test text", "អត្ថបទសាកល្បង")} hint={t("Paste a sample to measure coverage", "បិទភ្ជាប់អត្ថបទដើម្បីវាស់ការគ្របដណ្តប់")}>
        <TextArea rows={4} value={input} onChange={(event) => setInput(event.target.value)} className="font-khmer text-lg leading-relaxed" />
      </Field>
      <section className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold text-[var(--ink)]">{t("Coverage", "ការគ្របដណ្តប់")}</h2><span className="text-xs text-[var(--ink-faint)]">{t(`${allMissing.length} missing characters`, `តួអក្សរខ្វះ ${allMissing.length}`)}</span></div>
        <div className="space-y-3">{coverage.map((group) => { const percent = group.chars.length ? Math.round((group.present / group.chars.length) * 100) : 100; return <div key={group.key}><div className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-[var(--ink)]">{t(group.label, group.khmer)}</span><span className="font-mono-ui text-xs text-[var(--ink-dim)]">{group.present} / {group.chars.length}</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--ground-line)]"><div className="h-full rounded-full bg-[var(--gold)] transition-all" style={{ width: `${percent}%` }} /></div>{group.missing.length > 0 && <p className="mt-1 font-khmer text-sm text-[var(--danger)]">{group.missing.join(" ")}</p>}</div>; })}</div>
      </section>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={generateMissingSentence} className="inline-flex items-center gap-2 rounded-lg bg-[var(--gold)] px-3 py-2 text-xs font-bold text-[#0a0c0d]"><Sparkles size={14} />{t("Generate missing-character sentence", "បង្កើតប្រយោគតួអក្សរខ្វះ")}</button><button type="button" onClick={generateFullSet} className="inline-flex items-center gap-2 rounded-lg border border-[var(--ground-line)] px-3 py-2 text-xs font-semibold text-[var(--ink-dim)]"><RefreshCw size={14} />{t("Generate full character set", "បង្កើតសំណុំតួអក្សរពេញ")}</button></div>
      {generated && <section className="rounded-2xl border border-[var(--success)]/30 bg-[var(--success)]/5 p-4"><div className="mb-2 flex items-center justify-between gap-3"><h2 className="font-display text-sm font-semibold text-[var(--ink)]">{t("Generated test sentence", "ប្រយោគសាកល្បងដែលបានបង្កើត")}</h2><CopyButton compact text={generated} /></div><p className="font-khmer text-lg leading-loose text-[var(--ink)]">{generated}</p></section>}
      <p className="flex items-start gap-2 text-xs leading-relaxed text-[var(--ink-faint)]"><Copy size={13} className="mt-0.5 shrink-0" />{t("Coverage measures codepoint presence in the pasted text; it does not prove that a font renders every glyph correctly.", "ការគ្របដណ្តប់វាស់តែវត្តមាន Codepoint ក្នុងអត្ថបទដែលបានបិទភ្ជាប់ មិនអាចធានាថា Font បង្ហាញ Glyph ទាំងអស់បានត្រឹមត្រូវទេ។")}</p>
    </div>
  </ToolShell>;
}
