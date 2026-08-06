"use client";

import { Briefcase } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { useLocalStorage } from "@/lib/storage";
import { DEFAULT_WORKSPACE_PROFILES, WORKSPACES, type WorkspaceProfile } from "@/lib/workspaces";

export function WorkspaceSwitcher({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { text: t } = useLanguage();
  const { value: profiles } = useLocalStorage<WorkspaceProfile[]>("workspace-profiles", DEFAULT_WORKSPACE_PROFILES);
  const workspace = WORKSPACES.find((item) => item.id === value) ?? null;
  const profile = workspace ? profiles.find((item) => item.id === workspace.id) ?? DEFAULT_WORKSPACE_PROFILES[0] : null;
  return (
    <div className="mx-auto mt-4 flex w-full max-w-md items-center gap-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2">
      <Briefcase size={14} className="shrink-0 text-[var(--gold)]" />
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">{t("Workspace", "កន្លែងធ្វើការ")}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-[var(--ink)] outline-none">
        <option value="all">{t("All tools", "ឧបករណ៍ទាំងអស់")}</option>
        {WORKSPACES.map((item) => <option key={item.id} value={item.id}>{t(item.label, item.khmer)}</option>)}
      </select>
      {profile && <span className="hidden text-[10px] text-[var(--ink-faint)] sm:inline">{profile.shortcuts.length} {t("shortcuts", "ផ្លូវកាត់")}</span>}
    </div>
  );
}
