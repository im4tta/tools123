// Verification suite for lib/khmer-devkit.ts and lib/khmer-learning.ts.
// Run with: node tests/khmer-devkit.test.mjs (Node strips TS types natively).
// Covers empty, invalid, boundary, and extreme inputs where applicable.
import assert from "node:assert";
import {
  repairMojibake, encodeAsMojibake, flattenJson, checkTranslations, extractPlaceholders,
  measure, naiveTruncate, safeTruncate, cutsCluster, KHMER_REGEX, regexSnippet,
} from "../lib/khmer-devkit.ts";
import { pickClozeBlanks, shuffle, buildWordSearch, DIR_RIGHT, DIR_DOWN, uniformIndex, passphraseBits } from "../lib/khmer-learning.ts";

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

// Same PRNG as lib/prng.ts, inlined so this file has no TS-alias imports.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const KM = "សួស្តី កម្ពុជា ស្ត្រី";

// ---- mojibake ----
check("mojibake: known cp1252 form of ក", () => assert.equal(encodeAsMojibake("ក"), "áž€"));
check("mojibake: round trip", () => assert.equal(repairMojibake(encodeAsMojibake(KM)).text, KM));
check("mojibake: double-encoded", () => {
  const r = repairMojibake(encodeAsMojibake(encodeAsMojibake(KM)));
  assert.equal(r.text, KM);
  assert.equal(r.layers, 2);
});
check("mojibake: leaves clean Khmer alone", () => {
  const r = repairMojibake(KM);
  assert.equal(r.text, KM);
  assert.deepEqual(r.applied, []);
});
check("mojibake: leaves real Latin-1 accents alone", () => assert.equal(repairMojibake("café naïve").text, "café naïve"));
check("mojibake: mixed damaged + ASCII", () => assert.equal(repairMojibake(`Name: ${encodeAsMojibake("សុខ")}!`).text, "Name: សុខ!"));
check("mojibake: percent-encoded", () => assert.equal(repairMojibake(encodeURIComponent("ខ្មែរ")).text, "ខ្មែរ"));
check("mojibake: \\x escapes", () => assert.equal(repairMojibake("\\xE1\\x9E\\x80").text, "ក"));
check("mojibake: \\u and HTML entities", () => assert.equal(repairMojibake("\\u1780 &#6017; &#x1782;").text, "ក ខ គ"));
check("mojibake: lossy flag", () => assert.equal(repairMojibake("???? ????").lossy, true));
check("mojibake: empty", () => assert.equal(repairMojibake("").text, ""));

// ---- translation checker ----
check("flatten nested + arrays", () => {
  const m = flattenJson({ a: { b: "x", c: ["y", "z"] }, d: {} });
  assert.deepEqual([...m.keys()], ["a.b", "a.c.0", "a.c.1", "d"]);
});
check("placeholders", () => {
  assert.deepEqual(extractPlaceholders("Hi {{name}}, {count, plural, other {# items}} %s %1$d %(x)s"), ["%(x)s", "%1$d", "%s", "{count}", "{{name}}"]);
  assert.deepEqual(extractPlaceholders("no placeholders"), []);
});
check("translation report", () => {
  const en = { greet: "Hello {name}", bye: "Bye", same: "OK", nested: { a: "<b>Bold</b>" }, gone: "x", num: 3 };
  const km = { greet: "សួស្តី", bye: "លាហើយ", same: "OK", nested: { a: "ដិត" }, extra: "y", num: "៣" };
  const r = checkTranslations(en, km);
  const kinds = Object.fromEntries(r.issues.map((i) => [i.key, i.kind]));
  assert.equal(kinds.greet, "placeholder");
  assert.equal(kinds.same, "untranslated");
  assert.equal(kinds["nested.a"], "tags");
  assert.equal(kinds.gone, "missing");
  assert.equal(kinds.extra, "extra");
  assert.equal(kinds.num, "type");
  assert.equal(kinds.bye, undefined);
  assert.equal(r.translated, 1);
  assert.deepEqual(JSON.parse(r.missingJson), { gone: "x" });
});
check("no-khmer + empty + invisible", () => {
  const r = checkTranslations({ a: "Save", b: "Open", c: "Close" }, { a: "Sauvegarder", b: " ", c: "​បិទ" });
  const kinds = r.issues.map((i) => `${i.key}:${i.kind}`).sort();
  assert.deepEqual(kinds, ["a:no-khmer", "b:empty", "c:invisible"]);
  assert.equal(checkTranslations({ a: "Save" }, { a: "Sauvegarder" }, { requireKhmer: false }).issues.length, 0);
});
check("empty files", () => {
  const r = checkTranslations({}, {});
  assert.equal(r.sourceKeys, 0);
  assert.equal(r.issues.length, 0);
  assert.equal(r.missingJson, "");
});

// ---- truncation ----
check("measure units", () => {
  const s = "ស្ត្រី"; // 6 code points, one cluster
  assert.equal(measure(s, "codepoints"), 6);
  assert.equal(measure(s, "utf16"), 6);
  assert.equal(measure(s, "utf8"), 18);
  assert.equal(measure(s, "graphemes"), 1);
  assert.equal(measure("", "utf8"), 0);
});
check("naive utf16 cut breaks the cluster", () => {
  const cut = naiveTruncate("ស្ត្រី", 3, "utf16");
  assert.equal(cut, "ស្ត");
  assert.equal(cutsCluster("ស្ត្រី", cut), true);
});
check("naive utf8 cut produces replacement char", () => assert.ok(naiveTruncate("ក", 2, "utf8").includes("�")));
check("safe truncate never splits a cluster", () => {
  const text = "ស្ត្រីកម្ពុជា";
  for (let n = 0; n <= 40; n++) {
    for (const unit of ["graphemes", "codepoints", "utf16", "utf8"]) {
      const r = safeTruncate(text, n, unit, "…");
      assert.ok(r.size <= n || !r.truncated && r.size === measure(text, unit), `${unit} ${n} size ${r.size}`);
      assert.equal(cutsCluster(text, r.text.replace(/…$/, "")), false, `${unit} ${n}`);
    }
  }
});
check("safe truncate: fits unchanged", () => assert.deepEqual(safeTruncate("ក", 5, "graphemes"), { text: "ក", truncated: false, size: 1 }));
check("safe truncate: limit smaller than ellipsis", () => assert.equal(safeTruncate("កខគ", 0, "utf8").text, ""));
check("safe truncate: negative/NaN-ish limit", () => assert.equal(safeTruncate("កខគ", -5, "graphemes").text, ""));

// ---- regex catalogue ----
check("every catalogue pattern compiles with /u", () => {
  for (const e of KHMER_REGEX) new RegExp(e.pattern, "gu");
});
check("regex behaviour", () => {
  const get = (id) => new RegExp(KHMER_REGEX.find((e) => e.id === id).pattern, "u");
  assert.ok(get("any").test("abc ក"));
  assert.ok(!get("only").test("abc ក"));
  assert.ok(get("number").test("២០២៦"));
  assert.ok(get("number").test("2026"));
  assert.ok(get("name").test("សុខ ដារ៉ា"));
  assert.ok(!get("name").test("សុខ 123"));
  assert.ok(get("dangling").test("ក្"));
  assert.ok(!get("dangling").test("ក្ក"));
  assert.ok(get("bad-start").test(" ាក"));
  assert.ok(!get("bad-start").test("កា"));
});
check("snippets", () => {
  assert.ok(regexSnippet("[\\u1780-\\u17FF]", "php").includes("\\x{1780}"));
  assert.ok(regexSnippet("[\\u1780-\\u17FF]", "java").includes("\\\\u1780"));
  assert.ok(regexSnippet("\\u17D2(?![\\u1780-\\u17A2])", "go").includes("RE2"));
  assert.ok(!regexSnippet("[\\u1780-\\u17FF]", "go").includes("RE2"));
});

// ---- cloze ----
check("cloze nth", () => assert.deepEqual(pickClozeBlanks([0, 2, 4, 6, 8, 10], "nth", 3, 0, mulberry32(1)), [4, 10]));
check("cloze nth guards step < 2", () => assert.deepEqual(pickClozeBlanks([1, 2, 3, 4], "nth", 0, 0, mulberry32(1)), [2, 4]));
check("cloze random percent", () => {
  const r = pickClozeBlanks([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], "random", 0, 30, mulberry32(7));
  assert.equal(r.length, 3);
  assert.deepEqual(r, r.slice().sort((a, b) => a - b));
});
check("cloze empty", () => assert.deepEqual(pickClozeBlanks([], "random", 0, 50, mulberry32(1)), []));
check("shuffle is a permutation", () => assert.deepEqual(shuffle([1, 2, 3, 4, 5], mulberry32(3)).sort(), [1, 2, 3, 4, 5]));

// ---- word search ----
check("word search places words along allowed directions", () => {
  const words = [
    { word: "កម្ពុជា", clusters: ["ក", "ម្ពុ", "ជា"] },
    { word: "សាលារៀន", clusters: ["សា", "លា", "រៀ", "ន"] },
  ];
  const g = buildWordSearch(words, 6, [DIR_RIGHT, DIR_DOWN], ["ក", "ខ"], mulberry32(11));
  assert.equal(g.cells.length, 6);
  assert.equal(g.skipped.length, 0);
  for (const p of g.placed) {
    const clusters = words.find((w) => w.word === p.word).clusters;
    p.cells.forEach(([r, c], k) => assert.equal(g.cells[r][c], clusters[k]));
  }
});
check("word search skips words longer than the grid", () => {
  const g = buildWordSearch([{ word: "x", clusters: Array(30).fill("ក") }], 8, [DIR_RIGHT], [], mulberry32(1));
  assert.deepEqual(g.skipped, ["x"]);
});

// ---- passphrase ----
check("uniformIndex range + rejection", () => {
  const seq = [0xffffffff, 5];
  let i = 0;
  assert.equal(uniformIndex(3, () => seq[i++]), 2); // 0xffffffff is in the biased tail for max=3 → rejected
  assert.throws(() => uniformIndex(0, () => 1));
});
check("passphrase entropy", () => {
  assert.equal(passphraseBits(1024, 4), 40);
  assert.equal(passphraseBits(1, 10), 0);
  assert.equal(passphraseBits(100, 0), 0);
});

console.log(`${passed} checks passed`);
