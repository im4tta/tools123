"use client";
// French Loanwords in Khmer — a dedicated reading page (not the shared Lexicon list).
// Layout: word-of-the-day hero, a large search field, theme chips, a theme overview grid when nothing is
// filtered, a card grid of words otherwise, and a detail sheet with copy / link / image actions.
// Sharing and images reuse lib/glossary-share and lib/glossary-card, so links and cards match the other glossaries.
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Copy, ImageDown, Link2, Search, X } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useLanguage } from "@/components/LanguageProvider";
import { useClipboard } from "@/components/ClipboardProvider";
import { FRENCH_LOAN_THEMES, FRENCH_LOANWORDS, type FrenchLoanSourceTag, type FrenchLoanword } from "@/lib/data/french-loanwords";
import { FRENCH_LOANWORDS_PROVENANCE } from "@/lib/data/french-loanwords-provenance";
import { assignSlugs, readTermParam, termUrl, withTermParam } from "@/lib/glossary-share";
import { downloadBlob } from "@/lib/download";
import { SITE_DOMAIN } from "@/lib/site";
import { useToolState } from "@/lib/storage";
import { toast } from "@/lib/toast";
import { toolHref } from "@/lib/toolRoutes";

const TOOL_ID = "french-loanwords-glossary";
const PAGE = 48;
const nf = new Intl.NumberFormat("en-US");

const SLUGS = assignSlugs(FRENCH_LOANWORDS.map((w, i) => ({ id: String(w.no), term: w.fr, tag: String(w.theme), order: i })));
const BY_SLUG = new Map(FRENCH_LOANWORDS.map((w) => [SLUGS.get(String(w.no)) ?? "", w]));

const COUNT_BY_THEME = FRENCH_LOANWORDS.reduce<Record<number, number>>((acc, w) => ((acc[w.theme] = (acc[w.theme] ?? 0) + 1), acc), {});
const SAMPLES_BY_THEME = FRENCH_LOAN_THEMES.reduce<Record<number, FrenchLoanword[]>>((acc, th) => {
  acc[th.id] = FRENCH_LOANWORDS.filter((w) => w.theme === th.id).slice(0, 3);
  return acc;
}, {});
const TAG_COUNTS = FRENCH_LOANWORDS.reduce<Record<FrenchLoanSourceTag, number>>(
  (acc, w) => (w.tag && (acc[w.tag] += 1), acc),
  { "CN 1967": 0, RAC: 0, "FR-KH": 0 },
);

/** Case- and accent-insensitive matching ("cafe" finds "café"). */
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const HAYSTACK = new Map(FRENCH_LOANWORDS.map((w) => [w.no, fold([w.fr, w.km, w.roman, w.en].join(" "))]));

const firstKm = (km: string) => km.split("/")[0].trim();
const exampleOf = (w: FrenchLoanword) => (w.ex === undefined ? undefined : FRENCH_LOAN_THEMES[w.theme - 1].examples[w.ex]);

const noSubscribe = () => () => {};

/** Same word all day, a different one tomorrow (UTC date), with no network or randomness. */
function wordOfTheDay(): FrenchLoanword {
  const d = new Date();
  const seed = d.getUTCFullYear() * 400 + d.getUTCMonth() * 32 + d.getUTCDate();
  return FRENCH_LOANWORDS[(seed * 2654435761) % FRENCH_LOANWORDS.length];
}

export default function FrenchLoanwordsGlossary() {
  const { text: t } = useLanguage();
  const { copyText } = useClipboard();
  const [query, setQuery] = useToolState<string>(`${TOOL_ID}:query`, "");
  const [theme, setTheme] = useToolState<number>(`${TOOL_ID}:theme`, 0);
  const [paging, setPaging] = useState({ key: "", n: PAGE });
  const [open, setOpen] = useState<FrenchLoanword | null>(null);
  const [saving, setSaving] = useState(false);
  // Picked on the client only, so the server render and the first client render agree.
  const featured = useSyncExternalStore(noSubscribe, wordOfTheDay, () => null);
  const rootRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const q = fold(query.trim());
  const results = useMemo(
    () => FRENCH_LOANWORDS.filter((w) => (theme === 0 || w.theme === theme) && (!q || (HAYSTACK.get(w.no) ?? "").includes(q))),
    [q, theme],
  );
  const browsing = !q && theme === 0;
  // "Show more" resets whenever the search or theme changes.
  const filterKey = `${q}|${theme}`;
  const limit = paging.key === filterKey ? paging.n : PAGE;
  const showMore = () => setPaging({ key: filterKey, n: limit + PAGE });

  // ?term=<slug> opens that word, and the URL follows the open word so it can be shared.
  useEffect(() => {
    const sync = () => {
      const slug = readTermParam(window.location.search);
      setOpen(slug ? (BY_SLUG.get(slug) ?? null) : null);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const show = useCallback((w: FrenchLoanword | null) => {
    setOpen(w);
    window.history.replaceState(window.history.state, "", withTermParam(window.location.href, w ? (SLUGS.get(String(w.no)) ?? null) : null));
  }, []);

  const pickTheme = (id: number) => {
    setTheme(id);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const linkFor = (w: FrenchLoanword) => termUrl(window.location.origin, toolHref(TOOL_ID), SLUGS.get(String(w.no)) ?? "");
  const themeName = (id: number) => {
    const th = FRENCH_LOAN_THEMES[id - 1];
    return t(th.en, th.km);
  };

  async function saveImage(w: FrenchLoanword) {
    const root = rootRef.current;
    if (!root || saving) return;
    setSaving(true);
    try {
      const { renderGlossaryCard } = await import("@/lib/glossary-card");
      const th = FRENCH_LOAN_THEMES[w.theme - 1];
      const ex = exampleOf(w);
      const probe = document.createElement("span");
      probe.className = "font-khmer";
      root.appendChild(probe);
      const fonts = { latin: getComputedStyle(root).fontFamily, khmer: getComputedStyle(probe).fontFamily };
      probe.remove();
      const url = linkFor(w);
      const blob = await renderGlossaryCard({
        term: w.fr,
        termKm: w.km,
        tag: `${th.en} / ${th.km}`,
        blocks: [
          { text: w.en, lang: "en", n: 1 },
          { text: `/${w.roman}/`, lang: "en", muted: true, italic: true },
          ...(ex ? [{ text: ex.km, lang: "km" as const, muted: true }, { text: `“${ex.en}”`, lang: "en" as const, muted: true, italic: true }] : []),
        ],
        title: "French Loanwords in Khmer · ពាក្យកម្ចីពីភាសាបារាំង",
        url,
        urlLabel: new URL(url).host + toolHref(TOOL_ID),
        credit: `Glossary of French Loanwords in Khmer (supplied list)${w.tag ? ` · tagged ${w.tag}, not verified` : ""}`,
        watermark: SITE_DOMAIN,
        scanLabel: "Scan to open this word · ស្កេនដើម្បីបើកពាក្យនេះ",
        moreLabel: "continued at the link · បន្តនៅតំណ",
        fonts,
      });
      downloadBlob(blob, `${SLUGS.get(String(w.no))}-french-loanword.png`);
      toast(t("Image saved.", "បានរក្សាទុករូបភាព។"));
    } catch {
      toast(t("Could not create the image.", "មិនអាចបង្កើតរូបភាពបានទេ។"), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ToolShell
      title="French Loanwords in Khmer"
      khmerTitle="ពាក្យកម្ចីពីភាសាបារាំងក្នុងភាសាខ្មែរ"
      description="Khmer words that came from French — café, ម៉ូតូ, ប៉ូលិស and over 1,600 more — with the French original, pronunciation, English meaning and example sentences, grouped into 24 themes."
      descriptionKm="ពាក្យខ្មែរដែលខ្ចីពីភាសាបារាំង — កាហ្វេ ម៉ូតូ ប៉ូលិស និងជាង ១៦០០ ពាក្យទៀត — ជាមួយពាក្យបារាំងដើម ការបញ្ចេញសំឡេង អត្ថន័យជាភាសាអង់គ្លេស និងប្រយោគឧទាហរណ៍ ចែកជា ២៤ ប្រធានបទ។"
    >
      <div ref={rootRef} className="space-y-10">
        {/* Hero: one word, set large, with the figures beside it */}
        <section aria-labelledby="fr-hero" className="overflow-hidden rounded-[28px] border border-[var(--ground-line)] bg-[var(--ground-raised)]">
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="min-w-0">
              <p id="fr-hero" className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--ink-faint)]">
                {t("Word of the day", "ពាក្យប្រចាំថ្ងៃ")}
              </p>
              {featured ? (
                <button type="button" onClick={() => show(featured)} className="group mt-4 block text-left">
                  <span lang="km" className="font-khmer block text-[clamp(3rem,9vw,5.5rem)] font-semibold leading-[1.15] text-[var(--ink)]">
                    {firstKm(featured.km)}
                  </span>
                  <span className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span lang="fr" className="font-display text-2xl italic text-[var(--gold-text)] sm:text-3xl">{featured.fr}</span>
                    <span className="text-base text-[var(--ink-dim)]">{featured.en}</span>
                  </span>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ink)] underline-offset-4 group-hover:underline">
                    {t("Read more", "អានបន្ថែម")} <ArrowRight size={15} aria-hidden />
                  </span>
                </button>
              ) : (
                <div className="mt-4 h-[11rem]" aria-hidden />
              )}
            </div>
            <dl className="grid grid-cols-3 gap-6 border-t border-[var(--ground-line)] pt-6 lg:grid-cols-1 lg:gap-5 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              {[
                [nf.format(FRENCH_LOANWORDS.length), t("words", "ពាក្យ")],
                [String(FRENCH_LOAN_THEMES.length), t("themes", "ប្រធានបទ")],
                ["1863–1953", t("Protectorate era", "សម័យអាណាព្យាបាល")],
              ].map(([value, label]) => (
                <div key={label} className="min-w-0">
                  <dt className="sr-only">{label}</dt>
                  <dd className="whitespace-nowrap font-display text-xl font-medium tracking-tight text-[var(--ink)] tabular-nums sm:text-3xl">{value}</dd>
                  <dd className="mt-1 text-xs text-[var(--ink-dim)] sm:text-sm">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Search and themes */}
        <section ref={resultsRef} aria-label={t("Find a word", "ស្វែងរកពាក្យ")} className="scroll-mt-24 space-y-4">
          <label className="relative block">
            <span className="sr-only">{t("Search words", "ស្វែងរកពាក្យ")}</span>
            <Search size={20} aria-hidden className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Search in French, Khmer or English — try “cafe” or “ម៉ូតូ”", "ស្វែងរកជាភាសាបារាំង ខ្មែរ ឬអង់គ្លេស — ឧ. “cafe” ឬ “ម៉ូតូ”")}
              className="h-14 w-full rounded-2xl border border-[var(--ground-line-strong)] bg-[var(--ground-raised)] pl-14 pr-12 text-base text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label={t("Clear search", "សម្អាតការស្វែងរក")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-[var(--ink-faint)] hover:text-[var(--ink)]">
                <X size={18} aria-hidden />
              </button>
            )}
          </label>

          <div role="group" aria-label={t("Themes", "ប្រធានបទ")} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
            {[0, ...FRENCH_LOAN_THEMES.map((th) => th.id)].map((id) => {
              const active = theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTheme(id)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                    active
                      ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--ground)]"
                      : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:border-[var(--ground-line-strong)] hover:text-[var(--ink)]"
                  }`}
                >
                  {id === 0 ? t("All", "ទាំងអស់") : themeName(id)}
                  <span className={`ml-1.5 tabular-nums ${active ? "opacity-70" : "text-[var(--ink-faint)]"}`}>{id === 0 ? nf.format(FRENCH_LOANWORDS.length) : COUNT_BY_THEME[id]}</span>
                </button>
              );
            })}
          </div>
        </section>

        {browsing ? (
          /* Nothing filtered: the 24 themes as a calm grid */
          <section aria-labelledby="fr-themes">
            <h2 id="fr-themes" className="font-display text-xl font-medium text-[var(--ink)]">{t("Browse by theme", "រកមើលតាមប្រធានបទ")}</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FRENCH_LOAN_THEMES.map((th) => (
                <li key={th.id}>
                  <button
                    type="button"
                    onClick={() => pickTheme(th.id)}
                    className="group flex h-full w-full flex-col rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-left transition-[border-color,transform] hover:-translate-y-0.5 hover:border-[var(--ground-line-strong)]"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-[15px] font-medium leading-snug text-[var(--ink)]">{t(th.en, th.km)}</span>
                      <span className="shrink-0 text-sm tabular-nums text-[var(--ink-faint)]">{COUNT_BY_THEME[th.id]}</span>
                    </span>
                    <span lang="km" className="font-khmer mt-4 line-clamp-1 text-lg text-[var(--ink-dim)]">
                      {SAMPLES_BY_THEME[th.id].map((w) => firstKm(w.km)).join("  ·  ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          /* Filtered: words as cards */
          <section aria-labelledby="fr-results">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="fr-results" className="font-display text-xl font-medium text-[var(--ink)]">
                {theme ? themeName(theme) : t("Results", "លទ្ធផល")}
              </h2>
              <p aria-live="polite" className="text-sm tabular-nums text-[var(--ink-faint)]">
                {t(`${nf.format(results.length)} ${results.length === 1 ? "word" : "words"}`, `ពាក្យចំនួន ${nf.format(results.length)}`)}
              </p>
            </div>
            {results.length === 0 ? (
              <p className="mt-10 text-center text-[var(--ink-dim)]">{t("No words match that search.", "គ្មានពាក្យត្រូវនឹងការស្វែងរកនេះទេ។")}</p>
            ) : (
              <>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {results.slice(0, limit).map((w) => (
                    <li key={w.no}>
                      <button
                        type="button"
                        onClick={() => show(w)}
                        className="flex h-full w-full flex-col rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-left transition-[border-color,transform] hover:-translate-y-0.5 hover:border-[var(--ground-line-strong)]"
                      >
                        <span lang="km" className="font-khmer text-2xl font-semibold leading-snug text-[var(--ink)]">{w.km}</span>
                        <span lang="fr" className="mt-1 font-display text-lg italic text-[var(--gold-text)]">{w.fr}</span>
                        <span className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--ink-dim)]">{w.en}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {results.length > limit && (
                  <div className="mt-6 text-center">
                    <button type="button" onClick={showMore} className="rounded-full border border-[var(--ground-line-strong)] px-5 py-2.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--ground-raised)]">
                      {t(`Show more (${nf.format(results.length - limit)} left)`, `បង្ហាញបន្ថែម (នៅសល់ ${nf.format(results.length - limit)})`)}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Source tags, stated as the list's claims */}
        <section aria-labelledby="fr-tags" className="rounded-2xl border border-[var(--ground-line)] px-5 py-5 sm:px-6">
          <h2 id="fr-tags" className="text-sm font-semibold text-[var(--ink)]">{t("About the source tags", "អំពីស្លាកប្រភព")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--ink-dim)]">
            {t(
              "Each word carries the tag the list gives it, naming the reference it says the word was checked against. Tools123 has not checked these tags yet, so read them as the list's claim, not a confirmed citation.",
              "ពាក្យនីមួយៗមានស្លាកដែលបញ្ជីបានដាក់ ដោយបញ្ជាក់ពីឯកសារយោងដែលបញ្ជីនិយាយថាបានផ្ទៀងផ្ទាត់។ Tools123 មិនទាន់បានពិនិត្យស្លាកទាំងនេះទេ ដូច្នេះសូមអានវាជាការអះអាងរបស់បញ្ជី មិនមែនជាឯកសារយោងដែលបានបញ្ជាក់ទេ។",
            )}
          </p>
          <dl className="mt-4 divide-y divide-[var(--ground-line)]">
            {FRENCH_LOANWORDS_PROVENANCE.citedWorks.map((w) => (
              <div key={w.tag} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6">
                <dt className="w-28 shrink-0 font-mono text-xs text-[var(--ink)]">
                  {w.tag} <span className="text-[var(--ink-faint)]">· {nf.format(TAG_COUNTS[w.tag as FrenchLoanSourceTag])}</span>
                </dt>
                <dd className="text-sm leading-relaxed text-[var(--ink-dim)]">{t(w.en, w.km)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <SourceCredits>
          <p>
            {t(
              "Words, meanings, pronunciations and example sentences come from a glossary list supplied to Tools123 (“Glossary of French Loanwords in Khmer”), reproduced as supplied. Its compiler is not named, and Tools123 has not checked it against the dictionaries it cites; a few tags look doubtful. Not endorsed by the Royal Academy of Cambodia, MoEYS or the cited authors.",
              "ពាក្យ អត្ថន័យ ការបញ្ចេញសំឡេង និងប្រយោគឧទាហរណ៍ មកពីបញ្ជីវចនានុក្រមដែលបានផ្តល់ឱ្យ Tools123 (“Glossary of French Loanwords in Khmer”) ចម្លងតាមដែលបានផ្តល់។ មិនមានឈ្មោះអ្នករៀបរៀង ហើយ Tools123 មិនទាន់បានផ្ទៀងផ្ទាត់ជាមួយវចនានុក្រមដែលបញ្ជីយោងទេ ស្លាកខ្លះហាក់ដូចជាមិនត្រឹមត្រូវ។ មិនមែនជាការគាំទ្រពីរាជបណ្ឌិត្យសភាកម្ពុជា ក្រសួងអប់រំ ឬអ្នកនិពន្ធដែលបានយោងទេ។",
            )}
          </p>
          <p>{t("Origin of the list not yet confirmed (Provenance Pending).", "ប្រភពដើមនៃបញ្ជីមិនទាន់បានបញ្ជាក់ (Provenance Pending)។")}</p>
        </SourceCredits>
      </div>

      {open && (
        <WordSheet
          word={open}
          list={browsing ? FRENCH_LOANWORDS : results}
          themeLabel={themeName(open.theme)}
          saving={saving}
          onClose={() => show(null)}
          onGo={show}
          onCopy={() => void copyText([open.km, open.fr, `/${open.roman}/`, open.en].join("\n"))}
          onCopyLink={() => void copyText(linkFor(open))}
          onSave={() => void saveImage(open)}
        />
      )}
    </ToolShell>
  );
}

function WordSheet({
  word,
  list,
  themeLabel,
  saving,
  onClose,
  onGo,
  onCopy,
  onCopyLink,
  onSave,
}: {
  word: FrenchLoanword;
  list: FrenchLoanword[];
  themeLabel: string;
  saving: boolean;
  onClose: () => void;
  onGo: (w: FrenchLoanword) => void;
  onCopy: () => void;
  onCopyLink: () => void;
  onSave: () => void;
}) {
  const { text: t } = useLanguage();
  const closeRef = useRef<HTMLButtonElement>(null);
  const index = list.findIndex((w) => w.no === word.no);
  const prev = index > 0 ? list[index - 1] : undefined;
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : undefined;
  const ex = exampleOf(word);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && prev) onGo(prev);
      if (e.key === "ArrowRight" && next) onGo(next);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, onGo, prev, next]);

  const action = "inline-flex items-center gap-2 rounded-full border border-[var(--ground-line-strong)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--ground)] disabled:opacity-50";

  // Rendered into <body> so no page wrapper can trap it under the mobile bottom bar.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" aria-label={t("Close", "បិទ")} tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fr-sheet-title"
        className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[var(--shadow-elev)] sm:max-w-xl sm:rounded-[28px] sm:p-9"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-xs font-medium uppercase tracking-[0.14em] text-[var(--ink-faint)]">{themeLabel}</p>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" disabled={!prev} onClick={() => prev && onGo(prev)} aria-label={t("Previous word", "ពាក្យមុន")} className="rounded-full p-2 text-[var(--ink-dim)] hover:bg-[var(--ground)] disabled:opacity-30">
              <ChevronLeft size={18} aria-hidden />
            </button>
            <button type="button" disabled={!next} onClick={() => next && onGo(next)} aria-label={t("Next word", "ពាក្យបន្ទាប់")} className="rounded-full p-2 text-[var(--ink-dim)] hover:bg-[var(--ground)] disabled:opacity-30">
              <ChevronRight size={18} aria-hidden />
            </button>
            <button ref={closeRef} type="button" onClick={onClose} aria-label={t("Close", "បិទ")} className="ml-1 rounded-full bg-[var(--ground)] p-2 text-[var(--ink-dim)] hover:text-[var(--ink)]">
              <X size={18} aria-hidden />
            </button>
          </div>
        </div>

        <h2 id="fr-sheet-title" lang="km" className="font-khmer mt-6 text-5xl font-semibold leading-[1.2] text-[var(--ink)] sm:text-6xl">
          {word.km}
        </h2>
        <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
          <span lang="fr" className="font-display text-2xl italic text-[var(--gold-text)]">{word.fr}</span>
          <span className="font-mono text-sm text-[var(--ink-faint)]">/{word.roman}/</span>
        </p>
        <p className="mt-5 text-lg leading-relaxed text-[var(--ink)]">{word.en}</p>

        {ex && (
          <figure className="mt-6 rounded-2xl bg-[var(--ground)] p-5">
            <figcaption className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--ink-faint)]">{t("In a sentence", "ក្នុងប្រយោគ")}</figcaption>
            <p lang="km" className="font-khmer mt-3 text-lg leading-[1.9] text-[var(--ink)]">{ex.km}</p>
            <p className="mt-2 text-sm italic leading-relaxed text-[var(--ink-dim)]">{ex.roman}</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]">“{ex.en}”</p>
          </figure>
        )}

        <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {word.tag && (
            <div className="flex gap-2">
              <dt className="text-[var(--ink-faint)]">{t("Source tag (as listed)", "ស្លាកប្រភព (តាមបញ្ជី)")}</dt>
              <dd className="font-mono text-[var(--ink)]">{word.tag}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="text-[var(--ink-faint)]">{t("Entry", "លេខរៀង")}</dt>
            <dd className="tabular-nums text-[var(--ink)]">{word.no}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-2 border-t border-[var(--ground-line)] pt-6">
          <button type="button" onClick={onCopy} className={action}>
            <Copy size={15} aria-hidden /> {t("Copy", "ចម្លង")}
          </button>
          <button type="button" onClick={onCopyLink} className={action}>
            <Link2 size={15} aria-hidden /> {t("Copy link", "ចម្លងតំណ")}
          </button>
          <button type="button" onClick={onSave} disabled={saving} className={action}>
            <ImageDown size={15} aria-hidden /> {saving ? t("Making image…", "កំពុងបង្កើតរូបភាព…") : t("Save image with QR code", "រក្សាទុករូបភាពជាមួយកូដ QR")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
