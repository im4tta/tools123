// Verification suite for lib/glossary-hub.ts. Run with: node tests/glossary-hub.test.mjs
import assert from "node:assert";
import { buildGroups, groupKeyOf, neighbours, normalizeTerm, relatedGroups, searchGroups } from "../lib/glossary-hub.ts";

let passed = 0;
function check(name, fn) {
  try { fn(); passed++; } catch (err) { console.error(`FAIL: ${name}`); console.error(err?.message ?? err); process.exitCode = 1; }
}

const entries = [
  { source: "mowram", id: "3438", term: "Watershed/Catchment", km: "ទីជម្រាលទឹកភ្លៀង ឬផ្ទៃរងទឹកភ្លៀង", no: 3438 },
  { source: "climate", id: "c1", term: "Watershed", km: "ជម្រាលទឹកភ្លៀង", defKm: "ផ្ទៃដីទាំងអស់…" },
  { source: "mpwt", id: "Watershed", term: "Watershed", km: "ទីជម្រាលថ្នក់ទឹក" },
  { source: "mowram", id: "3439", term: "Watershed area", km: "តំបន់ទីជម្រាលទឹកភ្លៀង", no: 3439 },
  { source: "mowram", id: "1256", term: "Flood", km: "ជំនន់ ឬទឹកជំនន់" },
  { source: "climate", id: "c2", term: "Flood", km: "ទឹកជំនន់" },
  { source: "mpwt", id: "Bar(river)", term: "Bar(river)", km: "ដីសណ្ត" },
  { source: "french", id: "1", term: "café", km: "កាហ្វេ", extra: "kafe Coffee", groupKey: "fr:cafe" },
  { source: "climate", id: "c3", term: "Biodiversity", km: "ជីវៈចម្រុះ" },
  { source: "mpwt", id: "Biodiversity", term: "Biodiversity", km: "ជីវៈ ចម្រុះ" },
];
const groups = buildGroups(entries);
const byKey = (k) => groups.find((g) => g.key === k);

check("normalizeTerm drops brackets, case and accents", () => assert.equal(normalizeTerm("Bar (River) Café"), "bar cafe"));
check("normalizeTerm keeps Khmer", () => assert.equal(normalizeTerm("ទឹកជំនន់"), "ទឹកជំនន់"));
check("groupKeyOf uses the first / alternative", () => assert.equal(groupKeyOf(entries[0]), "watershed"));
check("groupKeyOf honours an explicit groupKey", () => assert.equal(groupKeyOf(entries[7]), "fr:cafe"));
check("watershed groups three sources", () => assert.deepEqual(byKey("watershed").sources.sort(), ["climate", "mowram", "mpwt"]));
check("watershed has three distinct Khmer terms", () => assert.equal(byKey("watershed").distinctKm, 3));
check("title is the shortest spelling", () => assert.equal(byKey("watershed").title, "Watershed"));
check("Khmer spacing differences are the same wording", () => assert.equal(byKey("biodiversity").distinctKm, 1));
check("bracketed qualifier is ignored for grouping", () => assert.ok(byKey("bar")));
check("groups are sorted A–Z", () => assert.deepEqual(groups.map((g) => g.key), [...groups.map((g) => g.key)].sort((a, b) => a.localeCompare(b))));
check("empty query returns nothing", () => assert.equal(searchGroups(groups, "   ").length, 0));
check("exact match ranks first", () => assert.equal(searchGroups(groups, "watershed")[0].key, "watershed"));
check("prefix match is included after exact", () => assert.deepEqual(searchGroups(groups, "watershed").map((g) => g.key), ["watershed", "watershed area"]));
check("search is case- and accent-insensitive", () => assert.equal(searchGroups(groups, "CAFE")[0].key, "fr:cafe"));
check("search finds Khmer text", () => assert.equal(searchGroups(groups, "ជីវៈចម្រុះ")[0].key, "biodiversity"));
check("search finds extra text", () => assert.equal(searchGroups(groups, "coffee")[0].key, "fr:cafe"));
check("source filter keeps only groups with that source", () => assert.deepEqual(searchGroups(groups, "flood", "mpwt"), []));
check("no match returns nothing", () => assert.equal(searchGroups(groups, "zzzz").length, 0));
check("limit is respected", () => assert.equal(searchGroups(groups, "a", undefined, 2).length, 2));
check("related finds longer headwords", () => assert.deepEqual(relatedGroups(groups, byKey("watershed")).map((g) => g.key), ["watershed area"]));
check("related returns nothing for unknown short keys", () => assert.deepEqual(relatedGroups(groups, byKey("bar")), []));
check("neighbours include the group itself", () => assert.ok(neighbours(groups, byKey("flood"), 1).includes(byKey("flood"))));

console.log(`${passed} checks passed`);
