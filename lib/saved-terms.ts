// Saved glossary terms, shared by every glossary and the Glossaries hub. Kept in this browser only.
// Each entry remembers which glossary it came from (tool = the glossary's storage prefix) and its own entry id there,
// plus the English and Khmer so the hub can list it without loading that glossary.
import { useSyncExternalStore } from "react";
import { storage } from "@/lib/storage";

export interface SavedTerm {
  tool: string;
  id: string;
  term: string;
  km: string;
}

const KEY = "savedTerms";
const EVENT = "toolbox:saved-terms";
const EMPTY: SavedTerm[] = [];
let cache: { raw: string | null; list: SavedTerm[] } = { raw: null, list: EMPTY };

function read(): SavedTerm[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(`toolbox123:${KEY}`);
  if (raw === cache.raw) return cache.list;
  const parsed = storage.get<unknown>(KEY, []);
  const list = Array.isArray(parsed) ? parsed.filter((x): x is SavedTerm => !!x && typeof x.tool === "string" && typeof x.id === "string") : EMPTY;
  cache = { raw, list };
  return list;
}

function write(list: SavedTerm[]) {
  storage.set(KEY, list);
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useSavedTerms(): SavedTerm[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const savedKey = (tool: string, id: string) => `${tool}\u0000${id}`;

export function toggleSavedTerm(entry: SavedTerm) {
  const list = read();
  const k = savedKey(entry.tool, entry.id);
  write(list.some((x) => savedKey(x.tool, x.id) === k) ? list.filter((x) => savedKey(x.tool, x.id) !== k) : [entry, ...list]);
}

export function addSavedTerms(entries: SavedTerm[]) {
  const list = read();
  const have = new Set(list.map((x) => savedKey(x.tool, x.id)));
  const extra = entries.filter((x) => !have.has(savedKey(x.tool, x.id)));
  if (extra.length) write([...extra, ...list]);
}
