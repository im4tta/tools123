// Shared Khmer text segmentation helpers, built on the browser's Unicode
// segmenter (ICU) so results match the platform's own line-breaking. Used by
// the Syllable Splitter, Speech Time Estimator, and Subtitle Chunker. These are
// approximate for edge cases — Khmer has no spaces, so grapheme/word boundaries
// come from ICU's dictionary, not a bespoke word list.

const KHMER_LETTER = /[ក-ឳ]/; // consonants + independent vowels

/** Splits text into orthographic clusters (base consonant + coeng stack + signs). */
export function splitClusters(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter("km", { granularity: "grapheme" });
    return [...seg.segment(text)].map((s) => s.segment).filter((s) => s.trim().length > 0 || s === " ");
  }
  return [...text];
}

/** Splits text into words using ICU's Khmer dictionary segmenter (word granularity). */
export function splitWords(text: string): { text: string; isWord: boolean }[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter("km", { granularity: "word" });
    return [...seg.segment(text)].map((s) => ({ text: s.segment, isWord: Boolean((s as { isWordLike?: boolean }).isWordLike) }));
  }
  return text.split(/(\s+)/).filter(Boolean).map((t) => ({ text: t, isWord: !/^\s+$/.test(t) }));
}

/**
 * Approximate count of spoken syllables: each Khmer orthographic cluster counts
 * as one, each Latin word as one, and each digit as one (numbers are usually
 * read digit-by-digit). This is an estimate, not a linguistic guarantee.
 */
export function countSpokenSyllables(text: string): number {
  let count = 0;
  for (const c of splitClusters(text)) if (KHMER_LETTER.test(c)) count += 1;
  const latin = text.match(/[A-Za-z]+/g);
  if (latin) count += latin.length;
  const digits = text.match(/[0-9០-៩]/g);
  if (digits) count += digits.length;
  return count;
}

/** Counts sentence-ending marks (Khmer ។ ៕ plus . ! ?) for pause timing. */
export function countSentences(text: string): number {
  const marks = text.match(/[។៕.!?]+/g);
  return marks ? marks.length : 0;
}
