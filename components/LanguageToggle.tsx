"use client";

import { LanguageMode, useLanguage } from "@/components/LanguageProvider";

const OPTIONS: { mode: LanguageMode; label: string }[] = [
  { mode: "km", label: "KH" },
  { mode: "en", label: "EN" },
  { mode: "bi", label: "BI" },
];

export function LanguageToggle() {
  const { mode, setMode, text } = useLanguage();
  return (
    <div className="flex h-8 overflow-hidden rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]" role="group" aria-label={text("Display language", "ភាសាបង្ហាញ")}>
      {OPTIONS.map((option) => (
        <button
          key={option.mode}
          type="button"
          onClick={() => setMode(option.mode)}
          aria-pressed={mode === option.mode}
          title={option.mode === "bi" ? "Bilingual / ពីរភាសា" : option.label}
          className={`px-2 text-[10px] font-semibold transition ${mode === option.mode ? "bg-[var(--gold)] text-[var(--ground)]" : "text-[var(--ink-faint)] hover:text-[var(--ink)]"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
