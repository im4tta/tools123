#!/usr/bin/env node
// Guardrail: loads every prerendered route at phone width and reports horizontal overflow and
// runtime errors. Needs a production server and Playwright:
//   npx next build && npx next start -p 3123 &
//   BASE_URL=http://localhost:3123 npm run audit:mobile        (ONLY=id1,id2 to limit)
// Exits 1 when any page overflows the viewport or throws.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3123").replace(/\/$/, "");
const WIDTH = Number(process.env.WIDTH ?? 360);
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 6);
const APP_DIR = path.join(process.cwd(), ".next/server/app");

async function loadPlaywright() {
  try { return await import("playwright"); } catch {}
  try { return createRequire(import.meta.url)(path.join(execSync("npm root -g").toString().trim(), "playwright")); } catch {}
  console.error("Playwright is not installed (npm i -D playwright, or install it globally).");
  process.exit(2);
}

if (!fs.existsSync(APP_DIR)) { console.error("No .next/server/app — run `next build` first."); process.exit(2); }
const only = process.env.ONLY?.split(",").map((s) => s.trim()).filter(Boolean);
const routes = (only?.length ? only : fs.readdirSync(APP_DIR).filter((f) => f.endsWith(".html")).map((f) => f.replace(/\.html$/, "")))
  .map((r) => (r === "index" ? "" : r));

const { chromium } = await loadPlaywright();
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const context = await browser.newContext({ viewport: { width: WIDTH, height: 780 }, isMobile: true, hasTouch: true });
const results = [];
let next = 0;

async function worker() {
  const page = await context.newPage();
  let errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
  while (next < routes.length) {
    const route = routes[next++];
    errors = [];
    try {
      await page.goto(`${BASE_URL}/${route}`, { waitUntil: "load", timeout: 30000 });
      await page.waitForTimeout(900);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      results.push({ route: "/" + route, overflow, errors: [...errors] });
    } catch (e) {
      results.push({ route: "/" + route, overflow: 0, errors: [`navigation failed: ${String(e.message).slice(0, 120)}`] });
    }
  }
  await page.close();
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
await browser.close();

const overflowing = results.filter((r) => r.overflow > 1);
const throwing = results.filter((r) => r.errors.length);
console.log(`Checked ${results.length} routes at ${WIDTH}px · overflow ${overflowing.length} · page errors ${throwing.length}`);
for (const r of overflowing) console.log(`  overflow +${r.overflow}px  ${r.route}`);
for (const r of throwing) console.log(`  error  ${r.route}  ${r.errors[0]}`);
process.exit(overflowing.length || throwing.length ? 1 : 0);
