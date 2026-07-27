"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, ArrowLeft, Command as CommandIcon, Star, Waypoints, LayoutGrid } from "lucide-react";
import { CommandPalette } from "@/components/CommandPalette";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ObsidianGraph } from "@/components/ObsidianGraph";
import { TOOLS, CATEGORY_META, CATEGORY_ORDER, Category } from "@/lib/tools";
import { useLocalStorage, STORAGE_KEYS } from "@/lib/storage";

const KH_DIGITS = "០១២៣៤៥៦៧៨៩";
const toKh = (n: number) => String(n).split("").map((d) => KH_DIGITS[Number(d)]).join("");
const TOTAL = TOOLS.length;

// A small, hand-picked set of broadly useful tools shown to first-time visitors
// who have no favorites or recents yet — gives an immediate sense of what the
// workbench can do instead of a cold wall of 13 categories.
const STARTER_TOOL_IDS = [
  "pdf-merge",
  "background-remover",
  "digit-converter",
  "qr-generator",
  "image-optimizer",
  "file-compressor",
];

interface Viewpoint {
  activeId: string | null;
  scrollY: number;
}

export default function Home() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activeId, setActiveIdRaw] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [graphFocusCategory, setGraphFocusCategory] = useState<Category | null>(null);
  const { value: viewMode, setValue: setViewMode } = useLocalStorage<"grid" | "graph">(
    STORAGE_KEYS.viewMode,
    "grid"
  );
  const [restored, setRestored] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const scrollRestoreRef = useRef<number | null>(null);
  const lastGridScrollRef = useRef(0);

  const { value: favorites, setValue: setFavorites } = useLocalStorage<string[]>(STORAGE_KEYS.favorites, []);
  const { value: recents, setValue: setRecents } = useLocalStorage<string[]>(STORAGE_KEYS.recents, []);
  const { value: viewpoint, setValue: setViewpoint, hydrated } = useLocalStorage<Viewpoint>(STORAGE_KEYS.viewpoint, {
    activeId: null,
    scrollY: 0,
  });

  // Keep a ref mirror of the last known grid scroll position so the restore
  // effect below can read it without re-running on every scroll tick.
  useEffect(() => {
    lastGridScrollRef.current = viewpoint.scrollY;
  }, [viewpoint.scrollY]);

  // Restore last view (active tool + scroll position) once, after hydration
  // from localStorage — this covers a full page reload / new tab.
  useEffect(() => {
    if (!hydrated || restored) return;
    if (viewpoint.activeId) {
      // Intentional one-time restore of the saved viewpoint after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveIdRaw(viewpoint.activeId);
    } else if (viewpoint.scrollY) {
      scrollRestoreRef.current = viewpoint.scrollY;
    }
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, restored]);

  // Restore the saved scroll position every time we land back on the grid —
  // both the initial-load case above and every subsequent "back to all
  // instruments" click while the tab stays open.
  useEffect(() => {
    if (!restored || activeId !== null) return;
    const y = scrollRestoreRef.current ?? lastGridScrollRef.current;
    scrollRestoreRef.current = null;
    if (y) requestAnimationFrame(() => window.scrollTo({ top: y }));
  }, [restored, activeId]);

  // Persist scroll position on the home (grid) view for "viewpoint" save.
  useEffect(() => {
    if (activeId !== null) return;
    let frame = 0;
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setViewpoint((v) => ({ ...v, scrollY: window.scrollY }));
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Toggle a "frozen" shadow on the sticky header once the page has scrolled past it.
  useEffect(() => {
    if (activeId !== null) return;
    function onScroll() {
      setNavScrolled(window.scrollY > 4);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [activeId]);

  const setActiveId = useCallback(
    (id: string | null) => {
      setActiveIdRaw(id);
      setViewpoint((v) => ({ ...v, activeId: id }));
      if (id) {
        setRecents((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 8));
        window.scrollTo({ top: 0 });
      }
    },
    [setViewpoint, setRecents]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]));
    },
    [setFavorites]
  );

  const active = useMemo(() => TOOLS.find((t) => t.id === activeId) ?? null, [activeId]);

  const filteredByCategory = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const map = new Map<Category, typeof TOOLS>();
    for (const cat of CATEGORY_ORDER) {
      const list = TOOLS.filter(
        (t) => t.category === cat && (q === "" || t.title.toLowerCase().includes(q) || t.keywords.some((k) => k.includes(q)))
      );
      if (list.length) map.set(cat, list);
    }
    return map;
  }, [filter]);

  const favoriteTools = useMemo(() => favorites.map((id) => TOOLS.find((t) => t.id === id)).filter(Boolean) as typeof TOOLS, [favorites]);
  const recentTools = useMemo(() => recents.map((id) => TOOLS.find((t) => t.id === id)).filter(Boolean) as typeof TOOLS, [recents]);
  const starterTools = useMemo(
    () => STARTER_TOOL_IDS.map((id) => TOOLS.find((t) => t.id === id)).filter(Boolean) as typeof TOOLS,
    []
  );
  const isColdStart = favoriteTools.length === 0 && recentTools.length === 0;

  function scrollToCategory(cat: Category) {
    document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleCategoryChipClick(cat: Category) {
    if (viewMode === "graph") {
      setGraphFocusCategory((prev) => (prev === cat ? null : cat));
    } else {
      scrollToCategory(cat);
    }
  }

  if (active) {
    const ActiveComponent = active.Component;
    const isFav = favorites.includes(active.id);
    return (
      <main className="min-h-screen px-5 py-10 sm:px-10">
        <div className="mx-auto mb-8 flex max-w-3xl items-center justify-between">
          <button
            onClick={() => setActiveId(null)}
            className="flex items-center gap-1.5 text-sm text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
          >
            <ArrowLeft size={15} /> All instruments
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(active.id)}
              aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
              className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${
                isFav
                  ? "border-[var(--gold)] text-[var(--gold)]"
                  : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-faint)] hover:text-[var(--ink)]"
              }`}
            >
              <Star size={14} fill={isFav ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs text-[var(--ink-dim)] hover:border-[var(--gold-dim)]"
            >
              <Search size={13} /> Jump to…
              <kbd className="ml-1 rounded border border-[var(--ground-line)] px-1 text-[10px]">⌘K</kbd>
            </button>
            <ThemeToggle />
          </div>
        </div>
        <div key={active.id} className="fade-rise">
          <ActiveComponent />
        </div>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onSelect={setActiveId} />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen pb-16">
      <div className="grid-veil pointer-events-none absolute inset-0 top-0" />

      <div className="sticky-nav relative" data-scrolled={navScrolled}>
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-3 sm:px-10">
          <span className="shrink-0 font-display text-sm font-semibold text-[var(--gold)]">១២៣</span>

          <div className="category-ticker min-w-0 flex-1">
            <div className="category-ticker-track">
              {[...CATEGORY_ORDER, ...CATEGORY_ORDER].map((cat, i) => {
                const active = viewMode === "graph" && graphFocusCategory === cat;
                const isClone = i >= CATEGORY_ORDER.length;
                return (
                  <button
                    key={`${cat}-${i}`}
                    onClick={() => handleCategoryChipClick(cat)}
                    className="chip shrink-0"
                    aria-hidden={isClone || undefined}
                    tabIndex={isClone ? -1 : undefined}
                    style={
                      active
                        ? { borderColor: CATEGORY_META[cat].color, background: "var(--ground-raised-hi)", color: "var(--ink)" }
                        : { borderColor: "var(--ground-line)" }
                    }
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: CATEGORY_META[cat].color }} />
                    {CATEGORY_META[cat].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => {
                setGraphFocusCategory(null);
                setViewMode(viewMode === "grid" ? "graph" : "grid");
              }}
              className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--ink)]"
              title={viewMode === "grid" ? "Switch to graph view" : "Switch to grid view"}
            >
              {viewMode === "grid" ? <Waypoints size={13} /> : <LayoutGrid size={13} />}
              {viewMode === "grid" ? "Graph" : "Grid"}
            </button>
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs text-[var(--ink-dim)] hover:border-[var(--gold-dim)]"
            >
              <Search size={13} /> Search
              <kbd className="ml-1 rounded border border-[var(--ground-line)] px-1 text-[10px]">⌘K</kbd>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {viewMode === "graph" && (
        <div className="relative mx-auto mt-4 h-[80vh] max-w-6xl px-5 sm:px-10">
          <ObsidianGraph
            onOpenTool={setActiveId}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onClose={() => setViewMode("grid")}
            focusCategory={graphFocusCategory}
            onClearFocusCategory={() => setGraphFocusCategory(null)}
          />
        </div>
      )}

      {viewMode === "grid" && (
      <>
      <div className="relative mx-auto mt-14 max-w-3xl px-5 text-center sm:px-10">
        <div className="mb-5 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--ink-faint)]">
          <span>one workbench</span>
          <span className="text-[var(--gold)]">·</span>
          <span className="font-khmer normal-case tracking-normal">១២៣ ឧបករណ៍</span>
        </div>
        <h1 className="font-display text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
          {toKh(TOTAL)} instruments,
          <br /> one command.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[var(--ink-dim)]">
          Development, text, math, Khmer language, geospatial, network, security, design, and time
          utilities — held in a single workbench, reached by search instead of navigation.
        </p>
        <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-[var(--ink-faint)]">
          Merge &amp; compress PDFs, remove image backgrounds, convert Khmer digits, generate QR
          codes, and {toKh(TOTAL - 4)} more — all free, all in your browser.
        </p>

        <div className="mx-auto mt-10 flex w-full max-w-md items-center gap-2 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3 text-left text-sm text-[var(--ink-faint)] transition focus-within:border-[var(--gold-dim)]">
          <Search size={16} />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={`Filter ${TOTAL} instruments…`}
            className="w-full bg-transparent text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
          />
          <span className="flex shrink-0 items-center gap-1 rounded border border-[var(--ground-line)] px-1.5 py-0.5 text-[10px]">
            <CommandIcon size={10} />K
          </span>
        </div>
      </div>

      {isColdStart && filter === "" && (
        <div className="relative mx-auto mt-12 max-w-5xl px-5 sm:px-10">
          <div className="mb-3 flex items-baseline gap-2 border-b border-[var(--ground-line)] pb-2">
            <h2 className="font-display text-sm font-medium uppercase tracking-wide text-[var(--ink)]">Start here</h2>
            <span className="text-xs text-[var(--ink-faint)]">a few favorites to try first</span>
          </div>
          <div className="tool-list-scroll">
            <ToolGrid tools={starterTools} onSelect={setActiveId} favorites={favorites} onToggleFavorite={toggleFavorite} />
          </div>
        </div>
      )}

      {favoriteTools.length > 0 && filter === "" && (
        <div className="relative mx-auto mt-12 max-w-5xl px-5 sm:px-10">
          <div className="mb-3 flex items-baseline gap-2 border-b border-[var(--ground-line)] pb-2">
            <Star size={13} className="text-[var(--gold)]" fill="currentColor" />
            <h2 className="font-display text-sm font-medium uppercase tracking-wide text-[var(--ink)]">Favorites</h2>
          </div>
          <div className="tool-list-scroll">
            <ToolGrid tools={favoriteTools} onSelect={setActiveId} favorites={favorites} onToggleFavorite={toggleFavorite} />
          </div>
        </div>
      )}

      {recentTools.length > 0 && filter === "" && (
        <div className="relative mx-auto mt-10 max-w-5xl px-5 sm:px-10">
          <div className="mb-3 flex items-baseline gap-2 border-b border-[var(--ground-line)] pb-2">
            <h2 className="font-display text-sm font-medium uppercase tracking-wide text-[var(--ink)]">Recently used</h2>
          </div>
          <div className="tool-list-scroll">
            <ToolGrid tools={recentTools} onSelect={setActiveId} favorites={favorites} onToggleFavorite={toggleFavorite} />
          </div>
        </div>
      )}

      <div className="relative mx-auto mt-12 max-w-5xl px-5 sm:px-10">
        {CATEGORY_ORDER.map((cat) => {
          const tools = filteredByCategory.get(cat);
          if (!tools) return null;
          const meta = CATEGORY_META[cat];
          return (
            <div key={cat} id={`cat-${cat}`} className="mb-10 scroll-mt-20">
              <div className="mb-3 flex items-baseline gap-3 border-b border-[var(--ground-line)] pb-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                <h2 className="font-display text-sm font-medium uppercase tracking-wide text-[var(--ink)]">{meta.label}</h2>
                <span className="font-khmer text-sm text-[var(--ink-faint)]">{meta.khmer}</span>
                <span className="ml-auto font-mono-ui text-xs text-[var(--ink-faint)]">
                  {toKh(tools.length)} / {tools.length}
                </span>
              </div>
              <div className="tool-list-scroll">
                <ToolGrid tools={tools} onSelect={setActiveId} favorites={favorites} onToggleFavorite={toggleFavorite} />
              </div>
            </div>
          );
        })}
        {filteredByCategory.size === 0 && (
          <p className="py-16 text-center text-sm text-[var(--ink-faint)]">No instrument matches “{filter}”.</p>
        )}
      </div>
      </>
      )}

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onSelect={setActiveId} />
    </main>
  );
}

function ToolGrid({
  tools,
  onSelect,
  favorites,
  onToggleFavorite,
}: {
  tools: typeof TOOLS;
  onSelect: (id: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => {
        const isFav = favorites.includes(tool.id);
        return (
          <div
            key={tool.id}
            className="group flex items-center gap-1 rounded-md border border-transparent pr-1 text-left text-sm text-[var(--ink-dim)] transition hover:border-[var(--ground-line)] hover:bg-[var(--ground-raised)] hover:text-[var(--ink)]"
          >
            <button onClick={() => onSelect(tool.id)} className="flex-1 px-3 py-2 text-left">
              {tool.title}
            </button>
            <button
              onClick={() => onToggleFavorite(tool.id)}
              aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
              className={`shrink-0 rounded p-1 transition ${
                isFav ? "text-[var(--gold)] opacity-100" : "text-[var(--ink-faint)] opacity-0 group-hover:opacity-100"
              }`}
            >
              <Star size={13} fill={isFav ? "currentColor" : "none"} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
