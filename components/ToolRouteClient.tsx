"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Search, ShieldCheck, Star, Trash2 } from "lucide-react";
import { CollectionsPicker } from "@/components/CollectionsPicker";
import { CommandPalette } from "@/components/CommandPalette";
import { HeaderInfo } from "@/components/HeaderInfo";
import { ToolFaq } from "@/components/ToolFaq";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { STORAGE_KEYS, storage, useLocalStorage, type ToolCollection } from "@/lib/storage";
import { TOOLS } from "@/lib/tools";
import { toolHref } from "@/lib/toolRoutes";
import { recommendationsFor } from "@/lib/recommendations";
import { DEFAULT_WORKSPACE_PROFILES, type WorkspaceProfile } from "@/lib/workspaces";

export function ToolRouteClient({ toolId }: { toolId: string }) {
  const { mode, text: t } = useLanguage();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { value: favorites, setValue: setFavorites } = useLocalStorage<string[]>(STORAGE_KEYS.favorites, []);
  const { value: collections, setValue: setCollections } = useLocalStorage<ToolCollection[]>(STORAGE_KEYS.collections, []);
  const { setValue: setRecents } = useLocalStorage<string[]>(STORAGE_KEYS.recents, []);
  const { value: workspaceId } = useLocalStorage(STORAGE_KEYS.workspace, "all");
  const { setValue: setWorkspaceProfiles } = useLocalStorage<WorkspaceProfile[]>("workspace-profiles", DEFAULT_WORKSPACE_PROFILES);
  const tool = TOOLS.find((item) => item.id === toolId);

  useEffect(() => {
    setRecents((previous) => [toolId, ...previous.filter((id) => id !== toolId)].slice(0, 8));
    if (workspaceId !== "all") {
      setWorkspaceProfiles((profiles) => profiles.map((profile) => profile.id === workspaceId
        ? { ...profile, recentCalculations: [toolId, ...profile.recentCalculations.filter((id) => id !== toolId)].slice(0, 8) }
        : profile));
    }
  }, [setRecents, setWorkspaceProfiles, toolId, workspaceId]);

  useEffect(() => {
    if (!tool) return;
    const khmerTitle = tool.khmerTitle ?? tool.title;
    const localized = mode === "en" ? tool.title : mode === "km" ? khmerTitle : `${tool.title} — ${khmerTitle}`;
    document.title = `${localized} — 123 Toolbox`;
  }, [mode, tool]);

  const openTool = useCallback((id: string) => router.push(toolHref(id)), [router]);
  if (!tool) return null;
  const currentToolId = tool.id;
  function clearSavedToolData() {
    if (!window.confirm(t("Clear all saved app data? This removes favorites, workspaces, collections, and tool inputs.", "លុបទិន្នន័យកម្មវិធីដែលបានរក្សាទុកទាំងអស់? វានឹងលុបចំណូលចិត្ត កន្លែងធ្វើការ បណ្តុំ និងទិន្នន័យបញ្ចូលរបស់ឧបករណ៍។"))) return;
    storage.clearAll();
    window.location.reload();
  }
  const ToolComponent = tool.Component;
  const isFavorite = favorites.includes(tool.id);
  function toggleFavorite() {
    const nextFavorite = !isFavorite;
    setFavorites((items) => nextFavorite ? [currentToolId, ...items.filter((id) => id !== currentToolId)] : items.filter((id) => id !== currentToolId));
    if (workspaceId !== "all") {
      setWorkspaceProfiles((profiles) => profiles.map((profile) => profile.id === workspaceId
        ? { ...profile, favoriteToolIds: nextFavorite ? [currentToolId, ...profile.favoriteToolIds.filter((id) => id !== currentToolId)] : profile.favoriteToolIds.filter((id) => id !== currentToolId) }
        : profile));
    }
  }
  const khmerTitle = tool.khmerTitle ?? tool.title;
  const localizedTitle = mode === "en" ? tool.title : mode === "km" ? khmerTitle : `${tool.title} — ${khmerTitle}`;
  const configuredRecommendations = recommendationsFor(tool.id)
    .map((recommendation) => ({ tool: TOOLS.find((candidate) => candidate.id === recommendation.id), reason: recommendation.reason, reasonKm: recommendation.reasonKm }))
    .filter((recommendation) => Boolean(recommendation.tool))
    .map((recommendation) => ({ tool: recommendation.tool!, reason: recommendation.reason, reasonKm: recommendation.reasonKm }));
  const relatedTools = configuredRecommendations.length > 0
    ? configuredRecommendations
    : TOOLS
      .filter((candidate) => candidate.id !== tool.id)
      .map((candidate) => {
        const sharedKeywords = candidate.keywords.filter((keyword) => tool.keywords.includes(keyword)).length;
        return { tool: candidate, score: (candidate.category === tool.category ? 3 : 0) + sharedKeywords * 2 };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.tool.title.localeCompare(b.tool.title))
      .slice(0, 6)
      .map(({ tool: related }) => ({ tool: related, reason: "Shares a category or workflow", reasonKm: "មានប្រភេទ ឬលំហូរការងារដូចគ្នា" }));

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
              onClick={toggleFavorite}
              aria-label={isFavorite ? t("Remove from favorites", "ដកចេញពីចំណូលចិត្ត") : t("Add to favorites", "បន្ថែមទៅចំណូលចិត្ត")}
              className={`flex h-8 w-8 items-center justify-center rounded-md border ${isFavorite ? "border-[var(--gold)] text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-faint)]"}`}
            >
              <Star size={14} fill={isFavorite ? "currentColor" : "none"} />
            </button>
            <CollectionsPicker
              toolId={tool.id}
              favorites={favorites}
              onToggleFavorite={(id) => {
                const nextFavorite = !favorites.includes(id);
                setFavorites((items) => nextFavorite ? [id, ...items.filter((item) => item !== id)] : items.filter((item) => item !== id));
                if (workspaceId !== "all") setWorkspaceProfiles((profiles) => profiles.map((profile) => profile.id === workspaceId
                  ? { ...profile, favoriteToolIds: nextFavorite ? [id, ...profile.favoriteToolIds.filter((item) => item !== id)] : profile.favoriteToolIds.filter((item) => item !== id) }
                  : profile));
              }}
              collections={collections}
              setCollections={setCollections}
            />
            <button
              type="button"
              onClick={clearSavedToolData}
               aria-label={t("Clear all app data", "លុបទិន្នន័យកម្មវិធីទាំងអស់")}
               title={t("Clear all app data", "លុបទិន្នន័យកម្មវិធីទាំងអស់")}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--ground-line)] text-[var(--ink-faint)] transition hover:border-[var(--danger)]/50 hover:text-[var(--danger)]"
            >
              <Trash2 size={14} />
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
      <ToolFaq tool={tool} />
      {relatedTools.length > 0 && (
        <section className="mx-auto mt-10 max-w-6xl">
          <h2 className="font-display text-lg font-medium text-[var(--ink)]">{t("Next recommended tools", "ឧបករណ៍ណែនាំបន្ទាប់")}</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {relatedTools.map(({ tool: related, reason, reasonKm }) => {
              const relatedKhmerTitle = related.khmerTitle ?? related.title;
              const relatedTitle = mode === "en" ? related.title : mode === "km" ? relatedKhmerTitle : `${related.title} — ${relatedKhmerTitle}`;
              return (
                <Link
                  key={related.id}
                  href={toolHref(related.id)}
                  className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3 text-sm text-[var(--ink)] transition hover:border-[var(--gold-dim)] hover:bg-[var(--ground-raised-hi)]"
                >
                  <span className="block font-medium">{relatedTitle}</span>
                  <span className="mt-1 block text-xs text-[var(--ink-faint)]">{t(reason, reasonKm ?? reason)}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
      <aside className="mx-auto mt-6 flex max-w-6xl items-start gap-3 rounded-lg border border-[var(--teal)]/30 bg-[var(--teal)]/10 px-4 py-3 text-sm text-[var(--ink-dim)]">
        <ShieldCheck className="mt-0.5 shrink-0 text-[var(--teal)]" size={17} aria-hidden="true" />
        <p>
          <span className="font-medium text-[var(--ink)]">{t("Private by design.", "ឯកជនភាពជាចម្បង។")}</span>{" "}
          {t(
            "Files you select are processed in your browser and are never uploaded by 123 Toolbox.",
            "ឯកសារដែលអ្នកជ្រើសរើសត្រូវបានដំណើរការក្នុងកម្មវិធីរុករករបស់អ្នក ហើយមិនត្រូវបានផ្ញើឡើងដោយ 123 Toolbox ឡើយ។"
          )}
        </p>
      </aside>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onSelect={openTool} />
    </main>
  );
}
