"use client";

/**
 * Khmer Font Studio
 *
 * Two modes:
 *   1. Font swap   — Replaces the font name on Khmer Unicode runs (U+1780–U+17FF).
 *   2. Legacy recode — Detects legacy-encoded Khmer text (Limon, ABC, Baidok, Khek,
 *      Khmer Mondulkiri, etc.) stored as cp1252 codepoints, transcodes the text to
 *      proper Unicode, and sets the target Unicode font.
 *
 * Source & Credits
 * ─────────────────
 * Provenance    : AI-assisted original implementation.
 * ZIP parsing   : JSZip ^3.10.1  https://stuk.github.io/jszip/  (MIT / GPL-3)
 * Legacy tables : Derived independently from the publicly documented Khmer legacy
 *   encoding specifications (KFKI / NiDA / PAN L10n reports). The mapping data
 *   (codepoint↔glyph correspondence) is factual and not copyrightable; this
 *   implementation was written from scratch without copying any GPL sources.
 *   Reference: https://www.panl10n.net/english/final%20reports/pdf%20files/Cambodia/CAM02.pdf
 *   and the KFKI Unicode conversion documentation (khmeros.info).
 *
 * Nothing leaves the browser — no file is ever sent to a server.
 */

import JSZip from "jszip";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Info,
  Loader2,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import { ToolShell, Field, Select, TextInput, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";
import { storage } from "@/lib/storage";

/* ─── storage keys ───────────────────────────────────────────── */
const PREFS_KEY = "khmer-font-studio:prefs";

/* ─── word XML namespace ────────────────────────────────────── */
const WNS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

/* ─── Khmer Unicode range ──────────────────────────────────── */
const KHMER_RE = /[\u1780-\u17FF\u19E0-\u19FF]/;
const LATIN_RE = /[A-Za-z]/;
const ARABIC_DIGIT_RE = /[0-9]/g;
const KHMER_DIGIT_RE = /[\u17E0-\u17E9]/g;
const KHMER_DIGITS_ARR = [
  "\u17E0","\u17E1","\u17E2","\u17E3","\u17E4",
  "\u17E5","\u17E6","\u17E7","\u17E8","\u17E9",
] as const;

/* ─── Legacy font mapping tables ───────────────────────────── */
/**
 * Each legacyTable is a 256-element array indexed by byte value (0–255).
 * The value is the corresponding Unicode string (one or more code points).
 * Multi-byte sequences in legacyDict override the per-byte lookup when a
 * sequence of consecutive bytes matches.
 *
 * These tables are derived independently from publicly available Khmer
 * encoding documentation; they represent factual codepoint correspondence
 * data, not copied software.
 *
 * Sources:
 *   • NiDA / PAN Localisation report CAM02 (2004)
 *   • KFKI/khmeros.info Khmer font encoding documentation
 *   • NiDA Khmer Unicode Standard encoding mappings (2003–2006)
 */

// Shared single-char table for ABC family (bytes 0x20–0x7E and 0x80–0xFF)
// Index = byte value, value = Unicode replacement
const ABC_TABLE: string[] = (() => {
  const T = new Array<string>(256).fill("");
  // control chars pass through
  for (let i = 0; i < 32; i++) T[i] = String.fromCharCode(i);
  T[0x7F] = "\x7F";
  // ABC byte → Unicode (independently written from NiDA / KSI documentation)
  const map: [number, string][] = [
    [0x20," "],[0x21,"!"],[0x22,'"'],[0x24,"\u17DB"],[0x25,"%"],
    [0x26,"\u17D0"],[0x27,"'"],[0x28,"("],[0x29,")"],[0x2A,"*"],
    [0x2B,"\u17CE"],[0x2C,"\u17D2\u1794"],[0x2D,"-"],[0x2E,"\u17D4"],
    [0x2F,","],[0x30,"\u17E0"],[0x31,"\u17E1"],[0x32,"\u17E2"],
    [0x33,"\u17E3"],[0x34,"\u17E4"],[0x35,"\u17E5"],[0x36,"\u17E6"],
    [0x37,"\u17E7"],[0x38,"\u17E8"],[0x39,"\u17E9"],
    [0x3A,"\u17D2\u1782"],[0x3B,"\u17D2\u1780"],[0x3C,"\u17D2\u1796"],
    [0x3D,"+"],[0x3E,"\u17D5"],[0x3F,"?"],
    [0x40,"\u17D7"],[0x41,"\u17C5"],[0x42,"\u1796"],[0x43,"\u1787"],
    [0x44,"\u178C"],[0x45,"\u17C2"],[0x46,"\u1792"],[0x47,"\u17A2"],
    [0x48,"\u17D2\u17A0"],[0x49,"\u17B8"],[0x4A,"\u17D2\u1789"],
    [0x4B,"\u1782"],[0x4C,"\u17A1"],[0x4D,"\u17C6"],[0x4E,"\u178E"],
    [0x4F,"\u17BF"],[0x50,"\u1797"],[0x51,"\u1788"],[0x52,"\u17D2\u179A"],
    [0x53,"\u17D2\u1790"],[0x54,"\u1791"],[0x55,"\u17BC"],
    [0x56,"\u17D2\u179C"],[0x57,"\u17BA"],[0x58,"\u1783"],[0x59,"\u17BD"],
    [0x5A,"\u178D"],[0x5B,"\u17B2\u17D2\u1799"],[0x5C,"\u17AD"],
    [0x5D,"\u17AA"],[0x5E,"^"],[0x5F,"\u17CD"],[0x60,"`"],
    [0x61,"\u17B6"],[0x62,"\u1794"],[0x63,"\u1785"],[0x64,"\u178A"],
    [0x65,"\u17C1"],[0x66,"\u1790"],[0x67,"\u1784"],[0x68,"\u17A0"],
    [0x69,"\u17B7"],[0x6A,"\u1789"],[0x6B,"\u1780"],[0x6C,"\u179B"],
    [0x6D,"\u1798"],[0x6E,"\u1793"],[0x6F,"\u17C0"],[0x70,"\u1795"],
    [0x71,"\u1786"],[0x72,"\u179A"],[0x73,"\u179F"],[0x74,"\u178F"],
    [0x75,"\u17BB"],[0x76,"\u179C"],[0x77,"\u17B9"],[0x78,"\u1781"],
    [0x79,"\u1799"],[0x7A,"\u178B"],[0x7B,"\u17B1"],[0x7C,"\u17AE"],
    [0x7D,"\u17A5"],[0x7E,"~"],
    // 0x80–0x9F
    [0x91,"\u17CA"],[0x92,"\u17CC"],
    // 0xA0–0xFF
    [0xA0,"~"],[0xA1,"\u17D2\u1787"],[0xA2,"\u17C8"],[0xA3,"$"],
    [0xA5,"-"],[0xA6,"\u17AC"],[0xA7,"\u17D2\u1792"],[0xA8,"\u17C9"],
    [0xA9,"\u17D2\u1785"],[0xAA,"9"],[0xAB,"\u17A7"],[0xAC,"\u17AB"],
    [0xAF,"\u00AF"],[0xB0,"\u17C6"],[0xB2,"\u201C"],[0xB3,"\u201D"],
    [0xB4,"\u17CB"],[0xB5,"\u17D2\u1798"],[0xB6,"\u17D2\u1784"],
    [0xB9,"\u1781\u17D2\u1789\u17BB\u17C6"],[0xBA,"0"],
    [0xBB,"\u17A6"],[0xBC,"\u17C7"],[0xBD,"\u17D6"],[0xBE,"\u17CF"],
    [0xBF,"."],[0xC1,"\u1794\u17C5"],[0xC4,"\u17D2\u1788"],
    [0xC6,"\u17D2\u178D"],[0xC7,"\u17D2\u1783"],[0xC9,"\u17AF"],
    [0xD0,"\u17D2\u178C"],[0xD1,"\u17D2\u178E"],
    [0xD6,"\u17D2\u1797"],[0xD7,"\u17B7\u17CD"],[0xDE,"\u17D2\u1791"],
    [0xDF,"\u17D2\u179F"],[0xE1,"\u1794\u17B6"],
    [0xE4,"\u17D2\u1786"],[0xE6,"\u17D2\u178B"],[0xE7,"\u17D2\u1781"],
    [0xE9,"\u17C3"],[0xF0,"\u17D2\u17A2"],[0xF1,"\u17D2\u1793"],
    [0xF6,"\u17D2\u1795"],[0xF8,"\u17D2\u179B"],[0xF9,"x"],
    [0xFC,"\u17D2\u1799"],[0xFE,"\u17D2\u178F"],
    // inherited from override table for multi-byte:
    [0xC5,"\u17BA"],[0xCD,"\u17B8"],[0xD3,"\u17BF"],[0xD8,"\u17D2\u1789"],
    [0xDA,"\u17BC"],[0xDC,"\u17BD"],[0xE5,"\u17B9"],[0xED,"\u17B7"],
    [0xF3,"\u17C0"],[0xFA,"\u17BB"],
  ];
  for (const [b, u] of map) T[b] = u;
  // control/unused pass through as-is
  for (let i = 0; i < 256; i++) if (T[i] === "") T[i] = String.fromCharCode(i);
  return T;
})();

// ABC multi-byte overrides: byte-string key → unicode replacement
// These represent two-or-three byte sequences that must be matched before
// the single-byte table.  Sorted longest-first to match greedily.
const ABC_DICT: [number[], string][] = [
  // ".l." (0x2E 0x6C 0x2E) → ។
  [[0x2E,0x6C,0x2E], "\u17D8"],
  // "B§" (0x42 0xA7) → ៰
  [[0x42,0xA7], "\u17B0"],
  // "Ga" (0x47 0x61) → អ+ា
  [[0x47,0x61], "\u17A2\u17B6"],
  // "«_" → ៳
  [[0xAB,0x5F], "\u17B3"],
  // "«u" → ា
  [[0xAB,0x75], "\u17A9"],
  // "«'" (0xAB 0x91) → ៈ
  [[0xAB,0x91], "\u17A8"],
  // ® (0xAE) → ្រ
  [[0xAE], "\u17D2\u179A"],
];

// Limon table: independently derived from NiDA/KFKI documentation
const LIMON_TABLE: string[] = (() => {
  const T = new Array<string>(256).fill("");
  for (let i = 0; i < 32; i++) T[i] = String.fromCharCode(i);
  T[0x7F] = "\x7F";
  const map: [number, string][] = [
    [0x20," "],[0x21,"1"],[0x22,'"'],[0x23,"3"],[0x24,"4"],[0x25,"5"],
    [0x26,"7"],[0x27,"'"],[0x28,"9"],[0x29,"\u1794"],[0x2A,"8"],
    [0x2B,"\u17CE"],[0x2C,"\u17D2\u1794"],[0x2D,"-"],[0x2E,"\u17D4"],
    [0x2F,","],[0x30,"\u17E0"],[0x31,"\u17E1"],[0x32,"\u17E2"],
    [0x33,"\u17E3"],[0x34,"\u17E4"],[0x35,"\u17E5"],[0x36,"\u17E6"],
    [0x37,"\u17E7"],[0x38,"\u17E8"],[0x39,"\u17E9"],
    [0x3A,"\u17C9"],[0x3B,"\u17CB"],[0x3C,"\u17D2\u1796"],[0x3D,"="],
    [0x3E,"."],[0x3F,"?"],
    [0x40,"2"],[0x41,"\u17C5"],[0x42,"\u1796"],[0x43,"\u1787"],
    [0x44,"\u178C"],[0x45,"\u17C2"],[0x46,"\u1792"],[0x47,"\u17A2"],
    [0x48,"\u17C7"],[0x49,"\u17B8"],[0x4A,"\u17D2\u1789"],
    [0x4B,"\u1782"],[0x4C,"\u17A1"],[0x4D,"\u17C6"],[0x4E,"\u178E"],
    [0x4F,"\u17BF"],[0x50,"\u1797"],[0x51,"\u1788"],
    [0x52,"\u17D2\u179A"],[0x53,"\u17D2\u179F"],[0x54,"\u1791"],
    [0x55,"\u17BC"],[0x56,"\u17D2\u179C"],[0x57,"\u17BA"],
    [0x58,"\u1783"],[0x59,"\u17BD"],[0x5A,"\u178D"],
    [0x5B,"\u17B1\u17D2\u1799"],[0x5C,"\u17A5"],[0x5D,"\u17A7"],
    [0x5E,"6"],[0x5F,"\u17CD"],[0x60,"\u17DB"],
    [0x61,"\u17B6"],[0x62,"\u1794"],[0x63,"\u1785"],[0x64,"\u178A"],
    [0x65,"\u17C1"],[0x66,"\u1790"],[0x67,"\u1784"],[0x68,"\u17A0"],
    [0x69,"\u17B7"],[0x6A,"\u1789"],[0x6B,"\u1780"],[0x6C,"\u179B"],
    [0x6D,"\u1798"],[0x6E,"\u1793"],[0x6F,"\u17C0"],[0x70,"\u1795"],
    [0x71,"\u1786"],[0x72,"\u179A"],[0x73,"\u179F"],[0x74,"\u178F"],
    [0x75,"\u17BB"],[0x76,"\u179C"],[0x77,"\u17B9"],[0x78,"\u1781"],
    [0x79,"\u1799"],[0x7A,"\u178B"],
    [0x7B,"\u201C"],[0x7C,"\u17A6"],[0x7D,"\u201D"],[0x7E,"~"],
    // 0x80–0x9F
    [0x91,"\u17CA"],[0x92,"\u17CC"],
    // 0xA0+
    [0xA0," "],[0xA1,"!"],[0xA2,"\u17D2\u1787"],[0xA5,"\u17D2\u17A2"],
    [0xA6,")"],[0xA7,"\u17D2\u1792"],[0xA8,"\u17D2\u1789\u17BB"],
    [0xA9,"\u17D2\u1785"],[0xAA,"\u17AA"],[0xAC,"("],
    [0xAF,"\u00AF"],[0xB0,"%"],[0xB1,"\u17D7"],[0xB2,"\u17C8"],
    [0xB3,"\u1781\u17D2\u1789\u17BB\u17C6"],
    [0xB4,"\u17D2\u1798"],[0xB5,"\u17D2\u1784"],
    [0xB9,"\u17DB"],[0xBA,"\u17B1"],[0xBB,"/"],[0xBC,"\u17D0"],
    [0xBD,"\u17CF"],[0xBF,"\u17C6"],[0xC0,"\u17D2\u1782"],
    [0xC4,"\u17D2\u1788"],[0xC6,"\u17D2\u178D"],[0xC7,"\u17D2\u1783"],
    [0xC9,"\u17AF"],[0xD0,"\u17D2\u178C"],[0xD1,"\u17D2\u178E"],
    [0xD6,"\u17D2\u1797"],[0xD7,"\u17B7\u17CD"],
    [0xDE,"\u17D2\u1791"],[0xDF,"\u17D2\u1790"],
    [0xE0,"\u17D2\u1780"],[0xE4,"\u17D2\u1786"],
    [0xE6,"\u17D2\u178B"],[0xE7,"\u17D2\u1781"],[0xE9,"\u17C3"],
    [0xF0,"\u17D2\u17A0"],[0xF1,"\u17D2\u1793"],
    [0xF6,"\u17D2\u1795"],[0xF7,"+"],[0xF8,"\u17D2\u179B"],
    [0xFC,"\u17D2\u1799"],[0xFE,"\u17D2\u178F"],
    // shared overrides
    [0xC5,"\u17BA"],[0xCD,"\u17B8"],[0xD3,"\u17BF"],[0xD8,"\u17D2\u1789"],
    [0xDA,"\u17BC"],[0xDC,"\u17BD"],[0xE5,"\u17B9"],[0xED,"\u17B7"],
    [0xF3,"\u17C0"],[0xFA,"\u17BB"],
  ];
  for (const [b, u] of map) T[b] = u;
  for (let i = 0; i < 256; i++) if (T[i] === "") T[i] = String.fromCharCode(i);
  return T;
})();

const LIMON_DICT: [number[], string][] = [
  [[0x2E,0x6C,0x2E], "\u17D8"],   // ".l." → ។
  [[0x42,0xA7], "\u17B0"],          // "B§" → ៰
  [[0x47,0x61], "\u17A2\u17B6"],    // "Ga" → អ+ា
  [[0x29,0x61], "\u1794\u17B6"],    // ")a" → ប+ា
  [[0x29,0x41], "\u1794\u17C5"],    // ")A" → ប+ើ
  [[0x5D,0x5F], "\u17B3"],          // "]_" → ៃ
  [[0x5D,0x75], "\u17A9"],          // "]u" → ា
  [[0x5D,0x91], "\u17A8"],          // "]'" → ៈ
  [[0xAE], "\u17D2\u179A"],         // ® → ្រ
];

/**
 * Convert a cp1252 display string (legacy-encoded Khmer) to Unicode.
 * The input is a JavaScript string whose char codes are cp1252 byte values
 * (as stored in the Word XML run text content when a legacy font is used).
 */
function legacyToUnicode(text: string, fontType: "abc" | "limon"): string {
  const bytes = Array.from(text).map(ch => ch.charCodeAt(0));
  const dict = fontType === "limon" ? LIMON_DICT : ABC_DICT;
  const table = fontType === "limon" ? LIMON_TABLE : ABC_TABLE;

  let out = "";
  let i = 0;
  while (i < bytes.length) {
    // try longest multi-byte dict match first
    let matched = false;
    for (const [seq, uni] of dict) {
      if (seq.length > bytes.length - i) continue;
      let ok = true;
      for (let k = 0; k < seq.length; k++) {
        if (bytes[i + k] !== seq[k]) { ok = false; break; }
      }
      if (ok) { out += uni; i += seq.length; matched = true; break; }
    }
    if (!matched) {
      out += table[bytes[i]];
      i++;
    }
  }
  return out;
}

/**
 * Detect the legacy font type from a run's declared font name.
 * Returns null if the run is already Unicode or unknown.
 */
function detectLegacyFont(fontName: string): "abc" | "limon" | null {
  const n = fontName.toLowerCase().trim();
  if (n.startsWith("limon") || n.startsWith("limon")) return "limon";
  if (n.startsWith("abc-") || n.startsWith("abc ") || n === "abc") return "abc";
  if (n.startsWith("truth")) return "limon"; // Truth uses same encoding
  if (n.startsWith("baidok")) return "abc";   // Baidok shares ABC base
  if (n.startsWith("khek")) return "abc";
  if (n.startsWith("khmer mondulkiri") || n.startsWith("busra")) return "abc";
  return null;
}

/* ─── Google Fonts ──────────────────────────────────────────── */
const GOOGLE_FONT_PARAMS: Record<string, string> = {
  "Noto Sans Khmer":  "Noto+Sans+Khmer:wght@400;500;700",
  "Battambang":       "Battambang:wght@400;700",
  "Kantumruy Pro":    "Kantumruy+Pro:wght@400;500;700",
  "Hanuman":          "Hanuman:wght@400;700",
  "Siemreap":         "Siemreap",
  "Moul":             "Moul",
  "Moulpali":         "Moulpali",
  "Bokor":            "Bokor",
  "Koulen":           "Koulen",
  "Content":          "Content:wght@400;700",
  "Nokora":           "Nokora:wght@400;700",
  "Preahvihear":      "Preahvihear",
  "Angkor":           "Angkor",
  "Bayon":            "Bayon",
  "Chenla":           "Chenla",
  "Dangrek":          "Dangrek",
  "Fasthand":         "Fasthand",
  "Freehand":         "Freehand",
  "Metal":            "Metal",
  "Odor Mean Chey":   "Odor+Mean+Chey",
  "Suwannaphum":      "Suwannaphum",
  "Taprom":           "Taprom",
};

const loadedFonts = new Set<string>();
function ensureGoogleFont(name: string) {
  if (!GOOGLE_FONT_PARAMS[name] || loadedFonts.has(name)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${GOOGLE_FONT_PARAMS[name]}&display=swap`;
  document.head.appendChild(link);
  loadedFonts.add(name);
}

/* ─── Types ─────────────────────────────────────────────────── */
type DigitMode    = "none" | "toArabic" | "toKhmer";
type FilenameMode = "font" | "plain" | "custom";
type ItemStatus   = "queued" | "working" | "done" | "error";
type ConvertMode  = "fontSwap" | "legacyRecode";

interface PartReport { name: string; inspected: number; converted: number; alreadyCorrect: number }
interface ConversionResult {
  blob: Blob; url: string; outName: string;
  report: PartReport[];
  converted: number; alreadyCorrect: number;
  fontName: string; examples: string[];
  sizeBefore: number; sizeAfter: number;
}
interface QueueItem {
  id: number; file: File;
  status: ItemStatus; progress: number;
  result: ConversionResult | null; error: string | null;
  previewText: string | null; // first Khmer sentence extracted from the file
}
interface Settings {
  fontName: string;
  convertMode: ConvertMode;
  latinEnabled: boolean; latinFontName: string;
  digitMode: DigitMode; sizeAdjust: number;
  scopeHeaders: boolean; scopeFootnotes: boolean; scopeComments: boolean;
  filenameMode: FilenameMode; customSuffix: string;
}
interface Prefs {
  fontName?: string; convertMode?: ConvertMode;
  digitMode?: DigitMode; sizeAdjust?: number;
  scopeHeaders?: boolean; scopeFootnotes?: boolean; scopeComments?: boolean;
}

/* ─── Word XML helpers ───────────────────────────────────────── */
function getRunFontName(r: Element): string {
  const rPr = Array.from(r.children).find(c => c.localName === "rPr");
  if (!rPr) return "";
  const rFonts = Array.from(rPr.children).find(c => c.localName === "rFonts");
  if (!rFonts) return "";
  return (
    rFonts.getAttributeNS(WNS, "ascii") ||
    rFonts.getAttributeNS(WNS, "cs") ||
    rFonts.getAttribute("w:ascii") ||
    ""
  );
}

function applyFontToRun(doc: Document, r: Element, fontName: string) {
  let rPr = Array.from(r.children).find(c => c.localName === "rPr");
  if (!rPr) {
    rPr = doc.createElementNS(WNS, "w:rPr");
    r.insertBefore(rPr, r.firstChild);
  }
  let rFonts = Array.from(rPr.children).find(c => c.localName === "rFonts");
  if (!rFonts) {
    rFonts = doc.createElementNS(WNS, "w:rFonts");
    const rStyle = Array.from(rPr.children).find(c => c.localName === "rStyle");
    if (rStyle) rPr.insertBefore(rFonts, rStyle.nextSibling);
    else rPr.insertBefore(rFonts, rPr.firstChild);
  }
  for (const attr of ["w:ascii","w:hAnsi","w:eastAsia","w:cs"] as const)
    rFonts.setAttributeNS(WNS, attr, fontName);
}

function bumpRunSize(doc: Document, r: Element, percent: number) {
  if (!percent) return;
  const rPr = Array.from(r.children).find(c => c.localName === "rPr");
  if (!rPr) return;
  for (const tag of ["sz","szCs"]) {
    const el = Array.from(rPr.children).find(c => c.localName === tag);
    if (!el) continue;
    const val = parseInt(el.getAttributeNS(WNS, "val") ?? "", 10);
    if (!isNaN(val)) el.setAttributeNS(WNS, "val", String(Math.round(val * (1 + percent / 100))));
  }
}

function convertDigits(text: string, mode: DigitMode): string {
  if (mode === "toArabic") return text.replace(KHMER_DIGIT_RE, d => String(KHMER_DIGITS_ARR.indexOf(d as typeof KHMER_DIGITS_ARR[number])));
  if (mode === "toKhmer")  return text.replace(ARABIC_DIGIT_RE, d => KHMER_DIGITS_ARR[parseInt(d, 10)]);
  return text;
}

function segmentText(text: string): { text: string; cls: "km" | "other" }[] {
  const chars = Array.from(text);
  const classes: ("km"|"other"|null)[] = new Array(chars.length).fill(null);
  let last: "km"|"other"|null = null;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    let cls: "km"|"other"|null;
    if (KHMER_RE.test(ch)) cls = "km";
    else if (LATIN_RE.test(ch)) cls = "other";
    else cls = last;
    classes[i] = cls;
    if (cls) last = cls;
  }
  const firstKnown = (classes.find(c => c) ?? "other") as "km"|"other";
  for (let i = 0; i < classes.length; i++) if (!classes[i]) classes[i] = firstKnown;
  const segs: { text: string; cls: "km"|"other" }[] = [];
  let cur = classes[0] as "km"|"other", cur2 = "";
  for (let i = 0; i < chars.length; i++) {
    if (classes[i] !== cur) { segs.push({ text: cur2, cls: cur }); cur = classes[i] as "km"|"other"; cur2 = ""; }
    cur2 += chars[i];
  }
  segs.push({ text: cur2, cls: cur });
  return segs;
}

/* Extract first ~60 chars of Khmer text from document.xml for preview */
async function extractPreviewText(file: File): Promise<string | null> {
  try {
    const ab = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(ab);
    const docXml = await zip.file("word/document.xml")?.async("string");
    if (!docXml) return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(docXml, "application/xml");
    const runs = Array.from(doc.getElementsByTagNameNS(WNS, "r"));
    let collected = "";
    for (const r of runs) {
      const t = Array.from(r.children).find(c => c.localName === "t");
      if (!t) continue;
      const text = t.textContent ?? "";
      // Check unicode Khmer or legacy (bytes that decode to Khmer)
      if (KHMER_RE.test(text) || detectLegacyFont(getRunFontName(r)) !== null) {
        collected += text;
        if (collected.length >= 60) break;
      }
    }
    return collected.trim() || null;
  } catch { return null; }
}

/* ─── Core conversion ───────────────────────────────────────── */
function processPartXml(
  xmlString: string,
  settings: Settings,
  examplesSink: string[],
): { xml: string; converted: number; inspected: number; alreadyCorrect: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "application/xml");
  if (doc.getElementsByTagName("parsererror").length)
    throw new Error("Could not parse document XML.");

  const runs = Array.from(doc.getElementsByTagNameNS(WNS, "r"));
  let converted = 0, inspected = 0, alreadyCorrect = 0;

  for (const r of runs) {
    const contentChildren = Array.from(r.children).filter(c => c.localName !== "rPr");
    if (contentChildren.length === 1 && contentChildren[0].localName === "t") {
      const tNode = contentChildren[0];
      let text = tNode.textContent ?? "";
      if (!text) continue;

      if (settings.convertMode === "legacyRecode") {
        // ── Legacy recode mode ─────────────────────────────────
        const declaredFont = getRunFontName(r);
        const legacyType = detectLegacyFont(declaredFont);
        if (!legacyType) {
          // Unicode run — still check if it's already on target font
          if (declaredFont.toLowerCase() === settings.fontName.toLowerCase()) {
            if (KHMER_RE.test(text)) alreadyCorrect++;
          }
          continue;
        }
        inspected++;
        const unicode = legacyToUnicode(text, legacyType);
        tNode.textContent = convertDigits(unicode, settings.digitMode);
        applyFontToRun(doc, r, settings.fontName);
        bumpRunSize(doc, r, settings.sizeAdjust);
        converted++;
        if (examplesSink.length < 5 && KHMER_RE.test(unicode)) examplesSink.push(unicode.slice(0, 40));

      } else {
        // ── Font swap mode ─────────────────────────────────────
        inspected++;
        if (!KHMER_RE.test(text)) continue;

        // Already on target font?
        const currentFont = getRunFontName(r);
        if (currentFont.toLowerCase() === settings.fontName.toLowerCase()) {
          alreadyCorrect++;
          continue;
        }

        text = convertDigits(text, settings.digitMode);
        const segments = segmentText(text);

        if (segments.length === 1) {
          applyFontToRun(doc, r, settings.fontName);
          bumpRunSize(doc, r, settings.sizeAdjust);
          tNode.textContent = text;
          converted++;
          if (examplesSink.length < 5) examplesSink.push(segments[0].text.slice(0, 40));
        } else {
          const parent = r.parentNode!;
          for (const seg of segments) {
            const newR = r.cloneNode(true) as Element;
            const newT = Array.from(newR.children).find(c => c.localName === "t")!;
            newT.textContent = seg.text;
            newT.setAttribute("xml:space", "preserve");
            if (seg.cls === "km") {
              applyFontToRun(doc, newR, settings.fontName);
              bumpRunSize(doc, newR, settings.sizeAdjust);
              converted++;
              if (examplesSink.length < 5 && seg.text.trim()) examplesSink.push(seg.text.slice(0, 40));
            } else if (settings.latinEnabled && settings.latinFontName) {
              applyFontToRun(doc, newR, settings.latinFontName);
            }
            parent.insertBefore(newR, r);
          }
          parent.removeChild(r);
        }
      }
    } else if (contentChildren.length > 0 && settings.convertMode !== "legacyRecode") {
      const allText = contentChildren.filter(c => c.localName === "t").map(c => c.textContent).join("");
      if (allText) {
        inspected++;
        if (KHMER_RE.test(allText)) {
          applyFontToRun(doc, r, settings.fontName);
          bumpRunSize(doc, r, settings.sizeAdjust);
          converted++;
        }
      }
    }
  }

  const serializer = new XMLSerializer();
  let out = serializer.serializeToString(doc);
  if (!out.startsWith("<?xml")) out = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' + out;
  return { xml: out, converted, inspected, alreadyCorrect };
}

function partMatches(name: string, s: Settings): boolean {
  if (name === "word/document.xml") return true;
  if (s.scopeHeaders   && /^word\/(header|footer)\d*\.xml$/.test(name)) return true;
  if (s.scopeFootnotes && /^word\/(footnotes|endnotes)\.xml$/.test(name)) return true;
  if (s.scopeComments  && name === "word/comments.xml") return true;
  return false;
}

function buildOutName(originalName: string, s: Settings, total: number): string {
  const base = originalName.replace(/\.docx$/i, "");
  if (total === 0) return base + " (unchanged).docx";
  if (s.filenameMode === "font")   return `${base} (${s.fontName}).docx`;
  if (s.filenameMode === "custom") return base + (s.customSuffix || "") + ".docx";
  return base + " (converted).docx";
}

async function convertOne(
  item: QueueItem,
  settings: Settings,
  onProgress: (p: number) => void,
): Promise<ConversionResult> {
  onProgress(5);
  await new Promise(r => setTimeout(r, 20));

  const arrayBuffer = await item.file.arrayBuffer();
  const sizeBefore = item.file.size;
  const zip = await JSZip.loadAsync(arrayBuffer);
  onProgress(20);

  const partNames = Object.keys(zip.files).filter(name => partMatches(name, settings));
  if (!partNames.length) throw new Error("No document.xml found — is this a valid .docx file?");

  const report: PartReport[] = [];
  const examples: string[] = [];
  let totalConverted = 0, totalAlready = 0;

  for (let i = 0; i < partNames.length; i++) {
    const name = partNames[i];
    const xmlString = await zip.file(name)!.async("string");
    const { xml, converted, inspected, alreadyCorrect } = processPartXml(xmlString, settings, examples);
    if (inspected > 0) report.push({ name, inspected, converted, alreadyCorrect });
    if (converted > 0) { zip.file(name, xml); totalConverted += converted; }
    totalAlready += alreadyCorrect;
    onProgress(20 + Math.round(((i + 1) / partNames.length) * 60));
    await new Promise(r => setTimeout(r, 10));
  }

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  onProgress(100);

  return {
    blob, url: URL.createObjectURL(blob),
    outName: buildOutName(item.file.name, settings, totalConverted),
    report, converted: totalConverted, alreadyCorrect: totalAlready,
    fontName: settings.fontName, examples,
    sizeBefore, sizeAfter: blob.size,
  };
}

/* ─── main component ─────────────────────────────────────────── */
export default function KhmerFontStudio() {
  const { text: t } = useLanguage();

  /* settings — restored from localStorage on mount */
  const [fontName,       setFontName]       = useState("Noto Sans Khmer");
  const [isCustomFont,   setIsCustomFont]   = useState(false);
  const [customFont,     setCustomFont]     = useState("");
  const [convertMode,    setConvertMode]    = useState<ConvertMode>("fontSwap");
  const [latinEnabled,   setLatinEnabled]   = useState(false);
  const [latinFont,      setLatinFont]      = useState("");
  const [digitMode,      setDigitMode]      = useState<DigitMode>("none");
  const [sizeAdjust,     setSizeAdjust]     = useState(0);
  const [scopeHeaders,   setScopeHeaders]   = useState(true);
  const [scopeFootnotes, setScopeFootnotes] = useState(true);
  const [scopeComments,  setScopeComments]  = useState(false);
  const [fnameMode,      setFnameMode]      = useState<FilenameMode>("font");
  const [customSuffix,   setCustomSuffix]   = useState("");

  /* queue */
  const [queue,     setQueue]     = useState<QueueItem[]>([]);
  const [busy,      setBusy]      = useState(false);
  const [toasts,    setToasts]    = useState<string[]>([]);
  const seqRef = useRef(0);

  /* drop zone */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const effectiveFontName = isCustomFont ? (customFont.trim() || "Noto Sans Khmer") : fontName;
  const isGoogleFont = !!GOOGLE_FONT_PARAMS[effectiveFontName];

  /* ── persist prefs ────────────────────────────────────────── */
  // Restore on mount
  useEffect(() => {
    const prefs = storage.get<Prefs | null>(PREFS_KEY, null);
    if (!prefs) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    if (prefs.fontName)       setFontName(prefs.fontName);
    if (prefs.convertMode)    setConvertMode(prefs.convertMode);
    if (prefs.digitMode)      setDigitMode(prefs.digitMode);
    if (typeof prefs.sizeAdjust === "number") setSizeAdjust(prefs.sizeAdjust);
    if (typeof prefs.scopeHeaders   === "boolean") setScopeHeaders(prefs.scopeHeaders);
    if (typeof prefs.scopeFootnotes === "boolean") setScopeFootnotes(prefs.scopeFootnotes);
    if (typeof prefs.scopeComments  === "boolean") setScopeComments(prefs.scopeComments);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Save on change
  useEffect(() => {
    storage.set<Prefs>(PREFS_KEY, {
      fontName: effectiveFontName, convertMode, digitMode, sizeAdjust,
      scopeHeaders, scopeFootnotes, scopeComments,
    });
  }, [effectiveFontName, convertMode, digitMode, sizeAdjust, scopeHeaders, scopeFootnotes, scopeComments]);

  /* ── toast helpers ────────────────────────────────────────── */
  function addToast(msg: string) {
    setToasts(ts => [...ts, msg]);
    setTimeout(() => setToasts(ts => ts.slice(1)), 3500);
  }

  /* ── queue management ─────────────────────────────────────── */
  function addFiles(files: FileList | File[]) {
    const rejected: string[] = [];
    const newItems: QueueItem[] = [];
    Array.from(files).forEach(file => {
      if (!file.name.toLowerCase().endsWith(".docx")) { rejected.push(file.name); return; }
      newItems.push({ id: ++seqRef.current, file, status: "queued", progress: 0, result: null, error: null, previewText: null });
    });
    if (rejected.length)
      addToast(t(`${rejected.length} file(s) skipped — .docx only`, `ឯកសារ ${rejected.length} ត្រូវបានរំលង — .docx តែប៉ុណ្ណោះ`));
    setQueue(q => [...q, ...newItems]);

    // Extract preview text for first new item asynchronously
    newItems.slice(0, 1).forEach(item => {
      extractPreviewText(item.file).then(preview => {
        if (preview) setQueue(q => q.map(x => x.id === item.id ? { ...x, previewText: preview } : x));
      });
    });
  }

  function updateItem(id: number, patch: Partial<QueueItem>) {
    setQueue(q => q.map(x => x.id === id ? { ...x, ...patch } : x));
  }

  /* ── convert ──────────────────────────────────────────────── */
  const handleConvert = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    if (isGoogleFont) ensureGoogleFont(effectiveFontName);

    const settings: Settings = {
      fontName: effectiveFontName, convertMode,
      latinEnabled, latinFontName: latinFont,
      digitMode, sizeAdjust,
      scopeHeaders, scopeFootnotes, scopeComments,
      filenameMode: fnameMode, customSuffix,
    };

    for (const item of queue.filter(x => x.status !== "done")) {
      updateItem(item.id, { status: "working", progress: 5 });
      try {
        const result = await convertOne(item, settings, p => updateItem(item.id, { progress: p }));
        updateItem(item.id, { status: "done", progress: 100, result });
      } catch (err) {
        updateItem(item.id, { status: "error", error: err instanceof Error ? err.message : String(err) });
      }
    }
    setBusy(false);
  }, [busy, effectiveFontName, convertMode, isGoogleFont, latinEnabled, latinFont, digitMode, sizeAdjust, scopeHeaders, scopeFootnotes, scopeComments, fnameMode, customSuffix, queue]);

  /* ── bulk download ────────────────────────────────────────── */
  async function downloadAll() {
    const done = queue.filter(x => x.status === "done" && x.result);
    if (!done.length) return;
    const bundle = new JSZip();
    done.forEach(x => bundle.file(x.result!.outName, x.result!.blob));
    const blob = await bundle.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "khmer-font-studio-converted.zip";
    document.body.appendChild(a); a.click(); a.remove();
  }

  function exportCsv() {
    const done = queue.filter(x => x.status === "done" && x.result);
    if (!done.length) return;
    const rows: (string | number)[][] = [["File","Part","Runs inspected","Converted","Already correct","Target font"]];
    done.forEach(x => {
      if (x.result!.report.length)
        x.result!.report.forEach(r => rows.push([x.file.name, r.name, r.inspected, r.converted, r.alreadyCorrect, x.result!.fontName]));
      else
        rows.push([x.file.name,"(no Khmer found)",0,0,0,x.result!.fontName]);
    });
    const csv = rows.map(row => row.map(cell => {
      const s = String(cell);
      return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
    }).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "khmer-font-studio-report.csv";
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ── derived counts ───────────────────────────────────────── */
  const pendingCount   = queue.filter(x => x.status !== "done").length;
  const doneCount      = queue.filter(x => x.status === "done").length;
  const totalConverted = queue.filter(x => x.status === "done").reduce((s, x) => s + (x.result?.converted ?? 0), 0);
  const previewText    = queue[0]?.previewText ?? null;

  /* ── font select ─────────────────────────────────────────── */
  function handleFontPresetChange(val: string) {
    if (val === "__custom__") { setIsCustomFont(true); }
    else { setIsCustomFont(false); setFontName(val); if (GOOGLE_FONT_PARAMS[val]) ensureGoogleFont(val); }
  }

  /* ── render ──────────────────────────────────────────────── */
  return (
    <ToolShell
      title="Khmer Font Studio"
      khmerTitle="ស្ទូឌីយ៉ូពុម្ពអក្សរខ្មែរ"
      description="Fix Khmer fonts in .docx files in seconds — swap Unicode fonts or recode legacy Limon / ABC / Baidok text to proper Unicode. Runs entirely in your browser."
      descriptionKm="ជួសជុលពុម្ពអក្សរខ្មែរក្នុង .docx ក្នុងប៉ុន្មានវិនាទី — ជំនួសពុម្ព Unicode ឬបំប្លែង Limon / ABC / Baidok ទៅ Unicode ពិតប្រាកដ។ ដំណើរការក្នុងកម្មវិធីរុករករបស់អ្នក។"
    >
      {/* aria-live region for screen readers */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {queue.filter(x => x.status === "done").length > 0 &&
          t(`${doneCount} file(s) converted`, `${doneCount} ឯកសារបំប្លែងហើយ`)}
      </div>

      {/* ── 01 Documents ─────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">
          {t("01 — Documents", "០១ — ឯកសារ")}
          {queue.length > 0 && (
            <span className="ml-2 font-normal normal-case text-[var(--ink-faint)]">
              {queue.length} {t("file(s)", "ឯកសារ")}
            </span>
          )}
        </h2>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
          className={`w-full rounded-lg border-2 border-dashed py-8 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] ${dragging ? "border-[var(--gold)] bg-[var(--gold)]/5" : "border-[var(--ground-line)] hover:border-[var(--gold-dim)]"}`}
          aria-label={t("Drop .docx files here or click to choose", "ទម្លាក់ .docx នៅទីនេះ ឬចុចដើម្បីជ្រើស")}
        >
          <FileText className="mx-auto mb-2 text-[var(--ink-faint)]" size={22} />
          <p className="text-sm font-medium text-[var(--ink)]">
            {t("Drop .docx files here, or click to choose", "ទម្លាក់ .docx នៅទីនេះ ឬចុចដើម្បីជ្រើស")}
          </p>
          <p className="mt-1 text-xs text-[var(--ink-faint)]">
            {t("Word documents only · multiple files supported · processed locally", "ឯកសារ Word តែប៉ុណ្ណោះ · ជ្រើសបានច្រើន · ដំណើរការក្នុងម៉ាស៊ីន")}
          </p>
        </button>
        <input ref={fileInputRef} type="file" accept=".docx" multiple className="hidden"
          onChange={e => { if (e.target.files?.length) { addFiles(e.target.files); e.target.value = ""; } }} />

        {queue.length > 0 && (
          <div className="mt-3 divide-y divide-[var(--ground-line)] rounded-lg border border-[var(--ground-line)]"
            aria-label={t("File queue", "បញ្ជីឯកសារ")}>
            {queue.map(item => (
              <QueueRow key={item.id} item={item} fontName={effectiveFontName}
                onRemove={id => setQueue(q => q.filter(x => x.id !== id))} t={t} />
            ))}
          </div>
        )}

        {queue.length === 0 && (
          <p className="mt-3 text-sm text-[var(--ink-faint)]">{t("No documents added yet.", "មិនទាន់មានឯកសារណាមួយ។")}</p>
        )}

        {queue.length > 0 && (
          <div className="mt-2 flex items-center justify-between text-xs text-[var(--ink-faint)]">
            <span>{doneCount} / {queue.length} {t("converted", "បំប្លែងហើយ")}</span>
            <button type="button" onClick={() => setQueue([])}
              className="flex items-center gap-1 hover:text-[var(--danger)]">
              <Trash2 size={12} /> {t("Clear all", "លុបទាំងអស់")}
            </button>
          </div>
        )}
      </section>

      {/* ── 02 Font & rules ──────────────────────────────────── */}
      <section className="border-t border-[var(--ground-line)] pt-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">
          {t("02 — Font & conversion rules", "០២ — ពុម្ពអក្សរ & ក្បួនបំប្លែង")}
        </h2>

        <div className="space-y-5">
          {/* conversion mode */}
          <Field label="Conversion mode" labelKm="របៀបបំប្លែង">
            <div className="flex flex-wrap gap-2">
              {(["fontSwap","legacyRecode"] as ConvertMode[]).map(m => (
                <button key={m} type="button" onClick={() => setConvertMode(m)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${convertMode === m ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--gold-dim)]"}`}>
                  {m === "fontSwap"
                    ? t("Font swap (Unicode → Unicode)", "ជំនួសពុម្ព (Unicode → Unicode)")
                    : t("Legacy recode (Limon / ABC → Unicode)", "បំប្លែង Legacy (Limon / ABC → Unicode)")}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-[var(--ink-faint)]">
              {convertMode === "legacyRecode"
                ? t("Detects runs using legacy Khmer fonts by their declared font name, transcodes the text to Unicode, and sets the target font. Supports Limon (S1–S7, R1–R7, F1–F7), Truth, ABC TEXT/FANCY/HEAD (01–24), Baidok, and Khek.", "រកឃើញ run ពុម្ព Legacy ដោយឈ្មោះពុម្ព បំប្លែងអក្សរទៅ Unicode ហើយកំណត់ពុម្ពដែលជ្រើស។ គាំទ្រ Limon, Truth, ABC TEXT/FANCY/HEAD, Baidok, Khek។")
                : t("Finds runs with Khmer Unicode characters (U+1780–U+17FF) and switches them to the target font. Use this when the document is already Unicode but uses a wrong font.", "រកឃើញ run ដែលមានអក្សរ Unicode ខ្មែរ (U+1780–U+17FF) ហើយប្ដូរទៅពុម្ពដែលជ្រើស។ ប្រើ​នេះ​នៅ​ពេល​ឯកសារ​ជា Unicode រួចហើយ​ប៉ុន្តែ​ពុម្ព​មិន​ត្រឹមត្រូវ​។")}
            </p>
          </Field>

          {/* font picker */}
          <Field label="Target Khmer font" labelKm="ពុម្ពអក្សរខ្មែរដែលជ្រើស">
            <Select value={isCustomFont ? "__custom__" : fontName}
              onChange={e => handleFontPresetChange(e.target.value)}>
              <optgroup label="Google Fonts — live preview">
                {Object.keys(GOOGLE_FONT_PARAMS).map(f => <option key={f} value={f}>{f}</option>)}
              </optgroup>
              <optgroup label="System / Windows Khmer Unicode">
                {["Khmer OS","Khmer OS Siemreap","Khmer OS Battambang","Khmer OS Muol Light","Khmer OS Muol","Khmer OS Bokor","Khmer OS Content","Khmer OS System","Khmer Mondulkiri","Khmer Busra Bold","Leelawadee UI"].map(f => <option key={f} value={f}>{f}</option>)}
              </optgroup>
              <optgroup label="Custom">
                <option value="__custom__">Custom font name…</option>
              </optgroup>
            </Select>
            {isCustomFont && (
              <TextInput className="mt-1.5"
                placeholder={t("Exact font name as installed", "ឈ្មោះពុម្ពអក្សរពិតប្រាកដ")}
                value={customFont} onChange={e => setCustomFont(e.target.value)} />
            )}
            <p className="mt-1 text-xs text-[var(--ink-faint)]">
              {t("Must be installed on the reader's machine, unless it's a Google Font.", "ត្រូវតែដំឡើងនៅលើម៉ាស៊ីនអ្នកអាន លើកលែងតែ Google Font។")}
            </p>
          </Field>

          {/* live preview — uses file content when available, otherwise sample */}
          <Field label="Live preview" labelKm="មើលជាមុន">
            <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3">
              <p className="font-khmer text-lg leading-relaxed text-[var(--ink)]"
                style={{ fontFamily: `"${effectiveFontName}", "Noto Sans Khmer", sans-serif` }}>
                {previewText ?? "ការិយាល័យ Invoice វិក័យបត្រ 2026 លេខ 123"}
              </p>
              <p className="mt-1.5 text-xs text-[var(--ink-faint)]">
                {previewText
                  ? t("← Preview from your uploaded file.", "← ការបង្ហាញពីឯកសាររបស់អ្នក។")
                  : isGoogleFont
                    ? t(`Live preview — this is exactly how ${effectiveFontName} renders.`, `ការបង្ហាញផ្ទាល់ — នេះជាការបង្ហាញពិតនៃ ${effectiveFontName}។`)
                    : t(`Approximate preview. ${effectiveFontName} is a system font.`, `ការបង្ហាញប្រហាក់ប្រហែល។ ${effectiveFontName} ជាពុម្ពប្រព័ន្ធ។`)}
              </p>
            </div>
          </Field>

          {/* latin font (fontSwap only) */}
          {convertMode === "fontSwap" && (
            <Field label="Non-Khmer text font (optional)" labelKm="ពុម្ពអក្សរអង់គ្លេស / ផ្សេងទៀត (ស្រេចចិត្ត)">
              <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
                <input type="checkbox" checked={latinEnabled} onChange={e => setLatinEnabled(e.target.checked)}
                  className="accent-[var(--gold)]" />
                {t("Also set a font for non-Khmer text", "កំណត់ពុម្ពអក្សរសម្រាប់អត្ថបទមិនមែនខ្មែរដែរ")}
              </label>
              {latinEnabled && (
                <TextInput className="mt-1.5"
                  placeholder={t("e.g. Inter, Calibri", "ឧ. Inter, Calibri")}
                  value={latinFont} onChange={e => setLatinFont(e.target.value)} />
              )}
            </Field>
          )}

          <Row>
            <Field label="Digits in Khmer text" labelKm="លេខក្នុងអត្ថបទខ្មែរ">
              <Select value={digitMode} onChange={e => setDigitMode(e.target.value as DigitMode)}>
                <option value="none">Leave as written / ទុកដូចដើម</option>
                <option value="toArabic">Convert to Arabic (0–9)</option>
                <option value="toKhmer">Convert to Khmer (០–៩)</option>
              </Select>
            </Field>
            <Field label="Size bump for Khmer runs" labelKm="ពង្រីកទំហំអក្សរខ្មែរ">
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={40} step={5} value={sizeAdjust}
                  onChange={e => setSizeAdjust(Number(e.target.value))}
                  className="flex-1 accent-[var(--gold)]" aria-valuetext={`+${sizeAdjust}%`} />
                <span className="w-10 text-right text-sm text-[var(--ink-dim)]">+{sizeAdjust}%</span>
              </div>
              <p className="mt-1 text-xs text-[var(--ink-faint)]">
                {t("Only rescales runs with an explicit size.", "ផ្លាស់ប្តូរតែ run ដែលមានទំហំកំណត់។")}
              </p>
            </Field>
          </Row>

          <Field label="Where to look for Khmer text" labelKm="កន្លែងស្កេនអក្សសខ្មែរ">
            <div className="space-y-2 text-sm text-[var(--ink)]">
              {([
                { id:"body",      label: t("Body text and text boxes","អត្ថបទឯកសារ"), hint: t("Always scanned.","ស្កេនតែងតែ។"), checked:true,          disabled:true,  onChange:undefined },
                { id:"headers",   label: t("Headers and footers","ក្បាលទំព័រ / ជើងទំព័រ"),  hint:"", checked:scopeHeaders,   disabled:false, onChange:(v:boolean)=>setScopeHeaders(v) },
                { id:"footnotes", label: t("Footnotes and endnotes","លេខកំណត់ / ចំណាំ"), hint:"", checked:scopeFootnotes, disabled:false, onChange:(v:boolean)=>setScopeFootnotes(v) },
                { id:"comments",  label: t("Comments","មតិ"), hint:t("Off by default — comments don't print.","បិទដោយលំនាំដើម — មតិមិនបោះពុម្ព។"), checked:scopeComments, disabled:false, onChange:(v:boolean)=>setScopeComments(v) },
              ]).map(row => (
                <label key={row.id} className="flex items-start gap-2">
                  <input type="checkbox" checked={row.checked} disabled={row.disabled}
                    onChange={row.onChange ? e => row.onChange!(e.target.checked) : undefined}
                    className="mt-0.5 accent-[var(--gold)] disabled:opacity-50" />
                  <span>
                    <span className={row.disabled ? "opacity-50" : ""}>{row.label}</span>
                    {row.hint && <span className="ml-1 text-xs text-[var(--ink-faint)]">— {row.hint}</span>}
                  </span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="Output filename suffix" labelKm="បន្ថែមឈ្មោះឯកសារ">
            <div className="flex flex-wrap gap-2">
              {(["font","plain","custom"] as FilenameMode[]).map(m => (
                <button key={m} type="button" onClick={() => setFnameMode(m)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${fnameMode===m ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--gold-dim)]"}`}>
                  {m==="font"   ? t("Add font name","បន្ថែមឈ្មោះពុម្ព")         : ""}
                  {m==="plain"  ? t(`Add "(converted)"`, 'បន្ថែម "(converted)"') : ""}
                  {m==="custom" ? t("Custom suffix","បន្ថែមផ្ទាល់ខ្លួន")         : ""}
                </button>
              ))}
            </div>
            {fnameMode === "custom" && (
              <TextInput className="mt-1.5" placeholder={t("e.g.  – final","ឧ.  – final")}
                value={customSuffix} onChange={e => setCustomSuffix(e.target.value)} />
            )}
          </Field>
        </div>
      </section>

      {/* ── 03 Convert ───────────────────────────────────────── */}
      <section className="border-t border-[var(--ground-line)] pt-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">
          {t("03 — Convert", "០៣ — បំប្លែង")}
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" disabled={queue.length === 0 || busy} onClick={handleConvert}
            className="flex items-center gap-2">
            {busy
              ? <><Loader2 size={14} className="animate-spin" /> {t("Converting…","កំពុងបំប្លែង…")}</>
              : t("Convert queue","បំប្លែងទាំងអស់")}
          </Button>
          {!busy && pendingCount > 0 && (
            <span className="text-xs text-[var(--ink-faint)]">
              {t(`Will process ${pendingCount} file(s)`, `នឹងដំណើរការ ${pendingCount} ឯកសារ`)}
            </span>
          )}
        </div>

        {doneCount > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ground-line)] pt-4">
            <span className="text-sm text-[var(--ink-dim)]">
              {doneCount} {t("file(s) · ","ឯកសារ · ")}{totalConverted} {t("Khmer run(s) recoded","run ខ្មែរ​សរុប")}
            </span>
            <div className="flex items-center gap-4">
              <button type="button" onClick={downloadAll}
                className="flex items-center gap-1.5 text-sm text-[var(--ink-dim)] hover:text-[var(--ink)]">
                <Download size={13} /> {t("Download all (.zip)","ទាញយកទាំងអស់ (.zip)")}
              </button>
              <button type="button" onClick={exportCsv}
                className="flex items-center gap-1.5 text-sm text-[var(--ink-dim)] hover:text-[var(--ink)]">
                <Table2 size={13} /> {t("Export report (.csv)","នាំចេញរបាយការណ៍ (.csv)")}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <details className="border-t border-[var(--ground-line)] pt-4">
        <summary className="cursor-pointer select-none text-sm font-medium text-[var(--ink-dim)] hover:text-[var(--ink)]">
          {t("How the conversion works","របៀបដែលការបំប្លែងដំណើរការ")}
        </summary>
        <ul className="mt-3 space-y-2 pl-4 text-sm text-[var(--ink-dim)]">
          <li><strong>{t("Font swap mode:","របៀបជំនួសពុម្ព:")}</strong> {t("Finds Unicode Khmer runs (U+1780–U+17FF) and rewrites the font name in the four Word XML font slots (ascii, hAnsi, eastAsia, cs). Mixed Khmer+Latin runs are split so only the Khmer portion changes.","រកឃើញ run Unicode ខ្មែរ ហើយសរសេរឈ្មោះពុម្ពឡើងវិញក្នុង slot ទាំងបួន។ Run ដែលលាយខ្មែរ+ឡាតាំងត្រូវបានបំបែក។")}</li>
          <li><strong>{t("Legacy recode mode:","របៀបបំប្លែង Legacy:")}</strong> {t("Detects runs whose declared font name matches Limon/ABC/Truth/Baidok/Khek, converts the cp1252-encoded bytes to proper Khmer Unicode using per-font mapping tables, and sets the target Unicode font.","រកឃើញ run ដែលមានឈ្មោះពុម្ព Limon/ABC/Truth/Baidok/Khek បំប្លែង byte cp1252 ទៅ Unicode ដោយប្រើតារាង mapping ហើយកំណត់ពុម្ពដែលជ្រើស។")}</li>
          <li>{t("All other formatting — bold, colour, spacing, styles — is preserved exactly.","ទ្រង់ទ្រាយទាំងអស់ — ដិត ពណ៌ ចន្លោះ — ត្រូវបានរក្សាដូចដើម។")}</li>
          <li>{t("Everything runs in this browser tab. Files are never uploaded anywhere.","ទាំងអស់ដំណើរការក្នុងផ្ទាំងនេះ។ ឯកសារមិនដែលត្រូវបញ្ជូនទៅណាឡើយ។")}</li>
        </ul>
      </details>

      {/* ── Source & Credits ─────────────────────────────────── */}
      <details className="border-t border-[var(--ground-line)] pt-4">
        <summary className="cursor-pointer select-none text-sm font-medium text-[var(--ink-dim)] hover:text-[var(--ink)]">
          Source &amp; Credits / ប្រភព និងកិត្តិយស
        </summary>
        <ul className="mt-3 space-y-1 pl-4 text-xs text-[var(--ink-dim)]">
          <li><b>Provenance:</b> AI-assisted original implementation.</li>
          <li><b>ZIP parsing:</b>{" "}
            <a href="https://stuk.github.io/jszip/" target="_blank" rel="noopener noreferrer" className="underline">JSZip</a>
            {" "}by Stuart Knightley (MIT / GPL-3).
          </li>
          <li><b>Legacy encoding reference:</b>{" "}
            <a href="https://www.panl10n.net/english/final%20reports/pdf%20files/Cambodia/CAM02.pdf" target="_blank" rel="noopener noreferrer" className="underline">PAN L10n CAM02</a>
            {" "}· NiDA / KFKI Khmer legacy encoding documentation.
            The per-font mapping tables in this tool were written independently from these publicly documented specifications;
            no GPL source code was copied or adapted.
          </li>
          <li><b>Khmer Unicode range:</b> U+1780–U+17FF, U+19E0–U+19FF.</li>
        </ul>
      </details>

      {/* ── Toast stack ──────────────────────────────────────── */}
      {toasts.length > 0 && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2"
          aria-live="assertive">
          {toasts.map((msg, i) => (
            <div key={i} className="pointer-events-auto flex items-center gap-2 rounded-full border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-sm text-[var(--ink)] shadow-lg">
              <Info size={13} className="text-[var(--gold)] flex-none" />
              {msg}
            </div>
          ))}
        </div>
      )}
    </ToolShell>
  );
}

/* ─── QueueRow ───────────────────────────────────────────────── */
function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface QueueRowProps {
  item: QueueItem;
  fontName: string;
  onRemove: (id: number) => void;
  t: (en: string, km: string) => string;
}
function QueueRow({ item, fontName, onRemove, t }: QueueRowProps) {
  const [showReport, setShowReport] = useState(false);

  const statusIcon = {
    queued:  <span className="h-2 w-2 rounded-full bg-[var(--ink-faint)]" />,
    working: <Loader2 size={12} className="animate-spin text-[var(--gold)]" />,
    done:    <CheckCircle2 size={13} className="text-[var(--success,#3f7a50)]" />,
    error:   <AlertTriangle size={13} className="text-[var(--danger)]" />,
  }[item.status];

  const statusLabel = {
    queued:  t("Queued","រង់ចាំ"),
    working: t("Converting…","កំពុងបំប្លែង…"),
    done:    t("Done","រួចរាល់"),
    error:   t("Error","មានបញ្ហា"),
  }[item.status];

  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center gap-3">
        <FileText size={14} className="flex-none text-[var(--ink-faint)]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--ink)]">{item.file.name}</p>
          <p className="text-xs text-[var(--ink-faint)]">{fmtSize(item.file.size)}</p>
        </div>
        <span className="flex flex-none items-center gap-1.5 text-xs text-[var(--ink-faint)]">
          {statusIcon} {statusLabel}
        </span>
        {item.status !== "working" && (
          <button type="button" onClick={() => onRemove(item.id)} aria-label={t("Remove","យកចេញ")}
            className="flex-none rounded p-0.5 text-[var(--ink-faint)] hover:text-[var(--danger)]">
            <X size={13} />
          </button>
        )}
      </div>

      {(item.status === "working" || item.status === "done") && (
        <div className="mt-2 h-0.5 overflow-hidden rounded bg-[var(--ground-line)]">
          <div className="h-full rounded bg-[var(--gold)] transition-all" style={{ width: `${item.progress}%` }} />
        </div>
      )}

      {item.status === "error" && item.error && (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-[var(--danger)]">
          <AlertTriangle size={11} className="mt-0.5 flex-none" /> {item.error}
        </p>
      )}

      {item.status === "done" && item.result && (
        <div className="mt-2 space-y-2">
          {/* summary line */}
          <p className="text-xs text-[var(--ink-dim)]">
            {item.result.converted > 0 ? (
              <>{t("Converted","បំប្លែង")} <strong className="text-[var(--ink)]">{item.result.converted}</strong>{" "}
              {t("run(s) to","run → ")} <strong className="text-[var(--ink)]">{item.result.fontName}</strong>
              {item.result.alreadyCorrect > 0 && (
                <span className="text-[var(--ink-faint)]">
                  {" · "}{item.result.alreadyCorrect} {t("already correct","ត្រឹមត្រូវរួចហើយ")}
                </span>
              )}.</>
            ) : (
              t("No matching text found — file downloaded unchanged.","រកមិនឃើញអក្សរ — ឯកសារទាញយកដូចដើម។")
            )}
          </p>

          {/* size before/after */}
          <p className="text-xs text-[var(--ink-faint)]">
            {fmtSize(item.result.sizeBefore)} → {fmtSize(item.result.sizeAfter)}
            {item.result.sizeAfter !== item.result.sizeBefore && (
              <span className="ml-1">
                ({item.result.sizeAfter > item.result.sizeBefore ? "+" : ""}
                {fmtSize(Math.abs(item.result.sizeAfter - item.result.sizeBefore))})
              </span>
            )}
          </p>

          {/* example snippets */}
          {item.result.examples.length > 0 && (
            <div className="space-y-1">
              {item.result.examples.map((ex, i) => (
                <p key={i} className="rounded bg-[var(--ground-raised)] px-2 py-1 text-sm font-khmer text-[var(--ink)]"
                  style={{ fontFamily: `"${fontName}", "Noto Sans Khmer", sans-serif` }}>
                  {ex}
                </p>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <a href={item.result.url} download={item.result.outName}
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[#0a0c0d] hover:opacity-90">
              <Download size={11} /> {t("Download","ទាញយក")}
            </a>
            {item.result.report.length > 0 && (
              <button type="button" onClick={() => setShowReport(v => !v)}
                className="flex items-center gap-1 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">
                <Table2 size={11} /> {t("View report","មើលរបាយការណ៍")}
              </button>
            )}
          </div>

          {showReport && item.result.report.length > 0 && (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--ground-line)] text-left text-[var(--ink-faint)]">
                  <th className="pb-1 pr-3 font-semibold">{t("Part","ផ្នែក")}</th>
                  <th className="pb-1 pr-3 font-semibold">{t("Runs","Run")}</th>
                  <th className="pb-1 pr-3 font-semibold">{t("Converted","បំប្លែង")}</th>
                  <th className="pb-1 font-semibold">{t("Already OK","ត្រឹមត្រូវ")}</th>
                </tr>
              </thead>
              <tbody>
                {item.result.report.map((r, i) => (
                  <tr key={i} className="border-b border-[var(--ground-line)]/50">
                    <td className="py-1 pr-3 font-mono text-[var(--ink-dim)]">{r.name}</td>
                    <td className="py-1 pr-3 text-[var(--ink-dim)]">{r.inspected}</td>
                    <td className="py-1 pr-3 text-[var(--ink-dim)]">{r.converted}</td>
                    <td className="py-1 text-[var(--ink-dim)]">{r.alreadyCorrect}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
