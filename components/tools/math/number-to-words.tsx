"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const SCALES: [number, string][] = [[1e12, "trillion"], [1e9, "billion"], [1e6, "million"], [1e3, "thousand"]];

function underThousand(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ""));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
}

function numberToWords(n: number): string {
  if (!Number.isFinite(n)) return "";
  const negative = n < 0;
  n = Math.abs(Math.trunc(n));
  if (n === 0) return "zero";
  const parts: string[] = [];
  for (const [scale, label] of SCALES) {
    if (n >= scale) {
      parts.push(`${underThousand(Math.floor(n / scale))} ${label}`);
      n %= scale;
    }
  }
  if (n > 0) parts.push(underThousand(n));
  return (negative ? "minus " : "") + parts.join(" ");
}

export default function NumberToWords() {
  const { text: t } = useLanguage();
  const [value, setValue] = useToolState<string>("number-to-words:value", "123");

  const words = useMemo(() => {
    const n = Number(value);
    if (value.trim() === "" || Number.isNaN(n)) return null;
    if (!Number.isSafeInteger(n)) return null;
    return numberToWords(n);
  }, [value]);

  return (
    <ToolShell
      title="Number to Words"
      khmerTitle="លេខទៅជាពាក្យ"
      description="Convert an integer into English words (e.g. 123 → one hundred twenty-three)."
      descriptionKm="បម្លែងលេខទៅជាពាក្យអង់គ្លេស (ឧទា. 123 → one hundred twenty-three)។"
    >
      <Field label={t("Number", "លេខ")}>
        <TextInput value={value} onChange={(e) => setValue(e.target.value)} placeholder="123" className="font-mono-ui" />
      </Field>
      {words && <Output label={t("In words", "ជាពាក្យ")} value={words} />}
    </ToolShell>
  );
}
