"use client";
// Glossaries hub: one search across every glossary (Proposal 1) and a reference-sheet page per term (Proposal 2).
// Search and grouping live in lib/glossary-hub.ts; source data and citations in lib/data/glossary-hub-data.ts.
// The open term is kept in the URL (?term=<slug>) so a term page can be shared, bookmarked or printed.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Copy, ExternalLink, Flag, GraduationCap, ImageDown, Link2, Printer, Search, X } from "lucide-react";
import { Bookmark } from "jiggicons-react";
import { MotionIcon } from "@/components/ui/MotionIcon";
import { LexiconFlashcards } from "@/components/ui/LexiconFlashcards";
import type { LexiconItem } from "@/components/ui/Lexicon";
import { countDue, dayNumber, review, type ProgressMap } from "@/lib/flashcards";
import { toggleSavedTerm, useSavedTerms, type SavedTerm } from "@/lib/saved-terms";
import { ToolShell } from "@/components/ui/Shell";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { SpeakButton } from "@/components/ui/SpeakButton";
import { useLanguage } from "@/components/LanguageProvider";
import { useClipboard } from "@/components/ClipboardProvider";
import { buildGroups, neighbours, normalizeTerm, relatedGroups, searchGroups, type HubEntry, type HubGroup } from "@/lib/glossary-hub";
import { HUB_ENTRIES, HUB_SOURCE_BY_ID, HUB_SOURCE_COUNTS, HUB_SOURCES, type HubSource } from "@/lib/data/glossary-hub-data";
import { assignSlugs, readTermParam, termUrl, withTermParam } from "@/lib/glossary-share";
import { downloadBlob } from "@/lib/download";
import { recordExport } from "@/lib/export";
import { SITE_DOMAIN } from "@/lib/site";
import { useToolState } from "@/lib/storage";
import { toast } from "@/lib/toast";
import { toolHref } from "@/lib/toolRoutes";

const TOOL_ID = "glossaries";
const nf = new Intl.NumberFormat("en-US");

const GROUPS = buildGroups(HUB_ENTRIES);
const SLUGS = assignSlugs(GROUPS.map((g, i) => ({ id: g.key, term: g.key.replace(/^fr:/, "fr "), order: i })));
const BY_SLUG = new Map(GROUPS.map((g) => [SLUGS.get(g.key) ?? "", g]));

function sourceOf(entry: HubEntry): HubSource {
  return HUB_SOURCE_BY_ID.get(entry.source) as HubSource;
}

function Dot({ color }: { color: string }) {
  return <span aria-hidden className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />;
}

export default function Glossaries() {
  const { text: t } = useLanguage();
  const [query, setQuery] = useToolState<string>(`${TOOL_ID}:query`, "");
  const [filter, setFilter] = useToolState<string>(`${TOOL_ID}:source`, "");
  const [open, setOpen] = useState<HubGroup | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Every term (A–Z) until something is typed; the source chip or "Khmer differs" narrows either list.
  const savedTerms = useSavedTerms();
  const savedKeys = useMemo(() => new Set(savedTerms.map(savedGroupKey)), [savedTerms]);
  const savedCount = useMemo(() => GROUPS.filter((g) => savedKeys.has(g.key)).length, [savedKeys]);
  const [cardProgress, setCardProgress] = useToolState<ProgressMap>(`${TOOL_ID}:cards`, {});
  const [practising, setPractising] = useState(false);

  const results = useMemo(() => {
    const source = filter && filter !== DIFFER && filter !== SAVED ? filter : undefined;
    const base = query.trim() ? searchGroups(GROUPS, query, source, Infinity) : source ? GROUPS.filter((g) => g.sources.includes(source)) : GROUPS;
    if (filter === DIFFER) return base.filter((g) => g.sources.length > 1 && g.distinctKm > 1);
    if (filter === SAVED) return base.filter((g) => savedKeys.has(g.key));
    return base;
  }, [query, filter, savedKeys]);
  const cards = useMemo(() => results.map(toCard), [results]);
  const progress = useMemo<ProgressMap>(() => (cardProgress && typeof cardProgress === "object" ? cardProgress : {}), [cardProgress]);
  const dueCount = useMemo(() => countDue(cards.map((c) => c.id), progress, dayNumber()), [cards, progress]);

  // ?term=<slug> opens that term; the URL follows the open term so it can be shared or printed.
  useEffect(() => {
    const sync = () => {
      const slug = readTermParam(window.location.search);
      setOpen(slug ? (BY_SLUG.get(slug) ?? null) : null);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const show = useCallback((group: HubGroup | null) => {
    setOpen(group);
    const slug = group ? (SLUGS.get(group.key) ?? null) : null;
    window.history.pushState(window.history.state, "", withTermParam(window.location.href, slug));
    topRef.current?.scrollIntoView({ block: "start" });
  }, []);

  return (
    <ToolShell
      title="Glossaries"
      khmerTitle="វចនានុក្រមបច្ចេកទេស"
      description="Search every technical glossary on 123 Toolbox at once — water resources, public works, environment, climate change and French loanwords — and see how each ministry renders the same term in Khmer."
      descriptionKm="ស្វែងរកវចនានុក្រមបច្ចេកទេសទាំងអស់នៅលើ 123 Toolbox ក្នុងពេលតែមួយ — ធនធានទឹក សាធារណការ បរិស្ថាន ការប្រែប្រួលអាកាសធាតុ និងពាក្យកម្ចីបារាំង — ហើយមើលថាក្រសួងនីមួយៗប្រើពាក្យខ្មែរអ្វីសម្រាប់ពាក្យតែមួយ។"
    >
      <div ref={topRef} className="scroll-mt-24">
        {open ? (
          <TermSheet group={open} onOpen={show} onBack={() => show(null)} />
        ) : (
          <Hub
            query={query}
            setQuery={setQuery}
            filter={filter}
            setFilter={setFilter}
            results={results}
            onOpen={show}
            savedCount={savedCount}
            dueCount={dueCount}
            onPractise={() => setPractising(true)}
          />
        )}
      </div>

      {practising && (
        <LexiconFlashcards
          items={cards}
          progress={progress}
          onReview={(id, knewIt) => setCardProgress((prev) => ({ ...(prev ?? {}), [id]: review(prev?.[id], knewIt, dayNumber()) }))}
          onClose={() => setPractising(false)}
          speakLang="en-US"
        />
      )}

      <SourceCredits>
        <p>{t("Every term comes from one of these sources, credited on each card:", "ពាក្យនីមួយៗមកពីប្រភពមួយក្នុងចំណោមប្រភពទាំងនេះ ដែលបានបញ្ជាក់នៅលើកាតនីមួយៗ៖")}</p>
        <ul className="list-disc pl-5">
          {HUB_SOURCES.map((s) => (
            <li key={s.id}>
              {s.publisher} — {s.edition} ({nf.format(HUB_SOURCE_COUNTS[s.id] ?? 0)})
              {s.unverified && t(" — origin not confirmed", " — ប្រភពដើមមិនទាន់បញ្ជាក់")}
            </li>
          ))}
        </ul>
        <p>
          {t(
            "Full credits and reuse status are on each glossary's page and on the Acknowledgements page. Several sources are Provenance Pending. Citations are a convenience, not an official format. Not endorsed by any ministry.",
            "ការបញ្ជាក់ប្រភពពេញលេញ និងស្ថានភាពនៃការប្រើប្រាស់ឡើងវិញ មាននៅលើទំព័រវចនានុក្រមនីមួយៗ និងទំព័រអំណរគុណ។ ប្រភពខ្លះនៅ Provenance Pending។ ការដកស្រង់ជាជំនួយប៉ុណ្ណោះ មិនមែនជាទម្រង់ផ្លូវការទេ។ មិនមែនជាការគាំទ្រពីក្រសួងណាមួយទេ។",
          )}
        </p>
      </SourceCredits>
    </ToolShell>
  );
}

/* ------------------------------------------------------------------ Proposal 1: the hub */

const DIFFER = "differ";
const SAVED = "saved";

/** The hub group a saved term belongs to: terms saved here store the group key; others are matched by English. */
function savedGroupKey(entry: SavedTerm): string {
  if (entry.tool === TOOL_ID) return entry.id;
  const english = entry.term.replace(/^(.+?) — (.+)$/, "$2 ($1)");
  return normalizeTerm(english.split("/")[0]);
}

/** A hub group as a flashcard: its headword, the Khmer terms the sources use, and the first definition found. */
function toCard(g: HubGroup): LexiconItem {
  const withDef = g.entries.find((e) => e.defKm) ?? g.entries.find((e) => e.defEn);
  return { id: g.key, term: g.title, termKm: [...new Set(g.entries.map((e) => e.km))].join(" · "), defKm: withDef?.defKm, defEn: withDef?.defKm ? undefined : withDef?.defEn };
}
const PAGE = 120;

function Hub({
  query,
  setQuery,
  filter,
  setFilter,
  results,
  onOpen,
  savedCount,
  dueCount,
  onPractise,
}: {
  query: string;
  setQuery: (q: string) => void;
  filter: string;
  setFilter: (s: string) => void;
  results: HubGroup[];
  onOpen: (g: HubGroup) => void;
  savedCount: number;
  dueCount: number;
  onPractise: () => void;
}) {
  const { text: t } = useLanguage();
  const chip = (active: boolean) =>
    `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
      active ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--ground)]" : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:border-[var(--ground-line-strong)] hover:text-[var(--ink)]"
    }`;
  const pick = (id: string) => setFilter(filter === id ? "" : id);

  return (
    <div className="space-y-3">
      <label className="relative block">
        <span className="sr-only">{t("Search all glossaries", "ស្វែងរកក្នុងវចនានុក្រមទាំងអស់")}</span>
        <Search size={18} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("English, Khmer or French", "អង់គ្លេស ខ្មែរ ឬបារាំង")}
          className="h-12 w-full rounded-2xl [&::-webkit-search-cancel-button]:appearance-none border border-[var(--ground-line-strong)] bg-[var(--ground-raised)] pl-11 pr-11 text-base text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label={t("Clear search", "សម្អាតការស្វែងរក")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-[var(--ink-faint)] hover:text-[var(--ink)]">
            <X size={18} aria-hidden />
          </button>
        )}
      </label>

      <div role="group" aria-label={t("Filter", "តម្រង")} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        <button type="button" aria-pressed={!filter} onClick={() => setFilter("")} className={chip(!filter)}>
          {t("All", "ទាំងអស់")}
        </button>
        {HUB_SOURCES.map((s) => (
          <button key={s.id} type="button" aria-pressed={filter === s.id} onClick={() => pick(s.id)} title={t(s.name, s.nameKm)} className={chip(filter === s.id)}>
            <Dot color={s.color} />
            {s.publisher === "Supplied list" ? t(s.name, s.nameKm) : s.publisher}
          </button>
        ))}
        <button type="button" aria-pressed={filter === DIFFER} onClick={() => pick(DIFFER)} className={chip(filter === DIFFER)}>
          {t("Khmer differs", "ពាក្យខ្មែរខុសគ្នា")}
        </button>
        {savedCount > 0 && (
          <button type="button" aria-pressed={filter === SAVED} onClick={() => pick(SAVED)} className={chip(filter === SAVED)}>
            {t(`Saved (${savedCount})`, `បានរក្សាទុក (${savedCount})`)}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 px-1">
        <p aria-live="polite" className="text-xs text-[var(--ink-faint)]">
          {t(`${nf.format(results.length)} terms`, `ពាក្យចំនួន ${nf.format(results.length)}`)}
        </p>
        {results.length > 0 && (
          <button type="button" onClick={onPractise} className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-dim)] hover:text-[var(--ink)]">
            <GraduationCap size={14} aria-hidden />
            {t("Practise", "ហាត់")}
            {dueCount > 0 && <span className="rounded-full bg-[var(--gold)] px-1.5 text-[0.65rem] leading-4 text-[var(--ground)]">{t(`${dueCount} due`, `${dueCount} ត្រូវរំលឹក`)}</span>}
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <p className="py-10 text-center text-[var(--ink-dim)]">{t("No terms match that search.", "គ្មានពាក្យត្រូវនឹងការស្វែងរកនេះទេ។")}</p>
      ) : (
        <TermList key={`${query}|${filter}`} results={results} onOpen={onOpen} />
      )}
    </div>
  );
}

/** Scrollable list of terms; renders PAGE rows at a time and adds more as the end scrolls into view. */
function TermList({ results, onOpen }: { results: HubGroup[]; onOpen: (g: HubGroup) => void }) {
  const { text: t } = useLanguage();
  const [count, setCount] = useState(PAGE);
  const box = useRef<HTMLUListElement>(null);
  const end = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const el = end.current;
    if (!el) return;
    const io = new IntersectionObserver((items) => {
      if (items.some((i) => i.isIntersecting)) setCount((c) => c + PAGE);
    }, { root: box.current, rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [count]);

  return (
    <ul
      ref={box}
      aria-label={t("Terms", "ពាក្យ")}
      className="max-h-[calc(100dvh-15rem)] divide-y divide-[var(--ground-line)] overflow-y-auto overscroll-contain rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)]"
    >
      {results.slice(0, count).map((g) => (
        <li key={g.key}>
          <button type="button" onClick={() => onOpen(g)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--ground)]">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-[var(--ink)]">{g.title}</span>
              <span lang="km" className="font-khmer block truncate text-sm text-[var(--ink-dim)]">{[...new Set(g.entries.map((e) => e.km))].join(" · ")}</span>
            </span>
            {g.distinctKm > 1 && <span className="sr-only">{t("Khmer differs between sources", "ពាក្យខ្មែរខុសគ្នារវាងប្រភព")}</span>}
            <span className="flex shrink-0 gap-1">{g.sources.map((s) => <Dot key={s} color={HUB_SOURCE_BY_ID.get(s)?.color ?? "#999"} />)}</span>
          </button>
        </li>
      ))}
      {count < results.length && <li ref={end} aria-hidden className="h-8" />}
    </ul>
  );
}

/* ------------------------------------------------------------------ Proposal 2: the term reference sheet */

function TermSheet({ group, onOpen, onBack }: { group: HubGroup; onOpen: (g: HubGroup | null) => void; onBack: () => void }) {
  const { text: t } = useLanguage();
  const { copyText } = useClipboard();
  const [citeFor, setCiteFor] = useState(0);
  const [saving, setSaving] = useState(false);
  const near = neighbours(GROUPS, group, 4);
  const related = relatedGroups(GROUPS, group, 8);
  const entry = group.entries[Math.min(citeFor, group.entries.length - 1)];
  const citation = sourceOf(entry).cite(entry);
  const link = () => termUrl(window.location.origin, toolHref(TOOL_ID), SLUGS.get(group.key) ?? "");
  const kmList = [...new Set(group.entries.map((e) => e.km))];

  async function saveCard() {
    if (saving) return;
    setSaving(true);
    try {
      const { renderGlossaryCard } = await import("@/lib/glossary-card");
      const probe = document.createElement("span");
      probe.className = "font-khmer";
      document.body.appendChild(probe);
      const fonts = { latin: getComputedStyle(document.body).fontFamily, khmer: getComputedStyle(probe).fontFamily };
      probe.remove();
      const [first, ...rest] = group.entries;
      const url = link();
      const blob = await renderGlossaryCard({
        term: group.title,
        termKm: first.km,
        tag: `${sourceOf(first).publisher} · ${sourceOf(first).edition}`,
        blocks: (first.defKm ?? first.defEn) ? [{ text: (first.defKm ?? first.defEn) as string, lang: first.defKm ? "km" : "en" }] : [],
        compare: rest.slice(0, 3).map((e) => ({ source: `${sourceOf(e).publisher} · ${sourceOf(e).edition}`, termKm: e.km, def: e.defKm ?? e.defEn, defLang: e.defKm ? ("km" as const) : ("en" as const) })),
        compareLabel: "Other sources · ប្រភពផ្សេងទៀត",
        compareNote: group.distinctKm > 1 ? "The sources use different Khmer terms; use the one from the ministry your document is for." : undefined,
        title: "Glossaries · វចនានុក្រមបច្ចេកទេស",
        url,
        urlLabel: new URL(url).host + toolHref(TOOL_ID),
        watermark: SITE_DOMAIN,
        scanLabel: "Scan to open this term · ស្កេនដើម្បីបើកពាក្យនេះ",
        moreLabel: "continued at the link · បន្តនៅតំណ",
        fonts,
      });
      downloadBlob(blob, `${SLUGS.get(group.key)}-glossaries.png`);
      toast(t("Image saved.", "បានរក្សាទុករូបភាព។"));
      recordExport();
    } catch {
      toast(t("Could not create the image.", "មិនអាចបង្កើតរូបភាពបានទេ។"), "error");
    } finally {
      setSaving(false);
    }
  }

  // Print only the term sheet: globals.css hides the rest of the page while body has "print-term-sheet".
  const printSheet = () => {
    document.body.classList.add("print-term-sheet");
    window.addEventListener("afterprint", () => document.body.classList.remove("print-term-sheet"), { once: true });
    window.print();
  };
  const savedTerms = useSavedTerms();
  const isSaved = savedTerms.some((x) => savedGroupKey(x) === group.key);
  const action = "flex w-full items-center gap-2.5 rounded-xl border border-[var(--ground-line-strong)] bg-[var(--ground-raised)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--ground)] disabled:opacity-50";
  const label = "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-faint)]";

  return (
    <div id="term-sheet" className="overflow-hidden rounded-[24px] border border-[var(--ground-line)] bg-[var(--ground)] print:rounded-none print:border-0">
      <div className="grid lg:grid-cols-[230px_minmax(0,1fr)_280px]">
        {/* Nearby terms */}
        <nav aria-label={t("Nearby terms", "ពាក្យជិតខាង")} className="hidden border-r border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 lg:block print:hidden">
          <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-[var(--ink-dim)] hover:text-[var(--ink)]">
            <ArrowLeft size={15} aria-hidden /> {t("All results", "លទ្ធផលទាំងអស់")}
          </button>
          <ul className="space-y-0.5">
            {near.map((g) => (
              <li key={g.key}>
                <button
                  type="button"
                  aria-current={g === group ? "page" : undefined}
                  onClick={() => onOpen(g)}
                  className={`block w-full rounded-lg px-2.5 py-2 text-left text-sm ${g === group ? "bg-[var(--gold)]/12 font-semibold text-[var(--ink)]" : "text-[var(--ink-dim)] hover:bg-[var(--ground)]"}`}
                >
                  {g.title}
                  <span lang="km" className="font-khmer block truncate text-xs text-[var(--ink-faint)]">
                    {g.sources.length > 1 ? t(`${g.sources.length} sources`, `ប្រភព ${g.sources.length}`) : g.entries[0].km}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* The term */}
        <article className="min-w-0 p-6 sm:p-10">
          <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--ink-dim)] hover:text-[var(--ink)] lg:hidden print:hidden">
            <ArrowLeft size={15} aria-hidden /> {t("All results", "លទ្ធផលទាំងអស់")}
          </button>
          <p className={label}>{group.sources.map((s) => HUB_SOURCE_BY_ID.get(s)?.publisher).join(" · ")}</p>
          <div className="mt-1 flex items-start gap-1">
            <h2 className="min-w-0 flex-1 break-words font-display text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">{group.title}</h2>
            <SpeakButton text={group.title} lang={group.key.startsWith("fr:") ? "fr-FR" : "en-US"} className="mt-1 text-[var(--ink-dim)] print:hidden" size={22} />
          </div>
          {group.entries.some((e) => e.term !== group.title) && (
            <p className="mt-1 font-mono text-sm text-[var(--ink-faint)]">
              {t("as listed:", "តាមបញ្ជី៖")} {[...new Set(group.entries.map((e) => e.term))].filter((x) => x !== group.title).join(" · ")}
            </p>
          )}

          {group.distinctKm > 1 && (
            <div className="mt-6 flex gap-3 rounded-2xl bg-[var(--danger)]/10 p-4 text-sm leading-relaxed text-[var(--ink)]">
              <Flag size={18} aria-hidden className="mt-0.5 shrink-0 text-[var(--danger)]" />
              <p>
                <strong>{t(`These sources use ${group.distinctKm} different Khmer terms.`, `ប្រភពទាំងនេះប្រើពាក្យខ្មែរខុសគ្នាចំនួន ${group.distinctKm}។`)}</strong>{" "}
                {t(
                  "They are matched by English spelling, so check each definition. Use the term from the ministry your document is for.",
                  "ពួកវាត្រូវបានផ្គូផ្គងតាមអក្ខរាវិរុទ្ធអង់គ្លេស ដូច្នេះសូមពិនិត្យនិយមន័យនីមួយៗ។ សូមប្រើពាក្យរបស់ក្រសួងដែលឯកសាររបស់អ្នកពាក់ព័ន្ធ។",
                )}
              </p>
            </div>
          )}

          <ul className="mt-6 space-y-3">
            {group.entries.map((e, i) => {
              const s = sourceOf(e);
              return (
                <li key={`${e.source}:${e.id}`} className="rounded-2xl border border-[var(--ground-line)] border-l-[5px] bg-[var(--ground-raised)] p-5" style={{ borderLeftColor: s.color }}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-[var(--ink-dim)]">
                    <span>
                      <strong className="text-[var(--ink)]">{s.publisher}</strong> · {s.edition}
                      {e.no ? ` · No. ${e.no}` : ""}
                    </span>
                    {s.unverified && <span className="text-xs text-[var(--ink-faint)]">{t("origin not confirmed", "ប្រភពដើមមិនទាន់បញ្ជាក់")}</span>}
                  </div>
                  <p lang="km" className="font-khmer mt-2 text-2xl leading-snug text-[var(--ink)]">{e.km}</p>
                  {e.term !== group.title && <p className="mt-1 text-sm text-[var(--ink-faint)]">{e.term}</p>}
                  {e.defKm || e.defEn ? (
                    <div className="mt-2 space-y-1.5">
                      {e.defKm && <p lang="km" className="font-khmer text-[15px] leading-[1.9] text-[var(--ink-dim)]">{e.defKm}</p>}
                      {e.defEn && <p className="text-[15px] leading-relaxed text-[var(--ink-dim)]">{e.defEn}</p>}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm italic text-[var(--ink-faint)]">{t("No definition in this source.", "គ្មាននិយមន័យក្នុងប្រភពនេះទេ។")}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 print:hidden">
                    <button type="button" onClick={() => void copyText(e.km)} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ground-line)] px-3 py-1 text-xs text-[var(--ink-dim)] hover:text-[var(--ink)]">
                      <Copy size={12} aria-hidden /> {t("Copy Khmer", "ចម្លងខ្មែរ")}
                    </button>
                    <button type="button" onClick={() => setCiteFor(i)} aria-pressed={citeFor === i} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${citeFor === i ? "border-[var(--ink)] text-[var(--ink)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:text-[var(--ink)]"}`}>
                      {t("Cite this source", "ដកស្រង់ប្រភពនេះ")}
                    </button>
                    <a href={toolHref(s.toolId)} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ground-line)] px-3 py-1 text-xs text-[var(--ink-dim)] hover:text-[var(--ink)]">
                      <ExternalLink size={12} aria-hidden /> {t("Open full glossary", "បើកវចនានុក្រមពេញ")}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
          {/* Printed reference card only: the chosen citation and where the sheet came from. */}
          <footer className="hidden border-t border-[var(--ground-line)] pt-3 text-xs leading-relaxed text-[var(--ink-dim)] print:block">
            <p>{citation}</p>
            <p className="mt-1">{t(`Printed from ${SITE_DOMAIN}${toolHref(TOOL_ID)}. Not an official document.`, `បោះពុម្ពពី ${SITE_DOMAIN}${toolHref(TOOL_ID)}។ មិនមែនជាឯកសារផ្លូវការទេ។`)}</p>
          </footer>
        </article>

        {/* Actions, citation, related */}
        <aside className="space-y-6 border-t border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 lg:border-l lg:border-t-0 print:hidden">
          <div className="space-y-2">
            <button type="button" onClick={() => void copyText(kmList.join(" / "))} className="flex w-full items-center gap-2.5 rounded-xl border border-[var(--ink)] bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-[var(--ground)] transition-opacity hover:opacity-90">
              <Copy size={15} aria-hidden /> {kmList.length > 1 ? t("Copy all Khmer terms", "ចម្លងពាក្យខ្មែរទាំងអស់") : t("Copy Khmer term", "ចម្លងពាក្យខ្មែរ")}
            </button>
            <button type="button" onClick={() => void copyText(link())} className={action}>
              <Link2 size={15} aria-hidden /> {t("Copy link", "ចម្លងតំណ")}
            </button>
            <button type="button" onClick={() => void saveCard()} disabled={saving} className={action}>
              <ImageDown size={15} aria-hidden /> {saving ? t("Making image…", "កំពុងបង្កើតរូបភាព…") : t("Save card with QR", "រក្សាទុកកាតជាមួយ QR")}
            </button>
            <button
              type="button"
              aria-pressed={isSaved}
              onClick={() => toggleSavedTerm({ tool: TOOL_ID, id: group.key, term: group.title, km: group.entries[0]?.km ?? "" })}
              className={action}
            >
              <MotionIcon icon={Bookmark} size={15} filled={isSaved} /> {isSaved ? t("Saved", "បានរក្សាទុក") : t("Save term", "រក្សាទុកពាក្យ")}
            </button>
            <button type="button" onClick={printSheet} className={action}>
              <Printer size={15} aria-hidden /> {t("Print reference card", "បោះពុម្ពកាតឯកសារយោង")}
            </button>
          </div>

          <div>
            <h3 className={label}>{t("Cite", "ដកស្រង់")}</h3>
            {group.entries.length > 1 && <p className="mt-1 text-xs text-[var(--ink-faint)]">{t(`Source: ${sourceOf(entry).publisher}`, `ប្រភព៖ ${sourceOf(entry).publisher}`)}</p>}
            <p className="mt-2 rounded-xl bg-[var(--ground)] p-3 font-mono text-xs leading-relaxed text-[var(--ink-dim)]">{citation}</p>
            <button type="button" onClick={() => void copyText(citation)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--gold-text)] hover:underline">
              <Copy size={12} aria-hidden /> {t("Copy citation", "ចម្លងការដកស្រង់")}
            </button>
          </div>

          {related.length > 0 && (
            <div>
              <h3 className={label}>{t("Related", "ពាក់ព័ន្ធ")}</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {related.map((g) => (
                  <button key={g.key} type="button" onClick={() => onOpen(g)} className="rounded-lg border border-[var(--ground-line)] px-2.5 py-1.5 text-left text-sm text-[var(--ink)] hover:border-[var(--ground-line-strong)]">
                    {g.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
