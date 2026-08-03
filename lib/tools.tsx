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
  | "fun";

export interface ToolDef {
  id: string;
  title: string;
  khmerTitle?: string;
  /** ISO date for homepage daily-addition grouping; omit when provenance is unknown. */
  addedOn?: string;
  category: Category;
  keywords: string[];
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
  { id: "markdown-preview", title: "Markdown Previewer", category: "dev", keywords: ["markdown", "md", "preview"], Component: load("dev", "markdown-preview") },
  { id: "tsx-portal", title: "TSX Portal", addedOn: "2026-08-03T10:00:00+07:00", category: "dev", keywords: ["tsx", "jsx", "playground", "sandbox", "live preview", "babel", "repl", "react", "markdown", "bbcode"], Component: load("dev", "tsx-portal") },
  { id: "diff-checker", title: "Text Diff Checker", category: "dev", keywords: ["diff", "compare", "changes"], Component: load("dev", "diff-checker") },
  { id: "word-counter", title: "Word & Character Counter", category: "dev", keywords: ["word count", "character count"], Component: load("dev", "word-counter") },
  { id: "lorem-ipsum", title: "Placeholder Text Generator", category: "dev", keywords: ["lorem ipsum", "filler", "placeholder"], Component: load("dev", "lorem-ipsum") },
  { id: "color-converter", title: "Color Converter", category: "dev", keywords: ["hex", "rgb", "hsl", "color"], Component: load("dev", "color-converter") },
  { id: "timestamp", title: "Unix Timestamp Converter", category: "dev", keywords: ["unix", "epoch", "timestamp", "iso"], Component: load("dev", "timestamp") },
  { id: "case-converter", title: "Case Converter", category: "dev", keywords: ["camelcase", "snake_case", "kebab-case"], Component: load("dev", "case-converter") },
  { id: "slug-generator", title: "Slug Generator", category: "dev", keywords: ["slug", "url friendly"], Component: load("dev", "slug-generator") },
  { id: "csv-json", title: "CSV → JSON", category: "dev", keywords: ["csv", "json", "convert"], Component: load("dev", "csv-json") },
  { id: "cron-parser", title: "Cron Expression Explainer", category: "dev", keywords: ["cron", "schedule", "crontab"], Component: load("dev", "cron-parser") },
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
  { id: "id-pattern", title: "National ID Shape Checker", category: "khmer", keywords: ["national id", "format check"], Component: load("khmer", "id-pattern") },
  { id: "romanization", title: "Khmer Romanization", category: "khmer", keywords: ["romanize", "transliterate", "latin"], Component: load("khmer", "romanization") },
  { id: "line-break-helper", title: "Soft Line-break Helper", category: "khmer", keywords: ["zwsp", "word wrap", "line break", "khmerscribe", "khmer break", "ចន្លោះសូន្យ", "បំបែកបន្ទាត់"], Component: load("khmer", "line-break-helper") },
  { id: "font-preview", title: "Khmer Web Font Preview", category: "khmer", keywords: ["font", "noto sans khmer", "typography"], Component: load("khmer", "font-preview") },
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
  { id: "khmer-lexicon", title: "Somtosor", khmerTitle: "សទិសសូរ", addedOn: "2026-08-03T10:25:00+07:00", category: "khmer", keywords: ["dictionary", "homophone", "synonym", "antonym", "lexicon", "vocabulary", "khmer word", "chuon nath", "សទានុក្រម", "សទិសសូរ", "ពាក្យ"], Component: load("khmer", "khmer-lexicon") },
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
  { id: "khmer-word-segmentation-tester", title: "Khmer Word Segmentation Tester", khmerTitle: "កម្មវិធីសាកល្បងបំបែកពាក្យខ្មែរ", addedOn: "2026-07-31", category: "khmer", keywords: ["word segmentation", "tokenizer", "nlp", "boundary", "khmer nlp", "បំបែកពាក្យ"], Component: load("khmer", "word-segmentation-tester") },
  { id: "khmer-font-encoding-inspector", title: "Khmer Font Encoding Inspector", khmerTitle: "ពិនិត្យការអ៊ិនកូដពុម្ពអក្សរខ្មែរ", addedOn: "2026-07-31", category: "khmer", keywords: ["font", "encoding", "ttf", "otf", "cmap", "unicode", "ពុម្ពអក្សរ"], Component: load("khmer", "font-encoding-inspector") },
  { id: "khmer-sentence-segmenter", title: "Khmer Sentence Segmenter", khmerTitle: "បំបែកប្រយោគខ្មែរ", category: "khmer", keywords: ["sentence", "segment", "punctuation", "nlp", "ប្រយោគ"], Component: load("khmer", "khmer-sentence-segmenter") },
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

  // ---- Science (1) ----
  { id: "materials", title: "Earth Materials & 3D Atom Pro", khmerTitle: "សារធាតុផែនដី & អាតូម 3D Pro", addedOn: "2026-07-30", category: "science", keywords: ["elements", "periodic table", "materials", "chemistry", "3d atom", "isotopes", "science", "វិទ្យាសាស្រ្ត", "ធាតុគីមី", "តារាងខួប", "សារធាតុ"], Component: load("science", "materials") },
  { id: "phone-number-cleaner", title: "Phone Number Cleaner Pro", khmerTitle: "កម្មវិធីសម្អាត និងបំប្លែងលេខទូរស័ព្ទខ្មែរ", addedOn: "2026-07-30", category: "science", keywords: ["phone", "number", "cleaner", "parser", "format", "Cambodia", "cellcard", "smart", "metfone", "telegram", "whatsapp"], Component: load("science", "phone-number-cleaner") },

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
  { id: "title-case", title: "Title Case Converter", category: "text", keywords: ["title case", "capitalize"], Component: load("text", "title-case") },
  { id: "text-columns", title: "Text to Columns Splitter", category: "text", keywords: ["split", "delimiter", "columns"], Component: load("text", "text-columns") },
  { id: "anagram-checker", title: "Anagram Checker", category: "text", keywords: ["anagram", "letters"], Component: load("text", "anagram-checker") },
  { id: "line-numberer", title: "Text Line Numberer", category: "text", keywords: ["line numbers", "numbered list"], Component: load("text", "line-numberer") },

  // ---- Math (17) ----
  { id: "percentage-calculator", title: "Percentage Calculator", category: "math", keywords: ["percent", "percentage"], Component: load("math", "percentage-calculator") },
  { id: "base-converter", title: "Number Base Converter", category: "math", keywords: ["binary", "hex", "octal", "decimal"], Component: load("math", "base-converter") },
  { id: "gcd-lcm", title: "GCD & LCM Calculator", category: "math", keywords: ["gcd", "lcm", "greatest common divisor"], Component: load("math", "gcd-lcm") },
  { id: "prime-checker", title: "Prime Number Checker & Factorizer", category: "math", keywords: ["prime", "factorize", "factors"], Component: load("math", "prime-checker") },
  { id: "fibonacci-generator", title: "Fibonacci Sequence Generator", category: "math", keywords: ["fibonacci", "sequence"], Component: load("math", "fibonacci-generator") },
  { id: "quadratic-solver", title: "Quadratic Equation Solver", category: "math", keywords: ["quadratic", "roots", "discriminant"], Component: load("math", "quadratic-solver") },
  { id: "statistics-calculator", title: "Mean / Median / Mode / StdDev Calculator", category: "math", keywords: ["statistics", "mean", "median", "mode"], Component: load("math", "statistics-calculator") },
  { id: "matrix-calculator", title: "Matrix Determinant", category: "math", keywords: ["matrix", "determinant"], Component: load("math", "matrix-calculator") },
  { id: "unit-converter", title: "Length / Weight / Volume Unit Converter", category: "math", keywords: ["unit", "convert", "metric", "imperial"], Component: load("math", "unit-converter") },
  { id: "temperature-converter", title: "Temperature Converter", category: "math", keywords: ["celsius", "fahrenheit", "kelvin"], Component: load("math", "temperature-converter") },
  { id: "random-number", title: "Random Number Generator", category: "math", keywords: ["random", "range"], Component: load("math", "random-number") },
  { id: "ratio-simplifier", title: "Ratio Simplifier", category: "math", keywords: ["ratio", "simplify"], Component: load("math", "ratio-simplifier") },
  { id: "roman-numeral", title: "Roman Numeral Converter", category: "math", keywords: ["roman numeral"], Component: load("math", "roman-numeral") },
  { id: "triangle-solver", title: "Right Triangle Solver", category: "math", keywords: ["triangle", "hypotenuse", "pythagorean"], Component: load("math", "triangle-solver") },
  { id: "compound-interest", title: "Compound Interest Calculator", category: "math", keywords: ["interest", "compound", "savings", "investment"], Component: load("math", "compound-interest") },
  { id: "bill-split", title: "Tip & Bill Split Calculator", category: "math", keywords: ["tip", "bill", "split", "restaurant"], Component: load("math", "bill-split") },
  { id: "latex-renderer", title: "LaTeX Formula Renderer", category: "math", keywords: ["latex", "katex", "formula", "equation", "ratex", "typeset"], Component: load("math", "latex-renderer") },

  // ---- Network (13) ----
  { id: "cidr-calculator", title: "CIDR / Subnet Calculator", category: "network", keywords: ["cidr", "subnet", "netmask"], Component: load("network", "cidr-calculator") },
  { id: "ip-parser", title: "IPv4 Address Parser", category: "network", keywords: ["ip", "ipv4", "class"], Component: load("network", "ip-parser") },
  { id: "mac-address-formatter", title: "MAC Address Formatter", category: "network", keywords: ["mac address", "ethernet"], Component: load("network", "mac-address-formatter") },
  { id: "http-status-lookup", title: "HTTP Status Code Reference", category: "network", keywords: ["http", "status code", "404"], Component: load("network", "http-status-lookup") },
  { id: "user-agent-parser", title: "User-Agent String Parser", category: "network", keywords: ["user agent", "browser detect"], Component: load("network", "user-agent-parser") },
  { id: "url-parser", title: "URL Parser & Query String Inspector", category: "network", keywords: ["url", "query string", "params"], Component: load("network", "url-parser") },
  { id: "dns-record-reference", title: "DNS Record Type Reference", category: "network", keywords: ["dns", "mx", "cname", "txt"], Component: load("network", "dns-record-reference") },
  { id: "html-entity-encoder", title: "HTML Entity Encoder / Decoder", category: "network", keywords: ["html entities", "escape"], Component: load("network", "html-entity-encoder") },
  { id: "port-lookup", title: "Common Port Number Reference", category: "network", keywords: ["port", "tcp", "udp"], Component: load("network", "port-lookup") },
  { id: "mime-type-lookup", title: "MIME Type Lookup", category: "network", keywords: ["mime", "content type", "file extension"], Component: load("network", "mime-type-lookup") },
  { id: "slug-checker", title: "Domain / Slug Validity Checker", category: "network", keywords: ["slug", "domain", "validate"], Component: load("network", "slug-checker") },
  { id: "optical-transfer", title: "Decimen Optical Transfer", addedOn: "2026-08-03T10:30:00+07:00", category: "network", keywords: ["file transfer", "qr code", "optical", "camera", "airgap", "offline", "send", "receive", "light", "fountain code", "QR"], Component: load("network", "optical-transfer") },
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

  // ---- Time & Date (14) ----
  { id: "daily-feng-shui-calendar", title: "Daily Feng Shui Calendar", khmerTitle: "ប្រតិទិនហុងស៊ុយប្រចាំថ្ងៃ", addedOn: "2026-07-29", category: "time", keywords: ["feng shui", "calendar", "cultural reference", "daily planning", "ហុងស៊ុយ"], Component: load("time", "daily-feng-shui-calendar") },
  { id: "age-calculator", title: "Age Calculator", category: "time", keywords: ["age", "birthday"], Component: load("time", "age-calculator") },
  { id: "date-difference-calculator", title: "Date Difference Calculator", category: "time", keywords: ["days between", "date diff"], Component: load("time", "date-difference-calculator") },
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

  // ---- Documents (8) ----
  { id: "currency-to-words", title: "Currency Amount to Words", category: "office", keywords: ["cheque", "invoice", "amount", "spell out"], Component: load("office", "currency-to-words") },
  { id: "document-number-generator", title: "Document / Invoice Number Generator", category: "office", keywords: ["invoice number", "reference number", "sequence"], Component: load("office", "document-number-generator") },
  { id: "pdf-info", title: "PDF Info & Preview", category: "office", keywords: ["pdf", "page count", "metadata", "thumbnail"], Component: load("office", "pdf-info") },
  { id: "pdf-merge", title: "PDF Merge", category: "office", keywords: ["pdf", "merge", "combine", "join"], Component: load("office", "pdf-merge") },
  { id: "pdf-organizer", title: "PDF Page Organizer", category: "office", keywords: ["pdf", "reorder", "rotate", "delete page", "split", "extract"], Component: load("office", "pdf-organizer") },
  { id: "file-compressor", title: "File Compressor", category: "office", keywords: ["compress", "pdf", "image", "shrink", "reduce size", "sralify", "zip", "batch"], Component: load("office", "file-compressor") },
  { id: "pdf-watermark", title: "PDF Watermark", category: "office", keywords: ["pdf", "watermark", "stamp", "confidential"], Component: load("office", "pdf-watermark") },
  { id: "images-to-pdf", title: "Images → PDF", category: "office", keywords: ["image", "jpg", "png", "pdf", "convert"], Component: load("office", "images-to-pdf") },
  { id: "pdf-to-images", title: "PDF → Images", category: "office", keywords: ["pdf", "png", "jpg", "export", "render"], Component: load("office", "pdf-to-images") },

  // ---- Office (19) ----
  { id: "rfa-generator", title: "Request for Approval (RFA)", khmerTitle: "សំណើសុំការអនុម័ត (RFA)", addedOn: "2026-07-29", category: "office", keywords: ["rfa", "request for approval", "construction", "submittal", "contractor"], Component: load("office", "rfa-generator") },
  { id: "business-calculators", title: "Business Calculators", khmerTitle: "ម៉ាស៊ីនគណនាអាជីវកម្ម", addedOn: "2026-07-29", category: "office", keywords: ["loan", "amortization", "vat", "discount", "date add", "salary tax", "nssf", "ប្រាក់កម្ចី", "ពន្ធ", "បសស"], Component: load("office", "business-calculators") },
  { id: "bid-timeline-calculator", title: "Bid Timeline Calculator", khmerTitle: "ម៉ាស៊ីនគណនាកាលវិភាគដេញថ្លៃ", addedOn: "2026-07-31", category: "office", keywords: ["bid", "tender", "ifb", "pre-bid", "submission deadline", "bid validity", "bid security"], Component: load("office", "bid-timeline-calculator") },
  { id: "retention-ld-tracker", title: "Retention & Liquidated Damages Tracker", khmerTitle: "តាមដានប្រាក់តម្កល់ទុក និងសំណងការយឺតយ៉ាវ", addedOn: "2026-07-31", category: "office", keywords: ["retention", "liquidated damages", "ld", "delay", "withholding", "dlp", "construction"], Component: load("office", "retention-ld-tracker") },
  { id: "ipc-proportion", title: "IPC Proportion Calculator", addedOn: "2026-08-03T10:35:00+07:00", category: "office", keywords: ["ipc", "interim payment", "proportion", "split", "percentage", "allocation", "construction", "payment", "certificate"], Component: load("office", "ipc-proportion-calculator") },
  { id: "edc-electricity-calculator", title: "EDC Electricity Calculator", khmerTitle: "គណនាថ្លៃអគ្គិសនី EDC កម្ពុជា", addedOn: "2026-07-31", category: "office", keywords: ["edc", "electricity", "electric bill", "kwh", "tariff", "tier", "utility", "cambodia", "khr", "riel", "អគ្គិសនី", "វិក្កយបត្រ", "ថ្លៃភ្លើង"], Component: load("office", "edc-electricity-calculator") },
  { id: "staff-directory", title: "Staff Directory", khmerTitle: "បញ្ជីបុគ្គលិក", addedOn: "2026-07-29", category: "office", keywords: ["staff", "employee", "directory", "department", "csv", "បុគ្គលិក"], Component: load("office", "staff-directory") },
  { id: "qr-decoder", title: "QR Code Decoder", category: "office", keywords: ["qr code", "scan", "decode"], Component: load("office", "qr-decoder") },
  { id: "qr-generator", title: "QR Code Generator", category: "office", keywords: ["qr", "code", "barcode"], Component: load("office", "qr-generator") },
  { id: "expense-tracker", title: "Expense Tracker", category: "office", keywords: ["expenses", "budget", "mint", "spending", "money log"], Component: load("office", "expense-tracker") },
  { id: "task-manager", title: "Task Manager", khmerTitle: "កម្មវិធីគ្រប់គ្រងកិច្ចការ", addedOn: "2026-07-29", category: "office", keywords: ["task", "todo", "deadline", "priority", "កិច្ចការ"], Component: load("office", "task-manager") },
  { id: "time-tracker", title: "Time Tracker", khmerTitle: "កម្មវិធីតាមដានពេលវេលា", addedOn: "2026-07-29", category: "office", keywords: ["time", "tracker", "work log", "timesheet", "ពេលវេលា"], Component: load("office", "time-tracker") },
  { id: "sticky-notes", title: "Sticky Notes", khmerTitle: "កំណត់ត្រារហ័ស", addedOn: "2026-07-29", category: "office", keywords: ["notes", "sticky", "reminder", "memo", "កំណត់ត្រា"], Component: load("office", "sticky-notes") },
  { id: "email-signature-generator", title: "Email Signature Generator", khmerTitle: "កម្មវិធីបង្កើតហត្ថលេខាអ៊ីមែល", addedOn: "2026-07-29", category: "office", keywords: ["email", "signature", "html", "contact", "ហត្ថលេខាអ៊ីមែល"], Component: load("office", "email-signature-generator") },
  { id: "cambodia-public-holidays", title: "Cambodia Public Holidays", khmerTitle: "ថ្ងៃឈប់សម្រាកសាធារណៈកម្ពុជា", addedOn: "2026-07-29", category: "office", keywords: ["cambodia", "holiday", "calendar", "public holiday", "ថ្ងៃឈប់សម្រាក"], Component: load("office", "cambodia-public-holidays") },
  { id: "attendance-sheet", title: "Attendance Sheet", khmerTitle: "បញ្ជីវត្តមាន", addedOn: "2026-07-29", category: "office", keywords: ["attendance", "timesheet", "staff", "check in", "check out", "វត្តមាន"], Component: load("office", "attendance-sheet") },
  { id: "meeting-agenda-minutes", title: "Meeting Agenda & Minutes", khmerTitle: "របៀបវារៈ និងកំណត់ហេតុប្រជុំ", addedOn: "2026-07-29", category: "office", keywords: ["meeting", "agenda", "minutes", "decisions", "action items", "ប្រជុំ"], Component: load("office", "meeting-agenda-minutes") },
  { id: "team-generator", title: "Team Generator", khmerTitle: "កម្មវិធីបែងចែកក្រុម", addedOn: "2026-07-29", category: "office", keywords: ["team", "group", "random", "shuffle", "ក្រុម"], Component: load("office", "team-generator") },
  { id: "signature-pad", title: "Signature Pad", khmerTitle: "ផ្ទាំងហត្ថលេខា", addedOn: "2026-07-29", category: "office", keywords: ["signature", "sign", "draw", "png", "ហត្ថលេខា"], Component: load("office", "signature-pad") },
  { id: "asset-register", title: "Asset Register", khmerTitle: "បញ្ជីសម្ភារៈ", addedOn: "2026-07-29", category: "office", keywords: ["asset", "inventory", "equipment", "register", "សម្ភារៈ"], Component: load("office", "asset-register") },

  // ---- Images (8) ----
  { id: "document-scanner", title: "Document Scanner", khmerTitle: "ម៉ាស៊ីនស្កេនឯកសារ", addedOn: "2026-07-29", category: "images", keywords: ["document", "scanner", "camera", "capture", "grayscale", "ឯកសារ", "ស្កេន"], Component: load("images", "document-scanner") },
  { id: "image-optimizer", title: "Image Resizer & Compressor", category: "images", keywords: ["compress", "resize", "convert", "webp", "jpeg"], Component: load("images", "image-optimizer") },
  { id: "image-editor", title: "Image Editor", category: "images", keywords: ["crop", "rotate", "flip", "filters", "brightness", "contrast"], Component: load("images", "image-editor") },
  { id: "background-remover", title: "Background Remover", category: "images", keywords: ["remove bg", "background", "cutout", "transparent", "ai"], Component: load("images", "background-remover") },
  { id: "image-upscaler", title: "Image Upscaler", category: "images", keywords: ["upscale", "enlarge", "resolution", "sharpen"], Component: load("images", "image-upscaler") },
  { id: "image-watermark", title: "Image Watermark", category: "images", keywords: ["watermark", "copyright", "stamp", "brand"], Component: load("images", "image-watermark") },
  { id: "logo-remover", title: "Logo / Watermark Remover", category: "images", keywords: ["remove logo", "remove watermark", "gemini", "inpaint", "content aware fill", "clean"], Component: load("images", "logo-remover") },
  { id: "image-exif", title: "Image Metadata (EXIF) Viewer & Stripper", category: "images", keywords: ["exif", "metadata", "gps", "privacy", "strip"], Component: load("images", "image-exif") },
  { id: "image-to-base64", title: "Image ⇄ Base64 Converter", category: "images", keywords: ["base64", "data url", "image"], Component: load("images", "image-to-base64") },
  { id: "3d-model-gallery", title: "3D Model Gallery", khmerTitle: "វិចិត្រសាល គំរូ 3D", addedOn: "2026-07-30", category: "images", keywords: ["3d", "gallery", "viewer", "three.js", "procedural", "img2threejs", "glb", "model", "showcase"], Component: load("images", "model-gallery") },
  { id: "3d-model-previewer", title: "3D Model Previewer", khmerTitle: "កម្មវិធីមើលរូបគំរូ 3D", addedOn: "2026-07-30", category: "images", keywords: ["3d", "preview", "viewer", "three.js", "typescript", "transpile", "runtime", "model factory", "upload", "ts"], Component: load("images", "model-preview") },

  // ---- Audio (1) ----
  { id: "audio-editor", title: "Audio Editor", category: "audio", keywords: ["trim", "cut", "fade", "gain", "wav", "waveform"], Component: load("audio", "audio-editor") },
  { id: "audio-inspector", title: "Audio File Inspector", category: "audio", keywords: ["waveform", "duration", "sample rate"], Component: load("audio", "audio-inspector") },

  // ---- Video (2) ----
  { id: "video-thumbnail", title: "Video Thumbnail Grabber", category: "video", keywords: ["thumbnail", "frame capture", "screenshot"], Component: load("video", "video-thumbnail") },
  { id: "video-trimmer", title: "Video Trimmer", category: "video", keywords: ["trim", "cut", "clip", "webm"], Component: load("video", "video-trimmer") },
  { id: "video-to-gif", title: "Video → GIF", category: "video", keywords: ["gif", "animated", "clip", "convert"], Component: load("video", "video-to-gif") },
  { id: "video-inspector", title: "Video File Inspector", category: "video", keywords: ["resolution", "duration", "aspect ratio"], Component: load("video", "video-inspector") },

  // ---- Meta (1) ----
  { id: "data-residency-map", title: "Data Residency Map", addedOn: "2026-07-31", category: "meta", keywords: ["data residency", "network audit", "local", "privacy", "offline"], Component: load("meta", "data-residency-map") },

  // ---- Family (1) ----
  { id: "yellow-card-tracker", title: "Yellow Card Tracker", addedOn: "2026-08-03T10:10:00+07:00", category: "family", keywords: ["child health", "immunization", "vaccine", "growth chart", "who", "yellow card", "baby", "kids", "cambodia", "សុខភាព", "កុមារ", "ថ្នាំបង្ការ"], Component: load("family", "yellow-card-tracker") },

  // ---- Fun (1) ----
  { id: "khmer-sentence-builder", title: "Khmer Sentence Builder", addedOn: "2026-08-03T10:15:00+07:00", category: "fun", keywords: ["game", "sentence", "builder", "quiz", "khmer language", "learning", "drag", "interactive", "kids", "fun", "ល្បែង", "ផ្គុំ", "ល្បះ"], Component: load("fun", "khmer-sentence-builder") },
  { id: "chhmoh-astrology", title: "Chhmoh Astrology Portal", addedOn: "2026-08-03T10:20:00+07:00", category: "fun", keywords: ["astrology", "khmer name", "naming", "borit", "destiny", "horoscope", "chhmoh", "baby name", "ឈ្មោះ", "ហោរាសាស្ត្រ", "មហាទក្សា"], Component: load("fun", "chhmoh-astrology") },

  // ---- Data-driven unit-pair converters (generated, Batch 1) ----
  ...UNIT_PAIR_TOOLS,
  ...TEMPERATURE_PAIR_TOOLS,
];

for (const tool of TOOLS) tool.khmerTitle ??= toKhmerToolTitle(tool.title);
