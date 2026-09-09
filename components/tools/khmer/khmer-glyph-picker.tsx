"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { CopyButton } from "@/components/CopyButton";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

// Every glyph is generated from its Unicode code point (factual). The names are
// the official Unicode character names for the Khmer block (U+1780–U+17FF); the
// short romanisation shown for consonants is an APPROXIMATE textbook reading,
// not a standard. The U+ code shown on each tile is authoritative.
const DOTTED = "◌"; // combining marks are shown on a dotted circle base

interface Glyph { ch: string; cp: number; name: string; roman?: string; combining?: boolean }

const CONSONANTS: [string, string, string][] = [
  ["ក", "KA", "k"], ["ខ", "KHA", "kh"], ["គ", "KO", "k"], ["ឃ", "KHO", "kh"], ["ង", "NGO", "ng"],
  ["ច", "CA", "ch"], ["ឆ", "CHA", "chh"], ["ជ", "CO", "ch"], ["ឈ", "CHO", "chh"], ["ញ", "NYO", "nh"],
  ["ដ", "DA", "d"], ["ឋ", "TTHA", "th"], ["ឌ", "DO", "d"], ["ឍ", "TTHO", "th"], ["ណ", "NNO", "n"],
  ["ត", "TA", "t"], ["ថ", "THA", "th"], ["ទ", "TO", "t"], ["ធ", "THO", "th"], ["ន", "NO", "n"],
  ["ប", "BA", "b/p"], ["ផ", "PHA", "ph"], ["ព", "PO", "p"], ["ភ", "PHO", "ph"], ["ម", "MO", "m"],
  ["យ", "YO", "y"], ["រ", "RO", "r"], ["ល", "LO", "l"], ["វ", "VO", "v"], ["ស", "SA", "s"],
  ["ហ", "HA", "h"], ["ឡ", "LA", "l"], ["អ", "QA", "'"],
];
const INDEP_VOWELS: [string, string][] = [
  ["ឥ", "QI"], ["ឦ", "QII"], ["ឧ", "QU"], ["ឩ", "QUU"], ["ឪ", "QUUV"], ["ឫ", "RY"], ["ឬ", "RYY"],
  ["ឭ", "LY"], ["ឮ", "LYY"], ["ឯ", "QE"], ["ឰ", "QAI"], ["ឱ", "QOO"], ["ឲ", "QOO (TYPE TWO)"], ["ឳ", "QAU"],
];
const VOWEL_SIGNS: [string, string, string][] = [
  ["ា", "SIGN AA", "aa"], ["ិ", "SIGN I", "e"], ["ី", "SIGN II", "ei"], ["ឹ", "SIGN Y", "eu"], ["ឺ", "SIGN YY", "eu"],
  ["ុ", "SIGN U", "o"], ["ូ", "SIGN UU", "ou"], ["ួ", "SIGN UA", "ua"], ["ើ", "SIGN OE", "aeu"], ["ឿ", "SIGN YA", "ie"],
  ["ៀ", "SIGN IE", "ie"], ["េ", "SIGN E", "e"], ["ែ", "SIGN AE", "ae"], ["ៃ", "SIGN AI", "ai"], ["ោ", "SIGN OO", "ao"], ["ៅ", "SIGN AU", "au"],
];
const SIGNS: [string, string][] = [
  ["ំ", "NIKAHIT"], ["ះ", "REAHMUK"], ["ៈ", "YUUKALEAPINTU"], ["៉", "MUUSIKATOAN"], ["៊", "TRIISAP"],
  ["់", "BANTOC"], ["៌", "ROBAT"], ["៍", "TOANDAKHIAT"], ["៎", "KAKABAT"], ["៏", "AHSDA"],
  ["័", "SAMYOK SANNYA"], ["៑", "VIRIAM"], ["្", "COENG (subscript)"], ["៝", "ATTHACAN"],
];
const SYMBOLS: [string, string][] = [
  ["។", "KHAN (full stop)"], ["៕", "BARIYOOSAN (end of text)"], ["៖", "CAMNUC PII KUUH (colon)"], ["ៗ", "LEK TOO (repeat)"],
  ["៘", "BEYYAL (et cetera)"], ["៙", "PHNAEK MUAN"], ["៚", "KOOMUUT"], ["៛", "RIEL (currency)"], ["ៜ", "AVAKRAHASANYA"],
];
const DIGITS: [string, string][] = [
  ["០", "ZERO"], ["១", "ONE"], ["២", "TWO"], ["៣", "THREE"], ["៤", "FOUR"], ["៥", "FIVE"], ["៦", "SIX"], ["៧", "SEVEN"], ["៨", "EIGHT"], ["៩", "NINE"],
];

const SECTIONS: { id: string; label: string; km: string; glyphs: Glyph[] }[] = [
  { id: "consonants", label: "Consonants", km: "ព្យញ្ជនៈ", glyphs: CONSONANTS.map(([ch, name, roman]) => ({ ch, cp: ch.codePointAt(0)!, name, roman })) },
  { id: "subscripts", label: "Subscripts (coeng)", km: "ជើង", glyphs: CONSONANTS.map(([ch, name, roman]) => ({ ch: "្" + ch, cp: ch.codePointAt(0)!, name: "COENG " + name, roman, combining: true })) },
  { id: "indep", label: "Independent vowels", km: "ស្រៈពេញតួ", glyphs: INDEP_VOWELS.map(([ch, name]) => ({ ch, cp: ch.codePointAt(0)!, name })) },
  { id: "vowel-signs", label: "Vowel signs", km: "សញ្ញាស្រៈ", glyphs: VOWEL_SIGNS.map(([ch, name, roman]) => ({ ch, cp: ch.codePointAt(0)!, name, roman, combining: true })) },
  { id: "signs", label: "Signs & diacritics", km: "សញ្ញាកំណត់", glyphs: SIGNS.map(([ch, name]) => ({ ch, cp: ch.codePointAt(0)!, name, combining: true })) },
  { id: "digits", label: "Digits", km: "លេខ", glyphs: DIGITS.map(([ch, name]) => ({ ch, cp: ch.codePointAt(0)!, name })) },
  { id: "symbols", label: "Symbols & punctuation", km: "និមិត្តសញ្ញា", glyphs: SYMBOLS.map(([ch, name]) => ({ ch, cp: ch.codePointAt(0)!, name })) },
];

function hex(cp: number) { return "U+" + cp.toString(16).toUpperCase().padStart(4, "0"); }

export default function KhmerGlyphPicker() {
  const { text: t } = useLanguage();
  const [query, setQuery] = useState("");
  const [compose, setCompose] = useToolState("khmer-glyph:compose", "");

  const q = query.trim().toLowerCase();
  const sections = useMemo(() => {
    if (!q) return SECTIONS;
    return SECTIONS.map((s) => ({
      ...s,
      glyphs: s.glyphs.filter((g) =>
        g.ch.includes(query) || g.name.toLowerCase().includes(q) || (g.roman?.toLowerCase().includes(q) ?? false) || hex(g.cp).toLowerCase().includes(q)
      ),
    })).filter((s) => s.glyphs.length > 0);
  }, [q, query]);

  const copyOne = (ch: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) void navigator.clipboard.writeText(ch);
  };

  return (
    <ToolShell
      title="Khmer Glyph & Symbol Picker"
      khmerTitle="ឧបករណ៍ជ្រើសតួអក្សរ និងនិមិត្តសញ្ញាខ្មែរ"
      description="Find and copy any Khmer letter, subscript, vowel sign, diacritic, digit, or hard-to-type punctuation (។ ៕ ៖ ៗ ៛). Search by romanisation, Unicode name, or U+ code; click to compose, double-click to copy one."
      descriptionKm="ស្វែងរក និងចម្លងអក្សរខ្មែរ ជើង សញ្ញាស្រៈ សញ្ញាកំណត់ លេខ ឬវណ្ណយុត្តិដែលពិបាកវាយ (។ ៕ ៖ ៗ ៛)។ ស្វែងរកតាមអក្សរឡាតាំង ឈ្មោះ Unicode ឬលេខកូដ U+; ចុចដើម្បីតម្រៀប ចុចពីរដងដើម្បីចម្លងមួយ។"
    >
      <Field label="Search (romanisation, name, or U+ code)" labelKm="ស្វែងរក (អក្សរឡាតាំង ឈ្មោះ ឬកូដ U+)">
        <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. ka, coeng, riel, U+17DB" />
      </Field>

      {/* Compose box */}
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Compose box", "ប្រអប់តម្រៀប")}</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCompose("")} className="text-xs text-[var(--ink-faint)] hover:text-[var(--danger)]">{t("Clear", "សម្អាត")}</button>
            <CopyButton text={compose} />
          </div>
        </div>
        <TextInput value={compose} onChange={(e) => setCompose(e.target.value)} className="font-khmer text-xl" />
      </div>

      {sections.map((section) => (
        <section key={section.id} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{t(section.label, section.km)}</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 md:grid-cols-8">
            {section.glyphs.map((g) => (
              <button
                key={g.cp + g.name}
                type="button"
                onClick={() => setCompose((c) => c + g.ch)}
                onDoubleClick={() => copyOne(g.ch)}
                title={`${g.name}${g.roman ? ` · ${g.roman}` : ""} · ${hex(g.cp)} — ${t("click to compose, double-click to copy", "ចុចដើម្បីតម្រៀប ចុចពីរដងដើម្បីចម្លង")}`}
                className="flex flex-col items-center gap-0.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2 transition hover:border-[var(--gold-dim)] hover:bg-[var(--ground-raised-hi)]"
              >
                <span className="font-khmer text-2xl leading-none text-[var(--ink)]">{g.combining ? DOTTED + g.ch : g.ch}</span>
                <span className="font-mono-ui text-[9px] text-[var(--ink-faint)]">{hex(g.cp)}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
      {sections.length === 0 && <p className="text-sm text-[var(--ink-faint)]">{t("No glyphs match your search.", "គ្មានតួអក្សរត្រូវនឹងការស្វែងរករបស់អ្នកទេ។")}</p>}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Names are the Unicode character names for the Khmer block; the U+ code on each tile is authoritative. Combining marks (vowel signs, diacritics, subscripts) are shown on a dotted circle ◌ and compose onto the preceding consonant.",
          "ឈ្មោះជាឈ្មោះតួអក្សរ Unicode សម្រាប់ប្លុកខ្មែរ; កូដ U+ លើផ្ទាំងនីមួយៗជាផ្លូវការ។ សញ្ញាផ្សំ (សញ្ញាស្រៈ សញ្ញាកំណត់ ជើង) បង្ហាញលើរង្វង់ចុច ◌ ហើយផ្សំទៅលើព្យញ្ជនៈពីមុន។"
        )}
      </p>
    </ToolShell>
  );
}
