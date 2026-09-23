"use client";

import type { ReactNode } from "react";
import { useLanguage } from "@/components/LanguageProvider";

/** The localized "Source & Credits" footer box shown at the bottom of a tool. */
export function SourceCredits({ children }: { children: ReactNode }) {
  const { text: t } = useLanguage();
  return (
    <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
      <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
      {children}
    </section>
  );
}
