// Verification suite for the everyday Khmer tools' engines: lib/khmer-money.ts,
// lib/khmer-number-words.ts, and the game/quiz/reading helpers in
// lib/khmer-learning.ts. Run with: node tests/khmer-everyday.test.mjs
// Covers zero, negative, empty, invalid, boundary, and extreme values.
import assert from "node:assert";
import { parseDenoms, greedyBreakdown, computeChange, tontineSchedule, DEFAULT_RIEL_DENOMS } from "../lib/khmer-money.ts";
import { convertModernBanking, convertTraditional, convertUnder100, toKhmerNumerals } from "../lib/khmer-number-words.ts";
import { scoreGuess, chainKey, continuesChain, buildOptions, numberDistractors, perMinute, msPerWord } from "../lib/khmer-learning.ts";

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

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- denominations / breakdown ----
check("parseDenoms dedupes, sorts, drops junk", () => assert.deepEqual(parseDenoms("500, 100 100, -5, abc, 0, 1000"), [1000, 500, 100]));
check("default denoms parse", () => assert.equal(parseDenoms(DEFAULT_RIEL_DENOMS)[0], 100000));
check("greedy breakdown", () => {
  const r = greedyBreakdown(137500, parseDenoms(DEFAULT_RIEL_DENOMS));
  assert.deepEqual(r.rows.map((x) => [x.denom, x.count]), [[100000, 1], [20000, 1], [10000, 1], [5000, 1], [2000, 1], [500, 1]]);
  assert.equal(r.remainder, 0);
});
check("greedy remainder + zero/negative", () => {
  assert.equal(greedyBreakdown(150, [100]).remainder, 50);
  assert.deepEqual(greedyBreakdown(-10, [100]), { rows: [], remainder: 0 });
  assert.deepEqual(greedyBreakdown(0, []), { rows: [], remainder: 0 });
});

// ---- change ----
const base = { priceUsd: 0, priceKhr: 0, paidUsd: 0, paidKhr: 0, rate: 4000, mode: "riel", roundTo: 100 };
check("change all riel", () => {
  const r = computeChange({ ...base, priceUsd: 3.25, paidUsd: 5 });
  assert.equal(r.dueKhr, 13000);
  assert.equal(r.changeKhr, 7000);
  assert.equal(r.changeUsd, 0);
});
check("change mixed: dollars then riel", () => {
  const r = computeChange({ ...base, priceUsd: 3.25, paidUsd: 10, mode: "mixed" });
  assert.equal(r.balanceKhr, 27000);
  assert.equal(r.changeUsd, 6);
  assert.equal(r.changeKhr, 3000);
});
check("change rounding down to smallest note", () => {
  const r = computeChange({ ...base, priceKhr: 12350, paidKhr: 20000 });
  assert.equal(r.changeKhr, 7600);
  assert.equal(r.roundedOffKhr, 50);
});
check("change mixed payment USD + KHR", () => {
  const r = computeChange({ ...base, priceUsd: 7.5, paidUsd: 5, paidKhr: 20000, rate: 4100 });
  assert.equal(r.dueKhr, 30750);
  assert.equal(r.paidKhr, 40500);
  assert.equal(r.changeKhr, 9700);
  assert.equal(r.roundedOffKhr, 50);
});
check("change: customer still owes", () => {
  const r = computeChange({ ...base, priceUsd: 10, paidUsd: 8 });
  assert.equal(r.owedKhr, 8000);
  assert.equal(r.owedUsd, 2);
  assert.equal(r.changeKhr, 0);
});
check("change: exact payment", () => assert.equal(computeChange({ ...base, priceKhr: 5000, paidKhr: 5000 }).changeKhr, 0));
check("change: invalid rate or negatives", () => {
  assert.equal(computeChange({ ...base, rate: 0 }), null);
  assert.equal(computeChange({ ...base, paidUsd: -1 }), null);
  assert.equal(computeChange({ ...base, priceKhr: NaN }), null);
});

// ---- tontine ----
check("tontine fixed: everyone nets zero", () => {
  const { rounds, members } = tontineSchedule(["A", "B", "C", "D"], 100, "fixed");
  assert.equal(rounds.length, 4);
  assert.ok(rounds.every((r) => r.pot === 300));
  assert.ok(members.every((m) => m.paid === 300 && m.received === 300 && m.net === 0));
});
check("tontine bid: early collectors pay interest to later ones", () => {
  const { rounds, members } = tontineSchedule(["A", "B", "C"], 100, "bid", [20, 10, 0]);
  // Round 1 (A, bid 20): B,C have not collected → 80 each → pot 160
  assert.equal(rounds[0].pot, 160);
  // Round 2 (B, bid 10): A already collected → 100; C → 90 → pot 190
  assert.equal(rounds[1].pot, 190);
  // Round 3 (C, bid 0): A 100, B 100 → pot 200
  assert.equal(rounds[2].pot, 200);
  const net = Object.fromEntries(members.map((m) => [m.name, m.net]));
  assert.deepEqual(net, { A: 160 - 200, B: 190 - 180, C: 200 - 170 });
  // Money is conserved: total paid == total received.
  assert.equal(members.reduce((s, m) => s + m.paid, 0), members.reduce((s, m) => s + m.received, 0));
});
check("tontine bid clamped to contribution; empty group", () => {
  assert.equal(tontineSchedule(["A", "B"], 100, "bid", [500, 0]).rounds[0].bid, 100);
  assert.equal(tontineSchedule(["A", "B"], 100, "bid", [-5, 0]).rounds[0].bid, 0);
  assert.deepEqual(tontineSchedule([], 100, "fixed"), { rounds: [], members: [] });
});

// ---- number words (moved engine: behaviour pinned) ----
check("number words", () => {
  assert.equal(convertUnder100(0), "សូន្យ");
  assert.equal(convertUnder100(21), "ម្ភៃមួយ");
  assert.equal(convertModernBanking("0"), "សូន្យ");
  assert.equal(convertModernBanking("1250"), "មួយពាន់ ពីររយហាសិប");
  assert.equal(convertModernBanking("15000"), "ដប់ប្រាំពាន់");
  assert.equal(convertTraditional("15000"), "មួយម៉ឺន ប្រាំពាន់");
  assert.equal(toKhmerNumerals("2026"), "២០២៦");
});

// ---- wordle scoring ----
check("wordle: exact, near, miss", () => assert.deepEqual(scoreGuess(["ក", "ខ", "គ"], ["ក", "គ", "ឃ"]), ["hit", "miss", "near"]));
check("wordle: repeated tiles counted once", () => assert.deepEqual(scoreGuess(["ក", "ក", "ក"], ["ខ", "ក", "គ"]), ["miss", "hit", "miss"]));
check("wordle: near consumed left to right", () => assert.deepEqual(scoreGuess(["ក", "ក", "ខ"], ["ខ", "គ", "ក"]), ["near", "miss", "near"]));
check("wordle: same base letter hint", () => assert.deepEqual(scoreGuess(["កា", "ម"], ["កុ", "ន"]), ["base", "miss"]));
check("wordle: all hit", () => assert.deepEqual(scoreGuess(["សា", "លា"], ["សា", "លា"]), ["hit", "hit"]));

// ---- word chain ----
check("chain keys", () => {
  assert.equal(chainKey(["សា", "លា"], "cluster"), "លា");
  assert.equal(chainKey(["សា", "លា"], "letter"), "ល");
  assert.equal(chainKey([], "cluster"), "");
});
check("chain continuation", () => {
  assert.ok(continuesChain(["សា", "លា"], ["លា", "ភ"], "cluster"));
  assert.ok(!continuesChain(["សា", "លា"], ["លើ", "ក"], "cluster"));
  assert.ok(continuesChain(["សា", "លា"], ["លើ", "ក"], "letter"));
  assert.ok(!continuesChain([], ["ក"], "letter"));
});

// ---- options ----
check("buildOptions includes correct, distinct, right size", () => {
  const opts = buildOptions("a", ["a", "b", "b", "c", "d", "e"], 4, mulberry32(3));
  assert.equal(opts.length, 4);
  assert.ok(opts.includes("a"));
  assert.equal(new Set(opts).size, 4);
});
check("buildOptions small pool", () => assert.equal(buildOptions("a", ["b"], 4, mulberry32(1)).length, 2));
check("numberDistractors distinct, valid, not the answer", () => {
  for (const n of [0, 7, 45, 1250, 98765]) {
    const d = numberDistractors(n, 3, mulberry32(n + 1));
    assert.ok(d.length >= 1, `n=${n}`);
    assert.ok(d.every((x) => x !== n && x >= 0 && Number.isInteger(x)), `n=${n} ${d}`);
    assert.equal(new Set(d).size, d.length);
  }
});

// ---- reading ----
check("perMinute", () => {
  assert.equal(perMinute(120, 60000), 120);
  assert.equal(perMinute(50, 30000), 100);
  assert.equal(perMinute(10, 0), 0);
  assert.equal(perMinute(0, 1000), 0);
});
check("msPerWord clamps", () => {
  assert.equal(msPerWord(60), 1000);
  assert.equal(msPerWord(0), 6000);
  assert.equal(msPerWord(1e9), 60);
});

console.log(`${passed} checks passed`);
