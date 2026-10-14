"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { OPEN_SEARCH_EVENT } from "@/lib/app-events";

function PaletteLoading() {
  const { text: t } = useLanguage();
  return (
    <div className="command-palette-overlay fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm">
      <div role="status" className="command-palette-panel w-full max-w-xl rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3 text-sm text-[var(--ink-faint)] shadow-2xl">
        {t("Loading…", "កំពុងផ្ទុក…")}
      </div>
    </div>
  );
}

// The dialog (cmdk + the full tool registry) loads the first time the palette opens.
const CommandPaletteDialog = dynamic(() => import("@/components/CommandPaletteDialog"), { ssr: false, loading: PaletteLoading });

/**
 * Global tool search: ⌘K / Ctrl+K, "/" and the mobile bottom-nav search button open it. Only the
 * keyboard/event wiring ships with the page; the dialog is code-split.
 */
export function CommandPalette({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (id: string) => void;
}) {
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
    // The mobile bottom nav asks the page's palette to open; claiming the event tells it not to
    // open its own fallback palette.
    function onOpenRequest(e: Event) {
      e.preventDefault();
      onOpenChange(true);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener(OPEN_SEARCH_EVENT, onOpenRequest);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener(OPEN_SEARCH_EVENT, onOpenRequest);
    };
  }, [open, onOpenChange]);

  if (!open) return null;
  return <CommandPaletteDialog onOpenChange={onOpenChange} onSelect={onSelect} />;
}
