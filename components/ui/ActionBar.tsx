"use client";

import { useId, type ReactNode } from "react";
import { useLanguage } from "@/components/LanguageProvider";

/**
 * A tool's main actions in one row, with an optional note that explains what the primary action
 * will do or why it is unavailable ("Add at least 2 PDFs"). Give the primary button
 * aria-describedby={noteId} via the render prop so screen readers hear the reason too.
 */
export function ActionBar({
  note,
  noteKm,
  children,
}: {
  note?: string;
  noteKm?: string;
  children: ReactNode | ((noteId: string | undefined) => ReactNode);
}) {
  const { text: t } = useLanguage();
  const id = useId();
  const noteId = note ? id : undefined;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {typeof children === "function" ? children(noteId) : children}
      {note && (
        <p id={noteId} className="text-xs text-[var(--ink-dim)]">
          {t(note, noteKm ?? note)}
        </p>
      )}
    </div>
  );
}
