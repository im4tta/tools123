export type ScriptId =
  | "latin"
  | "khmer"
  | "cjk"
  | "viet"
  | "lao"
  | "myanmar"
  | "devanagari"
  | "bengali"
  | "tamil";

export type LanguageId =
  | "en"
  | "km"
  | "zh-hans"
  | "zh-hant"
  | "ja"
  | "ko"
  | "vi"
  | "lo"
  | "my"
  | "ms"
  | "fil"
  | "hi"
  | "bn"
  | "ta";

export type LanguageMode = "bi" | LanguageId;

export type LanguageInfo = {
  id: LanguageId;
  label: string;
  native: string;
  bcp47: string;
  script: ScriptId;
};

/** Every supported interface language. Thai is deliberately excluded. */
export const LANGUAGES: LanguageInfo[] = [
  { id: "en", label: "English", native: "English", bcp47: "en", script: "latin" },
  { id: "km", label: "Khmer", native: "ភាសាខ្មែរ", bcp47: "km", script: "khmer" },
  { id: "zh-hans", label: "Chinese (Simplified)", native: "简体中文", bcp47: "zh-Hans", script: "cjk" },
  { id: "zh-hant", label: "Chinese (Traditional)", native: "繁體中文", bcp47: "zh-Hant", script: "cjk" },
  { id: "ja", label: "Japanese", native: "日本語", bcp47: "ja", script: "cjk" },
  { id: "ko", label: "Korean", native: "한국어", bcp47: "ko", script: "cjk" },
  { id: "vi", label: "Vietnamese", native: "Tiếng Việt", bcp47: "vi", script: "viet" },
  { id: "lo", label: "Lao", native: "ລາວ", bcp47: "lo", script: "lao" },
  { id: "my", label: "Burmese", native: "မြန်မာ", bcp47: "my", script: "myanmar" },
  { id: "ms", label: "Malay", native: "Bahasa Melayu", bcp47: "ms", script: "latin" },
  { id: "fil", label: "Filipino", native: "Filipino", bcp47: "fil", script: "latin" },
  { id: "hi", label: "Hindi", native: "हिन्दी", bcp47: "hi", script: "devanagari" },
  { id: "bn", label: "Bengali", native: "বাংলা", bcp47: "bn", script: "bengali" },
  { id: "ta", label: "Tamil", native: "தமிழ்", bcp47: "ta", script: "tamil" },
];