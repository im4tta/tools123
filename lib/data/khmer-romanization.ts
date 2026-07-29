export interface ConsonantData {
  roman: string; series: 1 | 2; name: string; ipa: string; linguistic: string; pinyin: string;
}
export interface VowelData {
  s1: string; s2: string; name: string; ipa1: string; ipa2: string; linguistic: string; pinyin: string;
}
export interface SubscriptData {
  roman: string; name: string; linguistic: string;
}
export interface IndepVowelData {
  roman: string; name: string; ipa: string; linguistic: string;
}
export interface DiacriticData {
  name: string; s1?: string; s2?: string; action?: string; linguistic: string;
}

export const KHMER_CONSONANTS: Record<string, ConsonantData> = {
  "ក": { roman: "k", series: 1, name: "Ka", ipa: "kɑː", linguistic: "k", pinyin: "ka" },
  "ខ": { roman: "kh", series: 1, name: "Kha", ipa: "kʰɑː", linguistic: "kʰ", pinyin: "kha" },
  "គ": { roman: "k", series: 2, name: "Ko", ipa: "kɔː", linguistic: "g", pinyin: "ko" },
  "ឃ": { roman: "kh", series: 2, name: "Kho", ipa: "kʰɔː", linguistic: "gʰ", pinyin: "kho" },
  "ង": { roman: "ng", series: 2, name: "Ngo", ipa: "ŋɔː", linguistic: "ŋ", pinyin: "ngo" },
  "ច": { roman: "ch", series: 1, name: "Cha", ipa: "cɑː", linguistic: "c", pinyin: "ca" },
  "ឆ": { roman: "chh", series: 1, name: "Chha", ipa: "cʰɑː", linguistic: "cʰ", pinyin: "cha" },
  "ជ": { roman: "ch", series: 2, name: "Cho", ipa: "cɔː", linguistic: "ɟ", pinyin: "co" },
  "ឈ": { roman: "chh", series: 2, name: "Chho", ipa: "cʰɔː", linguistic: "ɟʰ", pinyin: "cho" },
  "ញ": { roman: "nh", series: 2, name: "Nho", ipa: "ɲɔː", linguistic: "ɲ", pinyin: "nyo" },
  "ដ": { roman: "d", series: 1, name: "Da", ipa: "ɗɑː", linguistic: "ḍ", pinyin: "da" },
  "ឋ": { roman: "th", series: 1, name: "Tha", ipa: "tʰɑː", linguistic: "ṭʰ", pinyin: "tha" },
  "ឌ": { roman: "d", series: 2, name: "Do", ipa: "ɗɔː", linguistic: "ḍ", pinyin: "do" },
  "ឍ": { roman: "th", series: 2, name: "Tho", ipa: "tʰɔː", linguistic: "ṭʰ", pinyin: "tho" },
  "ណ": { roman: "n", series: 1, name: "Na", ipa: "nɑː", linguistic: "ṇ", pinyin: "na" },
  "ត": { roman: "t", series: 1, name: "Ta", ipa: "tɑː", linguistic: "t", pinyin: "ta" },
  "ថ": { roman: "th", series: 1, name: "Tha", ipa: "tʰɑː", linguistic: "tʰ", pinyin: "tha" },
  "ទ": { roman: "t", series: 2, name: "To", ipa: "tɔː", linguistic: "d", pinyin: "to" },
  "ធ": { roman: "th", series: 2, name: "Tho", ipa: "tʰɔː", linguistic: "dʰ", pinyin: "tho" },
  "ន": { roman: "n", series: 2, name: "No", ipa: "nɔː", linguistic: "n", pinyin: "no" },
  "ប": { roman: "b", series: 1, name: "Ba", ipa: "ɓɑː", linguistic: "p", pinyin: "ba" },
  "ផ": { roman: "ph", series: 1, name: "Pha", ipa: "pʰɑː", linguistic: "pʰ", pinyin: "pha" },
  "ព": { roman: "p", series: 2, name: "Po", ipa: "pɔː", linguistic: "b", pinyin: "po" },
  "ភ": { roman: "ph", series: 2, name: "Pho", ipa: "pʰɔː", linguistic: "bʰ", pinyin: "pho" },
  "ម": { roman: "m", series: 2, name: "Mo", ipa: "mɔː", linguistic: "m", pinyin: "mo" },
  "យ": { roman: "y", series: 2, name: "Yo", ipa: "jɔː", linguistic: "y", pinyin: "yo" },
  "រ": { roman: "r", series: 2, name: "Ro", ipa: "rɔː", linguistic: "r", pinyin: "ro" },
  "ល": { roman: "l", series: 2, name: "Lo", ipa: "lɔː", linguistic: "l", pinyin: "lo" },
  "វ": { roman: "v", series: 2, name: "Vo", ipa: "vɔː", linguistic: "v", pinyin: "vo" },
  "ស": { roman: "s", series: 1, name: "Sa", ipa: "sɑː", linguistic: "s", pinyin: "sa" },
  "ហ": { roman: "h", series: 1, name: "Ha", ipa: "hɑː", linguistic: "h", pinyin: "ha" },
  "ឡ": { roman: "l", series: 1, name: "La", ipa: "lɑː", linguistic: "ḷ", pinyin: "la" },
  "អ": { roman: "q", series: 1, name: "Qa", ipa: "ʔɑː", linguistic: "ʾ", pinyin: "a" },
};

export const KHMER_VOWELS: Record<string, VowelData> = {
  "ា": { s1: "a", s2: "ea", name: "Sra Aa", ipa1: "aː", ipa2: "iə", linguistic: "ā", pinyin: "a" },
  "ិ": { s1: "e", s2: "i", name: "Sra I", ipa1: "e", ipa2: "i", linguistic: "i", pinyin: "i" },
  "ី": { s1: "ei", s2: "i", name: "Sra Ii", ipa1: "əj", ipa2: "iː", linguistic: "ī", pinyin: "i" },
  "ឹ": { s1: "oe", s2: "ue", name: "Sra U", ipa1: "ə", ipa2: "ɨ", linguistic: "ÿ", pinyin: "ue" },
  "ឺ": { s1: "oeu", s2: "ueu", name: "Sra Uu", ipa1: "əɨ", ipa2: "ɨː", linguistic: "ȳ", pinyin: "ue" },
  "ុ": { s1: "o", s2: "u", name: "Sra Uk", ipa1: "o", ipa2: "u", linguistic: "u", pinyin: "u" },
  "ូ": { s1: "ou", s2: "u", name: "Sra Oo", ipa1: "ou", ipa2: "uː", linguistic: "ū", pinyin: "u" },
  "ួ": { s1: "uo", s2: "uo", name: "Sra Uo", ipa1: "uə", ipa2: "uə", linguistic: "ua", pinyin: "uo" },
  "ើ": { s1: "aeu", s2: "oeu", name: "Sra Oe", ipa1: "aə", ipa2: "əː", linguistic: "oe", pinyin: "oe" },
  "ឿ": { s1: "uea", s2: "uea", name: "Sra Uea", ipa1: "ɨə", ipa2: "ɨə", linguistic: "īa", pinyin: "ua" },
  "ៀ": { s1: "ie", s2: "ie", name: "Sra Ia", ipa1: "iə", ipa2: "iə", linguistic: "ia", pinyin: "ia" },
  "េ": { s1: "e", s2: "e", name: "Sra E", ipa1: "ei", ipa2: "eː", linguistic: "e", pinyin: "e" },
  "ែ": { s1: "ae", s2: "ae", name: "Sra Ae", ipa1: "ae", ipa2: "ɛː", linguistic: "æ", pinyin: "ae" },
  "ៃ": { s1: "ai", s2: "ey", name: "Sra Ai", ipa1: "aj", ipa2: "ɨj", linguistic: "ai", pinyin: "ai" },
  "ោ": { s1: "ao", s2: "ou", name: "Sra Oo", ipa1: "ao", ipa2: "oː", linguistic: "o", pinyin: "ao" },
  "ៅ": { s1: "au", s2: "ov", name: "Sra Au", ipa1: "aw", ipa2: "ɨw", linguistic: "au", pinyin: "au" },
};

export const KHMER_SUBSCRIPTS: Record<string, SubscriptData> = {
  "្ក": { roman: "k", name: "Jeung Ka", linguistic: "k" },
  "្ខ": { roman: "kh", name: "Jeung Kha", linguistic: "kʰ" },
  "្គ": { roman: "k", name: "Jeung Ko", linguistic: "g" },
  "្ឃ": { roman: "kh", name: "Jeung Kho", linguistic: "gʰ" },
  "្ង": { roman: "ng", name: "Jeung Ngo", linguistic: "ŋ" },
  "្ច": { roman: "ch", name: "Jeung Cha", linguistic: "c" },
  "្ឆ": { roman: "chh", name: "Jeung Chha", linguistic: "cʰ" },
  "្ជ": { roman: "ch", name: "Jeung Cho", linguistic: "ɟ" },
  "្ឈ": { roman: "chh", name: "Jeung Chho", linguistic: "ɟʰ" },
  "្ញ": { roman: "nh", name: "Jeung Nho", linguistic: "ɲ" },
  "្ដ": { roman: "d", name: "Jeung Da", linguistic: "ḍ" },
  "្ឋ": { roman: "th", name: "Jeung Tha", linguistic: "ṭʰ" },
  "្ឌ": { roman: "d", name: "Jeung Do", linguistic: "ḍ" },
  "្ឍ": { roman: "th", name: "Jeung Tho", linguistic: "ṭʰ" },
  "្ណ": { roman: "n", name: "Jeung Na", linguistic: "ṇ" },
  "្ត": { roman: "t", name: "Jeung Ta", linguistic: "t" },
  "្ថ": { roman: "th", name: "Jeung Tha", linguistic: "tʰ" },
  "្ទ": { roman: "t", name: "Jeung To", linguistic: "d" },
  "្ធ": { roman: "th", name: "Jeung Tho", linguistic: "dʰ" },
  "្ន": { roman: "n", name: "Jeung No", linguistic: "n" },
  "្ប": { roman: "b", name: "Jeung Ba", linguistic: "p" },
  "្ផ": { roman: "ph", name: "Jeung Pha", linguistic: "pʰ" },
  "្ព": { roman: "p", name: "Jeung Po", linguistic: "b" },
  "្ភ": { roman: "ph", name: "Jeung Pho", linguistic: "bʰ" },
  "្ម": { roman: "m", name: "Jeung Mo", linguistic: "m" },
  "្យ": { roman: "y", name: "Jeung Yo", linguistic: "y" },
  "្រ": { roman: "r", name: "Jeung Ro", linguistic: "r" },
  "្ល": { roman: "l", name: "Jeung Lo", linguistic: "l" },
  "្វ": { roman: "v", name: "Jeung Vo", linguistic: "v" },
  "្ស": { roman: "s", name: "Jeung Sa", linguistic: "s" },
  "្ហ": { roman: "h", name: "Jeung Ha", linguistic: "h" },
  "្អ": { roman: "q", name: "Jeung Qa", linguistic: "ʾ" },
};

export const KHMER_INDEPENDENT_VOWELS: Record<string, IndepVowelData> = {
  "ឥ": { roman: "e", name: "Sra Ey", ipa: "ʔi", linguistic: "i" },
  "ឦ": { roman: "ei", name: "Sra Eiy", ipa: "ʔəj", linguistic: "ī" },
  "ឧ": { roman: "o", name: "Sra Uk", ipa: "ʔu", linguistic: "u" },
  "ឪ": { roman: "ov", name: "Sra Ouv", ipa: "ʔɨw", linguistic: "ū" },
  "ឫ": { roman: "rue", name: "Sra Ruy", ipa: "rɨ", linguistic: "r̥" },
  "ឬ": { roman: "ruee", name: "Sra Ruuy", ipa: "rɨː", linguistic: "r̥̄" },
  "ឭ": { roman: "lue", name: "Sra Luy", ipa: "lɨ", linguistic: "l̥" },
  "ឮ": { roman: "luee", name: "Sra Luuy", ipa: "lɨː", linguistic: "l̥̄" },
  "ឯ": { roman: "ae", name: "Sra Ae", ipa: "ʔae", linguistic: "e" },
  "ឱ": { roman: "ao", name: "Sra Ao", ipa: "ʔao", linguistic: "o" },
  "ឲ": { roman: "ao", name: "Sra Ao Variant", ipa: "ʔao", linguistic: "ō" },
};

export const KHMER_DIACRITICS: Record<string, DiacriticData> = {
  "\u17C6": { name: "Nikahit (ំ)", s1: "am", s2: "um", linguistic: "ṃ" },
  "\u17C7": { name: "Reahmuk (ះ)", s1: "ah", s2: "eah", linguistic: "ḥ" },
  "\u17CB": { name: "Bantak (់)", action: "shorten", linguistic: "̀" },
  "\u17C9": { name: "Muusikatoan (៉)", action: "shift-s1", linguistic: "̎" },
  "\u17CA": { name: "Triisap (៊)", action: "shift-s2", linguistic: "̎" },
  "\u17CD": { name: "Toandakhiat (៍)", action: "silent", linguistic: "̽" },
};

export const KHMER_NUMBERS: Record<string, string> = {
  "០": "0", "១": "1", "២": "2", "៣": "3", "៤": "4",
  "៥": "5", "៦": "6", "៧": "7", "៨": "8", "៩": "9",
};

export const EXCEPTION_DICT: Record<string, Record<string, string>> = {
  "កម្ពុជា": { ungegn: "Kampuchea", phonetic: "Cambodia", linguistic: "kambujā", pinyin: "ganpuzha", business: "Cambodia" },
  "ភាសាខ្មែរ": { ungegn: "Pheasa Khmae", phonetic: "Khmer Language", linguistic: "bhāsā khmær", pinyin: "pheasakhmae", business: "Khmer Language" },
  "ខ្មែរ": { ungegn: "Khmae", phonetic: "Khmer", linguistic: "khmær", pinyin: "khmae", business: "Khmer" },
  "ភ្នំពេញ": { ungegn: "Phnum Penh", phonetic: "Phnom Penh", linguistic: "bnum peñ", pinyin: "pnompenh", business: "Phnom Penh" },
  "សៀមរាប": { ungegn: "Siem Reab", phonetic: "Siem Reap", linguistic: "siəm rāp", pinyin: "siemreap", business: "Siem Reap" },
  "បាត់ដំបង": { ungegn: "Bat Dambang", phonetic: "Battambang", linguistic: "bāt dambaṅ", pinyin: "batdanbang", business: "Battambang" },
  "ព្រះសីហនុ": { ungegn: "Preah Sihanouk", phonetic: "Sihanoukville", linguistic: "braḥ sīhanu", pinyin: "preahsihanouk", business: "Sihanoukville" },
  "ស្រឡាញ់": { ungegn: "Sralanh", phonetic: "Srolanh", linguistic: "sralāñ", pinyin: "sralanh", business: "Srolanh" },
  "សួស្ដី": { ungegn: "Suostei", phonetic: "Sousdei", linguistic: "suəsdī", pinyin: "suosti", business: "Sousdei" },
  "ជម្រាបសួរ": { ungegn: "Chomreab Suor", phonetic: "Chomreab Sour", linguistic: "jamrāb suər", pinyin: "chomreabsour", business: "Chomreab Sour" },
  "អរគុណ": { ungegn: "Arkun", phonetic: "Orkun", linguistic: "arakuṇ", pinyin: "orkun", business: "Orkun" },
  "បាយ": { ungegn: "Bay", phonetic: "Bai", linguistic: "bāy", pinyin: "bai", business: "Bai" },
  "ទឹក": { ungegn: "Tuek", phonetic: "Teuk", linguistic: "dÿk", pinyin: "teuk", business: "Teuk" },
  "សប្បាយ": { ungegn: "Sabbay", phonetic: "Sabaay", linguistic: "sabbāy", pinyin: "sabaay", business: "Sabaay" },
  "សុខ": { ungegn: "Sokh", phonetic: "Sok", linguistic: "sukh", pinyin: "sok", business: "Sok" },
  "អង្គរវត្ត": { ungegn: "Angkor Wat", phonetic: "Angkor Wat", linguistic: "aṅgar vatt", pinyin: "angkorwat", business: "Angkor Wat" },
};

export const REVERSE_LOOKUP: Record<string, string> = {
  "suostey": "សួស្ដី", "sousdei": "សួស្ដី",
  "bay": "បាយ", "bai": "បាយ",
  "khmae": "ខ្មែរ", "khmer": "ខ្មែរ",
  "phnum penh": "ភ្នំពេញ", "phnom penh": "ភ្នំពេញ",
  "siem reab": "សៀមរាប", "siem reap": "សៀមរាប",
  "sabaay": "សប្បាយ", "sabbay": "សប្បាយ",
  "sokh": "សុខ", "sok": "សុខ",
  "cambodia": "កម្ពុជា", "kampuchea": "កម្ពុជា",
  "arkun": "អរគុណ", "orkun": "អរគុណ",
  "chomreab sour": "ជម្រាបសួរ", "angkor wat": "អង្គរវត្ត",
  "teuk": "ទឹក", "tuek": "ទឹក",
  "sri": "ស្រី",
};

export type RomanStyle = "phonetic" | "ungegn" | "linguistic" | "unicode" | "pinyin" | "business";

export const STYLE_LABELS: Record<RomanStyle, string> = {
  phonetic: "Phonetic",
  ungegn: "UNGEGN",
  linguistic: "ISO Linguistic",
  unicode: "Unicode",
  pinyin: "Pinyin-Style",
  business: "Business",
};

export function isKhmerChar(char: string | undefined): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (code >= 0x1780 && code <= 0x17FF) || (code >= 0x19E0 && code <= 0x19FF);
}

export function segmentSyllables(text: string): string[] {
  const syllables: string[] = [];
  let current = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (!isKhmerChar(char)) {
      if (current) { syllables.push(current); current = ""; }
      syllables.push(char);
      continue;
    }
    if (char === "\u17D2") {
      current += char;
      if (i + 1 < text.length) { current += text[i + 1]; i++; }
      continue;
    }
    if (char in KHMER_CONSONANTS || char in KHMER_INDEPENDENT_VOWELS) {
      if (i > 0 && text[i - 1] === "\u17D2") { current += char; }
      else { if (current) syllables.push(current); current = char; }
    } else { current += char; }
  }
  if (current) syllables.push(current);
  return syllables;
}

export function romanizeSyllable(syllable: string, style: RomanStyle): string {
  const s = syllable.trim();
  if (EXCEPTION_DICT[s]) return EXCEPTION_DICT[s][style] || EXCEPTION_DICT[s].ungegn;
  if (!isKhmerChar(s[0])) return s;
  if (style === "unicode") return [...s].map((c) => "U+" + c.charCodeAt(0).toString(16).toUpperCase()).join(" ");

  let baseConsonant = "", subscriptConsonant = "", dependentVowel = "";
  const diacritics: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c in KHMER_NUMBERS) return KHMER_NUMBERS[c];
    if (c === "\u17D2" && i + 1 < s.length) { subscriptConsonant = s[i + 1]; i++; continue; }
    if (c in KHMER_CONSONANTS) { if (!baseConsonant) baseConsonant = c; else subscriptConsonant = c; }
    else if (c in KHMER_VOWELS) dependentVowel = c;
    else if (c in KHMER_INDEPENDENT_VOWELS) baseConsonant = c;
    else if (c in KHMER_DIACRITICS) diacritics.push(c);
  }

  if (baseConsonant in KHMER_INDEPENDENT_VOWELS) {
    const iv = KHMER_INDEPENDENT_VOWELS[baseConsonant];
    return style === "linguistic" ? iv.linguistic : iv.roman;
  }

  const consData = KHMER_CONSONANTS[baseConsonant];
  if (!consData) return "";
  let series: 1 | 2 = consData.series;
  for (const d of diacritics) {
    const dd = KHMER_DIACRITICS[d];
    if (!dd) continue;
    if (dd.action === "shift-s1") series = 1;
    if (dd.action === "shift-s2") series = 2;
    if (dd.action === "silent") return "";
  }

  const leadRoman = style === "linguistic" ? consData.linguistic : style === "pinyin" ? consData.pinyin : consData.roman;
  let subRoman = "";
  if (subscriptConsonant) {
    subRoman = style === "linguistic"
      ? (KHMER_CONSONANTS[subscriptConsonant]?.linguistic || "")
      : (KHMER_CONSONANTS[subscriptConsonant]?.roman || "");
  }
  let vowelRoman = "";
  if (dependentVowel) {
    const vd = KHMER_VOWELS[dependentVowel];
    if (vd) vowelRoman = style === "linguistic" ? vd.linguistic : style === "pinyin" ? vd.pinyin : (series === 1 ? vd.s1 : vd.s2);
  } else if (!subscriptConsonant || subscriptConsonant === "រ") {
    vowelRoman = (style === "ungegn" ? (series === 1 ? "â" : "ô") : series === 1 ? "a" : "o");
  }
  for (const d of diacritics) {
    const dd = KHMER_DIACRITICS[d];
    if (!dd) continue;
    if (dd.s1) vowelRoman = style === "linguistic" ? dd.linguistic : (series === 1 ? dd.s1 : (dd.s2 ?? ""));
  }
  let finalConsonant = "";
  if (subscriptConsonant && subscriptConsonant !== "រ") finalConsonant = KHMER_CONSONANTS[subscriptConsonant]?.roman || "";
  return (leadRoman + subRoman + vowelRoman).replace(/qq/, "q").replace(/h_h/, "h");
}

export function romanizeFull(text: string, style: RomanStyle): string {
  const s = text.trim();
  if (EXCEPTION_DICT[s]) return EXCEPTION_DICT[s][style] || EXCEPTION_DICT[s].ungegn;
  return segmentSyllables(text).map((syl) => romanizeSyllable(syl, style)).join("").replace(/\s+/g, " ");
}
