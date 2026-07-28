"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const DIGIT_WORDS: [string, number][] = [
  ["ប្រាំមួយ", 6], ["ប្រាំពីរ", 7], ["ប្រាំបី", 8], ["ប្រាំបួន", 9], ["ប្រាំ", 5],
  ["មួយ", 1], ["ពីរ", 2], ["បី", 3], ["បួន", 4],
];
const TENS_WORDS: [string, number][] = [
  ["ដប់", 10], ["ម្ភៃ", 20], ["សាមសិប", 30], ["សែសិប", 40], ["ហាសិប", 50],
  ["ហុកសិប", 60], ["ចិតសិប", 70], ["ប៉ែតសិប", 80], ["កៅសិប", 90],
];
const MULT_WORDS: [string, number][] = [
  ["លាន", 1_000_000], ["សែន", 100_000], ["ម៉ឺន", 10_000], ["ពាន់", 1_000], ["រយ", 100],
];

type Token = { word: string; kind: "digit" | "base" | "mult"; value: number };

const ALL_TOKENS: Token[] = [
  ...DIGIT_WORDS.map(([w, v]) => ({ word: w, kind: "digit" as const, value: v })),
  ...TENS_WORDS.map(([w, v]) => ({ word: w, kind: "base" as const, value: v })),
  ...MULT_WORDS.map(([w, v]) => ({ word: w, kind: "mult" as const, value: v })),
].sort((a, b) => b.word.length - a.word.length); // longest-match-first avoids ប្រាំ swallowing ប្រាំមួយ

function parseKhmerNumber(raw: string): { value: number | null; leftover: string[] } {
  const text = raw.trim();
  if (text === "សូន្យ" || text === "0") return { value: 0, leftover: [] };

  let i = 0;
  let total = 0;
  let current = 0;
  const leftover: string[] = [];
  let matchedAny = false;

  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) { i++; continue; }

    const tok = ALL_TOKENS.find((t) => text.startsWith(t.word, i));
    if (tok) {
      matchedAny = true;
      if (tok.kind === "mult") {
        total += (current || 1) * tok.value;
        current = 0;
      } else {
        current += tok.value;
      }
      i += tok.word.length;
    } else {
      leftover.push(ch);
      i++;
    }
  }
  total += current;
  return { value: matchedAny ? total : null, leftover };
}

export default function WordToNumber() {
  const [input, setInput] = useToolState("word-to-number:input", "មួយពាន់ប្រាំរយម្ភៃបី");
  const { value, leftover } = useMemo(() => parseKhmerNumber(input), [input]);

  return (
    <ToolShell
      title="Khmer Words → Number"
      khmerTitle="អានលេខពីអក្សរ"
      description={'Parse Khmer number words back into a numeral, e.g. "មួយពាន់ប្រាំរយម្ភៃបី" → 1523. Handles the standard ដប់ / រយ / ពាន់ / ម៉ឺន / សែន / លាន place-value system — the inverse of the Number Spell-out tool.'}
    >
      <Field label="Khmer number words"><TextArea rows={3} value={input} onChange={(e) => setInput(e.target.value)} className="font-khmer text-lg" /></Field>
      <Output
        label={value === null ? "No recognizable number words found" : leftover.length ? `Parsed (ignored: ${leftover.join(" ")})` : "Number"}
        value={value === null ? "" : value.toLocaleString("en-US")}
        error={value === null}
      />
    </ToolShell>
  );
}
