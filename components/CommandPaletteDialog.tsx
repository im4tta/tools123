"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { ArrowRight, Calculator, Clock, Search, Star, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { routeIntent } from "@/lib/domain-router";
import { intentLabel, parseIntent } from "@/lib/intent-parser";
import { STORAGE_KEYS, storage } from "@/lib/storage";
import { CATEGORY_META, CATEGORY_ORDER, TOOLS, type ToolDef } from "@/lib/tools";

const KH_DIGITS = "០១២៣៤៥៦៧៨៩";
const toKh = (n: number | string) => String(n).replace(/\d/g, (d) => KH_DIGITS[Number(d)]);

type Scope = "all" | "tools" | "recent" | "favorites";
type Hit = { tool: ToolDef; score: number; keyword?: string };

/** How well a tool matches the query: title prefix > word prefix > title > Khmer title > keyword. */
function match(tool: ToolDef, q: string): Hit | null {
  if (!q) return { tool, score: 1 };
  const title = tool.title.toLowerCase();
  if (title.startsWith(q)) return { tool, score: 100 };
  if (title.split(/[\s/→-]+/).some((word) => word.startsWith(q))) return { tool, score: 80 };
  if (title.includes(q)) return { tool, score: 60 };
  if (tool.khmerTitle?.includes(q)) return { tool, score: 55 };
  const keyword = tool.keywords.find((k) => k.toLowerCase().includes(q));
  return keyword ? { tool, score: 30, keyword } : null;
}

function Highlight({ text, q }: { text: string; q: string }) {
  const at = q ? text.toLowerCase().indexOf(q) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent font-semibold text-[var(--gold-text)]">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}

/** Exact results for the two intents that need no outside data; everything else only routes. */
function inlineAnswer(values: Record<string, string | number>, domain: string): string | null {
  if (domain === "percentage") {
    const value = (Number(values.percent) * Number(values.amount)) / 100;
    return Number.isFinite(value) ? String(Math.round(value * 1e6) / 1e6) : null;
  }
  if (domain === "fraction" && Number(values.denominator) !== 0) {
    return String(Math.round((Number(values.numerator) / Number(values.denominator)) * 1e6) / 1e6);
  }
  return null;
}

/**
 * The palette UI (cmdk + the full tool registry), loaded on demand by CommandPalette the first time
 * it opens. Scope chips, Recent and Favorites first, Khmer titles, highlighted matches, a note when
 * only a keyword matched, and an inline answer for percentages and fractions.
 */
export default function CommandPaletteDialog({
  onOpenChange,
  onSelect,
}: {
  onOpenChange: (v: boolean) => void;
  onSelect: (id: string) => void;
}) {
  const { text: t, mode } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [recentIds] = useState(() => storage.get<string[]>(STORAGE_KEYS.recents, []));
  const [favoriteIds] = useState(() => storage.get<string[]>(STORAGE_KEYS.favorites, []));
  const q = query.trim().toLowerCase();
  // A native modal dialog: the page behind is inert, focus stays inside, Escape closes it.
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    // showModal() moves focus to the dialog's first focusable element; start in the search box.
    dialog?.querySelector<HTMLInputElement>("[cmdk-input]")?.focus();
    return () => dialog?.close();
  }, []);

  const byId = useMemo(() => new Map(TOOLS.map((tool) => [tool.id, tool])), []);
  const pick = (ids: string[]) => ids.flatMap((id) => { const tool = byId.get(id); const hit = tool && match(tool, q); return hit ? [hit] : []; });

  const groups = useMemo(() => {
    const recent = pick(recentIds).slice(0, scope === "recent" ? 50 : 5);
    const favorites = pick(favoriteIds).filter((h) => scope !== "all" || !recent.some((r) => r.tool.id === h.tool.id)).slice(0, scope === "favorites" ? 100 : 5);
    if (scope === "recent") return [{ key: "recent", title: t("Recent", "ថ្មីៗ"), hits: recent }];
    if (scope === "favorites") return [{ key: "favorites", title: t("Favorites", "ចំណូលចិត្ត"), hits: favorites }];
    const shown = new Set(scope === "all" ? [...recent, ...favorites].map((h) => h.tool.id) : []);
    const rest = TOOLS.flatMap((tool) => { const hit = shown.has(tool.id) ? null : match(tool, q); return hit ? [hit] : []; });
    const tools = q
      ? [{ key: "tools", title: t("Tools", "ឧបករណ៍"), hits: rest.sort((a, b) => b.score - a.score || a.tool.title.localeCompare(b.tool.title)) }]
      : CATEGORY_ORDER.map((cat) => ({ key: cat, title: t(CATEGORY_META[cat].label, CATEGORY_META[cat].khmer), hits: rest.filter((h) => h.tool.category === cat) }));
    return scope === "all"
      ? [{ key: "recent", title: t("Recent", "ថ្មីៗ"), hits: recent }, { key: "favorites", title: t("Favorites", "ចំណូលចិត្ត"), hits: favorites }, ...tools]
      : tools;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, scope, recentIds, favoriteIds, t]);

  const count = groups.reduce((n, g) => n + g.hits.length, 0);
  const intent = useMemo(() => parseIntent(query), [query]);
  const route = intent.toolId && intent.domain !== "tool" && intent.domain !== "khmer" ? routeIntent(intent, query) : null;
  const routeTool = route ? byId.get(route.toolId) : undefined;
  const answer = route ? inlineAnswer(intent.values, intent.domain) : null;

  const scopes: { id: Scope; en: string; km: string }[] = [
    { id: "all", en: "All", km: "ទាំងអស់" },
    { id: "tools", en: "Tools", km: "ឧបករណ៍" },
    { id: "recent", en: "Recent", km: "ថ្មីៗ" },
    { id: "favorites", en: "Favorites", km: "ចំណូលចិត្ត" },
  ];

  function titleOf(hit: Hit): ReactNode {
    const km = hit.tool.khmerTitle ?? hit.tool.title;
    if (mode === "km") return <span lang="km"><Highlight text={km} q={q} /></span>;
    if (mode === "en" || !hit.tool.khmerTitle) return <Highlight text={hit.tool.title} q={q} />;
    return (
      <>
        <Highlight text={hit.tool.title} q={q} />
        <span lang="km" className="text-[var(--ink-dim)]"> · <Highlight text={km} q={q} /></span>
      </>
    );
  }

  function choose(id: string) {
    onSelect(id);
    onOpenChange(false);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={t("Search tools", "ស្វែងរកឧបករណ៍")}
      onCancel={(e) => { e.preventDefault(); onOpenChange(false); }}
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
      className="command-palette-overlay m-0 h-full max-h-none w-full max-w-none bg-transparent p-4 pt-[10vh] backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="command-palette-panel mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] shadow-2xl">
        <Command shouldFilter={false} loop className="command-palette-root flex flex-col">
          <div data-focus-ring="within" className="palette-search flex items-center gap-3 border-b border-[var(--ground-line)] px-5 py-3.5">
            <Search size={18} className="shrink-0 text-[var(--ink-dim)]" aria-hidden />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              aria-label={t("Search tools", "ស្វែងរកឧបករណ៍")}
              placeholder={t(`Search ${TOOLS.length} tools or try 25% of 480…`, `ស្វែងរកឧបករណ៍ ${toKh(TOOLS.length)} មុខ ឬសាកល្បង 25% នៃ 480…`)}
              className="w-full bg-transparent text-base text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
            />
            <kbd className="hidden rounded border border-[var(--ground-line)] px-1.5 py-0.5 text-[11px] text-[var(--ink-dim)] sm:inline">Esc</kbd>
            <button type="button" onClick={() => onOpenChange(false)} aria-label={t("Close search", "បិទការស្វែងរក")} className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[var(--ink-dim)] sm:hidden">
              <X size={18} aria-hidden />
            </button>
          </div>

          <div role="group" aria-label={t("Search in", "ស្វែងរកក្នុង")} className="flex gap-2 overflow-x-auto border-b border-[var(--ground-line)] px-5 py-2.5">
            {scopes.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={scope === s.id}
                onClick={() => setScope(s.id)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition ${scope === s.id ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--ground)]" : "border-[var(--ground-line-strong)] text-[var(--ink-dim)] hover:text-[var(--ink)]"}`}
              >
                {t(s.en, s.km)}
              </button>
            ))}
          </div>

          <Command.List className="command-palette-list max-h-[56vh] overflow-y-auto p-2">
            {route && routeTool && (
              <Command.Group heading={t("Calculate", "គណនា")} className="palette-group">
                <Command.Item value={`intent:${route.href}`} onSelect={() => { router.push(route.href); onOpenChange(false); }} className="palette-item group">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--slate-accent)]/15 text-[var(--slate-accent)]"><Calculator size={16} aria-hidden /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono-ui text-sm text-[var(--ink)]">{answer !== null ? <>{query.trim()} = <strong>{answer}</strong></> : intentLabel(intent)}</span>
                    <span className="block truncate text-xs text-[var(--ink-dim)]">{t(`Open ${routeTool.title}`, `បើក ${routeTool.khmerTitle ?? routeTool.title}`)}</span>
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-[var(--ink-faint)]" aria-hidden />
                </Command.Item>
              </Command.Group>
            )}

            {count === 0 && (
              <p className="px-3 py-8 text-center text-sm text-[var(--ink-dim)]">
                {scope === "recent" && !q
                  ? t("Tools you open will appear here.", "ឧបករណ៍ដែលអ្នកបើកនឹងបង្ហាញនៅទីនេះ។")
                  : scope === "favorites" && !q
                    ? t("No favorites yet. Star a tool to keep it here.", "មិនទាន់មានចំណូលចិត្តនៅឡើយ។ ចុចផ្កាយលើឧបករណ៍ដើម្បីរក្សាទុកនៅទីនេះ។")
                    : t("No matching tool found.", "រកមិនឃើញឧបករណ៍ដែលត្រូវនឹងការស្វែងរកទេ។")}
              </p>
            )}

            {groups.filter((g) => g.hits.length > 0).map((group) => (
              <Command.Group key={group.key} heading={group.title} className="palette-group">
                {group.hits.map((hit) => {
                  const meta = CATEGORY_META[hit.tool.category];
                  return (
                    <Command.Item key={`${group.key}-${hit.tool.id}`} value={`${group.key}:${hit.tool.id}`} onSelect={() => choose(hit.tool.id)} className="palette-item group">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)` }} aria-hidden>
                        {group.key === "recent" ? <Clock size={15} className="text-[var(--ink-dim)]" /> : group.key === "favorites" ? <Star size={15} className="text-[var(--gold-text)]" /> : <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-[var(--ink)]">{titleOf(hit)}</span>
                        <span className="block truncate text-xs text-[var(--ink-dim)]">
                          {t(meta.label, meta.khmer)}
                          {hit.keyword ? <> · {t(`matches the keyword “${hit.keyword}”`, `ត្រូវនឹងពាក្យគន្លឹះ “${hit.keyword}”`)}</> : null}
                        </span>
                      </span>
                      <ArrowRight size={14} className="shrink-0 text-[var(--ink-faint)] opacity-0 group-data-[selected=true]:opacity-100" aria-hidden />
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ))}
          </Command.List>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--ground-line)] px-5 py-2.5 text-xs text-[var(--ink-dim)]">
            <span><kbd className="palette-kbd">↑</kbd> <kbd className="palette-kbd">↓</kbd> {t("Navigate", "ជ្រើសរើស")}</span>
            <span><kbd className="palette-kbd">↵</kbd> {t("Open", "បើក")}</span>
            <span><kbd className="palette-kbd">Esc</kbd> {t("Close", "បិទ")}</span>
            <span role="status" className="ml-auto">{t(`${count} ${count === 1 ? "result" : "results"}`, `លទ្ធផល ${toKh(count)}`)}</span>
          </div>
        </Command>
      </div>
    </dialog>
  );
}
