"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { STORAGE_KEYS, useLocalStorage } from "@/lib/storage";
import { LANGUAGES, type LanguageMode } from "@/lib/i18n";
import { uiKm } from "@/lib/i18n-ui";

export type { LanguageMode } from "@/lib/i18n";

type LanguageContextValue = {
  mode: LanguageMode;
  setMode: (mode: LanguageMode) => void;
  /** Explicit bilingual pair (English + Khmer), resolved by the active mode. */
  text: (en: string, km: string) => string;
  /** Auto-resolves any English string through the shared dictionaries. */
  ui: (value: string) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  mode: "bi",
  setMode: () => {},
  text: (en, km) => `${en} / ${km}`,
  ui: (value) => value,
});

function readLocaleCookie(): LanguageMode | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith("tb-locale="));
  if (!match) return null;
  const value = match.slice("tb-locale=".length);
  return value === "en" || value === "km" ? value : null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { value: mode, setValue: setMode } = useLocalStorage<LanguageMode>(STORAGE_KEYS.language, "bi");
  // Lazily-loaded dictionary for the active non-EN/KM language. Keyed by the
  // English string; missing entries fall back to English (progressive i18n).
  const [dict, setDict] = useState<Record<string, string>>({});

  useEffect(() => {
    // If the user has never chosen a language, honour the geo-routed locale.
    if (typeof window !== "undefined" && window.localStorage.getItem("toolbox123:language") === null) {
      const cookieLocale = readLocaleCookie();
      if (cookieLocale) {
        setMode(cookieLocale);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode === "en" || mode === "km" || mode === "bi") {
      let alive = true;
      Promise.resolve().then(() => {
        if (alive) setDict({});
      });
      return () => {
        alive = false;
      };
    }
    let alive = true;
    import(`@/lib/i18n/dicts/${mode}`)
      .then((m) => {
        if (alive) setDict((m.default ?? {}) as Record<string, string>);
      })
      .catch(() => {
        if (alive) setDict({});
      });
    return () => {
      alive = false;
    };
  }, [mode]);

  useEffect(() => {
    if (mode === "bi") {
      document.documentElement.lang = "km";
      document.documentElement.dataset.script = "khmer";
    } else {
      const lang = LANGUAGES.find((l) => l.id === mode);
      if (lang) {
        document.documentElement.lang = lang.bcp47;
        document.documentElement.dataset.script = lang.script;
      }
    }
    document.documentElement.dataset.language = mode;
  }, [mode]);

  const text = (en: string, km: string) => {
    if (mode === "en" || en === km) return en;
    if (mode === "km") return km;
    if (mode === "bi") return `${en} / ${km}`;
    return dict[en] ?? en;
  };

  const ui = (value: string) => {
    if (mode === "en") return value;
    const km = uiKm(value);
    if (mode === "km") return km ?? value;
    if (mode === "bi") return `${value} / ${km ?? value}`;
    return dict[value] ?? value;
  };

  return <LanguageContext.Provider value={{ mode, setMode, text, ui }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}