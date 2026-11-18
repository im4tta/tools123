// Verification suite for lib/glossary-share.ts. Run with: node tests/glossary-share.test.mjs
// Covers slug rules, duplicate headwords, stability, query-string helpers and absolute links.
import assert from "node:assert";
import { assignSlugs, readTermParam, slugify, termUrl, withTermParam } from "../lib/glossary-share.ts";

let passed = 0;
function check(name, fn) {
  try { fn(); passed++; } catch (err) { console.error(`FAIL: ${name}`); console.error(err?.message ?? err); process.exitCode = 1; }
}

check("slugify lower-cases and hyphenates", () => assert.equal(slugify("Annual Average Daily Traffic (AADT)"), "annual-average-daily-traffic-aadt"));
check("slugify handles & and slashes", () => assert.equal(slugify("QA/QC & Testing"), "qa-qc-and-testing"));
check("slugify strips accents and edge punctuation", () => assert.equal(slugify("  Chézy's formula! "), "chezy-s-formula"));
check("slugify never returns an empty slug", () => { assert.equal(slugify(""), "term"); assert.equal(slugify("ខ្មែរ"), "term"); assert.equal(slugify("(...)"), "term"); });
check("slugify output is URL-safe", () => assert.match(slugify("Weird – term / (x) ™ 100%"), /^[a-z0-9]+(-[a-z0-9]+)*$/));

check("unique headwords keep their plain slug", () => {
  const m = assignSlugs([{ id: "a", term: "Abutment", order: 0 }, { id: "b", term: "Culvert", order: 1 }]);
  assert.equal(m.get("a"), "abutment"); assert.equal(m.get("b"), "culvert");
});
check("same headword in two categories is told apart by category", () => {
  const m = assignSlugs([{ id: "a", term: "Berm", tag: "Road Construction", order: 0 }, { id: "b", term: "Berm", tag: "Public Works", order: 1 }]);
  assert.equal(m.get("a"), "berm-road-construction"); assert.equal(m.get("b"), "berm-public-works");
});
check("same headword in the same category is numbered in data order", () => {
  const m = assignSlugs([{ id: "x", term: "Degree of saturation (DOS)", tag: "Public Works", order: 7 }, { id: "y", term: "Degree of saturation (DOS)", tag: "Public Works", order: 3 }]);
  assert.equal(m.get("y"), "degree-of-saturation-dos-public-works"); assert.equal(m.get("x"), "degree-of-saturation-dos-public-works-2");
});
check("slugs are unique even when slugify collides across different spellings", () => {
  const m = assignSlugs([{ id: "1", term: "Wearing course", order: 0 }, { id: "2", term: "Wearing-course", order: 1 }, { id: "3", term: "wearing course!", order: 2 }]);
  assert.equal(new Set(m.values()).size, 3);
});
check("slugs do not depend on how the caller sorts the list", () => {
  const items = [{ id: "a", term: "Berm", order: 0 }, { id: "b", term: "Berm", order: 1 }, { id: "c", term: "Weir", order: 2 }];
  const one = assignSlugs(items), two = assignSlugs([...items].reverse());
  for (const i of items) assert.equal(one.get(i.id), two.get(i.id));
});
check("adding unrelated entries does not change existing slugs", () => {
  const base = [{ id: "a", term: "Berm", tag: "X", order: 0 }, { id: "b", term: "Berm", tag: "Y", order: 1 }];
  const before = assignSlugs(base);
  const after = assignSlugs([...base, { id: "z", term: "Zebra crossing", order: 2 }]);
  assert.equal(after.get("a"), before.get("a")); assert.equal(after.get("b"), before.get("b"));
});

check("readTermParam reads a valid slug", () => assert.equal(readTermParam("?term=abutment&x=1"), "abutment"));
check("readTermParam ignores missing, empty and unsafe values", () => {
  assert.equal(readTermParam(""), null); assert.equal(readTermParam("?term="), null);
  assert.equal(readTermParam("?term=<script>"), null); assert.equal(readTermParam("?term=A%20B"), null);
});
check("withTermParam sets, replaces and removes the parameter, keeping the rest", () => {
  assert.equal(withTermParam("/construction-water-glossary", "weir"), "/construction-water-glossary?term=weir");
  assert.equal(withTermParam("/g?term=old&lang=km#top", "new"), "/g?term=new&lang=km#top");
  assert.equal(withTermParam("/g?term=old&lang=km", null), "/g?lang=km");
  assert.equal(withTermParam("/g?term=old", null), "/g");
});
check("termUrl builds an absolute link", () => {
  assert.equal(termUrl("https://www.123tool.app", "/construction-water-glossary", "weir"), "https://www.123tool.app/construction-water-glossary?term=weir");
  assert.equal(termUrl("https://www.123tool.app/", "/g", "a-b"), "https://www.123tool.app/g?term=a-b");
});

console.log(`glossary-share: ${passed} checks passed`);
