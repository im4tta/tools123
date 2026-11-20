"use client";
// Glossaries hub: one search across every glossary (Proposal 1) and a reference-sheet page per term (Proposal 2).
// Search and grouping live in lib/glossary-hub.ts; source data and citations in lib/data/glossary-hub-data.ts.
// The open term is kept in the URL (?term=<slug>) so a term page can be shared, bookmarked or printed.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Copy, ExternalLink, Flag, ImageDown, Link2, Printer, Search, X } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { SpeakButton } from "@/components/ui/SpeakButton";
import { useLanguage } from "@/components/LanguageProvider";
import { useClipboard } from "@/components/ClipboardProvider";
import { buildGroups, neighbours, relatedGroups, searchGroups, type HubEntry, type HubGroup } from "@/lib/glossary-hub";
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
/** Terms found in more than one source where the Khmer differs: the hub's reason to exist, shown before any search. */
const DIFFERING = GROUPS.filter((g) => g.sources.length > 1 && g.distinctKm > 1);
const SHARED = GROUPS.filter((g) => g.sources.length > 1).length;
/** A stable, spread-out sample of differing terms for the start screen. */
const FEATURED = DIFFERING.filter((_, i) => i % Math.max(1, Math.floor(DIFFERING.length / 9)) === 0).slice(0, 9);

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

  const results = useMemo(() => searchGroups(GROUPS, query, filter || undefined), [query, filter]);

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
          <Hub query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} results={results} onOpen={show} />
        )}
      </div>

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

function Hub({
  query,
  setQuery,
  filter,
  setFilter,
  results,
  onOpen,
}: {
  query: string;
  setQuery: (q: string) => void;
  filter: string;
  setFilter: (s: string) => void;
  results: HubGroup[];
  onOpen: (g: HubGroup) => void;
}) {
  const { text: t } = useLanguage();
  const searching = query.trim().length > 0;
  const chip = (active: boolean) =>
    `inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors ${
      active ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--ground)]" : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:border-[var(--ground-line-strong)] hover:text-[var(--ink)]"
    }`;

  return (
    <div className="space-y-6">
      <label className="relative block">
        <span className="sr-only">{t("Search all glossaries", "ស្វែងរកក្នុងវចនានុក្រមទាំងអស់")}</span>
        <Search size={20} aria-hidden className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("Search in English, Khmer or French — try “watershed”", "ស្វែងរកជាអង់គ្លេស ខ្មែរ ឬបារាំង — ឧ. “watershed”")}
          className="h-14 w-full rounded-2xl [&::-webkit-search-cancel-button]:appearance-none border border-[var(--ground-line-strong)] bg-[var(--ground-raised)] pl-14 pr-12 text-base text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label={t("Clear search", "សម្អាតការស្វែងរក")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-[var(--ink-faint)] hover:text-[var(--ink)]">
            <X size={18} aria-hidden />
          </button>
        )}
      </label>

      <div role="group" aria-label={t("Sources", "ប្រភព")} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        <button type="button" aria-pressed={!filter} onClick={() => setFilter("")} className={chip(!filter)}>
          {t("All sources", "ប្រភពទាំងអស់")} <span className="tabular-nums opacity-70">{nf.format(HUB_ENTRIES.length)}</span>
        </button>
        {HUB_SOURCES.map((s) => (
          <button key={s.id} type="button" aria-pressed={filter === s.id} onClick={() => setFilter(filter === s.id ? "" : s.id)} className={chip(filter === s.id)}>
            <Dot color={s.color} />
            {t(s.name, s.nameKm)} · {s.publisher}
            <span className="tabular-nums opacity-70">{nf.format(HUB_SOURCE_COUNTS[s.id] ?? 0)}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-live="polite" aria-label={t("Results", "លទ្ធផល")}>
          {searching ? (
            results.length === 0 ? (
              <p className="py-10 text-center text-[var(--ink-dim)]">{t("No terms match that search.", "គ្មានពាក្យត្រូវនឹងការស្វែងរកនេះទេ។")}</p>
            ) : (
              <>
                <p className="mb-3 text-sm text-[var(--ink-faint)]">
                  {t(`${results.length}${results.length >= 60 ? "+" : ""} terms`, `ពាក្យចំនួន ${results.length}${results.length >= 60 ? "+" : ""}`)}
                </p>
                <ul className="space-y-3">
                  {results.map((g) => (
                    <li key={g.key}>
                      <ResultCard group={g} onOpen={onOpen} />
                    </li>
                  ))}
                </ul>
              </>
            )
          ) : (
            <div>
              <h2 className="font-display text-lg font-medium text-[var(--ink)]">{t("Where the sources differ", "កន្លែងដែលប្រភពខុសគ្នា")}</h2>
              <p className="mt-1 text-sm text-[var(--ink-dim)]">
                {t(
                  `${nf.format(SHARED)} terms appear in more than one glossary, and ${nf.format(DIFFERING.length)} of them use different Khmer. A few examples:`,
                  `ពាក្យចំនួន ${nf.format(SHARED)} មាននៅក្នុងវចនានុក្រមច្រើនជាងមួយ ហើយ ${nf.format(DIFFERING.length)} ក្នុងចំណោមនោះប្រើពាក្យខ្មែរខុសគ្នា។ ឧទាហរណ៍ខ្លះ៖`,
                )}
              </p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {FEATURED.map((g) => (
                  <li key={g.key}>
                    <button type="button" onClick={() => onOpen(g)} className="flex h-full w-full flex-col rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-left transition-colors hover:border-[var(--ground-line-strong)]">
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-display text-lg font-medium text-[var(--ink)]">{g.title}</span>
                        <span className="flex gap-1">{g.sources.map((s) => <Dot key={s} color={HUB_SOURCE_BY_ID.get(s)?.color ?? "#999"} />)}</span>
                      </span>
                      <span lang="km" className="font-khmer mt-2 line-clamp-2 text-[var(--ink-dim)]">{[...new Set(g.entries.map((e) => e.km))].join("  ·  ")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-faint)]">{t("Sources", "ប្រភព")}</h2>
            <ul className="mt-3 divide-y divide-[var(--ground-line)]">
              {HUB_SOURCES.map((s) => {
                const n = searching ? results.filter((g) => g.sources.includes(s.id)).length : HUB_SOURCE_COUNTS[s.id] ?? 0;
                return (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="flex min-w-0 items-center gap-2 text-[var(--ink)]">
                      <Dot color={s.color} />
                      <span className="truncate">{s.publisher} · {t(s.name, s.nameKm)}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-[var(--ink-faint)]">{nf.format(n)}</span>
                  </li>
                );
              })}
            </ul>
            {searching && <p className="mt-2 text-xs text-[var(--ink-faint)]">{t("Terms in these results, by source.", "ពាក្យក្នុងលទ្ធផលនេះ តាមប្រភព។")}</p>}
          </div>
          <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-faint)]">{t("Tip", "គន្លឹះ")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]">
              {t(
                "Ministries don't always agree on a Khmer term. Use the one from the ministry your document is for, and cite it.",
                "ក្រសួងនានាមិនតែងតែប្រើពាក្យខ្មែរដូចគ្នាទេ។ សូមប្រើពាក្យរបស់ក្រសួងដែលឯកសាររបស់អ្នកពាក់ព័ន្ធ ហើយដកស្រង់វា។",
              )}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SourceBadge({ group }: { group: HubGroup }) {
  const { text: t } = useLanguage();
  const many = group.sources.length > 1;
  const differ = group.distinctKm > 1;
  const cls = differ ? "bg-[var(--danger)]/12 text-[var(--danger)]" : many ? "bg-[var(--success)]/12 text-[var(--success)]" : "bg-[var(--ground)] text-[var(--ink-faint)]";
  const label = differ
    ? t(`${group.sources.length} sources · ${group.distinctKm} different Khmer terms`, `ប្រភព ${group.sources.length} · ពាក្យខ្មែរខុសគ្នា ${group.distinctKm}`)
    : many
      ? t(`${group.sources.length} sources agree`, `ប្រភព ${group.sources.length} ដូចគ្នា`)
      : t("1 source", "ប្រភព ១");
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

function ResultCard({ group, onOpen }: { group: HubGroup; onOpen: (g: HubGroup) => void }) {
  const { text: t } = useLanguage();
  const shown = group.entries.slice(0, 4);
  return (
    <button type="button" onClick={() => onOpen(group)} className="block w-full rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-left transition-colors hover:border-[var(--ground-line-strong)]">
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-display text-xl font-medium text-[var(--ink)]">{group.title}</span>
        <SourceBadge group={group} />
      </span>
      <span className="mt-3 block divide-y divide-[var(--ground-line)] border-t border-[var(--ground-line)]">
        {shown.map((e) => {
          const s = sourceOf(e);
          const def = e.defKm ?? e.defEn;
          return (
            <span key={`${e.source}:${e.id}`} className="grid gap-1 py-2.5 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-4">
              <span className="flex items-center gap-2 text-sm text-[var(--ink-dim)]">
                <Dot color={s.color} />
                {s.publisher}
                {e.no ? <span className="text-[var(--ink-faint)]">· No. {e.no}</span> : null}
              </span>
              <span className="min-w-0">
                <span lang="km" className="font-khmer block text-lg text-[var(--ink)]">{e.km}</span>
                {def && <span lang={e.defKm ? "km" : "en"} className={`mt-0.5 block line-clamp-1 text-sm text-[var(--ink-dim)] ${e.defKm ? "font-khmer" : ""}`}>{def}</span>}
              </span>
            </span>
          );
        })}
      </span>
      {group.entries.length > shown.length && (
        <span className="mt-2 block text-xs text-[var(--ink-faint)]">{t(`+${group.entries.length - shown.length} more entries`, `+${group.entries.length - shown.length} ទៀត`)}</span>
      )}
    </button>
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

  const action = "flex w-full items-center gap-2.5 rounded-xl border border-[var(--ground-line-strong)] bg-[var(--ground-raised)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--ground)] disabled:opacity-50";
  const label = "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-faint)]";

  return (
    <div className="overflow-hidden rounded-[24px] border border-[var(--ground-line)] bg-[var(--ground)] print:border-0">
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
            <button type="button" onClick={() => window.print()} className={action}>
              <Printer size={15} aria-hidden /> {t("Print this page", "បោះពុម្ពទំព័រនេះ")}
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
