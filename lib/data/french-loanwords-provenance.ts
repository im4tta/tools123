// Provenance record for the French loanwords glossary (kept separate from the term data so pages that only need
// the credit, such as the Acknowledgements page, do not import ~1,600 entries).

/**
 * Machine-readable provenance (shape from READFIRST.md "Required Metadata Shape").
 * The list was supplied by the Tools123 maintainer as one Markdown file titled "Verified Glossary of French
 * Loanwords in Khmer". Its compiler is not named, and its per-entry source tags have not been checked against
 * the dictionaries they cite, so the status is "unknown" and the tool shows "Provenance Pending".
 */
export const FRENCH_LOANWORDS_PROVENANCE = {
  status: "unknown" as const,
  creator: undefined as string | undefined,
  origin: "Markdown file supplied by the Tools123 maintainer (24 themed tables, entries 1–1633, with usage examples). Compiler not named.",
  originalProject: "Glossary of French Loanwords in Khmer (supplied list)",
  /** Works the list says it was cross-checked against (its own source tags); cited, not verified by Tools123. */
  citedWorks: [
    { tag: "CN 1967", en: "Chuon Nath, Khmer Dictionary (វចនានុក្រមខ្មែរ), 1967 — entries marked (បារ.)", km: "សម្តេចព្រះសង្ឃរាជ ជួន ណាត វចនានុក្រមខ្មែរ ១៩៦៧ — ពាក្យដែលមានសម្គាល់ (បារ.)" },
    { tag: "RAC", en: "Royal Academy of Cambodia and MoEYS standard terminology", km: "វាក្យសព្ទស្តង់ដាររាជបណ្ឌិត្យសភាកម្ពុជា និងក្រសួងអប់រំ យុវជន និងកីឡា" },
    { tag: "FR-KH", en: "Robert K. Headley, Cambodian-English Dictionary (1977), and documented Franco-Khmer usage", km: "Robert K. Headley វចនានុក្រមខ្មែរ-អង់គ្លេស (១៩៧៧) និងការប្រើប្រាស់បារាំង-ខ្មែរដែលមានឯកសារ" },
  ],
  sources: [] as string[],
  license: undefined as string | undefined,
  notes:
    "Reproduced as supplied, apart from removing Markdown emphasis. The list calls itself verified, but Tools123 has not checked its source tags; " +
    "spot checks found tags that look doubtful (e.g. 'kangourou', 'galaxie' and 'double-blanc' tagged as Chuon Nath 1967) and an index line that pairs ប៊ីយេរ with 'billet'. " +
    "Tags are shown as the list's own claims. Not published or endorsed by the Royal Academy of Cambodia, MoEYS, or the cited authors.",
};
