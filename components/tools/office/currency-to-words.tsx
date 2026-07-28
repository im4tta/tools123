"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const SCALES = ["", "thousand", "million", "billion", "trillion"];

function threeDigits(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(ONES[Math.floor(n / 100)] + " hundred");
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : ""));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
}

function spellInteger(n: number): string {
  if (n === 0) return "zero";
  const groups: number[] = [];
  let rem = n;
  while (rem > 0) {
    groups.push(rem % 1000);
    rem = Math.floor(rem / 1000);
  }
  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue;
    words.push(threeDigits(groups[i]) + (SCALES[i] ? " " + SCALES[i] : ""));
  }
  return words.join(" ");
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface State {
  amount: string;
  currency: string;
  style: "cheque" | "prose";
}

export default function CurrencyToWordsTool() {
  const [s, setS] = useToolState<State>("currency-to-words", { amount: "1234.56", currency: "Dollars", style: "cheque" });
  const update = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => {
    const clean = s.amount.replace(/,/g, "").trim();
    const value = Number(clean);
    if (!Number.isFinite(value) || value < 0 || value >= 1_000_000_000_000) return null;
    const whole = Math.floor(value);
    const cents = Math.round((value - whole) * 100);
    const wholeWords = capitalize(spellInteger(whole));
    if (s.style === "cheque") {
      return `${wholeWords} ${s.currency} and ${String(cents).padStart(2, "0")}/100`;
    }
    const centsWords = cents > 0 ? ` and ${spellInteger(cents)} cents` : "";
    return `${wholeWords} ${s.currency}${centsWords}`;
  }, [s.amount, s.currency, s.style]);

  return (
    <ToolShell
      title="Currency Amount to Words"
      description="Spell out a dollar-and-cents amount in English — cheque-style ('…and 45/100') or plain prose — for invoices, cheques, and contracts."
    >
      <Row>
        <Field label="Amount">
          <TextInput value={s.amount} onChange={(e) => update({ amount: e.target.value })} className="font-mono-ui" />
        </Field>
        <Field label="Currency name">
          <TextInput value={s.currency} onChange={(e) => update({ currency: e.target.value })} />
        </Field>
      </Row>
      <Field label="Style">
        <Select value={s.style} onChange={(e) => update({ style: e.target.value as State["style"] })} className="w-56">
          <option value="cheque">Cheque style (…and 45/100)</option>
          <option value="prose">Prose (…and 45 cents)</option>
        </Select>
      </Field>
      <Output label="In words" value={result ?? "Enter a valid amount less than 1 trillion."} error={!result} mono={false} />
    </ToolShell>
  );
}
