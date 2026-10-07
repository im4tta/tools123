// How a clock time is said in Khmer — ម៉ោង ៨ ព្រឹក និង ១៥ នាទី — shared by the Time in Words tool
// and the Clock Reading Game. Moved here unchanged from components/tools/khmer/khmer-time-in-words.tsx.
// The day-part buckets are a common-usage guide, not a rule; real usage shifts by region/speaker.
// No React imports, so tests can run it in Node.

const KHMER_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
const toKh = (n: number) => String(n).replace(/\d/g, (d) => KHMER_DIGITS[Number(d)]);

// Khmer number words used for the fully-spelled variant. These are the
// standard Khmer numerals (មួយ…ដប់ពីរ, ដប់/ម្ភៃ/សាមសិប…), the same words
// used across Khmer number-spellout tools in this app.
const DIGIT_WORDS = ["សូន្យ", "មួយ", "ពីរ", "បី", "បួន", "ប្រាំ", "ប្រាំមួយ", "ប្រាំពីរ", "ប្រាំបី", "ប្រាំបួន"];
const TENS_WORDS = ["", "ដប់", "ម្ភៃ", "សាមសិប", "សែសិប", "ហាសិប", "ហុកសិប", "ចិតសិប", "ប៉ែតសិប", "កៅសិប"];
export const HOUR_WORDS = ["", "មួយ", "ពីរ", "បី", "បួន", "ប្រាំ", "ប្រាំមួយ", "ប្រាំពីរ", "ប្រាំបី", "ប្រាំបួន", "ដប់", "ដប់មួយ", "ដប់ពីរ"];

export function wordsBelow60(n: number): string {
  if (n < 10) return DIGIT_WORDS[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return ones === 0 ? TENS_WORDS[tens] : TENS_WORDS[tens] + DIGIT_WORDS[ones];
}

export type TimePart = { en: string; km: string; from: number; to: number };

// Sensible common-form day-part buckets (24-hour start-of-range, half-open).
// These boundaries are a guide — real Khmer usage shifts with region/speaker.
export const TIME_PARTS: TimePart[] = [
  { en: "Past midnight", km: "រំលងអាធ្រាត្រ", from: 0, to: 4 },
  { en: "Morning", km: "ព្រឹក", from: 4, to: 12 },
  { en: "Noon", km: "ថ្ងៃត្រង់", from: 12, to: 13 },
  { en: "Afternoon", km: "រសៀល", from: 13, to: 17 },
  { en: "Evening", km: "ល្ងាច", from: 17, to: 19 },
  { en: "Night", km: "យប់", from: 19, to: 24 },
];

export function partOfHour(h24: number): TimePart {
  return TIME_PARTS.find((p) => h24 >= p.from && h24 < p.to) ?? TIME_PARTS[0];
}

export const to12 = (h24: number) => {
  const r = h24 % 12;
  return r === 0 ? 12 : r;
};
export const to24 = (h12: number, pm: boolean) => {
  if (h12 === 12) return pm ? 12 : 0;
  return pm ? h12 + 12 : h12;
};

/** "ម៉ោង ៨ ព្រឹក និង ១៥ នាទី" — Khmer numerals. */
export function khmerTimePhrase(h24: number, m: number): string {
  const part = partOfHour(h24);
  const h12 = to12(h24);
  return m === 0 ? `ម៉ោង ${toKh(h12)} ${part.km}` : `ម៉ោង ${toKh(h12)} ${part.km} និង ${toKh(m)} នាទី`;
}

/** "ម៉ោង ប្រាំបី ព្រឹក និង ដប់ប្រាំ នាទី" — number words. */
export function khmerTimePhraseWords(h24: number, m: number): string {
  const part = partOfHour(h24);
  const h12 = to12(h24);
  return m === 0 ? `ម៉ោង ${HOUR_WORDS[h12]} ${part.km}` : `ម៉ោង ${HOUR_WORDS[h12]} ${part.km} និង ${wordsBelow60(m)} នាទី`;
}
