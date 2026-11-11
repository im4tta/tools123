"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { ArrowDown, ArrowUp, FileText, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { toKhmerNumerals } from "@/lib/khmer-number-words";
import { formatBytes } from "@/lib/pdfjs";

export interface FileListItem {
  id: string;
  name: string;
  size: number;
  /** Extra line under the name, e.g. "3 pages". */
  detail?: ReactNode;
  /** Small preview; a file icon is shown when absent. */
  thumbnail?: ReactNode;
}

/**
 * The files a tool will work on, in order: size, optional preview, remove, and (when onMove is
 * given) reordering with the arrow buttons or Alt + ↑/↓ while any of a row's buttons has focus.
 */
export function FileList({
  items,
  onRemove,
  onMove,
}: {
  items: FileListItem[];
  onRemove: (id: string) => void;
  onMove?: (id: string, direction: -1 | 1) => void;
}) {
  const { text: t, mode } = useLanguage();
  if (items.length === 0) return null;
  const kh = (n: number | string) => toKhmerNumerals(String(n));
  const total = items.reduce((sum, item) => sum + item.size, 0);

  function onKeyDown(event: KeyboardEvent, id: string) {
    if (!onMove || !event.altKey) return;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const index = items.findIndex((item) => item.id === id);
      const direction = event.key === "ArrowUp" ? -1 : 1;
      if (index + direction >= 0 && index + direction < items.length) onMove(id, direction);
    }
  }

  const iconButton = "ui-touch shrink-0 rounded-md p-1.5 text-[var(--ink-dim)] hover:bg-[var(--ground-raised-hi)] hover:text-[var(--ink)] aria-disabled:cursor-not-allowed aria-disabled:opacity-40";

  return (
    <div className="space-y-2">
      <ol className="space-y-1.5" aria-label={t("Selected files", "ឯកសារដែលបានជ្រើសរើស")}>
        {items.map((item, index) => (
          <li
            key={item.id}
            onKeyDown={(event) => onKeyDown(event, item.id)}
            className="flex items-center gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2"
          >
            <span className="w-5 shrink-0 text-right text-xs tabular-nums text-[var(--ink-faint)]">{mode === "km" ? kh(index + 1) : index + 1}</span>
            <span className="flex h-12 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-[var(--ground-line)] bg-[var(--ground)]">
              {item.thumbnail ?? <FileText size={14} className="text-[var(--gold-text)]" aria-hidden />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-[var(--ink)]">{item.name}</span>
              <span className="block text-xs text-[var(--ink-faint)]">
                {formatBytes(item.size)}
                {item.detail ? <> · {item.detail}</> : null}
              </span>
            </span>
            {onMove && (
              <>
                {/* aria-disabled, not disabled, at the ends: a disabled button would drop keyboard focus
                    the moment its file reaches the top or bottom. */}
                <button type="button" onClick={() => index > 0 && onMove(item.id, -1)} aria-disabled={index === 0} aria-label={t(`Move ${item.name} up`, `ផ្លាស់ ${item.name} ឡើងលើ`)} className={iconButton}>
                  <ArrowUp size={14} aria-hidden />
                </button>
                <button type="button" onClick={() => index < items.length - 1 && onMove(item.id, 1)} aria-disabled={index === items.length - 1} aria-label={t(`Move ${item.name} down`, `ផ្លាស់ ${item.name} ចុះក្រោម`)} className={iconButton}>
                  <ArrowDown size={14} aria-hidden />
                </button>
              </>
            )}
            <button type="button" onClick={() => onRemove(item.id)} aria-label={t(`Remove ${item.name}`, `ដក ${item.name} ចេញ`)} className={`${iconButton} hover:text-[var(--danger)]`}>
              <X size={14} aria-hidden />
            </button>
          </li>
        ))}
      </ol>
      <p className="text-xs text-[var(--ink-dim)]">
        {t(
          `${items.length} ${items.length === 1 ? "file" : "files"} · ${formatBytes(total)}${onMove ? " · reorder with the arrows or Alt + ↑/↓" : ""}`,
          `ឯកសារ ${kh(items.length)} · ${formatBytes(total)}${onMove ? " · ប្ដូរលំដាប់ដោយព្រួញ ឬ Alt + ↑/↓" : ""}`,
        )}
      </p>
    </div>
  );
}
