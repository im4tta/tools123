// Generates lib/tool-residency.ts — a per-tool audit of network vs fully-local
// behavior, derived from the tool registry (lib/tools.tsx) and a static scan of
// each tool's component source. Run: npm run audit:network
//
// Classification:
//   local    — no network requests and no external links found in the source.
//   external — processing stays on-device, but the tool offers outbound links
//              (href/window.open to https) that open when clicked.
//   network  — the tool itself makes network requests to function (fetch, XHR,
//              WebSocket, EventSource, remote assets/models/imports).
//
// Heuristic misses are corrected with MANUAL_OVERRIDES below, each carrying a
// human-written reason. The scan is intentionally conservative: any hit in the
// network set wins, so results err toward disclosure rather than under-reporting.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY = path.join(ROOT, "lib", "tools.tsx");
const OUT = path.join(ROOT, "lib", "tool-residency.ts");

const NETWORK_PATTERNS = [
  [/\bfetch\s*\(/, "fetch("],
  [/\bXMLHttpRequest\b/, "XMLHttpRequest"],
  [/new\s+WebSocket\s*\(/, "WebSocket"],
  [/\bEventSource\s*\(/, "EventSource"],
  [/\baxios\b/, "axios"],
  [/navigator\.sendBeacon\s*\(/, "sendBeacon"],
  [/import\s*\(\s*["'`](?:https?:|^\/\/)/, "remote dynamic import"],
  [/<img\b[^>]*\bsrc=["'`](?:https?:|^\/\/)/, "remote <img> src"],
  [/<script\b[^>]*\bsrc=["'`](?:https?:|^\/\/)/, "remote <script> src"],
  [/<link\b[^>]*\bhref=["'`](?:https?:|^\/\/)/, "remote <link> href"],
  [/\bsrc:\s*["'`](?:https?:|^\/\/)/, "remote src:"],
  [/\b\.src\s*=\s*["'`](?:https?:|^\/\/)/, "element.src = remote url"],
];

const EXTERNAL_PATTERNS = [
  [/window\.open\s*\(\s*["'`](?:https?:|^\/\/)/, "window.open(url)"],
  [/<a\b[^>]*\bhref=["'`](?:https?:|^\/\/)/, "<a href=url>"],
  [/\bhref:\s*["'`](?:https?:|^\/\/)/, "href: url"],
  [/location\.(?:href|assign|replace)\s*=\s*["'`](?:https?:|^\/\/)/, "location redirect"],
  [/\btarget=["'`]_blank["'`]/, "external <a> target=_blank"],
  [/\burl:\s*["'`](?:https?:|^\/\/)/, "data url:"],
  [/["'`](?:https?:)?\/\/fonts\.(?:googleapis|gstatic)\.com/, "Google Fonts reference"],
];

// Manual corrections for heuristic misses. Key = component file (relative to
// components/tools/, without extension). Reason replaces any detected reasons.
const MANUAL_OVERRIDES = {
  "dev/github-file-browser": {
    kind: "network",
    reason: "Calls the GitHub public API to list repo contents from the browser.",
  },
  "dev/readability-extractor": {
    kind: "network",
    reason: "Can fetch a URL directly; pasted HTML is processed locally.",
  },
  "geo/ev-station-finder": {
    kind: "external",
    reason: "Uses browser geolocation only on explicit opt-in and opens Google Maps / review links on demand.",
  },
  "geo/environment-dashboard": {
    kind: "network",
    reason: "Fetches live MEF weather/UV/AQI data.",
  },
  "geo/weather": {
    kind: "network",
    reason: "Fetches live weather data for the selected province.",
  },
  "geo/uv-index": {
    kind: "network",
    reason: "Fetches live UV index data.",
  },
  "geo/air-quality": {
    kind: "network",
    reason: "Fetches live air-quality data.",
  },
  "khmer/riel-usd": {
    kind: "network",
    reason: "Fetches the live MEF exchange rate (falls back to editable manual rate).",
  },
  "images/background-remover": {
    kind: "network",
    reason: "Downloads an AI model on first use, then runs it locally and caches it.",
  },
  "science/materials": {
    kind: "network",
    reason: "Loads the Three.js library from a CDN when the 3D atom view is opened.",
  },
  "meta/data-residency-map": {
    kind: "local",
    reason: "Statically reads the generated residency data; mentions 'XMLHttpRequest' only in explanatory text about how the audit itself works.",
  },
};

function scanFile(file) {
  const p = path.join(ROOT, "components", "tools", `${file}.tsx`);
  if (!fs.existsSync(p)) return { kind: "local", reasons: [`missing source: ${file}`] };
  const src = fs.readFileSync(p, "utf8");
  const network = NETWORK_PATTERNS.filter(([re]) => re.test(src)).map(([, label]) => label);
  if (network.length > 0) return { kind: "network", reasons: network };
  const external = EXTERNAL_PATTERNS.filter(([re]) => re.test(src)).map(([, label]) => label);
  if (external.length > 0) return { kind: "external", reasons: external };
  return { kind: "local", reasons: [] };
}

const slugify = (s) => s.toLowerCase().replace(/[\s/]+/g, "-");

// Pair tools are generated at runtime from UNIT_CATEGORY_UNITS in lib/tools.tsx,
// so their ids must be recomputed here rather than read from the source.
function parsePairs() {
  const src = fs.readFileSync(REGISTRY, "utf8");
  const block = src.match(/const UNIT_CATEGORY_UNITS:[\s\S]*?=\s*\{(?:[^{}]|\{[^{}]*\})*\};/);
  if (!block) throw new Error("Could not locate UNIT_CATEGORY_UNITS in lib/tools.tsx");
  const tools = [];
  const catRe = /(\w+): \{ label: "[^"]*", units: \[([^\]]*)\]\s*\}/g;
  let m;
  while ((m = catRe.exec(block[0]))) {
    const catKey = m[1];
    const units = m[2].split(",").map((u) => u.trim().replace(/^"|"$/g, "").trim());
    for (let i = 0; i < units.length; i++) {
      for (let j = i + 1; j < units.length; j++) {
        tools.push({
          id: `unit-${catKey}-${slugify(units[i])}-${slugify(units[j])}`,
          category: "math",
          file: "math/unit-pair",
        });
      }
    }
  }
  for (const [from, to] of [
    ["celsius", "fahrenheit"],
    ["celsius", "kelvin"],
    ["fahrenheit", "kelvin"],
  ]) {
    tools.push({ id: `unit-temperature-${slugify(from)}-${slugify(to)}`, category: "math", file: "math/temperature-pair" });
  }
  return tools;
}

function parseRegistry() {
  const src = fs.readFileSync(REGISTRY, "utf8");
  const lines = src.split("\n");
  const tools = [];
  let warned = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("...") || trimmed === "") continue;
    if (trimmed.includes("${")) continue; // generated pair-template lines, not concrete defs
    const entry = trimmed.match(/^\{ id: "([^"]+)",[^\n]*?Component: load\("(\w+)", "([^"]+)"\) \},?$/);
    if (entry) {
      tools.push({ id: entry[1], category: entry[2], file: `${entry[2]}/${entry[3]}` });
      continue;
    }
    if (trimmed.startsWith("{ id:")) {
      warned++;
      console.warn(`  !! unparsed tool line: ${line.slice(0, 90)}`);
    }
  }
  tools.push(...parsePairs());
  console.log(`Parsed ${tools.length} tool registrations${warned ? ` (${warned} unparsed)` : ""}`);
  return tools;
}

function buildResidency(tools) {
  const byFile = new Map();
  for (const t of tools) {
    if (!byFile.has(t.file)) byFile.set(t.file, []);
    byFile.get(t.file).push(t.id);
  }
  const perFile = new Map();
  for (const [file] of byFile) perFile.set(file, scanFile(file));

  const record = {};
  for (const t of tools) {
    const detected = perFile.get(t.file);
    const override = MANUAL_OVERRIDES[t.file];
    record[t.id] = override
      ? { kind: override.kind, reasons: [override.reason], file: t.file }
      : { kind: detected.kind, reasons: detected.reasons, file: t.file };
  }
  return record;
}

const tools = parseRegistry();
const record = buildResidency(tools);

const counts = { local: 0, external: 0, network: 0 };
const byKindFile = { local: new Set(), external: new Set(), network: new Set() };
for (const t of tools) {
  const kind = record[t.id].kind;
  counts[kind]++;
  byKindFile[kind].add(record[t.id].file);
}
console.log(`Residency: ${counts.local} local · ${counts.external} external-links · ${counts.network} network`);
console.log("\nFiles classified as network:");
for (const f of [...byKindFile.network].sort()) console.log(`  ${f}`);
console.log("\nFiles classified as external:");
for (const f of [...byKindFile.external].sort()) console.log(`  ${f}`);

const linesOut = [
  "// GENERATED FILE — do not edit by hand.",
  "// Regenerate with `npm run audit:network` after adding a tool or changing a component.",
  "// Source: scripts/audit-network.mjs (parses lib/tools.tsx, scans components/tools sources).",
  "",
  "export type ResidencyKind = \"local\" | \"external\" | \"network\";",
  "",
  "export interface ToolResidency {",
  "  kind: ResidencyKind;",
  "  reasons: string[];",
  "  file: string;",
  "}",
  "",
  "export const TOOL_RESIDENCY: Record<string, ToolResidency> = {",
];
for (const id of Object.keys(record).sort()) {
  const r = record[id];
  const reasons = r.reasons.length ? JSON.stringify(r.reasons) : "[]";
  linesOut.push(`  ${JSON.stringify(id)}: { kind: "${r.kind}", reasons: ${reasons}, file: ${JSON.stringify(r.file)} },`);
}
linesOut.push("};");
linesOut.push("");

fs.writeFileSync(OUT, linesOut.join("\n"), "utf8");
console.log(`\nWrote ${OUT} (${Object.keys(record).length} tools).`);
