// Verification suite for lib/chakkhu-core.ts (the Chakkhu OCR reading logic).
// Run with: node tests/chakkhu-core.test.mjs. Resampling expectations come from Pillow 12
// (Image.resize(..., BILINEAR)); CTC is checked against brute-force enumeration of alignments.
import assert from "node:assert";
import {
  BLANK, BOS, EOS, PAD,
  beamSearch, ctcGreedy, ctcLogProb, decodeIds, decodeLimit, editRatio, khnormal, lineConfidence,
  normalizeText, pickBest, pilResizeBilinear, prepareLine, rgbaToGrey, roundHalfEven,
} from "../lib/chakkhu-core.ts";

let passed = 0;
async function check(name, fn) {
  try { await fn(); passed++; } catch (err) { console.error(`FAIL: ${name}`); console.error(err?.message ?? err); process.exitCode = 1; }
}
const cp = (...codes) => String.fromCodePoint(...codes);

// ---- picture ----
const SRC = Uint8Array.from([12, 200, 45, 99, 250, 3, 0, 128, 255, 64, 32, 16, 90, 91, 92, 93, 94, 95]); // 6 × 3
await check("Pillow grey conversion", () => {
  assert.deepEqual([...rgbaToGrey(Uint8Array.from([255, 0, 0, 255, 10, 200, 30, 255]), 2, 0, 0, 2, 1)], [76, 124]);
});
await check("Pillow bilinear resize: shrink both ways", () => {
  assert.deepEqual([...pilResizeBilinear(SRC, 6, 3, 4, 2)], [70, 136, 118, 68, 74, 129, 86, 68]);
});
await check("Pillow bilinear resize: grow both ways", () => {
  assert.deepEqual([...pilResizeBilinear(SRC, 6, 3, 9, 5)], [12, 106, 174, 71, 72, 124, 225, 127, 3, 7, 89, 164, 136, 107, 98, 150, 86, 8, 0, 64, 149, 234, 160, 59, 37, 24, 16, 54, 80, 114, 149, 120, 79, 71, 67, 63, 90, 91, 91, 92, 93, 93, 94, 95, 95]);
});
await check("Pillow bilinear resize: one axis only", () => {
  assert.deepEqual([...pilResizeBilinear(SRC, 6, 3, 3, 3)], [97, 110, 123, 91, 140, 30, 91, 93, 94]);
  assert.deepEqual([...pilResizeBilinear(SRC, 6, 3, 6, 7)], [12, 200, 45, 99, 250, 3, 10, 190, 75, 94, 219, 5, 5, 159, 165, 79, 125, 10, 0, 128, 255, 64, 32, 16, 39, 112, 185, 76, 59, 50, 77, 96, 115, 89, 85, 84, 90, 91, 92, 93, 94, 95]);
});
await check("Python round(): halves to even", () => {
  assert.deepEqual([0.5, 1.5, 2.5, 3.5, 2.4, 2.6].map(roundHalfEven), [0, 2, 2, 4, 2, 3]);
});
await check("line picture: height 64, width kept, white padding to a multiple of 8", () => {
  const { pixels, width, paddedWidth } = prepareLine(new Uint8Array(100 * 20).fill(0), 100, 20);
  assert.equal(width, 320); // 100 × 64 / 20
  assert.equal(paddedWidth, 320);
  const narrow = prepareLine(new Uint8Array(3 * 40).fill(0), 3, 40);
  assert.equal(narrow.width, 16); // at least 16 px
  assert.equal(narrow.paddedWidth, 16);
  const odd = prepareLine(new Uint8Array(21 * 64).fill(0), 21, 64);
  assert.equal(odd.paddedWidth, 24);
  assert.equal(odd.pixels[23], 1); // right padding is white
  assert.equal(pixels[0], 0);
});
await check("line picture: capped at 4,096 px wide", () => {
  assert.equal(prepareLine(new Uint8Array(9000 * 10).fill(255), 9000, 10).width, 4096);
});

// ---- CTC ----
function randomLogProbs(T, V, seed) {
  let a = seed;
  const rnd = () => { a = (a * 1103515245 + 12345) % 2147483648; return a / 2147483648; };
  const lp = new Float32Array(T * V);
  for (let t = 0; t < T; t++) {
    const row = Array.from({ length: V }, () => rnd() * 4);
    const m = Math.max(...row);
    const z = Math.log(row.reduce((s, x) => s + Math.exp(x - m), 0)) + m;
    row.forEach((x, v) => { lp[t * V + v] = x - z; });
  }
  return lp;
}
function bruteForce(lp, T, V, target) {
  // Sum over every column labelling that collapses to the target.
  let total = -Infinity;
  const path = new Array(T).fill(0);
  const visit = (t) => {
    if (t === T) {
      const out = [];
      let prev = -1;
      for (const s of path) { if (s !== prev && s !== BLANK) out.push(s); prev = s; }
      if (out.length === target.length && out.every((x, i) => x === target[i])) {
        const lpPath = path.reduce((s, sym, i) => s + lp[i * V + sym], 0);
        total = total === -Infinity ? lpPath : Math.max(total, lpPath) + Math.log1p(Math.exp(-Math.abs(total - lpPath)));
      }
      return;
    }
    for (let v = 0; v < V; v++) { path[t] = v; visit(t + 1); }
  };
  visit(0);
  return total;
}
await check("CTC forward algorithm equals brute force over all alignments", () => {
  const T = 5;
  const V = 7; // ids 0–6, blank = 4
  const lp = randomLogProbs(T, V, 42);
  for (const target of [[], [5], [5, 6], [6, 6], [5, 6, 5], [5, 5, 5]]) {
    const got = ctcLogProb(lp, T, V, target);
    const want = bruteForce(lp, T, V, target);
    assert.ok(Math.abs(got - want) < 1e-6, `${JSON.stringify(target)}: ${got} vs ${want}`);
  }
  assert.equal(ctcLogProb(lp, T, V, [5, 6, 5, 6, 5, 6]), -Infinity); // longer than the columns
});
await check("greedy CTC merges repeats and drops blanks", () => {
  const V = 7;
  const best = [5, 5, BLANK, 5, 6, 6, BLANK];
  const lp = new Float32Array(best.length * V).fill(-10);
  best.forEach((v, t) => { lp[t * V + v] = 0; });
  assert.deepEqual(ctcGreedy(lp, best.length, V), [5, 5, 6]);
  assert.deepEqual(ctcGreedy(lp, 2, V), [5]); // only the real columns are read
});

// ---- decoder beam search (fake decoder) ----
function fakeDecoder(table, vocab) {
  // table: prefix (ids after <s>, joined) → [token, logp] pairs; everything else very unlikely.
  return async (rows) => rows.map((row) => {
    const out = new Float32Array(vocab).fill(-50);
    for (const [tok, lp] of table[row.slice(1).join(",")] ?? []) out[tok] = lp;
    return out;
  });
}
await check("beam search finds the best finished sequence and keeps 4, best first", async () => {
  const V = 12;
  const next = fakeDecoder({
    "": [[7, Math.log(0.6)], [8, Math.log(0.4)]],
    "7": [[EOS, Math.log(0.3)], [9, Math.log(0.7)]],
    "8": [[EOS, Math.log(0.9)], [9, Math.log(0.1)]],
    "7,9": [[EOS, Math.log(0.95)], [10, Math.log(0.05)]],
    "8,9": [[EOS, Math.log(0.5)], [10, Math.log(0.5)]],
  }, V);
  const guesses = await beamSearch(next, 10);
  assert.deepEqual(guesses[0], [7, 9]); // 0.6 · 0.7 · 0.95 = 0.399
  assert.deepEqual(guesses[1], [8]);    // 0.4 · 0.9 = 0.36
  assert.ok(guesses.length <= 4);
  assert.ok(guesses.every((g) => !g.includes(PAD) && !g.includes(BOS) && !g.includes(BLANK)));
});
await check("beam search stops at the step limit", async () => {
  let calls = 0;
  const next = async (rows) => { calls++; return rows.map(() => { const o = new Float32Array(12).fill(-50); o[7] = 0; return o; }); };
  const guesses = await beamSearch(next, 3); // token 7 forever: the likely line never ends
  assert.equal(calls, 3);
  assert.ok(guesses.every((g) => g.length < 3));
  assert.equal(decodeLimit([1, 2, 3]), 8); // int(1.5 × 3) + 4
});
await check("guess scoring: 0.5 · CTC + 0.5 · decoder, first one on a tie", () => {
  assert.equal(pickBest([-1, -3, -2], [-5, -1, -1]), 2);
  assert.equal(pickBest([-1, -3, -2], [-5, -1, -2]), 1); // -2 vs -2: the first wins
  assert.equal(pickBest([-1, -1], [-1, -1]), 0);
});

// ---- text ----
const KA = 0x1780, KHA = 0x1781, SA = 0x179F, TA = 0x178F, RO = 0x179A, COENG = 0x17D2;
await check("khnormal: invisible characters removed", () => {
  assert.equal(khnormal(cp(KA, 0x200B, KHA, 0x00AD, 0xFEFF)), cp(KA, KHA));
});
await check("khnormal: deprecated letters and split vowels replaced", () => {
  assert.equal(khnormal(cp(0x17A3)), cp(0x17A2));
  assert.equal(khnormal(cp(0x17A4)), cp(0x17A2, 0x17B6));
  assert.equal(khnormal(cp(KA, 0x17C1, 0x17B6)), cp(KA, 0x17C4));
  assert.equal(khnormal(cp(KA, 0x17C1, 0x17B8)), cp(KA, 0x17BE));
});
await check("khnormal: subscript ro goes last, then shifter, robat, vowel, signs", () => {
  // ស + ្រ + ្ត + ី typed in the "wrong" order → ស្ត្រី
  assert.equal(khnormal(cp(SA, COENG, RO, COENG, TA, 0x17B8)), cp(SA, COENG, TA, COENG, RO, 0x17B8));
  // sign before vowel → vowel first (ាំ)
  assert.equal(khnormal(cp(KA, 0x17C6, 0x17B6)), cp(KA, 0x17B6, 0x17C6));
  // shifter after vowel → shifter first
  assert.equal(khnormal(cp(KA, 0x17B7, 0x17CA)), cp(KA, 0x17CA, 0x17B7));
});
await check("khnormal: doubled coeng and doubled marks removed", () => {
  assert.equal(khnormal(cp(SA, COENG, COENG, TA)), cp(SA, COENG, TA));
  assert.equal(khnormal(cp(KA, 0x17B6, 0x17B6)), cp(KA, 0x17B6));
});
await check("khnormal leaves already-normal text and Latin alone", () => {
  const text = `${cp(SA, COENG, TA, COENG, RO, 0x17B8)} Chakkhu 2026`;
  assert.equal(khnormal(text), text);
});
await check("normalizeText collapses whitespace like Python's split()", () => {
  assert.equal(normalizeText(`  a \t b\n${cp(0xa0)}c  `), "a b c");
});
await check("decodeIds drops special tokens", () => {
  const vocab = ["<pad>", "<s>", "</s>", "<unk>", "<blank>", "x", "y"];
  assert.equal(decodeIds([1, 5, 4, 6, 2, 99], vocab), "xy");
});
await check("edit ratio over code points", () => {
  assert.equal(editRatio("abc", "abc"), 0);
  assert.equal(editRatio("abc", "abd"), 1 / 3);
  assert.equal(editRatio("", "ab"), 1);
});
await check("line confidence = agreement × mean best CTC probability", () => {
  const V = 6;
  const lp = new Float32Array(2 * V).fill(Math.log(0.1));
  lp[0] = Math.log(0.5);
  lp[V + 1] = Math.log(0.9);
  assert.equal(lineConfidence("ab", "ab", lp, 2, V), 0.7);
  assert.equal(lineConfidence("ab", "ac", lp, 2, V), 0.35);
  assert.equal(lineConfidence("", "", lp, 0, V), 0);
});

console.log(`${passed} checks passed${process.exitCode ? " (with failures)" : ""}`);
