// Verification suite for lib/safe-html.ts. Run with: node tests/safe-html.test.mjs
// Covers escaping, the link scheme allowlist (including obfuscated schemes) and the Markdown
// Previewer renderer against common XSS payloads, plus the plain-text happy paths.
import assert from "node:assert";
import { escapeHtml, safeUrl, markdownToSafeHtml } from "../lib/safe-html.ts";

let passed = 0;
function check(name, fn) {
  try { fn(); passed++; } catch (err) { console.error(`FAIL: ${name}`); console.error(err?.message ?? err); process.exitCode = 1; }
}

// Parses an HTML string the way an element's innerHTML would and reports anything executable.
// (No DOM in Node, so check the structural signals an injection needs: a raw tag, an event
// handler attribute, or a dangerous URL scheme in an href.)
function assertInert(html) {
  assert.ok(!/<(script|img|svg|iframe|object|embed|style|link|meta)\b/i.test(html), `raw tag in: ${html}`);
  for (const tag of html.match(/<[a-z][^>]*>/gi) ?? []) {
    const attrsOutsideValues = tag.replace(/"[^"]*"/g, '""');
    assert.ok(!/\son[a-z]+\s*=/i.test(attrsOutsideValues), `event handler attribute in: ${tag}`);
  }
  for (const m of html.matchAll(/href="([^"]*)"/g)) {
    assert.ok(!/^\s*(javascript|data|vbscript):/i.test(m[1]), `dangerous href: ${m[1]}`);
  }
}

check("escapeHtml escapes the five HTML-significant characters", () => {
  assert.equal(escapeHtml(`<a href="x" title='y'>&</a>`), "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;");
  assert.equal(escapeHtml(""), "");
  assert.equal(escapeHtml("ភាសាខ្មែរ 123"), "ភាសាខ្មែរ 123");
});

check("safeUrl keeps http(s), mailto and relative links", () => {
  for (const url of ["https://123tool.app/a?b=1", "http://example.com", "mailto:hi@example.com", "/about", "#top", "./x", "page.html", "  https://x.dev  "]) {
    assert.equal(safeUrl(url), url.trim());
  }
});

check("safeUrl blocks script-capable schemes, however they are disguised", () => {
  for (const url of ["javascript:alert(1)", "JavaScript:alert(1)", " javascript:alert(1)", "java\tscript:alert(1)", "java\nscript:alert(1)", "\u0000javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "vbscript:msgbox(1)", "file:///etc/passwd"]) {
    assert.equal(safeUrl(url), "#", `allowed: ${JSON.stringify(url)}`);
  }
});

check("markdown renders the supported syntax", () => {
  const html = markdownToSafeHtml("# Title\n\nSome **bold** and *it* with `code`.\n\n- one\n- two\n\n[site](https://123tool.app)");
  assert.ok(html.includes("<h1>Title</h1>"));
  assert.ok(html.includes("<strong>bold</strong>") && html.includes("<em>it</em>") && html.includes("<code>code</code>"));
  assert.match(html, /<ul><li>one<\/li>\n<li>two<\/li>\n?<\/ul>/);
  assert.ok(html.includes('<a href="https://123tool.app" rel="noopener noreferrer">site</a>'));
});

check("markdown neutralises XSS payloads", () => {
  const payloads = [
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    "[x](javascript:alert(1))",
    "[x](JaVaScRiPt:alert(1))",
    '[x](" onmouseover="alert(1))',
    "[x](https://ok.dev\" onclick=\"alert(1))",
    "[x](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)",
    "**<svg onload=alert(1)>**",
    "# <iframe src=javascript:alert(1)>",
    "`<style>body{display:none}</style>`",
  ];
  for (const payload of payloads) assertInert(markdownToSafeHtml(payload));
});

check("a quote inside a link target cannot break out of the href attribute", () => {
  const html = markdownToSafeHtml('[x](https://ok.dev" onclick="alert(1))');
  const tag = html.match(/<a [^>]*>/)[0];
  assert.equal((tag.match(/"/g) ?? []).length, 4, tag); // href="…" and rel="…" only
});

check("markdown on empty input is an empty paragraph", () => {
  assert.equal(markdownToSafeHtml(""), "<p></p>");
});

console.log(`${passed} checks passed${process.exitCode ? " (with failures)" : ""}`);
