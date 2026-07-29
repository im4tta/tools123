"use client";

import { useRef, useState } from "react";
import { Copy, ChevronDown, Check } from "lucide-react";
import { useClipboard } from "@/components/ClipboardProvider";
import { useLanguage } from "@/components/LanguageProvider";

interface DropdownItem {
  label: string;
  labelKm: string;
  action: () => void;
}

export interface CopyField {
  id: string;
  label: string;
  getValue: string;
}

export function CopyButton({ text, compact = false, className = "", dropdown, fields }: { text: string; compact?: boolean; className?: string; dropdown?: DropdownItem[]; fields?: CopyField[] }) {
  const { copyText } = useClipboard();
  const { text: localize } = useLanguage();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const label = localize("Copy", "ចម្លង");
  const hasMenu = !!(dropdown || fields);

  function handleCopySelected() {
    if (!fields || selected.length === 0) return;
    const parts = fields.filter((f) => selected.includes(f.id)).map((f) => `${f.label}: ${f.getValue}`);
    void copyText(parts.join("\n"));
    setOpen(false);
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        disabled={!text.trim()}
        onClick={() => { if (hasMenu) setOpen(!open); else void copyText(text); }}
        aria-label={label}
        title={label}
        className={`inline-flex items-center justify-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1.5 text-xs text-[var(--ink-faint)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)] disabled:opacity-40 ${className}`}
      >
        <Copy size={13} />{!compact && <span>{label}</span>}
        {hasMenu && <ChevronDown size={11} className={`transition ${open ? "rotate-180" : ""}`} />}
      </button>
      {open && hasMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] py-1 shadow-lg">
            <button type="button" onClick={() => { void copyText(text); setOpen(false); }} className="flex w-full px-3 py-1.5 text-left text-xs text-[var(--ink)] hover:bg-[var(--ground-line)]">
              {localize("Copy this item", "ចម្លងធាតុនេះ")}
            </button>
            {dropdown?.map((item, i) => (
              <button key={i} type="button" onClick={() => { item.action(); setOpen(false); }} className="flex w-full px-3 py-1.5 text-left text-xs text-[var(--ink)] hover:bg-[var(--ground-line)]">
                {localize(item.label, item.labelKm)}
              </button>
            ))}
            {fields && (
              <>
                <div className="my-1 border-t border-[var(--ground-line)]" />
                {fields.map((f) => (
                  <div key={f.id} onClick={() => setSelected((prev) => prev.includes(f.id) ? prev.filter((x) => x !== f.id) : [...prev, f.id])} className="flex cursor-pointer items-center gap-2 px-3 py-1 text-xs text-[var(--ink-dim)] hover:bg-[var(--ground-line)]">
                    <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${selected.includes(f.id) ? "border-[var(--gold)] bg-[var(--gold)]" : "border-[var(--ground-line)]"}`}>
                      {selected.includes(f.id) && <Check size={10} className="text-[var(--ground-raised)]" />}
                    </span>
                    <span>{f.label}</span>
                    <span className="ml-auto truncate text-[10px] text-[var(--ink-faint)]">{f.getValue}</span>
                  </div>
                ))}
                <div className="my-1 border-t border-[var(--ground-line)]" />
                <button type="button" onClick={handleCopySelected} disabled={selected.length === 0} className="flex w-full items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-[var(--gold)] hover:bg-[var(--ground-line)] disabled:opacity-40">
                  <Copy size={12} />
                  {localize("Copy selected", "ចម្លងតាមជម្រើស")}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
