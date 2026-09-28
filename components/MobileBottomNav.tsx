"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Clock, Globe, Home, Search, Star, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { OPEN_SEARCH_EVENT } from "@/lib/app-events";
import { LANGUAGES, type LanguageMode } from "@/lib/i18n";
import { STORAGE_KEYS, storage } from "@/lib/storage";
import { toolHref } from "@/lib/toolRoutes";
import type { ToolDef } from "@/lib/tools";

// Only pages without their own palette (about, changelog, …) fall back to this one, so it loads on demand.
const FallbackPalette = dynamic(() => import("@/components/CommandPalette").then((m) => m.CommandPalette), { ssr: false });

type Sheet = "favorites" | "recents" | "language" | null;
type ToolSummary = Pick<ToolDef, "id" | "title" | "khmerTitle">;

function isEditable(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || Boolean(target.closest("input, textarea, select, [contenteditable='true']")));
}

/**
 * Phone-only bottom navigation: Home, Search, Favorites, Recent and Language within thumb reach.
 * It hides while the on-screen keyboard is likely open (an input has focus) so it never covers
 * what the user is typing. The tool registry is imported only when a list sheet opens.
 */
export function MobileBottomNav() {
  const { mode, setMode, text: t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [tools, setTools] = useState<ToolSummary[] | null>(null);
  const [ids, setIds] = useState<string[]>([]);
  const [typing, setTyping] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Short tab labels: a bilingual "Home / ទំព័រដើម" does not fit five tabs on a phone.
  const short = (en: string, km: string) => (mode === "km" || mode === "bi" ? km : en);

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => setTyping(isEditable(e.target));
    const onFocusOut = () => setTyping(false);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSheet(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheet]);

  function openList(kind: "favorites" | "recents") {
    setIds(storage.get<string[]>(kind === "favorites" ? STORAGE_KEYS.favorites : STORAGE_KEYS.recents, []));
    setSheet(kind);
    if (!tools) void import("@/lib/tools").then((m) => setTools(m.TOOLS.map(({ id, title, khmerTitle }) => ({ id, title, khmerTitle }))));
  }

  function openSearch() {
    setSheet(null);
    const claimed = !document.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT, { cancelable: true }));
    if (!claimed) setPaletteOpen(true);
  }

  const titleOf = (tool: ToolSummary) => {
    const km = tool.khmerTitle ?? tool.title;
    return mode === "en" ? tool.title : mode === "km" ? km : `${tool.title} — ${km}`;
  };
  const listed = tools ? ids.map((id) => tools.find((tool) => tool.id === id)).filter((tool): tool is ToolSummary => Boolean(tool)) : [];
  const tabClass = (active: boolean) =>
    `flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] leading-none transition ${active ? "text-[var(--gold)]" : "text-[var(--ink-dim)] active:text-[var(--ink)]"}`;

  return (
    <>
      {sheet && (
        <div className="fixed inset-0 z-[45] sm:hidden" role="presentation">
          <button type="button" aria-label={t("Close", "បិទ")} className="absolute inset-0 bg-black/40" onClick={() => setSheet(null)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={sheet === "favorites" ? t("Favorites", "ចំណូលចិត្ត") : sheet === "recents" ? t("Recently used", "បានប្រើថ្មីៗ") : t("Display language", "ភាសាបង្ហាញ")}
            className="mobile-sheet absolute inset-x-0 bottom-0 max-h-[70dvh] overflow-y-auto rounded-t-2xl border-t border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 pt-2 shadow-2xl"
          >
            <div className="flex items-center justify-between px-1 py-2">
              <h2 className="text-sm font-semibold text-[var(--ink)]">
                {sheet === "favorites" ? t("Favorites", "ចំណូលចិត្ត") : sheet === "recents" ? t("Recently used", "បានប្រើថ្មីៗ") : t("Display language", "ភាសាបង្ហាញ")}
              </h2>
              <button type="button" onClick={() => setSheet(null)} aria-label={t("Close", "បិទ")} className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink-dim)]">
                <X size={18} />
              </button>
            </div>
            {sheet === "language" ? (
              <ul className="grid grid-cols-2 gap-2 pb-3">
                {[{ id: "bi", native: "English + ខ្មែរ" }, ...LANGUAGES].map((lang) => (
                  <li key={lang.id}>
                    <button
                      type="button"
                      onClick={() => { setMode(lang.id as LanguageMode); setSheet(null); }}
                      className={`flex min-h-11 w-full items-center rounded-lg border px-3 text-left text-sm ${mode === lang.id ? "border-[var(--gold-dim)] text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink)]"}`}
                    >
                      {lang.native}
                    </button>
                  </li>
                ))}
              </ul>
            ) : !tools ? (
              <p role="status" className="px-1 py-6 text-center text-sm text-[var(--ink-faint)]">{t("Loading…", "កំពុងផ្ទុក…")}</p>
            ) : listed.length === 0 ? (
              <p className="px-1 py-6 text-center text-sm text-[var(--ink-faint)]">
                {sheet === "favorites"
                  ? t("No favorites yet. Tap the star on any tool to keep it here.", "មិនទាន់មានចំណូលចិត្តនៅឡើយ។ ចុចផ្កាយលើឧបករណ៍ណាមួយដើម្បីរក្សាទុកនៅទីនេះ។")
                  : t("Tools you open will appear here.", "ឧបករណ៍ដែលអ្នកបើកនឹងបង្ហាញនៅទីនេះ។")}
              </p>
            ) : (
              <ul className="space-y-1 pb-3">
                {listed.map((tool) => (
                  <li key={tool.id}>
                    <Link
                      href={toolHref(tool.id)}
                      onClick={() => setSheet(null)}
                      className="flex min-h-11 items-center rounded-lg px-3 text-sm text-[var(--ink)] active:bg-[var(--ground-raised-hi)]"
                    >
                      {titleOf(tool)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      <nav
        aria-label={t("Quick navigation", "ការរុករករហ័ស")}
        className={`mobile-bottom-nav fixed inset-x-0 bottom-0 z-[46] border-t border-[var(--ground-line)] bg-[color:color-mix(in_srgb,var(--ground)_97%,transparent)] transition-transform duration-200 sm:hidden ${typing ? "translate-y-full" : ""}`}
      >
        <div className="flex items-stretch">
          <Link href="/" aria-label={t("Home", "ទំព័រដើម")} aria-current={pathname === "/" ? "page" : undefined} onClick={() => setSheet(null)} className={tabClass(pathname === "/" && !sheet)}>
            <Home size={20} aria-hidden="true" />{short("Home", "ដើម")}
          </Link>
          <button type="button" aria-label={t("Search tools", "ស្វែងរកឧបករណ៍")} onClick={openSearch} className={tabClass(false)}>
            <Search size={20} aria-hidden="true" />{short("Search", "ស្វែងរក")}
          </button>
          <button type="button" aria-label={t("Favorites", "ចំណូលចិត្ត")} aria-expanded={sheet === "favorites"} onClick={() => (sheet === "favorites" ? setSheet(null) : openList("favorites"))} className={tabClass(sheet === "favorites")}>
            <Star size={20} aria-hidden="true" />{short("Favorites", "ចំណូលចិត្ត")}
          </button>
          <button type="button" aria-label={t("Recently used", "បានប្រើថ្មីៗ")} aria-expanded={sheet === "recents"} onClick={() => (sheet === "recents" ? setSheet(null) : openList("recents"))} className={tabClass(sheet === "recents")}>
            <Clock size={20} aria-hidden="true" />{short("Recent", "ថ្មីៗ")}
          </button>
          <button type="button" aria-label={t("Display language", "ភាសាបង្ហាញ")} aria-expanded={sheet === "language"} onClick={() => setSheet(sheet === "language" ? null : "language")} className={tabClass(sheet === "language")}>
            <Globe size={20} aria-hidden="true" />{short("Language", "ភាសា")}
          </button>
        </div>
      </nav>
      {paletteOpen && <FallbackPalette open={paletteOpen} onOpenChange={setPaletteOpen} onSelect={(id) => { setPaletteOpen(false); router.push(toolHref(id)); }} />}
    </>
  );
}
