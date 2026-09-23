// Pure helpers for the Khmer developer tools (mojibake repair, translation-file
// checks, grapheme-safe truncation, and the Khmer regex catalogue). No imports,
// so tests/khmer-devkit.test.mjs can run them directly under Node.
//
// Khmer ranges follow the Unicode Standard (Khmer block U+1780–U+17FF, Khmer
// Symbols block U+19E0–U+19FF) — the same ranges as lib/khmer-orthography.ts.

// ---------------------------------------------------------------------------
// Mojibake repair
// ---------------------------------------------------------------------------

// Windows-1252 bytes 0x80–0x9F → Unicode. The five undefined bytes (0x81, 0x8D,
// 0x8F, 0x90, 0x9D) usually survive as the matching C1 control characters, which
// the Latin-1 fallback below maps back to the same byte.
const CP1252_HIGH: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
  0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e,
  0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
};

/** Byte a character stands for when UTF-8 was mis-read as Windows-1252/Latin-1, or null. */
function charToByte(ch: string): number | null {
  const cp = ch.codePointAt(0) ?? 0;
  if (cp <= 0xff) return cp;
  return CP1252_HIGH[cp] ?? null;
}

const utf8Strict = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-8", { fatal: true }) : null;

function decodeBytes(bytes: number[]): string | null {
  if (!utf8Strict) return null;
  try {
    return utf8Strict.decode(new Uint8Array(bytes));
  } catch {
    return null;
  }
}

/**
 * One pass of "UTF-8 read as Windows-1252/Latin-1" repair. Works run-by-run so
 * correct text around a damaged stretch is left alone. A run is only replaced
 * when its bytes form valid UTF-8 that actually contains a non-ASCII character.
 */
function repairPass(text: string): { text: string; runs: number } {
  const chars = [...text];
  let out = "";
  let runs = 0;
  let i = 0;
  while (i < chars.length) {
    const b = charToByte(chars[i]);
    if (b === null || b < 0x80) {
      out += chars[i];
      i += 1;
      continue;
    }
    // Collect a maximal run of high-byte chars. A UTF-8 multi-byte sequence never
    // contains an ASCII byte, so runs can safely stop at ASCII.
    let j = i;
    const bytes: number[] = [];
    while (j < chars.length) {
      const bj = charToByte(chars[j]);
      if (bj === null || bj < 0x80) break;
      bytes.push(bj);
      j += 1;
    }
    const decoded = decodeBytes(bytes);
    if (decoded !== null && decoded !== chars.slice(i, j).join("") && /[^\x00-\x7f]/.test(decoded)) {
      out += decoded;
      runs += 1;
    } else {
      out += chars.slice(i, j).join("");
    }
    i = j;
  }
  return { text: out, runs };
}

/** Decode `%E1%9E%80`-style percent-encoded UTF-8 runs. */
function repairPercent(text: string): { text: string; runs: number } {
  let runs = 0;
  const out = text.replace(/(?:%[0-9A-Fa-f]{2})+/g, (m) => {
    try {
      const d = decodeURIComponent(m);
      if (d !== m) runs += 1;
      return d;
    } catch {
      return m;
    }
  });
  return { text: out, runs };
}

/** Decode `\xE1\x9E\x80` byte escapes and `\u1780` / `&#6016;` / `&#x1780;` escapes. */
function repairEscapes(text: string): { text: string; runs: number } {
  let runs = 0;
  let out = text.replace(/(?:\\x[0-9A-Fa-f]{2})+/g, (m) => {
    const bytes = m.split("\\x").filter(Boolean).map((h) => parseInt(h, 16));
    const d = decodeBytes(bytes);
    if (d === null) return m;
    runs += 1;
    return d;
  });
  out = out.replace(/\\u\{([0-9A-Fa-f]{1,6})\}|\\u([0-9A-Fa-f]{4})|&#x([0-9A-Fa-f]+);|&#(\d+);/g, (m, a, b, c, d) => {
    const cp = a ? parseInt(a, 16) : b ? parseInt(b, 16) : c ? parseInt(c, 16) : parseInt(d, 10);
    if (!Number.isFinite(cp) || cp > 0x10ffff) return m;
    runs += 1;
    return String.fromCodePoint(cp);
  });
  return { text: out, runs };
}

export type MojibakeFix = "cp1252" | "percent" | "escapes";

export interface MojibakeResult {
  text: string;
  /** Which kinds of repair changed something, in the order applied. */
  applied: MojibakeFix[];
  /** How many times the Windows-1252 pass ran (2+ means double-encoded). */
  layers: number;
  /** U+FFFD or runs of "?" mean bytes were already lost and cannot be recovered. */
  lossy: boolean;
}

export function repairMojibake(input: string, opts: { cp1252?: boolean; percent?: boolean; escapes?: boolean } = {}): MojibakeResult {
  const { cp1252 = true, percent = true, escapes = true } = opts;
  let text = input;
  const applied: MojibakeFix[] = [];
  if (percent) {
    const r = repairPercent(text);
    if (r.runs) { text = r.text; applied.push("percent"); }
  }
  if (escapes) {
    const r = repairEscapes(text);
    if (r.runs) { text = r.text; applied.push("escapes"); }
  }
  let layers = 0;
  if (cp1252) {
    // Text that was double- or triple-encoded needs repeated passes.
    for (let k = 0; k < 4; k++) {
      const r = repairPass(text);
      if (!r.runs) break;
      text = r.text;
      layers += 1;
    }
    if (layers) applied.push("cp1252");
  }
  const lossy = /\uFFFD/.test(text) || /\?{3,}/.test(text);
  return { text, applied, layers, lossy };
}

/** Deliberately damage text the way a wrong decoder would (for demos and tests). */
export function encodeAsMojibake(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const reverse: Record<number, number> = {};
  for (const [cp, b] of Object.entries(CP1252_HIGH)) reverse[b] = Number(cp);
  let out = "";
  for (const b of bytes) out += String.fromCodePoint(reverse[b] ?? b);
  return out;
}

// ---------------------------------------------------------------------------
// Translation-file checker
// ---------------------------------------------------------------------------

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

/** Flatten nested JSON to `a.b.0.c` → leaf value (arrays use numeric segments). */
export function flattenJson(value: JsonValue, prefix = "", out: Map<string, JsonValue> = new Map()): Map<string, JsonValue> {
  if (value !== null && typeof value === "object") {
    const entries = Array.isArray(value) ? value.map((v, i) => [String(i), v] as const) : Object.entries(value);
    if (entries.length === 0 && prefix) out.set(prefix, value);
    for (const [k, v] of entries) flattenJson(v, prefix ? `${prefix}.${k}` : k, out);
  } else if (prefix) {
    out.set(prefix, value);
  }
  return out;
}

// {name}, {{name}}, {count, plural, …} (argument name only), %s / %d / %1$s / %(name)s, and $t(key).
const PLACEHOLDER_RE = /\{\{\s*[\w.-]+\s*\}\}|\{\s*[\w.-]+\s*(?=[,}])|%\d+\$[sdif]|%\([\w.-]+\)[sdif]|%[sdif@]|\$t\([^)]*\)/g;
const TAG_RE = /<\/?([A-Za-z][\w-]*)[^>]*>/g;

export function extractPlaceholders(s: string): string[] {
  // ICU arguments match as "{count" (the lookahead stops before "," or "}"); show them as "{count}".
  return (s.match(PLACEHOLDER_RE) ?? []).map((p) => {
    const compact = p.replace(/\s+/g, "");
    return compact.startsWith("{") && !compact.startsWith("{{") ? `${compact}}` : compact;
  }).sort();
}

function extractTags(s: string): string[] {
  const tags: string[] = [];
  for (const m of s.matchAll(TAG_RE)) tags.push(m[0].startsWith("</") ? `/${m[1]}` : m[1]);
  return tags.sort();
}

export type IssueKind = "missing" | "extra" | "empty" | "untranslated" | "no-khmer" | "placeholder" | "tags" | "whitespace" | "invisible" | "type";

export interface TranslationIssue {
  key: string;
  kind: IssueKind;
  source?: string;
  target?: string;
  detail?: string;
}

export interface TranslationReport {
  sourceKeys: number;
  targetKeys: number;
  translated: number;
  issues: TranslationIssue[];
  /** Missing keys with their source text, nested back into JSON, for handing to a translator. */
  missingJson: string;
}

const KHMER_CHAR = /[\u1780-\u17FF\u19E0-\u19FF]/;
const LETTER = /\p{L}/u;
const EDGE_INVISIBLE = /^[\u200B\u200C\u200D\u2060\uFEFF]|[\u200B\u200C\u200D\u2060\uFEFF]$/;

function unflatten(entries: [string, JsonValue][]): Record<string, JsonValue> {
  const root: Record<string, JsonValue> = {};
  for (const [path, v] of entries) {
    const parts = path.split(".");
    let node: Record<string, JsonValue> = root;
    parts.forEach((p, idx) => {
      if (idx === parts.length - 1) { node[p] = v; return; }
      const next = node[p];
      if (next === null || typeof next !== "object" || Array.isArray(next)) node[p] = {};
      node = node[p] as Record<string, JsonValue>;
    });
  }
  return root;
}

export function checkTranslations(source: JsonValue, target: JsonValue, opts: { requireKhmer?: boolean } = {}): TranslationReport {
  const { requireKhmer = true } = opts;
  const src = flattenJson(source);
  const tgt = flattenJson(target);
  const issues: TranslationIssue[] = [];
  const missing: [string, JsonValue][] = [];
  let translated = 0;

  for (const [key, sv] of src) {
    if (!tgt.has(key)) {
      issues.push({ key, kind: "missing", source: String(sv ?? "") });
      missing.push([key, sv]);
      continue;
    }
    const tv = tgt.get(key);
    if (typeof sv !== "string" || typeof tv !== "string") {
      if (typeof sv !== typeof tv) issues.push({ key, kind: "type", source: JSON.stringify(sv), target: JSON.stringify(tv), detail: `${typeof sv} → ${typeof tv}` });
      continue;
    }
    let ok = true;
    if (tv.trim() === "") { issues.push({ key, kind: "empty", source: sv, target: tv }); continue; }
    if (tv === sv && LETTER.test(sv)) { issues.push({ key, kind: "untranslated", source: sv, target: tv }); ok = false; }
    else if (requireKhmer && LETTER.test(sv) && !KHMER_CHAR.test(tv)) { issues.push({ key, kind: "no-khmer", source: sv, target: tv }); ok = false; }
    const sp = extractPlaceholders(sv);
    const tp = extractPlaceholders(tv);
    if (sp.join("\u0000") !== tp.join("\u0000")) {
      const lost = sp.filter((p) => !tp.includes(p));
      const added = tp.filter((p) => !sp.includes(p));
      issues.push({ key, kind: "placeholder", source: sv, target: tv, detail: [lost.length ? `− ${lost.join(" ")}` : "", added.length ? `+ ${added.join(" ")}` : ""].filter(Boolean).join("  ") });
      ok = false;
    }
    if (extractTags(sv).join(",") !== extractTags(tv).join(",")) { issues.push({ key, kind: "tags", source: sv, target: tv }); ok = false; }
    if (tv !== tv.trim() && sv === sv.trim()) issues.push({ key, kind: "whitespace", source: sv, target: tv });
    if (EDGE_INVISIBLE.test(tv)) issues.push({ key, kind: "invisible", source: sv, target: tv });
    if (ok) translated += 1;
  }
  for (const [key, tv] of tgt) if (!src.has(key)) issues.push({ key, kind: "extra", target: String(tv ?? "") });

  return {
    sourceKeys: src.size,
    targetKeys: tgt.size,
    translated,
    issues,
    missingJson: missing.length ? JSON.stringify(unflatten(missing), null, 2) : "",
  };
}

// ---------------------------------------------------------------------------
// Grapheme-safe truncation
// ---------------------------------------------------------------------------

export type LengthUnit = "graphemes" | "codepoints" | "utf16" | "utf8";

export function graphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return [...new Intl.Segmenter("km", { granularity: "grapheme" }).segment(text)].map((s) => s.segment);
  }
  return [...text];
}

const encoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;

export function measure(text: string, unit: LengthUnit): number {
  switch (unit) {
    case "graphemes": return graphemes(text).length;
    case "codepoints": return [...text].length;
    case "utf16": return text.length;
    case "utf8": return encoder ? encoder.encode(text).length : unescape(encodeURIComponent(text)).length;
  }
}

/** What a naive `slice` in the chosen unit produces (may cut a cluster or a UTF-8 sequence). */
export function naiveTruncate(text: string, limit: number, unit: LengthUnit): string {
  const n = Math.max(0, Math.floor(limit));
  switch (unit) {
    case "graphemes": return graphemes(text).slice(0, n).join("");
    case "codepoints": return [...text].slice(0, n).join("");
    case "utf16": return text.slice(0, n);
    case "utf8": {
      if (!encoder) return text.slice(0, n);
      return new TextDecoder("utf-8").decode(encoder.encode(text).slice(0, n));
    }
  }
}

export interface TruncateResult {
  text: string;
  truncated: boolean;
  size: number;
}

/**
 * Truncate so the result (ellipsis included) fits `limit` in `unit` without ever
 * splitting a grapheme cluster. With `wordBoundary`, back off to the last word
 * break (ICU Khmer dictionary segmentation) when one exists.
 */
export function safeTruncate(text: string, limit: number, unit: LengthUnit, ellipsis = "…", wordBoundary = false): TruncateResult {
  const n = Math.max(0, Math.floor(limit));
  if (measure(text, unit) <= n) return { text, truncated: false, size: measure(text, unit) };
  const budget = n - measure(ellipsis, unit);
  if (budget <= 0) {
    const e = measure(ellipsis, unit) <= n ? ellipsis : "";
    return { text: e, truncated: true, size: measure(e, unit) };
  }
  let kept = "";
  let size = 0;
  for (const g of graphemes(text)) {
    const s = measure(g, unit);
    if (size + s > budget) break;
    kept += g;
    size += s;
  }
  if (wordBoundary && kept && typeof Intl !== "undefined" && "Segmenter" in Intl) {
    let lastBreak = 0;
    for (const seg of new Intl.Segmenter("km", { granularity: "word" }).segment(text)) {
      const end = seg.index + seg.segment.length;
      if (end > kept.length) break;
      lastBreak = end;
    }
    if (lastBreak > 0 && lastBreak < kept.length) kept = kept.slice(0, lastBreak);
  }
  kept = kept.replace(/[\s\u200B]+$/u, "");
  const out = kept + ellipsis;
  return { text: out, truncated: true, size: measure(out, unit) };
}

/** True when `part` is a prefix of `whole` that ends mid-cluster. */
export function cutsCluster(whole: string, part: string): boolean {
  if (!part || part === whole) return false;
  if (!whole.startsWith(part)) return true; // e.g. UTF-8 cut produced U+FFFD
  let pos = 0;
  for (const g of graphemes(whole)) {
    pos += g.length;
    if (pos === part.length) return false;
    if (pos > part.length) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Khmer regex catalogue
// ---------------------------------------------------------------------------

export interface KhmerRegexEntry {
  id: string;
  en: string;
  km: string;
  pattern: string;
  noteEn: string;
  noteKm: string;
}

export const KHMER_REGEX: KhmerRegexEntry[] = [
  { id: "any", en: "Contains any Khmer", km: "មានអក្សរខ្មែរ", pattern: "[\\u1780-\\u17FF\\u19E0-\\u19FF]", noteEn: "Khmer block plus the Khmer Symbols (lunar date) block.", noteKm: "ប្លុកខ្មែរ និងប្លុកនិមិត្តសញ្ញាខ្មែរ (ថ្ងៃចន្ទគតិ)។" },
  { id: "only", en: "Khmer text only", km: "អក្សរខ្មែរសុទ្ធ", pattern: "^[\\u1780-\\u17FF\\u200B\\s]+$", noteEn: "Whole string is Khmer, spaces, or zero-width spaces.", noteKm: "ខ្សែអក្សរទាំងមូលជាខ្មែរ ចន្លោះ ឬចន្លោះសូន្យ។" },
  { id: "consonant", en: "Consonants", km: "ព្យញ្ជនៈ", pattern: "[\\u1780-\\u17A2]", noteEn: "The 35 consonants ក–អ.", noteKm: "ព្យញ្ជនៈ ៣៥ តួ ក–អ។" },
  { id: "independent", en: "Independent vowels", km: "ស្រៈពេញតួ", pattern: "[\\u17A3-\\u17B3]", noteEn: "U+17A3–U+17B3 (ឥ, ឧ, ឯ …).", noteKm: "U+17A3–U+17B3 (ឥ ឧ ឯ …)។" },
  { id: "vowel", en: "Dependent vowel signs", km: "ស្រៈនិស្ស័យ", pattern: "[\\u17B6-\\u17C5]", noteEn: "U+17B6–U+17C5 (ា ិ ី ុ …).", noteKm: "U+17B6–U+17C5 (ា ិ ី ុ …)។" },
  { id: "sign", en: "Signs & diacritics", km: "វណ្ណយុត្ត", pattern: "[\\u17C6-\\u17D1\\u17D3\\u17DD]", noteEn: "Nikahit, reahmuk, bantoc, shifters, etc. (excludes coeng).", noteKm: "និគ្គហិត រះមុខ បន្តក់ សញ្ញាប្តូរសំឡេង ។ល។ (មិនរាប់ជើង)។" },
  { id: "subscript", en: "Subscript consonant (coeng + consonant)", km: "ជើងព្យញ្ជនៈ", pattern: "\\u17D2[\\u1780-\\u17A2]", noteEn: "COENG U+17D2 followed by a consonant.", noteKm: "សញ្ញាជើង U+17D2 តាមដោយព្យញ្ជនៈ។" },
  { id: "digit", en: "Khmer digits", km: "លេខខ្មែរ", pattern: "[\\u17E0-\\u17E9]+", noteEn: "Runs of ០–៩.", noteKm: "ជួរលេខ ០–៩។" },
  { id: "number", en: "Number (Khmer or Arabic digits)", km: "លេខ (ខ្មែរ ឬអារ៉ាប់)", pattern: "^[0-9\\u17E0-\\u17E9]+$", noteEn: "Whole string is digits in either script.", noteKm: "ខ្សែអក្សរទាំងមូលជាលេខក្នុងអក្សរណាមួយ។" },
  { id: "punct", en: "Khmer punctuation", km: "វណ្ណយុត្តិខ្មែរ", pattern: "[\\u17D4-\\u17DA]", noteEn: "Khan ។, bariyoosan ៕, lek too ៗ, etc.", noteKm: "ខណ្ឌ ។ បរិយោសាន ៕ លេខទោ ៗ ។ល។" },
  { id: "syllable", en: "Orthographic syllable (approx.)", km: "ព្យាង្គ (ប្រហាក់ប្រហែល)", pattern: "[\\u1780-\\u17B3](?:\\u17D2[\\u1780-\\u17A2]){0,2}[\\u17B6-\\u17D1\\u17D3\\u17DD]*", noteEn: "Base letter + up to two subscripts + signs. An approximation, not a full syllable grammar.", noteKm: "អក្សរគោល + ជើងរហូតដល់ពីរ + សញ្ញា។ ជាការប៉ាន់ស្មាន មិនមែនវេយ្យាករណ៍ព្យាង្គពេញលេញទេ។" },
  { id: "name", en: "Khmer name field", km: "វាលឈ្មោះខ្មែរ", pattern: "^[\\u1780-\\u17D3\\u17DD]+(?: [\\u1780-\\u17D3\\u17DD]+)*$", noteEn: "Khmer letters with single spaces between parts; no digits or punctuation.", noteKm: "អក្សរខ្មែរ ដោយមានចន្លោះមួយរវាងផ្នែក គ្មានលេខ ឬវណ្ណយុត្តិ។" },
  { id: "bad-start", en: "Error: vowel/sign with no base", km: "កំហុស៖ ស្រៈ/សញ្ញាគ្មានតួគោល", pattern: "(?<![\\u1780-\\u17D3\\u17DD])[\\u17B6-\\u17D1\\u17D3\\u17DD]", noteEn: "A dependent vowel or sign that does not follow a Khmer letter — usually a typing error.", noteKm: "ស្រៈនិស្ស័យ ឬសញ្ញាដែលមិននៅក្រោយអក្សរខ្មែរ — ជាធម្មតាជាកំហុសវាយ។" },
  { id: "dangling", en: "Error: dangling coeng", km: "កំហុស៖ ជើងអណ្តែត", pattern: "\\u17D2(?![\\u1780-\\u17A2])", noteEn: "COENG not followed by a consonant.", noteKm: "សញ្ញាជើងដែលមិនតាមដោយព្យញ្ជនៈ។" },
  { id: "zwsp", en: "Zero-width space", km: "ចន្លោះសូន្យ", pattern: "\\u200B", noteEn: "U+200B, often used as an invisible word break in Khmer.", noteKm: "U+200B ជារឿយៗប្រើជាការបំបែកពាក្យមើលមិនឃើញក្នុងខ្មែរ។" },
];

export type RegexLang = "js" | "python" | "php" | "java" | "go";

/** Render a `\uXXXX`-style pattern as a ready-to-paste snippet for each language. */
export function regexSnippet(pattern: string, lang: RegexLang): string {
  switch (lang) {
    case "js":
      return `const re = /${pattern.replace(/\//g, "\\/")}/gu;\nconst matches = text.match(re) ?? [];`;
    case "python":
      return `import re\n\npattern = re.compile(r"${pattern.replace(/"/g, '\\"')}")\nmatches = pattern.findall(text)`;
    case "php": {
      const p = pattern.replace(/\\u([0-9A-Fa-f]{4})/g, "\\x{$1}").replace(/\//g, "\\/");
      return `preg_match_all('/${p.replace(/'/g, "\\'")}/u', $text, $matches);`;
    }
    case "java":
      return `Pattern p = Pattern.compile("${pattern.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}");\nMatcher m = p.matcher(text);`;
    case "go": {
      const p = pattern.replace(/\\u([0-9A-Fa-f]{4})/g, "\\x{$1}");
      const note = /\(\?<?[=!]/.test(pattern) ? "// Go's RE2 engine has no lookahead/lookbehind — rewrite the (?…) part before use.\n" : "";
      return `${note}re := regexp.MustCompile(\`${p}\`)\nmatches := re.FindAllString(text, -1)`;
    }
  }
}
