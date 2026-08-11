"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { CopyButton } from "@/components/CopyButton";

const KHMER_DIGITS = ["សូន្យ", "មួយ", "ពីរ", "បី", "បួន", "ប្រាំ", "ប្រាំមួយ", "ប្រាំពីរ", "ប្រាំបី", "ប្រាំបួន"];
const KHMER_NUMERAL_CHARS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
const TENS_WORDS = ["", "ដប់", "ម្ភៃ", "សាមសិប", "សែសិប", "ហាសិប", "ហុកសិប", "ចិតសិប", "ប៉ែតសិប", "កៅសិប"];

function toKhmerNumerals(str: string) {
  return str.replace(/\d/g, (d) => KHMER_NUMERAL_CHARS[parseInt(d)]);
}

function convertUnder100(n: number): string {
  if (n < 10) return KHMER_DIGITS[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  let res = TENS_WORDS[tens];
  if (ones > 0) res += KHMER_DIGITS[ones];
  return res;
}

function convertUnder1000(n: number): string {
  if (n < 100) return convertUnder100(n);
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  let res = KHMER_DIGITS[hundreds] + "រយ";
  if (remainder > 0) res += convertUnder100(remainder);
  return res;
}

function convertModernBanking(intStr: string): string {
  let cleanStr = intStr.replace(/^0+/, "");
  if (!cleanStr) return "សូន្យ";

  const chunks: number[] = [];
  for (let i = cleanStr.length; i > 0; i -= 3) {
    const start = Math.max(0, i - 3);
    chunks.push(parseInt(cleanStr.substring(start, i), 10));
  }

  const UNITS = ["", "ពាន់", "លាន", "ពាន់លាន", "ទ្រីលីយន"];
  const parts: string[] = [];

  for (let i = chunks.length - 1; i >= 0; i--) {
    const val = chunks[i];
    if (val > 0) {
      let word = convertUnder1000(val);
      if (UNITS[i]) word += UNITS[i];
      parts.push(word);
    }
  }

  return parts.join(" ") || "សូន្យ";
}

function convertTraditional(intStr: string): string {
  const num = parseInt(intStr, 10);
  if (isNaN(num) || num === 0) return "សូន្យ";
  let n = num;
  const parts: string[] = [];

  if (n >= 1000000) {
    const millions = Math.floor(n / 1000000);
    parts.push(KHMER_DIGITS[millions] + "លាន");
    n %= 1000000;
  }
  if (n >= 100000) {
    const saen = Math.floor(n / 100000);
    parts.push(KHMER_DIGITS[saen] + "សែន");
    n %= 100000;
  }
  if (n >= 10000) {
    const muen = Math.floor(n / 10000);
    parts.push(KHMER_DIGITS[muen] + "ម៉ឺន");
    n %= 10000;
  }
  if (n >= 1000) {
    const poan = Math.floor(n / 1000);
    parts.push(KHMER_DIGITS[poan] + "ពាន់");
    n %= 1000;
  }
  if (n >= 100) {
    const roi = Math.floor(n / 100);
    parts.push(KHMER_DIGITS[roi] + "រយ");
    n %= 100;
  }
  if (n > 0) parts.push(convertUnder100(n));

  return parts.join(" ");
}

function convertSpokenDigits(str: string): string {
  return str
    .split("")
    .map((ch) => {
      if (ch >= "0" && ch <= "9") return KHMER_DIGITS[parseInt(ch)];
      if (ch === ".") return "ចុច";
      return "";
    })
    .filter(Boolean)
    .join(" ");
}

type Currency = "USD" | "KHR" | "EUR" | "NONE";
type Style = "banking" | "traditional" | "spoken";

const CURRENCY_LABELS: Record<Currency, { main: string; sub: string; symbol: string }> = {
  USD: { main: "ដុល្លារអាមេរិក", sub: "សេន", symbol: "$" },
  KHR: { main: "រៀល", sub: "សេន", symbol: "៛" },
  EUR: { main: "អឺរ៉ូ", sub: "សេន", symbol: "€" },
  NONE: { main: "", sub: "", symbol: "" },
};

function processConversion(rawInput: string, currency: Currency, style: Style) {
  const trimmed = rawInput.trim().replace(/,/g, "");
  if (!trimmed || isNaN(Number(trimmed))) return null;

  const parts = trimmed.split(".");
  const intPartStr = parts[0] || "0";
  const decPartStr = parts[1] || "";

  let textOutput = "";
  const { main: currencyMain, sub: currencySub } = CURRENCY_LABELS[currency];

  if (style === "spoken") {
    textOutput = convertSpokenDigits(trimmed);
    return { text: textOutput, numerals: toKhmerNumerals(formatNumberWithCommas(trimmed)), intPartStr, decPartStr };
  }

  if (style === "banking") textOutput = convertModernBanking(intPartStr);
  else textOutput = convertTraditional(intPartStr);

  if (currencyMain) textOutput += " " + currencyMain;

  if (decPartStr && parseInt(decPartStr, 10) > 0) {
    const centsStr = (decPartStr + "00").substring(0, 2);
    const centsVal = parseInt(centsStr, 10);
    if (centsVal > 0) {
      const centsWords = convertUnder100(centsVal);
      textOutput += currencySub ? " និង" + centsWords + currencySub : " ចុច " + convertSpokenDigits(centsStr);
    }
  } else if (currencyMain && (!decPartStr || parseInt(decPartStr, 10) === 0)) {
    textOutput += "គត់";
  }

  return { text: textOutput, numerals: toKhmerNumerals(formatNumberWithCommas(trimmed)) + (currencyMain ? " " + currencyMain : ""), intPartStr, decPartStr };
}

function formatNumberWithCommas(str: string) {
  const parts = str.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

type BreakdownEntry = { label: string; val: string; text: string };

function buildBreakdown(intPartStr: string, decPartStr: string, style: Style, currency: Currency): BreakdownEntry[] {
  const num = parseInt(intPartStr, 10);
  if (isNaN(num)) return [];
  const items: BreakdownEntry[] = [];

  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000);
    items.push({ label: "ខ្ទង់លាន (Millions)", val: formatNumberWithCommas((millions * 1000000).toString()), text: convertModernBanking(millions.toString()) + "លាន" });
  }

  const thousandsPart = Math.floor((num % 1000000) / 1000);
  if (thousandsPart > 0) {
    if (style === "banking") {
      items.push({ label: "ខ្ទង់ពាន់ (Thousands)", val: formatNumberWithCommas((thousandsPart * 1000).toString()), text: convertUnder1000(thousandsPart) + "ពាន់" });
    } else {
      const saen = Math.floor(thousandsPart / 100);
      const muen = Math.floor((thousandsPart % 100) / 10);
      const poan = thousandsPart % 10;
      if (saen > 0) items.push({ label: "ខ្ទង់សែន (Hundred Thousands)", val: formatNumberWithCommas((saen * 100000).toString()), text: KHMER_DIGITS[saen] + "សែន" });
      if (muen > 0) items.push({ label: "ខ្ទង់ម៉ឺន (Ten Thousands)", val: formatNumberWithCommas((muen * 10000).toString()), text: KHMER_DIGITS[muen] + "ម៉ឺន" });
      if (poan > 0) items.push({ label: "ខ្ទង់ពាន់ (Thousands)", val: formatNumberWithCommas((poan * 1000).toString()), text: KHMER_DIGITS[poan] + "ពាន់" });
    }
  }

  const onesPart = num % 1000;
  if (onesPart > 0) {
    items.push({ label: "ខ្ទង់រយ និងដប់ (Hundreds & Tens)", val: onesPart.toString(), text: convertUnder1000(onesPart) });
  }

  if (decPartStr && parseInt(decPartStr, 10) > 0) {
    const centsStr = (decPartStr + "00").substring(0, 2);
    const { sub: currencySub } = CURRENCY_LABELS[currency];
    items.push({ label: "ភាគកាក់ (Decimals/Cents)", val: "0." + centsStr, text: convertUnder100(parseInt(centsStr, 10)) + (currencySub || "") });
  }

  return items;
}

const CURRENCIES: { id: Currency; label: string; symbol: string }[] = [
  { id: "USD", label: "ដុល្លារ", symbol: "$" },
  { id: "KHR", label: "រៀល", symbol: "៛" },
  { id: "EUR", label: "អឺរ៉ូ", symbol: "€" },
  { id: "NONE", label: "គ្មាន", symbol: "#" },
];

const STYLES: { id: Style; label: string; note: string }[] = [
  { id: "banking", label: "ធនាគារ / ផ្លូវការ", note: "បីខ្ទង់ (ពាន់, លាន...): បួនរយម្ភៃបីពាន់" },
  { id: "traditional", label: "បុរាណ", note: "តាមខ្ទង់: បួនសែន ពីរម៉ឺន បីពាន់" },
  { id: "spoken", label: "អានតាមតួលេខ", note: "ចុច, សូន្យ, មួយ..." },
];

const PRESETS = ["1423172.42", "50000", "12345678.90", "100.50"];

export default function NumberSpellout() {
  const [input, setInput] = useToolState("number-spellout:input", "1423172.42");
  const [currency, setCurrency] = useToolState<Currency>("number-spellout:currency", "USD");
  const [style, setStyle] = useToolState<Style>("number-spellout:style", "banking");

  const result = useMemo(() => processConversion(input, currency, style), [input, currency, style]);
  const breakdown = useMemo(() => result ? buildBreakdown(result.intPartStr, result.decPartStr, style, currency) : [], [result, style, currency]);

  const invalid = !result;

  return (
    <ToolShell
      title="Khmer Number Spell-out"
      khmerTitle="សរសេរជាអក្សរ"
      description="Convert numbers to Khmer words with banking-standard formatting. Supports currency (USD/KHR/EUR), three format styles, and automatic cent conversion."
    >
      <Field label="Number" hint="e.g. 1,423,172.42">
        <TextInput value={input} onChange={(e) => setInput(e.target.value)} className="w-full font-mono-ui" />
      </Field>

      <div>
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">រូបិយវត្ថុ (Currency)</span>
        <div className="flex flex-wrap gap-2">
          {CURRENCIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCurrency(c.id)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                currency === c.id
                  ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
                  : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"
              }`}
            >
              {c.label} <span className="font-mono">{c.symbol}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">ទម្រង់សរសេរ (Style)</span>
        <div className="space-y-1.5">
          {STYLES.map((s) => (
            <label
              key={s.id}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-2.5 transition ${
                style === s.id
                  ? "border-[var(--gold)] bg-[var(--gold)]/5"
                  : "border-[var(--ground-line)] hover:border-[var(--ink-faint)]"
              }`}
            >
              <input
                type="radio"
                name="format-style"
                value={s.id}
                checked={style === s.id}
                onChange={() => setStyle(s.id)}
                className="mt-0.5 text-[var(--gold)] accent-[var(--gold)]"
              />
              <div>
                <div className="text-xs font-bold text-[var(--ink)]">{s.label}</div>
                <div className="text-[11px] text-[var(--ink-faint)]">{s.note}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">គំរូពេញនិយម (Presets)</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setInput(p)}
              className="rounded-md border border-[var(--ground-line)] px-2.5 py-1 font-mono text-xs text-[var(--ink-dim)] transition hover:border-[var(--ink-faint)]"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <Output value={invalid ? "សូមបញ្ចូលតួលេខឱ្យបានត្រឹមត្រូវ" : result.text} error={invalid} mono={false} />

      {result && (
        <div className="rounded-md border border-[var(--ground-line)] px-3 py-2.5">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">លេខខ្មែរ (Khmer Numerals)</div>
          <div className="flex items-center justify-between">
            <span className="font-bold font-khmer text-base text-[var(--ink)]">{result.numerals}</span>
            <CopyButton text={result.numerals} compact className="border-0 bg-transparent text-[var(--ink-dim)]" />
          </div>
        </div>
      )}

      {result && style !== "spoken" && (
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--danger)]/5 px-3 py-2.5">
          <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--danger)]">ការប្រៀបធៀបទម្រង់ (Correction Note)</div>
          <div className="space-y-1 text-xs leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="shrink-0 font-bold text-[var(--danger)]">❌ មិនត្រឹមត្រូវ៖</span>
              <span className="line-through text-[var(--ink-faint)]">{convertTraditional(result.intPartStr)} {CURRENCY_LABELS[currency].main}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 font-bold text-emerald-600">✅ ស្តង់ដារ៖</span>
              <span className="font-bold text-emerald-700">{result.text}</span>
            </div>
          </div>
        </div>
      )}

      {result && style !== "spoken" && (
        <div>
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">ការវិភាគតាមខ្ទង់ (Breakdown)</span>
          <div className="space-y-1">
            {breakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--gold)]" />
                  <span className="text-xs text-[var(--ink-dim)]">{item.label}</span>
                </div>
                <div className="text-right">
                  <span className="mr-2 font-mono text-xs text-[var(--ink-faint)]">[{toKhmerNumerals(item.val)}]</span>
                  <span className="text-xs font-bold text-[var(--ink)]">{item.text}</span>
                </div>
              </div>
            ))}
            {breakdown.length === 0 && (
              <div className="text-xs italic text-[var(--ink-faint)]">គ្មានទិន្នន័យ</div>
            )}
          </div>
        </div>
      )}
    </ToolShell>
  );
}
