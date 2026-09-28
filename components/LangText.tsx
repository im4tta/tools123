"use client";

import { useLanguage } from "@/components/LanguageProvider";

/**
 * Text with English, Khmer and bilingual variants rendered side by side and chosen by CSS from
 * <html data-language> (set before paint by lib/language-init.ts). Use it for large above-the-fold
 * text, where swapping the string after hydration would shift the page. Other languages fall back
 * to the usual t() string.
 */
export function LangText({ en, km }: { en: string; km: string }) {
  const { mode, text: t } = useLanguage();
  if (mode !== "en" && mode !== "km" && mode !== "bi") return <>{t(en, km)}</>;
  if (en === km) return <>{en}</>;
  return (
    <>
      <span className="lang-only-en">{en}</span>
      <span className="lang-only-km">{km}</span>
      <span className="lang-only-bi">{`${en} / ${km}`}</span>
    </>
  );
}
