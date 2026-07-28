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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { value: mode, setValue: setMode } = useLocalStorage<LanguageMode>(STORAGE_KEYS.language, "bi");
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
