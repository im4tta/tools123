// Khmer orthographic clusters: a base consonant (or independent vowel) with its whole coeng stack
// and the vowel signs and marks written around it, e.g. ស្ត្រី is one cluster.
//
// Unicode's extended grapheme clusters (UAX #29, which Intl.Segmenter implements) do not join a
// coeng (U+17D2) to the consonant after it, so Chromium and Node split ស្ត្រី into ស្ | ត្ | រី.
// This module merges those pieces back. No imports, so Node can run it directly in tests.

const COENG = "្";
const KHMER_CONSONANT = /^[ក-អ]/;
// Dependent vowels, signs and the coeng itself: they attach to the cluster before them.
const KHMER_DEPENDENT = /^[ា-៓៝]/;

let segmenter: Intl.Segmenter | null | undefined;

function graphemeSegments(text: string): string[] {
  if (segmenter === undefined) segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("km", { granularity: "grapheme" }) : null;
  return segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : [...text];
}

/** Splits text into user-perceived characters, keeping each Khmer cluster (coeng stack included) whole. */
export function khmerClusters(text: string): string[] {
  const out: string[] = [];
  for (const segment of graphemeSegments(text)) {
    const prev = out[out.length - 1];
    const attaches = prev !== undefined && ((prev.endsWith(COENG) && KHMER_CONSONANT.test(segment)) || KHMER_DEPENDENT.test(segment));
    if (attaches) out[out.length - 1] = prev + segment;
    else out.push(segment);
  }
  return out;
}
