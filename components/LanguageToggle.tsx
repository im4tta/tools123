"use client";

import { LANGUAGES, type LanguageMode } from "@/lib/i18n";
import { useLanguage } from "@/components/LanguageProvider";

export function LanguageToggle() {
  const { mode, setMode, ui } = useLanguage();
  return (
    <select
      value={mode}
      onChange={(event) => setMode(event.target.value as LanguageMode)}
      aria-label={ui("Display language")}
      title={ui("Display language")}
      className="h-8 max-w-[8rem] cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2 text-[11px] font-semibold text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--ink)]"
    >
      <option value="bi">EN / ខ្មែរ</option>
      {LANGUAGES.map((lang) => (
        <option key={lang.id} value={lang.id}>
          {lang.native} · {lang.label}
        </option>
      ))}
    </select>
  );
}