"use client";

import { AlertTriangle, CheckCircle2, Info, Search, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell, TextArea } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { MPTC_TERMS, type MptcTerm } from "@/lib/data/mptc-lexicon";

const DEFAULT_TEXT = "កម្មវិធីនេះប្រើ AI និង cloud computing ដើម្បីផ្តល់សេវាឌីជីថលតាម API។";
const TERM_ALIASES = [
  { key: "ai", aliases: ["artificial intelligence", "ai", "បញ្ញាសិប្បនិម្មិត"] },
  { key: "cloud", aliases: ["cloud computing", "កិច្ចកុំព្យូទ័រពពក", "កុំព្យូធីងពពក"] },
];
const COMMON_TECH_TERMS = ["api", "sdk", "database", "software", "hardware", "machine learning", "blockchain", "internet"];

type Detection = { query: string; term: MptcTerm | null; unknown: boolean };

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/[“”‘’]/g, "'");
}

function termForAlias(input: string, aliases: string[]) {
  const normalizedInput = normalize(input);
  const matching = MPTC_TERMS.filter((term) => aliases.some((alias) => {
    const normalizedAlias = normalize(alias);
    return normalizedInput.includes(normalizedAlias) && (normalize(term.en).includes(normalizedAlias) || normalize(term.km).includes(normalizedAlias));
  }));
  return matching.sort((a, b) => b.def.length - a.def.length)[0] ?? null;
}

function detectTerms(input: string): Detection[] {
  const normalized = normalize(input);
  const found: Detection[] = [];
  for (const group of TERM_ALIASES) {
    const alias = group.aliases.find((candidate) => candidate.includes(" ") ? normalized.includes(candidate) : new RegExp(`\\b${candidate}\\b`, "i").test(input) || input.includes(candidate));
    if (alias) found.push({ query: alias, term: termForAlias(input, group.aliases), unknown: false });
  }
  for (const query of COMMON_TECH_TERMS) {
    const present = query.includes(" ") ? normalized.includes(query) : new RegExp(`\\b${query}\\b`, "i").test(input);
    if (present && !found.some((item) => item.query === query)) {
      const official = MPTC_TERMS.find((term) => normalize(term.en).includes(query));
      found.push({ query, term: official ?? null, unknown: !official });
    }
  }
  return found;
}

function canonicalKhmer(term: MptcTerm) {
  return term.km.split("/")[0].trim();
}

export default function TerminologyCoverage() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("terminology-coverage:input", DEFAULT_TEXT);
  const detections = useMemo(() => detectTerms(input), [input]);
  const unknown = detections.filter((item) => item.unknown);
  const suggestions = useMemo(() => {
    if (!unknown.length) return [];
    const query = unknown[0].query;
    return MPTC_TERMS.filter((term) => term.en.toLowerCase().split(/\s+/).some((word) => word.length > 3 && query.includes(word))).slice(0, 4);
  }, [unknown]);

  return (
    <ToolShell
      title="Khmer Terminology Coverage Checker"
      khmerTitle="ពិនិត្យការគ្របដណ្តប់ពាក្យបច្ចេកទេសខ្មែរ"
      description={`Paste Khmer or bilingual content to detect official MPTC terminology, identify missing terms, and review suggested Khmer equivalents across ${MPTC_TERMS.length} official entries.`}
      descriptionKm={`បិទភ្ជាប់អត្ថបទខ្មែរ ឬពីរភាសា ដើម្បីរកពាក្យបច្ចេកទេសផ្លូវការរបស់ MPTC សម្គាល់ពាក្យដែលខ្វះ និងពិនិត្យពាក្យខ្មែរដែលបានណែនាំ ក្នុងចំណោមពាក្យផ្លូវការ ${MPTC_TERMS.length} ពាក្យ។`}
    >
      <div className="space-y-5">
        <section className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]"><Search size={16} className="text-[var(--gold)]" />{t("Paste your content", "បិទភ្ជាប់អត្ថបទរបស់អ្នក")}</div>
          <TextArea rows={6} value={input} onChange={(event) => setInput(event.target.value)} className="font-khmer text-base leading-relaxed" placeholder={t("Paste Khmer or bilingual technical content…", "បិទភ្ជាប់អត្ថបទបច្ចេកទេសខ្មែរ ឬពីរភាសា…")} />
          <p className="mt-2 text-xs text-[var(--ink-faint)]">{t(`${detections.length} terminology items detected · ${MPTC_TERMS.length} official entries indexed`, `រកឃើញពាក្យបច្ចេកទេស ${detections.length} · មានពាក្យផ្លូវការ ${MPTC_TERMS.length} ក្នុងសន្ទស្សន៍`)}</p>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-[var(--ink)]"><Sparkles size={17} className="text-[var(--gold)]" />{t("Detected terminology", "ពាក្យបច្ចេកទេសដែលបានរកឃើញ")}</h2>
          {detections.length === 0 ? <div className="rounded-xl border border-dashed border-[var(--ground-line)] p-8 text-center text-sm text-[var(--ink-faint)]">{t("No known technology terms detected yet.", "មិនទាន់រកឃើញពាក្យបច្ចេកទេសដែលស្គាល់ទេ។")}</div> : <div className="grid gap-3 md:grid-cols-2">{detections.map((detection) => <article key={detection.query} className={`rounded-xl border p-4 ${detection.term ? "border-[var(--success)]/30 bg-[var(--success)]/5" : "border-[var(--gold-dim)]/40 bg-[var(--gold)]/5"}`}><div className="flex items-start gap-3">{detection.term ? <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-[var(--success)]" /> : <AlertTriangle size={19} className="mt-0.5 shrink-0 text-[var(--gold)]" />}<div className="min-w-0"><h3 className="font-mono-ui text-sm font-bold text-[var(--ink)]">{detection.query}</h3>{detection.term ? <><p className="mt-1 font-khmer text-lg font-bold text-[var(--success)]">→ {canonicalKhmer(detection.term)}</p><p className="mt-1 text-xs font-semibold text-[var(--success)]">{t("Official MPTC terminology", "ពាក្យបច្ចេកទេសផ្លូវការ MPTC")}</p><p className="mt-2 font-khmer text-xs leading-relaxed text-[var(--ink-dim)]">{detection.term.def || t("Official entry found; no definition was supplied.", "រកឃើញពាក្យផ្លូវការ ប៉ុន្តែមិនមាននិយមន័យផ្តល់ជូនទេ។")}</p></> : <><p className="mt-1 font-khmer text-lg font-bold text-[var(--ink-dim)]">→ ?</p><p className="mt-1 text-xs font-semibold text-[var(--gold)]">{t("Terminology not found in the official index", "មិនរកឃើញពាក្យក្នុងសន្ទស្សន៍ផ្លូវការ")}</p></>}</div></div></article>)}</div>}
        </section>

        {unknown.length > 0 && <section className="rounded-xl border border-[var(--slate-accent)]/30 bg-[var(--slate-accent)]/10 p-4"><h2 className="flex items-center gap-2 font-display text-base font-semibold text-[var(--ink)]"><Info size={16} className="text-[var(--slate-accent)]" />{t("Suggested official Khmer terminology", "ពាក្យបច្ចេកទេសខ្មែរផ្លូវការដែលបានណែនាំ")}</h2><p className="mt-1 text-xs text-[var(--ink-dim)]">{t("These are related indexed entries for review, not automatic approvals. Verify the final term with your style guide or MPTC source.", "ពាក្យទាំងនេះជាពាក្យពាក់ព័ន្ធក្នុងសន្ទស្សន៍សម្រាប់ពិនិត្យ មិនមែនជាការអនុម័តដោយស្វ័យប្រវត្តិទេ។ សូមផ្ទៀងផ្ទាត់ពាក្យចុងក្រោយជាមួយសៀវភៅស្ទីល ឬប្រភព MPTC។")}</p>{suggestions.length > 0 ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{suggestions.map((term) => <div key={`${term.en}-${term.km}`} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3"><p className="font-khmer font-bold text-[var(--ink)]">{canonicalKhmer(term)}</p><p className="mt-1 text-xs text-[var(--gold)]">{term.en}</p></div>)}</div> : <p className="mt-3 text-sm text-[var(--ink-dim)]">{t("No close official match was found. Consider adding this term to your project glossary for review.", "មិនរកឃើញពាក្យផ្លូវការដែលជិតស្និទ្ធទេ។ សូមពិចារណាបន្ថែមពាក្យនេះទៅក្នុងបញ្ជីពាក្យរបស់គម្រោងសម្រាប់ពិនិត្យ។")}</p>}</section>}
      </div>
    </ToolShell>
  );
}
