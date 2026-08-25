"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";
const THEME_KEY = "toolbox123:theme";

/** Accent themes named after Cambodian places; layered on top of dark/light. */
export type Accent = "classic" | "angkor" | "tonlesap" | "mekong" | "kohrong" | "preahvihear" | "bokor" | "kampot" | "battambang" | "sihanoukville";
export const ACCENTS: { id: Accent; label: string; km: string; swatch: string }[] = [
  { id: "classic", label: "Classic", km: "ក្បាលដើម", swatch: "#c9a24b" },
  { id: "angkor", label: "Angkor", km: "អង្គរ", swatch: "#d4a94e" },
  { id: "tonlesap", label: "Tonlé Sap", km: "ទន្លេសាប", swatch: "#46b5cf" },
  { id: "mekong", label: "Mekong", km: "ទន្លេមេគង្គ", swatch: "#52b788" },
  { id: "kohrong", label: "Koh Rong", km: "កោះរ៉ុង", swatch: "#2ec4b6" },
  { id: "preahvihear", label: "Preah Vihear", km: "ព្រះវិហារ", swatch: "#9d8cd8" },
  { id: "bokor", label: "Bokor", km: "បូកគោ", swatch: "#93a8bd" },
  { id: "kampot", label: "Kampot", km: "កំពត", swatch: "#d99a4e" },
  { id: "battambang", label: "Battambang", km: "បាត់ដំបង", swatch: "#cf7a54" },
  { id: "sihanoukville", label: "Sihanoukville", km: "ព្រះសីហនុ", swatch: "#58a6e8" },
];

const ACCENT_KEY = "toolbox123:accent";

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || Boolean(target.closest("input, textarea, select, [contenteditable='true']")));
}

const ThemeContext = createContext<{ theme: Theme; toggle: () => void; setTheme: (t: Theme) => void; accent: Accent; setAccent: (a: Accent) => void }>({
  theme: "dark",
  toggle: () => {},
  setTheme: () => {},
  accent: "classic",
  setAccent: () => {},
});

function applyAccent(accent: Accent) {
  if (accent === "classic") document.documentElement.removeAttribute("data-accent");
  else document.documentElement.setAttribute("data-accent", accent);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [accent, setAccentState] = useState<Accent>("classic");

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY) as Theme | null;
    const preferred: Theme =
      stored ?? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    // Intentional one-time hydration read after mount (SSR-safe).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(preferred);
    document.documentElement.setAttribute("data-theme", preferred);
    document.documentElement.style.colorScheme = preferred;
    const storedAccent = (window.localStorage.getItem(ACCENT_KEY) as Accent | null) ?? "classic";
    setAccentState(storedAccent);
    applyAccent(storedAccent);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.style.colorScheme = t;
    try {
      window.localStorage.setItem(THEME_KEY, t);
    } catch {
      // ignore
    }
  }, []);

  const setAccent = useCallback((a: Accent) => {
    setAccentState(a);
    applyAccent(a);
    try {
      window.localStorage.setItem(ACCENT_KEY, a);
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || isEditableTarget(event.target)) return;
      if (event.key.toLowerCase() !== "t") return;
      event.preventDefault();
      toggle();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return <ThemeContext.Provider value={{ theme, toggle, setTheme, accent, setAccent }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Inline script injected before hydration so the correct theme applies with no flash of wrong theme. */
export const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('${THEME_KEY}');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    var accent = localStorage.getItem('${ACCENT_KEY}');
    if (accent && accent !== 'classic') document.documentElement.setAttribute('data-accent', accent);
  } catch (e) {}
})();
`;
