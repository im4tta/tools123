"use client";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const UNIT = ["", "មួយ", "ពីរ", "បី", "បួន", "ប្រាំ", "ប្រាំមួយ", "ប្រាំពីរ", "ប្រាំបី", "ប្រាំបួន"];
const TENS: Record<number, string> = { 2: "ម្ភៃ", 3: "សាមសិប", 4: "សែសិប", 5: "ហាសិប", 6: "ហុកសិប", 7: "ចិតសិប", 8: "ប៉ែតសិប", 9: "កៅសិប" };

function spellTens(n: number): string {
  if (n === 0) return "";
  if (n < 10) return UNIT[n];
  if (n === 10) return "ដប់";
  if (n < 20) return "ដប់" + UNIT[n - 10];
  const t = Math.floor(n / 10);
  const r = n % 10;
  return TENS[t] + (r ? UNIT[r] : "");
}

function spellHundreds(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return (h ? UNIT[h] + "រយ" : "") + spellTens(r);
}

const BIG: [number, string][] = [
  [1_000_000, "លាន"],
  [100_000, "សែន"],
  [10_000, "ម៉ឺន"],
  [1_000, "ពាន់"],
];

function spell(n: number): string {
  if (n === 0) return "សូន្យ";
  let remaining = n;
  let out = "";
  for (const [value, word] of BIG) {
    const coeff = Math.floor(remaining / value);
    if (coeff > 0) {
      out += spell(coeff) + word;
      remaining %= value;
    }
  }
  out += spellHundreds(remaining);
  return out || "សូន្យ";
}

const DIGIT_NAME = ["សូន្យ", "មួយ", "ពីរ", "បី", "បួន", "ប្រាំ", "ប្រាំមួយ", "ប្រាំពីរ", "ប្រាំបី", "ប្រាំបួន"];

function spellFull(raw: string): { text: string; valid: boolean } {
  const trimmed = raw.trim();
  const negative = trimmed.startsWith("-");
  const body = negative ? trimmed.slice(1) : trimmed;
  if (!/^\d+(\.\d+)?$/.test(body)) return { text: "", valid: false };

  const [wholeStr, decStr] = body.split(".");
  const whole = Number(wholeStr);
  if (!Number.isSafeInteger(whole) || whole >= 1_000_000_000_000) return { text: "", valid: false };

  let text = spell(whole);
  if (decStr) {
    text += " ចុច " + [...decStr].map((d) => DIGIT_NAME[Number(d)]).join(" ");
  }
  if (negative && whole !== 0) text = "ដក " + text;
  return { text, valid: true };
}

export default function NumberSpellout() {
  const [input, setInput] = useToolState("number-spellout:input", "125430");
  const { text, valid } = spellFull(input);

  return (
    <ToolShell title="Khmer Number Spell-out" khmerTitle="សរសេរជាអក្សរ" description="Spell a number out in Khmer words, following the standard ដប់ / រយ / ពាន់ / ម៉ឺន / សែន / លាន place-value system. Supports negative numbers (ដក) and decimals, read digit-by-digit after ចុច — up to 999,999,999,999.">
      <Field label="Number" hint="e.g. -1234.56"><TextInput value={input} onChange={(e) => setInput(e.target.value)} className="w-56 font-mono-ui" /></Field>
      <Output value={valid ? text : "Enter a number (optionally negative or with a decimal point)."} error={!valid} mono={false} />
    </ToolShell>
  );
}
