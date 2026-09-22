// Generate data/khmer-words.json — a de-duplicated list of common Khmer words
// used for the homepage search "did you mean…" autocomplete.
//
// Sourced from real bundled data, nothing invented:
//   • lib/khmer-lexicon-db.ts — Chuon Nath & Headley dictionary data
//     (headwords + homophones + synonyms + antonyms + related words).
//   • lib/khmer-pos-lexicon.ts — the common-word POS lexicon.
import { STATIC_DATABASE } from "../lib/khmer-lexicon-db.ts";
import { KHMER_POS } from "../lib/khmer-pos-lexicon.ts";
import { writeFileSync } from "node:fs";

const KH_ONLY = /^[ក-៿]+$/;
const words = new Set();
const add = (w) => {
  if (typeof w !== "string") return;
  const t = w.trim();
  const len = [...t].length;
  if (KH_ONLY.test(t) && len >= 2 && len <= 12) words.add(t);
};

for (const [key, entry] of Object.entries(STATIC_DATABASE)) {
  add(key);
  add(entry.word);
  for (const h of entry.homophones ?? []) add(h.word);
  for (const s of entry.synonyms ?? []) add(s);
  for (const a of entry.antonyms ?? []) add(a);
  for (const r of entry.relatedWords ?? []) add(r);
}
for (const k of Object.keys(KHMER_POS)) add(k);

// Sort shorter-first then by Khmer collation, so autocomplete favours base words.
const list = [...words].sort((a, b) => [...a].length - [...b].length || a.localeCompare(b, "km"));
writeFileSync("data/khmer-words.json", JSON.stringify(list));
console.log(`wrote data/khmer-words.json — ${list.length} words`);
