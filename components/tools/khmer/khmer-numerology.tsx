"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Output } from "@/components/ui/Output";
import { Field, Row, Select, TextInput, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

type Tab = "plates" | "names" | "birth" | "numbers" | "favorites";
type Meaning = { titleEn: string; titleKm: string; descEn: string; descKm: string };
type ScoreDetail = { char: string; value: number };

const KHMER_VALUES: Record<string, number> = {
  ក: 1, ខ: 2, គ: 3, ឃ: 4, ង: 5, ច: 6, ឆ: 7, ជ: 8, ឈ: 9, ញ: 1,
  ដ: 2, ឋ: 3, ឌ: 4, ឍ: 5, ណ: 6, ត: 7, ថ: 8, ទ: 9, ធ: 1, ន: 2,
  ប: 3, ផ: 4, ព: 5, ភ: 6, ម: 7, យ: 8, រ: 9, ល: 1, វ: 2, ស: 3, ហ: 4, ឡ: 5, អ: 6,
  "ា": 1, "ិ": 2, "ី": 3, "ឹ": 4, "ឺ": 5, "ុ": 6, "ូ": 7, "ួ": 8, "ើ": 9, "ឿ": 1,
  "ៀ": 2, "េ": 3, "ែ": 4, "ៃ": 5, "ោ": 6, "ៅ": 7, "ំ": 8, "ះ": 9, "្": 1, "៉": 2,
  "៊": 3, "៌": 4, "័": 5, "៎": 6, "៏": 7, "ៈ": 8,
  ឣ: 1, ឤ: 2, ឥ: 3, ឦ: 4, ឧ: 5, ឨ: 6, ឩ: 7, ឪ: 8, ឫ: 9, ឬ: 1,
  ឭ: 2, ឮ: 3, ឯ: 4, ឰ: 5, ឱ: 6, ឲ: 7, ឳ: 8,
};

const DIGIT_MEANINGS: Record<number, Meaning> = {
  0: { titleEn: "0 — Potential", titleKm: "លេខ ០ — សក្តានុពល", descEn: "Symbolically represents unrealized potential and an open beginning.", descKm: "ជានិមិត្តរូបនៃសក្តានុពលដែលមិនទាន់បញ្ចេញ និងការចាប់ផ្ដើមបើកចំហ។" },
  1: { titleEn: "1 — Leadership", titleKm: "លេខ ១ — ភាពជាអ្នកដឹកនាំ", descEn: "Traditionally associated with independence, initiative, and new beginnings.", descKm: "តាមជំនឿលេខវិទ្យា តំណាងឱ្យឯករាជ្យភាព ភាពផ្ដួចផ្ដើម និងការចាប់ផ្ដើមថ្មី។" },
  2: { titleEn: "2 — Partnership", titleKm: "លេខ ២ — ដៃគូ", descEn: "Traditionally associated with cooperation, gentleness, and balance.", descKm: "តាមជំនឿលេខវិទ្យា តំណាងឱ្យកិច្ចសហការ ភាពទន់ភ្លន់ និងតុល្យភាព។" },
  3: { titleEn: "3 — Creativity", titleKm: "លេខ ៣ — ភាពច្នៃប្រឌិត", descEn: "Traditionally associated with expression, creativity, and growth.", descKm: "តាមជំនឿលេខវិទ្យា តំណាងឱ្យការបញ្ចេញមតិ ភាពច្នៃប្រឌិត និងការរីកចម្រើន។" },
  4: { titleEn: "4 — Stability", titleKm: "លេខ ៤ — ស្ថិរភាព", descEn: "Traditionally associated with order, discipline, and dependable foundations.", descKm: "តាមជំនឿលេខវិទ្យា តំណាងឱ្យសណ្ដាប់ធ្នាប់ វិន័យ និងគ្រឹះដែលអាចទុកចិត្តបាន។" },
  5: { titleEn: "5 — Freedom", titleKm: "លេខ ៥ — សេរីភាព", descEn: "Traditionally associated with change, exploration, and adaptability.", descKm: "តាមជំនឿលេខវិទ្យា តំណាងឱ្យការផ្លាស់ប្ដូរ ការស្វែងយល់ និងការសម្របខ្លួន។" },

  6: { titleEn: "6 — Care", titleKm: "លេខ ៦ — ការថែរក្សា", descEn: "Traditionally associated with care, affection, family, and responsibility.", descKm: "តាមជំនឿលេខវិទ្យា តំណាងឱ្យការថែរក្សា សេចក្ដីស្រឡាញ់ គ្រួសារ និងការទទួលខុសត្រូវ។" },
  7: { titleEn: "7 — Reflection", titleKm: "លេខ ៧ — ការពិចារណា", descEn: "Traditionally associated with study, reflection, and seeking deeper understanding.", descKm: "តាមជំនឿលេខវិទ្យា តំណាងឱ្យការសិក្សា ការពិចារណា និងការស្វែងរកការយល់ដឹងស៊ីជម្រៅ។" },
  8: { titleEn: "8 — Achievement", titleKm: "លេខ ៨ — សមិទ្ធផល", descEn: "Traditionally associated with ambition, management, and material achievement.", descKm: "តាមជំនឿលេខវិទ្យា តំណាងឱ្យមហិច្ឆតា ការគ្រប់គ្រង និងសមិទ្ធផលផ្នែកសម្ភារៈ។" },
  9: { titleEn: "9 — Compassion", titleKm: "លេខ ៩ — មេត្តាករុណា", descEn: "Traditionally associated with completion, generosity, and concern for others.", descKm: "តាមជំនឿលេខវិទ្យា តំណាងឱ្យភាពពេញលេញ ចិត្តសប្បុរស និងការយកចិត្តទុកដាក់ចំពោះអ្នកដទៃ។" },
};

const LIFE_PATH: Record<number, [string, string]> = {
  1: ["An independent initiator who is comfortable taking the lead.", "អ្នកមានភាពឯករាជ្យ ចូលចិត្តផ្ដួចផ្ដើម និងមានទំនោរដឹកនាំ។"],
  2: ["A cooperative mediator who values harmony and understanding.", "អ្នកចូលចិត្តសហការ សម្របសម្រួល និងឱ្យតម្លៃលើភាពសុខដុម។"],
  3: ["A creative communicator who enjoys expression and new ideas.", "អ្នកច្នៃប្រឌិត ពូកែទំនាក់ទំនង និងចូលចិត្តគំនិតថ្មីៗ។"],
  4: ["A disciplined builder who values structure and reliability.", "អ្នកមានវិន័យ ឱ្យតម្លៃលើរបៀបរៀបរយ និងភាពអាចទុកចិត្តបាន។"],
  5: ["An adaptable explorer who enjoys freedom and change.", "អ្នកសម្របខ្លួនបានល្អ ស្រឡាញ់សេរីភាព និងការផ្លាស់ប្ដូរ។"],
  6: ["A responsible caregiver who values family and community.", "អ្នកមានទំនួលខុសត្រូវ យកចិត្តទុកដាក់លើគ្រួសារ និងសហគមន៍។"],
  7: ["A reflective learner who likes research and deeper questions.", "អ្នកចូលចិត្តពិចារណា សិក្សាស្រាវជ្រាវ និងសំណួរស៊ីជម្រៅ។"],
  8: ["An ambitious organizer with an interest in management and results.", "អ្នកមានមហិច្ឆតា ពូកែរៀបចំគ្រប់គ្រង និងផ្ដោតលើលទ្ធផល។"],
  9: ["A generous idealist who often considers the wider community.", "អ្នកមានចិត្តសប្បុរស និងតែងគិតដល់ប្រយោជន៍រួម។"],
};

function reduceDigits(value: string | number) {
  let current = String(value).replace(/\D/g, "");
  if (!current) return { root: null as number | null, steps: [] as string[] };
  const steps: string[] = [];
  while (current.length > 1) {
    const digits = [...current].map(Number);
    const sum = digits.reduce((total, digit) => total + digit, 0);
    steps.push(`${digits.join(" + ")} = ${sum}`);
    current = String(sum);
  }
  return { root: Number(current), steps };
}

function scoreCharacters(value: string, includeDigits: boolean) {
  const details: ScoreDetail[] = [];
  const unmapped: string[] = [];
  for (const char of [...value.normalize("NFC").toUpperCase()]) {
    let score: number | undefined;
    if (/[A-Z]/.test(char)) score = char.charCodeAt(0) - 64;
    else if (includeDigits && /[0-9]/.test(char)) score = Number(char);
    else score = KHMER_VALUES[char];
    if (score !== undefined) details.push({ char, value: score });
    else if (!/[\s\p{P}\p{S}]/u.test(char)) unmapped.push(char);
  }
  const total = details.reduce((sum, item) => sum + item.value, 0);
  return { details, unmapped: [...new Set(unmapped)], total, ...reduceDigits(total) };
}

function meaningText(root: number, t: (en: string, km: string) => string) {
  const meaning = DIGIT_MEANINGS[root];
  return meaning ? `${t(meaning.titleEn, meaning.titleKm)}\n${t(meaning.descEn, meaning.descKm)}` : "";
}

function displayDigits(value: string | number, mode: string) {
  const text = String(value);
  return mode === "km" ? text.replace(/[0-9]/g, (digit) => "០១២៣៤៥៦៧៨៩"[Number(digit)]) : text;
}

export default function KhmerNumerology() {
  const { mode, text: t } = useLanguage();
  const [tab, setTab] = useState<Tab>("plates");
  const [plate, setPlate] = useState("");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [fourDigits, setFourDigits] = useState("");
  const [target, setTarget] = useState("");
  const [resultPage, setResultPage] = useState(0);
  const [storedFavorites, setFavorites] = useToolState<string[]>("khmer-numerology:favorites", []);
  const favorites = Array.isArray(storedFavorites) ? storedFavorites : [];

  const plateScore = useMemo(() => plate.trim() ? scoreCharacters(plate, true) : null, [plate]);
  const nameScore = useMemo(() => name.trim() ? scoreCharacters(name, false) : null, [name]);
  const birthScore = useMemo(() => /^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? reduceDigits(birthDate) : null, [birthDate]);
  const numberRoot = fourDigits.length === 4 ? reduceDigits(fourDigits).root : null;
  const activeTarget = numberRoot === null ? target : String(numberRoot);
  const matchingNumbers = useMemo(() => {
    if (!/^[0-9]$/.test(activeTarget)) return [];
    const wanted = Number(activeTarget);
    const matches: string[] = [];
    for (let value = 0; value <= 9999; value++) {
      const candidate = String(value).padStart(4, "0");
      if (reduceDigits(candidate).root === wanted) matches.push(candidate);
    }
    return matches;
  }, [activeTarget]);
  const pageSize = 30;
  const pageCount = Math.ceil(matchingNumbers.length / pageSize);
  const safeResultPage = Math.min(Math.max(resultPage, 0), Math.max(pageCount - 1, 0));
  const resultStart = pageCount === 0 ? 0 : safeResultPage * pageSize;
  const resultEnd = Math.min(resultStart + pageSize, matchingNumbers.length);
  const currentPageNumbers = matchingNumbers.slice(resultStart, resultEnd);

  const toggleFavorite = (value: string) => {
    setFavorites((current) => {
      const safe = Array.isArray(current) ? current : [];
      return safe.includes(value) ? safe.filter((item) => item !== value) : [...safe, value].sort();
    });
  };

  const now = new Date();
  const dayEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
  const dayKm = ["អាទិត្យ", "ចន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"][now.getDay()];
  const colorEn = ["🔴 Red", "🟡 Yellow", "🟣 Purple", "🟢 Green", "🟠 Orange", "🔵 Blue", "⚫ Dark"][now.getDay()];
  const colorKm = ["🔴 ក្រហម", "🟡 លឿង", "🟣 ស្វាយ", "🟢 បៃតង", "🟠 ទឹកក្រូច", "🔵 ខៀវ", "⚫ ពណ៌ងងឹត"][now.getDay()];
  const dailyNumber = (now.getDate() + now.getDay()) % 9 + 1;

  const tabs: Array<[Tab, string, string]> = [
    ["plates", "Vehicle plate", "ស្លាកលេខយានយន្ត"], ["names", "Name / word", "ឈ្មោះ / ពាក្យ"],
    ["birth", "Life path", "ខ្សែជីវិត"], ["numbers", "Four-digit numbers", "លេខ ៤ ខ្ទង់"],
    ["favorites", "Saved", "បានរក្សាទុក"],
  ];

  return <ToolShell
    title="Khmer Numerology Calculator"
    khmerTitle="ឧបករណ៍គណនាលេខវិទ្យាខ្មែរ"
    description="Calculate traditional numerology-style values for vehicle plates, Khmer or English names, birth dates, and four-digit numbers."
    descriptionKm="គណនាតម្លៃតាមបែបលេខវិទ្យាប្រពៃណីសម្រាប់ស្លាកលេខយានយន្ត ឈ្មោះជាភាសាខ្មែរ ឬអង់គ្លេស ថ្ងៃកំណើត និងលេខ ៤ ខ្ទង់។"
  >
    <div className="rounded-md border border-[var(--gold-dim)]/40 bg-[var(--gold)]/5 p-3 text-xs leading-6 text-[var(--ink-dim)]">
      <strong className="text-[var(--ink)]">{t("Entertainment only.", "សម្រាប់ការកម្សាន្តប៉ុណ្ណោះ។")}</strong>{" "}
      {t("Numerology and daily-aura results have no scientific or predictive validity. Do not use them for safety, financial, medical, legal, relationship, or other consequential decisions.", "លទ្ធផលលេខវិទ្យា និងហុងស៊ុយប្រចាំថ្ងៃមិនមានមូលដ្ឋានវិទ្យាសាស្ត្រ និងមិនអាចទស្សន៍ទាយអនាគតបានទេ។ សូមកុំប្រើវាសម្រាប់ការសម្រេចចិត្តផ្នែកសុវត្ថិភាព ហិរញ្ញវត្ថុ សុខភាព ច្បាប់ ទំនាក់ទំនង ឬបញ្ហាសំខាន់ៗផ្សេងទៀត។")}
    </div>

    <section className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-faint)]">{t(`Daily aura · ${dayEn}`, `ហុងស៊ុយប្រចាំថ្ងៃ · ថ្ងៃ${dayKm}`)}</p>
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--ink-dim)]">
        <span>{t("Symbolic color", "ពណ៌និមិត្តរូប")}៖ {t(colorEn, colorKm)}</span>
        <span>{t("Daily number", "លេខប្រចាំថ្ងៃ")}៖ <strong className="text-[var(--gold)]">{displayDigits(dailyNumber, mode)}</strong></span>
      </div>
    </section>

    <div role="tablist" aria-label={t("Numerology calculators", "ប្រភេទឧបករណ៍លេខវិទ្យា")} className="numerology-tabs flex gap-1 overflow-x-auto border-b border-[var(--ground-line)] pb-2">
      {tabs.map(([id, en, km]) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`shrink-0 rounded-md px-3 py-2 text-xs transition ${tab === id ? "bg-[var(--gold)] text-[#0a0c0d]" : "text-[var(--ink-dim)] hover:bg-[var(--ground-raised)]"}`}>{t(en, km)}</button>)}
    </div>

    {tab === "plates" && <section className="space-y-4" role="tabpanel">
      <Field label="Vehicle plate" labelKm="ស្លាកលេខយានយន្ត" hint="Letters and digits" hintKm="អក្សរ និងលេខ">
        <TextInput value={plate} onChange={(event) => setPlate(event.target.value)} placeholder={t("e.g. 1AB-4301", "ឧ. 1AB-4301")} autoFocus />
      </Field>
      {plateScore && plateScore.root !== null && plateScore.details.length > 0 && <>
        <Row>
          <Output label="Character total" value={displayDigits(plateScore.total, mode)} />
          <Output label="Reduced number" value={displayDigits(plateScore.root, mode)} />
        </Row>
        <div className="flex flex-wrap gap-1.5">{plateScore.details.map((item, index) => <span key={`${item.char}-${index}`} className="rounded bg-[var(--ground-raised)] px-2 py-1 text-xs text-[var(--ink-dim)]">{item.char} = {displayDigits(item.value, mode)}</span>)}</div>
        <Output label="Traditional interpretation" value={meaningText(plateScore.root, t)} mono={false} />
        {plateScore.steps.length > 0 && <p className="text-xs text-[var(--ink-faint)]">{t("Calculation", "របៀបគណនា")}៖ {displayDigits(plateScore.steps.join(" → "), mode)}</p>}
      </>}
      {plateScore && plateScore.unmapped.length > 0 && <p className="text-xs text-[var(--danger)]">{t("Unmapped characters were ignored", "អក្សរដែលគ្មានក្នុងតារាងត្រូវបានរំលង")}៖ {plateScore.unmapped.join(" ")}</p>}
    </section>}

    {tab === "names" && <section className="space-y-4" role="tabpanel">
      <Field label="Name or word" labelKm="ឈ្មោះ ឬពាក្យ" hint="Khmer or English" hintKm="ខ្មែរ ឬអង់គ្លេស">
        <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder={t("e.g. Sokha or សុខា", "ឧ. សុខា ឬ Sokha")} autoFocus />
      </Field>
      {nameScore && nameScore.root !== null && nameScore.details.length > 0 && <>
        <Row>
          <Output label="Character total" value={displayDigits(nameScore.total, mode)} />
          <Output label="Reduced number" value={displayDigits(nameScore.root, mode)} />
        </Row>
        <div className="flex flex-wrap gap-1.5">{nameScore.details.map((item, index) => <span key={`${item.char}-${index}`} className="rounded bg-[var(--ground-raised)] px-2 py-1 text-xs text-[var(--ink-dim)]">{item.char} = {displayDigits(item.value, mode)}</span>)}</div>
        <Output label="Traditional interpretation" value={meaningText(nameScore.root, t)} mono={false} />
      </>}
      {nameScore && nameScore.unmapped.length > 0 && <p className="text-xs text-[var(--danger)]">{t("Unmapped characters were ignored", "អក្សរដែលគ្មានក្នុងតារាងត្រូវបានរំលង")}៖ {nameScore.unmapped.join(" ")}</p>}
    </section>}

    {tab === "birth" && <section className="space-y-4" role="tabpanel">
      <Field label="Birth date" labelKm="ថ្ងៃខែឆ្នាំកំណើត" hint="Gregorian calendar" hintKm="ប្រតិទិនសុរិយគតិ">
        <TextInput type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} autoFocus />
      </Field>
      {birthScore?.root !== null && birthScore?.root !== undefined && <>
        <Output label="Life-path number" value={displayDigits(birthScore.root, mode)} />
        <Output label="Traditional interpretation" value={`${meaningText(birthScore.root, t)}\n${LIFE_PATH[birthScore.root] ? t(...LIFE_PATH[birthScore.root]) : ""}`} mono={false} />
        {birthScore.steps.length > 0 && <p className="text-xs text-[var(--ink-faint)]">{t("Calculation", "របៀបគណនា")}៖ {displayDigits(birthScore.steps.join(" → "), mode)}</p>}
      </>}
      <p className="text-xs leading-5 text-[var(--ink-faint)]">{t("Your birth date is processed only in this browser and is not saved by this tool.", "ថ្ងៃកំណើតរបស់អ្នកត្រូវបានគណនាតែក្នុងកម្មវិធីរុករកនេះ ហើយឧបករណ៍មិនរក្សាទុកទេ។")}</p>
    </section>}

    {tab === "numbers" && <section className="space-y-4" role="tabpanel">
      <Row>
        <Field label="Four-digit number" labelKm="លេខ ៤ ខ្ទង់" hint="Phone suffix or any number" hintKm="កន្ទុយទូរស័ព្ទ ឬលេខណាមួយ">
          <TextInput inputMode="numeric" value={fourDigits} onChange={(event) => { setFourDigits(event.target.value.replace(/\D/g, "").slice(0, 4)); setTarget(""); setResultPage(0); }} placeholder={displayDigits("4554", mode)} autoFocus />
        </Field>
        <Field label="Or choose a result" labelKm="ឬជ្រើសរើសផលបូក">
          <Select value={numberRoot === null ? target : String(numberRoot)} disabled={numberRoot !== null} onChange={(event) => { setTarget(event.target.value); setFourDigits(""); setResultPage(0); }}>
            <option value="">{t("Select 0–9", "ជ្រើសលេខ ០–៩")}</option>
            {Array.from({ length: 10 }, (_, value) => <option key={value} value={value}>{displayDigits(value, mode)}</option>)}
          </Select>
        </Field>
      </Row>
      {fourDigits.length > 0 && fourDigits.length < 4 && <p className="text-xs text-[var(--ink-faint)]">{t("Enter exactly four digits.", "សូមបញ្ចូលលេខឱ្យបាន ៤ ខ្ទង់។")}</p>}
      {numberRoot !== null && <Output label="Reduced number" value={displayDigits(`${numberRoot}\n${reduceDigits(fourDigits).steps.join(" → ")}`, mode)} />}
      {activeTarget && <>
        <div className="flex items-center justify-between gap-3 text-xs text-[var(--ink-faint)]">
          <p>{t(`${matchingNumbers.length} four-digit numbers reduce to ${activeTarget}.`, `មានលេខ ៤ ខ្ទង់ចំនួន ${displayDigits(matchingNumbers.length, mode)} ដែលផលបូកចុងក្រោយស្មើ ${displayDigits(activeTarget, mode)}។`)}</p>
          <CopyButton text={matchingNumbers.join("\n")} />
        </div>
        <div className="numerology-quick-jump sticky top-16 z-10 flex flex-wrap items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2 shadow-sm">
          <p className="w-full text-center text-xs text-[var(--ink-dim)] sm:w-auto sm:flex-1 sm:text-left" aria-live="polite">
            {t(
              `Showing ${resultStart + 1}–${resultEnd} of ${matchingNumbers.length}`,
              `កំពុងបង្ហាញ ${displayDigits(resultStart + 1, mode)}–${displayDigits(resultEnd, mode)} ក្នុងចំណោម ${displayDigits(matchingNumbers.length, mode)}`,
            )}
          </p>
          <div className="grid w-full min-w-0 grid-cols-[2.25rem_2.25rem_minmax(0,1fr)_2.25rem_2.25rem] gap-1 sm:w-auto sm:grid-cols-[auto_auto_minmax(10rem,1fr)_auto_auto]">
            <button type="button" onClick={() => setResultPage(0)} disabled={safeResultPage === 0} aria-label={t("First page", "ទំព័រដំបូង")} title={t("First page", "ទំព័រដំបូង")} className="h-9 rounded border border-[var(--ground-line)] px-2 text-xs text-[var(--ink)] transition hover:bg-[var(--ground)] disabled:cursor-not-allowed disabled:opacity-40">
              <span aria-hidden="true">«</span><span className="ml-1 hidden sm:inline">{t("First", "ដំបូង")}</span>
            </button>
            <button type="button" onClick={() => setResultPage(Math.max(0, safeResultPage - 1))} disabled={safeResultPage === 0} aria-label={t("Previous page", "ទំព័រមុន")} title={t("Previous page", "ទំព័រមុន")} className="h-9 rounded border border-[var(--ground-line)] px-2 text-xs text-[var(--ink)] transition hover:bg-[var(--ground)] disabled:cursor-not-allowed disabled:opacity-40">
              <span aria-hidden="true">‹</span><span className="ml-1 hidden sm:inline">{t("Previous", "មុន")}</span>
            </button>
            <select value={safeResultPage} onChange={(event) => setResultPage(Number(event.target.value))} aria-label={t("Jump to results page", "លោតទៅទំព័រលទ្ធផល")} title={t("Jump to results page", "លោតទៅទំព័រលទ្ធផល")} className="h-9 min-w-0 rounded border border-[var(--ground-line)] bg-[var(--ground)] px-1 text-xs text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]">
              {Array.from({ length: pageCount }, (_, pageIndex) => {
                const optionStart = pageIndex * pageSize + 1;
                const optionEnd = Math.min((pageIndex + 1) * pageSize, matchingNumbers.length);
                return <option key={pageIndex} value={pageIndex}>{t(`Page ${pageIndex + 1} · ${optionStart}–${optionEnd}`, `ទំព័រ ${displayDigits(pageIndex + 1, mode)} · ${displayDigits(optionStart, mode)}–${displayDigits(optionEnd, mode)}`)}</option>;
              })}
            </select>
            <button type="button" onClick={() => setResultPage(Math.min(pageCount - 1, safeResultPage + 1))} disabled={safeResultPage >= pageCount - 1} aria-label={t("Next page", "ទំព័របន្ទាប់")} title={t("Next page", "ទំព័របន្ទាប់")} className="h-9 rounded border border-[var(--ground-line)] px-2 text-xs text-[var(--ink)] transition hover:bg-[var(--ground)] disabled:cursor-not-allowed disabled:opacity-40">
              <span aria-hidden="true">›</span><span className="ml-1 hidden sm:inline">{t("Next", "បន្ទាប់")}</span>
            </button>
            <button type="button" onClick={() => setResultPage(pageCount - 1)} disabled={safeResultPage >= pageCount - 1} aria-label={t("Last page", "ទំព័រចុងក្រោយ")} title={t("Last page", "ទំព័រចុងក្រោយ")} className="h-9 rounded border border-[var(--ground-line)] px-2 text-xs text-[var(--ink)] transition hover:bg-[var(--ground)] disabled:cursor-not-allowed disabled:opacity-40">
              <span aria-hidden="true">»</span><span className="ml-1 hidden sm:inline">{t("Last", "ចុងក្រោយ")}</span>
            </button>
          </div>
        </div>
        <div className="numerology-number-grid grid grid-cols-2 gap-2 rounded-md border border-[var(--ground-line)] p-2 sm:grid-cols-3">
          {currentPageNumbers.map((value) => <div key={value} className="flex items-center justify-between rounded bg-[var(--ground-raised)] px-2 py-1.5">
            <code className="text-sm text-[var(--ink)]">{displayDigits(value, mode)}</code>
            <div className="flex items-center gap-1"><button type="button" onClick={() => toggleFavorite(value)} aria-label={favorites.includes(value) ? t("Remove from saved", "ដកចេញពីបញ្ជីរក្សាទុក") : t("Save number", "រក្សាទុកលេខ")} className={`px-1 text-base ${favorites.includes(value) ? "text-[var(--gold)]" : "text-[var(--ink-faint)]"}`}>{favorites.includes(value) ? "♥" : "♡"}</button><CopyButton text={value} compact /></div>
          </div>)}
        </div>
      </>}
    </section>}

    {tab === "favorites" && <section className="space-y-3" role="tabpanel">
      {!favorites.length && <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 text-center text-sm text-[var(--ink-faint)]">{t("No saved numbers yet.", "មិនទាន់មានលេខដែលបានរក្សាទុកទេ។")}</p>}
      {favorites.length > 0 && <>
        <div className="flex items-center justify-between gap-3"><p className="text-xs text-[var(--ink-faint)]">{t(`${favorites.length} saved numbers`, `បានរក្សាទុកលេខចំនួន ${displayDigits(favorites.length, mode)}`)}</p><CopyButton text={favorites.join("\n")} /></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{favorites.map((value) => <div key={value} className="flex items-center justify-between rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2"><code>{displayDigits(value, mode)}</code><button type="button" onClick={() => toggleFavorite(value)} className="text-xs text-[var(--danger)] hover:underline">{t("Remove", "ដកចេញ")}</button></div>)}</div>
      </>}
    </section>}

    <p className="border-t border-[var(--ground-line)] pt-4 text-xs leading-5 text-[var(--ink-faint)]">
      {t("Method: English letters use A=1 through Z=26; digits use their face value; Khmer characters use the package's included 1–9 mapping. Punctuation and unmapped characters are ignored. Multi-digit totals are repeatedly summed to one digit.", "វិធីគណនា៖ អក្សរអង់គ្លេសប្រើ A=១ ដល់ Z=២៦ លេខប្រើតម្លៃរបស់វា ហើយអក្សរខ្មែរប្រើតារាងតម្លៃ ១–៩ ដែលមានក្នុងកញ្ចប់។ សញ្ញាវណ្ណយុត្តិ និងអក្សរដែលគ្មានក្នុងតារាងត្រូវបានរំលង។ ផលបូកច្រើនខ្ទង់ត្រូវបានបូកម្ដងហើយម្ដងទៀតរហូតនៅសល់មួយខ្ទង់។")}
    </p>
  </ToolShell>;
}