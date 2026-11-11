"use client";

import { useId, useState, type ReactNode } from "react";
import { Upload } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

/**
 * File picker + drop target for file tools. The input stays focusable (visually hidden, not
 * display:none), so keyboard users reach it with Tab and open it with Space or Enter; the focus
 * ring is drawn on the zone (globals.css).
 */
export function Dropzone({
  onFiles,
  accept,
  multiple = false,
  disabled = false,
  label,
  labelKm,
  hint,
  hintKm,
  children,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  labelKm?: string;
  hint?: string;
  hintKm?: string;
  children?: ReactNode;
}) {
  const { text: t } = useLanguage();
  const id = useId();
  const [dragging, setDragging] = useState(false);

  function take(list: FileList | null) {
    if (disabled || !list?.length) return;
    const files = Array.from(list);
    onFiles(multiple ? files : files.slice(0, 1));
  }

  const title = label
    ? t(label, labelKm ?? label)
    : multiple
      ? t("Drop files here or click to choose", "ទម្លាក់ឯកសារនៅទីនេះ ឬចុចដើម្បីជ្រើសរើស")
      : t("Drop a file here or click to choose", "ទម្លាក់ឯកសារនៅទីនេះ ឬចុចដើម្បីជ្រើសរើស");

  return (
    <label
      htmlFor={id}
      data-dragging={dragging || undefined}
      aria-disabled={disabled || undefined}
      onDragOver={(event) => {
        event.preventDefault();
        if (!dragging && !disabled) setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        take(event.dataTransfer.files);
      }}
      className="ui-dropzone flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--ground-line-strong)] bg-[var(--ground-raised)] px-4 py-8 text-center transition-colors hover:border-[var(--gold-text)] data-[dragging]:border-[var(--gold-text)] data-[dragging]:bg-[var(--gold)]/10 aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
    >
      <Upload size={20} className="text-[var(--gold-text)]" aria-hidden />
      <span className="text-sm font-medium text-[var(--ink)]">{title}</span>
      {hint && <span className="text-xs text-[var(--ink-faint)]">{t(hint, hintKm ?? hint)}</span>}
      {children}
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          take(event.target.files);
          event.target.value = "";
        }}
      />
    </label>
  );
}
