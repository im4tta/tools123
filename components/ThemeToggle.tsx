"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/components/LanguageProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { text: t } = useLanguage();
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? t("Switch to light mode", "ប្តូរទៅផ្ទៃភ្លឺ") : t("Switch to dark mode", "ប្តូរទៅផ្ទៃងងឹត")}
      title={`${theme === "dark" ? t("Switch to light mode", "ប្តូរទៅផ្ទៃភ្លឺ") : t("Switch to dark mode", "ប្តូរទៅផ្ទៃងងឹត")} (T)`}
      className={`flex h-8 w-8 items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--ink)] ${className}`}
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
