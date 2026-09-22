"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const SCALES = ["", "thousand", "million", "billion", "trillion"];

function threeDigits(n: number, sep: string): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(ONES[Math.floor(n / 100)] + " hundred");
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? sep + ONES[n % 10] : ""));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
}

function spellInteger(n: number, sep: string): string {
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
    words.push(threeDigits(groups[i], sep) + (SCALES[i] ? " " + SCALES[i] : ""));
  }
  return words.join(" ");
}

type Style = "legal" | "cheque" | "prose";
type TextCase = "title" | "sentence" | "upper" | "lower";

/** Title Case that keeps the connector "and" lower-case and never capitalises
 *  after a hyphen (so "fifty-five" stays "Fifty-five"), matching cheque style. */
function toTitleCase(s: string): string {
  return s.split(" ").map((word) => {
    if (word.toLowerCase() === "and") return "and";
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(" ");
}

function applyCase(s: string, mode: TextCase): string {
  switch (mode) {
    case "upper": return s.toUpperCase();
    case "lower": return s.toLowerCase();
    case "sentence": {
      const lower = s.toLowerCase();
      return lower.replace(/[a-z]/, (c) => c.toUpperCase());
    }
    default: return toTitleCase(s);
  }
}

interface State {
  amount: string;
  currency: string;
  subunit: string;
  style: Style;
  textCase: TextCase;
  separator: "hyphen" | "space";
}

const DEFAULT: State = {
  amount: "1,917,590.55",
  currency: "United States Dollars",
  subunit: "Cents",
  style: "legal",
  textCase: "title",
  separator: "hyphen",
};

const CURRENCY_PRESETS = ["United States Dollars", "Cambodian Riel", "Euros", "Pounds Sterling", "Australian Dollars", "Singapore Dollars", "Japanese Yen", "Thai Baht", "Chinese Yuan", "Dollars"];
const SUBUNIT_PRESETS = ["Cents", "Sen", "Pence", "Satang", "Fen"];

export default function CurrencyToWordsTool() {
  const { text: t } = useLanguage();
  const [s, setS] = useToolState<State>("currency-to-words", DEFAULT);
  const update = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => {
    const clean = s.amount.replace(/,/g, "").replace(/[$€£៛\s]/g, "").trim();
    if (!/^\d+(\.\d+)?$/.test(clean)) return null;
    const [intStr, decRaw = ""] = clean.split(".");
    const whole = parseInt(intStr || "0", 10);
    if (!Number.isFinite(whole) || whole >= 1_000_000_000_000) return null;
    const cents = parseInt((decRaw + "00").slice(0, 2), 10);

    const sep = s.separator === "hyphen" ? "-" : " ";
    const wholeWords = spellInteger(whole, sep);
    const centsWords = spellInteger(cents, sep);
    const subunit = cents === 1 && /s$/i.test(s.subunit) ? s.subunit.replace(/s$/i, "") : s.subunit;

    let raw: string;
    if (s.style === "legal") {
      raw = cents > 0
        ? `${s.currency} ${wholeWords} and ${centsWords} ${subunit}`
        : `${s.currency} ${wholeWords} only`;
    } else if (s.style === "cheque") {
      raw = `${wholeWords} ${s.currency} and ${String(cents).padStart(2, "0")}/100`;
    } else {
      raw = cents > 0 ? `${wholeWords} ${s.currency} and ${centsWords} ${subunit}` : `${wholeWords} ${s.currency}`;
    }
    return applyCase(raw, s.textCase);
  }, [s]);

  const styleOptions: { id: Style; en: string; km: string }[] = [
    { id: "legal", en: "Currency words", km: "អក្សរពេញ" },
    { id: "cheque", en: "Cheque (…and 55/100)", km: "មូលប្បទានប័ត្រ (…55/100)" },
    { id: "prose", en: "Prose (…and 55 cents)", km: "សេចក្តី (…55 សេន)" },
  ];
  const caseOptions: { id: TextCase; en: string; km: string }[] = [
    { id: "title", en: "Title Case", km: "អក្សរធំដើមពាក្យ" },
    { id: "sentence", en: "Sentence case", km: "អក្សរធំដើមប្រយោគ" },
    { id: "upper", en: "UPPERCASE", km: "អក្សរធំទាំងអស់" },
    { id: "lower", en: "lowercase", km: "អក្សរតូចទាំងអស់" },
  ];

  return (
    <ToolShell
      title="Currency Amount to Words"
      khmerTitle="សរសេរចំនួនទឹកប្រាក់ជាអក្សរ (អង់គ្លេស)"
      description="Spell out a money amount in English words for cheques, invoices, and contracts — e.g. 1,917,590.55 becomes “United States Dollars One Million Nine Hundred Seventeen Thousand Five Hundred Ninety and Fifty-five Cents”. Choose the currency and subunit, the style, hyphen or space between compound numbers, and Title / Sentence / UPPER / lower case."
      descriptionKm="សរសេរចំនួនទឹកប្រាក់ជាអក្សរអង់គ្លេស សម្រាប់មូលប្បទានប័ត្រ វិក្កយបត្រ និងកិច្ចសន្យា — ឧ. 1,917,590.55 ក្លាយជា “United States Dollars One Million Nine Hundred Seventeen Thousand Five Hundred Ninety and Fifty-five Cents”។ ជ្រើសរូបិយប័ណ្ណ និងឯកតារង ទម្រង់ សញ្ញាចុច ឬចន្លោះរវាងលេខ និងទំហំអក្សរ (Title / Sentence / ធំ / តូច)។"
    >
      <Row>
        <Field label="Amount" labelKm="ចំនួន">
          <TextInput value={s.amount} onChange={(e) => update({ amount: e.target.value })} className="font-mono-ui" inputMode="decimal" />
        </Field>
        <Field label="Currency name" labelKm="ឈ្មោះរូបិយប័ណ្ណ">
          <TextInput value={s.currency} onChange={(e) => update({ currency: e.target.value })} list="ctw-currencies" autoComplete="off" />
        </Field>
      </Row>
      <datalist id="ctw-currencies">{CURRENCY_PRESETS.map((c) => <option key={c} value={c} />)}</datalist>

      <Field label="Subunit name (cents)" labelKm="ឈ្មោះឯកតារង (សេន)">
        <TextInput value={s.subunit} onChange={(e) => update({ subunit: e.target.value })} list="ctw-subunits" autoComplete="off" className="sm:w-56" />
      </Field>
      <datalist id="ctw-subunits">{SUBUNIT_PRESETS.map((c) => <option key={c} value={c} />)}</datalist>

      <PillGroup label={t("Style", "ទម្រង់")}>
        {styleOptions.map((o) => <Pill key={o.id} active={s.style === o.id} onClick={() => update({ style: o.id })}>{t(o.en, o.km)}</Pill>)}
      </PillGroup>
      <PillGroup label={t("Letter case", "ទំហំអក្សរ")}>
        {caseOptions.map((o) => <Pill key={o.id} active={s.textCase === o.id} onClick={() => update({ textCase: o.id })}>{t(o.en, o.km)}</Pill>)}
      </PillGroup>
      <PillGroup label={t("Compound numbers", "លេខផ្សំ")}>
        <Pill active={s.separator === "hyphen"} onClick={() => update({ separator: "hyphen" })}>{t("Hyphen (Fifty-five)", "សញ្ញាចុច (Fifty-five)")}</Pill>
        <Pill active={s.separator === "space"} onClick={() => update({ separator: "space" })}>{t("Space (Fifty five)", "ចន្លោះ (Fifty five)")}</Pill>
      </PillGroup>

      <Output label="In words" value={result ?? t("Enter a valid amount less than 1 trillion.", "សូមបញ្ចូលចំនួនត្រឹមត្រូវតិចជាង ១ ទ្រីល្លាន។")} error={!result} mono={false} />

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Notes", "កំណត់សម្គាល់")}</p>
        <p>{t(
          "The whole part is spelled with the short-scale system (thousand, million, billion, trillion); cents are the first two decimal digits. Title Case keeps “and” lower-case and doesn’t capitalise after a hyphen, matching common cheque wording. For Khmer number words, use the Khmer Number Spell-out tool. Everything runs in your browser.",
          "ផ្នែកគត់សរសេរតាមប្រព័ន្ធ short-scale (thousand, million, billion, trillion) សេនគឺជាខ្ទង់ទសភាគពីរខ្ទង់ដំបូង។ Title Case ទុក “and” ជាអក្សរតូច និងមិនធ្វើអក្សរធំក្រោយសញ្ញាចុច ស្របតាមទម្រង់មូលប្បទានប័ត្រ។ សម្រាប់លេខជាអក្សរខ្មែរ សូមប្រើឧបករណ៍ សរសេរជាអក្សរ (ខ្មែរ)។ អ្វីៗដំណើរការក្នុងកម្មវិធីរុករក។",
        )}</p>
      </section>
    </ToolShell>
  );
}

function PillGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${active ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}>
      {children}
    </button>
  );
}
