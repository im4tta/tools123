import { test } from "node:test";
import assert from "node:assert/strict";
import { inflateSync } from "node:zlib";
import { cambodiaDay, escapeHtml, findTools, parseCommand, parseWholeNumber, recentTools } from "../lib/telegram/core.ts";
import { gridToPng } from "../lib/telegram/png.ts";

const tools = [
  { id: "pdf-merge", title: "PDF Merge", khmerTitle: "បញ្ចូល PDF", keywords: ["combine", "pdf"], category: "office", addedOn: "2026-11-27T10:00:00+07:00" },
  { id: "merge-images", title: "Merge Images", keywords: ["combine", "photo"], category: "images", addedOn: "2026-10-01T10:00:00+07:00" },
  { id: "qr", title: "QR Code Generator", khmerTitle: "បង្កើត QR", keywords: ["qr", "barcode"], category: "office" },
];

test("parseCommand handles bot mentions and plain text", () => {
  assert.deepEqual(parseCommand("/find@ToolboxBot merge pdf"), { command: "find", args: "merge pdf" });
  assert.deepEqual(parseCommand("/start"), { command: "start", args: "" });
  assert.deepEqual(parseCommand("watershed"), { command: null, args: "watershed" });
});

test("findTools ranks title matches first and needs every word", () => {
  assert.deepEqual(findTools(tools, "merge").map((t) => t.id), ["merge-images", "pdf-merge"]);
  assert.deepEqual(findTools(tools, "pdf merge").map((t) => t.id), ["pdf-merge"]);
  assert.deepEqual(findTools(tools, "qr").map((t) => t.id), ["qr"]);
  assert.deepEqual(findTools(tools, "បញ្ចូល").map((t) => t.id), ["pdf-merge"]);
  assert.deepEqual(findTools(tools, "  "), []);
});

test("recentTools keeps only the window, newest first", () => {
  assert.deepEqual(recentTools(tools, new Date("2026-11-28T00:00:00Z"), 7).map((t) => t.id), ["pdf-merge"]);
});

test("numbers, html and day helpers", () => {
  assert.equal(parseWholeNumber("1,250,000"), "1250000");
  assert.equal(parseWholeNumber("១២៥"), "125");
  assert.equal(parseWholeNumber("12.5"), null);
  assert.equal(escapeHtml("<a & b>"), "&lt;a &amp; b&gt;");
  assert.equal(cambodiaDay(new Date("2026-11-27T17:30:00Z")), cambodiaDay(new Date("2026-11-28T16:00:00Z")));
});

test("gridToPng writes a valid greyscale PNG", () => {
  const png = gridToPng(3, (r, c) => r === c, 2, 1);
  assert.equal(png.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(png.readUInt32BE(16), 10); // (3 + 2) * 2 pixels wide
  const idatLen = png.readUInt32BE(33);
  const raw = inflateSync(png.subarray(41, 41 + idatLen));
  assert.equal(raw.length, 10 * 11);
});

test("short words must start a word", () => {
  const extra = [...tools, { id: "iqr", title: "Quartile Analyzer", keywords: ["iqr"], category: "math" }];
  assert.deepEqual(findTools(extra, "qr").map((t) => t.id), ["qr"]);
});
