"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Search, Star } from "lucide-react";
import { CommandPalette } from "@/components/CommandPalette";
import { HeaderInfo } from "@/components/HeaderInfo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { STORAGE_KEYS, useLocalStorage } from "@/lib/storage";
import { TOOLS } from "@/lib/tools";
import { toolHref } from "@/lib/toolRoutes";

export function ToolRouteClient({ toolId }: { toolId: string }) {
  const { mode, text: t } = useLanguage();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { value: favorites, setValue: setFavorites } = useLocalStorage<string[]>(STORAGE_KEYS.favorites, []);
  const { setValue: setRecents } = useLocalStorage<string[]>(STORAGE_KEYS.recents, []);
  const tool = TOOLS.find((item) => item.id === toolId);

  useEffect(() => {
    setRecents((previous) => [toolId, ...previous.filter((id) => id !== toolId)].slice(0, 8));
  }, [setRecents, toolId]);

  useEffect(() => {
    if (!tool) return;
    const khmerTitle = tool.khmerTitle ?? tool.title;
    const localized = mode === "en" ? tool.title : mode === "km" ? khmerTitle : `${tool.title} — ${khmerTitle}`;
    document.title = `${localized} — 123 Toolbox`;
  }, [mode, tool]);

  const openTool = useCallback((id: string) => router.push(toolHref(id)), [router]);
  if (!tool) return null;
  const ToolComponent = tool.Component;
  const isFavorite = favorites.includes(tool.id);
  const khmerTitle = tool.khmerTitle ?? tool.title;
  const localizedTitle = mode === "en" ? tool.title : mode === "km" ? khmerTitle : `${tool.title} — ${khmerTitle}`;

  return (
    <main className="min-h-screen px-5 pb-16 pt-24 sm:px-10">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--ground-line)] bg-[color:color-mix(in_srgb,var(--ground)_90%,transparent)] backdrop-blur-xl">
        <div className="tool-route-header-inner mx-auto flex h-14 max-w-[77rem] items-center gap-3 px-5 sm:px-10">
          <Link href="/" className="flex shrink-0 items-center gap-1.5 text-sm text-[var(--ink-dim)] hover:text-[var(--ink)]">
            <ArrowLeft size={15} /><span className="tool-route-back-label">{t("All tools", "ឧបករណ៍ទាំងអស់")}</span>
          </Link>
          <span className="tool-route-title min-w-0 flex-1 truncate text-xs font-medium text-[var(--ink-dim)]" title={localizedTitle}>{localizedTitle}</span>
          <div className="tool-route-actions flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setFavorites((items) => isFavorite ? items.filter((id) => id !== tool.id) : [tool.id, ...items])}
              aria-label={isFavorite ? t("Remove from favorites", "ដកចេញពីចំណូលចិត្ត") : t("Add to favorites", "បន្ថែមទៅចំណូលចិត្ត")}
              className={`flex h-8 w-8 items-center justify-center rounded-md border ${isFavorite ? "border-[var(--gold)] text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-faint)]"}`}
            >
              <Star size={14} fill={isFavorite ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label={t("Find a tool", "ស្វែងរកឧបករណ៍")}
              className="flex items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs text-[var(--ink-dim)]"
            >
              <Search size={13} /><span className="hidden sm:inline">{t("Find a tool…", "ស្វែងរកឧបករណ៍…")}</span>
            </button>
            <HeaderInfo />
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="fade-rise"><ToolComponent /></div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onSelect={openTool} />
    </main>
  );
}
