"use client";

import { useMemo, useState } from "react";
import { BookOpen, ChevronRight, Search, Volume2, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { STATIC_DATABASE, type KhmerWordData } from "@/lib/khmer-lexicon-db";

const KEYS = Object.keys(STATIC_DATABASE).sort();

export default function KhmerLexicon() {
  const { text: t } = useLanguage();
  const [query, setQuery] = useToolState("kl:query", "");
  const [detail, setDetail] = useState<KhmerWordData | null>(null);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [] as [string, KhmerWordData][];
    const exact = STATIC_DATABASE[q];
    const matches: [string, KhmerWordData][] = exact ? [[q, exact]] : [];
    if (q.length >= 1 && matches.length === 0) {
      const lower = q.toLowerCase();
      for (const key of KEYS) {
        const entry = STATIC_DATABASE[key];
        if (key.toLowerCase().includes(lower) || entry.definition.toLowerCase().includes(lower) || entry.pronunciation?.toLowerCase().includes(lower) || entry.synonyms.some((s) => s.includes(q)) || entry.antonyms.some((s) => s.includes(q))) {
          matches.push([key, entry]);
          if (matches.length >= 30) break;
        }
      }
    }
    return matches;
  }, [query]);

  function openDetail(entry: KhmerWordData) {
    setDetail(entry);
  }

  return (
    <ToolShell
      title="Homophone"
      khmerTitle="សទិសសូរ"
      description="Khmer homophone dictionary — explore words that sound alike, plus synonyms, antonyms, related words, and examples from Chuon Nath & Headley."
      descriptionKm="វចនានុក្រមសទិសសូរខ្មែរ — ស្វែងយល់ពីពាក្យដែលមានសូរដូចគ្នា សទិសន័យ បដិសព្ទ និងឧទាហរណ៍ ពីវចនានុក្រមជួនណាត និងហេដលី។"
    >
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-faint)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setDetail(null); }}
          placeholder={t("ស្វែងរកពាក្យខ្មែរ…", "Search Khmer word…")}
          className="w-full rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] py-3 pl-10 pr-10 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--gold-dim)]"
        />
        {query && (
          <button onClick={() => { setQuery(""); setDetail(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--ink-faint)] hover:text-[var(--ink)]"><X size={15} /></button>
        )}
      </div>

      {/* Empty state */}
      {!query.trim() && (
        <div className="rounded-2xl border border-dashed border-[var(--ground-line)] p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--gold)]/10 text-[var(--gold)]"><BookOpen size={28} /></div>
          <h3 className="mb-1 font-semibold text-[var(--ink)]">{t("សទិសសូរ", "Khmer Homophones")}</h3>
          <p className="text-sm text-[var(--ink-dim)]">{t(`វាយពាក្យខ្មែរដើម្បីរកពាក្យសទិសសូរ និយមន័យ និងឧទាហរណ៍។ ${KEYS.length}+ ពាក្យក្នុងប្រព័ន្ធ។`, `Type a Khmer word to find homophones, definitions, and examples. ${KEYS.length}+ words indexed.`)}</p>
          </div>
      )}

      {/* Search results list */}
      {results.length > 0 && !detail && (
        <div className="space-y-2">
          <div className="mb-2 text-xs font-semibold text-[var(--ink-faint)]">{t(`លទ្ធផល ${results.length}`, `${results.length} result(s)`)}</div>
          {results.map(([key, entry]) => (
            <button
              key={key}
              type="button"
              onClick={() => openDetail(entry)}
              className="flex w-full items-center gap-3 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3 text-left transition hover:border-[var(--gold-dim)] hover:bg-[var(--ground-raised-hi)]"
            >
              <span className="font-khmer text-lg font-bold text-[var(--ink)]">{entry.word}</span>
              {entry.pronunciation && <span className="font-mono-ui text-[10px] text-[var(--ink-faint)]">({entry.pronunciation})</span>}
              <span className="ml-auto flex items-center gap-1 text-[11px] text-[var(--ink-faint)]">
                {entry.homophones.length > 0 && <span className="rounded bg-[var(--gold)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--gold)]">{entry.homophones.length} homophones</span>}
                <ChevronRight size={14} />
              </span>
            </button>
          ))}
        </div>
      )}

      {query.trim() && results.length === 0 && !detail && (
        <div className="rounded-xl border border-dashed border-[var(--ground-line)] p-8 text-center">
          <p className="text-sm text-[var(--ink-dim)]">{t("រកមិនឃើញពាក្យ។ សូមសាកអក្ខរាវិរុទ្ធផ្សេង។", "No words found. Try a different spelling.")}</p>
        </div>
      )}

      {/* Word detail view */}
      {detail && (
        <div className="space-y-5">
          <button type="button" onClick={() => setDetail(null)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[var(--ink-faint)] hover:text-[var(--ink)]">
            ← {t("ត្រឡប់", "Back to results")}
          </button>

          {/* Word header */}
          <div className="rounded-2xl border border-[var(--gold)]/30 bg-[var(--ground-raised)] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--gold)]/15 text-[var(--gold)] font-khmer text-xl font-bold">{detail.word.charAt(0)}</div>
              <div>
                <h2 className="font-khmer text-3xl font-bold text-[var(--ink)]">{detail.word}</h2>
                <p className="mt-0.5 font-mono-ui text-xs text-[var(--ink-faint)]">{detail.pronunciation || ""}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--ink-dim)]">{detail.definition}</p>
          </div>

          {/* Homophones — PRIMARY FEATURE */}
          {detail.homophones.length > 0 && (
            <div className="rounded-2xl border border-[var(--gold)]/20 bg-[var(--gold)]/5 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Volume2 size={16} className="text-[var(--gold)]" />
                <h3 className="font-khmer text-sm font-bold text-[var(--gold)]">{t("សទិសសូរ", "Homophones")}</h3>
                <span className="rounded-full bg-[var(--gold)]/15 px-2 py-0.5 font-mono-ui text-[10px] font-bold text-[var(--gold)]">{detail.homophones.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {detail.homophones.map((h, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { const entry = STATIC_DATABASE[h.word]; if (entry) { setDetail(entry); setQuery(h.word); } }}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition hover:shadow-sm ${
                      h.word === detail.word ? "border-[var(--gold)]/40 bg-[var(--gold)]/10" : "border-[var(--ground-line)] bg-[var(--ground)] hover:border-[var(--gold-dim)]"
                    }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-khmer text-base font-bold ${h.word === detail.word ? "bg-[var(--gold)] text-[#0a0c0d]" : "bg-[var(--ground-raised)] text-[var(--ink)]"}`}>{h.word.charAt(0)}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-khmer text-sm font-bold text-[var(--ink)]">{h.word}</span>
                        {h.pronunciation && <span className="font-mono-ui text-[10px] text-[var(--ink-faint)]">({h.pronunciation})</span>}
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-dim)]">{h.definition}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Synonyms */}
          {detail.synonyms.length > 0 && (
            <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--success)]">{t("សទិសន័យ", "Synonyms")}</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {detail.synonyms.map((s, i) => (
                  <button key={i} type="button" onClick={() => { const e = STATIC_DATABASE[s]; if (e) { setDetail(e); setQuery(s); } }}
                    className="rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/5 px-3 py-1.5 text-xs font-semibold text-[var(--success)] hover:bg-[var(--success)]/10">{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Antonyms */}
          {detail.antonyms.length > 0 && (
            <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--danger)]">{t("បដិសព្ទ", "Antonyms")}</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {detail.antonyms.map((a, i) => (
                  <button key={i} type="button" onClick={() => { const e = STATIC_DATABASE[a]; if (e) { setDetail(e); setQuery(a); } }}
                    className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/5 px-3 py-1.5 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger)]/10">{a}</button>
                ))}
              </div>
            </div>
          )}

          {/* Related Words + Example side by side */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {detail.relatedWords.length > 0 && (
              <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--teal)]">{t("ពាក្យទាក់ទង", "Related Words")}</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {detail.relatedWords.map((r, i) => (
                    <button key={i} type="button" onClick={() => { const e = STATIC_DATABASE[r]; if (e) { setDetail(e); setQuery(r); } }}
                      className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-2.5 py-1 text-xs font-semibold text-[var(--ink-dim)] hover:border-[var(--gold)]/30 hover:text-[var(--ink)]">{r}</button>
                  ))}
                </div>
              </div>
            )}
            {detail.example && (
              <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-faint)]">{t("ឧទាហរណ៍", "Example")}</span>
                <p className="mt-2 font-khmer text-sm italic leading-relaxed text-[var(--ink-dim)]">&ldquo;{detail.example}&rdquo;</p>
              </div>
            )}
          </div>
        </div>
      )}
    </ToolShell>
  );
}
