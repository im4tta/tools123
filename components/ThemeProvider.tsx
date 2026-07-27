"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";
const THEME_KEY = "toolbox123:theme";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void; setTheme: (t: Theme) => void }>({
  theme: "dark",
  toggle: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY) as Theme | null;
    const preferred: Theme =
      stored ?? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    // Intentional one-time hydration read after mount (SSR-safe).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(preferred);
    document.documentElement.setAttribute("data-theme", preferred);
    document.documentElement.style.colorScheme = preferred;
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

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return <ThemeContext.Provider value={{ theme, toggle, setTheme }}>{children}</ThemeContext.Provider>;
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
  } catch (e) {}
})();
`;
