// Public works glossary: combines the supplied batches (the shared provenance record is in public-works-provenance.ts).
// To add the next batch (e.g. K-Z), generate its module, import it here and append it to BATCHES.

import { PUBLIC_WORKS_AB_TERMS, type PublicWorksTerm } from "@/lib/data/public-works-glossary-ab";
import { PUBLIC_WORKS_CJ_TERMS } from "@/lib/data/public-works-glossary-cj";

export type { PublicWorksTerm };

const BATCHES = [
  { from: "A", to: "B", terms: PUBLIC_WORKS_AB_TERMS },
  { from: "C", to: "J", terms: PUBLIC_WORKS_CJ_TERMS },
] as const;

export const PUBLIC_WORKS_TERMS: PublicWorksTerm[] = BATCHES.flatMap((batch) => batch.terms);

/** Letter range covered so far, e.g. "A–J". */
export const PUBLIC_WORKS_COVERAGE = `${BATCHES[0].from}–${BATCHES[BATCHES.length - 1].to}`;
