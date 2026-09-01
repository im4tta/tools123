"use client";
import { ToolShell, Field, TextArea, Row } from "@/components/ui/Shell";
import { CopyButton } from "@/components/CopyButton";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// Standard ITU Morse table (letters, digits and common punctuation).
const MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
  I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
  Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....",
  "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--",
  "/": "-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...",
  ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-", "_": "..--.-",
  '"': ".-..-.", "$": "...-..-", "@": ".--.-.",
};

const MORSE_TO_CHAR: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE).map(([k, v]) => [v, k])
);

function textToMorse(text: string): string {
  return text
    .toUpperCase()
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((word) =>
      word
        .split("")
        .map((ch) => MORSE[ch] ?? "")
        .filter((m) => m.length > 0)
        .join(" ")
    )
    .join(" / ");
}

function morseToText(morse: string): string {
  return morse
    .trim()
    .split("/")
    .map((word) =>
      word
        .trim()
        .split(/\s+/)
        .map((token) => MORSE_TO_CHAR[token] ?? "?")
        .join("")
    )
    .filter((w) => w.length > 0)
    .join(" ");
}

export default function MorseCodeTranslator() {
  const { text: t } = useLanguage();
  const [textValue, setTextValue] = useToolState("morse:text", "");
  const [morseValue, setMorseValue] = useToolState("morse:morse", "");

  const onTextChange = (v: string) => {
    setTextValue(v);
    setMorseValue(textToMorse(v));
  };

  const onMorseChange = (v: string) => {
    setMorseValue(v);
    setTextValue(morseToText(v));
  };

  return (
    <ToolShell
      title="Morse Code Translator"
      khmerTitle="អ្នកបកប្រែកូដម៉ូស"
      description="Translate text to Morse code and back, live in both directions, using the standard ITU table."
      descriptionKm="បកប្រែអក្សរទៅជាកូដម៉ូស និងបកត្រឡប់ ភ្លាមៗទាំងពីរទិស ដោយប្រើតារាងស្តង់ដារ ITU។"
    >
      <Row>
        <Field label={t("English text", "អក្សរអង់គ្លេស")}>
          <TextArea
            rows={6}
            value={textValue}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={t("Type English text…", "វាយអក្សរអង់គ្លេស…")}
          />
          <div className="mt-1.5 flex justify-end">
            <CopyButton text={textValue} />
          </div>
        </Field>
        <Field label={t("Morse code", "កូដម៉ូស")}>
          <TextArea
            rows={6}
            value={morseValue}
            onChange={(e) => onMorseChange(e.target.value)}
            placeholder={t("Type Morse… (letters by space, words by /)", "វាយកូដម៉ូស… (អក្សរដោយដកឃ្លា ពាក្យដោយ /)")}
          />
          <div className="mt-1.5 flex justify-end">
            <CopyButton text={morseValue} />
          </div>
        </Field>
      </Row>

      <p className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Uses the standard ITU Morse table. Letters are separated by spaces and words by “/”. Characters without a Morse code (e.g. Khmer script) are skipped in text→Morse; unknown tokens show as “?” in Morse→text.",
          "ប្រើតារាងស្តង់ដារ ITU។ អក្សរបំបែកដោយដកឃ្លា ហើយពាក្យបំបែកដោយ “/”។ តួអក្សរដែលគ្មានកូដម៉ូស (ដូចជាអក្សរខ្មែរ) ត្រូវរំលងក្នុងទិស អក្សរ→ម៉ូស ហើយសញ្ញាមិនស្គាល់បង្ហាញជា “?” ក្នុងទិស ម៉ូស→អក្សរ។"
        )}
      </p>
    </ToolShell>
  );
}
