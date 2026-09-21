// Generate lib/khmer-pos-lexicon.ts from real, sourced data:
//   1. khmer-nlp-toolkit SEED_POS_DICTIONARY (vengmony, MIT) — curated common words
//   2. lib/khmer-lexicon-db.ts STATIC_DATABASE (Chuon Nath & Headley) — POS parsed
//      from the standard Khmer dictionary abbreviations in each definition.
// No POS is invented: every entry traces to one of those two sources.
import { SEED_POS_DICTIONARY } from "khmer-nlp-toolkit";
import { readFileSync, writeFileSync } from "node:fs";

// Canonical POS labels (English). Khmer labels live in the component.
const CANON = {
  Noun: "Noun", Verb: "Verb", Adjective: "Adjective", Adverb: "Adverb",
  Pronoun: "Pronoun", Preposition: "Preposition", Conjunction: "Conjunction",
  Particle: "Particle", Numeral: "Numeral", Number: "Number",
  Interjection: "Interjection",
};

const pos = {};
// 1) toolkit seed (array of [word, tag]) — highest priority (hand-curated)
let fromToolkit = 0;
for (const e of SEED_POS_DICTIONARY) {
  const [w, t] = Array.isArray(e) ? e : [e.word, e.tag];
  if (w && CANON[t]) { pos[w] = CANON[t]; fromToolkit++; }
}

// 2) lexicon-db: parse the leading POS abbreviation of each headword's definition.
// Standard Khmer dictionary POS markers (Chuon Nath): ន.=noun, កិ.=verb,
// គុ.=adjective, និ.=adverb, សព្វ.=pronoun, ធ្នាក់=preposition, ឈ្នាប់=conjunction,
// លេខ=numeral, ឧ.=interjection.
const ABBR = {
  "ន": "Noun", "កិ": "Verb", "គុ": "Adjective", "និ": "Adverb",
  "សព្វ": "Pronoun", "ធ្នាក់": "Preposition", "ឈ្នាប់": "Conjunction",
  "លេខ": "Numeral", "ឧ": "Interjection",
};
const src = readFileSync("lib/khmer-lexicon-db.ts", "utf8");
let fromLexicon = 0;
for (const block of src.split(/\n  "/).slice(1)) {
  const wm = block.match(/^([^"]+)":/);
  const dm = block.match(/definition:\s*"([^"]*)"/);
  if (!wm || !dm) continue;
  const word = wm[1];
  const pm = dm[1].match(/\(([^)\.]+)\.?\)/);
  if (pm && ABBR[pm[1]] && !(word in pos)) { pos[word] = ABBR[pm[1]]; fromLexicon++; }
}

// Emit sorted for a stable, reviewable diff.
const entries = Object.entries(pos).sort((a, b) => a[0].localeCompare(b[0], "km"));
const body = entries.map(([w, t]) => `  ${JSON.stringify(w)}: ${JSON.stringify(t)},`).join("\n");
const out = `// AUTO-GENERATED — do not edit by hand. Regenerate with scripts/gen-khmer-pos.mjs.
//
// Khmer word → part-of-speech lexicon, merged from two open sources:
//   • khmer-nlp-toolkit SEED_POS_DICTIONARY — Seanghay-adjacent community toolkit
//     (github:vengmony/khmer-nlp-toolkit, MIT). Hand-curated common words.
//   • The offline Chuon Nath & Headley dictionary data in lib/khmer-lexicon-db.ts,
//     with the part of speech parsed from each entry's standard grammar
//     abbreviation (ន.=noun, កិ.=verb, គុ.=adjective, និ.=adverb, សព្វ.=pronoun,
//     ធ្នាក់=preposition, ឈ្នាប់=conjunction, លេខ=numeral, ឧ.=interjection).
//
// No part of speech is invented here — each entry traces to one of those sources.
// Coverage is common vocabulary only; rare/technical words fall through to
// shape-based tagging (digits, Latin, punctuation) or "Unknown" in the tool.

export const KHMER_POS: Record<string, string> = {
${body}
};

export const KHMER_POS_COUNT = ${entries.length};
`;
writeFileSync("lib/khmer-pos-lexicon.ts", out);
console.log(`toolkit: ${fromToolkit}, lexicon: ${fromLexicon}, total: ${entries.length}`);
// quick POS histogram
const hist = {};
for (const [, t] of entries) hist[t] = (hist[t] || 0) + 1;
console.log("histogram:", JSON.stringify(hist));
