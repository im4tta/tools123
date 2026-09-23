"use client";
import { useMemo, useSyncExternalStore } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Row, TextInput, ToolShell } from "@/components/ui/Shell";
import { Pill, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { CopyButton } from "@/components/CopyButton";
import { useToolState } from "@/lib/storage";

type Digits = "latn" | "khmr";
type Calendar = "gregory" | "buddhist";

interface Demo {
  id: string;
  groupEn: string;
  groupKm: string;
  code: string;
  run: () => string;
}

const noopSubscribe = () => () => {};

function safe(fn: () => string): string {
  try {
    return fn();
  } catch (e) {
    return `⚠ ${e instanceof Error ? e.message : String(e)}`;
  }
}

export default function KhmerIntlPlayground() {
  const { text: t } = useLanguage();
  const [base, setBase] = useToolState<"km" | "km-KH">("khmer-intl:base", "km");
  const [digits, setDigits] = useToolState<Digits>("khmer-intl:digits", "khmr");
  const [calendar, setCalendar] = useToolState<Calendar>("khmer-intl:calendar", "gregory");
  const [numberText, setNumberText] = useToolState("khmer-intl:number", "1234567.891");
  const [dateText, setDateText] = useToolState("khmer-intl:date", "2026-04-14T09:30");

  // Outputs depend on the viewer's browser (ICU data, time zone), so only render
  // them on the client to avoid a server/client hydration mismatch.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const locale = `${base}-u-nu-${digits}${calendar === "buddhist" ? "-ca-buddhist" : ""}`;
  const num = Number(numberText);
  const validNum = numberText.trim() !== "" && Number.isFinite(num);
  const validDate = !Number.isNaN(new Date(dateText).getTime());

  const demos: Demo[] = useMemo(() => {
    const L = JSON.stringify(locale);
    const n = validNum ? num : 0;
    const d = validDate ? new Date(dateText) : new Date(0);
    const dISO = JSON.stringify(validDate ? d.toISOString() : "");
    return [
      { id: "num", groupEn: "Numbers", groupKm: "លេខ", code: `new Intl.NumberFormat(${L}).format(${n})`, run: () => new Intl.NumberFormat(locale).format(n) },
      { id: "khr", groupEn: "Numbers", groupKm: "លេខ", code: `new Intl.NumberFormat(${L}, { style: "currency", currency: "KHR" }).format(${n})`, run: () => new Intl.NumberFormat(locale, { style: "currency", currency: "KHR" }).format(n) },
      { id: "usd", groupEn: "Numbers", groupKm: "លេខ", code: `new Intl.NumberFormat(${L}, { style: "currency", currency: "USD" }).format(${n})`, run: () => new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(n) },
      { id: "pct", groupEn: "Numbers", groupKm: "លេខ", code: `new Intl.NumberFormat(${L}, { style: "percent", maximumFractionDigits: 1 }).format(0.256)`, run: () => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(0.256) },
      { id: "compact", groupEn: "Numbers", groupKm: "លេខ", code: `new Intl.NumberFormat(${L}, { notation: "compact" }).format(${n})`, run: () => new Intl.NumberFormat(locale, { notation: "compact" }).format(n) },
      { id: "unit", groupEn: "Numbers", groupKm: "លេខ", code: `new Intl.NumberFormat(${L}, { style: "unit", unit: "kilometer-per-hour", unitDisplay: "long" }).format(60)`, run: () => new Intl.NumberFormat(locale, { style: "unit", unit: "kilometer-per-hour", unitDisplay: "long" }).format(60) },
      { id: "dfull", groupEn: "Dates & times", groupKm: "កាលបរិច្ឆេទ និងម៉ោង", code: `new Intl.DateTimeFormat(${L}, { dateStyle: "full" }).format(new Date(${dISO}))`, run: () => new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(d) },
      { id: "dlong", groupEn: "Dates & times", groupKm: "កាលបរិច្ឆេទ និងម៉ោង", code: `new Intl.DateTimeFormat(${L}, { dateStyle: "long", timeStyle: "short" }).format(date)`, run: () => new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" }).format(d) },
      { id: "dshort", groupEn: "Dates & times", groupKm: "កាលបរិច្ឆេទ និងម៉ោង", code: `new Intl.DateTimeFormat(${L}, { dateStyle: "short" }).format(date)`, run: () => new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(d) },
      { id: "month", groupEn: "Dates & times", groupKm: "កាលបរិច្ឆេទ និងម៉ោង", code: `new Intl.DateTimeFormat(${L}, { weekday: "long", month: "long" }).format(date)`, run: () => new Intl.DateTimeFormat(locale, { weekday: "long", month: "long" }).format(d) },
      { id: "rel1", groupEn: "Relative time", groupKm: "ពេលវេលាប្រៀបធៀប", code: `new Intl.RelativeTimeFormat(${L}, { numeric: "auto" }).format(-1, "day")`, run: () => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-1, "day") },
      { id: "rel2", groupEn: "Relative time", groupKm: "ពេលវេលាប្រៀបធៀប", code: `new Intl.RelativeTimeFormat(${L}).format(3, "hour")`, run: () => new Intl.RelativeTimeFormat(locale).format(3, "hour") },
      { id: "rel3", groupEn: "Relative time", groupKm: "ពេលវេលាប្រៀបធៀប", code: `new Intl.RelativeTimeFormat(${L}).format(-2, "week")`, run: () => new Intl.RelativeTimeFormat(locale).format(-2, "week") },
      { id: "list-and", groupEn: "Lists", groupKm: "បញ្ជី", code: `new Intl.ListFormat(${L}, { type: "conjunction" }).format(["ភ្នំពេញ", "សៀមរាប", "កំពត"])`, run: () => new Intl.ListFormat(locale, { type: "conjunction" }).format(["ភ្នំពេញ", "សៀមរាប", "កំពត"]) },
      { id: "list-or", groupEn: "Lists", groupKm: "បញ្ជី", code: `new Intl.ListFormat(${L}, { type: "disjunction" }).format(["តែ", "កាហ្វេ"])`, run: () => new Intl.ListFormat(locale, { type: "disjunction" }).format(["តែ", "កាហ្វេ"]) },
      { id: "plural", groupEn: "Plural rules", groupKm: "ច្បាប់ពហុវចនៈ", code: `new Intl.PluralRules(${L}).resolvedOptions().pluralCategories`, run: () => JSON.stringify(new Intl.PluralRules(locale).resolvedOptions().pluralCategories) ?? "—" },
      { id: "plural1", groupEn: "Plural rules", groupKm: "ច្បាប់ពហុវចនៈ", code: `[0, 1, 2, 5].map((n) => new Intl.PluralRules(${L}).select(n))`, run: () => JSON.stringify([0, 1, 2, 5].map((x) => new Intl.PluralRules(locale).select(x))) },
      { id: "dn-lang", groupEn: "Display names", groupKm: "ឈ្មោះបង្ហាញ", code: `new Intl.DisplayNames(${L}, { type: "language" }).of("en")`, run: () => new Intl.DisplayNames(locale, { type: "language" }).of("en") ?? "" },
      { id: "dn-region", groupEn: "Display names", groupKm: "ឈ្មោះបង្ហាញ", code: `new Intl.DisplayNames(${L}, { type: "region" }).of("TH")`, run: () => new Intl.DisplayNames(locale, { type: "region" }).of("TH") ?? "" },
      { id: "dn-cur", groupEn: "Display names", groupKm: "ឈ្មោះបង្ហាញ", code: `new Intl.DisplayNames(${L}, { type: "currency" }).of("KHR")`, run: () => new Intl.DisplayNames(locale, { type: "currency" }).of("KHR") ?? "" },
      { id: "sort", groupEn: "Sorting & segmenting", groupKm: "តម្រៀប និងបំបែក", code: `["ឆ្មា", "ក្រូច", "ខ្លា", "កាត់"].sort(new Intl.Collator(${L}).compare)`, run: () => JSON.stringify(["ឆ្មា", "ក្រូច", "ខ្លា", "កាត់"].sort(new Intl.Collator(locale).compare)) },
      { id: "seg", groupEn: "Sorting & segmenting", groupKm: "តម្រៀប និងបំបែក", code: `[...new Intl.Segmenter(${L}, { granularity: "word" }).segment("ខ្ញុំស្រលាញ់ប្រទេសកម្ពុជា")].map((s) => s.segment)`, run: () => JSON.stringify([...new Intl.Segmenter(locale, { granularity: "word" }).segment("ខ្ញុំស្រលាញ់ប្រទេសកម្ពុជា")].map((s) => s.segment)) },
      { id: "resolved", groupEn: "Sorting & segmenting", groupKm: "តម្រៀប និងបំបែក", code: `new Intl.DateTimeFormat(${L}).resolvedOptions()`, run: () => { const o = new Intl.DateTimeFormat(locale).resolvedOptions(); return JSON.stringify({ locale: o.locale, calendar: o.calendar, numberingSystem: o.numberingSystem, timeZone: o.timeZone }); } },
    ];
  }, [locale, num, dateText, validNum, validDate]);

  const groups = useMemo(() => {
    const g = new Map<string, Demo[]>();
    for (const d of demos) g.set(d.groupEn, [...(g.get(d.groupEn) ?? []), d]);
    return [...g.values()];
  }, [demos]);

  return (
    <ToolShell
      title="Khmer Intl Locale Playground"
      khmerTitle="កន្លែងសាកល្បង Intl សម្រាប់ភាសាខ្មែរ"
      description="See exactly what the browser's built-in JavaScript Intl APIs produce for the Khmer (km) locale — numbers, KHR and USD currency, percentages, dates and times, relative time (“yesterday”), lists, plural rules, display names, collation, and word segmentation — with Khmer or Arabic digits and the Gregorian or Buddhist calendar. Every row shows copy-ready code next to its live output, so you can build Khmer UIs without a formatting library."
      descriptionKm="មើលឱ្យច្បាស់ថា API Intl របស់ JavaScript ក្នុងកម្មវិធីរុករកបង្កើតអ្វីខ្លះសម្រាប់ locale ខ្មែរ (km) — លេខ រូបិយប័ណ្ណរៀល និងដុល្លារ ភាគរយ កាលបរិច្ឆេទ និងម៉ោង ពេលវេលាប្រៀបធៀប («ម្សិលមិញ») បញ្ជី ច្បាប់ពហុវចនៈ ឈ្មោះបង្ហាញ ការតម្រៀប និងការបំបែកពាក្យ — ជាមួយលេខខ្មែរ ឬលេខអារ៉ាប់ និងប្រតិទិនគ្រិស្តសករាជ ឬពុទ្ធសករាជ។ ជួរនីមួយៗបង្ហាញកូដត្រៀមចម្លងក្បែរលទ្ធផលផ្ទាល់ ដូច្នេះអ្នកអាចបង្កើត UI ខ្មែរដោយគ្មានបណ្ណាល័យធ្វើទ្រង់ទ្រាយ។"
    >
      <PillGroup label={t("Locale", "Locale")}>
        {(["km", "km-KH"] as const).map((l) => <Pill key={l} active={base === l} onClick={() => setBase(l)}>{l}</Pill>)}
      </PillGroup>
      <PillGroup label={t("Digits", "លេខ")}>
        <Pill active={digits === "khmr"} onClick={() => setDigits("khmr")}>{t("Khmer ០១២ (nu-khmr)", "ខ្មែរ ០១២ (nu-khmr)")}</Pill>
        <Pill active={digits === "latn"} onClick={() => setDigits("latn")}>{t("Arabic 012 (nu-latn)", "អារ៉ាប់ 012 (nu-latn)")}</Pill>
      </PillGroup>
      <PillGroup label={t("Calendar", "ប្រតិទិន")}>
        <Pill active={calendar === "gregory"} onClick={() => setCalendar("gregory")}>{t("Gregorian", "គ្រិស្តសករាជ")}</Pill>
        <Pill active={calendar === "buddhist"} onClick={() => setCalendar("buddhist")}>{t("Buddhist (ca-buddhist)", "ពុទ្ធសករាជ (ca-buddhist)")}</Pill>
      </PillGroup>
      <Row>
        <Field label="Number" labelKm="លេខ">
          <TextInput value={numberText} onChange={(e) => setNumberText(e.target.value)} inputMode="decimal" className="font-mono-ui" />
        </Field>
        <Field label="Date & time" labelKm="កាលបរិច្ឆេទ និងម៉ោង">
          <TextInput type="datetime-local" value={dateText} onChange={(e) => setDateText(e.target.value)} />
        </Field>
      </Row>
      {(!validNum || !validDate) && (
        <p className="text-sm text-[var(--danger)]">{t("Enter a valid number and date — invalid inputs are shown as 0 / 1970-01-01.", "បញ្ចូលលេខ និងកាលបរិច្ឆេទត្រឹមត្រូវ — តម្លៃមិនត្រឹមត្រូវបង្ហាញជា 0 / 1970-01-01។")}</p>
      )}
      <p className="text-xs text-[var(--ink-faint)]">{t("Full locale tag:", "ស្លាក locale ពេញ៖")} <code className="font-mono-ui text-[var(--ink-dim)]">{locale}</code></p>

      {groups.map((items) => (
        <section key={items[0].groupEn} className="overflow-hidden rounded-md border border-[var(--ground-line)]">
          <h2 className="bg-[var(--ground-raised)] px-3 py-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t(items[0].groupEn, items[0].groupKm)}</h2>
          <ul>
            {items.map((d) => (
              <li key={d.id} className="grid gap-1 border-t border-[var(--ground-line)] px-3 py-2.5 sm:grid-cols-[1fr_minmax(0,16rem)] sm:gap-4">
                <div className="flex min-w-0 items-start gap-2">
                  <code className="min-w-0 flex-1 break-all font-mono-ui text-xs text-[var(--ink-faint)]">{d.code}</code>
                  <CopyButton text={d.code} compact className="shrink-0 border-0 bg-transparent" />
                </div>
                <div lang="km" className="break-words font-khmer text-sm text-[var(--ink)]">{mounted ? safe(d.run) : "…"}</div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <SourceCredits>
        <p>{t(
          "Every output is produced live by your own browser's implementation of the ECMAScript Internationalization API (ECMA-402), which draws its Khmer data from the Unicode CLDR project (Unicode License v3). Nothing is hard-coded here, so results differ between browsers and versions — that is the point: check what your users will actually see. Unsupported features show a ⚠ message instead of a result.",
          "លទ្ធផលនីមួយៗត្រូវបានបង្កើតផ្ទាល់ដោយការអនុវត្ត ECMAScript Internationalization API (ECMA-402) នៃកម្មវិធីរុករករបស់អ្នក ដែលយកទិន្នន័យខ្មែរពីគម្រោង Unicode CLDR (អាជ្ញាប័ណ្ណ Unicode v3)។ គ្មានអ្វីសរសេរជាប់ក្នុងកូដទេ ដូច្នេះលទ្ធផលខុសគ្នារវាងកម្មវិធីរុករក និងកំណែ — នេះហើយជាគោលបំណង៖ ពិនិត្យអ្វីដែលអ្នកប្រើរបស់អ្នកនឹងឃើញពិតប្រាកដ។ មុខងារដែលមិនគាំទ្របង្ហាញសារ ⚠ ជំនួសលទ្ធផល។",
        )}</p>
        <p className="mt-1"><a className="underline hover:text-[var(--ink-dim)]" href="https://cldr.unicode.org/" target="_blank" rel="noreferrer">cldr.unicode.org</a> · <a className="underline hover:text-[var(--ink-dim)]" href="https://tc39.es/ecma402/" target="_blank" rel="noreferrer">tc39.es/ecma402</a></p>
      </SourceCredits>
    </ToolShell>
  );
}
