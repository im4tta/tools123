// Verification suite for lib/khmer-word-games.ts (spelling bee, hangman, word grid, matching pairs,
// clock reading, math drill), lib/khmer-time-words.ts and the cash counter in lib/khmer-money.ts.
// Run with: node tests/khmer-word-games.test.mjs — covers empty, invalid and boundary inputs too.
import assert from "node:assert";
import fs from "node:fs";
import {
  letterSet, beeAnswers, isPangram, beeScore, pickBeePuzzle,
  maskClusters, hangmanSolved, wrongGuesses,
  gridNeighbors, isValidPath, buildWordGrid, solveWordGrid,
  buildPairDeck, randomClockTime, clockDistractors, handAngles,
  makeMathProblem, parseMixedDigits,
} from "../lib/khmer-word-games.ts";
import { khmerTimePhrase, khmerTimePhraseWords, partOfHour, to12, to24 } from "../lib/khmer-time-words.ts";
import { cashTotal, parseDenoms, DEFAULT_RIEL_DENOMS } from "../lib/khmer-money.ts";

let passed = 0;
function check(name, fn) {
  try { fn(); passed++; } catch (err) { console.error(`FAIL: ${name}`); console.error(err?.message ?? err); process.exitCode = 1; }
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const seg = new Intl.Segmenter("km", { granularity: "grapheme" });
const clusters = (w) => [...seg.segment(w)].map((s) => s.segment);
const WORDS = JSON.parse(fs.readFileSync(new URL("../data/khmer-words.json", import.meta.url), "utf8"));

// ---- letters / spelling bee ----
check("letterSet keeps consonants incl. subscripts, drops vowel signs", () => {
  assert.deepEqual(letterSet("ស្រី"), ["ស", "រ"]);
  assert.deepEqual(letterSet("អាហារ"), ["អ", "ហ", "រ"]);
  assert.deepEqual(letterSet(""), []);
});
check("bee answers all use hive letters and the centre", () => {
  const p = pickBeePuzzle(WORDS, [6, 7], 8, 80, mulberry32(1));
  assert.ok(p, "puzzle found");
  const hive = new Set([...p.letters, p.center]);
  assert.equal(hive.size, p.letters.length + 1, "centre not repeated in outer letters");
  const ans = beeAnswers(WORDS, { letters: [...hive], center: p.center });
  assert.ok(ans.length >= 8 && ans.length <= 80, `answers ${ans.length}`);
  for (const w of ans) { const ls = letterSet(w); assert.ok(ls.includes(p.center)); assert.ok(ls.every((l) => hive.has(l))); }
  assert.ok(ans.some((w) => isPangram(w, { letters: [...hive], center: p.center })), "at least one word uses every letter");
});
check("bee scoring adds the bonus only for pangrams", () => {
  const puzzle = { letters: ["ក", "រ", "ស"], center: "ក" };
  assert.equal(beeScore("ករ", puzzle), 2);
  assert.equal(beeScore("ក្រស", puzzle), 3 + 7);
});
check("pickBeePuzzle returns null when impossible", () => assert.equal(pickBeePuzzle(["ក"], [7], 8, 80, mulberry32(2)), null));

// ---- hangman ----
check("hangman masks clusters until their letters are guessed", () => {
  const cl = clusters("ស្រីក");
  const m = maskClusters(cl, new Set(["ស"]));
  assert.deepEqual(m.map((x) => x.revealed), [false, false]);
  const m2 = maskClusters(cl, new Set(["ស", "រ"]));
  assert.deepEqual(m2.map((x) => x.revealed), [true, false]);
  assert.equal(hangmanSolved("ស្រីក", new Set(["ស", "រ", "ក"])), true);
  assert.deepEqual(wrongGuesses("ស្រីក", ["ស", "ម", "ង"]), ["ម", "ង"]);
});

// ---- word grid ----
check("grid neighbours: corner 3, edge 5, middle 8", () => {
  assert.equal(gridNeighbors(0, 4).length, 3);
  assert.equal(gridNeighbors(1, 4).length, 5);
  assert.equal(gridNeighbors(5, 4).length, 8);
});
check("path validation rejects jumps and reuse", () => {
  assert.equal(isValidPath([0, 1, 5], 4), true);
  assert.equal(isValidPath([0, 2], 4), false);
  assert.equal(isValidPath([0, 1, 0], 4), false);
  assert.equal(isValidPath([0, 16], 4), false);
});
check("built grid contains seeded words and the solver finds only real, traceable words", () => {
  const dict = WORDS.map(clusters);
  const pool = dict.flat();
  const grid = buildWordGrid(dict, 4, 5, pool, mulberry32(3));
  assert.equal(grid.length, 16);
  const found = solveWordGrid(grid, 4, dict);
  assert.ok(found.length >= 3, `found ${found.length}`);
  const known = new Set(WORDS);
  for (const w of found) assert.ok(known.has(w));
});
check("solver on a hand-made grid", () => {
  const grid = ["ក", "ក", "x", "x", "x", "x", "x", "x", "x", "x", "x", "x", "x", "x", "x", "ង"];
  assert.deepEqual(solveWordGrid(grid, 4, [["ក", "ក"], ["ក", "ង"]]), ["កក"]);
});

// ---- matching pairs ----
check("pair deck has two cards per pair with matching ids", () => {
  const deck = buildPairDeck([["ក", "Ka"], ["ខ", "Kha"]], mulberry32(4));
  assert.equal(deck.length, 4);
  assert.deepEqual(new Set(deck.map((c) => c.id)).size, 4);
  for (const pid of [0, 1]) assert.deepEqual(deck.filter((c) => c.pairId === pid).map((c) => c.side).sort(), ["a", "b"]);
  assert.equal(buildPairDeck([], mulberry32(4)).length, 0);
});

// ---- clock ----
check("clock times stay on the step grid; distractors are distinct and different", () => {
  const rand = mulberry32(5);
  for (let i = 0; i < 50; i++) {
    const t = randomClockTime(5, rand);
    assert.ok(t.h24 >= 0 && t.h24 < 24 && t.m % 5 === 0 && t.m < 60);
    const d = clockDistractors(t, 5, 3, rand);
    assert.equal(d.length, 3);
    const keys = new Set([`${t.h24}:${t.m}`, ...d.map((x) => `${x.h24}:${x.m}`)]);
    assert.equal(keys.size, 4);
  }
});
check("hand angles", () => {
  assert.deepEqual(handAngles({ h24: 15, m: 30 }), { hour: 105, minute: 180 });
  assert.deepEqual(handAngles({ h24: 0, m: 0 }), { hour: 0, minute: 0 });
});
check("Khmer time phrases match the Time in Words tool's format", () => {
  assert.equal(khmerTimePhrase(8, 15), "ម៉ោង ៨ ព្រឹក និង ១៥ នាទី");
  assert.equal(khmerTimePhrase(12, 0), "ម៉ោង ១២ ថ្ងៃត្រង់");
  assert.equal(khmerTimePhraseWords(20, 30), "ម៉ោង ប្រាំបី យប់ និង សាមសិប នាទី");
  assert.equal(partOfHour(0).km, "រំលងអាធ្រាត្រ");
  assert.equal(to12(0), 12); assert.equal(to24(12, false), 0); assert.equal(to24(1, true), 13);
});

// ---- math drill ----
check("math problems are whole, non-negative and correct", () => {
  const rand = mulberry32(6);
  for (const op of ["+", "-", "×", "÷"]) {
    for (let i = 0; i < 200; i++) {
      const p = makeMathProblem(op, 20, rand);
      const expected = op === "+" ? p.a + p.b : op === "-" ? p.a - p.b : op === "×" ? p.a * p.b : p.a / p.b;
      assert.equal(p.answer, expected);
      assert.ok(Number.isInteger(p.answer) && p.answer >= 0);
      if (op === "÷") assert.ok(p.b >= 1);
    }
  }
  assert.ok(makeMathProblem("+", 0, rand).answer <= 2, "max 0 is clamped to 1");
});
check("parseMixedDigits reads Khmer and ASCII digits only", () => {
  assert.equal(parseMixedDigits("១២"), 12);
  assert.equal(parseMixedDigits(" 7 "), 7);
  assert.equal(parseMixedDigits("១2"), 12);
  assert.equal(parseMixedDigits(""), null);
  assert.equal(parseMixedDigits("-3"), null);
  assert.equal(parseMixedDigits("1.5"), null);
});

// ---- cash counter ----
check("cash total sums counts and ignores junk", () => {
  const denoms = parseDenoms(DEFAULT_RIEL_DENOMS);
  const r = cashTotal({ 100000: 2, 500: 3, 1000: -4, 2000: 1.7, 5000: "x" }, denoms);
  assert.equal(r.total, 200000 + 1500 + 2000);
  assert.equal(r.notes, 2 + 3 + 1);
  assert.deepEqual(cashTotal({}, []), { rows: [], total: 0, notes: 0 });
});

console.log(`${passed} checks passed${process.exitCode ? " (with failures)" : ""}`);
