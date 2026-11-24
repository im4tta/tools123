import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLinker, headwordForms } from "../lib/term-links.ts";

test("headword forms split alternatives and drop brackets", () => {
  assert.deepEqual(headwordForms("រស្មីសំយោគ/ហ្វូតូសំយោគ"), ["រស្មីសំយោគ", "ហ្វូតូសំយោគ"]);
  assert.deepEqual(headwordForms("លីតូស្វ៊ែ ឬមណ្ឌលថ្ម"), ["លីតូស្វ៊ែ", "មណ្ឌលថ្ម"]);
  assert.deepEqual(headwordForms("មេតាន (CH₄)"), ["មេតាន"]);
});

test("links other entries once, never itself, longest first", () => {
  const link = buildLinker([
    { id: "a", km: "ឧស្ម័នកាបូនិក" },
    { id: "b", km: "ឧស្ម័នផ្ទះកញ្ចក់" },
    { id: "c", km: "ឥន្ធនៈហ្វូស៊ីល" },
  ]);
  const out = link("ដុតឥន្ធនៈហ្វូស៊ីល បញ្ចេញឧស្ម័នកាបូនិក និងឧស្ម័នកាបូនិក", "c");
  assert.deepEqual(out, ["ដុតឥន្ធនៈហ្វូស៊ីល បញ្ចេញ", { text: "ឧស្ម័នកាបូនិក", id: "a" }, " និងឧស្ម័នកាបូនិក"]);
});

test("does not split a Khmer syllable", () => {
  const link = buildLinker([{ id: "x", km: "កាបូនិក" }]);
  assert.deepEqual(link("កាបូនិកា", "y"), ["កាបូនិកា"]);
  assert.deepEqual(link("ស្កាបូនិក", "y"), ["ស្កាបូនិក"]);
  assert.equal(link("និងកាបូនិក។", "y").length, 3);
});

test("short headwords are not linked", () => {
  assert.deepEqual(buildLinker([{ id: "x", km: "ទឹក" }])("ទឹកភ្លៀង", "y"), ["ទឹកភ្លៀង"]);
});
