// Shared Khmer orthography helpers: classify a single character by its role in
// the Khmer Unicode block (U+1780–U+17FF) and expose the consonant inventory.
// Reused by the script highlighter, the consonant-skeleton extractor and other
// letter-level tools so the Unicode ranges live in one place.
//
// Ranges follow the Unicode Standard, Khmer block:
//   • U+1780–U+17A2  base consonants (ក–អ)
//   • U+17A3–U+17B3  independent vowels
//   • U+17B6–U+17C5  dependent vowel signs
//   • U+17C6–U+17DD  signs / diacritics (U+17D2 is COENG, the subscript marker)
//   • U+17D4–U+17DA  punctuation, U+17DB RIEL sign
//   • U+17E0–U+17E9  digits ០–៩,  U+17F0–U+17F9 lunar/divination digits

export type KhmerCharClass =
  | "consonant"
  | "subscript"
  | "independent"
  | "vowel"
  | "diacritic"
  | "coeng"
  | "digit"
  | "punctuation"
  | "latin"
  | "space"
  | "other";

/** The 35 base Khmer consonants, ក through អ (U+1780–U+17A2). */
export const KHMER_CONSONANTS: string[] = Array.from({ length: 0x17a2 - 0x1780 + 1 }, (_, i) => String.fromCharCode(0x1780 + i));

const COENG = 0x17d2;

function baseClass(code: number): KhmerCharClass {
  if (code >= 0x1780 && code <= 0x17a2) return "consonant";
  if (code >= 0x17a3 && code <= 0x17b3) return "independent";
  if (code >= 0x17b6 && code <= 0x17c5) return "vowel";
  if (code === COENG) return "coeng";
  if (code >= 0x17c6 && code <= 0x17dd) return "diacritic";
  if ((code >= 0x17d4 && code <= 0x17da) || code === 0x17db || code === 0x17dc) return "punctuation";
  if (code >= 0x17e0 && code <= 0x17e9) return "digit";
  if (code >= 0x17f0 && code <= 0x17f9) return "digit";
  if (/\s/.test(String.fromCharCode(code))) return "space";
  if (/[A-Za-z0-9]/.test(String.fromCharCode(code))) return "latin";
  return "other";
}

/** Classify a single character. `prev` lets a consonant after COENG (្) read as a subscript. */
export function classifyKhmerChar(ch: string, prev?: string): KhmerCharClass {
  const code = ch.codePointAt(0) ?? 0;
  const cls = baseClass(code);
  if (cls === "consonant" && prev && prev.codePointAt(0) === COENG) return "subscript";
  return cls;
}

/** True for a base or subscript Khmer consonant (U+1780–U+17A2). */
export function isKhmerConsonant(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  return code >= 0x1780 && code <= 0x17a2;
}

/** True for a Khmer independent vowel (ឥ, ឧ, ឯ …). */
export function isKhmerIndependentVowel(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  return code >= 0x17a3 && code <= 0x17b3;
}
