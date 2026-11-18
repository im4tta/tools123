// Shareable glossary links: stable, readable URL slugs for terms ("?term=abutment") and helpers to read/write them.
// Pure functions (no React, no window access except where a parameter is passed in) so they can be unit-tested.

export const TERM_PARAM = "term";

/** "Annual Average Daily Traffic (AADT)" -> "annual-average-daily-traffic-aadt". Always returns a non-empty ASCII slug. */
export function slugify(text: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "term";
}

export interface SlugInput {
  id: string;
  term: string;
  /** Category; used to tell apart terms that share a headword (e.g. "Berm" in two categories). */
  tag?: string;
  /** Position in the original data order, so slugs do not depend on how the list is sorted. */
  order: number;
}

/**
 * One unique slug per entry. A headword that is unique keeps its plain slug. When several entries share one
 * ("Berm", "Degree of saturation (DOS)") each gets the category appended, and entries that still collide are
 * numbered from the second one on, in data order. Adding unrelated entries never changes an existing slug.
 */
export function assignSlugs(items: SlugInput[]): Map<string, string> {
  const groups = new Map<string, SlugInput[]>();
  for (const item of items) {
    const base = slugify(item.term);
    const group = groups.get(base);
    if (group) group.push(item);
    else groups.set(base, [item]);
  }
  const out = new Map<string, string>();
  const taken = new Set<string>();
  const claim = (item: SlugInput, wanted: string) => {
    let slug = wanted;
    for (let n = 2; taken.has(slug); n++) slug = `${wanted}-${n}`;
    taken.add(slug);
    out.set(item.id, slug);
  };
  for (const [base, group] of groups) {
    if (group.length === 1) {
      claim(group[0], base);
      continue;
    }
    for (const item of [...group].sort((a, b) => a.order - b.order)) claim(item, item.tag ? `${base}-${slugify(item.tag)}` : base);
  }
  return out;
}

/** The term slug in a URL query string ("?term=abutment"), or null. */
export function readTermParam(search: string): string | null {
  const value = new URLSearchParams(search).get(TERM_PARAM);
  return value && /^[a-z0-9-]+$/.test(value) ? value : null;
}

/** The same URL with the term parameter set (or removed when slug is null); other parameters and the hash are kept. */
export function withTermParam(href: string, slug: string | null): string {
  const url = new URL(href, "http://local.invalid");
  if (slug) url.searchParams.set(TERM_PARAM, slug);
  else url.searchParams.delete(TERM_PARAM);
  return url.pathname + url.search + url.hash;
}

/** Absolute link to one entry of a glossary tool page. */
export function termUrl(origin: string, toolPath: string, slug: string): string {
  return `${origin.replace(/\/$/, "")}${withTermParam(toolPath, slug)}`;
}
