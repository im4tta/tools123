// Provenance record for the public works glossary terms (kept separate from the term data so pages that only
// need the credit, such as the Acknowledgements page, do not import ~700 terms).

/**
 * Machine-readable provenance (shape from READFIRST.md "Required Metadata Shape").
 * The source below was named by the Tools123 maintainer. The page could not be opened from the build
 * environment, so the document title, date, authorship and reuse terms are unverified: `license` is
 * deliberately left unset and the tool shows "Provenance Pending" for it.
 */
export const PUBLIC_WORKS_PROVENANCE = {
  status: "adapted" as const,
  creator: "Ministry of Public Works and Transport (MPWT), Cambodia (as named by the Tools123 maintainer)",
  origin: "MPWT Glossary, supplied by the Tools123 maintainer as a Markdown table (A-B), Python data scripts plus a CSV (C-J), and a Markdown file plus OCR-style text files (K-Z).",
  originalProject: "MPWT Glossary",
  sources: ["https://www.mpwt.gov.kh/kh/documents/other/838"],
  license: undefined as string | undefined,
  notes:
    "Terms and definitions are reproduced as supplied, with the small corrections listed in each data module's header. " +
    "The ministry page was not reachable from the build environment, so the document title, date, authorship and reuse terms are unconfirmed. " +
    "The C-J file names (gemini-code-*.py) indicate the tables passed through Gemini-generated scripts; whether any text was machine-extracted or machine-translated is unknown. " +
    "The N-Z text files are OCR output: about 20 run-on blocks were skipped, some entries were dropped, and English definitions with detectable OCR errors are withheld (the Khmer definition is kept). Real-word OCR errors cannot be detected automatically, so the English text in N-Z should be spot-checked against the original document. " +
    "Not published or endorsed by MPWT.",
};
