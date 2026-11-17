"use client";

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { ChevronLeft, X } from "lucide-react";
import { CopyButton, type CopyField } from "@/components/CopyButton";
import { useClipboard } from "@/components/ClipboardProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { useToolState } from "@/lib/storage";

/**
 * Dictionary-style term browser shared by the glossary tools (construction/water glossary, Khmer dish
 * glossary, digital terminology): a search screen (underline search, category tabs, recent terms, a
 * deterministic "term of the day", the term list) and an entry screen (large term, numbered definitions).
 * Styling lives in the `.lexicon` / `.font-lexicon` / `.lx-*` rules in app/globals.css.
 */

export interface LexiconTab {
  /** Matched against LexiconItem.tag. */
  id: string;
  label: string;
  labelKm: string;
}

export interface LexiconExtra {
  label: string;
  labelKm: string;
  value: string;
}

export interface LexiconItem {
  /** Stable identifier (duplicates are made unique internally, in order). */
  id: string;
  term: string;
  termKm: string;
  /** A LexiconTab id; the category the entry belongs to. */
  tag?: string;
  /** Definition text. Several senses may be separated by newlines (leading "1." / "១." numbering is dropped). */
  defEn?: string;
  defKm?: string;
  /** Extra labelled values shown on the entry screen (e.g. the French equivalent). */
  extras?: LexiconExtra[];
  /** Extra strings the search box also matches (the term and Khmer term are always matched). */
  search?: string[];
}

export interface LexiconProps {
  items: LexiconItem[];
  /** Prefix for persisted tool state: `${storagePrefix}:query`, `:cat` and `:recent`. */
  storagePrefix: string;
  /** Overrides the persisted search-query key (keeps older saved state working). */
  queryKey?: string;
  /** Italic masthead shown above the search box. */
  name: string;
  nameKm: string;
  searchPlaceholder: string;
  searchPlaceholderKm: string;
  tabs?: LexiconTab[];
  /** Plural noun for the result count, e.g. "terms" ("term" when exactly one matches). Khmer form goes before the number. */
  noun?: string;
  nounOne?: string;
  nounKm?: string;
  featuredLabel?: string;
  featuredLabelKm?: string;
  emptyText?: string;
  emptyTextKm?: string;
}

const ALL = "All";
const MAX_RECENT = 8;
const SHOWN_RECENT = 5;
/** "1. ", "2) ", "១. " at the start of a definition line (needs whitespace after, so "0.075 mm" is untouched). */
const LEADING_NUMBER = /^\s*(?:\d+|[០-៩]+)[.)]\s+/;
const TRUNCATED = /(?:\.\.\.|…)$/;

function senses(def?: string): string[] {
  return (def ?? "")
    .split("\n")
    .map((line) => line.replace(LEADING_NUMBER, "").trim())
    .filter(Boolean);
}

function uniqueIds(items: LexiconItem[]): LexiconItem[] {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const n = seen.get(item.id) ?? 0;
    seen.set(item.id, n + 1);
    return n === 0 ? item : { ...item, id: `${item.id}#${n}` };
  });
}

/** Whole days since the epoch in the viewer's local time zone; null on the server so SSR and hydration agree. */
const subscribeNever = () => () => {};
function localDay(): number {
  const now = new Date();
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000);
}

function copyBlock(item: LexiconItem): string {
  return [item.term, item.termKm, ...(item.extras ?? []).map((x) => x.value), item.defEn, item.defKm, item.tag].filter(Boolean).join("\n");
}

const LexiconRow = memo(function LexiconRow({ item, domId, onOpen }: { item: LexiconItem; domId: string; onOpen: (id: string) => void }) {
  return (
    <li className="lx-row border-b border-[var(--lx-line)] last:border-b-0">
      <button
        id={domId}
        type="button"
        onClick={() => onOpen(item.id)}
        className="flex w-full items-baseline justify-between gap-4 px-5 py-3 text-left transition-colors hover:bg-[var(--lx-hover)]"
      >
        <span className="min-w-0 flex-1 break-words text-[1.15rem] leading-snug text-[var(--lx-ink)]">{item.term}</span>
        <span lang="km" className="min-w-0 max-w-[45%] shrink-0 break-words text-right font-lexicon-km text-[0.9rem] leading-snug text-[var(--lx-ink-dim)]">
          {item.termKm}
        </span>
      </button>
    </li>
  );
});

function Sense({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3 py-2">
      <span aria-hidden className="w-4 shrink-0 pt-[0.35em] text-right text-sm tabular-nums text-[var(--lx-ink-faint)]">
        {n}
      </span>
      <div className="min-w-0 flex-1 space-y-1">{children}</div>
    </li>
  );
}

function EntryText({ children }: { children: ReactNode }) {
  return <p className="break-words text-[1.05rem] leading-relaxed text-[var(--lx-ink)]">{children}</p>;
}

function EntryTextKm({ children }: { children: ReactNode }) {
  return (
    <p lang="km" className="break-words font-lexicon-km text-[0.95rem] leading-[1.9] text-[var(--lx-ink-dim)]">
      {children}
    </p>
  );
}

function LexiconEntry({ item, tabLabel, onBack, headingRef }: { item: LexiconItem; tabLabel?: string; onBack: () => void; headingRef: RefObject<HTMLHeadingElement | null> }) {
  const { text: t } = useLanguage();
  const en = senses(item.defEn);
  const km = senses(item.defKm);
  const paired = en.length > 0 && en.length === km.length;

  const fields: CopyField[] = [
    { id: "en", label: t("English", "អង់គ្លេស"), getValue: item.term },
    { id: "km", label: t("Khmer", "ខ្មែរ"), getValue: item.termKm },
    ...(item.extras ?? []).map((x, i) => ({ id: `extra${i}`, label: t(x.label, x.labelKm), getValue: x.value })),
    ...(item.tag ? [{ id: "category", label: t("Category", "ចំណាត់ថ្នាក់"), getValue: item.tag }] : []),
    ...(item.defEn ? [{ id: "note", label: t("Description", "ការពិពណ៌នា"), getValue: item.defEn }] : []),
    ...(item.defKm ? [{ id: "noteKm", label: t("Description (Khmer)", "ការពិពណ៌នា (ខ្មែរ)"), getValue: item.defKm }] : []),
  ];

  return (
    <article className="px-5 pb-8 pt-4">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="lx-caps -ml-1 inline-flex items-center gap-1 py-1.5 pr-2 text-[var(--lx-ink-dim)] transition-colors hover:text-[var(--lx-ink)]">
          <ChevronLeft size={16} aria-hidden />
          {t("Back", "ត្រឡប់ក្រោយ")}
        </button>
        <CopyButton text={copyBlock(item)} compact fields={fields} />
      </div>

      <h2 ref={headingRef} tabIndex={-1} className="mt-4 break-words text-[2.1rem] font-medium leading-[1.15] text-[var(--lx-ink)]">
        {item.term}
      </h2>
      <p lang="km" className="mt-1 break-words font-lexicon-km text-[1.5rem] leading-snug text-[var(--lx-accent)]">
        {item.termKm}
      </p>
      {tabLabel && (
        <p className="lx-caps mt-3 inline-flex items-center gap-2 text-[var(--lx-ink-faint)]">
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-[var(--lx-accent)]" />
          {tabLabel}
        </p>
      )}

      <div className="mt-5 border-t border-[var(--lx-line)] pt-3">
        {en.length === 0 && km.length === 0 ? (
          <p className="py-2 italic text-[var(--lx-ink-faint)]">{t("No definition in the source list.", "គ្មាននិយមន័យក្នុងបញ្ជីប្រភពទេ។")}</p>
        ) : paired ? (
          <ol>
            {en.map((text, i) => (
              <Sense key={i} n={i + 1}>
                <EntryText>{text}</EntryText>
                <EntryTextKm>{km[i]}</EntryTextKm>
              </Sense>
            ))}
          </ol>
        ) : (
          <>
            {en.length > 0 && (
              <ol>
                {en.map((text, i) => (
                  <Sense key={i} n={i + 1}>
                    <EntryText>{text}</EntryText>
                  </Sense>
                ))}
              </ol>
            )}
            {km.length > 0 && (
              <ol className={en.length > 0 ? "mt-2 border-t border-[var(--lx-line)] pt-1" : undefined}>
                {km.map((text, i) => (
                  <Sense key={i} n={i + 1}>
                    <EntryTextKm>{text}</EntryTextKm>
                  </Sense>
                ))}
              </ol>
            )}
          </>
        )}
      </div>

      {(item.extras ?? []).map((x) => (
        <div key={x.label} className="mt-4 border-t border-[var(--lx-line)] pt-3">
          <h3 className="lx-caps text-[var(--lx-ink-faint)]">{t(x.label, x.labelKm)}</h3>
          <p className="mt-1 break-words text-[1.05rem] leading-relaxed text-[var(--lx-ink)]">{x.value}</p>
        </div>
      ))}
    </article>
  );
}

export function Lexicon({
  items,
  storagePrefix,
  queryKey,
  name,
  nameKm,
  searchPlaceholder,
  searchPlaceholderKm,
  tabs,
  noun = "terms",
  nounOne = "term",
  nounKm = "ពាក្យចំនួន",
  featuredLabel = "Term of the day",
  featuredLabelKm = "ពាក្យប្រចាំថ្ងៃ",
  emptyText = "No terms match that search.",
  emptyTextKm = "គ្មានពាក្យត្រូវនឹងការស្វែងរកទេ។",
}: LexiconProps) {
  const { text: t } = useLanguage();
  const { copyText } = useClipboard();
  const uid = useId();
  const [query, setQuery] = useToolState<string>(queryKey ?? `${storagePrefix}:query`, "");
  const [tab, setTab] = useToolState<string>(`${storagePrefix}:cat`, ALL);
  const [recentIds, setRecentIds] = useToolState<string[]>(`${storagePrefix}:recent`, []);
  const [openId, setOpenId] = useState<string | null>(null);

  const paperRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const savedScroll = useRef(0);
  const lastOpened = useRef<string | null>(null);
  const wasOpen = useRef(false);

  const list = useMemo(() => uniqueIds(items), [items]);
  const byId = useMemo(() => new Map(list.map((item, index) => [item.id, { item, index }])), [list]);
  const haystacks = useMemo(() => list.map((item) => [item.term, item.termKm, ...(item.search ?? [])].join("\n").toLowerCase()), [list]);

  const activeTab = tab !== ALL && tabs?.some((x) => x.id === tab) ? tab : ALL;
  const q = query.trim().toLowerCase();
  const results = useMemo(
    () => list.filter((item, i) => (activeTab === ALL || item.tag === activeTab) && (!q || haystacks[i].includes(q))),
    [list, haystacks, activeTab, q],
  );

  const recentItems = useMemo(() => {
    const ids = Array.isArray(recentIds) ? recentIds : [];
    return ids.flatMap((id) => {
      const hit = byId.get(id);
      return hit ? [hit] : [];
    });
  }, [recentIds, byId]);

  const day = useSyncExternalStore(subscribeNever, localDay, () => null);
  const featuredPool = useMemo(
    () =>
      list.filter((item) => {
        const first = senses(item.defEn)[0] ?? senses(item.defKm)[0];
        return Boolean(first) && !TRUNCATED.test(first) && first.length <= 260;
      }),
    [list],
  );
  const featured = day !== null && featuredPool.length > 0 ? featuredPool[day % featuredPool.length] : null;
  const featuredFirst = featured ? (senses(featured.defEn)[0] ?? senses(featured.defKm)[0]) : undefined;
  const featuredKmOnly = featured !== null && senses(featured.defEn).length === 0;

  const open = useCallback(
    (id: string) => {
      savedScroll.current = window.scrollY;
      lastOpened.current = id;
      setOpenId(id);
      setRecentIds((prev) => [id, ...(Array.isArray(prev) ? prev : []).filter((x) => x !== id)].slice(0, MAX_RECENT));
    },
    [setRecentIds],
  );
  const close = useCallback(() => setOpenId(null), []);

  const entry = openId !== null ? (byId.get(openId)?.item ?? null) : null;

  // Entry screen: bring the paper into view, move focus to the term, and let Escape go back.
  useEffect(() => {
    if (entry === null) return;
    wasOpen.current = true;
    const top = paperRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) window.scrollTo({ top: window.scrollY + top - 12 });
    headingRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [entry, close]);

  // Back to the list: restore the scroll position and focus the row that was opened.
  useEffect(() => {
    if (entry !== null || !wasOpen.current) return;
    wasOpen.current = false;
    window.scrollTo({ top: savedScroll.current });
    const index = lastOpened.current ? byId.get(lastOpened.current)?.index : undefined;
    if (index !== undefined) document.getElementById(`${uid}-r${index}`)?.focus({ preventScroll: true });
  }, [entry, byId, uid]);

  const tabLabel = (id?: string) => {
    const hit = id ? tabs?.find((x) => x.id === id) : undefined;
    return hit ? t(hit.label, hit.labelKm) : undefined;
  };

  return (
    <div
      ref={paperRef}
      className="lexicon font-lexicon mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--lx-line)] shadow-[0_1px_2px_rgb(0_0_0/0.04),0_16px_36px_-18px_rgb(70_50_20/0.28)]"
    >
      {entry && <LexiconEntry item={entry} tabLabel={tabLabel(entry.tag)} onBack={close} headingRef={headingRef} />}

      <div className={entry ? "hidden" : undefined}>
        <div className="px-5 pt-5">
          <p className="text-[0.95rem] italic text-[var(--lx-ink-faint)]">{t(name, nameKm)}</p>
          <div className="relative mt-3 border-b border-[var(--lx-line)] focus-within:border-[var(--lx-accent)]">
            <label htmlFor={`${uid}-q`} className="sr-only">
              {t("Search", "ស្វែងរក")}
            </label>
            <input
              id={`${uid}-q`}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(searchPlaceholder, searchPlaceholderKm)}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              className="lx-input w-full bg-transparent py-2 pr-9 text-[var(--lx-ink)] placeholder:text-[var(--lx-ink-faint)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t("Clear search", "សម្អាតការស្វែងរក")}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-[var(--lx-ink-faint)] transition-colors hover:text-[var(--lx-ink)]"
              >
                <X size={18} aria-hidden />
              </button>
            )}
          </div>

          {tabs && tabs.length > 0 && (
            <div role="group" aria-label={t("Category", "ប្រភេទ")} className="-mx-5 mt-3 flex gap-5 overflow-x-auto border-b border-[var(--lx-line)] px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[{ id: ALL, label: "All", labelKm: "ទាំងអស់" }, ...tabs].map((x) => {
                const active = activeTab === x.id;
                return (
                  <button
                    key={x.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTab(x.id)}
                    className={`lx-caps -mb-px shrink-0 whitespace-nowrap border-b-2 py-2 transition-colors ${
                      active ? "border-[var(--lx-accent)] text-[var(--lx-ink)]" : "border-transparent text-[var(--lx-ink-faint)] hover:text-[var(--lx-ink)]"
                    }`}
                  >
                    {t(x.label, x.labelKm)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!q && recentItems.length > 0 && (
          <section aria-labelledby={`${uid}-recent`} className="mt-6">
            <h3 id={`${uid}-recent`} className="lx-caps px-5 text-[var(--lx-ink-faint)]">
              {t("Recent", "ទើបមើលថ្មីៗ")}
            </h3>
            <ul className="mt-1">
              {recentItems.slice(0, SHOWN_RECENT).map(({ item, index }) => (
                <LexiconRow key={item.id} item={item} domId={`${uid}-rr${index}`} onOpen={open} />
              ))}
            </ul>
          </section>
        )}

        {!q && featured && (
          <section aria-labelledby={`${uid}-featured`} className="mt-6 px-5">
            <h3 id={`${uid}-featured`} className="lx-caps text-[var(--lx-ink-faint)]">
              {t(featuredLabel, featuredLabelKm)}
            </h3>
            <button type="button" onClick={() => open(featured.id)} className="mt-2 block w-full text-left">
              <span className="block break-words text-[1.75rem] font-medium leading-tight text-[var(--lx-ink)]">{featured.term}</span>
              <span lang="km" className="mt-0.5 block break-words font-lexicon-km text-lg leading-snug text-[var(--lx-accent)]">
                {featured.termKm}
              </span>
              <span className="mt-2 flex gap-3 text-[0.95rem] leading-relaxed text-[var(--lx-ink-dim)]">
                <span aria-hidden className="w-4 shrink-0 text-right tabular-nums text-[var(--lx-ink-faint)]">
                  1
                </span>
                <span lang={featuredKmOnly ? "km" : undefined} className={`line-clamp-3 min-w-0 break-words ${featuredKmOnly ? "font-lexicon-km leading-[1.9]" : ""}`}>
                  {featuredFirst}
                </span>
              </span>
            </button>
          </section>
        )}

        <div className="mt-6 flex items-center justify-between gap-3 px-5">
          <p aria-live="polite" className="lx-caps text-[var(--lx-ink-faint)]">
            {t(`${results.length} ${results.length === 1 ? nounOne : noun}`, `${nounKm} ${results.length}`)}
          </p>
          {results.length > 1 && (
            <button
              type="button"
              onClick={() => void copyText(results.map(copyBlock).join("\n\n---\n\n"))}
              className="lx-caps text-[var(--lx-ink-faint)] underline-offset-4 transition-colors hover:text-[var(--lx-accent)] hover:underline"
            >
              {t("Copy all", "ចម្លងទាំងអស់")}
            </button>
          )}
        </div>

        {results.length === 0 ? (
          <p className="px-5 py-10 text-center italic text-[var(--lx-ink-faint)]">{t(emptyText, emptyTextKm)}</p>
        ) : (
          <ul className="mt-1 pb-3">
            {results.map((item) => (
              <LexiconRow key={item.id} item={item} domId={`${uid}-r${byId.get(item.id)?.index}`} onOpen={open} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
