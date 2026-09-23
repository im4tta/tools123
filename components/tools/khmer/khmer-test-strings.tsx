"use client";
import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { Pill, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { CopyButton } from "@/components/CopyButton";
import { useToolState } from "@/lib/storage";
import { measure } from "@/lib/khmer-devkit";

type Category = "rendering" | "lookalike" | "numbers" | "layout" | "invalid" | "legacy";

interface TestString {
  id: string;
  cat: Category;
  text: string;
  en: string;
  km: string;
}

// Every string is built from explicit code points so the fixture is exact.
const S = (...cps: number[]) => String.fromCodePoint(...cps);

const STRINGS: TestString[] = [
  { id: "stack-2", cat: "rendering", text: "ស្ត្រី", en: "Two stacked subscripts (coeng ta + coeng ro) plus a vowel in one cluster: 6 code points but a single grapheme cluster.", km: "ជើងពីរជាន់ (ជើង ត + ជើង រ) និងស្រៈក្នុងក្រុមអក្សរតែមួយ៖ ៦ code point តែជាក្រុមអក្សរតែមួយ។" },
  { id: "coeng-ro", cat: "rendering", text: "ក្រុម", en: "Coeng ro is stored after the base consonant but drawn to its left — tests reordering in the shaper.", km: "ជើង រ ត្រូវរក្សាទុកក្រោយព្យញ្ជនៈគោល ប៉ុន្តែគូរនៅខាងឆ្វេង — សាកល្បងការរៀបលំដាប់ក្នុងម៉ាស៊ីនរៀបរាង។" },
  { id: "split-vowel", cat: "rendering", text: "កើត រៀន", en: "Split vowels (ើ, ៀ) have a part drawn before the consonant; cursor movement and selection often break here.", km: "ស្រៈបំបែក (ើ, ៀ) មានផ្នែកគូរមុនព្យញ្ជនៈ ចលនាទស្សន៍ទ្រនិច និងការជ្រើសរើសច្រើនខូចនៅទីនេះ។" },
  { id: "shifters", cat: "rendering", text: "ប៉ុន្តែ អ៊ីនធឺណិត", en: "Register shifters muusikatoan (៉) and triisap (៊) combined with vowels above/below.", km: "សញ្ញាប្តូរសំឡេង មូសិកទន្ត (៉) និងត្រីសព្ទ (៊) រួមជាមួយស្រៈខាងលើ/ក្រោម។" },
  { id: "marks", cat: "rendering", text: "ធម៌ ចាំ សក់ ពះ", en: "Robat (៌), nikahit (ំ), bantoc (់), and reahmuk (ះ) — common marks that fonts must position.", km: "រោបាត (៌) និគ្គហិត (ំ) បន្តក់ (់) និងរះមុខ (ះ) — សញ្ញាទូទៅដែលពុម្ពអក្សរត្រូវដាក់ទីតាំង។" },
  { id: "ta-da", cat: "lookalike", text: `${S(0x179f, 0x17d2, 0x178f, 0x17b8)} / ${S(0x179f, 0x17d2, 0x178a, 0x17b8)}`, en: "Coeng ta (U+178F) vs coeng da (U+178A): look identical in most fonts but are different strings — search and dedupe must normalise.", km: "ជើង ត (U+178F) ទល់នឹងជើង ដ (U+178A)៖ មើលទៅដូចគ្នាក្នុងពុម្ពអក្សរភាគច្រើន ប៉ុន្តែជាខ្សែអក្សរខុសគ្នា — ការស្វែងរក និងលុបស្ទួនត្រូវធ្វើឱ្យស្តង់ដារ។" },
  { id: "ao-oy", cat: "lookalike", text: `${S(0x17b2, 0x17d2, 0x1799)} / ${S(0x17b1, 0x17d2, 0x1799)}`, en: "ឲ្យ (U+17B2 + coeng yo) vs ឱ្យ (U+17B1 + coeng yo): two spellings of “to give / let” that are both in common use — similar-looking, different code points.", km: "ឲ្យ (U+17B2 + ជើង យ) ទល់នឹង ឱ្យ (U+17B1 + ជើង យ)៖ អក្ខរាវិរុទ្ធពីរដែលប្រើទូទៅ — មើលទៅស្រដៀង តែជា code point ខុសគ្នា។" },
  { id: "digits", cat: "numbers", text: "០១២៣៤៥៦៧៨៩", en: "Khmer digits U+17E0–U+17E9: parseInt/Number() return NaN unless you convert them first.", km: "លេខខ្មែរ U+17E0–U+17E9៖ parseInt/Number() ផ្តល់ NaN លុះត្រាតែបម្លែងជាមុន។" },
  { id: "mixed-digits", cat: "numbers", text: "២០២៦ / 2026 / ២0២6", en: "Khmer, Arabic, and accidentally mixed digits in one field.", km: "លេខខ្មែរ អារ៉ាប់ និងលេខលាយគ្នាដោយចៃដន្យក្នុងវាលតែមួយ។" },
  { id: "riel", cat: "numbers", text: "៥០០០៛ / 5,000 ៛ / ៛៥០០០", en: "Riel sign (U+17DB) before or after the amount, with and without a space.", km: "សញ្ញារៀល (U+17DB) មុន ឬក្រោយចំនួន មាន និងគ្មានចន្លោះ។" },
  { id: "lunar-sym", cat: "numbers", text: S(0x19e0, 0x19e1, 0x19f0), en: "Khmer Symbols block (U+19E0–U+19FF, lunar date symbols) — outside the main Khmer block, so naive [\\u1780-\\u17FF] checks miss it.", km: "ប្លុកនិមិត្តសញ្ញាខ្មែរ (U+19E0–U+19FF និមិត្តសញ្ញាថ្ងៃចន្ទគតិ) — នៅក្រៅប្លុកខ្មែរមេ ដូច្នេះការពិនិត្យ [\\u1780-\\u17FF] ធម្មតាមើលរំលង។" },
  { id: "no-spaces", cat: "layout", text: "ខ្ញុំចូលចិត្តរៀនភាសាខ្មែរណាស់ព្រោះវាជាភាសាកំណើតរបស់ខ្ញុំ", en: "A long sentence with no spaces — tests line wrapping, overflow, and word-break CSS.", km: "ប្រយោគវែងគ្មានចន្លោះ — សាកល្បងការចុះបន្ទាត់ ការហៀរ និង CSS word-break។" },
  { id: "zwsp", cat: "layout", text: `ខ្ញុំ${S(0x200b)}ចូលចិត្ត${S(0x200b)}រៀន`, en: "Words separated by invisible zero-width spaces (U+200B) — copy/paste, search, and length checks may surprise you.", km: "ពាក្យបំបែកដោយចន្លោះសូន្យមើលមិនឃើញ (U+200B) — ការចម្លង/បិទភ្ជាប់ ការស្វែងរក និងការពិនិត្យប្រវែងអាចធ្វើឱ្យភ្ញាក់ផ្អើល។" },
  { id: "punct", cat: "layout", text: "សួស្តី។ អរគុណ៕ ផ្សេងៗ៖", en: "Khmer punctuation: khan (។), bariyoosan (៕), lek too (ៗ), camnuc pii kuuh (៖).", km: "វណ្ណយុត្តិខ្មែរ៖ ខណ្ឌ (។) បរិយោសាន (៕) លេខទោ (ៗ) ចំណុចពីរគូស (៖)។" },
  { id: "mixed-script", cat: "layout", text: "Hello សួស្តី 123 ១២៣ 🇰🇭", en: "Latin, Khmer, both digit sets, and an emoji flag in one line — tests font fallback and grapheme counting.", km: "ឡាតាំង ខ្មែរ លេខទាំងពីរប្រភេទ និងទង់ emoji ក្នុងបន្ទាត់តែមួយ — សាកល្បងពុម្ពអក្សរជំនួស និងការរាប់ក្រុមអក្សរ។" },
  { id: "vowel-first", cat: "invalid", text: S(0x17b6, 0x1780), en: "Invalid: dependent vowel before any consonant. Renders with a dotted circle (◌) in most shapers.", km: "មិនត្រឹមត្រូវ៖ ស្រៈនិស្ស័យមុនព្យញ្ជនៈ។ បង្ហាញជាមួយរង្វង់ចុច (◌) ក្នុងម៉ាស៊ីនរៀបរាងភាគច្រើន។" },
  { id: "wrong-order", cat: "invalid", text: `${S(0x1780, 0x17d2, 0x179a, 0x17b6)} / ${S(0x1780, 0x17b6, 0x17d2, 0x179a)}`, en: "Correct (ក្រា: coeng before vowel) vs a common wrong typing order (vowel before coeng). Looks similar, compares unequal.", km: "ត្រឹមត្រូវ (ក្រា៖ ជើងមុនស្រៈ) ទល់នឹងលំដាប់វាយខុសទូទៅ (ស្រៈមុនជើង)។ មើលទៅស្រដៀង ប៉ុន្តែប្រៀបធៀបមិនស្មើ។" },
  { id: "double-coeng", cat: "invalid", text: S(0x1780, 0x17d2, 0x17d2, 0x1780), en: "Invalid: two coeng signs in a row.", km: "មិនត្រឹមត្រូវ៖ សញ្ញាជើងពីរជាប់គ្នា។" },
  { id: "dangling", cat: "invalid", text: S(0x1780, 0x17d2), en: "Invalid: coeng at the end with no consonant after it (common after a bad truncate).", km: "មិនត្រឹមត្រូវ៖ ជើងនៅចុងគ្មានព្យញ្ជនៈតាមក្រោយ (ច្រើនកើតក្រោយការកាត់ខុស)។" },
  { id: "two-vowels", cat: "invalid", text: S(0x1780, 0x17b6, 0x17b7), en: "Two dependent vowels on one consonant — not valid Khmer spelling.", km: "ស្រៈនិស្ស័យពីរលើព្យញ្ជនៈមួយ — មិនមែនអក្ខរាវិរុទ្ធខ្មែរត្រឹមត្រូវទេ។" },
  { id: "deprecated", cat: "legacy", text: S(0x17a3, 0x17a4), en: "U+17A3 and U+17A4 are deprecated by Unicode (use U+17A2 អ with vowels instead).", km: "U+17A3 និង U+17A4 ត្រូវបាន Unicode លុបចោល (ប្រើ U+17A2 អ ជាមួយស្រៈជំនួស)។" },
  { id: "inherent", cat: "legacy", text: `ក${S(0x17b4)}ក${S(0x17b5)}`, en: "U+17B4 / U+17B5 inherent vowels: invisible, default-ignorable, and discouraged — they inflate lengths silently.", km: "ស្រៈ U+17B4 / U+17B5៖ មើលមិនឃើញ ត្រូវមិនអើពើតាមលំនាំដើម ហើយមិនត្រូវបានលើកទឹកចិត្ត — វាបង្កើនប្រវែងដោយស្ងាត់ៗ។" },
  { id: "bom", cat: "legacy", text: `${S(0xfeff)}សួស្តី`, en: "Text starting with a byte-order mark (U+FEFF), as written by Excel's “CSV UTF-8” export and some Windows editors.", km: "អត្ថបទចាប់ផ្តើមដោយ BOM (U+FEFF) ដូចដែលការនាំចេញ «CSV UTF-8» របស់ Excel និងកម្មវិធីកែអត្ថបទ Windows ខ្លះសរសេរ។" },
];

const CATS: { id: Category | "all"; en: string; km: string }[] = [
  { id: "all", en: "All", km: "ទាំងអស់" },
  { id: "rendering", en: "Rendering", km: "ការបង្ហាញ" },
  { id: "lookalike", en: "Look-alikes", km: "មើលដូចគ្នា" },
  { id: "numbers", en: "Numbers & currency", km: "លេខ និងរូបិយប័ណ្ណ" },
  { id: "layout", en: "Layout & spacing", km: "ប្លង់ និងចន្លោះ" },
  { id: "invalid", en: "Invalid sequences", km: "លំដាប់មិនត្រឹមត្រូវ" },
  { id: "legacy", en: "Deprecated & invisible", km: "លុបចោល និងមើលមិនឃើញ" },
];

type Format = "json" | "fixtures" | "lines";

const escapeCp = (s: string) => [...s].map((c) => { const cp = c.codePointAt(0) ?? 0; return cp < 0x80 ? c : cp > 0xffff ? `\\u{${cp.toString(16).toUpperCase()}}` : `\\u${cp.toString(16).toUpperCase().padStart(4, "0")}`; }).join("");

export default function KhmerTestStrings() {
  const { text: t } = useLanguage();
  const [cat, setCat] = useToolState<Category | "all">("khmer-qa:cat", "all");
  const [format, setFormat] = useToolState<Format>("khmer-qa:format", "fixtures");

  const rows = useMemo(() => STRINGS.filter((s) => cat === "all" || s.cat === cat).map((s) => ({
    ...s,
    graphemes: measure(s.text, "graphemes"),
    codePoints: measure(s.text, "codepoints"),
    utf16: measure(s.text, "utf16"),
    utf8: measure(s.text, "utf8"),
    escaped: escapeCp(s.text),
  })), [cat]);

  const exported = useMemo(() => {
    if (format === "lines") return rows.map((r) => r.text).join("\n");
    if (format === "json") return JSON.stringify(rows.map((r) => r.text), null, 2);
    return JSON.stringify(rows.map((r) => ({ id: r.id, category: r.cat, text: r.text, escaped: r.escaped, graphemes: r.graphemes, codePoints: r.codePoints, utf16Length: r.utf16, utf8Bytes: r.utf8, note: r.en })), null, 2);
  }, [rows, format]);

  return (
    <ToolShell
      title="Khmer QA Test Strings"
      khmerTitle="ខ្សែអក្សរសាកល្បង QA សម្រាប់ខ្មែរ"
      description="A curated set of tricky Khmer strings for testing apps, fonts, databases, and search: stacked subscripts, split vowels, look-alike spellings (coeng ta vs da), Khmer digits and the riel sign, zero-width spaces, invalid sequences, deprecated code points, and a BOM. Each comes with an explanation, its exact code points, and its length in graphemes, code points, UTF-16 units, and UTF-8 bytes — export them as JSON fixtures for your unit tests."
      descriptionKm="សំណុំខ្សែអក្សរខ្មែរពិបាកៗដែលបានជ្រើសរើស សម្រាប់សាកល្បងកម្មវិធី ពុម្ពអក្សរ មូលដ្ឋានទិន្នន័យ និងការស្វែងរក៖ ជើងជាន់ ស្រៈបំបែក អក្ខរាវិរុទ្ធមើលដូចគ្នា (ជើង ត និង ដ) លេខខ្មែរ និងសញ្ញារៀល ចន្លោះសូន្យ លំដាប់មិនត្រឹមត្រូវ code point ដែលលុបចោល និង BOM។ នីមួយៗមានការពន្យល់ code point ពិតប្រាកដ និងប្រវែងជាក្រុមអក្សរ code point ឯកតា UTF-16 និងបៃ UTF-8 — នាំចេញជា JSON fixture សម្រាប់ unit test របស់អ្នក។"
    >
      <PillGroup label={t("Category", "ប្រភេទ")}>
        {CATS.map((c) => <Pill key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{t(c.en, c.km)}</Pill>)}
      </PillGroup>

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
            <div className="flex items-start justify-between gap-3">
              <p lang="km" className="min-w-0 break-words font-khmer text-xl text-[var(--ink)]">{r.text}</p>
              <CopyButton text={r.text} compact className="shrink-0" />
            </div>
            <p className="mt-1 text-sm text-[var(--ink-dim)]">{t(r.en, r.km)}</p>
            <p className="mt-1.5 break-all font-mono-ui text-xs text-[var(--ink-faint)]">{r.escaped}</p>
            <p className="mt-1 text-xs text-[var(--ink-faint)]">
              {t(`${r.graphemes} graphemes · ${r.codePoints} code points · ${r.utf16} UTF-16 · ${r.utf8} UTF-8 bytes`, `${r.graphemes} ក្រុមអក្សរ · ${r.codePoints} code point · ${r.utf16} UTF-16 · ${r.utf8} បៃ UTF-8`)}
            </p>
          </div>
        ))}
      </div>

      <PillGroup label={t("Export as", "នាំចេញជា")}>
        <Pill active={format === "fixtures"} onClick={() => setFormat("fixtures")}>{t("JSON fixtures (with metadata)", "JSON fixture (មានព័ត៌មានបន្ថែម)")}</Pill>
        <Pill active={format === "json"} onClick={() => setFormat("json")}>{t("JSON array", "អារេ JSON")}</Pill>
        <Pill active={format === "lines"} onClick={() => setFormat("lines")}>{t("One per line", "មួយក្នុងមួយបន្ទាត់")}</Pill>
      </PillGroup>
      <Output value={exported} />

      <SourceCredits>
        <p>{t(
          "Strings are assembled from explicit code points; the notes on deprecated and discouraged characters follow the Unicode Standard's Khmer chapter and code chart annotations. Lengths are computed live in your browser (graphemes via Intl.Segmenter, which can vary slightly by browser). The “invalid” strings are deliberately malformed test input, not real spellings. Original Tools123 collection.",
          "ខ្សែអក្សរត្រូវបានផ្គុំពី code point ច្បាស់លាស់ កំណត់ចំណាំអំពីតួអក្សរដែលលុបចោល និងមិនលើកទឹកចិត្តធ្វើតាមជំពូកខ្មែរ និងកំណត់ចំណាំតារាងកូដនៃស្តង់ដារ Unicode។ ប្រវែងត្រូវគណនាផ្ទាល់ក្នុងកម្មវិធីរុករក (ក្រុមអក្សរតាម Intl.Segmenter ដែលអាចខុសគ្នាបន្តិចតាមកម្មវិធីរុករក)។ ខ្សែអក្សរ «មិនត្រឹមត្រូវ» ជាទិន្នន័យសាកល្បងដែលខូចដោយចេតនា មិនមែនអក្ខរាវិរុទ្ធពិតទេ។ ការប្រមូលដើមរបស់ Tools123។",
        )}</p>
        <p className="mt-1"><a className="underline hover:text-[var(--ink-dim)]" href="https://www.unicode.org/charts/PDF/U1780.pdf" target="_blank" rel="noreferrer">unicode.org/charts/PDF/U1780.pdf</a></p>
      </SourceCredits>
    </ToolShell>
  );
}
