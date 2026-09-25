// Verification suite for lib/khmer-spoonerisms.ts (data integrity + helpers).
// Run with: node tests/khmer-spoonerisms.test.mjs
import assert from "node:assert";
import { SPOONERISMS, SPOONERISM_CATEGORIES, filterSpoonerisms, formatSpoonerism } from "../lib/khmer-spoonerisms.ts";

let passed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error(err?.message ?? err);
    process.exitCode = 1;
  }
}

const KHMER = /[ក-៿]/;
const cats = new Set(SPOONERISM_CATEGORIES.map((c) => c.id));

check("102 entries imported", () => assert.equal(SPOONERISMS.length, 102));
check("ids unique", () => assert.equal(new Set(SPOONERISMS.map((w) => w.id)).size, SPOONERISMS.length));
check("headwords unique", () => assert.equal(new Set(SPOONERISMS.map((w) => w.word)).size, SPOONERISMS.length));
check("every field is non-empty Khmer with no stray whitespace", () => {
  for (const w of SPOONERISMS) {
    for (const f of ["word", "spoonerism", "meaning"]) {
      assert.ok(KHMER.test(w[f]), `${w.id}.${f}`);
      assert.equal(w[f], w[f].trim(), `${w.id}.${f} whitespace`);
    }
  }
});
check("categories valid", () => { for (const w of SPOONERISMS) assert.ok(cats.has(w.category), `${w.id} ${w.category}`); });
check("exactly the six image entries are flagged, all in the image category", () => {
  const img = SPOONERISMS.filter((w) => w.fromImage);
  assert.equal(img.length, 6);
  assert.ok(img.every((w) => w.category === "image"));
  assert.equal(SPOONERISMS.filter((w) => w.category === "image").length, 6);
});
check("spoonerism differs from its meaning", () => { for (const w of SPOONERISMS) assert.notEqual(w.spoonerism, w.meaning, `${w.id}`); });

check("filter: all, category, query across fields", () => {
  assert.equal(filterSpoonerisms(SPOONERISMS, "all", "").length, 102);
  assert.equal(filterSpoonerisms(SPOONERISMS, "image", "").length, 6);
  assert.deepEqual(filterSpoonerisms(SPOONERISMS, "all", "ក្រមាច់ពេញសុំ").map((w) => w.id), [1]);
  assert.deepEqual(filterSpoonerisms(SPOONERISMS, "all", "ក្រមុំពេញសាច់").map((w) => w.id), [1]);
  assert.equal(filterSpoonerisms(SPOONERISMS, "love", "ក្រមុំ").length, 0);
  assert.equal(filterSpoonerisms(SPOONERISMS, "all", "   ").length, 102);
  assert.equal(filterSpoonerisms([], "all", "x").length, 0);
});
check("format", () => assert.equal(formatSpoonerism(SPOONERISMS[0]), "ក្រមុំក្រមាច់ = ក្រមាច់ពេញសុំ = ក្រមុំពេញសាច់"));

console.log(`${passed} checks passed`);
