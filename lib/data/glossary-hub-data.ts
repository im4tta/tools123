// Adapts every glossary dataset to the Glossaries hub's entry shape (lib/glossary-hub.ts) and describes each source:
// its name, colour, the tool that holds the full glossary, and how to cite an entry. Citations use only the facts
// recorded in each source's provenance file; they are a convenience, not an official citation format.

import type { HubEntry } from "@/lib/glossary-hub";
import { CLIMATE_LEXICON_TERMS } from "@/lib/data/climate-lexicon";
import { FRENCH_LOANWORDS } from "@/lib/data/french-loanwords";
import { MOE_ENV_TERMS } from "@/lib/data/moe-env-lexicon";
import { MOWRAM_TERMS } from "@/lib/data/mowram-lexicon";
import { PUBLIC_WORKS_TERMS } from "@/lib/data/public-works-glossary";

export interface HubSource {
  id: string;
  name: string;
  nameKm: string;
  /** Short publisher label for chips and cards. */
  publisher: string;
  /** Edition / year line, or "" when unknown. */
  edition: string;
  /** CSS colour for the source's dot and card edge. */
  color: string;
  /** Tool that holds the full glossary. */
  toolId: string;
  /** True when the list's origin or tags are unverified (shown on the card). */
  unverified?: boolean;
  cite: (entry: HubEntry) => string;
}

export const HUB_SOURCES: HubSource[] = [
  {
    id: "mowram",
    name: "Water Resources & Meteorology",
    nameKm: "ធនធានទឹក និងឧតុនិយម",
    publisher: "MOWRAM",
    edition: "Technical Lexicon, 1st ed. 2026",
    color: "#17798c",
    toolId: "construction-water-glossary",
    cite: (e) =>
      `Ministry of Water Resources and Meteorology (2026). Technical Lexicon on Water Resources, Irrigation, Hydrology and Meteorology (English – Khmer), 1st ed.${e.no ? `, No. ${e.no}` : ""}.`,
  },
  {
    id: "mpwt",
    name: "Public Works",
    nameKm: "សាធារណការ",
    publisher: "MPWT",
    edition: "MPWT Glossary",
    color: "#96690f",
    toolId: "construction-water-glossary",
    cite: (e) => `Ministry of Public Works and Transport. MPWT Glossary, entry “${e.term}”.`,
  },
  {
    id: "moe",
    name: "Environment & Natural Resources",
    nameKm: "បរិស្ថាន និងធនធានធម្មជាតិ",
    publisher: "MoE",
    edition: "Lexicon of the Code of Environment and Natural Resources",
    color: "#2a6e4f",
    toolId: "environment-glossary",
    cite: (e) => `Ministry of Environment. Lexicon of the Code of Environment and Natural Resources${e.no ? `, No. ${e.no}` : ""}.`,
  },
  {
    id: "climate",
    name: "Climate Change",
    nameKm: "ការប្រែប្រួលអាកាសធាតុ",
    publisher: "NCSD / MoE",
    edition: "Lexicon of Climate Change, 1st ed. 2017",
    color: "#4c5c8a",
    toolId: "climate-change-lexicon",
    cite: (e) =>
      `Climate Change Department, NCSD and Ministry of Environment, with the National Council of Khmer Language (2017). Lexicon of Climate Change, 1st ed., entry “${e.term}”.`,
  },
  {
    id: "french",
    name: "French loanwords",
    nameKm: "ពាក្យកម្ចីបារាំង",
    publisher: "Supplied list",
    edition: "Glossary of French Loanwords in Khmer",
    color: "#7a3f6e",
    toolId: "french-loanwords-glossary",
    unverified: true,
    cite: (e) => `Glossary of French Loanwords in Khmer (supplied list; compiler not named)${e.no ? `, No. ${e.no}` : ""}.`,
  },
];

export const HUB_SOURCE_BY_ID = new Map(HUB_SOURCES.map((s) => [s.id, s]));

const foldFr = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export const HUB_ENTRIES: HubEntry[] = [
  ...MOWRAM_TERMS.map((t) => ({ source: "mowram", id: String(t.no), term: t.en, km: t.km, defKm: t.defKm, no: t.no })),
  ...PUBLIC_WORKS_TERMS.map((t, i) => ({
    source: "mpwt",
    id: String(i + 1),
    term: t.en,
    km: t.km,
    defEn: t.enDefWithheld ? undefined : t.defEn,
    defKm: t.defKm,
  })),
  ...MOE_ENV_TERMS.map((t) => ({ source: "moe", id: String(t.no), term: t.en, km: t.km, defKm: t.defKm, no: t.no })),
  ...CLIMATE_LEXICON_TERMS.map((t, i) => ({
    source: "climate",
    id: String(i + 1),
    // Abbreviation rows are stored as "AAU — Assigned Amount Unit"; list them under the full name so they group with other sources.
    term: t.page === "abbr" ? t.en.replace(/^(.+?) — (.+)$/, "$2 ($1)") : t.en,
    km: t.km,
    defKm: t.def || undefined,
  })),
  ...FRENCH_LOANWORDS.map((t) => ({
    source: "french",
    id: String(t.no),
    term: t.fr,
    km: t.km,
    defEn: t.en,
    no: t.no,
    extra: `${t.roman} ${t.en}`,
    groupKey: `fr:${foldFr(t.fr)}`,
  })),
];

export const HUB_SOURCE_COUNTS: Record<string, number> = HUB_ENTRIES.reduce<Record<string, number>>((acc, e) => {
  acc[e.source] = (acc[e.source] ?? 0) + 1;
  return acc;
}, {});
