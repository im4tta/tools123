"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// Approximate Khmer dictionary-order key.
//
// The base consonants U+1780–U+17A2 were encoded in traditional Khmer
// dictionary order, so an explicit order string is used for them. Subscripts
// (coeng U+17D2 followed by a base consonant) are ranked just after their
// base letter; dependent vowels, diacritics, independent vowels and Khmer
// digits get their own ranges after the consonants. Anything else falls back
// to its code point. This is an approximation — it is NOT the official
// Unicode collation (Intl.Collator("km")).
const BASE_CONSONANTS = "កខគឃងចឆជឈញដឋឌឍណតថទធនបផពភមយរលវឝឞសហឡអ";
const DEPENDENT_VOWELS = "ាិីឹឺុូួើឿៀេែៃោៅ";
const DIACRITICS = "ំះៈ៉៊់៌៍៎៏័៑៓";
const INDEPENDENT_VOWELS = "ឣឤឥឦឧឨឩឪឫឬឭឮឯឰឱឲឳ";
const KHMER_DIGITS = "០១២៣៤៥៦៧៨៩";
const COENG = "្"; // U+17D2

function rankTable(chars: string, base: number): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < chars.length; i++) map.set(chars[i], base + i * 10);
  return map;
}

const CONSONANT_RANKS = rankTable(BASE_CONSONANTS, 100);
const VOWEL_RANKS = rankTable(DEPENDENT_VOWELS, 1000);
const DIACRITIC_RANKS = rankTable(DIACRITICS, 2000);
const INDEPENDENT_RANKS = rankTable(INDEPENDENT_VOWELS, 3000);
const DIGIT_RANKS = rankTable(KHMER_DIGITS, 4000);

function sortKey(text: string): number[] {
  const chars = Array.from(text);
  const key: number[] = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === COENG) {
      const base = chars[i + 1] ? CONSONANT_RANKS.get(chars[i + 1]) : undefined;
      if (base !== undefined) {
        key.push(base + 1); // subscript ranks just after its base letter
        i += 1;
        continue;
      }
      key.push(1500); // lone coeng — treated as a separator-like symbol
      continue;
    }
    const rank =
      CONSONANT_RANKS.get(ch) ??
      VOWEL_RANKS.get(ch) ??
      DIACRITIC_RANKS.get(ch) ??
      INDEPENDENT_RANKS.get(ch) ??
      DIGIT_RANKS.get(ch) ??
      5000 + (ch.codePointAt(0) ?? 0);
    key.push(rank);
  }
  return key;
}

function compareKeys(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return a.length - b.length;
}

function compareKhmer(a: string, b: string): number {
  const cmp = compareKeys(sortKey(a), sortKey(b));
  if (cmp !== 0) return cmp;
  return a < b ? -1 : a > b ? 1 : 0;
}

type Mode = "lines" | "words";
type Direction = "asc" | "desc";

export default function KhmerSorter() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState(
    "khmer-sorter:input",
    "សៀមរាប\nកណ្ដាល\nស្ទឹងត្រែង\nឧត្តរមានជ័យ\nកំពង់ចាម\nក្រចេះ\nបន្ទាយមានជ័យ"
  );
  const [mode, setMode] = useToolState<Mode>("khmer-sorter:mode", "lines");
  const [direction, setDirection] = useToolState<Direction>("khmer-sorter:direction", "asc");

  const { items, sorted } = useMemo(() => {
    const items =
      mode === "lines"
        ? input.split("\n").map((l) => l.trim()).filter(Boolean)
        : input.split(/\s+/).map((w) => w.trim()).filter(Boolean);
    const sorted = [...items].sort(compareKhmer);
    if (direction === "desc") sorted.reverse();
    return { items, sorted };
  }, [input, mode, direction]);

  return (
    <ToolShell
      title="Khmer Text Sorter"
      khmerTitle="តម្រៀបអក្សរខ្មែរ"
      description="Sort Khmer lines or words in approximate dictionary order using a consonant/subscript order table — handy for place names, glossaries and word lists."
      descriptionKm="តម្រៀបបន្ទាត់ ឬពាក្យខ្មែរតាមលំដាប់វចនានុក្រមប្រហាក់ប្រហែល ដោយប្រើតារាងលំដាប់ព្យញ្ជនៈ និងជើង — ងាយស្រួលសម្រាប់ឈ្មោះទីកន្លែង សទ្ទានុក្រម និងបញ្ជីពាក្យ។"
    >
      <Field label={t("Text", "អត្ថបទ")} hint={t(`${items.length} items`, `ធាតុ ${items.length}`)}>
        <TextArea rows={7} value={input} onChange={(e) => setInput(e.target.value)} className="font-khmer" />
      </Field>
      <Row>
        <Field label={t("Split by", "បំបែកតាម")}>
          <Select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="lines">{t("Lines", "បន្ទាត់")}</option>
            <option value="words">{t("Words", "ពាក្យ")}</option>
          </Select>
        </Field>
        <Field label={t("Direction", "ទិសដៅ")}>
          <Select value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
            <option value="asc">{t("A to Z", "ក ទៅ អ")}</option>
            <option value="desc">{t("Z to A", "អ ទៅ ក")}</option>
          </Select>
        </Field>
      </Row>
      <Output label={t("Sorted result", "លទ្ធផលតម្រៀប")} value={sorted.join("\n")} mono={false} />
      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Approximate dictionary-order sort: it ranks base consonants, subscripts (coeng ្), vowels and diacritics from a local order table. It is not the official Unicode collation, so a few edge cases may differ from Intl.Collator(\"km\").",
          "ការតម្រៀបតាមលំដាប់វចនានុក្រមប្រហាក់ប្រហែល៖ វាចាត់ថ្នាក់ព្យញ្ជនៈ ជើង (្) ស្រៈ និងវណ្ណយុត្តិតាមតារាងលំដាប់ក្នុងមូលដ្ឋាន។ វាមិនមែនជាការតម្រៀបផ្លូវការរបស់ Unicode ទេ ដូច្នេះករណីខ្លះអាចខុសពី Intl.Collator(\"km\")។"
        )}
      </p>
    </ToolShell>
  );
}
