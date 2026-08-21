"use client";
import { useMemo, useState } from "react";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";

const LETTERS: Record<string, string> = {
  a: "⠁", b: "⠃", c: "⠉", d: "⠙", e: "⠑", f: "⠋", g: "⠛", h: "⠓", i: "⠊", j: "⠚",
  k: "⠅", l: "⠇", m: "⠍", n: "⠝", o: "⠕", p: "⠏", q: "⠟", r: "⠗", s: "⠎", t: "⠞",
  u: "⠥", v: "⠧", w: "⠺", x: "⠭", y: "⠽", z: "⠵",
};

const PUNCT: Record<string, string> = {
  ".": "⠲", ",": "⠂", "?": "⠦", "!": "⠖", "'": "⠄", "-": "⠤", ":": "⠱", ";": "⠹",
};

const REVERSE: Record<string, string> = Object.fromEntries([
  ...Object.entries(LETTERS).map(([k, v]) => [v, k]),
  ...Object.entries(PUNCT).map(([k, v]) => [v, k]),
]);

const DIGIT_ORDER = "abcdefghij";

function encode(text: string): string {
  let out = "";
  let numMode = false;
  for (const ch of text) {
    const lower = ch.toLowerCase();
    if (ch >= "A" && ch <= "Z") {
      out += "⠠";
      numMode = false;
    }
    if (ch >= "0" && ch <= "9") {
      if (!numMode) {
        out += "⠼";
        numMode = true;
      }
      const idx = ch === "0" ? 9 : Number(ch) - 1;
      out += LETTERS[DIGIT_ORDER[idx]];
      continue;
    }
    if (LETTERS[lower]) {
      numMode = false;
      out += LETTERS[lower];
    } else if (PUNCT[ch]) {
      out += PUNCT[ch];
    } else if (ch === "\n") {
      out += "\n";
      numMode = false;
    } else if (ch === " ") {
      out += " ";
      numMode = false;
    }
  }
  return out;
}

function decode(text: string): string {
  let out = "";
  let numMode = false;
  for (const ch of text) {
    if (ch === " ") {
      out += " ";
      numMode = false;
      continue;
    }
    if (ch === "\n") {
      out += "\n";
      numMode = false;
      continue;
    }
    if (ch === "⠼") {
      numMode = true;
      continue;
    }
    if (ch === "⠠") continue;
    const mapped = REVERSE[ch];
    if (!mapped) continue;
    if (numMode) {
      const idx = DIGIT_ORDER.indexOf(mapped);
      if (idx >= 0) {
        out += idx === 9 ? "0" : String(idx + 1);
        continue;
      }
      numMode = false;
    }
    out += mapped;
  }
  return out;
}

export default function BrailleTranslator() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useState<"toBraille" | "toText">("toBraille");
  const [input, setInput] = useState("Hello world 123");

  const output = useMemo(() => (mode === "toBraille" ? encode(input) : decode(input)), [input, mode]);

  return (
    <ToolShell
      title="Braille Translator"
      khmerTitle="កម្មវិធីបកប្រែអក្សរប្រៃយ៍"
      description="Convert text to grade-1 braille and back using Unicode braille patterns."
      descriptionKm="បម្លែងអត្ថបទទៅជាអក្សរប្រៃយ៍កម្រិត១ និងត្រឡប់វិញ ដោយប្រើយូនីកូដប្រៃយ៍។"
    >
      <div className="space-y-4">
        <Field label={t("Direction", "ទិសដៅ")}>
          <Select value={mode} onChange={(e) => setMode(e.target.value as "toBraille" | "toText")}>
            <option value="toBraille">{t("Text → Braille", "អត្ថបទ → ប្រៃយ៍")}</option>
            <option value="toText">{t("Braille → Text", "ប្រៃយ៍ → អត្ថបទ")}</option>
          </Select>
        </Field>

        <Field label={t("Input", "ទិន្នន័យបញ្ចូល")}>
          <TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} className={mode === "toText" ? "text-2xl leading-relaxed" : ""} />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Output", "លទ្ធផល")}</span>
            <CopyButton text={output} compact />
          </div>
          <div className={`min-h-24 whitespace-pre-wrap break-words rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5 text-sm text-[var(--ink)] ${mode === "toBraille" ? "text-2xl leading-relaxed" : ""}`}>
            {output || " "}
          </div>
        </div>

        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
          {t("Grade-1 braille only: letters, digits, and basic punctuation. Contractions (grade 2) are not supported.", "អក្សរប្រៃយ៍កម្រិត១ប៉ុណ្ណោះ៖ អក្សរ លេខ និងសញ្ញាវណ្ណយុត្តិសាមញ្ញ។ គ្មានការបង្រួម (កម្រិត២) ទេ។")}
        </p>
      </div>
    </ToolShell>
  );
}