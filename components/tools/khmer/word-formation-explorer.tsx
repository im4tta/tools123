"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  BookA,
  BookOpen,
  BookText,
  CheckCircle2,
  Focus,
  HelpCircle,
  Info,
  Layers,
  Link2,
  Minus,
  Plus,
  Search,
  Sparkles,
  Waypoints,
  X,
} from "lucide-react";
import * as d3 from "d3";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import {
  analyzeWord,
  SAMPLE_WORDS,
  VERIFIED_LEXICON,
  type WordFormationEntry,
} from "@/lib/khmer-word-formation-db";

const KHMER_REGEX = /[\u1780-\u17FF]/;

/** Words elsewhere in the lexicon that reference the current word. */
function backlinksFor(word: string): string[] {
  return SAMPLE_WORDS.filter((key) => key !== word && VERIFIED_LEXICON[key].related.includes(word));
}

/** Every lexicon word, collated in Khmer order for a stable index. */
const ALL_WORDS = [...SAMPLE_WORDS].sort((a, b) => a.localeCompare(b, "km"));

export default function WordFormationExplorer() {
  const { text: t } = useLanguage();
  const [query, setQuery] = useToolState("wfe:query", "");
  const [result, setResult] = useToolState<WordFormationEntry | null>("wfe:result", null);
  const [view, setView] = useToolState<"tree" | "obsidian">("wfe:view", "tree");
  const [error, setError] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [indexFilter, setIndexFilter] = useState("");

  const cleanQuery = query.trim();

  /** Always show a word: if nothing is selected yet, open a rich sample entry. */
  const fallbackEntry = useMemo(() => analyzeWord("កំណើត"), []);
  const entry = result ?? fallbackEntry;

  const indexMatches = useMemo(() => {
    const q = indexFilter.trim().toLowerCase();
    if (!q) return ALL_WORDS;
    return ALL_WORDS.filter(
      (w) => w.toLowerCase().includes(q) || (VERIFIED_LEXICON[w]?.meaningEn ?? "").toLowerCase().includes(q)
    );
  }, [indexFilter]);

  const run = useCallback(
    (word?: string) => {
      const target = word ?? cleanQuery;
      if (!target) return;
      if (!KHMER_REGEX.test(target)) {
        setError(t("Please enter a valid Khmer word.", "សូមបញ្ចូលពាក្យខ្មែរឱ្យបានត្រឹមត្រូវ។"));
        return;
      }
      setError("");
      setResult(analyzeWord(target));
      if (word) setQuery(word);
    },
    [cleanQuery, t, setQuery, setResult]
  );

  const infixBlocks = useMemo(() => {
    const forms: { term: string; demo: string }[] = [
      { term: "[-អន-] (ពួក 'អ')", demo: "កើត ➔ ក + [-អន-] + ើត ➔ កំណើត" },
      { term: "[-អ៊ន-] (ពួក 'អ៊')", demo: "ជឿ ➔ ជ + [-អ៊ន-] + ឿ ➔ ជំនឿ" },
      { term: "[-អម-] (ពួក 'អ')", demo: "ចាយ ➔ ច + [-អម-] + ើម ➔ ចំណាយ" },
      { term: "[-អ៊ម-] (ពួក 'អ៊')", demo: "ឈឺ ➔ ឈ + [-អ៊ម-] + ឺ ➔ ជំងឺ" },
      { term: "[-អំណ-] (ផ្នត់លាយ)", demo: "ដើរ ➔ ដ + [-អំណ-] + ើរ ➔ ដំណើរ" },
      { term: "[-អំ-] (និគ្គហិត)", demo: "ធំ ➔ ធ + [-អំ-] + ំ ➔ ទំហំ" },
    ];
    return forms;
  }, []);

  return (
    <ToolShell
      title="Khmer Root & Word Formation Explorer"
      khmerTitle="អ្នករុករកឫសគល់ពាក្យខ្មែរ"
      description="Explore how Khmer words are formed — roots, prefixes, infixes, sandhi, etymology, and full meanings — with an Obsidian-style note view for every word."
      descriptionKm="ស្វែងយល់ពីរបៀបកកើតពាក្យខ្មែរ — ឫសគល់ ផ្នត់ជែក សន្ធិ វិភត្តិ និងអត្ថន័យពេញលេញ — ជាមួយទិដ្ឋភាពកំណត់ត្រាបែប Obsidian សម្រាប់រាល់ពាក្យ។"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
        {/* Word index — always visible */}
        <aside className="flex h-80 flex-col overflow-hidden rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] lg:h-[40rem]">
          <div className="border-b border-[var(--ground-line)] p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-faint)]" />
              <input
                value={indexFilter}
                onChange={(e) => setIndexFilter(e.target.value)}
                placeholder={t("Filter all words…", "ត្រងបញ្ជីពាក្យ…")}
                className="w-full rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] py-2 pl-9 pr-3 font-khmer text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--gold-dim)]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
              {t("All words", "ពាក្យទាំងអស់")} · {indexMatches.length}
            </p>
            <div className="space-y-1">
              {indexMatches.map((word) => {
                const active = entry.word === word;
                return (
                  <button
                    key={word}
                    onClick={() => run(word)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left font-khmer text-sm transition ${
                      active
                        ? "bg-[var(--gold)] font-bold text-[#0a0c0d]"
                        : "text-[var(--ink-dim)] hover:bg-[var(--ground-raised-hi)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? "bg-[#0a0c0d]" : "bg-[var(--ink-faint)]"}`} />
                    {word}
                  </button>
                );
              })}
              {indexMatches.length === 0 && (
                <p className="px-2 py-4 text-xs text-[var(--ink-faint)]">{t("No words match your filter.", "គ្មានពាក្យដែលត្រូវគ្នាទេ។")}</p>
              )}
            </div>
          </div>
        </aside>

        {/* Detail pane */}
        <div className="min-w-0 space-y-4">
          {/* Search */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-faint)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && run()}
                placeholder={t("Type a Khmer word here (e.g. កំណើត, សន្តិភាព, ប្រវត្តិសាស្ត្រ)…", "បញ្ចូលពាក្យទីនេះ (ឧ. កំណើត, សន្តិភាព, ប្រវត្តិសាស្ត្រ)…")}
                className="w-full rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] py-3 pl-10 pr-4 font-khmer text-base text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--gold-dim)]"
              />
            </div>
            <button
              onClick={() => run()}
              className="shrink-0 rounded-xl bg-[var(--gold)] px-6 py-3 text-sm font-bold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]"
            >
              {t("Analyze", "វិភាគ")}
            </button>
            <button
              onClick={() => setHelpOpen(true)}
              className="shrink-0 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3 text-sm font-semibold text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--ink)]"
              title={t("Open the prefix & infix guide", "មើលក្បួនកម្លាយផ្នត់ដើម និងផ្នត់ជែក")}
            >
              <span className="hidden items-center gap-1.5 sm:flex"><BookA size={15} /> {t("Affix Guide", "ក្បួនផ្នត់")}</span>
              <span className="sm:hidden"><BookA size={15} /></span>
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
              <AlertTriangle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* View toggle */}
          <div className="flex items-center justify-center gap-2">
            <div className="inline-flex rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1">
              {([
                ["tree", t("Tree Flow", "ដ្យាក្រាមដើម"), BookText],
                ["obsidian", t("Obsidian", "ទិដ្ឋភាព Obsidian"), Waypoints],
              ] as const).map(([key, label, Icon]) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    view === key ? "bg-[var(--gold)] text-[#0a0c0d]" : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Verified / guess badge */}
          <div className="flex justify-center">
            {entry.isGuess ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--gold-dim)]/40 bg-[var(--gold)]/10 px-4 py-1.5 text-xs font-semibold text-[var(--gold)]">
                <HelpCircle size={14} />
                {t("Algorithmic estimate", "ការវិភាគតាមអាល់ហ្ូរីត (ការប៉ាន់ស្មាន)")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--success)]/30 bg-[var(--success)]/10 px-4 py-1.5 text-xs font-semibold text-[var(--success)]">
                <CheckCircle2 size={14} />
                {t("Verified linguistic data", "ទិន្នន័យភាសាវិទ្យាផ្ទៀងផ្ទាត់រួច")}
              </span>
            )}
          </div>

          {view === "tree" ? <TreeView entry={entry} onNavigate={run} /> : <ObsidianView entry={entry} onNavigate={run} />}
        </div>
      </div>

      {/* Affix guide modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ground)]/80 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--ground-line)] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gold)]/15 text-[var(--gold)]"><Layers size={18} /></div>
                <div>
                  <h2 className="font-khmer text-lg font-bold text-[var(--ink)]">កម្លាយផ្នត់ដើម និង ផ្នត់ជែក</h2>
                  <p className="text-xs text-[var(--ink-faint)]">ប្រព័ន្ធកម្លាយពាក្យខ្មែរ (Khmer Morphological Derivation)</p>
                </div>
              </div>
              <button onClick={() => setHelpOpen(false)} className="rounded-lg p-2 text-[var(--ink-faint)] transition hover:bg-[var(--ground-raised-hi)] hover:text-[var(--ink)]"><X size={20} /></button>
            </div>
            <div className="flex-1 space-y-8 overflow-y-auto p-6">
              <div className="flex items-start gap-3 rounded-xl border border-[var(--slate-accent)]/25 bg-[var(--slate-accent)]/10 p-4 text-sm text-[var(--ink-dim)]">
                <Info size={18} className="mt-0.5 shrink-0 text-[var(--slate-accent)]" />
                <p>
                  <strong className="text-[var(--ink)]">វិធីកម្លាយ (Derivation):</strong> ការបង្កើតពាក្យថ្មីពីពាក្យឫស ដោយប្រើ <strong className="text-[var(--ink)]">ផ្នត់ (Affixes)</strong>។ ផ្នត់ដើមមាន ៥ ទម្រង់ និងផ្នត់ជែកមាន ៦ ទម្រង់។
                </p>
              </div>

              <section>
                <h3 className="mb-3 flex items-center gap-2 border-b border-[var(--ground-line)] pb-2 font-khmer text-lg font-bold text-[var(--ink)]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--gold)]/15 font-mono-ui text-xs font-bold text-[var(--gold)]">១</span>
                  ផ្នត់ដើមមាន ៥ ទម្រង់ (5 Prefix Forms)
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {[
                    ["១. ទម្រង់ [ព-]", "បន្ថែមព្យញ្ជនៈទោលមួយនៅខាងមុខពាក្យឫស។", "ក + កាយ ➔ កកាយ"],
                    ["២. ទម្រង់ [ពន/ណ-]", "បន្ថែមព្យញ្ជនៈភ្ជាប់ជាមួយ ន ឬ ណ។", "ប + ណ + ដើរ ➔ បណ្ដើរ"],
                    ["៣. ទម្រង់ [ពម/ំ-]", "បន្ថែមព្យញ្ជនៈភ្ជាប់ជាមួយ ម ឬ និគ្គហិត (-ំ)។", "ប + ំ + បែក ➔ បំបែក"],
                    ["៤. ទម្រង់ [ពល/រ-]", "បន្ថែមព្យញ្ជនៈភ្ជាប់ជាមួយ ល ឬ រ។", "ក + រ + វី ➔ ក្រវី"],
                    ["៥. ទម្រង់ [ពស/អ-]", "បន្ថែមព្យញ្ជនៈ ស ឬ ការប្រែប្រួលសំឡេងស្រៈ។", "ស + ម្ងាត់ ➔ សម្ងាត់"],
                  ].map(([title, body, demo]) => (
                    <div key={title} className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-4">
                      <h4 className="mb-1 inline-block rounded bg-[var(--gold)]/10 px-2 py-0.5 text-xs font-bold text-[var(--gold)]">{title}</h4>
                      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">{body}</p>
                      <p className="mt-2 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2 font-mono-ui text-xs text-[var(--ink)]">{demo}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-3 flex items-center gap-2 border-b border-[var(--ground-line)] pb-2 font-khmer text-lg font-bold text-[var(--ink)]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--success)]/15 font-mono-ui text-xs font-bold text-[var(--success)]">២</span>
                  ផ្នត់ជែកមាន ៦ ទម្រង់ (6 Infix Forms)
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {infixBlocks.map((form) => (
                    <div key={form.term} className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-4">
                      <h4 className="mb-1 inline-block rounded bg-[var(--success)]/10 px-2 py-0.5 text-xs font-bold text-[var(--success)]">{form.term}</h4>
                      <p className="mt-2 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2 font-mono-ui text-xs text-[var(--ink)]">{form.demo}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </ToolShell>
  );
}

/* ------------------------------------------------------------------ */
/* Tree flow view                                                      */
/* ------------------------------------------------------------------ */

function TreeView({ entry, onNavigate }: { entry: WordFormationEntry; onNavigate: (word: string) => void }) {
  const { text: t } = useLanguage();
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center space-y-4">
      {/* Level 1 — word */}
      <div className="flex flex-col items-center">
        <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-faint)]">១. {t("Word", "ពាក្យ")}</span>
        <div className="rounded-2xl border-2 border-[var(--gold)] bg-[var(--ground-raised)] px-8 py-4 text-center font-khmer text-4xl font-bold text-[var(--ink)] shadow-elev">
          {entry.word}
        </div>
        {entry.type && (
          <span className="mt-3 rounded-full border border-[var(--gold)]/25 bg-[var(--gold)]/10 px-4 py-1.5 text-xs font-semibold text-[var(--gold)]">{entry.type}</span>
        )}
      </div>

      <ArrowDown className="my-1 text-[var(--gold-dim)]" size={20} />

      {/* Level 2 — components */}
      <div className="flex flex-col items-center">
        <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-faint)]">២. {t("Components", "សមាសភាគ")}</span>
        <div className="flex w-full max-w-lg flex-wrap items-center justify-center gap-2 rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          {(entry.components ?? []).map((comp, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] px-4 py-2 font-khmer text-2xl font-semibold text-[var(--ink)]">{comp}</span>
              {i < (entry.components ?? []).length - 1 && <span className="font-bold text-[var(--ink-faint)]">+</span>}
            </span>
          ))}
        </div>
        {entry.rule && (
          <p className="mt-3 flex max-w-lg items-start gap-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2.5 text-sm text-[var(--ink-dim)]">
            <Info size={15} className="mt-0.5 shrink-0 text-[var(--gold)]" />
            <span className="font-khmer leading-relaxed">{entry.rule}</span>
          </p>
        )}
      </div>

      {/* Infix special breakdown */}
      {entry.infixDetail && (
        <div className="w-full max-w-lg space-y-3 rounded-2xl border border-[var(--slate-accent)]/30 bg-[var(--slate-accent)]/10 p-5">
          <div className="flex items-center justify-between border-b border-[var(--ground-line)] pb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
              <Layers size={14} /> {entry.infixDetail.infixTerm}
            </span>
          </div>
          {entry.infixDetail.formula && (
            <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-center font-mono-ui text-sm font-semibold text-[var(--gold)]">
              {entry.infixDetail.formula}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-around gap-2 py-1">
            <div className="text-center">
              <span className="block font-khmer text-2xl font-bold text-[var(--gold)]">{entry.infixDetail.rootVerb}</span>
              <span className="text-[10px] text-[var(--ink-faint)]">កិរិយា/គុណនាមដើម</span>
            </div>
            <span className="font-bold text-[var(--ink-faint)]">+</span>
            <div className="text-center rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5">
              <span className="block font-khmer text-2xl font-bold text-[var(--success)]">{entry.infixDetail.infix}</span>
              <span className="text-[10px] text-[var(--ink-faint)]">ផ្នត់ជែក</span>
            </div>
            <ArrowRight size={18} className="text-[var(--ink-faint)]" />
            <div className="text-center">
              <span className="block font-khmer text-2xl font-bold text-[var(--ink)]">{entry.infixDetail.resultNoun}</span>
              <span className="text-[10px] text-[var(--ink-faint)]">នាមកកើតថ្មី</span>
            </div>
          </div>
          <p
            className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-2.5 text-xs leading-relaxed text-[var(--ink-dim)]"
            dangerouslySetInnerHTML={{ __html: `💡 ${entry.infixDetail.explanation.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}` }}
          />
        </div>
      )}

      <ArrowDown className="my-1 text-[var(--gold-dim)]" size={20} />

      {/* Level 3 — roots */}
      <div className="flex w-full flex-col items-center">
        <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-faint)]">៣. {t("Roots & Etymology", "ឫស និង ផ្នែកពាក្យ")}</span>
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
          {(entry.roots ?? []).map((root, i) => (
            <div key={i} className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="font-khmer text-2xl font-bold text-[var(--ink)]">{root.word}</span>
                <span className="shrink-0 rounded-md border border-[var(--gold)]/25 bg-[var(--gold)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--gold)]">{root.origin}</span>
              </div>
              <p className="text-sm leading-relaxed text-[var(--ink-dim)]">{root.meaning}</p>
            </div>
          ))}
        </div>
      </div>

      <ArrowDown className="my-1 text-[var(--gold-dim)]" size={20} />

      {/* Level 4 — full meaning */}
      <div className="flex w-full flex-col items-center">
        <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-faint)]">៤. {t("Full Meaning", "អត្ថន័យពេញលេញ")}</span>
        <div className="w-full space-y-3 rounded-2xl border border-[var(--gold)]/25 bg-[var(--gold)]/5 p-6 text-center">
          <BookOpen size={28} className="mx-auto text-[var(--gold)]" />
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--gold)]">{t("Khmer Definition", "អត្ថន័យជាភាសាខ្មែរ")}</h3>
          <p className="font-khmer text-xl font-medium leading-relaxed text-[var(--ink)]">{entry.meaningKhmer}</p>
          {entry.meaningEn && <p className="border-t border-[var(--ground-line)] pt-3 text-sm italic text-[var(--ink-dim)]">{entry.meaningEn}</p>}
        </div>
      </div>

      {/* Level 5 — related */}
      {entry.related.length > 0 && (
        <>
          <ArrowDown className="my-1 text-[var(--gold-dim)]" size={20} />
          <div className="flex w-full flex-col items-center">
            <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-faint)]">៥. {t("Related Words", "ពាក្យដែលពាក់ព័ន្ធ")}</span>
            <div className="flex flex-wrap justify-center gap-2">
              {entry.related.map((rel, i) => (
                <button
                  key={i}
                  onClick={() => onNavigate(rel)}
                  className="flex items-center gap-2 rounded-full border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 font-khmer text-sm text-[var(--ink)] transition hover:border-[var(--gold-dim)] hover:bg-[var(--ground-raised-hi)]"
                >
                  <Sparkles size={13} className="text-[var(--gold)]" />
                  {rel}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Obsidian-style force-graph view                                     */
/* ------------------------------------------------------------------ */

type GraphKind = "word" | "root" | "component" | "related" | "backlink";
interface GraphNode extends d3.SimulationNodeDatum { id: string; kind: GraphKind; }
interface GraphLink extends d3.SimulationLinkDatum<GraphNode> { kind: Exclude<GraphKind, "word">; }

const GRAPH_COLORS: Record<GraphKind, string> = {
  word: "#d4a24c",
  root: "#4a9db5",
  component: "#9b59b6",
  related: "#3f9d63",
  backlink: "#e8874a",
};

const GRAPH_LEGEND: [GraphKind, string, string][] = [
  ["word", "Selected word", "ពាក្យដែលបានជ្រើស"],
  ["root", "Roots & origins", "ឫស និង ប្រភព"],
  ["component", "Components", "សមាសភាគ"],
  ["related", "Related words", "ពាក្យពាក់ព័ន្ធ"],
  ["backlink", "Backlinks", "តំណបញ្ច្រាស"],
];

/** Build the ego-graph around the selected word: roots, components, related, and backlinks. */
function buildGraph(entry: WordFormationEntry) {
  const kinds: [Exclude<GraphKind, "word">, string[]][] = [
    ["root", (entry.roots ?? []).map((r) => r.word)],
    ["component", entry.components ?? []],
    ["related", entry.related],
    ["backlink", backlinksFor(entry.word)],
  ];
  const priority: Record<Exclude<GraphKind, "word">, number> = { root: 0, component: 1, related: 2, backlink: 3 };
  const byWord = new Map<string, Exclude<GraphKind, "word">>();
  kinds.forEach(([kind, words]) =>
    words.forEach((w) => {
      if (w === entry.word) return;
      const existing = byWord.get(w);
      if (existing === undefined || priority[kind] < priority[existing]) byWord.set(w, kind);
    })
  );
  const nodes: GraphNode[] = [{ id: entry.word, kind: "word" }, ...[...byWord.entries()].map(([id, kind]) => ({ id, kind }))];
  const links: GraphLink[] = [...byWord.entries()].map(([id, kind]) => ({ source: entry.word, target: id, kind }));
  return { nodes, links };
}

function ObsidianView({ entry, onNavigate }: { entry: WordFormationEntry; onNavigate: (word: string) => void }) {
  const { text: t } = useLanguage();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const backlinks = backlinksFor(entry.word);
  const graph = useMemo(() => buildGraph(entry), [entry]);

  useEffect(() => {
    const svgElement = svgRef.current;
    const container = containerRef.current;
    if (!svgElement || !container) return;
    const width = Math.max(container.clientWidth, 420);
    const height = Math.max(container.clientHeight, 480);
    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();
    const group = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 4]).on("zoom", (event) => group.attr("transform", event.transform));
    svg.call(zoom);
    zoomRef.current = zoom;
    const simulation = d3
      .forceSimulation<GraphNode>(graph.nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(graph.links).id((node) => node.id).distance(120).strength(0.6))
      .force("charge", d3.forceManyBody<GraphNode>().strength(-280))
      .force("x", d3.forceX(width / 2).strength((d) => ((d as GraphNode).kind === "word" ? 0.7 : 0.04)))
      .force("y", d3.forceY(height / 2).strength((d) => ((d as GraphNode).kind === "word" ? 0.7 : 0.04)))
      .force("collide", d3.forceCollide<GraphNode>().radius(26));
    const link = group.append("g").selectAll("line").data(graph.links).join("line");
    const node = group.append("g").selectAll("circle").data(graph.nodes).join("circle") as d3.Selection<SVGCircleElement, GraphNode, SVGGElement, unknown>;
    const label = group.append("g").selectAll("text").data(graph.nodes).join("text") as d3.Selection<SVGTextElement, GraphNode, SVGGElement, unknown>;
    node
      .attr("r", (d) => (d.kind === "word" ? 22 : 15))
      .attr("fill", (d) => GRAPH_COLORS[d.kind])
      .attr("fill-opacity", (d) => (d.kind === "word" ? 1 : 0.72))
      .attr("stroke", "#e2e8f0")
      .attr("stroke-opacity", 0.8)
      .attr("stroke-width", (d) => (d.kind === "word" ? 2.5 : 1.25))
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        if (d.id !== entry.word) onNavigate(d.id);
      });
    label
      .text((d) => d.id)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => (d.kind === "word" ? 40 : 31))
      .attr("fill", "#fff")
      .attr("font-family", "var(--font-kantumruy-pro), sans-serif")
      .attr("font-size", 10)
      .attr("pointer-events", "none");
    link.attr("stroke", (d) => GRAPH_COLORS[d.kind]).attr("stroke-opacity", 0.35).attr("stroke-width", 1.5);
    const drag = d3.drag<SVGCircleElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.25).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    node.call(drag);
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
        .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
        .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
        .attr("y2", (d) => (d.target as GraphNode).y ?? 0);
      node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
      label.attr("x", (d) => d.x ?? 0).attr("y", (d) => d.y ?? 0);
    });
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8).translate(-width / 2, -height / 2));
    return () => {
      simulation.stop();
    };
  }, [graph, entry.word, onNavigate]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* Note / details sidebar */}
      <aside className="h-fit space-y-4 rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
        <div>
          <h1 className="font-khmer text-3xl font-bold text-[var(--gold)]">{entry.word}</h1>
          <p className="mt-1 font-mono-ui text-[11px] text-[var(--ink-faint)]">{entry.type}</p>
          <p className="mt-3 font-khmer text-sm leading-relaxed text-[var(--ink)]">{entry.meaningKhmer}</p>
          {entry.meaningEn && <p className="mt-1 text-xs italic text-[var(--ink-dim)]">{entry.meaningEn}</p>}
        </div>

        {entry.rule && (
          <div className="flex items-start gap-2 rounded-lg border border-[var(--gold)]/25 bg-[var(--gold)]/5 px-3 py-2 text-xs text-[var(--ink-dim)]">
            <Info size={13} className="mt-0.5 shrink-0 text-[var(--gold)]" />
            <span className="font-khmer leading-relaxed">{entry.rule}</span>
          </div>
        )}

        {entry.components && entry.components.length > 0 && (
          <div>
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">{t("Components", "សមាសភាគ")}</div>
            <div className="flex flex-wrap gap-1.5">
              {entry.components.map((c, i) => (
                <span key={i} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-2 py-1 font-mono-ui text-xs text-[var(--ink)]">{c}</span>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">{t("Related", "ពាក់ព័ន្ធ")}</div>
          <div className="flex flex-wrap gap-1.5">
            {entry.related.map((rel, i) => (
              <button key={i} onClick={() => onNavigate(rel)} className="rounded-md border border-[var(--slate-accent)]/30 bg-[var(--slate-accent)]/10 px-2 py-1 font-mono-ui text-xs font-semibold text-[var(--slate-accent)] transition hover:bg-[var(--slate-accent)]/20">[[{rel}]]</button>
            ))}
            {entry.related.length === 0 && <span className="text-xs text-[var(--ink-faint)]">—</span>}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
            <Link2 size={12} className="text-[var(--gold)]" />
            {t("Backlinks", "តំណបញ្ច្រាស")} · {backlinks.length}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {backlinks.map((word) => (
              <button key={word} onClick={() => onNavigate(word)} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-2 py-1 font-mono-ui text-xs text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--ink)]">[[{word}]]</button>
            ))}
            {backlinks.length === 0 && <span className="text-xs text-[var(--ink-faint)]">{t("No other words link to this one.", "គ្មានពាក្យផ្សេងភ្ជាប់ទៅកាន់ពាក្យនេះទេ។")}</span>}
          </div>
        </div>
      </aside>

      {/* Force-graph canvas */}
      <div ref={containerRef} className="relative min-h-[520px] overflow-hidden rounded-2xl border border-[var(--ground-line)] bg-[#0f172a]">
        <div className="absolute left-4 top-4 z-10 rounded-lg border border-white/10 bg-[#151c26]/90 p-3 text-[10px] text-slate-400 backdrop-blur">
          <div className="mb-2 font-bold text-slate-200">{t("Legend", "រឿងព្រេង")}</div>
          {GRAPH_LEGEND.map(([kind, en, km]) => (
            <div key={kind} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: GRAPH_COLORS[kind] }} />
              {t(en, km)}
            </div>
          ))}
          <p className="mt-2 text-[10px] text-slate-500">{t("Click a node to open that word.", "ចុចលើថ្នាំងដើម្បីបើកពាក្យនោះ។")}</p>
        </div>
        <div className="absolute bottom-4 right-4 z-10 flex gap-1">
          <button onClick={() => svgRef.current && zoomRef.current && d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 1.3)} className="rounded-full border border-white/10 bg-[#151c26] p-2 text-slate-300 transition hover:bg-white/10"><Plus size={14} /></button>
          <button onClick={() => svgRef.current && zoomRef.current && d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 0.7)} className="rounded-full border border-white/10 bg-[#151c26] p-2 text-slate-300 transition hover:bg-white/10"><Minus size={14} /></button>
          <button onClick={() => svgRef.current && zoomRef.current && d3.select(svgRef.current).transition().call(zoomRef.current.scaleTo, 1)} className="rounded-full border border-white/10 bg-[#151c26] p-2 text-slate-300 transition hover:bg-white/10"><Focus size={14} /></button>
        </div>
        <svg ref={svgRef} className="h-full min-h-[520px] w-full" />
      </div>
    </div>
  );
}
