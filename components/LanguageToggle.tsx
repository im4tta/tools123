"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { LANGUAGES, type LanguageMode } from "@/lib/i18n";
import { useLanguage } from "@/components/LanguageProvider";

export function LanguageToggle() {
  const { mode, setMode, ui } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={ui("Display language")}
        title={ui("Display language")}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2 text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--ink)]"
      >
        <Globe size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div role="menu" className="absolute right-0 top-full z-20 mt-1 max-h-80 w-40 overflow-y-auto rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] py-1 shadow-lg">
            <button
              type="button"
              role="menuitem"
              onClick={() => { setMode("bi"); setOpen(false); }}
              className={`flex w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--ground-line)] ${mode === "bi" ? "text-[var(--gold)]" : "text-[var(--ink)]"}`}
            >
              Bilingual
            </button>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                type="button"
                role="menuitem"
                onClick={() => { setMode(lang.id as LanguageMode); setOpen(false); }}
                className={`flex w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--ground-line)] ${mode === lang.id ? "text-[var(--gold)]" : "text-[var(--ink)]"}`}
              >
                {lang.native}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}