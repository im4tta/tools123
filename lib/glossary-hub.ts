// Search engine for the Glossaries hub (components/tools/khmer/glossaries.tsx).
// Entries from every source glossary are grouped by their English headword, so one result shows how each source
// renders the same term. Kept free of path aliases and data imports so it can be unit-tested with plain Node
// (tests/glossary-hub.test.mjs); the source data is adapted in lib/glossary-hub-data.ts.

export interface HubEntry {
  /** Source id (see HUB_SOURCES in lib/glossary-hub-data.ts). */
  source: string;
  /** Unique within the source. */
  id: string;
  /** English headword as the source gives it ("Watershed/Catchment"); for French loanwords, the French word. */
  term: string;
  km: string;
  defEn?: string;
  defKm?: string;
  /** Entry number in the source, when it has one. */
  no?: number;
  /** Extra text the search box also matches (pronunciation, English meaning of a French word…). */
  extra?: string;
  /** Group by this key instead of the English headword (French loanwords are grouped by French word). */
  groupKey?: string;
}

export interface HubGroup {
  key: string;
  /** Display headword: the shortest spelling among the group's entries. */
  title: string;
  entries: HubEntry[];
  /** Number of distinct Khmer terms across the group's sources. */
  distinctKm: number;
  sources: string[];
  haystack: string;
}

/** Lower-case, accents and bracketed qualifiers removed, punctuation collapsed: "Bar (river)" -> "bar". */
export function normalizeTerm(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9ក-៿]+/g, " ")
    .trim();
}

/** The grouping key: the first "/" alternative of the headword, normalized ("Watershed/Catchment" -> "watershed"). */
export function groupKeyOf(entry: HubEntry): string {
  return entry.groupKey ?? normalizeTerm(entry.term.split("/")[0]);
}

/** Khmer terms compared without spaces, so "ទឹក ជំនន់" and "ទឹកជំនន់" count as the same wording. */
const kmKey = (km: string) => km.replace(/\s+/g, "");

const fold = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function buildGroups(entries: HubEntry[]): HubGroup[] {
  const map = new Map<string, HubEntry[]>();
  for (const entry of entries) {
    const key = groupKeyOf(entry);
    if (!key) continue;
    const list = map.get(key);
    if (list) list.push(entry);
    else map.set(key, [entry]);
  }
  const groups: HubGroup[] = [];
  for (const [key, list] of map) {
    const title = [...list].map((e) => e.term).sort((a, b) => a.length - b.length || a.localeCompare(b))[0];
    groups.push({
      key,
      title,
      entries: list,
      distinctKm: new Set(list.map((e) => kmKey(e.km))).size,
      sources: [...new Set(list.map((e) => e.source))],
      haystack: fold(list.map((e) => [e.term, e.km, e.extra ?? ""].join(" ")).join(" ")),
    });
  }
  return groups.sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Groups matching the query, best first: exact headword, then headword prefix, then a word in the headword starting
 * with the query, then anywhere in the terms (English, Khmer or extra text). Ties go to groups found in more sources.
 * An empty query matches nothing. sourceFilter limits results to groups that include that source.
 */
export function searchGroups(groups: HubGroup[], query: string, sourceFilter?: string, limit = 60): HubGroup[] {
  const q = fold(query.trim());
  if (!q) return [];
  const nq = normalizeTerm(query);
  const scored: { group: HubGroup; score: number }[] = [];
  for (const group of groups) {
    if (sourceFilter && !group.sources.includes(sourceFilter)) continue;
    let score: number;
    if (nq && group.key === nq) score = 0;
    else if (nq && group.key.startsWith(nq)) score = 1;
    else if (nq && ` ${group.key}`.includes(` ${nq}`)) score = 2;
    else if (group.haystack.includes(q)) score = 3;
    else continue;
    scored.push({ group, score });
  }
  scored.sort((a, b) => a.score - b.score || b.group.sources.length - a.group.sources.length || a.group.key.length - b.group.key.length || a.group.key.localeCompare(b.group.key));
  return scored.slice(0, limit).map((s) => s.group);
}

/** Other groups whose headword starts with this one's first word ("watershed" -> "watershed area"), up to max. */
export function relatedGroups(groups: HubGroup[], group: HubGroup, max = 8): HubGroup[] {
  const head = group.key.split(" ")[0];
  if (!head || head.length < 3) return [];
  return groups.filter((g) => g !== group && (g.key === head || g.key.startsWith(`${head} `))).slice(0, max);
}

/** The groups just before and after this one in A–Z order, for the side list. */
export function neighbours(groups: HubGroup[], group: HubGroup, each = 4): HubGroup[] {
  const i = groups.indexOf(group);
  if (i < 0) return [];
  return groups.slice(Math.max(0, i - each), i + each + 1);
}
