// Verification suite for lib/khmer-games.ts (crossword, word ladder, Leitner, alphabet order,
// syllable builder, keyboard drills, bingo). Run with: node tests/khmer-games.test.mjs
// Covers empty, invalid, boundary and extreme inputs as well as the happy paths.
import assert from "node:assert";
import fs from "node:fs";
import {
  buildCrossword, bestCrossword, buildLadderIndex, ladderNeighbors, isLadderStep, findLadder, pickLadderPuzzle,
  reviewCard, dueCards, boxCounts, LEITNER_TOP_BOX, LEITNER_INTERVAL_DAYS,
  firstOrderError, sortByAlphabet, sampleLetters,
  composeSyllable, codePoints, COENG,
  buildDrill, compareTyped,
  makeBingoCard, drawBingoNumber, bingoLines, BINGO_FREE,
} from "../lib/khmer-games.ts";
import { KHMER_CONSONANTS } from "../lib/data/khmer-romanization.ts";

let passed = 0;
function check(name, fn) {
  try { fn(); passed++; } catch (err) { console.error(`FAIL: ${name}`); console.error(err?.message ?? err); process.exitCode = 1; }
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const clusters = (w) => [...new Intl.Segmenter("km", { granularity: "grapheme" }).segment(w)].map((s) => s.segment);

// ---- crossword ----
const entries = ["ទឹកដោះ", "ដោះស្រាយ", "ស្រាយ", "ទឹកភ្លៀង", "ភ្លៀងធ្លាក់"].map((answer) => ({ answer, clusters: clusters(answer), clue: answer }));
check("crossword places crossing words and every cell matches its word", () => {
  const cw = buildCrossword(entries, 13, mulberry32(1));
  assert.ok(cw.placements.length >= 3, `placed ${cw.placements.length}`);
  for (const p of cw.placements) p.clusters.forEach((c, i) => assert.equal(cw.grid[p.row + (p.across ? 0 : i)][p.col + (p.across ? i : 0)], c));
  assert.equal(cw.placements.length + cw.skipped.length, entries.length);
});
check("crossword numbers start at 1 in reading order", () => {
  const cw = buildCrossword(entries, 13, mulberry32(2));
  assert.equal(cw.placements[0].number, 1);
  const nums = cw.placements.map((p) => p.number);
  assert.deepEqual([...nums].sort((a, b) => a - b), nums);
});
check("crossword: empty / single-cluster / too-long inputs", () => {
  assert.equal(buildCrossword([], 10, mulberry32(3)).placements.length, 0);
  const cw = buildCrossword([{ answer: "ក", clusters: ["ក"], clue: "" }, { answer: "x", clusters: Array(20).fill("ក"), clue: "" }], 10, mulberry32(3));
  assert.equal(cw.placements.length, 0);
  assert.equal(cw.skipped.length, 2);
});
check("crossword: duplicates placed once; unconnectable words skipped", () => {
  const cw = buildCrossword([...entries.slice(0, 2), entries[0], { answer: "ឈើ", clusters: ["ឈើ", "ធំ"], clue: "" }], 13, mulberry32(4));
  assert.equal(cw.placements.filter((p) => p.answer === entries[0].answer).length, 1);
  assert.ok(cw.skipped.some((e) => e.answer === "ឈើ"));
});

check("bestCrossword never places fewer words than one layout, and respects maxWords", () => {
  const one = buildCrossword(entries, 13, mulberry32(12));
  const best = bestCrossword(entries, 13, 8, mulberry32(12));
  assert.ok(best.placements.length >= one.placements.length);
  assert.ok(bestCrossword(entries, 13, 8, mulberry32(12), 2).placements.length <= 2);
});

// ---- word ladder ----
const dict = JSON.parse(fs.readFileSync(new URL("../data/khmer-words.json", import.meta.url), "utf8")).map(clusters);
const index = buildLadderIndex(dict);
check("ladder neighbours differ by exactly one cluster", () => {
  const w = [...index.words.keys()].find((k) => ladderNeighbors(k, index).length > 0);
  for (const n of ladderNeighbors(w, index)) assert.ok(isLadderStep(index.words.get(w), index.words.get(n)));
});
check("isLadderStep rejects equal, length-mismatched and two-change pairs", () => {
  assert.equal(isLadderStep(["ក", "ក"], ["ក", "ក"]), false);
  assert.equal(isLadderStep(["ក"], ["ក", "ង"]), false);
  assert.equal(isLadderStep(["ក", "ក"], ["ខ", "ង"]), false);
  assert.equal(isLadderStep(["ក", "ក"], ["ក", "ង"]), true);
});
check("findLadder returns a valid shortest path; null for unknown words", () => {
  const puzzle = pickLadderPuzzle(index, 2, 2, 4, mulberry32(5));
  assert.ok(puzzle && puzzle.length >= 3);
  for (let i = 1; i < puzzle.length; i++) assert.ok(isLadderStep(index.words.get(puzzle[i - 1]), index.words.get(puzzle[i])));
  assert.deepEqual(findLadder(puzzle[0], puzzle.at(-1), index).length, puzzle.length);
  assert.equal(findLadder("zz", puzzle[0], index), null);
  assert.deepEqual(findLadder(puzzle[0], puzzle[0], index), [puzzle[0]]);
});
check("pickLadderPuzzle returns null when no words of that length", () => assert.equal(pickLadderPuzzle(index, 40, 2, 4, mulberry32(6), 5), null));

// ---- Leitner ----
check("Leitner: right answers climb and cap; a miss resets to box 1 due now", () => {
  let s = {};
  const now = 1_700_000_000_000;
  for (let i = 0; i < 10; i++) s = reviewCard(s, "a", true, now);
  assert.equal(s.a.box, LEITNER_TOP_BOX);
  assert.equal(s.a.due, now + LEITNER_INTERVAL_DAYS[LEITNER_TOP_BOX] * 86_400_000);
  s = reviewCard(s, "a", false, now);
  assert.deepEqual(s.a, { box: 1, due: now });
});
check("Leitner: due list = overdue by box, then limited new cards", () => {
  const now = 1000;
  const s = { a: { box: 3, due: 500 }, b: { box: 1, due: 900 }, c: { box: 2, due: 5000 } };
  assert.deepEqual(dueCards(s, ["a", "b", "c", "d", "e"], now, 1), ["b", "a", "d"]);
  assert.deepEqual(dueCards(s, ["a", "b", "c", "d"], now, 0), ["b", "a"]);
  assert.deepEqual(dueCards({}, [], now, 5), []);
  assert.deepEqual(boxCounts(s, ["a", "b", "c", "d"]), [1, 1, 1, 1, 0, 0]);
});

// ---- alphabet order ----
const ALPHABET = Object.keys(KHMER_CONSONANTS);
check("alphabet table is the 33 consonants starting ក and ending អ", () => { assert.equal(ALPHABET.length, 33); assert.equal(ALPHABET[0], "ក"); assert.equal(ALPHABET.at(-1), "អ"); });
check("order checks and sorting", () => {
  assert.equal(firstOrderError(["ក", "គ", "អ"], ALPHABET), -1);
  assert.equal(firstOrderError(["ក", "អ", "គ"], ALPHABET), 2);
  assert.equal(firstOrderError([], ALPHABET), -1);
  assert.deepEqual(sortByAlphabet(["អ", "ក", "ម"], ALPHABET), ["ក", "ម", "អ"]);
});
check("sampleLetters gives distinct letters and caps at the alphabet size", () => {
  const s = sampleLetters(ALPHABET, 8, mulberry32(7));
  assert.equal(new Set(s).size, 8);
  assert.equal(sampleLetters(ALPHABET, 99, mulberry32(7)).length, 33);
});

// ---- syllable builder ----
check("composeSyllable stores parts in Unicode order", () => {
  assert.equal(composeSyllable({ consonant: "ស", subscripts: ["រ"], vowel: "ី" }), "ស្រី");
  assert.equal(composeSyllable({ consonant: "ក", subscripts: ["ស", "ត"], vowel: "ា" }), "ក" + COENG + "ស" + COENG + "ត" + "ា");
  assert.equal(composeSyllable({ consonant: "ម", shifter: "៊", vowel: "ី" }), "ម៊ី");
  assert.equal(composeSyllable({ consonant: "", vowel: "ា" }), "");
  assert.equal(composeSyllable({ consonant: "ក", subscripts: ["", "រ"] }), "ក្រ");
});
check("codePoints labels", () => { assert.deepEqual(codePoints("ក្រ"), ["U+1780", "U+17D2", "U+179A"]); assert.deepEqual(codePoints(""), []); });

// ---- keyboard drills ----
check("drills use only the given characters", () => {
  const d = buildDrill(["ក", "ា"], 3, 4, mulberry32(8));
  assert.equal(d.split(" ").length, 3);
  assert.ok([...d.replace(/ /g, "")].every((c) => c === "ក" || c === "ា"));
  assert.equal(buildDrill([], 3, 4, mulberry32(8)), "");
  assert.equal(buildDrill(["ក"], 0, 4, mulberry32(8)), "");
});
check("compareTyped counts right, wrong and extra characters", () => {
  assert.deepEqual(compareTyped("កខ", "កគ"), { correct: 1, errors: 1, done: true, states: ["ok", "bad"] });
  assert.deepEqual(compareTyped("កខ", ""), { correct: 0, errors: 0, done: false, states: ["todo", "todo"] });
  assert.equal(compareTyped("ក", "កខគ").errors, 2);
});

// ---- bingo ----
check("bingo card: columns in range, distinct, free centre", () => {
  const card = makeBingoCard(mulberry32(9));
  assert.equal(card[2][2], BINGO_FREE);
  const nums = card.flat().filter((n) => n !== BINGO_FREE);
  assert.equal(new Set(nums).size, 24);
  card.forEach((row) => row.forEach((n, c) => { if (n !== BINGO_FREE) assert.ok(n >= c * 15 + 1 && n <= c * 15 + 15); }));
});
check("bingo draw never repeats and ends with null", () => {
  const called = [];
  const rand = mulberry32(10);
  for (let i = 0; i < 75; i++) called.push(drawBingoNumber(called, 75, rand));
  assert.equal(new Set(called).size, 75);
  assert.equal(drawBingoNumber(called, 75, rand), null);
});
check("bingo lines: row, column, diagonal via free centre", () => {
  const card = makeBingoCard(mulberry32(11));
  assert.deepEqual(bingoLines(card, []), []);
  assert.ok(bingoLines(card, card[0]).includes("row-0"));
  assert.ok(bingoLines(card, card.map((r) => r[1])).includes("col-1"));
  assert.ok(bingoLines(card, card.map((r, i) => r[i])).includes("diag-0"));
});

console.log(`${passed} checks passed${process.exitCode ? " (with failures)" : ""}`);
