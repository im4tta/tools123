"use client";

import { createContext, ReactNode, useContext, useEffect } from "react";
import { STORAGE_KEYS, useLocalStorage } from "@/lib/storage";

export type LanguageMode = "en" | "km" | "bi";

type LanguageContextValue = {
  mode: LanguageMode;
  setMode: (mode: LanguageMode) => void;
  text: (en: string, km: string) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  mode: "bi",
  setMode: () => {},
  text: (en, km) => `${en} / ${km}`,
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
    document.documentElement.lang = mode === "km" ? "km" : "en";
    document.documentElement.dataset.language = mode;
  }, [mode]);
  const text = (en: string, km: string) => mode === "en" || en === km ? en : mode === "km" ? km : `${en} / ${km}`;
  return <LanguageContext.Provider value={{ mode, setMode, text }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
