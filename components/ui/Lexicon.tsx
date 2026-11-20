"use client";

import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";
import { ChevronLeft, ChevronRight, ImageDown, Link2, Share2, X } from "lucide-react";
import { CopyButton, type CopyField } from "@/components/CopyButton";
import { useClipboard } from "@/components/ClipboardProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { ScrollTabs } from "@/components/ui/ScrollTabs";
import { SpeakButton } from "@/components/ui/SpeakButton";
import type { CardBlock } from "@/lib/glossary-card";
import { assignSlugs, readTermParam, splitTermAcronym, splitTermExpansion, termUrl, withTermParam } from "@/lib/glossary-share";
import { downloadBlob } from "@/lib/download";
import { recordExport } from "@/lib/export";
import { useToolState } from "@/lib/storage";
import { toast } from "@/lib/toast";
import { SITE_DOMAIN } from "@/lib/site";
import { toolHref } from "@/lib/toolRoutes";

/**
 * Dictionary-style term browser shared by the glossary tools (construction/water glossary, Khmer dish
 * glossary, digital terminology).
 *
 *  - Wide screens: two panes (term list | entry). Phones: the list, then the entry full-screen.
 *  - List: sticky search, category tabs that scroll with touch, wheel, drag, arrows and keys (ScrollTabs),
 *    recent terms, a deterministic "term of the day", A–Z sections with sticky letters and a letter rail,
 *    ranked search with match highlighting, one-line definition previews.
 *  - Keyboard: ↑ ↓ Home End PgUp PgDn browse the list (one tab stop), a letter key jumps to that letter, Enter in
 *    the search box opens the top result, Esc clears the search / closes the entry. ("/" is left to the site's
 *    command palette.)
 *  - Styling lives in the `.lexicon` / `.font-lexicon` / `.lx-*` rules in app/globals.css.
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

/** The same English term as another source gives it, for side-by-side comparison. */
export interface LexiconComparison {
  source: string;
  sourceKm: string;
  /** The other source's English spelling, when it differs from the entry's headword. */
  term?: string;
  termKm: string;
  defEn?: string;
  defKm?: string;
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
  /** The source had an English definition but it was damaged and is not shown. */
  enDefWithheld?: boolean;
  /** Extra labelled values shown on the entry screen (e.g. the French equivalent). */
  extras?: LexiconExtra[];
  /** How other sources render the same English term (shown under "Other sources"). */
  compare?: LexiconComparison[];
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
  /** Sort A–Z by the English term and group by letter (default true). */
  alphabetical?: boolean;
  /** Tool id (see lib/tools.tsx); builds the shareable link `<tool page>?term=<slug>` through toolHref(). */
  toolId?: string;
  /** Language of the headword for the "Listen" button (browser speech), or false to hide it. Default "en-US". */
  speakLang?: string | false;
  /** Tool name printed on exported images. */
  cardTitle?: string;
  cardTitleKm?: string;
  /** Source line printed on an exported image for this entry (English). */
  credit?: (item: LexiconItem) => string | undefined;
}

const ALL = "All";
const MAX_RECENT = 8;
/** Long lists paint the first screenful at once and fill in the rest in small background chunks. */
const FIRST_CHUNK = 120;
const NEXT_CHUNK = 160;
const SHOWN_RECENT = 5;
const RAIL = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"];
/** "1. ", "2) ", "១. " at the start of a definition line (needs whitespace after, so "0.075 mm" is untouched). */
const LEADING_NUMBER = /^\s*(?:\d+|[០-៩]+)[.)]\s+/;
const TRUNCATED = /(?:\.\.\.|…)$/;
const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

function senses(def?: string): string[] {
  return (def ?? "")
    .split("\n")
    .map((line) => line.replace(LEADING_NUMBER, "").trim())
    .filter(Boolean);
}

interface Prepared extends LexiconItem {
  order: number;
  /** URL slug used by shareable links (?term=...). */
  slug: string;
  letter: string;
  /** First definition sense, for the one-line preview under the term. */
  preview?: string;
  previewKm: boolean;
  lowTerm: string;
  lowKm: string;
  haystack: string;
}

function prepare(items: LexiconItem[], alphabetical: boolean): Prepared[] {
  const seen = new Map<string, number>();
  const list = items.map((raw, order): Prepared => {
    const n = seen.get(raw.id) ?? 0;
    seen.set(raw.id, n + 1);
    const sortKey = raw.term.replace(/^[^A-Za-z0-9]+/, "") || raw.term;
    const en = senses(raw.defEn)[0];
    const km = en ? undefined : senses(raw.defKm)[0];
    const lowTerm = raw.term.toLowerCase();
    const lowKm = raw.termKm.toLowerCase();
    return {
      ...raw,
      id: n === 0 ? raw.id : `${raw.id}#${n}`,
      order,
      slug: "",
      letter: /^[A-Za-z]/.test(sortKey) ? sortKey[0].toUpperCase() : "#",
      preview: en ?? km,
      previewKm: !en && Boolean(km),
      lowTerm,
      lowKm,
      haystack: [lowTerm, lowKm, ...(raw.search ?? []).map((s) => s.toLowerCase())].join("\n"),
    };
  });
  const slugs = assignSlugs(list.map((item) => ({ id: item.id, term: item.term, tag: item.tag, order: item.order })));
  for (const item of list) item.slug = slugs.get(item.id) ?? "term";
  if (!alphabetical) return list;
  const key = (item: Prepared) => item.term.replace(/^[^A-Za-z0-9]+/, "") || item.term;
  return list.sort((a, b) => collator.compare(key(a), key(b)) || a.order - b.order);
}

/** 0 = exact, 1 = starts with, 2 = a word starts with, 3 = contained in the term, 4 = only in the extra search strings. */
function rank(item: Prepared, q: string): number {
  if (item.lowTerm === q || item.lowKm === q) return 0;
  if (item.lowTerm.startsWith(q) || item.lowKm.startsWith(q)) return 1;
  if ((" " + item.lowTerm).includes(" " + q) || (" " + item.lowTerm).includes("(" + q) || (" " + item.lowKm).includes(" " + q)) return 2;
  if (item.lowTerm.includes(q) || item.lowKm.includes(q)) return 3;
  return 4;
}

/** Whole days since the epoch in the viewer's local time zone; null on the server so SSR and hydration agree. */
const subscribeNever = () => () => {};
function localDay(): number {
  const now = new Date();
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000);
}

const isWide = () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function copyBlock(item: LexiconItem): string {
  return [item.term, item.termKm, ...(item.extras ?? []).map((x) => x.value), item.defEn, item.defKm, item.tag].filter(Boolean).join("\n");
}

/** The definition as image blocks: numbered English senses with the Khmer sense under each when the two line up. */
function cardBlocks(item: LexiconItem, noDefinition: string): CardBlock[] {
  const en = senses(item.defEn);
  const km = senses(item.defKm);
  const blocks: CardBlock[] = [];
  if (en.length > 0 && en.length === km.length) {
    en.forEach((text, i) => {
      blocks.push({ text, lang: "en", n: i + 1 });
      blocks.push({ text: km[i], lang: "km", muted: true });
    });
  } else {
    en.forEach((text, i) => blocks.push({ text, lang: "en", n: i + 1 }));
    km.forEach((text, i) => blocks.push({ text, lang: "km", n: i + 1 }));
  }
  for (const extra of item.extras ?? []) blocks.push({ text: `${extra.label} / ${extra.labelKm}: ${extra.value}`, lang: "en", muted: true });
  if (blocks.length === 0) blocks.push({ text: noDefinition, lang: "en", italic: true, muted: true });
  return blocks;
}

/** The page's own font stacks (next/font family names are hashed, so they are read from the DOM). */
function readFonts(root: HTMLElement): { latin: string; khmer: string } {
  const latin = getComputedStyle(root).fontFamily;
  const probe = document.createElement("span");
  probe.className = "font-lexicon-km";
  probe.textContent = "ក";
  root.appendChild(probe);
  const khmer = getComputedStyle(probe).fontFamily;
  probe.remove();
  return { latin, khmer };
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const parts: ReactNode[] = [];
  let at = 0;
  for (let hit = lower.indexOf(q, at); hit >= 0; hit = lower.indexOf(q, at)) {
    if (hit > at) parts.push(text.slice(at, hit));
    parts.push(
      <mark key={hit} className="lx-mark">
        {text.slice(hit, hit + q.length)}
      </mark>,
    );
    at = hit + q.length;
  }
  if (at === 0) return <>{text}</>;
  parts.push(text.slice(at));
  return <>{parts}</>;
}

const LexiconRow = memo(function LexiconRow({
  item,
  domId,
  selected,
  tabStop,
  q,
  onOpen,
}: {
  item: Prepared;
  domId: string;
  selected: boolean;
  tabStop: boolean;
  q: string;
  onOpen: (id: string) => void;
}) {
  return (
    <li>
      <button
        id={domId}
        type="button"
        data-lx-row
        data-lx-id={item.id}
        data-letter={item.letter}
        aria-current={selected ? "true" : undefined}
        tabIndex={tabStop ? 0 : -1}
        onClick={() => onOpen(item.id)}
        className={`flex w-full items-baseline justify-between gap-4 px-5 py-2.5 text-left transition-colors ${
          selected ? "bg-[var(--lx-hover)] shadow-[inset_3px_0_0_var(--lx-accent)]" : "hover:bg-[var(--lx-hover)]"
        }`}
      >
        <span className="min-w-0 flex-1">
          <span className="block break-words text-[1.05rem] leading-snug text-[var(--lx-ink)]">
            <Highlight text={item.term} q={q} />
          </span>
          {item.preview && (
            <span lang={item.previewKm ? "km" : undefined} className={`mt-0.5 block truncate text-[0.8rem] text-[var(--lx-ink-faint)] ${item.previewKm ? "font-lexicon-km" : ""}`}>
              {item.preview}
            </span>
          )}
        </span>
        <span lang="km" className="min-w-0 max-w-[42%] shrink-0 break-words text-right font-lexicon-km text-[0.9rem] leading-snug text-[var(--lx-ink-dim)]">
          <Highlight text={item.termKm} q={q} />
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

function ShareButton({ icon, onClick, disabled, children }: { icon: ReactNode; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--lx-line)] px-3.5 py-1.5 text-[0.85rem] text-[var(--lx-ink-dim)] transition-colors hover:border-[var(--lx-accent)] hover:text-[var(--lx-ink)] disabled:cursor-progress disabled:opacity-60"
    >
      {icon}
      {children}
    </button>
  );
}

function FeaturedCard({ item, label, onOpen }: { item: Prepared; label: string; onOpen: (id: string) => void }) {
  return (
    <section aria-label={label}>
      <h3 className="lx-caps text-[var(--lx-ink-faint)]">{label}</h3>
      <button type="button" onClick={() => onOpen(item.id)} className="mt-2 block w-full text-left">
        <span className="block break-words text-[1.75rem] font-medium leading-tight text-[var(--lx-ink)]">{item.term}</span>
        <span lang="km" className="mt-0.5 block break-words font-lexicon-km text-lg leading-snug text-[var(--lx-accent)]">
          {item.termKm}
        </span>
        {item.preview && (
          <span className="mt-2 flex gap-3 text-[0.95rem] leading-relaxed text-[var(--lx-ink-dim)]">
            <span aria-hidden className="w-4 shrink-0 text-right tabular-nums text-[var(--lx-ink-faint)]">
              1
            </span>
            <span lang={item.previewKm ? "km" : undefined} className={`line-clamp-3 min-w-0 break-words ${item.previewKm ? "font-lexicon-km leading-[1.9]" : ""}`}>
              {item.preview}
            </span>
          </span>
        )}
      </button>
    </section>
  );
}

function LexiconEntry({
  item,
  tabLabel,
  onBack,
  onPrev,
  onNext,
  headingRef,
  speakLang,
  onCopyLink,
  onShare,
  onSaveImage,
  saving,
}: {
  item: LexiconItem;
  tabLabel?: string;
  onBack: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
  speakLang: string | false;
  onCopyLink: () => void;
  onShare?: () => void;
  onSaveImage: (withCompare: boolean) => void;
  saving: boolean;
}) {
  const { text: t } = useLanguage();
  const [withCompare, setWithCompare] = useState(true);
  const en = senses(item.defEn);
  const km = senses(item.defKm);
  const paired = en.length > 0 && en.length === km.length;
  const noDef = en.length === 0 && km.length === 0;
  const expansion = splitTermExpansion(item.term);
  const acronym = expansion ? null : splitTermAcronym(item.term);

  const fields: CopyField[] = [
    { id: "en", label: t("English", "អង់គ្លេស"), getValue: item.term },
    { id: "km", label: t("Khmer", "ខ្មែរ"), getValue: item.termKm },
    ...(item.extras ?? []).map((x, i) => ({ id: `extra${i}`, label: t(x.label, x.labelKm), getValue: x.value })),
    ...(item.tag ? [{ id: "category", label: t("Category", "ចំណាត់ថ្នាក់"), getValue: item.tag }] : []),
    ...(item.defEn ? [{ id: "note", label: t("Description", "ការពិពណ៌នា"), getValue: item.defEn }] : []),
    ...(item.defKm ? [{ id: "noteKm", label: t("Description (Khmer)", "ការពិពណ៌នា (ខ្មែរ)"), getValue: item.defKm }] : []),
  ];

  const nav = "inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--lx-ink-dim)] transition-colors hover:bg-[var(--lx-hover)] hover:text-[var(--lx-ink)] disabled:pointer-events-none disabled:opacity-30";

  return (
    <article className="mx-auto w-full max-w-2xl px-5 pb-10 pt-4 lg:px-9 lg:pt-6">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="lx-caps -ml-1 inline-flex items-center gap-1 py-1.5 pr-2 text-[var(--lx-ink-dim)] transition-colors hover:text-[var(--lx-ink)] lg:invisible">
          <ChevronLeft size={16} aria-hidden />
          {t("Back", "ត្រឡប់ក្រោយ")}
        </button>
        <div className="flex items-center gap-1">
          <button type="button" className={nav} onClick={onPrev} disabled={!onPrev} aria-label={t("Previous term", "ពាក្យមុន")}>
            <ChevronLeft size={18} aria-hidden />
          </button>
          <button type="button" className={nav} onClick={onNext} disabled={!onNext} aria-label={t("Next term", "ពាក្យបន្ទាប់")}>
            <ChevronRight size={18} aria-hidden />
          </button>
          <CopyButton text={copyBlock(item)} compact fields={fields} />
        </div>
      </div>

      <div className="mt-4 flex items-start gap-1">
      <h2 ref={headingRef} tabIndex={-1} className="min-w-0 flex-1 text-balance break-words text-[2.1rem] font-medium leading-[1.15] text-[var(--lx-ink)] lg:text-[2.6rem]">
        {expansion ? expansion.abbr : acronym ? acronym.main : item.term}
        {acronym && (
          <span className="ml-3 inline-block -translate-y-[0.3em] whitespace-nowrap rounded-full border border-[var(--lx-accent)] bg-[color-mix(in_srgb,var(--lx-accent)_8%,transparent)] px-3 py-0.5 align-middle font-sans text-[0.72rem] font-semibold tracking-[0.12em] text-[var(--lx-accent)]">
            <span className="sr-only">(</span>
            {acronym.abbr}
            <span className="sr-only">)</span>
          </span>
        )}
      </h2>
      {speakLang && <SpeakButton text={expansion ? expansion.expansion : item.term} lang={speakLang} className="mt-1 text-[var(--lx-ink-dim)]" size={20} />}
      </div>
      {expansion && <p className="mt-1.5 text-balance break-words text-[1.2rem] italic leading-snug text-[var(--lx-ink-dim)] lg:text-[1.35rem]">{expansion.expansion}</p>}
      <p lang="km" className="mt-2 text-balance break-words font-lexicon-km text-[1.5rem] leading-snug text-[var(--lx-accent)] lg:text-[1.75rem]">
        {item.termKm}
      </p>
      {tabLabel && (
        <p className="lx-caps mt-3 inline-flex items-center gap-2 text-[var(--lx-ink-faint)]">
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-[var(--lx-accent)]" />
          {tabLabel}
        </p>
      )}

      <div className="mt-5 border-t border-[var(--lx-line)] pt-3">
        {noDef ? (
          <p className="py-2 italic text-[var(--lx-ink-faint)]">
            {item.enDefWithheld ? t("Definition not shown: the source text is damaged.", "មិនបង្ហាញនិយមន័យ៖ អត្ថបទប្រភពខូច។") : t("No definition in the source list.", "គ្មាននិយមន័យក្នុងបញ្ជីប្រភពទេ។")}
          </p>
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
        {item.enDefWithheld && !noDef && (
          <p className="mt-2 text-xs italic text-[var(--lx-ink-faint)]">{t("English definition not shown: the source text is damaged.", "មិនបង្ហាញនិយមន័យជាភាសាអង់គ្លេស៖ អត្ថបទប្រភពខូច។")}</p>
        )}
      </div>

      {(item.extras ?? []).map((x) => (
        <div key={x.label} className="mt-4 border-t border-[var(--lx-line)] pt-3">
          <h3 className="lx-caps text-[var(--lx-ink-faint)]">{t(x.label, x.labelKm)}</h3>
          <p className="mt-1 break-words text-[1.05rem] leading-relaxed text-[var(--lx-ink)]">{x.value}</p>
        </div>
      ))}

      {item.compare && item.compare.length > 0 && (
        <section className="mt-4 border-t border-[var(--lx-line)] pt-3">
          <h3 className="lx-caps text-[var(--lx-ink-faint)]">{t("Other sources", "ប្រភពផ្សេងទៀត")}</h3>
          <dl className="mt-2 space-y-3">
            {item.compare.map((c) => (
              <div key={c.source + c.termKm}>
                <dt className="text-sm text-[var(--lx-ink-dim)]">
                  {t(c.source, c.sourceKm)}
                  {c.term && <span className="text-[var(--lx-ink-faint)]"> · {c.term}</span>}
                </dt>
                <dd className="break-words text-[1.05rem] leading-relaxed text-[var(--lx-ink)]">
                  <span lang="km" className="font-lexicon-km">{c.termKm}</span>
                  {c.termKm.trim() === item.termKm.trim() && (
                    <span className="ml-2 text-xs text-[var(--lx-ink-faint)]">{t("(same wording)", "(ពាក្យដូចគ្នា)")}</span>
                  )}
                </dd>
                {(c.defEn || c.defKm) && (
                  <dd className="mt-1 text-sm leading-relaxed text-[var(--lx-ink-dim)]">
                    {c.defEn && <p>{c.defEn.split("\n")[0]}</p>}
                    {c.defKm && <p lang="km" className="font-lexicon-km">{c.defKm.split("\n")[0]}</p>}
                  </dd>
                )}
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs italic text-[var(--lx-ink-faint)]">
            {t("Matched by English spelling only. The sources may use the word in a different sense, so check the definition before you pick a term.", "ផ្គូផ្គងតាមអក្ខរាវិរុទ្ធអង់គ្លេសប៉ុណ្ណោះ។ ប្រភពនីមួយៗអាចប្រើពាក្យនេះក្នុងន័យខុសគ្នា ដូច្នេះសូមពិនិត្យនិយមន័យមុនជ្រើសរើសពាក្យ។")}
          </p>
        </section>
      )}

      <div role="group" aria-label={t("Share this term", "ចែករំលែកពាក្យនេះ")} className="mt-8 flex flex-wrap items-center gap-2 border-t border-[var(--lx-line)] pt-4">
        <ShareButton icon={<Link2 size={15} aria-hidden />} onClick={onCopyLink}>
          {t("Copy link", "ចម្លងតំណ")}
        </ShareButton>
        {onShare && (
          <ShareButton icon={<Share2 size={15} aria-hidden />} onClick={onShare}>
            {t("Share", "ចែករំលែក")}
          </ShareButton>
        )}
        <ShareButton icon={<ImageDown size={15} aria-hidden />} onClick={() => onSaveImage(withCompare)} disabled={saving}>
          {saving ? t("Making image…", "កំពុងបង្កើតរូបភាព…") : t("Save image with QR code", "រក្សាទុករូបភាពជាមួយកូដ QR")}
        </ShareButton>
        {item.compare && item.compare.length > 0 && (
          <label className="inline-flex cursor-pointer items-center gap-2 px-1 text-sm text-[var(--lx-ink-dim)]">
            <input type="checkbox" checked={withCompare} onChange={(e) => setWithCompare(e.target.checked)} className="h-4 w-4 accent-[var(--lx-accent)]" />
            {t("Include other sources in the image", "បញ្ចូលប្រភពផ្សេងទៀតក្នុងរូបភាព")}
          </label>
        )}
      </div>
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
  alphabetical = true,
  toolId,
  cardTitle,
  cardTitleKm,
  credit,
  speakLang = "en-US",
}: LexiconProps) {
  const { text: t } = useLanguage();
  const { copyText } = useClipboard();
  const uid = useId();
  const [query, setQuery] = useToolState<string>(queryKey ?? `${storagePrefix}:query`, "");
  const [tab, setTab] = useToolState<string>(`${storagePrefix}:cat`, ALL);
  const [recentIds, setRecentIds] = useToolState<string[]>(`${storagePrefix}:recent`, []);
  const [openId, setOpenId] = useState<string | null>(null);
  const [rovingId, setRovingId] = useState<string | null>(null);
  const [activeLetter, setActiveLetter] = useState<string>("A");
  const [saving, setSaving] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const openIdRef = useRef<string | null>(null);
  const pushedEntry = useRef(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const entryRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const savedScroll = useRef(0);
  const lastOpened = useRef<string | null>(null);
  const wasOpen = useRef(false);
  const scrubbing = useRef(false);
  const scrollFrame = useRef(0);
  const focusFirstWhenReady = useRef(false);

  const list = useMemo(() => prepare(items, alphabetical), [items, alphabetical]);
  const byId = useMemo(() => new Map(list.map((item, index) => [item.id, { item, index }])), [list]);
  const idBySlug = useMemo(() => new Map(list.map((item) => [item.slug, item.id])), [list]);

  const activeTab = tab !== ALL && tabs?.some((x) => x.id === tab) ? tab : ALL;
  const q = query.trim().toLowerCase();
  const dq = useDeferredValue(q);
  const results = useMemo(() => {
    const pool = list.filter((item) => activeTab === ALL || item.tag === activeTab);
    if (!dq) return pool;
    return pool
      .filter((item) => item.haystack.includes(dq))
      .map((item) => ({ item, score: rank(item, dq) }))
      .sort((a, b) => a.score - b.score || a.item.order - b.item.order)
      .map((x) => x.item);
  }, [list, activeTab, dq]);

  // Progressive rendering: `limit` rows are in the DOM; it resets whenever the result set changes.
  const [progress, setProgress] = useState<{ key: unknown; n: number }>({ key: null, n: 0 });
  const openIndex = openId === null ? -1 : results.findIndex((item) => item.id === openId);
  const limit = Math.max(progress.key === results ? progress.n : FIRST_CHUNK, openIndex + 1);
  useEffect(() => {
    if (limit >= results.length) return;
    const frame = requestAnimationFrame(() => setProgress({ key: results, n: Math.min(results.length, limit + NEXT_CHUNK) }));
    return () => cancelAnimationFrame(frame);
  }, [limit, results]);
  const shown = useMemo(() => (limit >= results.length ? results : results.slice(0, limit)), [results, limit]);
  /** Complete the list now (before jumping to a letter, End, type-ahead) so every row exists. */
  const renderAll = useCallback(() => {
    if (limit < results.length) flushSync(() => setProgress({ key: results, n: results.length }));
  }, [limit, results]);

  const grouped = alphabetical && !dq;
  const groups = useMemo(() => {
    if (!grouped) return [{ letter: "", items: shown }];
    const out: { letter: string; items: Prepared[] }[] = [];
    for (const item of shown) {
      const last = out[out.length - 1];
      if (last && last.letter === item.letter) last.items.push(item);
      else out.push({ letter: item.letter, items: [item] });
    }
    return out;
  }, [shown, grouped]);
  const present = useMemo(() => new Set(results.map((item) => item.letter)), [results]);
  const showRail = grouped && results.length >= 40;

  const recentItems = useMemo(() => {
    const ids = Array.isArray(recentIds) ? recentIds : [];
    return ids.flatMap((id) => {
      const hit = byId.get(id);
      return hit ? [hit.item] : [];
    });
  }, [recentIds, byId]);

  const day = useSyncExternalStore(subscribeNever, localDay, () => null);
  const featuredPool = useMemo(
    () =>
      list.filter((item) => {
        const first = item.preview;
        return Boolean(first) && !TRUNCATED.test(first as string) && (first as string).length <= 260;
      }),
    [list],
  );
  const featured = day !== null && featuredPool.length > 0 ? featuredPool[day % featuredPool.length] : null;

  useEffect(() => {
    if (!focusFirstWhenReady.current || dq !== q) return;
    focusFirstWhenReady.current = false;
    listRef.current?.querySelector<HTMLElement>("[data-lx-row]")?.focus();
  }, [dq, q, results]);

  const entry = openId !== null ? (byId.get(openId)?.item ?? null) : null;
  const entryPos = entry ? results.findIndex((item) => item.id === entry.id) : -1;
  const prevItem = entryPos > 0 ? results[entryPos - 1] : undefined;
  const nextItem = entryPos >= 0 && entryPos < results.length - 1 ? results[entryPos + 1] : undefined;

  // The one list row that is a tab stop (the others are reached with the arrow keys).
  const tabStopId = results.some((item) => item.id === rovingId) ? rovingId : results.some((item) => item.id === openId) ? openId : (results[0]?.id ?? null);

  /** Keep "?term=" in the address bar in step with the open entry (other parameters and the hash are kept). */
  const writeUrl = useCallback((slug: string | null, mode: "push" | "replace") => {
    const next = withTermParam(window.location.pathname + window.location.search + window.location.hash, slug);
    if (next === window.location.pathname + window.location.search + window.location.hash) return;
    if (mode === "push") window.history.pushState(window.history.state, "", next);
    else window.history.replaceState(window.history.state, "", next);
  }, []);

  const open = useCallback(
    (id: string, opts?: { fromUrl?: boolean }) => {
      if (!isWide()) savedScroll.current = opts?.fromUrl ? -1 : (listRef.current?.scrollTop ?? 0);
      lastOpened.current = id;
      setOpenId(id);
      setRovingId(id);
      setRecentIds((prev) => [id, ...(Array.isArray(prev) ? prev : []).filter((x) => x !== id)].slice(0, MAX_RECENT));
      if (opts?.fromUrl) return;
      const slug = byId.get(id)?.item.slug ?? null;
      // Phones show the entry as its own screen, so opening it adds a history step (the system Back gesture then
      // closes it); on wide screens, and when moving between entries, the address is just updated in place.
      const push = !isWide() && openIdRef.current === null;
      writeUrl(slug, push ? "push" : "replace");
      if (push) pushedEntry.current = true;
    },
    [setRecentIds, byId, writeUrl],
  );
  const close = useCallback(() => {
    if (pushedEntry.current) {
      pushedEntry.current = false;
      window.history.back(); // the popstate handler below closes the entry
      return;
    }
    writeUrl(null, "replace");
    setOpenId(null);
  }, [writeUrl]);

  useEffect(() => {
    openIdRef.current = openId;
  }, [openId]);

  /** Open the entry named in the address bar, making sure its row is in the list. */
  const openFromUrl = useCallback(
    (id: string) => {
      setQuery("");
      setTab(ALL);
      open(id, { fromUrl: true });
    },
    [open, setQuery, setTab],
  );

  // Shareable links: open the entry named in "?term=" on load, and follow the browser's Back/Forward buttons.
  useEffect(() => {
    const slug = readTermParam(window.location.search);
    const id = slug ? idBySlug.get(slug) : undefined;
    // Intentional one-time read of the address bar after mount (SSR-safe), like the storage hook's hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (id) openFromUrl(id);
    else if (slug) writeUrl(null, "replace"); // unknown slug: drop it
    const onPop = () => {
      pushedEntry.current = false;
      const next = readTermParam(window.location.search);
      const nextId = next ? idBySlug.get(next) : undefined;
      if (nextId) openFromUrl(nextId);
      else setOpenId(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Entry opened: on phones move focus to the term; on wide screens keep it in the list so the arrow keys keep working.
  // Keep the open row visible, start the entry at the top, and let Escape close it.
  useEffect(() => {
    if (entry === null) return;
    wasOpen.current = true;
    if (entryRef.current) entryRef.current.scrollTop = 0;
    if (!isWide()) headingRef.current?.focus({ preventScroll: true });
    else document.getElementById(`${uid}-r${byId.get(entry.id)?.index}`)?.scrollIntoView({ block: "nearest" });
    const onKey = (event: globalThis.KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && event.target.closest("input, textarea, [contenteditable=true]");
      if (event.key === "Escape" && !typing) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [entry, byId, uid, close]);

  // Phones: back from the entry restores the list scroll position and focuses the row that was open.
  useEffect(() => {
    if (entry !== null || !wasOpen.current) return;
    wasOpen.current = false;
    if (isWide()) return;
    const index = lastOpened.current ? byId.get(lastOpened.current)?.index : undefined;
    const row = index !== undefined ? document.getElementById(`${uid}-r${index}`) : null;
    const el = listRef.current;
    const target = savedScroll.current;
    const restore = () => {
      if (!el) return;
      if (target >= 0) el.scrollTop = target;
      else row?.scrollIntoView({ block: "center" });
    };
    restore();
    requestAnimationFrame(restore); // layout settles one frame after the pane is shown again
    row?.focus({ preventScroll: true });
  }, [entry, byId, uid]);

  const jumpTo = (letter: string) => {
    renderAll();
    const el = listRef.current;
    const section = el?.querySelector<HTMLElement>(`[data-letter-section="${letter}"]`);
    if (!el || !section) return;
    el.scrollTo({ top: section.offsetTop, behavior: reducedMotion() || scrubbing.current ? "auto" : "smooth" });
  };

  function updateActiveLetter() {
    cancelAnimationFrame(scrollFrame.current);
    scrollFrame.current = requestAnimationFrame(() => {
      const el = listRef.current;
      if (!el || !grouped) return;
      let current = "";
      for (const section of el.querySelectorAll<HTMLElement>("[data-letter-section]")) {
        if (section.offsetTop <= el.scrollTop + 12) current = section.dataset.letterSection ?? current;
        else break;
      }
      if (current) setActiveLetter((prev) => (prev === current ? prev : current));
    });
  }

  function pickFromRail(clientY: number) {
    const rail = railRef.current;
    if (!rail) return;
    const box = rail.getBoundingClientRect();
    const index = Math.min(RAIL.length - 1, Math.max(0, Math.floor(((clientY - box.top) / box.height) * RAIL.length)));
    for (let d = 0; d < RAIL.length; d++) {
      const after = RAIL[index + d];
      const before = RAIL[index - d];
      const pick = after && present.has(after) ? after : before && present.has(before) ? before : undefined;
      if (pick) {
        jumpTo(pick);
        setActiveLetter(pick);
        return;
      }
    }
  }
  const onRailDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    scrubbing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    pickFromRail(event.clientY);
  };
  const onRailMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (scrubbing.current) pickFromRail(event.clientY);
  };
  const onRailUp = () => {
    scrubbing.current = false;
  };

  function onListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (!target.matches("[data-lx-row]") || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "End" || event.key === "PageDown" || (grouped && /^[a-z]$/i.test(event.key))) renderAll();
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-lx-row]") ?? []);
    const at = rows.indexOf(target);
    let next = -1;
    if (event.key === "ArrowDown") next = Math.min(rows.length - 1, at + 1);
    else if (event.key === "ArrowUp") {
      if (at === 0) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      next = Math.max(0, at - 1);
    } else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = rows.length - 1;
    else if (event.key === "PageDown") next = Math.min(rows.length - 1, at + 8);
    else if (event.key === "PageUp") next = Math.max(0, at - 8);
    else if (grouped && /^[a-z]$/i.test(event.key)) next = rows.findIndex((row) => row.dataset.letter === event.key.toUpperCase());
    if (next < 0) return;
    event.preventDefault();
    rows[next]?.focus();
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (q !== dq) {
        focusFirstWhenReady.current = true; // the list is still catching up with what was typed
        return;
      }
      const first = tabStopId ? listRef.current?.querySelector<HTMLElement>(`[data-lx-id="${CSS.escape(tabStopId)}"]`) : null;
      (first ?? listRef.current?.querySelector<HTMLElement>("[data-lx-row]"))?.focus();
    } else if (event.key === "Enter") {
      if (q === dq && results.length > 0) {
        event.preventDefault();
        open(results[0].id);
      }
    } else if (event.key === "Escape") {
      if (query) setQuery("");
      else event.currentTarget.blur();
    }
  }

  const canShare = useSyncExternalStore(
    subscribeNever,
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false,
  );
  const toolPath = () => (toolId ? toolHref(toolId) : window.location.pathname);
  const linkFor = (item: Prepared) => termUrl(window.location.origin, toolPath(), item.slug);

  async function shareEntry(item: Prepared) {
    try {
      await navigator.share({ title: `${item.term} · ${item.termKm}`, url: linkFor(item) });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) toast(t("Could not share this term.", "មិនអាចចែករំលែកពាក្យនេះបានទេ។"), "error");
    }
  }

  async function saveImage(item: Prepared, withCompare: boolean) {
    const root = rootRef.current;
    if (!root || saving) return;
    setSaving(true);
    try {
      const { renderGlossaryCard } = await import("@/lib/glossary-card");
      const url = linkFor(item);
      const tag = item.tag ? tabs?.find((x) => x.id === item.tag) : undefined;
      const blob = await renderGlossaryCard({
        term: item.term,
        termKm: item.termKm,
        tag: tag ? `${tag.label} / ${tag.labelKm}` : undefined,
        blocks: cardBlocks(item, item.enDefWithheld ? "Definition not shown: the source text is damaged." : "No definition in the source list."),
        title: `${cardTitle ?? name} · ${cardTitleKm ?? nameKm}`,
        url,
        urlLabel: new URL(url).host + toolPath(),
        credit: credit?.(item),
        compare:
          withCompare && item.compare?.length
            ? item.compare.map((c) => ({
                source: c.source,
                term: c.term,
                termKm: c.termKm,
                def: c.defEn?.split("\n")[0] ?? c.defKm?.split("\n")[0],
                defLang: c.defEn ? ("en" as const) : ("km" as const),
              }))
            : undefined,
        compareLabel: "Other sources · ប្រភពផ្សេងទៀត",
        compareNote: "Matched by English spelling only; the sources may use the word in a different sense.",
        watermark: SITE_DOMAIN,
        scanLabel: "Scan to open this term · ស្កេនដើម្បីបើកពាក្យនេះ",
        moreLabel: "continued at the link · បន្តនៅតំណ",
        fonts: readFonts(root),
      });
      downloadBlob(blob, `${item.slug}-glossary.png`);
      recordExport();
      toast(t("Image saved.", "បានរក្សាទុករូបភាព។"));
    } catch {
      toast(t("Could not create the image.", "មិនអាចបង្កើតរូបភាពបានទេ។"), "error");
    } finally {
      setSaving(false);
    }
  }

  const tabLabel = (id?: string) => {
    const hit = id ? tabs?.find((x) => x.id === id) : undefined;
    return hit ? t(hit.label, hit.labelKm) : undefined;
  };
  const resultsId = `${uid}-results`;
  const countLabel = t(`${results.length} ${results.length === 1 ? nounOne : noun}`, `${nounKm} ${results.length}`);

  const listPane = (
    <section aria-label={t("Terms", "ពាក្យ")} className={`${entry ? "hidden lg:flex" : "flex"} min-h-0 flex-col`}>
      <header className="shrink-0">
        <div className="px-5 pt-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[0.95rem] italic text-[var(--lx-ink-faint)]">{t(name, nameKm)}</p>
            <p className="hidden text-[0.7rem] text-[var(--lx-ink-faint)] [@media(hover:hover)]:lg:block" aria-hidden>
              {t("↑ ↓ to browse · Enter to open", "↑ ↓ ដើម្បីរកមើល · Enter ដើម្បីបើក")}
            </p>
          </div>
          <div className="relative mt-3 border-b border-[var(--lx-line)] focus-within:border-[var(--lx-accent)]">
            <label htmlFor={`${uid}-q`} className="sr-only">
              {t("Search", "ស្វែងរក")}
            </label>
            <input
              ref={searchRef}
              id={`${uid}-q`}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder={t(searchPlaceholder, searchPlaceholderKm)}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              className="lx-input w-full bg-transparent py-2 pr-9 text-[var(--lx-ink)] placeholder:text-[var(--lx-ink-faint)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                aria-label={t("Clear search", "សម្អាតការស្វែងរក")}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-[var(--lx-ink-faint)] transition-colors hover:text-[var(--lx-ink)]"
              >
                <X size={18} aria-hidden />
              </button>
            )}
          </div>
        </div>

        {tabs && tabs.length > 0 && (
          <div className="mt-3">
            <ScrollTabs
              tabs={[{ id: ALL, label: t("All", "ទាំងអស់") }, ...tabs.map((x) => ({ id: x.id, label: t(x.label, x.labelKm) }))]}
              active={activeTab}
              onChange={setTab}
              ariaLabel={t("Category", "ប្រភេទ")}
              controls={resultsId}
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-b border-[var(--lx-line)] px-5 py-2">
          <p aria-live="polite" className="lx-caps text-[var(--lx-ink-faint)]">
            {countLabel}
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
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={listRef}
          id={resultsId}
          onScroll={updateActiveLetter}
          onKeyDown={onListKeyDown}
          onFocus={(event) => {
            const id = (event.target as HTMLElement).dataset.lxId;
            if (id) setRovingId(id);
          }}
          className={`lx-scroll relative h-full overflow-y-auto scroll-pt-9 ${showRail ? "pr-5" : ""}`}
        >
          {!dq && recentItems.length > 0 && (
            <section aria-label={t("Recent", "ទើបមើលថ្មីៗ")} className="px-5 pt-4">
              <h3 className="lx-caps text-[var(--lx-ink-faint)]">{t("Recent", "ទើបមើលថ្មីៗ")}</h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {recentItems.slice(0, SHOWN_RECENT).map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => open(item.id)} className="max-w-[12rem] truncate rounded-full border border-[var(--lx-line)] px-3 py-1 text-[0.85rem] text-[var(--lx-ink-dim)] transition-colors hover:border-[var(--lx-accent)] hover:text-[var(--lx-ink)]">
                      {item.term}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!dq && featured && (
            <div className="px-5 pb-1 pt-5 lg:hidden">
              <FeaturedCard item={featured} label={t(featuredLabel, featuredLabelKm)} onOpen={open} />
            </div>
          )}

          {results.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="italic text-[var(--lx-ink-faint)]">{t(emptyText, emptyTextKm)}</p>
              {(query || activeTab !== ALL) && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setTab(ALL);
                  }}
                  className="lx-caps mt-3 text-[var(--lx-accent)] underline underline-offset-4"
                >
                  {t("Clear search and filters", "សម្អាតការស្វែងរក និងតម្រង")}
                </button>
              )}
            </div>
          ) : (
            <div className="pb-4">
              {groups.map((group) => (
                <section key={group.letter || "flat"} data-letter-section={group.letter || undefined}>
                  {group.letter && (
                    <h3 className="sticky top-0 z-10 flex items-baseline gap-2 border-y border-[var(--lx-line)] bg-[var(--lx-paper)] px-5 py-1">
                      <span className="text-lg font-medium leading-none text-[var(--lx-accent)]">{group.letter}</span>
                      <span className="lx-caps text-[var(--lx-ink-faint)]">{group.items.length}</span>
                    </h3>
                  )}
                  <ul>
                    {group.items.map((item) => (
                      <LexiconRow key={item.id} item={item} domId={`${uid}-r${byId.get(item.id)?.index}`} selected={item.id === openId} tabStop={item.id === tabStopId} q={dq} onOpen={open} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        {showRail && (
          <div
            ref={railRef}
            aria-hidden
            onPointerDown={onRailDown}
            onPointerMove={onRailMove}
            onPointerUp={onRailUp}
            onPointerCancel={onRailUp}
            className="absolute inset-y-1 right-0 z-20 flex w-5 touch-none select-none flex-col justify-between"
          >
            {RAIL.map((letter) => (
              <button
                key={letter}
                type="button"
                tabIndex={-1}
                disabled={!present.has(letter)}
                onClick={() => {
                  jumpTo(letter);
                  setActiveLetter(letter);
                }}
                className={`flex min-h-0 flex-1 items-center justify-center text-[10px] font-semibold leading-none transition-colors ${
                  letter === activeLetter && present.has(letter) ? "text-[var(--lx-accent)]" : present.has(letter) ? "text-[var(--lx-ink-dim)] hover:text-[var(--lx-accent)]" : "text-[var(--lx-line)]"
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  const entryPane = (
    <section
      aria-label={t("Entry", "ធាតុ")}
      className={`${entry ? "flex" : "hidden lg:flex"} min-h-0 flex-col border-[var(--lx-line)] bg-[var(--lx-page)] lg:border-l`}
    >
      <div ref={entryRef} className="min-h-0 flex-1 overflow-y-auto">
        {entry ? (
          <LexiconEntry
            item={entry}
            tabLabel={tabLabel(entry.tag)}
            onBack={close}
            onPrev={prevItem ? () => open(prevItem.id) : undefined}
            onNext={nextItem ? () => open(nextItem.id) : undefined}
            headingRef={headingRef}
            speakLang={speakLang}
            onCopyLink={() => void copyText(linkFor(entry))}
            onShare={canShare ? () => void shareEntry(entry) : undefined}
            onSaveImage={(withCompare) => void saveImage(entry, withCompare)}
            saving={saving}
          />
        ) : (
          <div className="mx-auto hidden h-full max-w-md flex-col justify-center px-9 py-10 lg:flex">
            {featured ? (
              <FeaturedCard item={featured} label={t(featuredLabel, featuredLabelKm)} onOpen={open} />
            ) : null}
            <p className="mt-8 text-sm italic leading-relaxed text-[var(--lx-ink-faint)]">
              {t("Choose a term from the list to read its definition. Use the category tabs to narrow the list, and the letters on the right to jump.", "ជ្រើសរើសពាក្យពីបញ្ជីដើម្បីអាននិយមន័យ។ ប្រើផ្ទាំងប្រភេទដើម្បីបង្រួមបញ្ជី និងអក្សរនៅខាងស្តាំដើម្បីរំលង។")}
            </p>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div ref={rootRef} className="lexicon font-lexicon mx-auto grid h-[clamp(32rem,84dvh,60rem)] w-full max-w-5xl grid-cols-1 grid-rows-[minmax(0,1fr)] overflow-hidden rounded-2xl border border-[var(--lx-line)] shadow-[0_1px_2px_rgb(0_0_0/0.04),0_16px_36px_-18px_rgb(70_50_20/0.28)] lg:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)]">
      {listPane}
      {entryPane}
    </div>
  );
}
