// Shared NIIDA standard Khmer Unicode keyboard layout (base + Shift layers),
// laid out on the physical US QWERTY positions, plus helpers to remap text that
// was typed on the wrong active layout.
//
// Source: Microsoft "Khmer (NIDA)" keyboard tables (kbdkni.dll) and Keyman's
// "Khmer Angkor" documentation, both of which follow the NiDA standard.
//
// Kept in one place so the keyboard reference tool and the layout converter
// share a single source of truth for the mapping.

export type KeyDef = { id: string; base: string; shift: string };

export const KEY_ROWS: KeyDef[][] = [
  [
    { id: "`", base: "«", shift: "»" },
    { id: "1", base: "១", shift: "!" },
    { id: "2", base: "២", shift: "ៗ" },
    { id: "3", base: "៣", shift: "\"" },
    { id: "4", base: "៤", shift: "៛" },
    { id: "5", base: "៥", shift: "%" },
    { id: "6", base: "៦", shift: "៍" },
    { id: "7", base: "៧", shift: "័" },
    { id: "8", base: "៨", shift: "៏" },
    { id: "9", base: "៩", shift: "(" },
    { id: "0", base: "០", shift: ")" },
    { id: "-", base: "ឥ", shift: "៌" },
    { id: "=", base: "ឲ", shift: "=" },
  ],
  [
    { id: "q", base: "ឆ", shift: "ឈ" },
    { id: "w", base: "ឹ", shift: "ឺ" },
    { id: "e", base: "េ", shift: "ែ" },
    { id: "r", base: "រ", shift: "ឬ" },
    { id: "t", base: "ត", shift: "ទ" },
    { id: "y", base: "យ", shift: "ួ" },
    { id: "u", base: "ុ", shift: "ូ" },
    { id: "i", base: "ិ", shift: "ី" },
    { id: "o", base: "ោ", shift: "ៅ" },
    { id: "p", base: "ផ", shift: "ភ" },
    { id: "[", base: "ៀ", shift: "ឿ" },
    { id: "]", base: "ឪ", shift: "ឧ" },
  ],
  [
    { id: "a", base: "ា", shift: "ាំ" },
    { id: "s", base: "ស", shift: "ៃ" },
    { id: "d", base: "ដ", shift: "ឌ" },
    { id: "f", base: "ថ", shift: "ធ" },
    { id: "g", base: "ង", shift: "អ" },
    { id: "h", base: "ហ", shift: "ះ" },
    { id: "j", base: "្", shift: "ញ" },
    { id: "k", base: "ក", shift: "គ" },
    { id: "l", base: "ល", shift: "ឡ" },
    { id: ";", base: "ើ", shift: "ោះ" },
    { id: "'", base: "់", shift: "៉" },
    { id: "\\", base: "ឮ", shift: "ឭ" },
  ],
  [
    { id: "z", base: "ឋ", shift: "ឍ" },
    { id: "x", base: "ខ", shift: "ឃ" },
    { id: "c", base: "ច", shift: "ជ" },
    { id: "v", base: "វ", shift: "េះ" },
    { id: "b", base: "ប", shift: "ព" },
    { id: "n", base: "ន", shift: "ណ" },
    { id: "m", base: "ម", shift: "ំ" },
    { id: ",", base: "ុំ", shift: "ុះ" },
    { id: ".", base: "។", shift: "៕" },
    { id: "/", base: "៊", shift: "?" },
  ],
];

export const ALL_KEYS: KeyDef[] = KEY_ROWS.flat();

// US-QWERTY shifted symbol for each non-letter physical key. Letters use their
// uppercase form. Used to reconstruct what the key would have produced on the
// US-English layout.
const US_SHIFT: Record<string, string> = {
  "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^",
  "7": "&", "8": "*", "9": "(", "0": ")", "-": "_", "=": "+",
  "[": "{", "]": "}", "\\": "|", ";": ":", "'": "\"", ",": "<", ".": ">", "/": "?",
};

/** What the physical key produces on the US-English layout, base layer. */
export function usBase(id: string): string {
  return id;
}
/** What the physical key produces on the US-English layout, Shift layer. */
export function usShift(id: string): string {
  return US_SHIFT[id] ?? id.toUpperCase();
}

// US-English character -> NIIDA Khmer output for the same physical key/layer.
// Use when you meant to type Khmer but the English layout was active.
const LATIN_TO_KHMER: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const key of ALL_KEYS) {
    map[usBase(key.id)] = key.base;
    map[usShift(key.id)] = key.shift;
  }
  return map;
})();

// NIIDA Khmer output -> US-English character for the same physical key/layer.
// Sorted by source length (desc) so multi-char sequences (e.g. "ាំ", "ោះ")
// match greedily before their single-character prefixes.
const KHMER_TO_LATIN: Array<[string, string]> = (() => {
  const pairs: Array<[string, string]> = [];
  const seen = new Set<string>();
  for (const key of ALL_KEYS) {
    for (const [khmer, latin] of [[key.base, usBase(key.id)], [key.shift, usShift(key.id)]] as const) {
      if (seen.has(khmer)) continue; // first key wins on the rare collision
      seen.add(khmer);
      pairs.push([khmer, latin]);
    }
  }
  return pairs.sort((a, b) => b[0].length - a[0].length);
})();

/**
 * Remap text that was typed on the US-English layout when the NIIDA Khmer
 * layout was intended. Characters not on the layout pass through unchanged.
 */
export function convertLatinToKhmer(text: string): string {
  let out = "";
  for (const ch of text) out += LATIN_TO_KHMER[ch] ?? ch;
  return out;
}

/**
 * Remap text that was typed on the NIIDA Khmer layout when the US-English
 * layout was intended. Uses greedy longest-match; unknown characters pass
 * through unchanged.
 */
export function convertKhmerToLatin(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    let matched = false;
    for (const [khmer, latin] of KHMER_TO_LATIN) {
      if (khmer && text.startsWith(khmer, i)) {
        out += latin;
        i += khmer.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += text[i];
      i += 1;
    }
  }
  return out;
}
