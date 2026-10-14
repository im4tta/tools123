// Verification suite for lib/khmer-clusters.ts. Run with: node tests/khmer-clusters.test.mjs
// Covers coeng stacks (one and two deep), vowel signs, mixed scripts, spaces and empty input.
import assert from "node:assert";
import { khmerClusters } from "../lib/khmer-clusters.ts";

let passed = 0;
function check(name, fn) {
  try { fn(); passed++; } catch (err) { console.error(`FAIL: ${name}`); console.error(err?.message ?? err); process.exitCode = 1; }
}

check("empty input", () => assert.deepEqual(khmerClusters(""), []));
check("one coeng: ស្រី is one cluster", () => assert.deepEqual(khmerClusters("ស្រីក"), ["ស្រី", "ក"]));
check("two coengs: ស្ត្រី is one cluster", () => assert.deepEqual(khmerClusters("ស្ត្រី"), ["ស្ត្រី"]));
check("vowel signs and marks stay on their consonant", () => assert.deepEqual(khmerClusters("កុំ"), ["កុំ"]));
check("independent vowel stands alone", () => assert.deepEqual(khmerClusters("ឥឡូវ"), ["ឥ", "ឡូ", "វ"]));
check("spaces, Latin and digits split normally", () => assert.deepEqual(khmerClusters("ខ្មែរ AB ១"), ["ខ្មែ", "រ", " ", "A", "B", " ", "១"]));
check("trailing coeng with nothing after it is kept", () => assert.deepEqual(khmerClusters("ក្"), ["ក្"]));
check("coeng before a space does not swallow the space", () => assert.deepEqual(khmerClusters("ក្ ខ"), ["ក្", " ", "ខ"]));
check("joining the clusters gives back the input", () => {
  const text = "ព្រះរាជាណាចក្រកម្ពុជា ស្ត្រី 123 😀";
  assert.equal(khmerClusters(text).join(""), text);
});

console.log(`${passed} checks passed${process.exitCode ? " (with failures)" : ""}`);
