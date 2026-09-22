"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft, Star, Waypoints, LayoutGrid, ArrowUpDown, Layers, ShieldCheck, CircleDollarSign, WifiOff, Languages, BadgeCheck, FolderGit2 } from "lucide-react";
import { CollectionsPicker } from "@/components/CollectionsPicker";
import { CollectionsSection } from "@/components/CollectionsSection";
import { CommandPalette } from "@/components/CommandPalette";
import { HeaderInfo } from "@/components/HeaderInfo";
import { UniversalInput } from "@/components/UniversalInput";
import { HomeSpotlightCarousel } from "@/components/HomeSpotlightCarousel";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { parseIntent } from "@/lib/intent-parser";
import { DEFAULT_WORKSPACE_PROFILES, WORKSPACES, type WorkspaceProfile } from "@/lib/workspaces";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AccentThemePicker } from "@/components/AccentThemePicker";
import { useTheme } from "@/components/ThemeProvider";
import { ObsidianGraph } from "@/components/ObsidianGraph";
import { TOOLS, CATEGORY_META, CATEGORY_ORDER, Category } from "@/lib/tools";
import { toolHref } from "@/lib/toolRoutes";
import { toolWhatItDoes } from "@/lib/seo";
import { useLocalStorage, STORAGE_KEYS, type ToolCollection } from "@/lib/storage";
import { mostUsedToolIds } from "@/lib/export";

const KH_DIGITS = "០១២៣៤៥៦៧៨៩";
const toKh = (n: number) => String(n).split("").map((d) => KH_DIGITS[Number(d)]).join("");
const TOTAL = TOOLS.length;

// Address-aware search: a lazily-loaded index of Cambodia's administrative
// units (province → district → commune → village) so typing a place name or
// admin code can recommend the Administrative Hierarchy tool. Loaded on demand
// to keep the homepage bundle lean (the full dataset has ~16k entries).
type PlaceEntry = { en: string; kh: string; code: string };
let placeIndex: PlaceEntry[] | null = null;
let placeIndexPromise: Promise<PlaceEntry[]> | null = null;
function loadPlaceIndex(): Promise<PlaceEntry[]> {
  if (!placeIndexPromise) {
    placeIndexPromise = import("@/data/address_data.json").then((mod) => {
      const rows = (mod.default ?? mod) as {
        code: string;
        en: string;
        kh: string;
        districts: {
          code: string;
          en: string;
          kh: string;
          communes: { code: string; en: string; kh: string; villages: { code: string; en: string; kh: string }[] }[];
        }[];
      }[];
      const hits: PlaceEntry[] = [];
      for (const p of rows) {
        hits.push({ en: p.en, kh: p.kh, code: p.code });
        for (const d of p.districts) {
          hits.push({ en: d.en, kh: d.kh, code: d.code });
          for (const c of d.communes) {
            hits.push({ en: c.en, kh: c.kh, code: c.code });
            for (const v of c.villages) hits.push({ en: v.en, kh: v.kh, code: v.code });
          }
        }
      }
      placeIndex = hits;
      return hits;
    });
  }
  return placeIndexPromise;
}

// A lazily-loaded list of ~1,850 common Khmer words for the search's "did you
// mean…" autocomplete. Kept out of the initial bundle; loaded the first time a
// Khmer character is typed.
let khmerWords: string[] | null = null;
let khmerWordsPromise: Promise<string[]> | null = null;
function loadKhmerWords(): Promise<string[]> {
  if (!khmerWordsPromise) {
    khmerWordsPromise = import("@/data/khmer-words.json").then((mod) => {
      khmerWords = (mod.default ?? mod) as string[];
      return khmerWords;
    });
  }
  return khmerWordsPromise;
}

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

// Example queries shown as chips under the aurora search hero — each just
// pre-fills the search box so the fastest path to a tool stays one tap away.
// Pool of quick-search chips shown under the search box. A random handful is
// shown each visit (see HOME_CHIP_COUNT) so people keep discovering tools.
const HOME_CHIPS: { q: string; en: string; km: string }[] = [
  { q: "merge pdf", en: "Merge PDF", km: "បញ្ចូល PDF" },
  { q: "khmer digits", en: "Khmer digits", km: "លេខខ្មែរ" },
  { q: "khqr", en: "KHQR", km: "KHQR" },
  { q: "background", en: "Remove background", km: "លុបផ្ទៃខាងក្រោយ" },
  { q: "json", en: "Format JSON", km: "JSON" },
  { q: "postal code", en: "Postal code", km: "លេខប្រៃសណីយ៍" },
  { q: "qr code", en: "QR code", km: "កូដ QR" },
  { q: "word count", en: "Word count", km: "រាប់ពាក្យ" },
  { q: "compress", en: "Compress file", km: "បង្រួមឯកសារ" },
  { q: "color", en: "Color converter", km: "បម្លែងពណ៌" },
  { q: "resize image", en: "Resize image", km: "ប្តូរទំហំរូប" },
  { q: "riel", en: "Riel ↔ USD", km: "រៀល ↔ ដុល្លារ" },
  { q: "romanize", en: "Romanize Khmer", km: "សូរខ្មែរ" },
  { q: "timestamp", en: "Timestamp", km: "ត្រាពេលវេលា" },
  { q: "base64", en: "Base64", km: "Base64" },
  { q: "hash", en: "Hash", km: "Hash" },
  { q: "age", en: "Age calculator", km: "គណនាអាយុ" },
  { q: "distance", en: "Place distance", km: "ចម្ងាយទីកន្លែង" },
  { q: "sentence", en: "Analyze sentence", km: "វិភាគប្រយោគ" },
  { q: "loan", en: "True loan cost", km: "តម្លៃកម្ចីពិត" },
  { q: "lunar", en: "Khmer lunar date", km: "ថ្ងៃចន្ទគតិ" },
  { q: "summarize", en: "Summarize Khmer", km: "សង្ខេបខ្មែរ" },
];
const HOME_CHIP_COUNT = 6;

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Curated "Popular tools" for the Focus homepage design — the ones people reach
// for most, across a mix of categories. Missing IDs are skipped gracefully.
const POPULAR_IDS = [
  "pdf-merge", "khqr-decoder", "background-remover", "digit-converter",
  "image-optimizer", "qr-generator", "json-formatter", "postal-code-finder",
  "file-compressor", "base64", "word-counter", "color-converter",
  "hash", "jwt-decoder", "timestamp", "riel-usd",
  "qr-decoder", "cambodia-place-finder",
];

const WHY_FEATURES = [
  {
    icon: ShieldCheck,
    en: "Private by design",
    km: "ឯកជនភាពលំដាប់ខ្ពស់",
    descEn: "Files and text are processed locally on your device — nothing is uploaded to a server.",
    descKm: "ឯកសារ និងអត្ថបទត្រូវបានដំណើរការនៅលើឧបករណ៍របស់អ្នក — គ្មានអ្វីត្រូវបានផ្ទុកឡើងលើម៉ាស៊ីនមេទេ។",
  },
  {
    icon: CircleDollarSign,
    en: "Free, forever",
    km: "ឥតគិតថ្លៃ ជារៀងរហូត",
    descEn: "No accounts, no paywalls, no hidden costs — everything is free to use.",
    descKm: "មិនតម្រូវឱ្យចុះឈ្មោះ គ្មានជញ្ជាំងបង់ប្រាក់ គ្មានថ្លៃលាក់កំបាំង — ប្រើបានឥតគិតថ្លៃទាំងអស់។",
  },
  {
    icon: WifiOff,
    en: "Works offline",
    km: "ដំណើរការដោយគ្មានអ៊ីនធឺណិត",
    descEn: "No API calls or sign-in — most tools run even without a connection.",
    descKm: "មិនពឹងផ្អែកលើ API ឬការចូលប្រើ — ឧបករណ៍ភាគច្រើនដំណើរការបានទោះគ្មានបណ្តាញក៏ដោយ។",
  },
  {
    icon: Languages,
    en: "Khmer-first",
    km: "គិតគូរពីភាសាខ្មែរ",
    descEn: "A fully bilingual interface plus tools made for Khmer: digits, addresses, plates, lexicon.",
    descKm: "ចំណុចប្រទាក់ពីរភាសាពេញលេញ រួមជាមួយឧបករណ៍សម្រាប់ភាសាខ្មែរ៖ លេខ អាសយដ្ឋាន ស្លាកលេខ វចនានុក្រម។",
  },
  {
    icon: BadgeCheck,
    en: "Honest by default",
    km: "ស្មោះត្រង់ជានិច្ច",
    descEn: "Estimates, fallback data, and AI-assisted tools are always clearly labeled.",
    descKm: "តម្លៃប៉ាន់ស្មាន ទិន្នន័យជំនួស និងឧបករណ៍ដែលជំនួយដោយ AI ត្រូវបានដាក់ស្លាកយ៉ាងច្បាស់លាស់ជានិច្ច។",
  },
  {
    icon: FolderGit2,
    en: "Open source",
    km: "ប្រភពបើកចំហ",
    descEn: "The full code is public on GitHub, with verified local projects included.",
    descKm: "លេខកូដទាំងស្រុងជាសាធារណៈនៅលើ GitHub រួមទាំងគម្រោងក្នុងស្រុកដែលបានផ្ទៀងផ្ទាត់។",
  },
];

interface Viewpoint {
  activeId: string | null;
  scrollY: number;
}

export default function Home() {
  const { text: t } = useLanguage();
  const { homeDesign } = useTheme();
  // Aurora and Focus share the search-first hero; only Classic differs.
  const auroraHero = homeDesign !== "classic";
  const popularTools = useMemo(() => POPULAR_IDS.map((id) => TOOLS.find((tool) => tool.id === id)).filter(Boolean) as typeof TOOLS, []);
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activeId, setActiveIdRaw] = useState<string | null>(null);
  const [filter, setFilter] = useState(() => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("q") ?? "" : ""));
  const parsedFilter = useMemo(() => parseIntent(filter), [filter]);
  const isCalculationIntent = Boolean(filter.trim() && parsedFilter.toolId && parsedFilter.domain !== "tool" && parsedFilter.domain !== "khmer");
  const [placeIndexReady, setPlaceIndexReady] = useState(false);
  useEffect(() => {
    let alive = true;
    loadPlaceIndex()
      .then(() => {
        if (alive) setPlaceIndexReady(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Randomise the quick-search chips on each visit. Start from a stable slice so
  // server and client markup match, then shuffle once after hydration.
  const [chips, setChips] = useState(() => HOME_CHIPS.slice(0, HOME_CHIP_COUNT));
  useEffect(() => { setChips(shuffle(HOME_CHIPS).slice(0, HOME_CHIP_COUNT)); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  // Khmer word autocomplete: load the word list the first time a Khmer character
  // appears in the query, then offer "did you mean…" completions.
  const [khmerWordsReady, setKhmerWordsReady] = useState(false);
  const queryHasKhmer = /[ក-៿]/.test(filter);
  useEffect(() => {
    if (!queryHasKhmer || khmerWordsReady) return;
    let alive = true;
    loadKhmerWords().then(() => { if (alive) setKhmerWordsReady(true); }).catch(() => {});
    return () => { alive = false; };
  }, [queryHasKhmer, khmerWordsReady]);

  const wordSuggestions = useMemo(() => {
    const q = filter.trim();
    if (!queryHasKhmer || !khmerWordsReady || !khmerWords || [...q].length < 1) return [] as string[];
    const starts: string[] = [];
    const contains: string[] = [];
    for (const w of khmerWords) {
      if (w === q) continue;
      if (w.startsWith(q)) starts.push(w);
      else if (w.includes(q)) contains.push(w);
      if (starts.length >= 8) break;
    }
    return [...starts, ...contains].slice(0, 8);
  }, [filter, queryHasKhmer, khmerWordsReady]);
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
  const { value: workspaceId, setValue: setWorkspaceId } = useLocalStorage(STORAGE_KEYS.workspace, "all");
  const { value: workspaceProfiles } = useLocalStorage<WorkspaceProfile[]>("workspace-profiles", DEFAULT_WORKSPACE_PROFILES);
  const { value: viewpoint, setValue: setViewpoint, hydrated } = useLocalStorage<Viewpoint>(STORAGE_KEYS.viewpoint, {
    activeId: null,
    scrollY: 0,
  });

  const smartSuggestions = useMemo(() => {
    const value = filter.trim();
    if (!value) return [] as typeof TOOLS;
    if (isCalculationIntent) return [] as typeof TOOLS;
    const ids: string[] = [];
    const lower = value.toLowerCase();
    const push = (...toolIds: string[]) => ids.push(...toolIds);
    if (/^eyJ[a-z0-9_-]+\./i.test(value)) push("jwt-decoder", "base64");
    if (/^\s*[-\w]+\s*,\s*[-\w]+(?:\s*\n|$)/.test(value)) push("csv-json", "csv-to-markdown");
    if (/^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(value)) push("dms-converter", "geojson-formatter", "utm-converter");
    if (/\b(ភូមិ|ឃុំ|សង្កាត់|ស្រុក|ខណ្ឌ|ខេត្ត|ក្រុង|village|commune|district|province|address|street)\b/i.test(value)) push("address-formatter", "province-lookup", "postal-code-finder");
    // Typing a real place name or admin code (e.g. Siem Reap, សៀមរាប, 1702)
    // recommends the Administrative Hierarchy browser. Short queries must be
    // exact matches so generic 2-3 letter words don't trigger address hits.
    if (placeIndexReady && placeIndex) {
      const q = value.trim().toLowerCase();
      const isPlace =
        q.length >= 3
          ? placeIndex.some((p) => p.code.includes(q) || p.en.toLowerCase().includes(q) || p.kh.includes(q))
          : placeIndex.some((p) => p.code === q || p.en.toLowerCase() === q || p.kh === q);
      if (isPlace) push("administrative-hierarchy", "address-formatter", "province-lookup");
    }
    if (/\b(state|government|police|military|រដ្ឋ|ប៉ូលិស|យោធា)\b/i.test(value)) push("government-plate-parser", "government-plate-lookup", "vehicle-plate");
    if (/\b(bcg|hepb?|opv|ipv|dpt|hib|pcv|mr|measles|rubella|je|japanese encephalitis|vitamin\s*a|deworming|vaccine|vaccination|ថ្នាំបង្ការ|វីតាមីន)\b/i.test(value)) push("yellow-card-tracker");
    if (/(?:^|\s)(?:\+?855|0[1-9]\d{7,8})(?:\s|$)/.test(value)) push("phone-formatter", "phone-number-cleaner");
    if (/^\d{6}$/.test(value)) push("administrative-code-decoder", "postal-code-finder", "province-lookup");
    if (/\b(plate|license|number plate|ស្លាកលេខ)\b/i.test(value) || /\d{1,2}[A-Z]{1,3}[- ]?\d{3,5}/i.test(value)) push("government-plate-parser", "government-plate-lookup", "vehicle-plate", "khmer-numerology");
    // A Khmer word or phrase \u2014 surface the tools that help you look it up,
    // analyse it, correct it, or convert it.
    if (/[\u1780-\u17ff]/.test(value)) push("khmer-lexicon", "khmer-homophone-corrector", "khmer-sentence-analyzer", "romanization", "khmer-word-counter", "khmer-unicode-normalizer");
    try { JSON.parse(value); push("json-formatter", "json-to-typescript", "json-data-converter"); } catch { /* not JSON */ }
    if (/^\s*[{[]/.test(value) && /\}\s*$|\]\s*$/.test(value)) push("json-formatter", "jsonl-validator");

    // Every registered tool participates in ranked suggestions. This makes
    // Smart Input useful beyond the hand-written detectors above.
    const tokens = lower.split(/[^a-z0-9\u1780-\u17ff]+/).filter((token) => token.length >= 2);
    if (tokens.length) {
      TOOLS.map((tool) => {
        const fields = [tool.id, tool.title, tool.khmerTitle ?? "", ...tool.keywords].map((field) => field.toLowerCase());
        let score = 0;
        if (fields.some((field) => field === lower)) score += 20;
        if (fields.some((field) => field.includes(lower))) score += 10;
        for (const token of tokens) {
          if (fields.some((field) => field === token)) score += 8;
          else if (fields.some((field) => field.includes(token))) score += 2;
        }
        return { tool, score };
      })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score || a.tool.title.localeCompare(b.tool.title))
        .slice(0, 5)
        .forEach(({ tool }) => push(tool.id));
    }
    return [...new Set(ids)].map((id) => TOOLS.find((tool) => tool.id === id)).filter(Boolean) as typeof TOOLS;
  }, [filter, isCalculationIntent, placeIndexReady]);

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
    // A recognized calculation belongs to its routed calculator, not the
    // ordinary tool-name filter. Keep the catalog visible behind the action.
    const q = isCalculationIntent ? "" : filter.trim().toLowerCase();
    const map = new Map<Category, typeof TOOLS>();
    const workspace = WORKSPACES.find((item) => item.id === workspaceId);
    for (const cat of CATEGORY_ORDER) {
      const list = TOOLS.filter(
        (t) => t.category === cat
          && (!workspace || workspace.keywords.some((id) => id === t.id))
          && (q === "" || t.title.toLowerCase().includes(q) || t.khmerTitle?.toLowerCase().includes(q) || t.keywords.some((k) => k.includes(q)))
      );
      if (list.length) map.set(cat, list);
    }
    return map;
  }, [filter, isCalculationIntent, workspaceId]);

  const activeWorkspaceProfile = workspaceProfiles.find((profile) => profile.id === workspaceId);
  const favoriteIds = activeWorkspaceProfile?.favoriteToolIds ?? favorites;
  const recentIds = activeWorkspaceProfile?.recentCalculations ?? recents;
  const favoriteTools = useMemo(() => favoriteIds.map((id) => TOOLS.find((t) => t.id === id)).filter(Boolean) as typeof TOOLS, [favoriteIds]);
  const recentTools = useMemo(() => recentIds.map((id) => TOOLS.find((t) => t.id === id)).filter(Boolean) as typeof TOOLS, [recentIds]);
  const [mostUsedIds, setMostUsedIds] = useState<string[]>([]);
  const [mostUsedHydrated, setMostUsedHydrated] = useState(false);
  const refreshMostUsed = useCallback(() => setMostUsedIds(mostUsedToolIds(8)), []);
  // Hydrate the "Most used" list exactly once on the client after SSR, so the
  // server-rendered markup ([]) never mismatches the client (which reads
  // localStorage) — then re-sync whenever we return to the grid.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMostUsedHydrated(true);
    refreshMostUsed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (activeId === null && mostUsedHydrated) refreshMostUsed(); }, [activeId, mostUsedHydrated, refreshMostUsed]); // eslint-disable-line react-hooks/set-state-in-effect
  const mostUsedTools = useMemo(() => mostUsedIds.map((id) => TOOLS.find((t) => t.id === id)).filter(Boolean) as typeof TOOLS, [mostUsedIds]);
  const hasUsage = useMemo(() => mostUsedHydrated && mostUsedIds.length > 0, [mostUsedHydrated, mostUsedIds]);
  const localDevTools = useMemo(() => TOOLS.filter((tool) => tool.localProject), []);
  const dailyAddition = useMemo(() => {
    // Current Monday–Sunday week in Asia/Phnom_Penh (UTC+7).
    const ppNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Phnom_Penh" }));
    const dow = ppNow.getDay();
    const mon = new Date(ppNow);
    mon.setDate(ppNow.getDate() + (dow === 0 ? -6 : 1 - dow));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    const fmt = (d: Date, isEnd: boolean) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}${isEnd ? "T23:59:59+07:00" : "T00:00:00+07:00"}`;
    };
    const monStr = fmt(mon, false), sunStr = fmt(sun, true);

    // Parse addedOn — supports both "2026-08-03" (date-only → midnight PP)
    // and "2026-08-03T10:30:00+07:00" (full ISO timestamp).
    const parseTs = (s: string) =>
      new Date(s.includes("T") ? s : s + "T00:00:00+07:00").getTime();

    const weekStart = parseTs(monStr);
    const weekEnd = parseTs(sunStr);

    const tools = TOOLS.filter(
      (t): t is typeof t & { addedOn: string } => {
        if (typeof t.addedOn !== "string") return false;
        const ts = parseTs(t.addedOn);
        return ts >= weekStart && ts <= weekEnd;
      }
    ).sort((a, b) => parseTs(b.addedOn) - parseTs(a.addedOn));
    return { date: `${fmt(mon, false).slice(0, 10)} – ${fmt(sun, false).slice(0, 10)}`, tools };
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
            <AccentThemePicker />
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
    <main className="home-main relative min-h-screen pb-16">
      <div className="grid-veil pointer-events-none absolute inset-0 top-0" />

      <div className="sticky-nav relative" data-scrolled={navScrolled}>
         <div className="home-nav-inner mx-auto flex max-w-[77rem] items-center gap-3 px-5 py-2 sm:px-10">
           <Link href="/" aria-label="123 Toolbox home" className="home-brand shrink-0 font-display text-sm font-bold text-[var(--gold)] hover:text-[var(--gold-dim)]">១២៣</Link>

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
            <AccentThemePicker />
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
       <div className="relative mx-auto min-h-0 max-w-[77rem] px-5 sm:px-10 xl:min-h-[20rem]">
       <div className={auroraHero ? "aurora-hero relative mx-auto mt-7 max-w-2xl text-center" : "home-hero relative mx-auto mt-8 max-w-3xl text-center"}>
        {auroraHero ? (
          <>
            <span className="aurora-eyebrow">
              <span className="aurora-pip" />
              {t(`${TOTAL} free tools · built for everyone`, `ឧបករណ៍ឥតគិតថ្លៃ ${toKh(TOTAL)} · សម្រាប់អ្នកគ្រប់គ្នា`)}
            </span>
            <h1 className="aurora-h1">
              {t("All your tools,", "ឧបករណ៍ទាំងអស់")}<br />
              <span className="aurora-accent">{t("right in your browser", "ក្នុងកម្មវិធីរុករករបស់អ្នក")}</span>
            </h1>
            <p className="aurora-sub">
              {t("PDF, image, developer, math, and Khmer-language utilities — private, free, and instant. No accounts, nothing uploaded.", "ឧបករណ៍ PDF រូបភាព អ្នកអភិវឌ្ឍន៍ គណិតវិទ្យា និងភាសាខ្មែរ — ឯកជន ឥតគិតថ្លៃ និងភ្លាមៗ។ មិនចាំបាច់គណនី គ្មានការផ្ទុកឡើង។")}
            </p>
          </>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.1em] text-[var(--ink-faint)]">
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
            <h1 className="mx-auto mt-3 max-w-2xl font-display text-2xl font-semibold leading-tight text-[var(--ink)] sm:text-3xl">
             {t("All your tools, in one place", "ឧបករណ៍ទាំងអស់ នៅកន្លែងតែមួយ")}
           </h1>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[var(--ink-dim)]">
             {t("Office, development, text, math, Khmer language, geospatial, network, security, design, and time utilities — all searchable in one place.", "ឧបករណ៍សម្រាប់ការិយាល័យ អ្នកអភិវឌ្ឍន៍ អត្ថបទ គណិតវិទ្យា ភាសាខ្មែរ ភូមិសាស្ត្រ បណ្តាញ សុវត្ថិភាព ការរចនា និងពេលវេលា — ស្វែងរក និងប្រើប្រាស់បានយ៉ាងងាយស្រួល។")}
           </p>
            <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-[var(--ink-faint)]">
              {t(`Merge and compress PDFs, remove image backgrounds, convert Khmer digits, generate QR codes, and ${TOTAL - 4} more — free in your browser.`, `បញ្ចូល និងបង្រួម PDF លុបផ្ទៃខាងក្រោយរូបភាព បម្លែងលេខខ្មែរ បង្កើតកូដ QR និងឧបករណ៍ ${toKh(TOTAL - 4)} មុខទៀត — ឥតគិតថ្លៃ និងដំណើរការក្នុងកម្មវិធីរុករករបស់អ្នក។`)}
            </p>
          </>
        )}

         <div className={auroraHero ? "aurora-search" : undefined}>
           <UniversalInput value={filter} onChange={setFilter} />
         </div>
         {auroraHero && (
           <div className="aurora-chips">
             {chips.map((c) => (
               <button key={c.q} type="button" className="aurora-chip" onClick={() => setFilter(c.q)}>
                 {t(c.en, c.km)}
               </button>
             ))}
           </div>
         )}

         {wordSuggestions.length > 0 && (
           <div className="mx-auto mt-2 flex w-full max-w-xl flex-wrap items-center justify-center gap-1.5">
             <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
               {t("Did you mean", "តើអ្នកចង់មានន័យថា")}
             </span>
             {wordSuggestions.map((w) => (
               <button
                 key={w}
                 type="button"
                 onClick={() => setFilter(w)}
                 lang="km"
                 className="rounded-full border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2.5 py-1 font-khmer text-[13px] text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)]"
               >
                 {w}
               </button>
             ))}
           </div>
         )}
         <WorkspaceSwitcher value={workspaceId} onChange={setWorkspaceId} />

         {smartSuggestions.length > 0 && (
          <div className="mx-auto mt-2 flex w-full max-w-md flex-wrap items-center justify-center gap-1.5 text-left">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
              {t("Looks like…", "ប្រហែលជា…")}
            </span>
             {smartSuggestions.slice(0, 4).map((suggestion) => {
              const suggestionKm = suggestion.khmerTitle ?? suggestion.title;
              return (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => setActiveId(suggestion.id)}
                  className="rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/5 px-2.5 py-1 text-[11px] font-semibold text-[var(--gold)] transition hover:bg-[var(--gold)]/15"
                >
                  {t(suggestion.title, suggestionKm)}
                </button>
              );
              })}
           </div>
          )}
       </div>
       {homeDesign !== "focus" && <HomeSpotlightCarousel />}
       </div>

      {homeDesign === "focus" && filter === "" && (
        <FocusPopular tools={popularTools} onSelect={setActiveId} />
      )}

      {homeDesign !== "focus" && filter === "" && dailyAddition.date && dailyAddition.tools.length > 0 && (
        <div className="recently-added relative mx-auto mt-12 max-w-[77rem] px-5 sm:px-10">
          <div className="mb-3 flex flex-wrap items-baseline gap-2 border-b border-[var(--ground-line)] pb-2">
            <h2 className="font-display text-base font-semibold text-[var(--ink)]">
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
            showBlurb
          />
        </div>
      )}

      {homeDesign !== "focus" && isColdStart && filter === "" && (
        <div className="relative mx-auto mt-12 max-w-[77rem] px-5 sm:px-10">
          <div className="mb-3 flex items-baseline gap-2 border-b border-[var(--ground-line)] pb-2">
            <h2 className="font-display text-base font-semibold text-[var(--ink)]">{t("Start here", "ចាប់ផ្តើមនៅទីនេះ")}</h2>
            <span className="text-xs text-[var(--ink-faint)]">{t("a few useful tools to try", "ឧបករណ៍ណែនាំសម្រាប់សាកល្បង")}</span>
          </div>
          <div className="tool-list-scroll">
            <ToolGrid tools={starterTools} onSelect={setActiveId} favorites={favorites} onToggleFavorite={toggleFavorite} />
          </div>
        </div>
      )}

      {homeDesign !== "focus" && favoriteTools.length > 0 && filter === "" && (
        <div className="relative mx-auto mt-12 max-w-[77rem] px-5 sm:px-10">
          <div className="mb-3 flex items-baseline gap-2 border-b border-[var(--ground-line)] pb-2">
            <Star size={13} className="text-[var(--gold)]" fill="currentColor" />
            <h2 className="font-display text-base font-semibold text-[var(--ink)]">{t("Favorites", "ចំណូលចិត្ត")}</h2>
          </div>
          <div className="tool-list-scroll">
            <ToolGrid tools={favoriteTools} onSelect={setActiveId} favorites={favorites} onToggleFavorite={toggleFavorite} />
          </div>
        </div>
      )}

      {homeDesign !== "focus" && collections.length > 0 && filter === "" && (
        <CollectionsSection
          collections={collections}
          setCollections={setCollections}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onSelect={setActiveId}
        />
      )}

      {homeDesign !== "focus" && recentTools.length > 0 && filter === "" && (
        <div className="relative mx-auto mt-10 max-w-[77rem] px-5 sm:px-10">
          <div className="mb-3 flex items-baseline gap-2 border-b border-[var(--ground-line)] pb-2">
            <h2 className="font-display text-base font-semibold text-[var(--ink)]">{t("Recently used", "បានប្រើថ្មីៗ")}</h2>
          </div>
          <div className="tool-list-scroll">
            <ToolGrid tools={recentTools} onSelect={setActiveId} favorites={favorites} onToggleFavorite={toggleFavorite} />
          </div>
        </div>
      )}

      {homeDesign !== "focus" && hasUsage && mostUsedTools.length > 0 && filter === "" && (
        <div className="relative mx-auto mt-10 max-w-[77rem] px-5 sm:px-10">
          <div className="mb-3 flex items-baseline gap-2 border-b border-[var(--ground-line)] pb-2">
            <h2 className="font-display text-base font-semibold text-[var(--ink)]">{t("Most used", "បានប្រើច្រើនបំផុត")}</h2>
            <span className="text-xs text-[var(--ink-faint)]">{t("from your own usage", "ពីការប្រើប្រាស់របស់អ្នក")}</span>
          </div>
          <div className="tool-list-scroll">
            <ToolGrid tools={mostUsedTools} onSelect={setActiveId} favorites={favorites} onToggleFavorite={toggleFavorite} />
          </div>
        </div>
      )}

      {!(homeDesign === "focus" && filter === "") && (
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
              <div className="mb-3 flex items-center gap-2.5 border-b border-[var(--ground-line)] pb-2">
                <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                <h2 className="font-display text-base font-semibold text-[var(--ink)]">{t(meta.label, meta.khmer)}</h2>
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
                <ToolGrid tools={sorted} onSelect={setActiveId} favorites={favorites} onToggleFavorite={toggleFavorite} showBlurb />
              </div>
            </div>
          );
        })}
        {filteredByCategory.size === 0 && (
          <p className="py-16 text-center text-sm text-[var(--ink-faint)]">{t(`No tool matches “${filter}”.`, `រកមិនឃើញឧបករណ៍ដែលត្រូវនឹង “${filter}” ទេ។`)}</p>
        )}
      </div>
      )}

      {homeDesign !== "focus" && filter === "" && (
        <section className="why-123tool relative mx-auto mt-16 max-w-[77rem] px-5 sm:px-10">
          <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)]/40 px-5 py-8 sm:px-8">
            <div className="mb-6 text-center">
              <h2 className="font-display text-lg font-semibold text-[var(--ink)]">{t("Why 123tool?", "ហេតុអ្វីបានជា ១២៣?")}</h2>
              <p className="mt-1 text-xs text-[var(--ink-faint)]">{t("Free, private, and built for Khmer speakers", "ឥតគិតថ្លៃ ឯកជន និងបង្កើតសម្រាប់អ្នកនិយាយភាសាខ្មែរ")}</p>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {WHY_FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.en} className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-4 transition hover:border-[var(--gold-dim)]">
                    <Icon size={18} className="text-[var(--gold)]" />
                    <div className="mt-2 text-sm font-semibold text-[var(--ink)]">{t(f.en, f.km)}</div>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--ink-dim)]">{t(f.descEn, f.descKm)}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-[var(--ink-dim)]">
              <span className="flex items-baseline gap-1.5">
                <span className="font-display text-base font-semibold text-[var(--gold)]">{toKh(TOTAL)}</span>
                {t("tools", "ឧបករណ៍")}
              </span>
              <span className="hidden h-3 w-px bg-[var(--ground-line)] sm:block" />
              <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-[var(--gold)]" />{t("100% in your browser", "១០០% នៅក្នុងកម្មវិធីរុករករបស់អ្នក")}</span>
              <span className="hidden h-3 w-px bg-[var(--ground-line)] sm:block" />
              <span className="flex items-center gap-1.5"><Languages size={13} className="text-[var(--gold)]" />{t("Bilingual: English · ខ្មែរ", "ពីរភាសា៖ អង់គ្លេស · ខ្មែរ")}</span>
            </div>
          </div>
        </section>
      )}
      </>
      )}

      {homeDesign !== "focus" && filter === "" && localDevTools.length > 0 && (
        <section className="relative mx-auto mt-10 max-w-[77rem] px-5 sm:px-10">
          <div className="mb-3 flex items-baseline gap-2 border-b border-[var(--ground-line)] pb-2">
            <h2 className="font-display text-base font-semibold text-[var(--ink)]">{t("Tools from local/Int'l developers", "ឧបករណ៍ពីអ្នកអភិវឌ្ឍន៍ក្នុងស្រុក/អន្តរជាតិ")}</h2>
            <span className="text-xs text-[var(--ink-faint)]">{t("Verified local projects and references", "គម្រោង និងប្រភពក្នុងស្រុកដែលបានផ្ទៀងផ្ទាត់")}</span>
          </div>
          <ToolGrid tools={localDevTools} onSelect={setActiveId} favorites={favorites} onToggleFavorite={toggleFavorite} showCredits />
        </section>
      )}

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onSelect={setActiveId} />
    </main>
  );
}

// The Focus homepage design: a curated grid of popular tools, each card led by
// its category (coloured dot + label), then the tool's name, Khmer name, and a
// two-line description.
function FocusPopular({ tools, onSelect }: { tools: typeof TOOLS; onSelect: (id: string) => void }) {
  const { text: t, mode } = useLanguage();
  return (
    <div className="relative mx-auto mt-10 max-w-[77rem] px-5 sm:px-10">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-[var(--ground-line)] pb-3">
        <h2 className="font-display text-xl font-semibold text-[var(--ink)]">{t("Popular tools", "ឧបករណ៍ពេញនិយម")}</h2>
        <span className="text-sm text-[var(--ink-faint)]">{t("the ones people reach for", "ឧបករណ៍ដែលគេប្រើញឹកញាប់")}</span>
        <span className="ml-auto text-sm text-[var(--ink-faint)]">{t(`${tools.length} tools`, `ឧបករណ៍ ${toKh(tools.length)}`)}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tools.map((tool) => {
          const meta = CATEGORY_META[tool.category];
          const blurb = toolWhatItDoes(tool);
          const primary = mode === "km" ? (tool.khmerTitle ?? tool.title) : tool.title;
          const secondary = mode === "km" ? tool.title : tool.khmerTitle;
          return (
            <a
              key={tool.id}
              href={toolHref(tool.id)}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                event.preventDefault();
                onSelect(tool.id);
              }}
              className="group rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--gold-dim)] hover:bg-[var(--ground-raised-hi)]"
            >
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: meta.color }} />
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: meta.color }}>{t(meta.label, meta.khmer)}</span>
              </div>
              <div className="mt-2 font-display text-base font-semibold text-[var(--ink)]">{primary}</div>
              {secondary && secondary !== primary && (
                <div lang={mode === "km" ? undefined : "km"} className={mode === "km" ? "text-xs text-[var(--ink-faint)]" : "font-khmer text-sm text-[var(--gold)]"}>{secondary}</div>
              )}
              {blurb && <p className="focus-pop-desc mt-1.5 text-xs leading-relaxed text-[var(--ink-dim)]">{t(blurb.en, blurb.km)}</p>}
            </a>
          );
        })}
      </div>
    </div>
  );
}

function ToolGrid({
  tools,
  onSelect,
  favorites,
  onToggleFavorite,
  showNewBadge = false,
  showCredits = false,
  showBlurb = false,
}: {
  tools: typeof TOOLS;
  onSelect: (id: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  showNewBadge?: boolean;
  showCredits?: boolean;
  showBlurb?: boolean;
}) {
  const { text: t } = useLanguage();
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => {
        const isFav = favorites.includes(tool.id);
        const blurb = showBlurb ? toolWhatItDoes(tool) : null;
        return (
          <div
            key={tool.id}
            className="tool-card group flex items-center gap-1 rounded-md border border-transparent pr-1 text-left text-sm text-[var(--ink-dim)] transition hover:border-[var(--ground-line)] hover:bg-[var(--ground-raised)] hover:text-[var(--ink)]"
          >
            {/* Real crawlable link to the tool's canonical URL; left-click keeps the
                in-page SPA behaviour, while modified/middle clicks open a new tab. */}
            <a
              href={toolHref(tool.id)}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                event.preventDefault();
                onSelect(tool.id);
              }}
              className="min-w-0 flex-1 px-3 py-2 text-left"
            >
              <span className="flex items-center gap-2">{t(tool.title, tool.khmerTitle ?? tool.title)}
              {showNewBadge && (
                <span className="new-tool-badge shrink-0 rounded border border-[var(--gold-dim)] px-1 py-0.5 text-[9px] font-semibold leading-none text-[var(--gold)]">
                  {t("NEW", "ថ្មី")}
                </span>
              )}</span>
              {blurb && <span className="mt-0.5 block truncate text-[11px] font-normal text-[var(--ink-faint)]">{t(blurb.en, blurb.km)}</span>}
              {showCredits && tool.localProject && <span className="mt-0.5 block truncate text-[10px] text-[var(--ink-faint)]">{tool.localProject.author} · {tool.localProject.license}{tool.localProject.relationship === "inspired" ? " · Inspired / independent" : tool.localProject.relationship === "adapted" ? " · Adapted" : tool.localProject.relationship === "integrated" ? " · Integrated" : ""}</span>}
            </a>
            {showCredits && tool.localProject && <a href={tool.localProject.repository} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} className="shrink-0 rounded px-1.5 py-1 text-[10px] text-[var(--ink-faint)] underline hover:text-[var(--gold)]">GitHub</a>}
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

