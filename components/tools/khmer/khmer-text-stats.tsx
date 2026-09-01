"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// Khmer Unicode block U+1780–U+17FF (see Unicode standard, Khmer range):
// consonants U+1780–U+17A2, independent vowels U+17A3–U+17B3, dependent
// vowels U+17B6–U+17C5, diacritics U+17C6–U+17D1, coeng U+17D2,
// punctuation U+17D3–U+17DA, digits U+17E0–U+17E9.
const CONSONANT_RE = /[\u1780-\u17A2]/gu;
const INDEPENDENT_VOWEL_RE = /[\u17A3-\u17B3]/gu;
const DEPENDENT_VOWEL_RE = /[\u17B6-\u17C5]/gu;
const DIACRITIC_RE = /[\u17C6-\u17D1]/gu;
const COENG_RE = /\u17D2/gu;
const KHMER_DIGIT_RE = /[\u17E0-\u17E9]/gu;

const STAT_ITEMS = [
  { key: "words", label: "Words", km: "ពាក្យ" },
  { key: "lines", label: "Lines", km: "បន្ទាត់" },
  { key: "chars", label: "Characters", km: "តួអក្សរ" },
  { key: "charsNoSpace", label: "Characters (no spaces)", km: "តួអក្សរ (មិនរាប់ដកឃ្លា)" },
  { key: "unique", label: "Unique characters", km: "តួអក្សរផ្សេងគ្នា" },
  { key: "consonants", label: "Khmer consonants", km: "ព្យញ្ជនៈខ្មែរ" },
  { key: "vowels", label: "Khmer dependent vowels", km: "ស្រៈនិស្ស័យខ្មែរ" },
  { key: "independent", label: "Khmer independent vowels", km: "ស្រៈពេញតួខ្មែរ" },
  { key: "diacritics", label: "Khmer diacritics", km: "វណ្ណយុត្តិខ្មែរ" },
  { key: "coeng", label: "Coeng (subscript) markers", km: "សញ្ញាជើង (្)" },
  { key: "digits", label: "Khmer digits", km: "លេខខ្មែរ" },
] as const;

export default function KhmerTextStats() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState(
    "khmer-text-stats:input",
    "ភាសាខ្មែរជាភាសាជាតិរបស់កម្ពុជា។ សូមអនុវត្តការសរសេរ១០០០ដង។"
  );

  const stats = useMemo(() => {
    const chars = Array.from(input);
    const noSpace = chars.filter((c) => !/\s/.test(c));
    const count = (re: RegExp) => (input.match(re) ?? []).length;
    return {
      words: input.trim() ? input.trim().split(/\s+/).length : 0,
      lines: input.split("\n").filter((l) => l.trim()).length,
      chars: chars.length,
      charsNoSpace: noSpace.length,
      unique: new Set(chars).size,
      consonants: count(CONSONANT_RE),
      vowels: count(DEPENDENT_VOWEL_RE),
      independent: count(INDEPENDENT_VOWEL_RE),
      diacritics: count(DIACRITIC_RE),
      coeng: count(COENG_RE),
      digits: count(KHMER_DIGIT_RE),
    };
  }, [input]);

  return (
    <ToolShell
      title="Khmer Text Stats"
      khmerTitle="ស្ថិតិអត្ថបទខ្មែរ"
      description="Count words, characters, unique characters and Khmer letters — consonants, vowels, diacritics and coeng markers — using Khmer Unicode ranges."
      descriptionKm="រាប់ពាក្យ តួអក្សរ តួអក្សរផ្សេងគ្នា និងអក្សរខ្មែរ — ព្យញ្ជនៈ ស្រៈ វណ្ណយុត្តិ និងសញ្ញាជើង — ដោយប្រើជួរ Unicode របស់ខ្មែរ។"
    >
      <Field label={t("Text", "អត្ថបទ")}>
        <TextArea rows={7} value={input} onChange={(e) => setInput(e.target.value)} className="font-khmer" />
      </Field>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {STAT_ITEMS.map((item) => (
          <div
            key={item.key}
            className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3"
          >
            <div className="text-2xl font-semibold text-[var(--gold)]">{stats[item.key]}</div>
            <div className="mt-0.5 text-xs uppercase tracking-wide text-[var(--ink-dim)]">
              {t(item.label, item.km)}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Counts use the Khmer Unicode block (U+1780–U+17FF): consonants U+1780–U+17A2, independent vowels U+17A3–U+17B3, dependent vowels U+17B6–U+17C5, diacritics U+17C6–U+17D1, coeng U+17D2 and digits U+17E0–U+17E9. Words are split on whitespace.",
          "ការរាប់ប្រើប្លុក Unicode ខ្មែរ (U+1780–U+17FF)៖ ព្យញ្ជនៈ U+1780–U+17A2 ស្រៈពេញតួ U+17A3–U+17B3 ស្រៈនិស្ស័យ U+17B6–U+17C5 វណ្ណយុត្តិ U+17C6–U+17D1 ជើង U+17D2 និងលេខ U+17E0–U+17E9។ ពាក្យត្រូវបំបែកតាមដកឃ្លា។"
        )}
      </p>
    </ToolShell>
  );
}
