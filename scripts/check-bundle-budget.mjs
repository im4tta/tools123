#!/usr/bin/env node
// Guardrail: fails when any prerendered page's initial JavaScript exceeds the budget.
// Run after `next build`:  npm run check:bundle   (BUDGET_KB=… to override, gzip KB per page)
//
// Why: a single server import of a module holding next/dynamic tool loaders once pushed every
// page to ~4 MB gz of JS. This check catches that class of regression before it ships.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, ".next/server/app");
const STATIC_ROOT = path.join(ROOT, ".next");
const BUDGET_KB = Number(process.env.BUDGET_KB ?? 500);

if (!fs.existsSync(APP_DIR)) {
  console.error("No .next/server/app — run `next build` first.");
  process.exit(2);
}

const gzCache = new Map();
function gzipSize(src) {
  if (!gzCache.has(src)) {
    const file = path.join(STATIC_ROOT, src.replace(/^\/_next\//, ""));
    gzCache.set(src, fs.existsSync(file) ? zlib.gzipSync(fs.readFileSync(file)).length : 0);
  }
  return gzCache.get(src);
}

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.name.endsWith(".html") ? [full] : [];
  });
}

const pages = htmlFiles(APP_DIR).map((file) => {
  const html = fs.readFileSync(file, "utf8");
  const scripts = [...new Set([...html.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].map((m) => m[1]))];
  const kb = scripts.reduce((sum, src) => sum + gzipSize(src), 0) / 1024;
  return { route: "/" + path.relative(APP_DIR, file).replace(/\.html$/, "").replace(/^index$/, ""), kb, scripts: scripts.length };
});

pages.sort((a, b) => b.kb - a.kb);
const over = pages.filter((p) => p.kb > BUDGET_KB);
const median = pages[Math.floor(pages.length / 2)]?.kb ?? 0;
console.log(`Checked ${pages.length} pages · budget ${BUDGET_KB} KB gz · median ${median.toFixed(0)} KB · largest ${pages[0]?.route} ${pages[0]?.kb.toFixed(0)} KB`);
for (const p of pages.slice(0, 5)) console.log(`  ${p.kb.toFixed(0).padStart(6)} KB  ${String(p.scripts).padStart(3)} scripts  ${p.route}`);
if (over.length) {
  console.error(`\n${over.length} page(s) over budget:`);
  for (const p of over.slice(0, 20)) console.error(`  ${p.kb.toFixed(0)} KB  ${p.route}`);
  process.exit(1);
}
