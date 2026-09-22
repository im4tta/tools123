// Shared Khmer text-analysis helpers, reused across the Khmer NLP tools so the
// segmentation / sentence / stopword logic lives in one place.
//
// Built on the Khmer open-source ecosystem:
//   • split-khmer (Seanghay Yath, MIT) — word segmentation
//   • khmer-nlp-toolkit (github:vengmony, MIT) — text normalisation
//   • lib/khmer-pos-lexicon.ts — the offline common-word POS lexicon
//     (khmer-nlp-toolkit seed + Chuon Nath & Headley), used to recover glued
//     word boundaries and to know which words are grammatical "function" words.

import { split as splitKhmer } from "split-khmer";
import { normalize } from "khmer-nlp-toolkit";
import { KHMER_POS } from "./khmer-pos-lexicon";

/** Matches any character in the Khmer Unicode block. */
export const KHMER_ANY = /[ក-៿]/;
/** A base letter that starts an orthographic syllable (consonant / independent vowel). */
const KHMER_BASE = /[ក-អឥ-ឳ]/;

const MAX_WORD_LEN = Object.keys(KHMER_POS).reduce((m, w) => Math.max(m, [...w].length), 1);

/** Clean invisible characters and re-order malformed clusters. */
export function normalizeKhmer(text: string): string {
  return normalize(text);
}

// The segmenter occasionally glues two dictionary words into one chunk; when a
// chunk isn't itself a known word, try to cover it exactly with a longest-match
// over the lexicon and only accept a split into two-or-more known words.
function decompose(tok: string): string[] | null {
  const chars = [...tok];
  const out: string[] = [];
  let i = 0;
  while (i < chars.length) {
    let matched: string | null = null;
    for (let L = Math.min(MAX_WORD_LEN, chars.length - i); L >= 1; L--) {
      const cand = chars.slice(i, i + L).join("");
      if (KHMER_POS[cand]) { matched = cand; break; }
    }
    if (!matched) return null;
    out.push(matched);
    i += [...matched].length;
  }
  return out.length > 1 ? out : null;
}

/** Segment text into Khmer words (punctuation and spaces dropped). */
export function segmentWords(text: string): string[] {
  const clean = normalizeKhmer(text);
  if (!KHMER_ANY.test(clean)) return [];
  const out: string[] = [];
  for (const chunk of splitKhmer(clean)) {
    for (const piece of chunk.split(/\s+/)) {
      if (!piece || !KHMER_ANY.test(piece)) continue;
      const parts = KHMER_POS[piece] ? null : decompose(piece);
      if (parts) out.push(...parts);
      else out.push(piece);
    }
  }
  return out;
}

/** Split text into sentences on Khmer/Latin enders and hard line breaks. */
export function splitSentences(text: string): string[] {
  return normalizeKhmer(text)
    .split(/(?<=[។៕!?])|\n+/)
    .map((s) => s.trim())
    .filter((s) => KHMER_ANY.test(s));
}

/** Count Khmer orthographic syllables (grapheme clusters with a base letter). */
export function khmerSyllables(text: string): number {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    let n = 0;
    for (const { segment } of new Intl.Segmenter("km", { granularity: "grapheme" }).segment(text)) {
      if (KHMER_BASE.test(segment)) n += 1;
    }
    return n;
  }
  return [...text].filter((c) => KHMER_BASE.test(c)).length;
}

// Grammatical "function" words (particles, prepositions, pronouns, conjunctions,
// numerals) — the words to exclude when finding the meaningful keywords of a text.
export const STOPWORDS: Set<string> = new Set(
  Object.entries(KHMER_POS)
    .filter(([, pos]) => pos === "Particle" || pos === "Preposition" || pos === "Pronoun" || pos === "Conjunction" || pos === "Numeral")
    .map(([word]) => word),
);

/** A word worth counting as content: Khmer, length ≥ 2 clusters-ish, not a stopword. */
export function isContentWord(word: string): boolean {
  return KHMER_ANY.test(word) && !STOPWORDS.has(word) && [...word].length > 1;
}
