// Verification suite for secret handling in lib/storage.ts. Run with: node tests/storage-sensitive.test.mjs
// Guarantees that secrets (passwords, signing keys, 2FA seeds, tokens, card numbers) never reach
// localStorage and that copies saved by older versions are purged.
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { SENSITIVE_TOOL_STATE_IDS, purgeSensitiveToolState } from "../lib/storage.ts";

let passed = 0;
function check(name, fn) {
  try { fn(); passed++; } catch (err) { console.error(`FAIL: ${name}`); console.error(err?.message ?? err); process.exitCode = 1; }
}

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(tsx?|mjs)$/.test(entry.name) ? [full] : [];
  });
}
const sources = ["components", "lib", "app"].flatMap(sourceFiles).map((file) => ({ file, text: fs.readFileSync(file, "utf8") }));
const listed = new Set(SENSITIVE_TOOL_STATE_IDS);

check("every useSensitiveToolState id is listed (so old copies get purged)", () => {
  for (const { file, text } of sources) {
    for (const m of text.matchAll(/useSensitiveToolState(?:<[^>(]*>)?\(\s*"([^"]+)"/g)) {
      assert.ok(listed.has(m[1]), `${file}: "${m[1]}" missing from SENSITIVE_TOOL_STATE_IDS`);
    }
  }
});

check("no listed id is still persisted through useToolState", () => {
  for (const { file, text } of sources) {
    for (const m of text.matchAll(/useToolState(?:<[^>(]*>)?\(\s*"([^"]+)"/g)) {
      assert.ok(!listed.has(m[1]), `${file}: "${m[1]}" is sensitive but uses useToolState`);
    }
  }
});

check("every listed id is actually used (no stale entries)", () => {
  const used = new Set();
  for (const { text } of sources) for (const m of text.matchAll(/useSensitiveToolState(?:<[^>(]*>)?\(\s*"([^"]+)"/g)) used.add(m[1]);
  for (const id of SENSITIVE_TOOL_STATE_IDS) assert.ok(used.has(id), `"${id}" is listed but unused`);
});

check("purge removes saved secrets and leaves everything else", () => {
  const store = new Map([
    ["toolbox123:tool:totp:secret", '"JBSWY3DPEHPK3PXP"'],
    ["toolbox123:tool:pwned:password", '"hunter2"'],
    ["toolbox123:tool:card-masker", '{"number":"4111 1111 1111 1234"}'],
    ["toolbox123:tool:totp:mode", '"totp"'],
    ["toolbox123:favorites", '["pdf-merge"]'],
    ["unrelated", "1"],
  ]);
  globalThis.window = { localStorage: { removeItem: (key) => store.delete(key) } };
  purgeSensitiveToolState();
  purgeSensitiveToolState(); // idempotent
  assert.deepEqual([...store.keys()].sort(), ["toolbox123:favorites", "toolbox123:tool:totp:mode", "unrelated"]);
  delete globalThis.window;
});

check("purge tolerates unavailable storage", () => {
  globalThis.window = { localStorage: { removeItem: () => { throw new Error("SecurityError"); } } };
  assert.doesNotThrow(() => purgeSensitiveToolState());
  delete globalThis.window;
  assert.doesNotThrow(() => purgeSensitiveToolState()); // no window (SSR)
});

console.log(`${passed} checks passed${process.exitCode ? " (with failures)" : ""}`);
