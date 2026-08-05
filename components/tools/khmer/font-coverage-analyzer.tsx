"use client";

import { CheckCircle2, FileSearch, XCircle } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, ToolShell } from "@/components/ui/Shell";
import { inspectCodepointCoverage } from "@/components/tools/khmer/font-encoding-inspector";
import { KHMER_CONSONANTS, KHMER_DIACRITICS, KHMER_INDEPENDENT_VOWELS, KHMER_SUBSCRIPTS, KHMER_VOWELS, KHMER_NUMBERS } from "@/lib/data/khmer-romanization";

type CoverageGroup = { label: string; khmer: string; codepoints: number[] };
type FontReport = { fileName: string; groups: (CoverageGroup & { present: number; missing: number[] })[]; block: { present: number; missing: number[] }; core: { present: number; total: number } };

const codepoints = (characters: string[]) => [...new Set(characters.flatMap((value) => [...value].map((character) => character.codePointAt(0)!)))];
const consonants = codepoints(Object.keys(KHMER_CONSONANTS));
const punctuation = codepoints(["។", "៕", "៖", "ៗ", "៚"]);
const groups: CoverageGroup[] = [
  { label: "Consonants", khmer: "ព្យញ្ជនៈ", codepoints: consonants },
  { label: "Subscripts", khmer: "ជើងអក្សរ", codepoints: codepoints(Object.keys(KHMER_SUBSCRIPTS)) },
  { label: "Vowels", khmer: "ស្រៈ", codepoints: codepoints(Object.keys(KHMER_VOWELS)) },
  { label: "Independent vowels", khmer: "ស្រៈពេញតួ", codepoints: codepoints(Object.keys(KHMER_INDEPENDENT_VOWELS)) },
  { label: "Signs", khmer: "សញ្ញា", codepoints: codepoints(Object.keys(KHMER_DIACRITICS)) },
  { label: "Numerals", khmer: "លេខខ្មែរ", codepoints: codepoints(Object.keys(KHMER_NUMBERS)) },
  { label: "Punctuation", khmer: "វណ្ណយុត្តិ", codepoints: punctuation },
];
// The Unicode block contains reserved/unassigned codepoints. The headline
// coverage therefore measures the tested Khmer character set, not empty slots
// in U+1780–U+17FF that no font is expected to map.
const blockCodepoints = [...new Set(groups.flatMap((group) => group.codepoints))];

function hex(codepoint: number) { return `U+${codepoint.toString(16).toUpperCase().padStart(4, "0")}`; }

export default function FontCoverageAnalyzer() {
  const { text: t } = useLanguage();
  const [report, setReport] = useState<FontReport | null>(null);
  const [error, setError] = useState("");

  async function inspect(file: File | undefined) {
    if (!file) return;
    setReport(null); setError("");
    if (file.size > 20 * 1024 * 1024) { setError(t("Choose a font file smaller than 20 MB.", "សូមជ្រើសរើស Font តូចជាង ២០ MB។")); return; }
    try {
      const buffer = await file.arrayBuffer();
      const blockCoverage = inspectCodepointCoverage(buffer, blockCodepoints);
      const makeGroup = (group: CoverageGroup) => {
        const coverage = inspectCodepointCoverage(buffer, group.codepoints);
        return { ...group, present: coverage.filter(Boolean).length, missing: group.codepoints.filter((_, index) => !coverage[index]) };
      };
      const checkedGroups = groups.map(makeGroup);
      const coreCodepoints = [...new Set(checkedGroups.flatMap((group) => group.codepoints))];
      const coreCoverage = inspectCodepointCoverage(buffer, coreCodepoints);
      setReport({ fileName: file.name, groups: checkedGroups, block: { present: blockCoverage.filter(Boolean).length, missing: blockCodepoints.filter((_, index) => !blockCoverage[index]) }, core: { present: coreCoverage.filter(Boolean).length, total: coreCodepoints.length } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Unable to inspect this font.", "មិនអាចពិនិត្យ Font នេះបានទេ។"));
    }
  }

  return <ToolShell title="Khmer Font Coverage Analyzer" khmerTitle="វិភាគការគាំទ្រអក្សរខ្មែរ ក្នុង Font" description="Inspect TTF or OTF cmap coverage for Khmer Unicode characters, consonants, subscripts, vowels, signs, numerals, and punctuation." descriptionKm="ពិនិត្យការគាំទ្រ Cmap ក្នុង Font TTF ឬ OTF សម្រាប់តួអក្សរខ្មែរ ព្យញ្ជនៈ ជើងអក្សរ ស្រៈ សញ្ញា លេខ និងវណ្ណយុត្តិ។">
    <Field label={t("TTF or OTF font file", "ឯកសារ Font TTF ឬ OTF")}>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-sm text-[var(--ink-dim)] hover:border-[var(--gold-dim)] hover:text-[var(--ink)]"><FileSearch size={18} />{report?.fileName ?? t("Choose a local font file", "ជ្រើសរើស Font ពីឧបករណ៍") }<input type="file" accept=".ttf,.otf,font/ttf,font/otf" className="sr-only" onChange={(event) => { void inspect(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} /></label>
    </Field>
    {error && <p role="status" className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">{error}</p>}
    {report && <div className="space-y-5"><section className="rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-5"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold text-[var(--ink)]">{t("Khmer Font Coverage", "ការគ្របដណ្តប់អក្សរខ្មែរ")}</h2><span className="text-xs text-[var(--ink-faint)]">{report.fileName}</span></div><div className="mb-5"><div className="flex items-center justify-between text-sm font-semibold text-[var(--ink)]"><span>{t("Khmer Unicode block", "ប្លុកយូនីកូដខ្មែរ")}</span><span>{Math.round((report.block.present / blockCodepoints.length) * 100)}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-[var(--ground-line)]"><div className="h-full rounded-full bg-[var(--gold)]" style={{ width: `${(report.block.present / blockCodepoints.length) * 100}%` }} /></div><p className="mt-1 text-xs text-[var(--ink-faint)]">{report.block.present} / {blockCodepoints.length} codepoints</p></div><div className="space-y-3">{report.groups.map((group) => { const complete = group.present === group.codepoints.length; return <div key={group.label}><div className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-[var(--ink)]">{t(group.label, group.khmer)}</span><span className={`flex items-center gap-1 font-mono-ui ${complete ? "text-[var(--success)]" : "text-[var(--gold)]"}`}>{complete ? <CheckCircle2 size={14} /> : <XCircle size={14} />}{group.present}/{group.codepoints.length}</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--ground-line)]"><div className={`h-full rounded-full ${complete ? "bg-[var(--success)]" : "bg-[var(--gold)]"}`} style={{ width: `${(group.present / group.codepoints.length) * 100}%` }} /></div></div>; })}</div></section><section className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><h2 className="mb-3 font-display text-lg font-semibold text-[var(--ink)]">{t("Missing glyphs", "Glyph ដែលខ្វះ")}</h2>{report.groups.every((group) => group.missing.length === 0) && report.block.missing.length === 0 ? <p className="text-sm text-[var(--success)]">{t("No missing cmap codepoints were found in the tested sets.", "មិនរកឃើញ Codepoint ដែលខ្វះក្នុងសំណុំដែលបានសាកល្បងទេ។")}</p> : <div className="grid gap-3 sm:grid-cols-2">{report.groups.filter((group) => group.missing.length > 0).map((group) => <div key={group.label} className="rounded-lg border border-[var(--danger)]/25 bg-[var(--danger)]/5 p-3"><h3 className="text-xs font-bold text-[var(--danger)]">{t(group.label, group.khmer)}</h3><p className="mt-2 break-words font-mono-ui text-xs text-[var(--ink-dim)]">{group.missing.map(hex).join(" · ")}</p></div>)}</div>}</section><p className="text-xs leading-relaxed text-[var(--ink-faint)]">{t("This analyzer reads standard Unicode cmap tables. Subscript coverage confirms the encoded characters; it does not prove that OpenType shaping renders every subscript sequence correctly.", "ឧបករណ៍នេះអានតារាង Cmap យូនីកូដស្តង់ដារ។ ការគ្របដណ្តប់ជើងអក្សរបញ្ជាក់តែតួអក្សរដែលបានអ៊ិនកូដ មិនអាចធានាថា OpenType shaping បង្ហាញលំដាប់ជើងអក្សរគ្រប់យ៉ាងបានត្រឹមត្រូវទេ។")}</p></div>}
  </ToolShell>;
}
