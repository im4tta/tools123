"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { ArrowRight, Search } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { CATEGORY_META, CATEGORY_ORDER, TOOLS } from "@/lib/tools";

const KH_DIGITS = "០១២៣៤៥៦៧៨៩";
const toKh = (n: number) => String(n).split("").map((d) => KH_DIGITS[Number(d)]).join("");

export function CommandPalette({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (id: string) => void;
}) {
  const { text: t } = useLanguage();
  const [selectedToolId, setSelectedToolId] = useState(TOOLS[0]?.id ?? "");
  const selectedTool = TOOLS.find((tool) => tool.id === selectedToolId);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
        return;
      }
      const target = e.target;
      const isEditing = target instanceof HTMLElement && (target.isContentEditable || Boolean(target.closest("input, textarea, select, [contenteditable='true']")));
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !isEditing && e.key === "/") {
        e.preventDefault();
        onOpenChange(true);
        return;
      }
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="command-palette-overlay fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="command-palette-panel w-full max-w-xl overflow-hidden rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command value={selectedToolId} onValueChange={setSelectedToolId} loop className="command-palette-root flex flex-col">
          <div className="flex items-center gap-2 border-b border-[var(--ground-line)] px-4 py-3">
            <Search size={16} className="text-[var(--ink-faint)]" />
            <Command.Input
              autoFocus
              aria-label={t("Search tools", "ស្វែងរកឧបករណ៍")}
              placeholder={t(`Search ${TOOLS.length} tools…`, `ស្វែងរកឧបករណ៍ ${toKh(TOOLS.length)} មុខ…`)}
              className="w-full bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
            />
            <kbd className="rounded border border-[var(--ground-line)] px-1.5 py-0.5 text-[10px] text-[var(--ink-faint)]">esc</kbd>
          </div>
          <Command.List className="command-palette-list max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-sm text-[var(--ink-faint)]">
              {t("No matching tool found.", "រកមិនឃើញឧបករណ៍ដែលត្រូវនឹងការស្វែងរកទេ។")}
            </Command.Empty>
            {CATEGORY_ORDER.map((cat) => (
              <Command.Group
                key={cat}
                heading={t(CATEGORY_META[cat].label, CATEGORY_META[cat].khmer)}
                className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-[var(--ink-faint)]"
              >
                {TOOLS.filter((tool) => tool.category === cat).map((tool) => (
                  <Command.Item
                    key={tool.id}
                    value={tool.id}
                    keywords={[tool.title, tool.khmerTitle ?? "", ...tool.keywords]}
                    onSelect={(id) => {
                      onSelect(id);
                      onOpenChange(false);
                    }}
                    className="group flex cursor-pointer items-center justify-between rounded-md border border-transparent px-3 py-2 text-sm text-[var(--ink)] outline-none transition data-[selected=true]:border-[var(--gold-dim)] data-[selected=true]:bg-[var(--ground-line)] data-[selected=true]:shadow-[inset_3px_0_0_var(--gold)]"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: CATEGORY_META[cat].color }} />
                      <span className="truncate">{t(tool.title, tool.khmerTitle ?? tool.title)}</span>
                    </span>
                    <ArrowRight size={13} className="shrink-0 text-[var(--ink-faint)] group-data-[selected=true]:text-[var(--gold)]" />
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
          <div className="flex min-h-9 items-center gap-2 border-t border-[var(--ground-line)] px-4 py-2 text-xs">
            <span className="shrink-0 text-[var(--ink-faint)]">{t("Selected:", "បានជ្រើសរើស៖")}</span>
            <strong aria-live="polite" aria-atomic="true" className="min-w-0 flex-1 truncate font-medium text-[var(--gold)]">
              {selectedTool ? t(selectedTool.title, selectedTool.khmerTitle ?? selectedTool.title) : t("No tool", "គ្មានឧបករណ៍")}
            </strong>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--ground-line)] px-4 py-2 text-[11px] text-[var(--ink-faint)]">
            <span>{t(`${TOOLS.length} tools total`, `ឧបករណ៍សរុប ${toKh(TOOLS.length)} មុខ`)}</span>
            <span>{t("↑↓ navigate · ↵ open", "↑↓ ជ្រើសរើស · ↵ បើក")}</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
