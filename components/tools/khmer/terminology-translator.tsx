"use client";

import { ArrowDownUp, CheckCircle2, Copy, Info, Search, XCircle } from "lucide-react";
import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { MPTC_TERMS, type MptcTerm } from "@/lib/data/mptc-lexicon";
import { useToolState } from "@/lib/storage";

type Direction = "en-km" | "km-en";

function normalized(value: string) {
  return value.trim().toLocaleLowerCase();
}

function abbreviation(term: MptcTerm) {
  const match = term.en.match(/\(([A-Z][A-Z0-9-]+)\)/);
  return match?.[1] ?? "";
}

function canonicalTerms(input: string, direction: Direction) {
  const query = normalized(input);
  if (!query) return [];
  const matches = MPTC_TERMS.filter((term) => direction === "en-km"
    ? term.en.toLocaleLowerCase().includes(query)
    : term.km.includes(input.trim()));
  const unique = new Map<string, MptcTerm>();
  matches.forEach((term) => {
    const key = term.en.toLocaleLowerCase().replace(/\s+/g, " ");
    const previous = unique.get(key);
    if (!previous || term.def.length > previous.def.length) unique.set(key, term);
  });
  return [...unique.values()].sort((a, b) => b.def.length - a.def.length);
}

function relatedTerms(term: MptcTerm) {
  const words = term.en.toLocaleLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 3);
  return MPTC_TERMS.filter((candidate) => candidate !== term && words.some((word) => candidate.en.toLocaleLowerCase().includes(word)))
    .sort((a, b) => b.def.length - a.def.length)
    .slice(0, 5);
}

export default function TerminologyTranslator() {
  const { text: t } = useLanguage();
  const [direction, setDirection] = useToolState<Direction>("terminology-translator:direction", "en-km");
  const [input, setInput] = useToolState("terminology-translator:input", "artificial intelligence");
  const results = useMemo(() => canonicalTerms(input, direction), [input, direction]);
  const term = results[0] ?? null;
  const related = term ? relatedTerms(term) : [];

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
  }

  return (
    <ToolShell
      title="Khmer ↔ Digital Terminology Translator"
      khmerTitle="កម្មវិធីបកប្រែវាក្យស័ព្ទឌីជីថល ខ្មែរ ↔ អង់គ្លេស"
      description="Look up official Cambodian digital terminology from the MPTC lexicon. This is a terminology reference, not a general-purpose translation engine."
      descriptionKm="ស្វែងរកវាក្យស័ព្ទឌីជីថលកម្ពុជាផ្លូវការពីសន្ទានុក្រម MPTC។ ឧបករណ៍នេះជាឯកសារយោងវាក្យស័ព្ទ មិនមែនជាម៉ាស៊ីនបកប្រែទូទៅទេ។"
    >
      <div className="space-y-5">
        <section className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]"><Search size={16} className="text-[var(--gold)]" />{t("Terminology lookup", "ស្វែងរកវាក្យស័ព្ទ")}</div>
            <button type="button" onClick={() => setDirection((current) => current === "en-km" ? "km-en" : "en-km")} className="inline-flex items-center gap-2 rounded-lg border border-[var(--ground-line)] px-3 py-2 text-xs font-semibold text-[var(--ink-dim)] hover:border-[var(--gold-dim)] hover:text-[var(--gold)]"><ArrowDownUp size={14} />{direction === "en-km" ? "English → Khmer" : "ខ្មែរ → English"}</button>
          </div>
          <Field label={direction === "en-km" ? "English technical phrase" : "Khmer terminology"} labelKm={direction === "en-km" ? "ពាក្យបច្ចេកទេសអង់គ្លេស" : "វាក្យស័ព្ទខ្មែរ"}>
            <TextInput value={input} onChange={(event) => setInput(event.target.value)} className={direction === "km-en" ? "font-khmer text-lg" : ""} placeholder={direction === "en-km" ? "e.g. artificial intelligence, cloud computing" : "ឧ. បញ្ញាសិប្បនិម្មិត"} />
          </Field>
        </section>

        {term ? <section className="space-y-4 rounded-2xl border border-[var(--success)]/30 bg-[var(--success)]/5 p-5">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-wider text-[var(--success)]">{t("MPTC terminology", "វាក្យស័ព្ទ MPTC")}</p><h2 className="mt-1 font-khmer text-2xl font-bold text-[var(--ink)]">{term.km}</h2><p className="mt-1 text-base font-semibold text-[var(--ink)]">{term.en}</p></div>
            <button type="button" onClick={() => copy(`${term.en}\n${term.km}\n${term.def}`)} className="rounded-lg border border-[var(--ground-line)] p-2 text-[var(--ink-faint)] hover:text-[var(--ink)]" title={t("Copy terminology", "ចម្លងវាក្យស័ព្ទ")}><Copy size={15} /></button>
          </div>
          <div className="flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success)]/10 px-3 py-1 text-xs font-bold text-[var(--success)]"><CheckCircle2 size={13} /> {t("Official source entry", "ធាតុពីប្រភពផ្លូវការ")}</span>{abbreviation(term) && <span className="rounded-full border border-[var(--ground-line)] px-3 py-1 font-mono-ui text-xs text-[var(--ink-dim)]">{t("Abbreviation", "អក្សរកាត់")}: {abbreviation(term)}</span>}</div>
          {term.def && <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><p className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--ink-faint)]">{t("Definition", "និយមន័យ")}</p><p className="font-khmer text-sm leading-relaxed text-[var(--ink-dim)]">{term.def}</p></div>}
          {related.length > 0 && <div><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--ink-faint)]">{t("Related terminology", "វាក្យស័ព្ទពាក់ព័ន្ធ")}</h3><div className="grid gap-2 sm:grid-cols-2">{related.map((item) => <button key={`${item.en}-${item.km}`} type="button" onClick={() => setInput(direction === "en-km" ? item.en : item.km)} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-left hover:border-[var(--gold-dim)]"><p className="text-xs font-semibold text-[var(--ink)]">{item.en}</p><p className="mt-1 font-khmer text-sm text-[var(--gold)]">{item.km}</p></button>)}</div></div>}
        </section> : <section className="rounded-2xl border border-[var(--gold-dim)]/40 bg-[var(--gold)]/5 p-5"><div className="flex items-start gap-3"><XCircle size={20} className="mt-0.5 shrink-0 text-[var(--gold)]" /><div><h2 className="font-semibold text-[var(--ink)]">{t("No official terminology match", "មិនរកឃើញវាក្យស័ព្ទផ្លូវការ")}</h2><p className="mt-1 text-sm leading-relaxed text-[var(--ink-dim)]">{t("This phrase is not present in the local MPTC lexicon. Do not label a proposed translation as official without source verification.", "ពាក្យនេះមិនមានក្នុងសន្ទានុក្រម MPTC មូលដ្ឋានទេ។ សូមកុំដាក់ស្លាកថាជាពាក្យផ្លូវការ ប្រសិនបើមិនទាន់បានផ្ទៀងផ្ទាត់ប្រភព។")}</p></div></div></section>}

        <p className="flex items-start gap-2 text-xs leading-relaxed text-[var(--ink-faint)]"><Info size={14} className="mt-0.5 shrink-0" />{t(`Source: MPTC Digital Terminology Lexicon (${MPTC_TERMS.length} entries).`, `ប្រភព៖ សន្ទានុក្រមវាក្យស័ព្ទឌីជីថល MPTC (មាន ${MPTC_TERMS.length} ធាតុ)។`)}</p>
      </div>
    </ToolShell>
  );
}
