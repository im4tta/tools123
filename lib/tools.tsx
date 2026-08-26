import dynamic from "next/dynamic";
import { ComponentType } from "react";
import { toKhmerToolTitle } from "@/lib/tool-title-km";

export type Category =
  | "dev"
  | "khmer"
  | "geo"
  | "text"
  | "math"
  | "network"
  | "security"
  | "design"
  | "science"
  | "time"
  | "office"
  | "images"
  | "audio"
  | "video"
  | "meta"
  | "family"
  | "fun"
  | "knowledge";

export interface ToolDef {
  id: string;
  title: string;
  khmerTitle?: string;
  /** ISO date for homepage daily-addition grouping; omit when provenance is unknown. */
  addedOn?: string;
  category: Category;
  keywords: string[];
  localProject?: { author: string; repository: string; license: string; relationship?: "adapted" | "integrated" | "inspired" };
  Component: ComponentType;
}

export const CATEGORY_ORDER: Category[] = [
  "office",
  "images",
  "khmer",
  "design",
  "text",
  "time",
  "math",
  "geo",
  "science",
  "family",
  "fun",
  "knowledge",
  "dev",
  "network",
  "security",
  "audio",
  "video",
  "meta",
];

export const CATEGORY_META: Record<Category, { label: string; khmer: string; color: string }> = {
  dev: { label: "Development", khmer: "អភិវឌ្ឍន៍", color: "var(--slate-accent)" },
  khmer: { label: "Khmer Language", khmer: "ភាសាខ្មែរ", color: "var(--gold)" },
  geo: { label: "Geospatial", khmer: "ភូមិសាស្ត្រ", color: "var(--teal)" },
  science: { label: "Science", khmer: "វិទ្យាសាស្ត្រ", color: "#5b9bd5" },
  text: { label: "Text", khmer: "អត្ថបទ", color: "#c97ea0" },
  math: { label: "Math", khmer: "គណិតវិទ្យា", color: "#7ec9a0" },
  network: { label: "Network", khmer: "បណ្តាញ", color: "#7ea0c9" },
  security: { label: "Security", khmer: "សុវត្ថិភាព", color: "#c9906a" },
  design: { label: "Design", khmer: "រចនា", color: "#a07ec9" },
  time: { label: "Time & Date", khmer: "ពេលវេលា", color: "#c9c07e" },
  // documents removed — merged into office
  office: { label: "Office", khmer: "ការិយាល័យ", color: "#8ac9a0" },
  images: { label: "Images", khmer: "រូបភាព", color: "#7ec9c0" },
  audio: { label: "Audio", khmer: "សំឡេង", color: "#c97ec0" },
  video: { label: "Video", khmer: "វីដេអូ", color: "#9a7ec9" },
  meta: { label: "Meta", khmer: "មេតា", color: "#7ea0a9" },
  family: { label: "Family", khmer: "គ្រួសារ", color: "#c97eb8" },
  fun: { label: "Fun", khmer: "កំសាន្ត", color: "#e8a840" },
  knowledge: { label: "Knowledge", khmer: "ចំណេះដឹង", color: "#62a0c9" },
};

function load(category: Category, file: string) {
  return dynamic(() => import(`@/components/tools/${category}/${file}`), {
    loading: () => <div className="py-16 text-center text-sm text-[var(--ink-faint)]">Loading…</div>,
  });
}

// ---- Data-driven unit-pair converters (Batch 1: volume expansion) ----
// One shared engine component (unit-pair.tsx / temperature-pair.tsx) is reused for every
// pair below; only the props differ. This lets a small category list expand into every
// pairwise combination as its own searchable, linkable tool.
function loadUnitPair(categoryKey: string, from: string, to: string) {
  const Base = dynamic(() => import(`@/components/tools/math/unit-pair`), {
    loading: () => <div className="py-16 text-center text-sm text-[var(--ink-faint)]">Loading…</div>,
  });
  const Wrapped = () => <Base categoryKey={categoryKey} from={from} to={to} />;
  Wrapped.displayName = `UnitPair(${categoryKey}:${from}->${to})`;
  return Wrapped;
}

function loadTemperaturePair(from: string, to: string) {
  const Base = dynamic(() => import(`@/components/tools/math/temperature-pair`), {
    loading: () => <div className="py-16 text-center text-sm text-[var(--ink-faint)]">Loading…</div>,
  });
  const Wrapped = () => <Base from={from} to={to} />;
  Wrapped.displayName = `TemperaturePair(${from}->${to})`;
  return Wrapped;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[\s/]+/g, "-");
}
function titleCase(s: string) {
  return s.replace(/(^|\s|\/)([a-z])/g, (_, p, c) => p + c.toUpperCase());
}

const UNIT_CATEGORY_UNITS: Record<string, { label: string; units: string[] }> = {
  length: { label: "Length", units: ["meter", "kilometer", "centimeter", "millimeter", "mile", "yard", "foot", "inch"] },
  mass: { label: "Mass & Weight", units: ["kilogram", "gram", "milligram", "pound", "ounce", "metric ton", "stone"] },
  volume: { label: "Volume", units: ["liter", "milliliter", "cubic meter", "gallon", "quart", "pint", "cup", "fluid ounce"] },
  area: { label: "Area", units: ["square meter", "square kilometer", "hectare", "square foot", "square yard", "acre", "square mile"] },
  speed: { label: "Speed", units: ["meter/second", "kilometer/hour", "mile/hour", "knot", "foot/second"] },
  pressure: { label: "Pressure", units: ["pascal", "kilopascal", "bar", "psi", "atmosphere", "torr"] },
  energy: { label: "Energy", units: ["joule", "kilojoule", "calorie", "kilocalorie", "watt-hour", "kilowatt-hour", "BTU"] },
  power: { label: "Power", units: ["watt", "kilowatt", "horsepower", "BTU/hour"] },
  data: { label: "Digital Storage", units: ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte", "bit", "kibibyte", "mebibyte"] },
  time: { label: "Time Duration", units: ["second", "minute", "hour", "day", "week", "year"] },
};

const UNIT_PAIR_TOOLS: ToolDef[] = Object.entries(UNIT_CATEGORY_UNITS).flatMap(([catKey, { label, units }]) => {
  const pairs: ToolDef[] = [];
  for (let i = 0; i < units.length; i++) {
    for (let j = i + 1; j < units.length; j++) {
      const from = units[i];
      const to = units[j];
      pairs.push({
        id: `unit-${catKey}-${slugify(from)}-${slugify(to)}`,
        title: `${titleCase(from)} ⟷ ${titleCase(to)}`,
        category: "math",
        keywords: [label.toLowerCase(), from, to, "convert", "converter", "unit"],
        Component: loadUnitPair(catKey, from, to),
      });
    }
  }
  return pairs;
});

const TEMPERATURE_PAIR_TOOLS: ToolDef[] = (
  [["celsius", "fahrenheit"], ["celsius", "kelvin"], ["fahrenheit", "kelvin"]] as [string, string][]
).map(([from, to]) => ({
  id: `unit-temperature-${slugify(from)}-${slugify(to)}`,
  title: `${titleCase(from)} ⟷ ${titleCase(to)}`,
  category: "math",
  keywords: ["temperature", from, to, "convert", "converter"],
  Component: loadTemperaturePair(from, to),
}));

export const TOOLS: ToolDef[] = [
  // ---- Development (21) ----
  { id: "json-formatter", title: "JSON Formatter", category: "dev", keywords: ["json", "pretty", "validate", "minify"], Component: load("dev", "json-formatter") },
  { id: "base64", title: "Base64 Encode / Decode", category: "dev", keywords: ["base64", "encode", "decode"], Component: load("dev", "base64") },
  { id: "url-encode", title: "URL Encode / Decode", category: "dev", keywords: ["url", "uri", "percent encode"], Component: load("dev", "url-encode") },
  { id: "uuid", title: "UUID Generator", category: "dev", keywords: ["uuid", "guid", "random id"], Component: load("dev", "uuid") },
  { id: "hash", title: "Hash Generator", category: "dev", keywords: ["sha256", "sha1", "md5", "digest", "checksum"], Component: load("dev", "hash") },
  { id: "jwt-decoder", title: "JWT Decoder", category: "dev", keywords: ["jwt", "token", "auth"], Component: load("dev", "jwt-decoder") },
  { id: "regex-tester", title: "Regex Tester", category: "dev", keywords: ["regex", "regexp", "pattern"], Component: load("dev", "regex-tester") },
  { id: "regex-explainer", title: "Regex Explainer", khmerTitle: "ពន្យល់ Regex", addedOn: "2026-08-17T18:00:00+07:00", category: "dev", keywords: ["regex", "explain", "tokens", "learn", "regular expression", "regexp", "ពន្យល់"], Component: load("dev", "regex-explainer") },
  { id: "html-to-markdown", title: "HTML → Markdown", khmerTitle: "បម្លែង HTML → Markdown", addedOn: "2026-08-17T21:00:00+07:00", category: "dev", keywords: ["html", "markdown", "convert", "blog", "docs", "scrape"], Component: load("dev", "html-to-markdown") },
  { id: "markdown-table", title: "Markdown Table Generator", khmerTitle: "បង្កើតតារាង Markdown", addedOn: "2026-08-17T21:05:00+07:00", category: "dev", keywords: ["markdown", "table", "csv", "generator", "convert"], Component: load("dev", "markdown-table") },
  { id: "mock-data", title: "Mock Data Generator", khmerTitle: "បង្កើតទិន្នន័យសាកល្បង", addedOn: "2026-08-17T18:05:00+07:00", category: "dev", keywords: ["mock data", "fake data", "test data", "generator", "csv", "json", "dummy", "sample"], Component: load("dev", "mock-data") },
  { id: "json-to-schema", title: "JSON → JSON Schema", khmerTitle: "បម្លែង JSON → Schema", addedOn: "2026-08-17T18:10:00+07:00", category: "dev", keywords: ["json schema", "schema", "validation", "derive", "generate schema"], Component: load("dev", "json-to-schema") },
  { id: "svg-minifier", title: "SVG Minifier", khmerTitle: "បង្រួម SVG", addedOn: "2026-08-17T18:15:00+07:00", category: "dev", keywords: ["svg", "minify", "optimize", "compress", "clean"], Component: load("dev", "svg-minifier") },
  { id: "markdown-preview", title: "Markdown Previewer", category: "dev", keywords: ["markdown", "md", "preview"], Component: load("dev", "markdown-preview") },
  { id: "tsx-portal", title: "TSX Portal", addedOn: "2026-08-03T10:00:00+07:00", category: "dev", keywords: ["tsx", "jsx", "playground", "sandbox", "live preview", "babel", "repl", "react", "markdown", "bbcode"], Component: load("dev", "tsx-portal") },
  { id: "diff-checker", title: "Text Diff Checker", category: "dev", keywords: ["diff", "compare", "changes"], Component: load("dev", "diff-checker") },
  { id: "api-benchmark", title: "API Benchmark", addedOn: "2026-08-04T10:50:00+07:00", category: "dev", keywords: ["api", "benchmark", "latency", "performance", "rest", "graphql", "http", "race track", "speed test"], Component: load("dev", "api-benchmark") },
  { id: "json-to-typescript", title: "JSON → TypeScript / Zod", khmerTitle: "បម្លែង JSON → TypeScript / Zod", addedOn: "2026-08-04T11:00:00+07:00", category: "dev", keywords: ["json", "typescript", "zod", "schema", "types"], Component: load("dev", "json-to-typescript") },
  { id: "json-data-converter", title: "JSON Data Converter", khmerTitle: "កម្មវិធីបម្លែងទិន្នន័យ JSON", addedOn: "2026-08-04T11:05:00+07:00", category: "dev", keywords: ["json", "csv", "yaml", "xml", "convert", "data"], Component: load("dev", "json-data-converter") },
  { id: "jsonl-validator", title: "JSONL Validator", khmerTitle: "ផ្ទៀងផ្ទាត់ JSONL", addedOn: "2026-08-04T11:10:00+07:00", category: "dev", keywords: ["jsonl", "json lines", "validate", "logs"], Component: load("dev", "jsonl-validator") },
  { id: "sql-formatter", title: "SQL Formatter", khmerTitle: "រៀបចំទម្រង់ SQL", addedOn: "2026-08-17T15:05:00+07:00", category: "dev", keywords: ["sql", "format", "beautify", "query", "database", "pretty", "sql formatter"], Component: load("dev", "sql-formatter") },
  { id: "json-xml-converter", title: "JSON ↔ XML Converter", khmerTitle: "បម្លែង JSON ↔ XML", addedOn: "2026-08-17T15:10:00+07:00", category: "dev", keywords: ["json", "xml", "convert", "data interchange"], Component: load("dev", "json-xml-converter") },
  { id: "markdown-to-html", title: "Markdown → HTML", khmerTitle: "បម្លែង Markdown → HTML", addedOn: "2026-08-17T17:00:00+07:00", category: "dev", keywords: ["markdown", "html", "convert", "embed", "md", "blog"], Component: load("dev", "markdown-to-html") },
  { id: "html-formatter", title: "HTML Formatter", khmerTitle: "រៀបចំទម្រង់ HTML", addedOn: "2026-08-17T17:05:00+07:00", category: "dev", keywords: ["html", "format", "beautify", "indent", "pretty", "minify"], Component: load("dev", "html-formatter") },
  { id: "ai-token-counter", title: "AI Token Counter", khmerTitle: "រាប់ Token AI", addedOn: "2026-08-04T11:15:00+07:00", category: "dev", keywords: ["token", "llm", "ai", "context window", "prompt"], Component: load("dev", "ai-token-counter") },
  { id: "deepseek-rate-desk", title: "DeepSeek V4 Rate Desk", khmerTitle: "តារាងតម្លៃ DeepSeek V4", addedOn: "2026-08-21T15:00+07:00", category: "dev", keywords: ["deepseek", "pricing", "api", "rate", "token cost", "llm", "peak", "off-peak", "cost calculator", "deepseek v4", "តម្លៃ"], Component: load("dev", "deepseek-rate-desk") },
  { id: "word-counter", title: "Word & Character Counter", category: "dev", keywords: ["word count", "character count"], Component: load("dev", "word-counter") },
  { id: "lorem-ipsum", title: "Placeholder Text Generator", category: "dev", keywords: ["lorem ipsum", "filler", "placeholder"], Component: load("dev", "lorem-ipsum") },
  { id: "color-converter", title: "Color Converter", category: "dev", keywords: ["hex", "rgb", "hsl", "color"], Component: load("dev", "color-converter") },
  { id: "timestamp", title: "Unix Timestamp Converter", category: "dev", keywords: ["unix", "epoch", "timestamp", "iso"], Component: load("dev", "timestamp") },
  { id: "case-converter", title: "Case Converter", category: "dev", keywords: ["camelcase", "snake_case", "kebab-case"], Component: load("dev", "case-converter") },
  { id: "slug-generator", title: "Slug Generator", category: "dev", keywords: ["slug", "url friendly"], Component: load("dev", "slug-generator") },
  { id: "csv-json", title: "CSV → JSON", category: "dev", keywords: ["csv", "json", "convert"], Component: load("dev", "csv-json") },
  { id: "cron-parser", title: "Cron Expression Explainer", category: "dev", keywords: ["cron", "schedule", "crontab"], Component: load("dev", "cron-parser") },
  { id: "cron-builder", title: "Cron Expression Builder", khmerTitle: "បង្កើត Cron Expression", addedOn: "2026-08-17T22:00:00+07:00", category: "dev", keywords: ["cron", "schedule", "builder", "crontab", "next run", "job", "កំណត់ពេល"], Component: load("dev", "cron-builder") },
  { id: "css-specificity", title: "CSS Specificity Calculator", khmerTitle: "គណនាអាទិភាព CSS", addedOn: "2026-08-17T22:05:00+07:00", category: "dev", keywords: ["css", "specificity", "selector", "priority", "cascade", "a b c"], Component: load("dev", "css-specificity") },
  { id: "gitignore-generator", title: ".gitignore Generator", khmerTitle: "បង្កើត .gitignore", addedOn: "2026-08-17T22:10:00+07:00", category: "dev", keywords: ["gitignore", "git", "ignore", "node", "python", "template", "generator"], Component: load("dev", "gitignore-generator") },
  { id: "license-generator", title: "License Generator", khmerTitle: "បង្កើតអាជ្ញាបណ្ណ", addedOn: "2026-08-17T22:15:00+07:00", category: "dev", keywords: ["license", "mit", "apache", "gpl", "bsd", "open source", "copyright"], Component: load("dev", "license-generator") },
  { id: "ascii-table", title: "ASCII Table", khmerTitle: "តារាង ASCII", addedOn: "2026-08-17T22:20:00+07:00", category: "dev", keywords: ["ascii", "character code", "control", "hex", "decimal", "reference", "table"], Component: load("dev", "ascii-table") },
  { id: "string-escape", title: "String Escape / Unescape", category: "dev", keywords: ["escape", "unescape", "string literal"], Component: load("dev", "string-escape") },
  { id: "csv-to-markdown", title: "CSV → Markdown Table", category: "dev", keywords: ["csv", "markdown", "table"], Component: load("dev", "csv-to-markdown") },
  { id: "github-file-browser", title: "GitHub Repo File Browser", category: "dev", keywords: ["github", "gitget", "browse", "download file", "repo"], Component: load("dev", "github-file-browser") },
  { id: "readability-extractor", title: "Article / HTML Content Extractor", category: "dev", keywords: ["readability", "trafilatura", "boilerpipe", "goose", "justext", "dragnet", "article extraction", "reader mode"], Component: load("dev", "readability-extractor") },

  // ---- Khmer language ----
  { id: "digit-converter", title: "Khmer ⟷ Arabic Digits", category: "khmer", keywords: ["khmer number", "digits", "លេខ"], Component: load("khmer", "digit-converter") },
  { id: "unicode-inspector", title: "Khmer Unicode Inspector", category: "khmer", keywords: ["unicode", "codepoint", "zwsp", "coeng"], Component: load("khmer", "unicode-inspector") },
  { id: "khmer-word-counter", title: "Khmer Grapheme Counter", category: "khmer", keywords: ["khmer", "grapheme", "syllable count"], Component: load("khmer", "khmer-word-counter") },
  { id: "riel-formatter", title: "Riel Currency Formatter", category: "khmer", keywords: ["riel", "khr", "currency", "រៀល"], Component: load("khmer", "riel-formatter") },
  { id: "buddhist-era", title: "Buddhist Era Year Converter", category: "khmer", keywords: ["buddhist era", "ពុទ្ធសករាជ", "calendar"], Component: load("khmer", "buddhist-era") },
  { id: "zodiac-year", title: "12-Year Zodiac Cycle", category: "khmer", keywords: ["zodiac", "ឆ្នាំសត្វ", "animal year"], Component: load("khmer", "zodiac-year") },
  { id: "khmer-numerology", title: "Khmer Numerology Calculator", khmerTitle: "ឧបករណ៍គណនាលេខវិទ្យាខ្មែរ", category: "khmer", keywords: ["numerology", "lucky number", "digital root", "vehicle plate", "name number", "life path", "khmer", "លេខវិទ្យា", "លេខហុងស៊ុយ", "ស្លាកលេខ"], Component: load("khmer", "khmer-numerology") },
  { id: "date-formatter", title: "Khmer Date Formatter", category: "khmer", keywords: ["khmer date", "កាលបរិច្ឆេទ"], Component: load("khmer", "date-formatter") },
  { id: "consonant-classifier", title: "Consonant Series Classifier", category: "khmer", keywords: ["consonant", "series", "អក្សរជើង"], Component: load("khmer", "consonant-classifier") },
  { id: "number-spellout", title: "Khmer Number Spell-out", category: "khmer", keywords: ["spell", "cardinal", "words", "number to words", "currency text", "khmerscribe", "សរសេរលេខជាអក្សរ", "ទឹកប្រាក់ជាអក្សរ"], Component: load("khmer", "number-spellout") },
  { id: "phone-formatter", title: "Phone Number Formatter", category: "khmer", keywords: ["phone", "mobile", "+855"], Component: load("khmer", "phone-formatter") },
  { id: "phone-network", title: "Cambodia Phone Network Finder", khmerTitle: "ស្វែងរកក្រុមហ៊ុនទូរស័ព្ទ", addedOn: "2026-08-17T19:40:00+07:00", category: "office", keywords: ["smart", "cellcard", "metfone", "seatel", "cotel", "operator", "network", "mobile", "លេខទូរស័ព្ទ", "ក្រុមហ៊ុន"], Component: load("office", "phone-network") },
  { id: "khqr-generator", title: "KHQR / Bakong Payment QR", khmerTitle: "KHQR បង់ប្រាក់តាម Bakong", addedOn: "2026-08-17T19:45:00+07:00", category: "office", keywords: ["khqr", "bakong", "qr payment", "cambodia payment", "merchant", "emvco", "scan", "bank", "បង់ប្រាក់", "ធនាគារ"], Component: load("office", "khqr-generator") },
  { id: "cambodia-tax", title: "Cambodian Income Tax Calculator", khmerTitle: "គណនាពន្ធលើប្រាក់ខែ", addedOn: "2026-08-17T19:50:00+07:00", category: "office", keywords: ["tax", "salary", "income tax", "cambodia", "progressive", "net salary", "ពន្ធ", "ប្រាក់ខែ"], Component: load("office", "cambodia-tax") },
  { id: "id-pattern", title: "National ID Shape Checker", category: "khmer", keywords: ["national id", "format check"], Component: load("khmer", "id-pattern") },
  { id: "romanization", title: "Khmer Romanization", category: "khmer", keywords: ["romanize", "transliterate", "latin"], Component: load("khmer", "romanization") },
  { id: "line-break-helper", title: "Soft Line-break Helper", category: "khmer", keywords: ["zwsp", "word wrap", "line break", "khmerscribe", "khmer break", "ចន្លោះសូន្យ", "បំបែកបន្ទាត់"], Component: load("khmer", "line-break-helper") },
  { id: "font-preview", title: "Khmer Web Font Preview", category: "khmer", keywords: ["font", "noto sans khmer", "typography"], Component: load("khmer", "font-preview") },
  { id: "pangram-generator", title: "Khmer Pangram & Character Coverage Generator", khmerTitle: "កម្មវិធីបង្កើត Pangram និងពិនិត្យគ្របដណ្តប់តួអក្សរខ្មែរ", addedOn: "2026-08-06T09:00:00+07:00", category: "khmer", keywords: ["pangram", "character coverage", "font testing", "khmer unicode", "consonants", "subscripts", "vowels", "typography", "តួអក្សរ", "ព្យញ្ជនៈ", "ស្រៈ"], Component: load("khmer", "pangram-generator") },
  { id: "riel-usd", title: "KHR Currency Converter", khmerTitle: "កម្មវិធីប្តូរប្រាក់រៀល", category: "khmer", keywords: ["exchange rate", "currency", "mef", "usd", "riel"], Component: load("khmer", "riel-usd") },
  { id: "vowel-chart", title: "Dependent Vowel Reference", category: "khmer", keywords: ["vowel", "ស្រៈ", "pronunciation"], Component: load("khmer", "vowel-chart") },
  { id: "punctuation-reference", title: "Khmer Punctuation Reference", category: "khmer", keywords: ["khan", "bariyoosan", "punctuation"], Component: load("khmer", "punctuation-reference") },
  { id: "ordinal-formatter", title: "Khmer Ordinal Number Formatter", category: "khmer", keywords: ["ordinal", "ទី", "number"], Component: load("khmer", "ordinal-formatter") },
  { id: "digital-terminology", title: "Khmer Digital Terminology", category: "khmer", keywords: ["mptc", "glossary", "tech terms", "វាក្យស័ព្ទ"], Component: load("khmer", "digital-terminology") },
  { id: "language-resources", title: "Khmer Language Resources", category: "khmer", keywords: ["awesome khmer", "nlp", "fonts", "corpora", "directory"], Component: load("khmer", "language-resources") },
  { id: "word-to-number", title: "Khmer Words → Number", category: "khmer", keywords: ["khmer2number", "parse", "read number", "reverse spellout"], Component: load("khmer", "word-to-number") },
  { id: "syllable-splitter", title: "Khmer Syllable Splitter", category: "khmer", keywords: ["split-khmer", "grapheme", "cluster", "coeng"], Component: load("khmer", "syllable-splitter") },
  { id: "name-generator", title: "Khmer Name Generator", category: "khmer", keywords: ["random name", "placeholder", "sample data"], Component: load("khmer", "name-generator") },
  { id: "vehicle-plate", title: "Cambodia Vehicle Plate Format Checker", category: "khmer", keywords: ["license plate", "vehicle", "khmer-vehicle-scanner"], Component: load("khmer", "vehicle-plate") },
  { id: "lunar-day", title: "Khmer Lunar Day", category: "khmer", keywords: ["khmercal", "koet", "roch", "កើត", "រោច", "lunar calendar"], Component: load("khmer", "lunar-day") },
  { id: "full-lunar-date", title: "Khmer Full Lunar Date", category: "khmer", keywords: ["khmer calendar", "chankitek", "ចន្ទគតិ", "buddhist era", "animal year", "sak", "new year", "moha songkran"], Component: load("khmer", "full-lunar-date") },
  { id: "nlp-model-directory", title: "Khmer NLP & Speech Model Directory", category: "khmer", keywords: ["asr", "tts", "translation", "ocr", "huggingface", "whisper", "seanghay", "sengtha"], Component: load("khmer", "nlp-model-directory") },
  { id: "dev-project-directory", title: "Cambodia Open-Source Project Directory", category: "khmer", keywords: ["github", "cambodia", "open source", "scraper", "payway", "civic data"], Component: load("khmer", "dev-project-directory") },
  { id: "provinces-reference", title: "Cambodia Provinces Reference", category: "khmer", keywords: ["province", "khet", "capital", "address", "dropdown", "administrative"], Component: load("khmer", "provinces-reference") },
  { id: "construction-water-glossary", title: "Construction & Water Resources Glossary", category: "khmer", keywords: ["mowram", "boq", "canal", "irrigation", "contract", "esmp", "construction"], Component: load("khmer", "construction-water-glossary") },
  { id: "safety-code-pro", title: "SafetyCodePro Cambodia", khmerTitle: "ស្តង់ដារសុវត្ថិភាពសំណង់", addedOn: "2026-07-31", category: "khmer", keywords: ["safety", "ppe", "hard hat", "high-vis vest", "construction", "osha", "prakas", "សុវត្ថិភាព", "មួក", "អាវចំណាំងផ្លាត"], Component: load("khmer", "safety-code-pro") },
  { id: "terminology-coverage", title: "Khmer Terminology Coverage Checker", khmerTitle: "ពិនិត្យការគ្របដណ្តប់ពាក្យបច្ចេកទេសខ្មែរ", addedOn: "2026-08-06T09:10:00+07:00", category: "khmer", keywords: ["terminology", "coverage", "mptc", "glossary", "technical terms"], Component: load("khmer", "terminology-coverage") },
  { id: "terminology-translator", title: "Khmer ↔ Digital Terminology Translator", khmerTitle: "កម្មវិធីបកប្រែវាក្យស័ព្ទឌីជីថល ខ្មែរ ↔ អង់គ្លេស", addedOn: "2026-08-06T09:20:00+07:00", category: "khmer", keywords: ["terminology translator", "mptc", "official terms", "digital terminology", "khmer translation", "វាក្យស័ព្ទ", "បកប្រែបច្ចេកទេស"], Component: load("khmer", "terminology-translator") },
  { id: "document-terminology-scanner", title: "Khmer Document Terminology Scanner", khmerTitle: "ស្កេនពាក្យបច្ចេកទេសក្នុងឯកសារ", addedOn: "2026-08-06T09:30:00+07:00", category: "khmer", keywords: ["document", "pdf", "docx", "txt", "terminology", "scanner", "report", "occurrences"], Component: load("khmer", "document-terminology-scanner") },
  { id: "dataset-profiler", title: "Khmer Dataset Profiler", khmerTitle: "វិភាគគុណភាព Dataset ខ្មែរ", addedOn: "2026-08-06T09:40:00+07:00", category: "khmer", keywords: ["dataset", "csv", "json", "duplicates", "unicode", "language statistics", "missing values", "normalize", "deduplicate"], Component: load("khmer", "dataset-profiler") },
  { id: "place-name-variants", title: "Cambodia Place-Name Variant Finder", khmerTitle: "ស្វែងរកបំរែបំរួលឈ្មោះទីកន្លែងកម្ពុជា", addedOn: "2026-08-04T11:45:00+07:00", category: "khmer", keywords: ["place names", "variants", "gis", "osm", "province", "gazetteer"], Component: load("khmer", "place-name-variants") },
  { id: "font-coverage-analyzer", title: "Khmer Font Coverage Analyzer", khmerTitle: "វិភាគការគាំទ្រអក្សរខ្មែរ ក្នុង Font", addedOn: "2026-08-06T09:50:00+07:00", category: "khmer", keywords: ["font", "ttf", "otf", "glyph", "coverage", "khmer", "unicode block", "consonants", "subscripts", "vowels", "punctuation"], Component: load("khmer", "font-coverage-analyzer") },
  { id: "web-shaping-test-lab", title: "Khmer Web Shaping Test Lab", khmerTitle: "មន្ទីរពិសោធន៍សាកល្បងការបង្ហាញអក្សរខ្មែរ", addedOn: "2026-08-06T10:00:00+07:00", category: "khmer", keywords: ["font", "shaping", "khmer", "coeng", "vowels", "browser", "chrome", "firefox", "safari", "typography", "OpenType"], Component: load("khmer", "web-shaping-test-lab") },
  { id: "font-regression-tester", title: "Khmer Font Regression Tester", khmerTitle: "ប្រៀបធៀប Font ខ្មែរ", addedOn: "2026-08-04T11:55:00+07:00", category: "khmer", keywords: ["font comparison", "font regression", "ttf", "otf", "rendering"], Component: load("khmer", "font-regression-tester") },
  { id: "word-relationships", title: "Khmer Word Relationship Explorer", khmerTitle: "ស្វែងរកទំនាក់ទំនងពាក្យខ្មែរ", addedOn: "2026-08-04T12:00:00+07:00", category: "khmer", keywords: ["word graph", "relationships", "synonym", "antonym", "related words", "khmer vocabulary"], Component: load("khmer", "word-relationships") },
  { id: "name-structure-explorer", title: "Khmer Name Structure Explorer", khmerTitle: "កម្មវិធីវិភាគរចនាសម្ព័ន្ធឈ្មោះខ្មែរ", addedOn: "2026-08-04T12:05:00+07:00", category: "khmer", keywords: ["khmer name", "surname", "given name", "grapheme", "decomposition", "transliteration", "mononym"], Component: load("khmer", "name-structure-explorer") },
  { id: "word-formation-explorer", title: "Khmer Root & Word Formation Explorer", khmerTitle: "អ្នករុករកឫសគល់ពាក្យខ្មែរ", addedOn: "2026-08-04T12:10:00+07:00", category: "khmer", keywords: ["root", "word formation", "prefix", "infix", "affix", "etymology", "sandhi", "morphology", "derivation", "ឫសពាក្យ", "ផ្នត់ដើម", "ផ្នត់ជែក", "កម្លាយ"], Component: load("khmer", "word-formation-explorer") },
  { id: "khmer-lexicon", title: "Homophone", khmerTitle: "សទិសសូរ", addedOn: "2026-08-03T10:25:00+07:00", category: "khmer", keywords: ["dictionary", "homophone", "synonym", "antonym", "lexicon", "vocabulary", "khmer word", "chuon nath", "សទានុក្រម", "សទិសសូរ", "ពាក្យ"], Component: load("khmer", "khmer-lexicon") },
  { id: "khmer-homophone-corrector", title: "Khmer Homophone Corrector", khmerTitle: "អក្ខរាវិរុទ្ធ និងសទិសសូរ", addedOn: "2026-08-12T12:00:00+07:00", category: "khmer", keywords: ["homophone", "spell check", "corrector", "analyzer", "orthography", "contextual", "auto fix", "khmer spelling", "សទិសសូរ", "អក្ខរាវិរុទ្ធ", "កែអក្សរ"], Component: load("khmer", "khmer-homophone-corrector") },
  { id: "collation-sorter", title: "Khmer Collation Sorter", category: "khmer", keywords: ["sort", "alphabetical", "collator", "intl"], Component: load("khmer", "collation-sorter") },
  { id: "khmer-slug-generator", title: "Khmer → URL Slug Generator", category: "khmer", keywords: ["slug", "url", "next.js", "route", "transliterate"], Component: load("khmer", "slug-generator") },
  { id: "pronoun-register", title: "Khmer Pronoun & Register Reference", category: "khmer", keywords: ["pronoun", "register", "politeness", "សព្វនាម", "translation"], Component: load("khmer", "pronoun-register") },
  { id: "loanword-explorer", title: "Khmer Loanword Explorer", addedOn: "2026-08-03T10:05:00+07:00", category: "khmer", keywords: ["loanword", "etymology", "sanskrit", "pali", "french", "portuguese", "chinese", "thai", "language history", "linguistics", "កម្ចី", "និរុត្តិសាស្ត្រ"], Component: load("khmer", "loanword-explorer") },
  { id: "administrative-letter-builder", title: "Khmer Administrative Letter Builder", khmerTitle: "កម្មវិធីបង្កើតលិខិតរដ្ឋបាលខ្មែរ", addedOn: "2026-07-29", category: "khmer", keywords: ["administrative letter", "official letter", "100 templates", "solar date", "lunar date", "province", "microsoft word", "docx", "a4", "khmerscribe", "លិខិតរដ្ឋបាល", "លិខិតស្នើសុំ", "លិខិតអញ្ជើញ"], Component: load("khmer", "administrative-letter-builder") },
  { id: "honorific-guide", title: "Khmer Official Honorific Guide", khmerTitle: "មគ្គុទ្ទេសក៍គោរមងារផ្លូវការខ្មែរ", addedOn: "2026-07-29", category: "khmer", keywords: ["honorific", "protocol", "salutation", "title", "khmerscribe", "គោរមងារ", "ពិធីការ", "ពាក្យគោរព"], Component: load("khmer", "honorific-guide") },
  { id: "css-wrap-fix", title: "Khmer Line-Wrap CSS Fix", category: "khmer", keywords: ["css", "word-break", "overflow-wrap", "zwsp", "line wrap"], Component: load("khmer", "css-wrap-fix") },
  { id: "khmer-lorem-ipsum", title: "Khmer Placeholder Text Generator", category: "khmer", keywords: ["lorem ipsum", "filler", "placeholder", "mockup"], Component: load("khmer", "lorem-ipsum") },
  { id: "postal-code-finder", title: "Cambodia Postal Code Finder", khmerTitle: "ស្វែងរកលេខកូដប្រៃសណីយ៍កម្ពុជា", category: "khmer", keywords: ["postal", "postcode", "zip", "address", "ប្រៃសណីយ៍"], Component: load("khmer", "postal-code-finder") },
  { id: "administrative-hierarchy", title: "Cambodia Administrative Hierarchy", khmerTitle: "ឋានានុក្រមរដ្ឋបាលកម្ពុជា", category: "khmer", keywords: ["province", "district", "commune", "village", "address", "ភូមិ", "ឃុំ"], Component: load("khmer", "administrative-hierarchy") },
  { id: "ministry-directory", title: "Cambodia Government Institution Directory", khmerTitle: "បញ្ជីក្រសួង និងស្ថាប័នរាជរដ្ឋាភិបាល", category: "khmer", keywords: ["ministry", "government", "institution", "contact", "ក្រសួង"], Component: load("khmer", "ministry-directory") },
  { id: "government-plate-lookup", title: "Cambodia Government Plate Lookup", khmerTitle: "ស្វែងរកស្លាកលេខរដ្ឋកម្ពុជា", category: "khmer", keywords: ["plate", "state", "police", "military", "ស្លាកលេខ"], Component: load("khmer", "government-plate-lookup") },
  { id: "khmer-unicode-normalizer", title: "Khmer Typing Sequence Normalizer", khmerTitle: "កែសម្រួលលំដាប់វាយអក្សរខ្មែរ", addedOn: "2026-07-31", category: "khmer", keywords: ["unicode", "normalize", "typing sequence", "coeng", "zero width", "យូនីកូដ", "អក្សរជើង"], Component: load("khmer", "khmer-unicode-normalizer") },
  { id: "coeng-tada-corrector", title: "Khmer Coeng Ta/Da Corrector", khmerTitle: "កែសម្រួលជើង ត / ជើង ដ", addedOn: "2026-08-06T10:10:00+07:00", category: "khmer", keywords: ["coeng", "tada", "ta", "da", "khmer spelling", "orthography", "wasm", "unicode", "ជើងត", "ជើងដ"], localProject: { author: "Seanghay Yath", repository: "https://github.com/seanghay/khmer-coeng-tada-corrector", license: "MIT" }, Component: load("khmer", "coeng-tada-corrector") },
  { id: "khmer-word-segmentation-tester", title: "Khmer Word Segmentation Tester", khmerTitle: "កម្មវិធីសាកល្បងបំបែកពាក្យខ្មែរ", addedOn: "2026-07-31", category: "khmer", keywords: ["word segmentation", "tokenizer", "nlp", "boundary", "khmer nlp", "បំបែកពាក្យ"], localProject: { author: "Seanghay Yath", repository: "https://github.com/seanghay/split-khmer", license: "MIT" }, Component: load("khmer", "word-segmentation-tester") },
  { id: "khmer-font-encoding-inspector", title: "Khmer Font Encoding Inspector", khmerTitle: "ពិនិត្យការអ៊ិនកូដពុម្ពអក្សរខ្មែរ", addedOn: "2026-07-31", category: "khmer", keywords: ["font", "encoding", "ttf", "otf", "cmap", "unicode", "ពុម្ពអក្សរ"], Component: load("khmer", "font-encoding-inspector") },
  { id: "khmer-sentence-segmenter", title: "Khmer Sentence Segmenter", khmerTitle: "បំបែកប្រយោគខ្មែរ", category: "khmer", keywords: ["sentence", "segment", "punctuation", "nlp", "ប្រយោគ"], Component: load("khmer", "khmer-sentence-segmenter") },
  { id: "khmer-lyrics", title: "Khmer Song Lyrics Browser", khmerTitle: "អ្នកអានខ្លឹមសារបទចម្រៀងខ្មែរ", addedOn: "2026-08-24", category: "khmer", keywords: ["lyrics", "songs", "khmer music", "sin sisamouth", "ros sereysothea", "pan ron", "ចម្រៀង", "ខ្លឹមសារ", "បទចម្រៀង"], localProject: { author: "im4tta", repository: "https://github.com/im4tta/khlyrics", license: "unknown", relationship: "integrated" }, Component: load("khmer", "khmer-lyrics") },  { id: "khmer-punctuation-restorer", title: "Khmer Sentence Punctuation Restorer", khmerTitle: "កែសម្រួលវណ្ណយុត្តិប្រយោគខ្មែរ", addedOn: "2026-08-06T10:20:00+07:00", category: "khmer", keywords: ["punctuation", "restore", "ocr", "asr", "scraped text", "old documents", "khmerpunctuate", "វណ្ណយុត្តិ"], localProject: { author: "Seanghay Yath", repository: "https://github.com/seanghay/khmerpunctuate", license: "MIT", relationship: "inspired" }, Component: load("khmer", "khmer-punctuation-restorer") },
  { id: "khmer-text-diff", title: "Khmer Text Diff", khmerTitle: "ប្រៀបធៀបអត្ថបទខ្មែរ", addedOn: "2026-08-24", category: "khmer", keywords: ["diff", "compare", "grapheme", "khmer text", "change", "ប្រៀបធៀប", "អត្ថបទខ្មែរ"], Component: load("khmer", "khmer-text-diff") },
  { id: "khmer-greeting-cards", title: "Khmer Greeting Cards", khmerTitle: "កាតជូនពរខ្មែរ", addedOn: "2026-08-24", category: "khmer", keywords: ["greeting", "card", "well-wish", "new year", "wedding", "condolence", "កាតជូនពរ", "ចូលឆ្នាំ", "អាពាហ៍ពិពាហ៍"], Component: load("khmer", "khmer-greeting-cards") },
  { id: "khmer-bionic-reader", title: "Khmer Bionic Reader", khmerTitle: "អានខ្មែរលឿន", addedOn: "2026-08-25", category: "khmer", keywords: ["bionic", "speed reading", "reading", "khmer", "bold", "skim", "អានលឿន", "អានខ្មែរ"], Component: load("khmer", "khmer-bionic-reader") },
  { id: "emergency-hotlines", title: "Emergency & Utility Hotlines", khmerTitle: "លេខទូរស័ព្ទបន្ទាន់ និងឧបករណ៍ប្រើប្រាស់", addedOn: "2026-08-25", category: "khmer", keywords: ["emergency", "hotline", "police", "fire", "ambulance", "edc", "ppwsa", "phone", "លេខបន្ទាន់", "អគ្គីភ័យ"], Component: load("khmer", "emergency-hotlines") },
  { id: "administrative-code-decoder", title: "Cambodia Administrative Code Decoder", khmerTitle: "ឧបករណ៍អានលេខកូដរដ្ឋបាលកម្ពុជា", category: "khmer", keywords: ["administrative code", "province code", "district code", "commune code", "village code", "លេខកូដរដ្ឋបាល"], Component: load("khmer", "administrative-code-decoder") },
  { id: "address-formatter", title: "Cambodia Bilingual Address Formatter", khmerTitle: "រៀបចំទម្រង់អាសយដ្ឋានកម្ពុជាពីរភាសា", category: "khmer", keywords: ["address", "format", "bilingual", "csv", "អាសយដ្ឋាន"], Component: load("khmer", "address-formatter") },
  { id: "government-plate-parser", title: "Cambodia Government Plate Parser", khmerTitle: "ឧបករណ៍វិភាគស្លាកលេខរដ្ឋកម្ពុជា", category: "khmer", keywords: ["plate", "parse", "normalize", "state", "police", "military", "ស្លាកលេខ"], Component: load("khmer", "government-plate-parser") },

  // ---- Geospatial (24) ----
  { id: "evskh", title: "Cambodia EV Charging Station Finder", khmerTitle: "ស្វែងរកស្ថានីយសាករថយន្តអគ្គិសនីនៅកម្ពុជា", category: "geo", keywords: ["ev", "electric vehicle", "charging station", "charger", "cambodia", "gps", "map", "ccs2", "gb/t", "ស្ថានីយសាក", "រថយន្តអគ្គិសនី"], Component: load("geo", "ev-station-finder") },
  { id: "cambodia-environment", title: "Cambodia Environment Dashboard", khmerTitle: "ផ្ទាំងព័ត៌មានបរិស្ថានកម្ពុជា", addedOn: "2026-07-29", category: "geo", keywords: ["environment", "weather", "uv", "aqi", "air quality", "dashboard", "mef", "បរិស្ថាន"], Component: load("geo", "environment-dashboard") },
  { id: "cambodia-fuel-prices", title: "Cambodia Fuel Prices", addedOn: "2026-08-03T10:45:00+07:00", category: "khmer", keywords: ["fuel", "petrol", "gas", "diesel", "price", "ministry of commerce", "gasoline", "kerosene", "caltex", "total", "tela", "សាំង", "ម៉ាស៊ូត", "ប្រេង"], Component: load("khmer", "fuel-prices") },
  { id: "cambodia-weather", title: "Cambodia Live Weather", khmerTitle: "អាកាសធាតុបច្ចុប្បន្ននៅកម្ពុជា", addedOn: "2026-07-29", category: "geo", keywords: ["weather", "temperature", "rain", "humidity", "wind", "mef", "អាកាសធាតុ"], Component: load("geo", "weather") },
  { id: "cambodia-uv-index", title: "Cambodia UV Index", khmerTitle: "សន្ទស្សន៍កាំរស្មី UV នៅកម្ពុជា", addedOn: "2026-07-29", category: "geo", keywords: ["uv", "ultraviolet", "sun", "exposure", "mef", "កាំរស្មី"], Component: load("geo", "uv-index") },
  { id: "cambodia-air-quality", title: "Cambodia Air Quality", khmerTitle: "គុណភាពខ្យល់នៅកម្ពុជា", addedOn: "2026-07-29", category: "geo", keywords: ["aqi", "air quality", "pm2.5", "pm10", "pollution", "mef", "គុណភាពខ្យល់"], Component: load("geo", "air-quality") },
  { id: "dms-converter", title: "Decimal Degrees ⟷ DMS", category: "geo", keywords: ["dms", "degrees minutes seconds"], Component: load("geo", "dms-converter") },
  { id: "haversine", title: "Haversine Distance", category: "geo", keywords: ["distance", "great circle"], Component: load("geo", "haversine") },
  { id: "bounding-box", title: "Bounding Box Calculator", category: "geo", keywords: ["bbox", "extent"], Component: load("geo", "bounding-box") },
  { id: "midpoint", title: "Midpoint Calculator", category: "geo", keywords: ["midpoint", "center point"], Component: load("geo", "midpoint") },
  { id: "bearing", title: "Bearing / Azimuth Calculator", category: "geo", keywords: ["bearing", "azimuth", "compass"], Component: load("geo", "bearing") },
  { id: "destination-point", title: "Destination Point Calculator", category: "geo", keywords: ["destination", "projection"], Component: load("geo", "destination-point") },
  { id: "polygon-area", title: "Polygon Area Calculator", category: "geo", keywords: ["area", "shoelace", "parcel"], Component: load("geo", "polygon-area") },
  { id: "geohash", title: "Geohash Encoder / Decoder", category: "geo", keywords: ["geohash"], Component: load("geo", "geohash") },
  { id: "utm-converter", title: "Lat/Lng → UTM", category: "geo", keywords: ["utm", "zone", "easting", "northing"], Component: load("geo", "utm-converter") },
  { id: "geojson-formatter", title: "GeoJSON Formatter & Validator", category: "geo", keywords: ["geojson", "feature"], Component: load("geo", "geojson-formatter") },
  { id: "coordinate-cleaner", title: "Coordinate Format Cleaner", category: "geo", keywords: ["parse coordinates", "clean"], Component: load("geo", "coordinate-cleaner") },
  { id: "area-units", title: "Area Unit Converter", category: "geo", keywords: ["hectare", "acre", "rai", "sqm"], Component: load("geo", "area-units") },
  { id: "map-scale", title: "Map Scale Calculator", category: "geo", keywords: ["scale", "ratio", "cartography"], Component: load("geo", "map-scale") },
  { id: "elevation-grade", title: "Slope / Grade Calculator", category: "geo", keywords: ["slope", "grade", "rise run"], Component: load("geo", "elevation-grade") },
  { id: "province-lookup", title: "Cambodia Province Lookup", category: "geo", keywords: ["province", "khet", "ខេត្ត"], Component: load("geo", "province-lookup") },
  { id: "kml-info", title: "KML Placemark Inspector", category: "geo", keywords: ["kml", "placemark"], Component: load("geo", "kml-info") },
  { id: "gps-validator", title: "GPS Coordinate Validator", category: "geo", keywords: ["gps", "validate", "lat lng"], Component: load("geo", "gps-validator") },
  { id: "speed-distance-time", title: "Speed / Distance / Time Calculator", category: "geo", keywords: ["speed", "distance", "time", "travel"], Component: load("geo", "speed-distance-time") },
  { id: "nearest-province", title: "Nearest Province Finder", category: "geo", keywords: ["cambodia-address", "reverse geocode", "province", "gps"], Component: load("geo", "nearest-province") },
  { id: "airport-lookup", title: "Airport Lookup", khmerTitle: "ស្វែងរកព្រលានយន្តហោះ", addedOn: "2026-08-10T10:00:00+07:00", category: "geo", keywords: ["airport", "iata", "icao", "aviation", "flight", "terminal", "ព្រលានយន្តហោះ", "កំពង់យន្តហោះ"], localProject: { author: "OurAirports", repository: "https://ourairports.com/data/", license: "Public Domain", relationship: "integrated" }, Component: load("geo", "airport-lookup") },
  { id: "flight-route-planner", title: "Flight Route Planner", khmerTitle: "អ្នករៀបចំផ្លូវហោះហើរ", addedOn: "2026-08-24", category: "geo", keywords: ["flight", "route", "airport", "great circle", "distance", "itinerary", "travel", "ហោះហើរ", "ផ្លូវហោះ"], localProject: { author: "OurAirports", repository: "https://ourairports.com/data/", license: "Public Domain", relationship: "integrated" }, Component: load("geo", "flight-route-planner") },
  { id: "map-poster-generator", title: "Map Poster Generator", khmerTitle: "បង្កើតផ្ទាំងផែនទី", addedOn: "2026-08-24", category: "geo", keywords: ["map", "poster", "print", "cartography", "printable", "art", "ផែនទី", "ផ្ទាំងផែនទី"], localProject: { author: "im4tta", repository: "https://github.com/im4tta/teetang.art", license: "MIT", relationship: "adapted" }, Component: load("geo", "map-poster-generator") },
  { id: "route-on-map", title: "Route on Map", khmerTitle: "ផ្លូវហោះហើរលើផែនទី", addedOn: "2026-08-24", category: "geo", keywords: ["route", "map", "airport", "great circle", "distance", "maplibre", "ផ្លូវ", "ផែនទី"], localProject: { author: "OurAirports", repository: "https://ourairports.com/data/", license: "Public Domain", relationship: "integrated" }, Component: load("geo", "route-on-map") },
  { id: "ride-fare-estimator", title: "Phnom Penh Ride Fare Estimator", khmerTitle: "ប៉ាន់ស្មានថ្លៃជិះភ្នំពេញ", addedOn: "2026-08-25", category: "geo", keywords: ["tuk-tuk", "grab", "fare", "ride", "taxi", "phnom penh", "distance", "ថ្លៃឈ្នួល", "ជិះ"], Component: load("geo", "ride-fare-estimator") },

  // ---- Science (1) ----
  { id: "materials", title: "Earth Materials & 3D Atom Pro", khmerTitle: "សារធាតុផែនដី & អាតូម 3D Pro", addedOn: "2026-07-30", category: "science", keywords: ["elements", "periodic table", "materials", "chemistry", "3d atom", "isotopes", "science", "វិទ្យាសាស្រ្ត", "ធាតុគីមី", "តារាងខួប", "សារធាតុ"], Component: load("science", "materials") },
  { id: "bmr-calculator", title: "BMR / TDEE Calculator", khmerTitle: "គណនា BMR / TDEE", addedOn: "2026-08-17T20:10:00+07:00", category: "science", keywords: ["bmr", "tdee", "calories", "calorie calculator", "metabolism", "weight loss", "កាឡូរី", "មេតាបូលីស"], Component: load("science", "bmr-calculator") },
  { id: "running-pace", title: "Running Pace Calculator", khmerTitle: "គណនាល្បឿនរត់", addedOn: "2026-08-17T20:15:00+07:00", category: "science", keywords: ["running", "pace", "speed", "marathon", "runner", "km/h", "រត់", "ល្បឿន"], Component: load("science", "running-pace") },
  { id: "water-intake", title: "Water Intake Tracker", khmerTitle: "តាមដានការផឹកទឹក", addedOn: "2026-08-17T20:20:00+07:00", category: "science", keywords: ["water", "hydration", "drink", "daily", "tracker", "ទឹក", "ផឹកទឹក"], Component: load("science", "water-intake") },
  { id: "sunrise-sunset", title: "Sunrise / Sunset Calculator", khmerTitle: "គណនាថ្ងៃរះ/ថ្ងៃលិច", addedOn: "2026-08-17T20:25:00+07:00", category: "science", keywords: ["sunrise", "sunset", "sun", "day length", "astronomy", "phnom penh", "ថ្ងៃរះ", "ថ្ងៃលិច"], Component: load("science", "sunrise-sunset") },
  { id: "ideal-weight", title: "Ideal Weight Calculator", khmerTitle: "គណនាទម្ងន់សមស្រប", addedOn: "2026-08-17T21:50:00+07:00", category: "science", keywords: ["ideal weight", "healthy weight", "devine formula", "bmi", "health", "ទម្ងន់"], Component: load("science", "ideal-weight") },
  { id: "macro-calculator", title: "Macro Calculator", khmerTitle: "គណនា Macronutrient", addedOn: "2026-08-17T22:25:00+07:00", category: "science", keywords: ["macro", "protein", "carbs", "fat", "calories", "tdee", "fitness", "អាហារូបត្ថម្ភ"], Component: load("science", "macro-calculator") },
  { id: "body-fat-calculator", title: "Body Fat Calculator (US Navy)", khmerTitle: "គណនាភាគរយខ្លាញ់ក្នុងខ្លួន", addedOn: "2026-08-17T22:30:00+07:00", category: "science", keywords: ["body fat", "navy method", "percentage", "measurement", "health", "tape", "ខ្លាញ់"], Component: load("science", "body-fat-calculator") },
  { id: "steps-distance", title: "Steps → Distance", khmerTitle: "បម្លែងជំហានទៅចម្ងាយ", addedOn: "2026-08-17T22:35:00+07:00", category: "science", keywords: ["steps", "walking", "distance", "calories", "stride", "fitness", "ជំហាន", "ចម្ងាយ"], Component: load("science", "steps-distance") },
  { id: "phone-number-cleaner", title: "Phone Number Cleaner Pro", khmerTitle: "កម្មវិធីសម្អាត និងបំប្លែងលេខទូរស័ព្ទខ្មែរ", addedOn: "2026-07-30", category: "science", keywords: ["phone", "number", "cleaner", "parser", "format", "Cambodia", "cellcard", "smart", "metfone", "telegram", "whatsapp"], Component: load("science", "phone-number-cleaner") },
  { id: "electronics-calculators", title: "Electronics Calculators", khmerTitle: "ម៉ាស៊ីនគណនាអេឡិចត្រូនិក", addedOn: "2026-08-21T13:00+07:00", category: "science", keywords: ["resistor", "color code", "led", "voltage divider", "ohms law", "electronics", "circuit", "ohm", "រេស៊ីស្ទ័រ", "អេឡិចត្រូនិក"], Component: load("science", "electronics-calculators") },
  { id: "one-rep-max", title: "One-Rep Max (1RM) Calculator", khmerTitle: "គណនាទម្ងន់អតិបរមា ១ដង (1RM)", addedOn: "2026-08-21T13:05+07:00", category: "science", keywords: ["1rm", "one rep max", "epley", "brzycki", "strength", "lifting", "gym", "weightlifting", "fitness", "លើកទម្ងន់"], Component: load("science", "one-rep-max") },

  // ---- Text (18) ----
  { id: "sample-paragraph-generator", title: "Sample Paragraph Generator", category: "text", keywords: ["email template", "boilerplate", "administrative", "draft", "sample text"], Component: load("text", "sample-paragraph-generator") },
  { id: "text-reverse", title: "Text Reverse", category: "text", keywords: ["reverse", "flip text"], Component: load("text", "text-reverse") },
  { id: "palindrome-checker", title: "Palindrome Checker", category: "text", keywords: ["palindrome"], Component: load("text", "palindrome-checker") },
  { id: "char-frequency", title: "Character Frequency Counter", category: "text", keywords: ["frequency", "letter count"], Component: load("text", "char-frequency") },
  { id: "line-sorter", title: "Line Sorter", category: "text", keywords: ["sort lines", "alphabetize"], Component: load("text", "line-sorter") },
  { id: "remove-duplicates", title: "Duplicate Line Remover", category: "text", keywords: ["duplicates", "unique lines"], Component: load("text", "remove-duplicates") },
  { id: "text-truncate", title: "Text Truncator", category: "text", keywords: ["truncate", "ellipsis", "shorten"], Component: load("text", "text-truncate") },
  { id: "find-replace", title: "Find & Replace", category: "text", keywords: ["replace", "regex replace"], Component: load("text", "find-replace") },
  { id: "text-to-binary", title: "Text ⟷ Binary", category: "text", keywords: ["binary", "bits"], Component: load("text", "text-to-binary") },
  { id: "text-to-morse", title: "Text ⟷ Morse Code", category: "text", keywords: ["morse", "sos"], Component: load("text", "text-to-morse") },
  { id: "acronym-generator", title: "Acronym Generator", category: "text", keywords: ["acronym", "initials"], Component: load("text", "acronym-generator") },
  { id: "random-string", title: "Random String Generator", category: "text", keywords: ["random", "generate string"], Component: load("text", "random-string") },
  { id: "text-statistics", title: "Text Statistics", category: "text", keywords: ["reading time", "word count"], Component: load("text", "text-statistics") },
  { id: "whitespace-trimmer", title: "Whitespace / Line Cleaner", category: "text", keywords: ["trim", "whitespace", "blank lines"], Component: load("text", "whitespace-trimmer") },
  { id: "text-case-normalizer", title: "Text Case & Normalizer", khmerTitle: "បំលែងអក្សរ និងសម្អាតអត្ថបទ", addedOn: "2026-08-12T11:00:00+07:00", category: "text", keywords: ["uppercase", "lowercase", "sentence case", "title case", "capitalize", "normalize", "unicode", "nfc", "whitespace", "diff", "compare", "text cleaner", "case converter", "find and replace", "camelcase", "snake_case", "kebab-case", "sort lines", "reverse", "remove duplicates", "អក្សរធំ", "អក្សរតូច"], Component: load("text", "text-case-normalizer") },
  { id: "text-columns", title: "Text to Columns Splitter", category: "text", keywords: ["split", "delimiter", "columns"], Component: load("text", "text-columns") },
  { id: "anagram-checker", title: "Anagram Checker", category: "text", keywords: ["anagram", "letters"], Component: load("text", "anagram-checker") },
  { id: "line-numberer", title: "Text Line Numberer", category: "text", keywords: ["line numbers", "numbered list"], Component: load("text", "line-numberer") },
  { id: "nato-phonetic", title: "NATO Phonetic Alphabet", khmerTitle: "អក្ខរក្រមសូរសព្ទ NATO", addedOn: "2026-08-17T15:20:00+07:00", category: "text", keywords: ["nato", "phonetic", "alphabet", "alpha bravo", "spell", "radio", "សូរសព្ទ", "អក្ខរក្រម"], Component: load("text", "nato-phonetic") },
  { id: "word-scrambler", title: "Word Scrambler", khmerTitle: "លាយអក្សរ", addedOn: "2026-08-17T16:00:00+07:00", category: "text", keywords: ["scramble", "anagram", "shuffle letters", "word jumble", "លាយអក្សរ", "អក្សរ"], Component: load("text", "word-scrambler") },
  { id: "text-to-emoji", title: "Text to Emoji", khmerTitle: "បំប្លែងអត្ថបទទៅជា Emoji", addedOn: "2026-08-17T16:05:00+07:00", category: "text", keywords: ["emoji", "text to emoji", "emojify", "translate", "emoji", "អ៊ីម៉ូជី"], Component: load("text", "text-to-emoji") },
  { id: "leetspeak", title: "Leetspeak Converter", khmerTitle: "បំប្លែង Leetspeak", addedOn: "2026-08-17T16:35:00+07:00", category: "text", keywords: ["leetspeak", "leet", "1337", "hacker", "gamer", "text"], Component: load("text", "leetspeak") },
  { id: "smart-quotes", title: "Smart Quotes Converter", khmerTitle: "បម្លែងសញ្ញាសម្រង់", addedOn: "2026-08-17T17:10:00+07:00", category: "text", keywords: ["smart quotes", "curly quotes", "typography", "straight quotes", "unicode", "សញ្ញាសម្រង់"], Component: load("text", "smart-quotes") },
  { id: "bionic-reading", title: "Bionic Reading Converter", khmerTitle: "បម្លែងអក្សរសម្រាប់អានលឿន", addedOn: "2026-08-17T18:20:00+07:00", category: "text", keywords: ["bionic reading", "speed reading", "bold", "read faster", "focus"], Component: load("text", "bionic-reading") },
  { id: "pig-latin", title: "Pig Latin Translator", khmerTitle: "បម្លែង Pig Latin", addedOn: "2026-08-17T18:25:00+07:00", category: "text", keywords: ["pig latin", "language game", "translate", "fun", "word game"], Component: load("text", "pig-latin") },
  { id: "syllable-counter", title: "Syllable Counter", khmerTitle: "រាប់ព្យាង្គអង់គ្លេស", addedOn: "2026-08-17T21:10:00+07:00", category: "text", keywords: ["syllable", "count", "poetry", "lyrics", "english"], Component: load("text", "syllable-counter") },
  { id: "typing-test", title: "Typing Speed Test", khmerTitle: "តេស្តល្បឿនវាយអក្សរ", addedOn: "2026-08-17T22:40:00+07:00", category: "text", keywords: ["typing", "wpm", "speed", "accuracy", "test", "keyboard", "វាយអក្សរ"], Component: load("text", "typing-test") },
  { id: "text-wrap", title: "Text Wrapper", khmerTitle: "បង្វែរបន្ទាត់អត្ថបទ", addedOn: "2026-08-17T22:45:00+07:00", category: "text", keywords: ["wrap", "width", "hard wrap", "soft wrap", "line length", "រុំអត្ថបទ"], Component: load("text", "text-wrap") },

  // ---- Math (17) ----
  { id: "percentage-calculator", title: "Percentage Calculator", category: "math", keywords: ["percent", "percentage"], Component: load("math", "percentage-calculator") },
  { id: "base-converter", title: "Number Base Converter", category: "math", keywords: ["binary", "hex", "octal", "decimal"], Component: load("math", "base-converter") },
  { id: "gcd-lcm", title: "GCD & LCM Calculator", category: "math", keywords: ["gcd", "lcm", "greatest common divisor"], Component: load("math", "gcd-lcm") },
  { id: "prime-checker", title: "Prime Number Checker & Factorizer", category: "math", keywords: ["prime", "factorize", "factors"], Component: load("math", "prime-checker") },
  { id: "fibonacci-generator", title: "Fibonacci Sequence Generator", category: "math", keywords: ["fibonacci", "sequence"], Component: load("math", "fibonacci-generator") },
  { id: "number-to-words", title: "Number to Words", khmerTitle: "លេខទៅជាពាក្យ", addedOn: "2026-08-17T14:40:00+07:00", category: "math", keywords: ["number to words", "spell out", "english words", "integer", "លេខ", "ពាក្យ"], Component: load("math", "number-to-words") },
  { id: "quadratic-solver", title: "Quadratic Equation Solver", category: "math", keywords: ["quadratic", "roots", "discriminant"], Component: load("math", "quadratic-solver") },
  { id: "linear-solver", title: "Linear Equation Solver", khmerTitle: "ដោះស្រាយសមីការលីនេអ៊ែរ", addedOn: "2026-08-17T18:30:00+07:00", category: "math", keywords: ["linear equations", "system", "solve", "gaussian", "unknowns", "algebra", "សមីការ"], Component: load("math", "linear-solver") },
  { id: "prime-factorization", title: "Prime Factorization", khmerTitle: "បំបែកជាលេខបឋម", addedOn: "2026-08-17T18:35:00+07:00", category: "math", keywords: ["prime", "factor", "factorization", "exponent", "prime powers", "លេខបឋម"], Component: load("math", "prime-factorization") },
  { id: "fraction-arithmetic", title: "Fraction Arithmetic", khmerTitle: "គណនាប្រភាគ", addedOn: "2026-08-17T18:40:00+07:00", category: "math", keywords: ["fraction", "add", "subtract", "multiply", "divide", "simplify", "ប្រភាគ"], Component: load("math", "fraction-arithmetic") },
  { id: "scientific-notation", title: "Scientific Notation Converter", khmerTitle: "បម្លែងអិចស្ប៉ូណង់ស្យែល", addedOn: "2026-08-17T18:45:00+07:00", category: "math", keywords: ["scientific notation", "exponent", "si prefix", "engineering notation", "converter"], Component: load("math", "scientific-notation") },
  { id: "proportion-calculator", title: "Proportion Calculator (Rule of Three)", khmerTitle: "គណនាសមាមាត្រ", addedOn: "2026-08-17T21:15:00+07:00", category: "math", keywords: ["proportion", "rule of three", "ratio", "cross multiply", "x", "សមាមាត្រ", "ក្បួនបីស្វ័យ"], Component: load("math", "proportion-calculator") },
  { id: "statistics-calculator", title: "Mean / Median / Mode / StdDev Calculator", category: "math", keywords: ["statistics", "mean", "median", "mode"], Component: load("math", "statistics-calculator") },
  { id: "matrix-calculator", title: "Matrix Determinant", category: "math", keywords: ["matrix", "determinant"], Component: load("math", "matrix-calculator") },
  { id: "unit-converter", title: "Length / Weight / Volume Unit Converter", category: "math", keywords: ["unit", "convert", "metric", "imperial"], Component: load("math", "unit-converter") },
  { id: "universal-math-workspace", title: "Universal Math Workspace", khmerTitle: "កន្លែងធ្វើការគណិតវិទ្យាសកល", addedOn: "2026-08-04T09:05:00+07:00", category: "math", keywords: ["math", "smart input", "fraction", "percent", "duration", "unit conversion", "calculator"], Component: load("math", "universal-math-workspace") },
  { id: "universal-converter", title: "Universal Unit Converter", khmerTitle: "កម្មវិធីបម្លែងឯកតាសកល", addedOn: "2026-08-04T09:00:00+07:00", category: "math", keywords: ["unit", "convert", "all units", "length", "mass", "volume", "area", "speed", "data"], Component: load("math", "universal-converter") },
  { id: "temperature-converter", title: "Temperature Converter", category: "math", keywords: ["celsius", "fahrenheit", "kelvin"], Component: load("math", "temperature-converter") },
  { id: "random-number", title: "Random Number Generator", category: "math", keywords: ["random", "range"], Component: load("math", "random-number") },
  { id: "ratio-simplifier", title: "Ratio Simplifier", category: "math", keywords: ["ratio", "simplify"], Component: load("math", "ratio-simplifier") },
  { id: "roman-numeral", title: "Roman Numeral Converter", category: "math", keywords: ["roman numeral"], Component: load("math", "roman-numeral") },
  { id: "triangle-solver", title: "Right Triangle Solver", category: "math", keywords: ["triangle", "hypotenuse", "pythagorean"], Component: load("math", "triangle-solver") },
  { id: "compound-interest", title: "Compound Interest Calculator", category: "math", keywords: ["interest", "compound", "savings", "investment"], Component: load("math", "compound-interest") },
  { id: "bill-split", title: "Tip & Bill Split Calculator", category: "math", keywords: ["tip", "bill", "split", "restaurant"], Component: load("math", "bill-split") },
  { id: "loan-calculator", title: "Loan & EMI Calculator", khmerTitle: "គណនាកម្ចី និង EMI", addedOn: "2026-08-17T15:00:00+07:00", category: "math", keywords: ["loan", "emi", "mortgage", "interest", "repayment", "installment", "កម្ចី", "ប្រាក់កម្ចី", "ការប្រាក់"], Component: load("math", "loan-calculator") },
  { id: "fuel-cost-calculator", title: "Fuel Cost Calculator", khmerTitle: "គណនាថ្លៃប្រេងឥន្ធនៈ", addedOn: "2026-08-17T16:30:00+07:00", category: "math", keywords: ["fuel", "gas", "cost", "distance", "efficiency", "trip", "petrol", "ឥន្ធនៈ", "ប្រេង", "ចំណាយ"], Component: load("math", "fuel-cost-calculator") },
  { id: "latex-renderer", title: "LaTeX Formula Renderer", category: "math", keywords: ["latex", "katex", "formula", "equation", "ratex", "typeset"], Component: load("math", "latex-renderer") },
  { id: "math-symbols", title: "Math Symbol Dictionary", khmerTitle: "វចនានុក្រមសញ្ញាគណិតវិទ្យា", addedOn: "2026-08-21T12:00+07:00", category: "math", keywords: ["math symbols", "symbol", "latex", "unicode", "summation", "integral", "greek letters", "notation", "សញ្ញាគណិតវិទ្យា"], Component: load("math", "math-symbols") },
  { id: "formula-solver", title: "Formula Solver", khmerTitle: "ដោះស្រាយរូបមន្ត", addedOn: "2026-08-21T12:05+07:00", category: "math", keywords: ["formula", "solve", "area", "volume", "speed", "density", "ohms law", "pythagorean", "interest", "រូបមន្ត"], Component: load("math", "formula-solver") },
  { id: "permutation-combination", title: "Permutation & Combination Calculator", khmerTitle: "គណនាការរៀបលំដាប់ និងបន្សំ", addedOn: "2026-08-21T12:10+07:00", category: "math", keywords: ["permutation", "combination", "npr", "ncr", "factorial", "combinatorics", "choose"], Component: load("math", "permutation-combination") },
  { id: "complex-number", title: "Complex Number Calculator", khmerTitle: "គណនាចំនួនកុំផ្លិច", addedOn: "2026-08-21T12:15+07:00", category: "math", keywords: ["complex number", "imaginary", "a+bi", "modulus", "argument", "conjugate", "កុំផ្លិច"], Component: load("math", "complex-number") },
  { id: "geometry-calculator", title: "Geometry Area & Volume Calculator", khmerTitle: "គណនាផ្ទៃក្រឡា និងមាឌធរណីមាត្រ", addedOn: "2026-08-21T12:20+07:00", category: "math", keywords: ["area", "volume", "perimeter", "surface area", "circle", "sphere", "cylinder", "cone", "cube", "geometry"], Component: load("math", "geometry-calculator") },
  { id: "exponent-logarithm", title: "Exponent & Logarithm Solver", khmerTitle: "ដោះស្រាយស្វ័យគុណ និងលោការីត", addedOn: "2026-08-21T12:25+07:00", category: "math", keywords: ["exponent", "logarithm", "log", "power", "base", "e", "ln", "ស្វ័យគុណ", "លោការីត"], Component: load("math", "exponent-logarithm") },
  { id: "trig-values", title: "Trig Values Table", khmerTitle: "តារាងតម្លៃត្រីកោណមាត្រ", addedOn: "2026-08-21T12:30+07:00", category: "math", keywords: ["trig", "trigonometry", "sin", "cos", "tan", "unit circle", "radians", "degrees", "ត្រីកោណមាត្រ"], Component: load("math", "trig-values") },
  { id: "matrix-operations", title: "Matrix Operations Calculator", khmerTitle: "គណនាប្រតិបត្តិការម៉ាទ្រីស", addedOn: "2026-08-21T13:10+07:00", category: "math", keywords: ["matrix", "matrices", "add", "multiply", "inverse", "transpose", "determinant", "linear algebra", "ម៉ាទ្រីស"], Component: load("math", "matrix-operations") },
  { id: "vector-calculator", title: "Vector Calculator", khmerTitle: "ម៉ាស៊ីនគណនាវ៉ិចទ័រ", addedOn: "2026-08-21T14:00+07:00", category: "math", keywords: ["vector", "dot product", "cross product", "magnitude", "angle", "projection", "វ៉ិចទ័រ"], Component: load("math", "vector-calculator") },

  // ---- Network (13) ----
  { id: "cidr-calculator", title: "CIDR / Subnet Calculator", category: "network", keywords: ["cidr", "subnet", "netmask"], Component: load("network", "cidr-calculator") },
  { id: "ip-parser", title: "IPv4 Address Parser", category: "network", keywords: ["ip", "ipv4", "class"], Component: load("network", "ip-parser") },
  { id: "mac-address-formatter", title: "MAC Address Formatter", category: "network", keywords: ["mac address", "ethernet"], Component: load("network", "mac-address-formatter") },
  { id: "http-status-lookup", title: "HTTP Status Code Reference", category: "network", keywords: ["http", "status code", "404"], Component: load("network", "http-status-lookup") },
  { id: "user-agent-parser", title: "User-Agent String Parser", category: "network", keywords: ["user agent", "browser detect"], Component: load("network", "user-agent-parser") },
  { id: "url-parser", title: "URL Parser & Query String Inspector", category: "network", keywords: ["url", "query string", "params"], Component: load("network", "url-parser") },
  { id: "dns-record-reference", title: "DNS Record Type Reference", category: "network", keywords: ["dns", "mx", "cname", "txt"], Component: load("network", "dns-record-reference") },
  { id: "site-forensics", title: "Site Forensics", khmerTitle: "ស្រាវជ្រាវគេហទំព័រ", addedOn: "2026-08-24", category: "network", keywords: ["whois", "dns", "http", "headers", "domain", "rdap", "wayback", "inspect", "ស្រាវជ្រាវ", "ដូមេន"], Component: load("network", "site-forensics") },
  { id: "html-entity-encoder", title: "HTML Entity Encoder / Decoder", category: "network", keywords: ["html entities", "escape"], Component: load("network", "html-entity-encoder") },
  { id: "port-lookup", title: "Common Port Number Reference", category: "network", keywords: ["port", "tcp", "udp"], Component: load("network", "port-lookup") },
  { id: "mime-type-lookup", title: "MIME Type Lookup", category: "network", keywords: ["mime", "content type", "file extension"], Component: load("network", "mime-type-lookup") },
  { id: "slug-checker", title: "Domain / Slug Validity Checker", category: "network", keywords: ["slug", "domain", "validate"], Component: load("network", "slug-checker") },
  { id: "optical-transfer", title: "Decimen Optical Transfer", khmerTitle: "ដេស៊ីម៉ិន បញ្ជូនឯកសារតាមពន្លឺ", addedOn: "2026-08-03T10:30:00+07:00", category: "network", keywords: ["file transfer", "qr code", "optical", "camera", "airgap", "offline", "send", "receive", "light", "fountain code", "QR"], localProject: { author: "Evan Crawley (Bash Alarmist)", repository: "https://github.com/bashalarmistalt/decimen-optical-transfer", license: "AGPL-3.0-or-later", relationship: "inspired" }, Component: load("network", "optical-transfer") },
  { id: "webrtc-transfer", title: "WebRTC File Transfer", addedOn: "2026-08-03T10:40:00+07:00", category: "network", keywords: ["webrtc", "p2p", "peer to peer", "file transfer", "fast", "direct", "clipboard signaling", "local network"], Component: load("network", "webrtc-transfer") },
  { id: "ipv6-compressor", title: "IPv6 Address Compressor / Expander", category: "network", keywords: ["ipv6", "compress", "expand"], Component: load("network", "ipv6-compressor") },
  { id: "private-ip-generator", title: "Random Private IP Generator", category: "network", keywords: ["ip generator", "rfc1918", "test data"], Component: load("network", "private-ip-generator") },

  // ---- Security (13) ----
  { id: "password-generator", title: "Password Generator", category: "security", keywords: ["password", "generate"], Component: load("security", "password-generator") },
  { id: "password-strength", title: "Password Strength Estimator", category: "security", keywords: ["password strength", "entropy"], Component: load("security", "password-strength") },
  { id: "rot13-cipher", title: "ROT13 / Caesar Cipher", category: "security", keywords: ["rot13", "caesar cipher"], Component: load("security", "rot13-cipher") },
  { id: "base32-codec", title: "Base32 Encode / Decode", category: "security", keywords: ["base32", "totp"], Component: load("security", "base32-codec") },
  { id: "hex-dump", title: "Hex Dump Viewer", category: "security", keywords: ["hex dump", "bytes"], Component: load("security", "hex-dump") },
  { id: "random-pin", title: "Random PIN Generator", category: "security", keywords: ["pin", "random"], Component: load("security", "random-pin") },
  { id: "uuid-v5", title: "Namespace UUID (v5) Generator", category: "security", keywords: ["uuid v5", "deterministic"], Component: load("security", "uuid-v5") },
  { id: "jwt-encoder", title: "JWT Encoder (HS256)", category: "security", keywords: ["jwt", "sign", "hmac"], Component: load("security", "jwt-encoder") },
  { id: "luhn-validator", title: "Luhn Algorithm Card Validator", category: "security", keywords: ["luhn", "credit card", "checksum"], Component: load("security", "luhn-validator") },
  { id: "vigenere-cipher", title: "Vigenère Cipher", category: "security", keywords: ["vigenere", "cipher"], Component: load("security", "vigenere-cipher") },
  { id: "random-bytes", title: "Random Bytes / Key Generator", category: "security", keywords: ["random bytes", "key", "token"], Component: load("security", "random-bytes") },
  { id: "passphrase-generator", title: "Passphrase Generator", category: "security", keywords: ["passphrase", "diceware", "words"], Component: load("security", "passphrase-generator") },
  { id: "card-masker", title: "Credit Card Number Masker", category: "security", keywords: ["credit card", "mask", "pci"], Component: load("security", "card-masker") },
  { id: "auth-architecture-lab", title: "Auth Architecture Lab", addedOn: "2026-07-31", category: "security", keywords: ["auth", "authentication", "authorization", "passkeys", "webauthn", "biometric", "selfie", "liveness", "ekyc", "jwt", "oauth", "oidc", "saml", "hmac", "mtls", "api key", "bearer token", "session cookie", "trust boundary", "security architecture", "khmerscribe"], Component: load("security", "auth-architecture-lab") },

  // ---- Design (20) ----
  { id: "frame-studio", title: "Frame Studio", khmerTitle: "ស្ទូឌីយោស៊ុម", addedOn: "2026-07-30", category: "design", keywords: ["frame studio", "mockup", "device", "iphone mockup", "macbook mockup", "app store screenshot", "hardware", "presentation", "ស្ទូឌីយោស៊ុម"], Component: load("design", "frame-studio") },
  { id: "whiteboard", title: "Whiteboard", khmerTitle: "ផ្ទាំងគំនូរ", addedOn: "2026-07-29", category: "design", keywords: ["whiteboard", "draw", "sketch", "canvas", "png", "ផ្ទាំងគំនូរ"], Component: load("design", "whiteboard") },
  { id: "business-card-generator", title: "Business Card Generator", khmerTitle: "កម្មវិធីបង្កើតនាមប័ណ្ណ", addedOn: "2026-07-29", category: "design", keywords: ["business card", "name card", "contact", "svg", "នាមប័ណ្ណ"], Component: load("design", "business-card-generator") },
  { id: "chart-maker", title: "Chart Maker", khmerTitle: "កម្មវិធីបង្កើតក្រាហ្វ", addedOn: "2026-07-29", category: "design", keywords: ["chart", "bar", "line", "graph", "svg", "ក្រាហ្វ"], Component: load("design", "chart-maker") },
  { id: "diagram-editor", title: "Diagram & Structure Editor", khmerTitle: "កម្មវិធីកែសម្រួលដ្យាក្រាម និងរចនាសម្ព័ន្ធ", addedOn: "2026-07-29", category: "design", keywords: ["diagram", "nodes", "flow", "svg", "mind map", "organization chart", "org chart", "wbs", "work breakdown structure", "hierarchy", "ដ្យាក្រាម", "ផែនទីគំនិត", "តារាងអង្គការ", "រចនាសម្ព័ន្ធការងារ"], Component: load("design", "structured-diagram-editor") },
  { id: "favicon-generator", title: "Favicon Generator", category: "design", keywords: ["favicon", "icon", "apple touch icon", "pwa"], Component: load("design", "favicon-generator") },
  { id: "iconsmith", title: "Iconsmith", addedOn: "2026-07-31", category: "design", keywords: ["favicon", "pwa", "og image", "open graph", "icon pack", "maskable", "apple touch icon", "adaptive favicon", "iconsmith"], Component: load("design", "iconsmith") },
  { id: "og-image-generator", title: "Social Preview (OG) Image Generator", category: "design", keywords: ["og image", "open graph", "social preview", "twitter card"], Component: load("design", "og-image-generator") },
  { id: "social-post-generator", title: "Social Post Generator", khmerTitle: "បង្កើតប៉ុស្តិ៍បណ្ដាញសង្គម", addedOn: "2026-08-21T11:55+07:00", category: "design", keywords: ["social post", "social media", "x", "twitter", "facebook", "telegram", "instagram", "story", "post image", "quote card", "social graphic", "បង្កើតប៉ុស្តិ៍", "បណ្ដាញសង្គម"], Component: load("design", "social-post-generator") },
  { id: "color-palette-generator", title: "Color Palette Generator", category: "design", keywords: ["palette", "color scheme"], Component: load("design", "color-palette-generator") },
  { id: "contrast-checker", title: "WCAG Contrast Checker", category: "design", keywords: ["contrast", "accessibility", "wcag"], Component: load("design", "contrast-checker") },
  { id: "css-gradient-generator", title: "CSS Gradient Generator", category: "design", keywords: ["gradient", "css"], Component: load("design", "css-gradient-generator") },
  { id: "box-shadow-generator", title: "Box Shadow Generator", category: "design", keywords: ["box shadow", "css"], Component: load("design", "box-shadow-generator") },
  { id: "border-radius-previewer", title: "Border Radius Previewer", category: "design", keywords: ["border radius", "css"], Component: load("design", "border-radius-previewer") },
  { id: "css-unit-converter", title: "CSS Unit Converter", category: "design", keywords: ["px", "rem", "em"], Component: load("design", "css-unit-converter") },
  { id: "aspect-ratio-calculator", title: "Aspect Ratio Calculator", category: "design", keywords: ["aspect ratio", "resolution"], Component: load("design", "aspect-ratio-calculator") },
  { id: "spacing-scale-generator", title: "Spacing Scale Generator", category: "design", keywords: ["spacing", "scale", "design system"], Component: load("design", "spacing-scale-generator") },
  { id: "color-shades-generator", title: "Tints & Shades Generator", category: "design", keywords: ["tints", "shades", "color"], Component: load("design", "color-shades-generator") },
  { id: "css-clamp-calculator", title: "CSS clamp() Calculator", category: "design", keywords: ["clamp", "fluid typography"], Component: load("design", "css-clamp-calculator") },
  { id: "favicon-size-reference", title: "Favicon & App Icon Size Reference", category: "design", keywords: ["favicon", "app icon", "sizes"], Component: load("design", "favicon-size-reference") },
  { id: "golden-ratio-calculator", title: "Golden Ratio Calculator", category: "design", keywords: ["golden ratio", "phi", "proportion"], Component: load("design", "golden-ratio-calculator") },
  { id: "color-name-finder", title: "Nearest CSS Color Name Finder", category: "design", keywords: ["color name", "css colors", "nearest"], Component: load("design", "color-name-finder") },
  { id: "vector-drawable-to-svg", title: "VectorDrawable → SVG", category: "design", keywords: ["android", "vector drawable", "svg", "icon convert"], Component: load("design", "vector-drawable-to-svg") },
  { id: "color-mixer", title: "Color Mixer", khmerTitle: "លាយពណ៌", addedOn: "2026-08-17T17:15:00+07:00", category: "design", keywords: ["color mix", "blend", "gradient", "mix colors", "blend colors", "ពណ៌", "លាយ"], Component: load("design", "color-mixer") },
  { id: "type-scale", title: "Typographic Scale Generator", khmerTitle: "បង្កើតមាត្រដ្ឋានអក្សរ", addedOn: "2026-08-17T19:10:00+07:00", category: "design", keywords: ["type scale", "typography", "font size", "modular scale", "rem", "css", "design system"], Component: load("design", "type-scale") },
  { id: "screen-ruler", title: "On-Screen Ruler", khmerTitle: "បន្ទាត់លើអេក្រង់", addedOn: "2026-08-17T19:15:00+07:00", category: "design", keywords: ["ruler", "measure", "dpi", "pixels", "cm", "inch", "screen", "បន្ទាត់"], Component: load("design", "screen-ruler") },
  { id: "color-harmony", title: "Color Harmony Generator", khmerTitle: "បង្កើតពណ៌ដែលចុះសម្រុងគ្នា", addedOn: "2026-08-17T16:40:00+07:00", category: "design", keywords: ["color harmony", "complementary", "analogous", "triadic", "palette", "color scheme", "ពណ៌", "ចុះសម្រុង"], Component: load("design", "color-harmony") },
  { id: "color-blindness-simulator", title: "Color Blindness Simulator", khmerTitle: "កម្មវិធីក្លែងធ្វើភាពពិការពណ៌", addedOn: "2026-08-17T15:15:00+07:00", category: "design", keywords: ["color blindness", "protanopia", "deuteranopia", "tritanopia", "accessibility", "cvd", "simulation", "ពិការពណ៌", "ភាពពិការពណ៌"], Component: load("design", "color-blindness-simulator") },

  // ---- Time & Date (14) ----
  { id: "daily-feng-shui-calendar", title: "Daily Feng Shui Calendar", khmerTitle: "ប្រតិទិនហុងស៊ុយប្រចាំថ្ងៃ", addedOn: "2026-07-29", category: "time", keywords: ["feng shui", "calendar", "cultural reference", "daily planning", "ហុងស៊ុយ"], Component: load("time", "daily-feng-shui-calendar") },
  { id: "age-calculator", title: "Age Calculator", category: "time", keywords: ["age", "birthday"], Component: load("time", "age-calculator") },
  { id: "age-in-words", title: "Age in Words", khmerTitle: "អាយុជាពាក្យ", addedOn: "2026-08-17T16:45:00+07:00", category: "time", keywords: ["age", "years months days", "birthday countdown", "total days", "weeks", "អាយុ", "ថ្ងៃកំណើត"], Component: load("time", "age-in-words") },
  { id: "date-difference-calculator", title: "Date Difference Calculator", category: "time", keywords: ["days between", "date diff"], Component: load("time", "date-difference-calculator") },
  { id: "document-expiry-reminder", title: "Document Expiry Reminder", khmerTitle: "រំលឹកផុតកំណត់ឯកសារ", addedOn: "2026-08-25", category: "time", keywords: ["passport", "expiry", "validity", "6-month rule", "visa", "reminder", "ផុតកំណត់", "លិខិតឆ្លងដែន"], Component: load("time", "document-expiry-reminder") },
  { id: "school-year-planner", title: "Cambodia School-Year Planner", khmerTitle: "ផែនការឆ្នាំសិក្សា", addedOn: "2026-08-25", category: "time", keywords: ["school year", "semester", "term", "break", "cambodia", "education", "ឆ្នាំសិក្សា", "ឆមាស"], Component: load("time", "school-year-planner") },
  { id: "countdown-timer", title: "Countdown Timer", category: "time", keywords: ["countdown", "timer"], Component: load("time", "countdown-timer") },
  { id: "timezone-converter", title: "Timezone Converter", category: "time", keywords: ["timezone", "utc", "convert time"], Component: load("time", "timezone-converter") },
  { id: "week-number-calculator", title: "ISO Week Number Calculator", category: "time", keywords: ["week number", "iso week"], Component: load("time", "week-number-calculator") },
  { id: "workdays-calculator", title: "Business Days Calculator", category: "time", keywords: ["business days", "weekdays"], Component: load("time", "workdays-calculator") },
  { id: "stopwatch", title: "Stopwatch", category: "time", keywords: ["stopwatch", "timer", "laps"], Component: load("time", "stopwatch") },
  { id: "pomodoro-timer", title: "Pomodoro Timer", category: "time", keywords: ["pomodoro", "focus timer"], Component: load("time", "pomodoro-timer") },
  { id: "relative-time-formatter", title: "Relative Time (\"Time Ago\") Formatter", category: "time", keywords: ["time ago", "relative time"], Component: load("time", "relative-time-formatter") },
  { id: "calendar-month-generator", title: "Calendar Month Generator", category: "time", keywords: ["calendar", "month grid"], Component: load("time", "calendar-month-generator") },
  { id: "moon-phase-calculator", title: "Moon Phase Calculator", category: "time", keywords: ["moon phase", "lunar"], Component: load("time", "moon-phase-calculator") },
  { id: "duration-calculator", title: "Duration Adder / Subtractor", category: "time", keywords: ["duration", "add time", "timesheet"], Component: load("time", "duration-calculator") },
  { id: "shift-duration", title: "Shift Duration Calculator", category: "time", keywords: ["shift", "overnight", "work hours"], Component: load("time", "shift-duration") },
  { id: "world-clock", title: "World Clock", khmerTitle: "នាឡិកាពិភពលោក", addedOn: "2026-08-17T14:30:00+07:00", category: "time", keywords: ["world clock", "timezone", "cities", "live time", "utc", "international", "clock", "នាឡិកា", "ពិភពលោក", "ម៉ោង"], Component: load("time", "world-clock") },
  { id: "leap-year-checker", title: "Leap Year Checker", khmerTitle: "ពិនិត្យឆ្នាំបង្គ្រប់", addedOn: "2026-08-17T14:35:00+07:00", category: "time", keywords: ["leap year", "calendar", "year", "february", "ឆ្នាំបង្គ្រប់", "ឆ្នាំ"], Component: load("time", "leap-year-checker") },

  // ---- Documents (8) ----
  { id: "currency-to-words", title: "Currency Amount to Words", category: "office", keywords: ["cheque", "invoice", "amount", "spell out"], Component: load("office", "currency-to-words") },
  { id: "document-number-generator", title: "Document / Invoice Number Generator", category: "office", keywords: ["invoice number", "reference number", "sequence"], Component: load("office", "document-number-generator") },
  { id: "pdf-info", title: "PDF Info & Preview", category: "office", keywords: ["pdf", "page count", "metadata", "thumbnail"], Component: load("office", "pdf-info") },
  { id: "pdf-merge", title: "PDF Merge", category: "office", keywords: ["pdf", "merge", "combine", "join"], Component: load("office", "pdf-merge") },
  { id: "pdf-organizer", title: "PDF Page Organizer", category: "office", keywords: ["pdf", "reorder", "rotate", "delete page", "split", "extract"], Component: load("office", "pdf-organizer") },
  { id: "file-compressor", title: "File Compressor", category: "office", keywords: ["compress", "pdf", "image", "shrink", "reduce size", "sralify", "zip", "batch"], localProject: { author: "im4tta · Sralify", repository: "https://github.com/im4tta/Sralify", license: "MIT" }, Component: load("office", "file-compressor") },
  { id: "pdf-watermark", title: "PDF Watermark", category: "office", keywords: ["pdf", "watermark", "stamp", "confidential"], Component: load("office", "pdf-watermark") },
  { id: "images-to-pdf", title: "Images → PDF", category: "office", keywords: ["image", "jpg", "png", "pdf", "convert"], Component: load("office", "images-to-pdf") },
  { id: "pdf-to-images", title: "PDF → Images", category: "office", keywords: ["pdf", "png", "jpg", "export", "render"], Component: load("office", "pdf-to-images") },

  // ---- Office (19) ----
  { id: "rfa-generator", title: "Request for Approval (RFA)", khmerTitle: "សំណើសុំការអនុម័ត (RFA)", addedOn: "2026-07-29", category: "office", keywords: ["rfa", "request for approval", "construction", "submittal", "contractor"], Component: load("office", "rfa-generator") },
  { id: "business-calculators", title: "Business Calculators", khmerTitle: "ម៉ាស៊ីនគណនាអាជីវកម្ម", addedOn: "2026-07-29", category: "office", keywords: ["loan", "amortization", "vat", "discount", "date add", "salary tax", "nssf", "ប្រាក់កម្ចី", "ពន្ធ", "បសស"], Component: load("office", "business-calculators") },
  { id: "vat-calculator", title: "VAT Calculator", khmerTitle: "គណនាអាករលើតម្លៃបន្ថែម", addedOn: "2026-08-17T22:55:00+07:00", category: "office", keywords: ["vat", "tax", "gst", "cambodia 10%", "sales tax", "net", "gross", "អាករ"], Component: load("office", "vat-calculator") },
  { id: "flat-vs-declining", title: "Flat vs Declining Interest", khmerTitle: "ការប្រៀបធៀបអត្រាការប្រាក់ស្មើ និងថយចុះ", addedOn: "2026-08-17T23:00:00+07:00", category: "office", keywords: ["flat rate", "declining balance", "loan interest", "microfinance", "cambodia", "ការប្រាក់", "កម្ចី"], Component: load("office", "flat-vs-declining") },
  { id: "invoice-generator", title: "Invoice Generator", khmerTitle: "បង្កើតវិក្កយបត្រ", addedOn: "2026-08-17T23:05:00+07:00", category: "office", keywords: ["invoice", "bill", "receipt", "vat", "print", "pdf", "client", "វិក្កយបត្រ"], Component: load("office", "invoice-generator") },
  { id: "salary-hourly", title: "Hourly ↔ Annual Salary Converter", khmerTitle: "បម្លែងប្រាក់ខែ", addedOn: "2026-08-17T23:10:00+07:00", category: "office", keywords: ["salary", "hourly", "annual", "wage", "pay", "convert", "ប្រាក់ខែ"], Component: load("office", "salary-hourly") },
  { id: "calculation-notebook", title: "Calculation Notebook", khmerTitle: "សៀវភៅកត់ត្រាការគណនា", addedOn: "2026-08-06T10:30:00+07:00", category: "office", keywords: ["calculation notebook", "live calculation", "project", "estimate", "construction", "paint", "quantity takeoff", "dependencies", "សៀវភៅគណនា"], Component: load("office", "calculation-notebook") },
  { id: "bid-timeline-calculator", title: "Bid Timeline Calculator", khmerTitle: "ម៉ាស៊ីនគណនាកាលវិភាគដេញថ្លៃ", addedOn: "2026-07-31", category: "office", keywords: ["bid", "tender", "ifb", "pre-bid", "submission deadline", "bid validity", "bid security"], Component: load("office", "bid-timeline-calculator") },
  { id: "retention-ld-tracker", title: "Retention & Liquidated Damages Tracker", khmerTitle: "តាមដានប្រាក់តម្កល់ទុក និងសំណងការយឺតយ៉ាវ", addedOn: "2026-07-31", category: "office", keywords: ["retention", "liquidated damages", "ld", "delay", "withholding", "dlp", "construction"], Component: load("office", "retention-ld-tracker") },
  { id: "ipc-proportion", title: "IPC Proportion Calculator", addedOn: "2026-08-03T10:35:00+07:00", category: "office", keywords: ["ipc", "interim payment", "proportion", "split", "percentage", "allocation", "construction", "payment", "certificate"], Component: load("office", "ipc-proportion-calculator") },
  { id: "edc-electricity-calculator", title: "EDC Electricity Calculator", khmerTitle: "គណនាថ្លៃអគ្គិសនី EDC កម្ពុជា", addedOn: "2026-07-31", category: "office", keywords: ["edc", "electricity", "electric bill", "kwh", "tariff", "tier", "utility", "cambodia", "khr", "riel", "អគ្គិសនី", "វិក្កយបត្រ", "ថ្លៃភ្លើង"], Component: load("office", "edc-electricity-calculator") },
  { id: "staff-directory", title: "Staff Directory", khmerTitle: "បញ្ជីបុគ្គលិក", addedOn: "2026-07-29", category: "office", keywords: ["staff", "employee", "directory", "department", "csv", "បុគ្គលិក"], Component: load("office", "staff-directory") },
  { id: "qr-decoder", title: "QR Code Decoder", khmerTitle: "អានកូដ QR", category: "office", keywords: ["qr code", "scan", "decode", "paste", "clipboard", "ctrl+v", "link", "url", "phone", "email", "address", "អានកូដ", "ស្កេន"], Component: load("office", "qr-decoder") },
  { id: "qr-generator", title: "QR Code Generator", category: "office", keywords: ["qr", "code", "barcode"], Component: load("office", "qr-generator") },
  { id: "expense-tracker", title: "Expense Tracker", category: "office", keywords: ["expenses", "budget", "mint", "spending", "money log"], Component: load("office", "expense-tracker") },
  { id: "task-manager", title: "Task Manager", khmerTitle: "កម្មវិធីគ្រប់គ្រងកិច្ចការ", addedOn: "2026-07-29", category: "office", keywords: ["task", "todo", "deadline", "priority", "កិច្ចការ"], Component: load("office", "task-manager") },
  { id: "time-tracker", title: "Time Tracker", khmerTitle: "កម្មវិធីតាមដានពេលវេលា", addedOn: "2026-07-29", category: "office", keywords: ["time", "tracker", "work log", "timesheet", "ពេលវេលា"], Component: load("office", "time-tracker") },
  { id: "sticky-notes", title: "Sticky Notes", khmerTitle: "កំណត់ត្រារហ័ស", addedOn: "2026-07-29", category: "office", keywords: ["notes", "sticky", "reminder", "memo", "កំណត់ត្រា"], Component: load("office", "sticky-notes") },
  { id: "clipboard-manager", title: "Clipboard Manager", khmerTitle: "ក្ដារចម្លង", addedOn: "2026-08-24", category: "office", keywords: ["clipboard", "paste", "history", "khmer", "copy", "pin", "ក្ដារចម្លង", "បិទភ្ជាប់"], Component: load("office", "clipboard-manager") },
  { id: "email-signature-generator", title: "Email Signature Generator", khmerTitle: "កម្មវិធីបង្កើតហត្ថលេខាអ៊ីមែល", addedOn: "2026-07-29", category: "office", keywords: ["email", "signature", "html", "contact", "ហត្ថលេខាអ៊ីមែល"], Component: load("office", "email-signature-generator") },
  { id: "cambodia-public-holidays", title: "Cambodia Public Holidays", khmerTitle: "ថ្ងៃឈប់សម្រាកសាធារណៈកម្ពុជា", addedOn: "2026-07-29", category: "office", keywords: ["cambodia", "holiday", "calendar", "public holiday", "ថ្ងៃឈប់សម្រាក"], Component: load("office", "cambodia-public-holidays") },
  { id: "water-bill-calculator", title: "Phnom Penh Water Bill Calculator", khmerTitle: "គណនាវិក្កយបត្រទឹកភ្នំពេញ", addedOn: "2026-08-25", category: "office", keywords: ["water bill", "ppwsa", "tariff", "cubic meter", "utility", "phnom penh", "water", "វិក្កយបត្រទឹក", "ទឹក"], Component: load("office", "water-bill-calculator") },
  { id: "nssf-payroll-calculator", title: "NSSF Payroll Calculator", khmerTitle: "គណនាការរួមចំណែក NSSF", addedOn: "2026-08-25", category: "office", keywords: ["nssf", "social security", "payroll", "employer", "employee", "contribution", "cambodia", "pension", "មូលនិធិសន្តិសុខសង្គម"], Component: load("office", "nssf-payroll-calculator") },
  { id: "insurance-premium-estimator", title: "Health Insurance Premium Estimator", khmerTitle: "ប៉ាន់ស្មានបុព្វលាភធានារ៉ាប់រងសុខភាព", addedOn: "2026-08-25", category: "office", keywords: ["health insurance", "premium", "estimate", "coverage", "age", "cambodia", "ធានារ៉ាប់រងសុខភាព"], Component: load("office", "insurance-premium-estimator") },
  { id: "grade-calculator", title: "Grade Calculator", khmerTitle: "គណនាពិន្ទុមធ្យម", addedOn: "2026-08-17T19:55:00+07:00", category: "knowledge", keywords: ["grade", "gpa", "weighted average", "student", "score", "calculator", "ពិន្ទុ", "ថ្នាក់"], Component: load("knowledge", "grade-calculator") },
  { id: "habit-tracker", title: "Habit Tracker", khmerTitle: "តាមដានទម្លាប់", addedOn: "2026-08-17T20:00:00+07:00", category: "knowledge", keywords: ["habit", "tracker", "daily", "routine", "streak", "ទម្លាប់"], Component: load("knowledge", "habit-tracker") },
  { id: "paper-size", title: "Paper Size Reference", khmerTitle: "ទំហំក្រដាសស្ដង់ដារ", addedOn: "2026-08-17T20:05:00+07:00", category: "knowledge", keywords: ["paper size", "a4", "iso", "print", "margin", "dpi", "ក្រដាស", "បោះពុម្ព"], Component: load("knowledge", "paper-size") },
  { id: "markdown-cheatsheet", title: "Markdown Cheat Sheet", khmerTitle: "សន្លឹកយោង Markdown", addedOn: "2026-08-17T22:50:00+07:00", category: "knowledge", keywords: ["markdown", "cheat sheet", "reference", "syntax", "md", "formatting"], Component: load("knowledge", "markdown-cheatsheet") },
  { id: "attendance-sheet", title: "Attendance Sheet", khmerTitle: "បញ្ជីវត្តមាន", addedOn: "2026-07-29", category: "office", keywords: ["attendance", "timesheet", "staff", "check in", "check out", "វត្តមាន"], Component: load("office", "attendance-sheet") },
  { id: "meeting-agenda-minutes", title: "Meeting Agenda & Minutes", khmerTitle: "របៀបវារៈ និងកំណត់ហេតុប្រជុំ", addedOn: "2026-07-29", category: "office", keywords: ["meeting", "agenda", "minutes", "decisions", "action items", "ប្រជុំ"], Component: load("office", "meeting-agenda-minutes") },
  { id: "team-generator", title: "Team Generator", khmerTitle: "កម្មវិធីបែងចែកក្រុម", addedOn: "2026-07-29", category: "office", keywords: ["team", "group", "random", "shuffle", "ក្រុម"], Component: load("office", "team-generator") },
  { id: "signature-pad", title: "Signature Pad", khmerTitle: "ផ្ទាំងហត្ថលេខា", addedOn: "2026-07-29", category: "office", keywords: ["signature", "sign", "draw", "png", "ហត្ថលេខា"], Component: load("office", "signature-pad") },
  { id: "asset-register", title: "Asset Register", khmerTitle: "បញ្ជីសម្ភារៈ", addedOn: "2026-07-29", category: "office", keywords: ["asset", "inventory", "equipment", "register", "សម្ភារៈ"], Component: load("office", "asset-register") },
  { id: "nid-card-print-formatter", title: "NID Card Print Formatter", khmerTitle: "រៀបចំអត្តសញ្ញាណប័ណ្ណសម្រាប់បោះពុម្ព", addedOn: "2026-08-12T10:00:00+07:00", category: "office", keywords: ["national id", "nid", "id card", "print layout", "a4", "crop", "document scanner", "photo", "front back", "identity", "អត្តសញ្ញាណប័ណ្ណ", "កាត", "បោះពុម្ព"], Component: load("office", "nid-card-print-formatter") },
  { id: "barcode-generator", title: "Barcode Generator", khmerTitle: "បង្កើតកូដបារកូដ", addedOn: "2026-08-21T14:05+07:00", category: "office", keywords: ["barcode", "ean", "upc", "code128", "code39", "svg", "retail", "inventory", "បារកូដ"], Component: load("office", "barcode-generator") },
  { id: "inflation-calculator", title: "Inflation Calculator", khmerTitle: "គណនាអតិផរណា", addedOn: "2026-08-21T14:10+07:00", category: "office", keywords: ["inflation", "purchasing power", "cpi", "price", "money", "economy", "អតិផរណា"], Component: load("office", "inflation-calculator") },
  { id: "excel-password-remover", title: "Excel Password Remover", khmerTitle: "ឧបករណ៍ដកពាក្យសម្ងាត់ Excel", addedOn: "2026-08-21T15:30+07:00", category: "office", keywords: ["excel", "password", "unprotect", "remove protection", "sheet protection", "workbook protection", "xlsx", "xlsm", "unlock", "ពាក្យសម្ងាត់"], Component: load("office", "excel-password-remover") },
  { id: "webcam-mic-test", title: "Webcam & Microphone Test", khmerTitle: "ពិសោធន៍កាមេរ៉ា និងមីក្រូហ្វូន", addedOn: "2026-08-21T16:00+07:00", category: "video", keywords: ["webcam", "camera", "microphone", "mic test", "device test", "level meter", "កាមេរ៉ា", "មីក្រូហ្វូន"], Component: load("video", "webcam-mic-test") },
  { id: "screen-recorder", title: "Screen Recorder", khmerTitle: "ការថតអេក្រង់", addedOn: "2026-08-21T16:05+07:00", category: "video", keywords: ["screen recorder", "record screen", "webm", "capture", "screencast", "ថតអេក្រង់"], Component: load("video", "screen-recorder") },
  { id: "screen-color-picker", title: "Screen Color Picker", khmerTitle: "កម្មវិធីជ្រើសរើសពណ៌អេក្រង់", addedOn: "2026-08-21T16:10+07:00", category: "design", keywords: ["color picker", "eyedropper", "pick color", "hex", "rgb", "hsl", "ជ្រើសពណ៌"], Component: load("design", "screen-color-picker") },
  { id: "periodic-table", title: "Periodic Table & Molar Mass", khmerTitle: "តារាងខួប និងម៉ាសម៉ូលា", addedOn: "2026-08-21T16:15+07:00", category: "science", keywords: ["periodic table", "elements", "chemistry", "molar mass", "formula", "atomic", "តារាងខួប", "គីមី"], Component: load("science", "periodic-table") },
  { id: "word-cloud", title: "Word Cloud Generator", khmerTitle: "បង្កើតពពកពាក្យ", addedOn: "2026-08-21T16:20+07:00", category: "fun", keywords: ["word cloud", "tag cloud", "text visualization", "frequency", "ពពកពាក្យ"], Component: load("fun", "word-cloud") },
  { id: "braille-translator", title: "Braille Translator", khmerTitle: "កម្មវិធីបកប្រែអក្សរប្រៃយ៍", addedOn: "2026-08-21T16:25+07:00", category: "text", keywords: ["braille", "accessibility", "unicode braille", "grade 1", "blind", "អក្សរប្រៃយ៍"], Component: load("text", "braille-translator") },
  { id: "script-analyzer", title: "Script & Homoglyph Analyzer", khmerTitle: "វិភាគអក្សរ និងអក្សរស្រដៀងគ្នា", addedOn: "2026-08-24T22:00:00+07:00", category: "text", keywords: ["homoglyph", "mixed script", "unicode inspector", "phishing", "confusable", "invisible characters", "zero-width", "spoofing", "អក្សរក្លែងក្លាយ"], Component: load("text", "script-analyzer") },
  { id: "dns-lookup", title: "Live DNS Lookup", khmerTitle: "ស្វែងរក DNS ផ្ទាល់", addedOn: "2026-08-21T17:00+07:00", category: "network", keywords: ["dns", "lookup", "a record", "mx", "txt", "ns", "cname", "soa", "dns over https", "domain"], Component: load("network", "dns-lookup") },
  { id: "whats-my-ip", title: "What's My IP", khmerTitle: "លេខ IP របស់ខ្ញុំ", addedOn: "2026-08-21T17:05+07:00", category: "network", keywords: ["my ip", "public ip", "ip address", "isp", "geo ip", "what is my ip"], Component: load("network", "whats-my-ip") },
  { id: "http-request-tester", title: "HTTP Request Tester", khmerTitle: "ឧបករណ៍សាកល្បងសំណើ HTTP", addedOn: "2026-08-21T17:10+07:00", category: "dev", keywords: ["http", "rest client", "api test", "request", "get post put delete", "fetch", "cors"], Component: load("dev", "http-request-tester") },
  { id: "hmac-generator", title: "HMAC Generator", khmerTitle: "បង្កើត HMAC", addedOn: "2026-08-21T17:15+07:00", category: "security", keywords: ["hmac", "signature", "sha256", "sha512", "web crypto", "api key signing"], Component: load("security", "hmac-generator") },
  { id: "text-to-speech", title: "Text to Speech", khmerTitle: "អត្ថបទទៅជាសំឡេង", addedOn: "2026-08-21T17:20+07:00", category: "audio", keywords: ["text to speech", "tts", "speak", "voice", "speech synthesis", "read aloud", "សំឡេង"], Component: load("audio", "text-to-speech") },
  { id: "images-to-gif", title: "Images to Animated GIF", khmerTitle: "រូបភាពទៅជា GIF មានចលនា", addedOn: "2026-08-21T17:25+07:00", category: "images", keywords: ["gif", "animated gif", "frames", "image sequence", "animation", "បង្កើត gif"], Component: load("images", "images-to-gif") },
  { id: "meme-generator", title: "Meme Generator", khmerTitle: "បង្កើតមីម", addedOn: "2026-08-21T17:30+07:00", category: "fun", keywords: ["meme", "caption", "impact font", "image macro", "funny", "មីម"], Component: load("fun", "meme-generator") },
  { id: "file-checksum", title: "File Checksum Verifier", khmerTitle: "ពិនិត្យកូដផ្ទៀងផ្ទាត់ឯកសារ", addedOn: "2026-08-21T17:40+07:00", category: "security", keywords: ["checksum", "sha256", "hash file", "verify download", "integrity", "ផ្ទៀងផ្ទាត់"], Component: load("security", "file-checksum") },
  { id: "speed-test", title: "Internet Speed Test", khmerTitle: "តេស្តល្បឿនអ៊ីនធឺណិត", addedOn: "2026-08-21T17:45+07:00", category: "network", keywords: ["speed test", "bandwidth", "ping", "jitter", "download upload", "cloudflare", "ល្បឿនអ៊ីនធឺណិត"], Component: load("network", "speed-test") },
  { id: "qr-batch", title: "QR Batch Generator", khmerTitle: "បង្កើត QR ជាបាច់", addedOn: "2026-08-21T17:50+07:00", category: "office", keywords: ["qr batch", "bulk qr", "qr codes zip", "svg", "asset tags", "inventory", "បង្កើត QR"], Component: load("office", "qr-batch") },
  { id: "curl-converter", title: "cURL → Code Converter", khmerTitle: "បម្លែង cURL ទៅជាកូដ", addedOn: "2026-08-21T17:55+07:00", category: "dev", keywords: ["curl", "fetch", "axios", "requests", "go http", "convert", "api"], Component: load("dev", "curl-converter") },
  { id: "markdown-toc", title: "Markdown TOC Generator", khmerTitle: "បង្កើតតារាងមាតិកា Markdown", addedOn: "2026-08-21T18:05+07:00", category: "dev", keywords: ["markdown", "table of contents", "toc", "anchors", "github slug", "docs"], Component: load("dev", "markdown-toc") },
  { id: "magic-byte-checker", title: "File Magic-Byte Checker", khmerTitle: "ពិនិត្យប្រភេទឯកសារ", addedOn: "2026-08-25", category: "dev", keywords: ["magic bytes", "file type", "signature", "hex", "png", "pdf", "zip", "docx", "identifier", "ពិនិត្យឯកសារ"], Component: load("dev", "magic-byte-checker") },
  { id: "voice-dictation", title: "Voice Dictation", khmerTitle: "សរសេរដោយសំឡេង", addedOn: "2026-08-21T18:10+07:00", category: "audio", keywords: ["dictation", "speech to text", "voice typing", "microphone", "khmer speech", "សរសេរដោយសំឡេង"], Component: load("audio", "voice-dictation") },
  { id: "savings-goal", title: "Savings Goal Calculator", khmerTitle: "គណនាគោលដៅសន្សំ", addedOn: "2026-08-21T18:15+07:00", category: "math", keywords: ["savings goal", "deposit", "compound", "target", "months to save", "គោលដៅសន្សំ"], Component: load("math", "savings-goal") },
  { id: "meta-tag-generator", title: "Meta Tag Generator", khmerTitle: "បង្កើតសញ្ញាសម្គាល់ Meta", addedOn: "2026-08-21T18:00+07:00", category: "design", keywords: ["meta tags", "seo", "open graph", "twitter card", "head snippet", "social preview"], Component: load("design", "meta-tag-generator") },
  { id: "pregnancy-due-date", title: "Pregnancy Due Date Calculator", khmerTitle: "គណនាថ្ងៃសម្រាល", addedOn: "2026-08-21T18:20+07:00", category: "family", keywords: ["pregnancy", "due date", "naegele", "trimester", "gestational", "ថ្ងៃសម្រាល"], Component: load("family", "pregnancy-due-date") },
  { id: "debt-settle-up", title: "Debt Settle-Up Splitter", khmerTitle: "ការចែកចាយ និងបញ្ចុះបញ្ចូលបំណុល", addedOn: "2026-08-21T18:25+07:00", category: "math", keywords: ["split expenses", "settle up", "who owes whom", "trip costs", "transfers", "ចែកចំណាយ"], Component: load("math", "debt-settle-up") },
  { id: "khmer-studio", title: "Khmer Studio", khmerTitle: "ស្ទូឌីយោខ្មែរ", addedOn: "2026-08-21T19:00+07:00", category: "khmer", keywords: ["khmer studio", "poster", "crossword", "exam", "pdf", "kantumruy", "moul", "bokor", "noto sans khmer", "noto serif khmer", "variable font", "print", "worksheet", "happypdf", "shaping", "ស្ទូឌីយោខ្មែរ", "បោះពុម្ព"], Component: load("khmer", "khmer-studio") },
  { id: "khmer-practice-sheets", title: "Khmer Practice Sheets", khmerTitle: "សន្លឹកអនុវត្តសរសេរអក្សរខ្មែរ", addedOn: "2026-08-24T20:00+07:00", category: "khmer", keywords: ["handwriting", "practice", "tracing", "worksheet", "khmer letters", "consonants", "teacher", "សន្លឹកអនុវត្ត"], Component: load("khmer", "khmer-practice-sheets") },
  { id: "certificate-generator", title: "Certificate Generator", khmerTitle: "បង្កើតលិខិតសម្គាល់", addedOn: "2026-08-24T20:05+07:00", category: "office", keywords: ["certificate", "diploma", "award", "recognition", "batch names", "border", "លិខិតសម្គាល់"], Component: load("office", "certificate-generator") },
  { id: "envelope-printer", title: "Envelope & Label Printer", khmerTitle: "បោះពុម្ពសំបុត្រ និងស្លាក", addedOn: "2026-08-24T20:10+07:00", category: "office", keywords: ["envelope", "label sheet", "mailing", "addresses", "dl", "c6", "avery", "សំបុត្រ"], Component: load("office", "envelope-printer") },
  { id: "event-ticket-sheet", title: "Event Ticket Sheet", khmerTitle: "សន្លឹកសំបុត្រព្រឹត្តិការណ៍", addedOn: "2026-08-24T20:15+07:00", category: "office", keywords: ["ticket", "event ticket", "numbered", "tear line", "qr ticket", "admit one", "សំបុត្រ"], Component: load("office", "event-ticket-sheet") },

  // ---- Images (8) ----
  { id: "document-scanner", title: "Document Scanner", khmerTitle: "ម៉ាស៊ីនស្កេនឯកសារ", addedOn: "2026-07-29", category: "images", keywords: ["document", "scanner", "camera", "capture", "grayscale", "ឯកសារ", "ស្កេន"], Component: load("images", "document-scanner") },
  { id: "image-optimizer", title: "Image Resizer & Compressor", category: "images", keywords: ["compress", "resize", "convert", "webp", "jpeg"], Component: load("images", "image-optimizer") },
  { id: "image-editor", title: "Image Editor", category: "images", keywords: ["crop", "rotate", "flip", "filters", "brightness", "contrast"], Component: load("images", "image-editor") },
  { id: "background-remover", title: "Background Remover", category: "images", keywords: ["remove bg", "background", "cutout", "transparent", "ai"], Component: load("images", "background-remover") },
  { id: "image-upscaler", title: "Image Upscaler", category: "images", keywords: ["upscale", "enlarge", "resolution", "sharpen"], Component: load("images", "image-upscaler") },
  { id: "image-watermark", title: "Image Watermark", category: "images", keywords: ["watermark", "copyright", "stamp", "brand"], Component: load("images", "image-watermark") },
  { id: "screenshot-ocr", title: "Khmer OCR", khmerTitle: "អានអក្សរខ្មែរពីរូបភាព", addedOn: "2026-08-25", category: "images", keywords: ["ocr", "khmer", "text recognition", "extract", "document", "អានអត្ថបទ", "អក្សរខ្មែរ"], localProject: { author: "Seanghay Yath", repository: "https://github.com/seanghay/KhmerOCR", license: "MIT", relationship: "integrated" }, Component: load("images", "screenshot-ocr") },
  { id: "object-counter", title: "Object Count Estimator", khmerTitle: "ប៉ាន់ស្មានចំនួនវត្ថុ", addedOn: "2026-08-26", category: "images", keywords: ["object", "count", "detect", "people", "pills", "plant", "vehicle", "yolo", "vision", "រាប់វត្ថុ", "រកឃើញវត្ថុ"], localProject: { author: "hustvl (YOLOS) via Xenova", repository: "https://huggingface.co/Xenova/yolos-tiny", license: "Apache-2.0", relationship: "integrated" }, Component: load("images", "object-counter") },
  { id: "lsb-steganography", title: "Invisible Text Steganography", khmerTitle: "លាក់អត្ថបទក្នុងរូបភាព", addedOn: "2026-08-24", category: "images", keywords: ["steganography", "lsb", "hidden", "secret", "image", "encode", "លាក់", "អត្ថបទ"], Component: load("images", "lsb-steganography") },
  { id: "logo-remover", title: "Logo / Watermark Remover", category: "images", keywords: ["remove logo", "remove watermark", "gemini", "inpaint", "content aware fill", "clean"], Component: load("images", "logo-remover") },
  { id: "image-exif", title: "Image Metadata (EXIF) Viewer & Stripper", category: "images", keywords: ["exif", "metadata", "gps", "privacy", "strip"], Component: load("images", "image-exif") },
  { id: "image-to-base64", title: "Image ⇄ Base64 Converter", category: "images", keywords: ["base64", "data url", "image"], Component: load("images", "image-to-base64") },
  { id: "image-to-ascii", title: "Image → ASCII Art", khmerTitle: "បម្លែងរូបទៅជាសិល្បៈ ASCII", addedOn: "2026-08-17T21:55:00+07:00", category: "images", keywords: ["ascii art", "image", "convert", "text art", "banner", "terminal", "សិល្បៈ"], Component: load("images", "image-to-ascii") },
  { id: "image-palette-extractor", title: "Image Palette Extractor", khmerTitle: "ស្រង់ពណ៌ពីរូបភាព", addedOn: "2026-08-21T14:15+07:00", category: "images", keywords: ["palette", "colors", "extract", "dominant colors", "image", "hex", "swatch", "ពណ៌", "រូបភាព"], Component: load("images", "image-palette-extractor") },
  { id: "svg-to-png", title: "SVG to PNG Converter", khmerTitle: "បម្លែង SVG ទៅជា PNG", addedOn: "2026-08-21T14:20+07:00", category: "images", keywords: ["svg", "png", "convert", "render", "raster", "image", "export", "បម្លែង"], Component: load("images", "svg-to-png") },
  { id: "3d-model-gallery", title: "3D Model Gallery", khmerTitle: "វិចិត្រសាល គំរូ 3D", addedOn: "2026-07-30", category: "images", keywords: ["3d", "gallery", "viewer", "three.js", "procedural", "img2threejs", "glb", "model", "showcase"], Component: load("images", "model-gallery") },
  { id: "3d-model-previewer", title: "3D Model Previewer", khmerTitle: "កម្មវិធីមើលរូបគំរូ 3D", addedOn: "2026-07-30", category: "images", keywords: ["3d", "preview", "viewer", "three.js", "typescript", "transpile", "runtime", "model factory", "upload", "ts"], Component: load("images", "model-preview") },

  // ---- Audio (1) ----
  { id: "audio-editor", title: "Audio Editor", category: "audio", keywords: ["trim", "cut", "fade", "gain", "wav", "waveform"], Component: load("audio", "audio-editor") },
  { id: "audio-inspector", title: "Audio File Inspector", category: "audio", keywords: ["waveform", "duration", "sample rate"], Component: load("audio", "audio-inspector") },
  { id: "tap-tempo", title: "Tap Tempo (BPM Counter)", khmerTitle: "វាស់ចង្វាក់ BPM", addedOn: "2026-08-17T18:50:00+07:00", category: "audio", keywords: ["bpm", "tempo", "tap", "metronome", "beat", "music", "ចង្វាក់"], Component: load("audio", "tap-tempo") },
  { id: "metronome", title: "Metronome", khmerTitle: "មេត្រូណូម", addedOn: "2026-08-17T18:55:00+07:00", category: "audio", keywords: ["metronome", "tempo", "bpm", "practice", "music", "rhythm", "មេត្រូណូម"], Component: load("audio", "metronome") },
  { id: "tone-generator", title: "Tone Generator", khmerTitle: "បង្កើតសម្លេង", addedOn: "2026-08-17T19:00:00+07:00", category: "audio", keywords: ["tone", "frequency", "hz", "oscillator", "sound", "tuning", "សម្លេង"], Component: load("audio", "tone-generator") },
  { id: "note-frequency", title: "Note Frequency Table", khmerTitle: "តារាងប្រេកង់សម្លេង", addedOn: "2026-08-17T19:05:00+07:00", category: "audio", keywords: ["note", "frequency", "hz", "piano", "music", "reference", "ប្រេកង់"], Component: load("audio", "note-frequency") },
  { id: "voice-recorder", title: "Voice Recorder", khmerTitle: "ថតសម្លេង", addedOn: "2026-08-17T21:20:00+07:00", category: "audio", keywords: ["record", "voice", "mic", "audio", "media recorder", "speech", "ថតសម្លេង"], Component: load("audio", "voice-recorder") },
  { id: "audio-visualizer-player", title: "Audio Visualizer Player", khmerTitle: "អ្នកចាក់សំឡេងជាមួយរូបភាព", addedOn: "2026-08-24", category: "audio", keywords: ["audio", "visualizer", "player", "spectrum", "waveform", "analyser", "សំឡេង", "រូបភាព"], Component: load("audio", "audio-visualizer-player") },

  // ---- Video (2) ----
  { id: "video-thumbnail", title: "Video Thumbnail Grabber", category: "video", keywords: ["thumbnail", "frame capture", "screenshot"], Component: load("video", "video-thumbnail") },
  { id: "video-trimmer", title: "Video Trimmer", category: "video", keywords: ["trim", "cut", "clip", "webm"], Component: load("video", "video-trimmer") },
  { id: "video-to-gif", title: "Video → GIF", category: "video", keywords: ["gif", "animated", "clip", "convert"], Component: load("video", "video-to-gif") },
  { id: "video-inspector", title: "Video File Inspector", category: "video", keywords: ["resolution", "duration", "aspect ratio"], Component: load("video", "video-inspector") },
  { id: "video-to-audio", title: "Video to Audio", khmerTitle: "ទាញសំឡេងពីវីដេអូ", addedOn: "2026-08-24", category: "video", keywords: ["video", "audio", "extract", "wav", "sound", "សំឡេង", "វីដេអូ"], Component: load("video", "video-to-audio") },
  { id: "video-merger", title: "Video Merger", khmerTitle: "បញ្ចូលវីដេអូ", addedOn: "2026-08-24", category: "video", keywords: ["video", "merge", "combine", "concat", "join", "បញ្ចូលវីដេអូ"], Component: load("video", "video-merger") },
  { id: "subtitle-player", title: "Subtitle Player", khmerTitle: "អ្នកចាក់អក្សររត់ពីក្រោម", addedOn: "2026-08-24", category: "video", keywords: ["subtitle", "srt", "caption", "player", "អក្សររត់", "ចំណងជើងរង"], Component: load("video", "subtitle-player") },
  { id: "video-frame-batch", title: "Video Frame Batch", khmerTitle: "ទាញរូបភាពពីវីដេអូតាមចន្លោះ", addedOn: "2026-08-24", category: "video", keywords: ["video", "frame", "extract", "batch", "zip", "screenshot", "រូបភាព", "វីដេអូ"], Component: load("video", "video-frame-batch") },

  // ---- Meta (1) ----
  { id: "data-residency-map", title: "Data Residency Map", addedOn: "2026-07-31", category: "meta", keywords: ["data residency", "network audit", "local", "privacy", "offline"], Component: load("meta", "data-residency-map") },

  // ---- Family (2) ----
  { id: "yellow-card-tracker", title: "Yellow Card Tracker", addedOn: "2026-08-03T10:10:00+07:00", category: "family", keywords: ["child health", "immunization", "vaccine", "vaccination", "bcg", "hepb", "opv", "ipv", "dpt", "hep-b", "hib", "pcv", "mr", "measles", "rubella", "je", "japanese encephalitis", "vitamin a", "deworming", "growth chart", "who", "yellow card", "baby", "kids", "cambodia", "សុខភាព", "កុមារ", "ថ្នាំបង្ការ"], Component: load("family", "yellow-card-tracker") },
  { id: "bmi-calculator", title: "BMI Calculator", khmerTitle: "គណនា BMI", addedOn: "2026-08-17T15:25:00+07:00", category: "family", keywords: ["bmi", "body mass index", "weight", "height", "health", "fitness", "bmi calculator", "ទម្ងន់", "កម្ពស់", "សុខភាព"], Component: load("family", "bmi-calculator") },
  { id: "sleep-calculator", title: "Sleep Calculator", khmerTitle: "គណនាម៉ោងគេង", addedOn: "2026-08-17T16:50:00+07:00", category: "family", keywords: ["sleep", "wake", "sleep cycle", "bedtime", "wake up", "rem", "គេង", "ម៉ោងគេង", "ក្រោក"], Component: load("family", "sleep-calculator") },

  // ---- Fun (1) ----
  { id: "khmer-sentence-builder", title: "Khmer Sentence Builder", addedOn: "2026-08-03T10:15:00+07:00", category: "fun", keywords: ["game", "sentence", "builder", "quiz", "khmer language", "learning", "drag", "interactive", "kids", "fun", "ល្បែង", "ផ្គុំ", "ល្បះ"], Component: load("fun", "khmer-sentence-builder") },
  { id: "khmer-typing-training", title: "Khmer Typing Training", khmerTitle: "ល្បែងហ្វឹកហាត់វាយអក្សរខ្មែរ", addedOn: "2026-08-04T12:10:00+07:00", category: "fun", keywords: ["typing", "khmer keyboard", "wpm", "accuracy", "keyboard training", "practice"], Component: load("fun", "khmer-typing-training") },
  { id: "khmer-keyboard-visualizer", title: "Khmer Keyboard Visualizer", khmerTitle: "ឧបករណ៍បង្ហាញក្តារចុចខ្មែរ", addedOn: "2026-08-04T09:10:00+07:00", category: "knowledge", keywords: ["keyboard", "nida", "khmer layout", "unicode", "keystroke", "altgr", "shift"], Component: load("fun", "khmer-keyboard-visualizer") },
  { id: "khmer-word-game", title: "Khmer Word Arrange Game", khmerTitle: "ហ្គេម រៀបពាក្យខ្មែរ", addedOn: "2026-08-12T13:00:00+07:00", category: "fun", keywords: ["game", "arrange", "syllable", "word", "sentence", "fill blank", "khmer", "spelling", "puzzle", "quiz", "ហ្គេម", "រៀបពាក្យ", "ព្យាង្គ", "បំពេញ"], Component: load("fun", "khmer-word-game") },
  { id: "flag-guessing-game", title: "Flag Guessing Game", khmerTitle: "ល្បែងទាយទង់ជាតិ", addedOn: "2026-08-17T10:00:00+07:00", category: "fun", keywords: ["flag", "game", "quiz", "country", "geography", "world", "continent", "world flags", "guess", "learning", "kids", "ទង់ជាតិ", "ល្បែង", "ប្រទេស", "ភូមិសាស្ត្រ", "ទាយ"], Component: load("fun", "flag-guessing-game") },
  { id: "chhmoh-astrology", title: "Chhmoh Astrology Portal", addedOn: "2026-08-03T10:20:00+07:00", category: "fun", keywords: ["astrology", "khmer name", "naming", "borit", "destiny", "horoscope", "chhmoh", "baby name", "ឈ្មោះ", "ហោរាសាស្ត្រ", "មហាទក្សា"], Component: load("fun", "chhmoh-astrology") },
  { id: "dice-roller", title: "Dice Roller", khmerTitle: "គ្រាប់ឡុកឡាក់", addedOn: "2026-08-17T16:10:00+07:00", category: "fun", keywords: ["dice", "roll", "d4", "d6", "d20", "rpg", "board game", "random", "ឡុកឡាក់", "គ្រវែង"], Component: load("fun", "dice-roller") },
  { id: "coin-flip", title: "Coin Flip", khmerTitle: "បោះកាក់", addedOn: "2026-08-17T16:15:00+07:00", category: "fun", keywords: ["coin", "flip", "heads", "tails", "toss", "random", "best of", "កាក់", "បោះ"], Component: load("fun", "coin-flip") },
  { id: "name-picker", title: "Random Name Picker", khmerTitle: "ជ្រើសរើសឈ្មោះចៃដន្យ", addedOn: "2026-08-17T16:20:00+07:00", category: "fun", keywords: ["random picker", "name picker", "winner", "decision", "raffle", "draw", "lucky", "ជ្រើសរើស", "ឈ្មោះ", "ចៃដន្យ", "អ្នកឈ្នះ"], Component: load("fun", "name-picker") },
  { id: "decision-wheel", title: "Decision Wheel", khmerTitle: "កង់សម្រេចចិត្ត", addedOn: "2026-08-17T19:20:00+07:00", category: "fun", keywords: ["wheel", "spin", "decision", "random", "picker", "choose", "កង់", "សម្រេចចិត្ត"], Component: load("fun", "decision-wheel") },
  { id: "rock-paper-scissors", title: "Rock Paper Scissors", khmerTitle: "ថ្ម កន្ត្រៃ ក្រដាស", addedOn: "2026-08-17T19:25:00+07:00", category: "fun", keywords: ["rock paper scissors", "game", "play", "ថ្ម", "កន្ត្រៃ", "ក្រដាស"], Component: load("fun", "rock-paper-scissors") },
  { id: "magic-8-ball", title: "Magic 8 Ball", khmerTitle: "បាល់ទស្សន៍ទាយ", addedOn: "2026-08-17T19:30:00+07:00", category: "fun", keywords: ["8 ball", "fortune", "yes no", "predict", "fun", "បាល់", "ទស្សន៍ទាយ"], Component: load("fun", "magic-8-ball") },
  { id: "haiku-generator", title: "Haiku Generator", khmerTitle: "បង្កើតកំណាព្យ Haiku", addedOn: "2026-08-17T19:35:00+07:00", category: "fun", keywords: ["haiku", "poem", "poetry", "syllable", "5 7 5", "កំណាព្យ"], Component: load("fun", "haiku-generator") },
  { id: "list-shuffler", title: "List Shuffler", khmerTitle: "សាប់បញ្ជី", addedOn: "2026-08-17T21:25:00+07:00", category: "fun", keywords: ["shuffle", "randomize", "list", "order", "draw", "សាប់", "បញ្ជី"], Component: load("fun", "list-shuffler") },
  { id: "tic-tac-toe", title: "Tic Tac Toe", khmerTitle: "លេងគូសបន្ទាត់", addedOn: "2026-08-17T21:30:00+07:00", category: "fun", keywords: ["tic tac toe", "game", "x o", "noughts and crosses", "ហ្គេម", "គូសបន្ទាត់"], Component: load("fun", "tic-tac-toe") },
  { id: "hangman", title: "Hangman", khmerTitle: "ល្បែងទាយពាក្យ", addedOn: "2026-08-17T21:35:00+07:00", category: "fun", keywords: ["hangman", "word game", "guess", "letters", "game", "ហ្គេម", "ទាយពាក្យ"], Component: load("fun", "hangman") },
  { id: "wordle-helper", title: "Wordle Solver Helper", khmerTitle: "អ្នកជំនួយ Wordle", addedOn: "2026-08-17T23:15:00+07:00", category: "fun", keywords: ["wordle", "solver", "helper", "filter", "green yellow gray", "word game"], Component: load("fun", "wordle-helper") },
  { id: "memory-game", title: "Memory Match Game", khmerTitle: "ល្បែងចងចាំរូបភាព", addedOn: "2026-08-17T23:20:00+07:00", category: "fun", keywords: ["memory", "match", "cards", "game", "concentration", "brain", "ចងចាំ", "ល្បែង"], Component: load("fun", "memory-game") },
  { id: "number-guessing", title: "Number Guessing Game", khmerTitle: "ល្បែងស្មានលេខ", addedOn: "2026-08-17T23:25:00+07:00", category: "fun", keywords: ["number", "guess", "game", "high low", "random", "ស្មានលេខ", "ល្បែង"], Component: load("fun", "number-guessing") },
  { id: "would-you-rather", title: "Would You Rather", khmerTitle: "អ្នកចូលចិត្តមួយណាជាង", addedOn: "2026-08-17T21:40:00+07:00", category: "fun", keywords: ["would you rather", "questions", "game", "party", "icebreaker", "សំណួរ", "ហ្គេម"], Component: load("fun", "would-you-rather") },
  { id: "random-compliment", title: "Random Compliment", khmerTitle: "ពាក្យសរសើរចៃដន្យ", addedOn: "2026-08-17T21:45:00+07:00", category: "fun", keywords: ["compliment", "nice", "kind", "positive", "encourage", "សរសើរ", "លើកទឹកចិត្ត"], Component: load("fun", "random-compliment") },
  { id: "emoji-lookup", title: "Emoji Meaning Lookup", khmerTitle: "ស្វែងរកអត្ថន័យ Emoji", addedOn: "2026-08-17T17:20:00+07:00", category: "fun", keywords: ["emoji", "meaning", "unicode name", "lookup", "symbol", "អ៊ីម៉ូជី", "អត្ថន័យ"], Component: load("fun", "emoji-lookup") },
  { id: "random-quote", title: "Random Quote Generator", khmerTitle: "បង្កើតសម្រង់ពាក្យចៃដន្យ", addedOn: "2026-08-17T17:25:00+07:00", category: "fun", keywords: ["quote", "motivation", "inspiration", "random quote", "daily quote", "សម្រង់ពាក្យ", "លើកទឹកចិត្ត"], Component: load("fun", "random-quote") },

  // ---- Data-driven unit-pair converters (generated, Batch 1) ----
  ...UNIT_PAIR_TOOLS,
  ...TEMPERATURE_PAIR_TOOLS,
];

for (const tool of TOOLS) tool.khmerTitle ??= toKhmerToolTitle(tool.title);

