"use client";

import { useCallback, useEffect, useState } from "react";

const PREFIX = "toolbox123:";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * SSR-safe localStorage-backed state. Reads on mount (client only),
 * writes on every change, and stays in sync across tabs via the
 * `storage` event.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const fullKey = `${PREFIX}${key}`;
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Intentional one-time hydration read from localStorage after mount (SSR-safe).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(safeParse<T>(window.localStorage.getItem(fullKey), initial));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === fullKey) {
        setValue(safeParse<T>(e.newValue, initial));
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(fullKey, JSON.stringify(resolved));
        } catch {
          // storage full or unavailable — ignore, state still updates in-memory
        }
        return resolved;
      });
    },
    [fullKey]
  );

  const clear = useCallback(() => {
    window.localStorage.removeItem(fullKey);
    setValue(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey]);

  return { value, setValue: update, clear, hydrated } as const;
}

/** Plain read/write helpers for use outside React (event handlers, effects). */
export const storage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    return safeParse<T>(window.localStorage.getItem(`${PREFIX}${key}`), fallback);
  },
  set<T>(key: string, value: T) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
    } catch {
      // ignore
    }
  },
  remove(key: string) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(`${PREFIX}${key}`);
  },
};

export const STORAGE_KEYS = {
  theme: "theme",
  favorites: "favorites",
  recents: "recents",
  viewpoint: "viewpoint",
  viewMode: "viewMode",
  language: "language",
  toolState: (id: string) => `tool:${id}`,
} as const;

/**
 * Per-tool persisted state. Each tool keeps a single state object under its
 * own localStorage key (`toolbox123:tool:<id>`), so switching away and back
 * — or reloading the page entirely — restores exactly what was typed in.
 * Mirrors the useState(initial) signature so it's a drop-in replacement.
 */
export function useToolState<T>(id: string, initial: T) {
  const { value, setValue } = useLocalStorage<T>(STORAGE_KEYS.toolState(id), initial);
  return [value, setValue] as const;
}
