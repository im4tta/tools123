export type IntentDomain = "conversion" | "currency" | "percentage" | "fraction" | "bmi" | "loan" | "khmer" | "tool" | "unknown";

export interface ParsedIntent {
  raw: string;
  domain: IntentDomain;
  toolId: string | null;
  confidence: number;
  values: Record<string, string | number>;
  reason: string;
}

const KHMER_DIGITS = "០១២៣៤៥៦៧៨៩";

function normalizeDigits(value: string) {
  return [...value].map((character) => {
    const index = KHMER_DIGITS.indexOf(character);
    return index >= 0 ? String(index) : character;
  }).join("");
}

function result(raw: string, domain: IntentDomain, toolId: string | null, confidence: number, values: Record<string, string | number>, reason: string): ParsedIntent {
  return { raw, domain, toolId, confidence, values, reason };
}

/** Parse common calculator-style input without executing any calculation. */
export function parseIntent(input: string): ParsedIntent {
  const raw = input.trim();
  const value = normalizeDigits(raw).toLowerCase();
  if (!value) return result(raw, "unknown", null, 0, {}, "Enter a value, question, or tool name.");

  const bmi = value.match(/bmi\s+([\d.]+)\s*(?:kg|កីឡូ)?\s+([\d.]+)\s*(?:cm|សម)?/i);
  if (bmi) return result(raw, "bmi", "universal-math-workspace", .98, { weightKg: Number(bmi[1]), heightCm: Number(bmi[2]) }, "BMI input detected.");

  const loan = value.match(/(?:loan|mortgage|ប្រាក់កម្ចី)\s+([\d,.]+)\s+([\d.]+)%\s+([\d.]+)\s*(?:years?|ឆ្នាំ)?/i);
  if (loan) return result(raw, "loan", "business-calculators", .98, { principal: Number(loan[1].replace(/,/g, "")), rate: Number(loan[2]), years: Number(loan[3]) }, "Loan terms detected.");

  const currency = value.match(/^([\d,.]+)\s*(usd|khr|riel|eur|gbp)\s+(?:to|in|ជា|ទៅ)\s+(usd|khr|riel|eur|gbp)$/i);
  if (currency) return result(raw, "currency", "riel-usd", .94, { amount: Number(currency[1].replace(/,/g, "")), from: currency[2], to: currency[3] }, "Currency conversion detected.");

  const feetAndInches = value.match(/^([\d.]+)\s*(?:ft|feet|foot|')\s*([\d.]+)\s*(?:in|inch|inches|")?$/i);
  if (feetAndInches) return result(raw, "conversion", "unit-converter", .96, { feet: Number(feetAndInches[1]), inches: Number(feetAndInches[2]) }, "Feet and inches measurement detected.");

  const conversion = value.match(/^([\d,.]+)\s*([a-zA-Z]+)\s+(?:to|in|ជា|ទៅ)\s+([a-zA-Z]+)$/i);
  if (conversion) return result(raw, "conversion", "universal-math-workspace", .97, { amount: Number(conversion[1].replace(/,/g, "")), from: conversion[2], to: conversion[3] }, "Unit conversion detected.");

  const percent = value.match(/^([\d,.]+)%\s*(?:of|នៃ)\s*([\d,.]+)$/i);
  if (percent) return result(raw, "percentage", "percentage-calculator", .97, { percent: Number(percent[1].replace(/,/g, "")), amount: Number(percent[2].replace(/,/g, "")) }, "Percentage calculation detected.");

  const fraction = value.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (fraction) return result(raw, "fraction", "universal-math-workspace", .95, { numerator: Number(fraction[1]), denominator: Number(fraction[2]) }, "Fraction detected.");

  const length = value.match(/^([\d.]+)\s*(ft|feet|foot|in|inch|cm|m|meter|metre|កម្ពស់|ម៉ែត្រ)$/i);
  if (length) return result(raw, "conversion", "universal-math-workspace", .9, { amount: Number(length[1]), unit: length[2] }, "Measurement detected.");

  if (/[\u1780-\u17ff]/.test(raw)) return result(raw, "khmer", "khmer-lexicon", .82, {}, "Khmer text detected.");
  return result(raw, "tool", null, .25, {}, "No calculation pattern matched yet.");
}

export function intentLabel(intent: ParsedIntent) {
  const labels: Record<IntentDomain, string> = {
    conversion: "Unit conversion",
    currency: "Currency conversion",
    percentage: "Percentage calculation",
    fraction: "Fraction calculation",
    bmi: "BMI calculation",
    loan: "Loan calculation",
    khmer: "Khmer language lookup",
    tool: "Tool search",
    unknown: "Universal input",
  };
  return labels[intent.domain];
}
