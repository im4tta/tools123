"use client";
import { useState } from "react";
import { ToolShell } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

// Curated, approximate pronunciation reference for learners. Sounds are given
// with approximate English equivalents (the â/ô transcription used in common
// Khmer textbooks) — NOT an official IPA reference. See the bilingual footnote.
type Consonant = {
  letter: string;
  roman: string;
  sound: string;
  series: 1 | 2;
  example: string;
  gloss: { en: string; km: string };
};

type Vowel = {
  sign: string;
  series1: string;
  series2: string;
  sound: string;
  example: string;
  gloss: { en: string; km: string };
};

const CONSONANTS: Consonant[] = [
  { letter: "ក", roman: "kâ", sound: "k as in skate", series: 1, example: "ក", gloss: { en: "neck", km: "ក" } },
  { letter: "ខ", roman: "khâ", sound: "kh as in kite (aspirated)", series: 1, example: "ខែ", gloss: { en: "moon", km: "ខែ" } },
  { letter: "គ", roman: "kô", sound: "k as in skate, low tone", series: 2, example: "គោ", gloss: { en: "ox / cow", km: "គោ" } },
  { letter: "ឃ", roman: "khô", sound: "kh as in kite, low tone", series: 2, example: "ឃ្លាន", gloss: { en: "hungry", km: "ឃ្លាន" } },
  { letter: "ង", roman: "ngô", sound: "ng as in sing", series: 2, example: "ងូត", gloss: { en: "to bathe", km: "ងូត" } },
  { letter: "ច", roman: "châ", sound: "ch as in chat (unaspirated)", series: 1, example: "ចាន", gloss: { en: "plate / bowl", km: "ចាន" } },
  { letter: "ឆ", roman: "chhâ", sound: "ch as in chat (aspirated)", series: 1, example: "ឆ្មា", gloss: { en: "cat", km: "ឆ្មា" } },
  { letter: "ជ", roman: "chô", sound: "ch, low tone", series: 2, example: "ជើង", gloss: { en: "foot / leg", km: "ជើង" } },
  { letter: "ឈ", roman: "chhô", sound: "ch as in chat, aspirated, low tone", series: 2, example: "ឈើ", gloss: { en: "wood", km: "ឈើ" } },
  { letter: "ញ", roman: "ñô", sound: "ny as in canyon", series: 2, example: "ញ៉ាំ", gloss: { en: "to eat (colloquial)", km: "ញ៉ាំ" } },
  { letter: "ដ", roman: "dâ", sound: "d as in dog", series: 1, example: "ដី", gloss: { en: "earth / land", km: "ដី" } },
  { letter: "ឋ", roman: "thâ", sound: "t as in top (retroflex)", series: 1, example: "ឋាន", gloss: { en: "place", km: "ឋាន" } },
  { letter: "ឌ", roman: "dô", sound: "d as in dog, low tone", series: 2, example: "ឌីវីឌី", gloss: { en: "DVD", km: "ឌីវីឌី" } },
  { letter: "ឍ", roman: "thô", sound: "t as in top, low tone (rare letter)", series: 2, example: "វឌ្ឍនៈ", gloss: { en: "development", km: "វឌ្ឍនៈ" } },
  { letter: "ណ", roman: "nâ", sound: "n as in no (retroflex)", series: 2, example: "ណាស់", gloss: { en: "very", km: "ណាស់" } },
  { letter: "ត", roman: "tâ", sound: "t as in stop (unaspirated)", series: 1, example: "ត្រី", gloss: { en: "fish", km: "ត្រី" } },
  { letter: "ថ", roman: "thâ", sound: "t as in top (aspirated)", series: 1, example: "ថ្ម", gloss: { en: "stone / rock", km: "ថ្ម" } },
  { letter: "ទ", roman: "tô", sound: "t, low tone", series: 2, example: "ទឹក", gloss: { en: "water", km: "ទឹក" } },
  { letter: "ធ", roman: "thô", sound: "t as in top, aspirated, low tone", series: 2, example: "ធំ", gloss: { en: "big", km: "ធំ" } },
  { letter: "ន", roman: "nô", sound: "n as in no, low tone", series: 2, example: "នំ", gloss: { en: "cake / snack", km: "នំ" } },
  { letter: "ប", roman: "bâ", sound: "b as in boy", series: 1, example: "បាយ", gloss: { en: "cooked rice / meal", km: "បាយ" } },
  { letter: "ផ", roman: "phâ", sound: "p as in put (aspirated)", series: 1, example: "ផ្ទះ", gloss: { en: "house", km: "ផ្ទះ" } },
  { letter: "ព", roman: "pô", sound: "p, low tone", series: 2, example: "ព្រៃ", gloss: { en: "forest", km: "ព្រៃ" } },
  { letter: "ភ", roman: "phô", sound: "p as in put, aspirated, low tone", series: 2, example: "ភ្នំ", gloss: { en: "mountain", km: "ភ្នំ" } },
  { letter: "ម", roman: "mô", sound: "m as in man", series: 2, example: "មេឃ", gloss: { en: "sky", km: "មេឃ" } },
  { letter: "យ", roman: "yô", sound: "y as in yes", series: 2, example: "យប់", gloss: { en: "night", km: "យប់" } },
  { letter: "រ", roman: "rô", sound: "r as in run (often flapped)", series: 1, example: "រៀន", gloss: { en: "to learn", km: "រៀន" } },
  { letter: "ល", roman: "lô", sound: "l as in love", series: 2, example: "លុយ", gloss: { en: "money", km: "លុយ" } },
  { letter: "វ", roman: "vô", sound: "v as in van", series: 2, example: "វែង", gloss: { en: "long", km: "វែង" } },
  { letter: "ស", roman: "sâ", sound: "s as in see", series: 1, example: "ស្រី", gloss: { en: "woman", km: "ស្រី" } },
  { letter: "ហ", roman: "hâ", sound: "h as in hat", series: 1, example: "ហោះ", gloss: { en: "to fly", km: "ហោះ" } },
  { letter: "ឡ", roman: "lâ", sound: "l as in love", series: 2, example: "ឡាន", gloss: { en: "car", km: "ឡាន" } },
  { letter: "អ", roman: "ʼâ", sound: "silent / glottal stop before a vowel", series: 1, example: "អាច", gloss: { en: "can / able", km: "អាច" } },
];

const VOWELS: Vowel[] = [
  { sign: "◌ា", series1: "a", series2: "ie·a", sound: "long a as in father / ie-ah", example: "ស្រា", gloss: { en: "wine / liquor", km: "ស្រា" } },
  { sign: "◌ិ", series1: "e", series2: "i", sound: "short i as in bit", example: "សិត", gloss: { en: "to comb", km: "សិត" } },
  { sign: "◌ី", series1: "ei", series2: "i", sound: "long i as in see", example: "បី", gloss: { en: "three", km: "បី" } },
  { sign: "◌ឹ", series1: "eu", series2: "oe", sound: "short œ, like u in put", example: "ខឹង", gloss: { en: "angry", km: "ខឹង" } },
  { sign: "◌ឺ", series1: "eu", series2: "oe", sound: "long œ (no exact English equivalent)", example: "ម៉ឺន", gloss: { en: "ten thousand", km: "ម៉ឺន" } },
  { sign: "◌ុ", series1: "o", series2: "u", sound: "short u as in put", example: "តុ", gloss: { en: "table", km: "តុ" } },
  { sign: "◌ូ", series1: "o", series2: "u", sound: "long u as in too", example: "មូល", gloss: { en: "round", km: "មូល" } },
  { sign: "◌ើ", series1: "aeu", series2: "eu", sound: "ə as in ago, lengthened", example: "បើ", gloss: { en: "if", km: "បើ" } },
  { sign: "◌ែ", series1: "ae", series2: "e", sound: "æ as in cat", example: "ស្រែ", gloss: { en: "rice field", km: "ស្រែ" } },
  { sign: "◌ៃ", series1: "ai", series2: "ei", sound: "ai as in Thai", example: "ថ្ងៃ", gloss: { en: "day", km: "ថ្ងៃ" } },
  { sign: "◌ោ", series1: "ao", series2: "oo", sound: "long o as in go", example: "កោះ", gloss: { en: "island", km: "កោះ" } },
  { sign: "◌ៅ", series1: "au", series2: "ou", sound: "ou as in though", example: "ចៅ", gloss: { en: "grandchild", km: "ចៅ" } },
];

export default function KhmerPronunciationGuide() {
  const { text: t } = useLanguage();
  const [sel, setSel] = useState<{ group: "c" | "v"; index: number }>({ group: "c", index: 0 });

  const isConsonant = sel.group === "c";
  const letter = isConsonant ? CONSONANTS[sel.index].letter : VOWELS[sel.index].sign;
  const roman = isConsonant ? CONSONANTS[sel.index].roman : `${VOWELS[sel.index].series1} / ${VOWELS[sel.index].series2}`;
  const sound = isConsonant ? CONSONANTS[sel.index].sound : VOWELS[sel.index].sound;
  const example = isConsonant ? CONSONANTS[sel.index].example : VOWELS[sel.index].example;
  const gloss = isConsonant ? CONSONANTS[sel.index].gloss : VOWELS[sel.index].gloss;
  const seriesLabel = isConsonant
    ? CONSONANTS[sel.index].series === 1
      ? t("1st series", "វគ្គទី ១")
      : t("2nd series", "វគ្គទី ២")
    : null;

  return (
    <ToolShell
      title="Khmer Pronunciation Guide"
      khmerTitle="មគ្គុទ្ទេសក៍ការបញ្ចេញសំឡេងខ្មែរ"
      description="Interactive reference for the 33 Khmer consonants and the dependent vowels, with approximate English sound equivalents and example words."
      descriptionKm="ឯកសារយោងអន្តរកម្មសម្រាប់ព្យញ្ជនៈទាំង ៣៣ និងស្រៈនិស្ស័យ ជាមួយសំឡេងប្រហាក់ប្រហែលជាភាសាអង់គ្លេស និងពាក្យឧទាហរណ៍។"
    >
      <p className="text-sm text-[var(--ink-dim)]">
        {t(
          "Select a letter to see its approximate pronunciation and an example word.",
          "ជ្រើសរើសអក្សរណាមួយ ដើម្បីមើលការបញ្ចេញសំឡេងប្រហាក់ប្រហែល និងពាក្យឧទាហរណ៍។"
        )}
      </p>

      <div>
        <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
          {t("Consonants (33)", "ព្យញ្ជនៈ (៣៣)")}
        </h2>
        <div className="mt-2 grid grid-cols-6 gap-2 sm:grid-cols-9">
          {CONSONANTS.map((c, i) => {
            const selected = sel.group === "c" && sel.index === i;
            return (
              <button
                key={c.letter}
                type="button"
                onClick={() => setSel({ group: "c", index: i })}
                aria-pressed={selected}
                className={`rounded-md border p-3 text-center font-khmer text-2xl transition ${
                  selected
                    ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]"
                    : c.series === 1
                      ? "border-[var(--slate-accent-dim)] bg-[var(--slate-accent-dim)]/15 text-[var(--slate-accent)]"
                      : "border-[var(--teal-dim)] bg-[var(--teal-dim)]/15 text-[var(--teal)]"
                }`}
              >
                {c.letter}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
          {t("Dependent vowels", "ស្រៈនិស្ស័យ")}
        </h2>
        <div className="mt-2 grid grid-cols-6 gap-2 sm:grid-cols-12">
          {VOWELS.map((v, i) => {
            const selected = sel.group === "v" && sel.index === i;
            return (
              <button
                key={v.sign}
                type="button"
                onClick={() => setSel({ group: "v", index: i })}
                aria-pressed={selected}
                className={`rounded-md border p-3 text-center font-khmer text-2xl transition ${
                  selected
                    ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]"
                    : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink)]"
                }`}
              >
                {v.sign}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <span className="font-khmer text-5xl leading-none text-[var(--gold)]">{letter}</span>
          <div className="min-w-0 flex-1">
            <div className="font-mono-ui text-lg text-[var(--ink)]">{roman}</div>
            <div className="mt-1 text-sm text-[var(--ink-dim)]">
              {t("Approximate English sound", "សំឡេងប្រហាក់ប្រហែលជាភាសាអង់គ្លេស")}: {sound}
            </div>
            {seriesLabel ? (
              <span className="mt-2 inline-block rounded-full border border-[var(--ground-line)] px-2 py-0.5 text-[10px] font-mono-ui uppercase tracking-wide text-[var(--ink-faint)]">
                {seriesLabel}
              </span>
            ) : (
              <span className="mt-2 inline-block rounded-full border border-[var(--ground-line)] px-2 py-0.5 text-[10px] font-mono-ui uppercase tracking-wide text-[var(--ink-faint)]">
                {t("1st / 2nd series", "វគ្គទី ១ / វគ្គទី ២")}
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 border-t border-[var(--ground-line)] pt-3 text-sm">
          <span className="text-xs uppercase tracking-wide text-[var(--ink-dim)]">{t("Example", "ឧទាហរណ៍")}:</span>{" "}
          <span className="font-khmer text-xl text-[var(--ink)]">{example}</span>
          <span className="ml-2 text-xs text-[var(--ink-faint)]">— {t(gloss.en, gloss.km)}</span>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Curated approximate pronunciation guide for learners — not an official IPA reference. Sounds are described with approximate English equivalents. Dependent vowels sound different after 1st-series and 2nd-series consonants, and regional accents vary.",
          "ជាមគ្គុទ្ទេសក៍ការបញ្ចេញសំឡេងប្រហាក់ប្រហែល ចងក្រងសម្រាប់អ្នកសិក្សា — មិនមែនជាឯកសារយោង IPA ផ្លូវការទេ។ សំឡេងត្រូវបានពិពណ៌នាដោយសមមូលអង់គ្លេសប្រហាក់ប្រហែល។ ស្រៈនិស្ស័យបញ្ចេញសំឡេងខុសគ្នា អាស្រ័យលើព្យញ្ជនៈវគ្គទី១ ឬវគ្គទី២ ដែលនៅពីមុខ ហើយសំឡេងតាមតំបន់ក៏ខុសគ្នាដែរ។"
        )}
      </p>
    </ToolShell>
  );
}
