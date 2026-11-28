import { test } from "node:test";
import assert from "node:assert/strict";
import { correctionIssueUrl, ISSUES_NEW_URL } from "../lib/correction-report.ts";

const base = { glossary: "Climate Change Lexicon", term: "Runoff", km: "លំហូរ", link: "https://123tool.app/climate-change-lexicon?term=runoff", suggestion: "លំហូរប្រោះ" };

test("pre-fills title and body", () => {
  const url = new URL(correctionIssueUrl({ ...base, note: "Page 107" }));
  assert.equal(`${url.origin}${url.pathname}`, ISSUES_NEW_URL);
  assert.equal(url.searchParams.get("title"), "Glossary correction: Runoff (Climate Change Lexicon)");
  const body = url.searchParams.get("body");
  assert.match(body, /លំហូរប្រោះ/);
  assert.match(body, /Page 107/);
  assert.doesNotMatch(body, /Definition as shown/);
});

test("long text is clipped so the link stays short", () => {
  const url = correctionIssueUrl({ ...base, definition: "ក".repeat(20000), suggestion: "x".repeat(20000) });
  assert.ok(new URL(url).searchParams.get("body").length <= 5000);
});
