"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft, Star, Waypoints, LayoutGrid, ArrowUpDown, Layers } from "lucide-react";
import { CollectionsPicker } from "@/components/CollectionsPicker";
import { CollectionsSection } from "@/components/CollectionsSection";
import { CommandPalette } from "@/components/CommandPalette";
import { HeaderInfo } from "@/components/HeaderInfo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ObsidianGraph } from "@/components/ObsidianGraph";
import { TOOLS, CATEGORY_META, CATEGORY_ORDER, Category } from "@/lib/tools";
import { toolHref } from "@/lib/toolRoutes";
import { useLocalStorage, STORAGE_KEYS, type ToolCollection } from "@/lib/storage";

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
  const { text: t } = useLanguage();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activeId, setActiveIdRaw] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [graphFocusCategory, setGraphFocusCategory] = useState<Category | null>(null);
  const { value: viewMode, setValue: setViewMode } = useLocalStorage<"grid" | "graph">(
    STORAGE_KEYS.viewMode,
    "grid"
  );
  const badgeRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const [restored, setRestored] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const scrollRestoreRef = useRef<number | null>(null);
  const lastGridScrollRef = useRef(0);

  const { value: favorites, setValue: setFavorites } = useLocalStorage<string[]>(STORAGE_KEYS.favorites, []);
  const { value: recents, setValue: setRecents } = useLocalStorage<string[]>(STORAGE_KEYS.recents, []);
  const { value: collections, setValue: setCollections } = useLocalStorage<ToolCollection[]>(STORAGE_KEYS.collections, []);
  const { value: viewpoint, setValue: setViewpoint, hydrated } = useLocalStorage<Viewpoint>(STORAGE_KEYS.viewpoint, {
    activeId: null,
    scrollY: 0,
  });

  // Keep a ref mirror of the last known grid scroll position so the restore
  // effect below can read it without re-running on every scroll tick.
  useEffect(() => {
    lastGridScrollRef.current = viewpoint.scrollY;
  }, [viewpoint.scrollY]);

  // Restore only the home-grid scroll position. Open tools now have canonical
  // URLs, so an old persisted activeId must not redirect users away from `/`.
  useEffect(() => {
    if (!hydrated || restored) return;
    if (viewpoint.scrollY) scrollRestoreRef.current = viewpoint.scrollY;
    // Intentional one-time hydration completion after localStorage is ready.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      const isEditing = target instanceof HTMLElement && (target.isContentEditable || Boolean(target.closest("input, textarea, select, [contenteditable='true']")));
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || isEditing || event.key.toLowerCase() !== "g") return;
      event.preventDefault();
      setGraphFocusCategory(null);
      setViewMode(viewMode === "grid" ? "graph" : "grid");
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setViewMode, viewMode]);

  // Smooth heartbeat via requestAnimationFrame (avoids CSS keyframe & jank)
  useEffect(() => {
    const badge = badgeRef.current;
    const dot = dotRef.current;
    if (!badge || !dot) return;
    const b: HTMLSpanElement = badge;
    const d: HTMLSpanElement = dot;
    let raf: number;
    const start = performance.now();
    function tick(now: number) {
      const t = ((now - start) / 1000) % 2.4 / 2.4;
      let scale: number, glow: number;
      if (t < 0.12) {
        const p = t / 0.12;
        scale = 1 + 0.2 * Math.sin(p * Math.PI);
        glow = Math.sin(p * Math.PI);
      } else if (t < 0.30) {
        const p = (t - 0.12) / 0.18;
        scale = 1 + 0.14 * Math.sin(p * Math.PI);
        glow = Math.sin(p * Math.PI) * 0.9;
      } else {
        scale = 1;
        glow = 0;
      }
      b.style.transform = `scale(${scale})`;
      b.style.boxShadow = `0 0 ${4 + glow * 24}px ${glow * 7}px rgba(201,162,75,${0.1 + glow * 0.5})`;
      const dotPulse = 0.15 + 0.85 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
      d.style.opacity = String(dotPulse);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const setActiveId = useCallback(
    (id: string | null) => {
      if (!id) {
        setActiveIdRaw(null);
        setViewpoint((v) => ({ ...v, activeId: null }));
        return;
      }
      setViewpoint((v) => ({ ...v, activeId: id }));
      setRecents((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 8));
      router.push(toolHref(id));
    },
    [router, setViewpoint, setRecents]
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
        (t) => t.category === cat && (q === "" || t.title.toLowerCase().includes(q) || t.khmerTitle?.toLowerCase().includes(q) || t.keywords.some((k) => k.includes(q)))
      );
      if (list.length) map.set(cat, list);
    }
    return map;
  }, [filter]);

  const favoriteTools = useMemo(() => favorites.map((id) => TOOLS.find((t) => t.id === id)).filter(Boolean) as typeof TOOLS, [favorites]);
  const recentTools = useMemo(() => recents.map((id) => TOOLS.find((t) => t.id === id)).filter(Boolean) as typeof TOOLS, [recents]);
  const dailyAddition = useMemo(() => {
    // Current Monday–Sunday week in Asia/Phnom_Penh (UTC+7).
    const ppNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Phnom_Penh" }));
    const dow = ppNow.getDay();
    const mon = new Date(ppNow);
    mon.setDate(ppNow.getDate() + (dow === 0 ? -6 : 1 - dow));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    };
    const monStr = fmt(mon), sunStr = fmt(sun);
    const tools = TOOLS.filter(
      (t): t is typeof t & { addedOn: string } =>
        typeof t.addedOn === "string" && t.addedOn >= monStr && t.addedOn <= sunStr
    ).sort((a, b) => {
      const day = b.addedOn.localeCompare(a.addedOn);
      if (day !== 0) return day;
      return TOOLS.indexOf(b) - TOOLS.indexOf(a);
    });
    return { date: `${monStr} – ${sunStr}`, tools };
  }, []);
  const [catSort, setCatSort] = useState<Record<string, "asc" | "desc" | "function">>({});
  const [catFilter, setCatFilter] = useState<Record<string, string>>({});
  const [catSearchOpen, setCatSearchOpen] = useState<Record<string, boolean>>({});
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
        <div className="mx-auto mb-8 flex max-w-6xl items-center justify-between">
          <button
            onClick={() => setActiveId(null)}
            className="flex items-center gap-1.5 text-sm text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
          >
            <ArrowLeft size={15} /> {t("All tools", "ឧបករណ៍ទាំងអស់")}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(active.id)}
              aria-label={isFav ? t("Remove from favorites", "ដកចេញពីចំណូលចិត្ត") : t("Add to favorites", "បន្ថែមទៅចំណូលចិត្ត")}
              className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${
                isFav
                  ? "border-[var(--gold)] text-[var(--gold)]"
                  : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-faint)] hover:text-[var(--ink)]"
              }`}
            >
              <Star size={14} fill={isFav ? "currentColor" : "none"} />
            </button>
            <CollectionsPicker
              toolId={active.id}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              collections={collections}
              setCollections={setCollections}
            />
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs text-[var(--ink-dim)] hover:border-[var(--gold-dim)]"
            >
              <Search size={13} /> {t("Find a tool…", "ស្វែងរកឧបករណ៍…")}
              <kbd className="ml-1 rounded border border-[var(--ground-line)] px-1 text-[10px]">⌘K</kbd>
            </button>
            <LanguageToggle />
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
        <div className="home-nav-inner mx-auto flex max-w-[77rem] items-center gap-3 px-5 py-3 sm:px-10">
          <span className="home-brand shrink-0 font-display text-sm font-semibold text-[var(--gold)]">១២៣</span>

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
                    {t(CATEGORY_META[cat].label, CATEGORY_META[cat].khmer)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="home-nav-actions flex shrink-0 items-center gap-2">
            <button
              onClick={() => {
                setGraphFocusCategory(null);
                setViewMode(viewMode === "grid" ? "graph" : "grid");
              }}
              className="home-view-toggle flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--ink)]"
              title={`${viewMode === "grid" ? t("Switch to graph view", "ប្តូរទៅទិដ្ឋភាពក្រាហ្វ") : t("Switch to grid view", "ប្តូរទៅទិដ្ឋភាពក្រឡា")} (G)`}
            >
              {viewMode === "grid" ? <Waypoints size={13} /> : <LayoutGrid size={13} />}
              <span className="home-view-label">
                {viewMode === "grid" ? t("Graph", "ក្រាហ្វ") : t("Grid", "ក្រឡា")}
              </span>
            </button>
            <HeaderInfo />
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {viewMode === "graph" && (
        <div className="relative mx-auto mt-4 h-[calc(100dvh-5rem)] min-h-[28rem] max-w-[77rem] px-5 sm:px-10">
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
      <div className="home-hero relative mx-auto mt-14 max-w-3xl px-5 text-center sm:px-10">
        <div className="mb-5 flex items-center justify-center gap-2 text-xs tracking-[0.1em] text-[var(--ink-faint)]">
          <span>{t("one workbench", "កន្លែងធ្វើការតែមួយ")}</span>
          <span className="text-[var(--gold)]">·</span>
          <span>{t("one toolbox", "ប្រអប់ឧបករណ៍តែមួយ")}</span>
          <span className="text-[var(--gold)]">·</span>
          <span>{t(`${TOTAL} tools`, `ឧបករណ៍ ${toKh(TOTAL)} មុខ`)}</span>
          <span className="text-[var(--gold-dim)]">·</span>
          <span
            ref={badgeRef}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--gold)] px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--gold)]"
          >
            <span ref={dotRef} className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
            {t("adding more tools everyday", "បន្ថែមឧបករណ៍រាល់ថ្ងៃ")}
          </span>
        </div>
        <h1 className="font-display text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
          {t("one workbench", "កន្លែងធ្វើការតែមួយ")}
          <br /> {t("one toolbox", "ប្រអប់ឧបករណ៍តែមួយ")}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[var(--ink-dim)]">
          {t("Office, development, text, math, Khmer language, geospatial, network, security, design, and time utilities — all searchable in one place.", "ឧបករណ៍សម្រាប់ការិយាល័យ អ្នកអភិវឌ្ឍន៍ អត្ថបទ គណិតវិទ្យា ភាសាខ្មែរ ភូមិសាស្ត្រ បណ្តាញ សុវត្ថិភាព ការរចនា និងពេលវេលា — ស្វែងរក និងប្រើប្រាស់បានយ៉ាងងាយស្រួល។")}
        </p>
        <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-[var(--ink-faint)]">
          {t(`Merge and compress PDFs, remove image backgrounds, convert Khmer digits, generate QR codes, and ${TOTAL - 4} more — free in your browser.`, `បញ្ចូល និងបង្រួម PDF លុបផ្ទៃខាងក្រោយរូបភាព បម្លែងលេខខ្មែរ បង្កើតកូដ QR និងឧបករណ៍ ${toKh(TOTAL - 4)} មុខទៀត — ឥតគិតថ្លៃ និងដំណើរការក្នុងកម្មវិធីរុករករបស់អ្នក។`)}
        </p>

        <div className="mx-auto mt-10 flex w-full max-w-md items-center gap-2 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3 text-left text-sm text-[var(--ink-faint)] transition focus-within:border-[var(--gold-dim)]">
          <Search size={16} />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t(`Filter ${TOTAL} tools…`, `ស្វែងរកក្នុងចំណោមឧបករណ៍ ${toKh(TOTAL)} មុខ…`)}
            className="w-full bg-transparent text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
          />
          <span title={t("Press / to search", "ចុច / ដើម្បីស្វែងរក")} className="flex shrink-0 items-center rounded border border-[var(--ground-line)] px-1.5 py-0.5 font-mono-ui text-[10px]">
            /
          </span>
        </div>
      </div>

      {filter === "" && dailyAddition.date && dailyAddition.tools.length > 0 && (
        <div className="recently-added relative mx-auto mt-12 max-w-[77rem] px-5 sm:px-10">
          <div className="mb-3 flex flex-wrap items-baseline gap-2 border-b border-[var(--ground-line)] pb-2">
            <h2 className="font-display text-sm font-medium text-[var(--ink)]">
              {t("Added this week", "បានបន្ថែមសប្តាហ៍នេះ")}
            </h2>
            <span className="text-xs text-[var(--ink-faint)]">
              {t(
                `${dailyAddition.tools.length} tools (${dailyAddition.date})`,
                `ឧបករណ៍ ${toKh(dailyAddition.tools.length)} មុខ (${dailyAddition.date})`
              )}
            </span>
          </div>
          <ToolGrid
            tools={dailyAddition.tools}
            onSelect={setActiveId}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            showNewBadge
          />
        </div>
      )}

      {isColdStart && filter === "" && (
        <div className="relative mx-auto mt-12 max-w-[77rem] px-5 sm:px-10">
          <div className="mb-3 flex items-baseline gap-2 border-b border-[var(--ground-line)] pb-2">
            <h2 className="font-display text-sm font-medium text-[var(--ink)]">{t("Start here", "ចាប់ផ្តើមនៅទីនេះ")}</h2>
            <span className="text-xs text-[var(--ink-faint)]">{t("a few useful tools to try", "ឧបករណ៍ណែនាំសម្រាប់សាកល្បង")}</span>
          </div>
          <div className="tool-list-scroll">
            <ToolGrid tools={starterTools} onSelect={setActiveId} favorites={favorites} onToggleFavorite={toggleFavorite} />
          </div>
        </div>
      )}

      {favoriteTools.length > 0 && filter === "" && (
        <div className="relative mx-auto mt-12 max-w-[77rem] px-5 sm:px-10">
          <div className="mb-3 flex items-baseline gap-2 border-b border-[var(--ground-line)] pb-2">
            <Star size={13} className="text-[var(--gold)]" fill="currentColor" />
            <h2 className="font-display text-sm font-medium text-[var(--ink)]">{t("Favorites", "ចំណូលចិត្ត")}</h2>
          </div>
          <div className="tool-list-scroll">
            <ToolGrid tools={favoriteTools} onSelect={setActiveId} favorites={favorites} onToggleFavorite={toggleFavorite} />
          </div>
        </div>
      )}

      {collections.length > 0 && filter === "" && (
        <CollectionsSection
          collections={collections}
          setCollections={setCollections}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onSelect={setActiveId}
        />
      )}

      {recentTools.length > 0 && filter === "" && (
        <div className="relative mx-auto mt-10 max-w-[77rem] px-5 sm:px-10">
          <div className="mb-3 flex items-baseline gap-2 border-b border-[var(--ground-line)] pb-2">
            <h2 className="font-display text-sm font-medium text-[var(--ink)]">{t("Recently used", "បានប្រើថ្មីៗ")}</h2>
          </div>
          <div className="tool-list-scroll">
            <ToolGrid tools={recentTools} onSelect={setActiveId} favorites={favorites} onToggleFavorite={toggleFavorite} />
          </div>
        </div>
      )}

      <div className="relative mx-auto mt-12 max-w-[77rem] px-5 sm:px-10">
        {CATEGORY_ORDER.map((cat) => {
          const tools = filteredByCategory.get(cat);
          if (!tools) return null;
          const meta = CATEGORY_META[cat];
          const sortMode = catSort[cat] || "function";
          const query = catFilter[cat] || "";
          const filtered = tools.filter(
            (t) => query === "" || t.title.toLowerCase().includes(query) || t.khmerTitle?.toLowerCase().includes(query)
          );
          const sorted =
            sortMode === "function"
              ? filtered
              : [...filtered].sort((a, b) => {
                  const ta = a.khmerTitle ?? a.title;
                  const tb = b.khmerTitle ?? b.title;
                  return sortMode === "asc" ? ta.localeCompare(tb) : tb.localeCompare(ta);
                });
          return (
            <div key={cat} id={`cat-${cat}`} className="mb-10 scroll-mt-20">
              <div className="mb-3 flex items-baseline gap-3 border-b border-[var(--ground-line)] pb-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                <h2 className="font-display text-sm font-medium text-[var(--ink)]">{t(meta.label, meta.khmer)}</h2>
                {catSearchOpen[cat] && (
                  <input
                    value={query}
                    onChange={(e) => setCatFilter((p) => ({ ...p, [cat]: e.target.value }))}
                    placeholder={t("Filter…", "តម្រង…")}
                    className="h-6 w-32 rounded border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2 text-[11px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
                  />
                )}
                <button
                  onClick={() => setCatSearchOpen((p) => ({ ...p, [cat]: !p[cat] }))}
                  className="ml-auto flex items-center gap-1 rounded p-1 text-[var(--ink-faint)] transition hover:text-[var(--ink)]"
                  title={t("Search in category", "ស្វែងរកក្នុងប្រភេទ")}
                >
                  <Search size={12} />
                </button>
                <button
                  onClick={() =>
                    setCatSort((p) => ({
                      ...p,
                      [cat]: sortMode === "asc" ? "desc" : sortMode === "desc" ? "function" : "asc",
                    }))
                  }
                  className="flex items-center gap-1 rounded p-1 text-[var(--ink-faint)] transition hover:text-[var(--ink)]"
                  title={
                    sortMode === "asc"
                      ? t("A–Z", "ក–អ")
                      : sortMode === "desc"
                        ? t("Z–A", "អ–ក")
                        : t("By function", "តាមមុខងារ")
                  }
                >
                  {sortMode === "function" ? <Layers size={12} /> : <ArrowUpDown size={12} />}
                  <span className="text-[10px] font-semibold">
                    {sortMode === "asc" ? "A–Z" : sortMode === "desc" ? "Z–A" : t("Fn", "មុខងារ")}
                  </span>
                </button>
                <span className="text-xs text-[var(--ink-faint)]">
                  {t(`${filtered.length} tools`, `${toKh(filtered.length)} ឧបករណ៍`)}
                </span>
              </div>
              <div className="tool-list-scroll">
                <ToolGrid tools={sorted} onSelect={setActiveId} favorites={favorites} onToggleFavorite={toggleFavorite} />
              </div>
            </div>
          );
        })}
        {filteredByCategory.size === 0 && (
          <p className="py-16 text-center text-sm text-[var(--ink-faint)]">{t(`No tool matches “${filter}”.`, `រកមិនឃើញឧបករណ៍ដែលត្រូវនឹង “${filter}” ទេ។`)}</p>
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
  showNewBadge = false,
}: {
  tools: typeof TOOLS;
  onSelect: (id: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  showNewBadge?: boolean;
}) {
  const { text: t } = useLanguage();
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => {
        const isFav = favorites.includes(tool.id);
        return (
          <div
            key={tool.id}
            className="tool-card group flex items-center gap-1 rounded-md border border-transparent pr-1 text-left text-sm text-[var(--ink-dim)] transition hover:border-[var(--ground-line)] hover:bg-[var(--ground-raised)] hover:text-[var(--ink)]"
          >
            <button onClick={() => onSelect(tool.id)} className="flex flex-1 items-center gap-2 px-3 py-2 text-left">
              <span>{t(tool.title, tool.khmerTitle ?? tool.title)}</span>
              {showNewBadge && (
                <span className="new-tool-badge shrink-0 rounded border border-[var(--gold-dim)] px-1 py-0.5 text-[9px] font-semibold leading-none text-[var(--gold)]">
                  {t("NEW", "ថ្មី")}
                </span>
              )}
            </button>
            <button
              onClick={() => onToggleFavorite(tool.id)}
              aria-label={isFav ? t("Remove from favorites", "ដកចេញពីចំណូលចិត្ត") : t("Add to favorites", "បន្ថែមទៅចំណូលចិត្ត")}
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
