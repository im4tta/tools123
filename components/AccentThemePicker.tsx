"use client";

import { useEffect, useRef, useState } from "react";
import { Palette } from "lucide-react";
import { ACCENTS, useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/components/LanguageProvider";

/** Dropdown picker for the app's accent color themes (Cambodian places). */
export function AccentThemePicker({ className = "" }: { className?: string }) {
  const { text: t } = useLanguage();
  const { accent, setAccent } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("Accent theme", "ពណ៌ប្រធានបទ")}
        title={t("Accent theme", "ពណ៌ប្រធានបទ")}
        aria-expanded={open}
        className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2 text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--ink)]"
      >
        <Palette size={15} />
        <span
          className="h-3.5 w-3.5 rounded-full border border-black/20"
          style={{ background: ACCENTS.find((a) => a.id === accent)?.swatch ?? "#c9a24b" }}
        />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] shadow-lg">
          <p className="border-b border-[var(--ground-line)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
            {t("Accent theme", "ពណ៌ប្រធានបទ")}
          </p>
          <div className="max-h-72 overflow-y-auto py-1">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => { setAccent(a.id); setOpen(false); }}
                className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition ${
                  accent === a.id ? "bg-[var(--gold)]/15 font-medium text-[var(--gold)]" : "text-[var(--ink-dim)] hover:bg-[var(--ground-raised-hi)] hover:text-[var(--ink)]"
                }`}
              >
                <span className="h-4 w-4 shrink-0 rounded-full border border-black/20" style={{ background: a.swatch }} />
                <span className="truncate">{a.label}</span>
                <span lang="km" className="ml-auto shrink-0 text-xs text-[var(--ink-faint)]">{a.km}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
