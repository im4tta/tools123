// Verification suite for lib/speech.ts (the pure helpers). Run with: node tests/speech.test.mjs
import assert from "node:assert";
import { pickVoice, speakableText, speechSupported } from "../lib/speech.ts";

let passed = 0;
function check(name, fn) {
  try { fn(); passed++; } catch (err) { console.error(`FAIL: ${name}`); console.error(err?.message ?? err); process.exitCode = 1; }
}

const v = (lang, localService = true, name = lang) => ({ lang, localService, name });

check("drops bracketed acronyms", () => assert.equal(speakableText("Indian Ocean Dipole (IOD)"), "Indian Ocean Dipole"));
check("reads / as or", () => assert.equal(speakableText("Watershed/Catchment"), "Watershed, or Catchment"));
check("collapses spacing", () => assert.equal(speakableText("  Bar   (river) "), "Bar"));
check("empty stays empty", () => assert.equal(speakableText("(only brackets)"), ""));
check("exact local voice wins", () => assert.equal(pickVoice([v("en-GB"), v("en-US", false), v("en-US")], "en-US").localService, true));
check("exact beats same language", () => assert.equal(pickVoice([v("en-GB"), v("en-US", false)], "en-US").lang, "en-US"));
check("falls back to same language", () => assert.equal(pickVoice([v("fr-FR"), v("en-AU")], "en-US").lang, "en-AU"));
check("accepts underscore tags", () => assert.equal(pickVoice([v("en_US")], "en-US").lang, "en_US"));
check("no matching voice", () => assert.equal(pickVoice([v("km-KH")], "en-US"), undefined));
check("unsupported outside a browser", () => assert.equal(speechSupported(), false));

console.log(`${passed} checks passed`);
