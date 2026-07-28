"use client";

import { Copy } from "lucide-react";
import { useClipboard } from "@/components/ClipboardProvider";
import { useLanguage } from "@/components/LanguageProvider";

export function CopyButton({ text, compact = false, className = "" }: { text: string; compact?: boolean; className?: string }) {
  const { copyText } = useClipboard();
  const { text: localize } = useLanguage();
  const label = localize("Copy", "ចម្លង");
  return (
    <button type="button" disabled={!text.trim()} onClick={() => void copyText(text)} aria-label={label} title={label} className={`inline-flex items-center justify-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1.5 text-xs text-[var(--ink-faint)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)] disabled:opacity-40 ${className}`}>
      <Copy size={13} />{!compact && <span>{label}</span>}
    </button>
  );
}
