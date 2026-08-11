"use client";

import { useMemo } from "react";
import { Binary, BookA, Split, Type } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { toolHref } from "@/lib/toolRoutes";

const TRANSLIT: Record<string, string> = {
  "ក": "k", "ខ": "kh", "គ": "k", "ឃ": "kh", "ង": "ng",
  "ច": "c", "ឆ": "ch", "ជ": "c", "ឈ": "ch", "ញ": "nh",
  "ដ": "d", "ឋ": "th", "ឌ": "d", "ឍ": "th", "ណ": "n",
  "ត": "t", "ថ": "th", "ទ": "t", "ធ": "th", "ន": "n",
  "ប": "b", "ផ": "ph", "ព": "p", "ភ": "ph", "ម": "m",
  "យ": "y", "រ": "r", "ល": "l", "វ": "v", "ស": "s",
  "ហ": "h", "ឡ": "l", "អ": "a",
  "ឥ": "e", "ឦ": "ei", "ឧ": "o", "ឨ": "o", "ឩ": "ou", "ឪ": "ou",
  "ឫ": "rue", "ឬ": "rue", "ឭ": "lue", "ឮ": "lue", "ឯ": "ae", "ឰ": "ai", "ឱ": "ao", "ឲ": "ao", "ឳ": "au",
  "ា": "a", "ិ": "i", "ី": "i", "ឹ": "ue", "ឺ": "ue",
  "ុ": "u", "ូ": "u", "ួ": "uok", "ើ": "aeu", "ឿ": "oea", "ៀ": "ie",
  "េ": "e", "ែ": "ae", "ៃ": "ai", "ោ": "o", "ៅ": "au",
  "ំ": "m", "ះ": "h", "ៈ": "a",
  "០": "0", "១": "1", "២": "2", "៣": "3", "៤": "4", "៥": "5", "៦": "6", "៧": "7", "៨": "8", "៩": "9",
  "។": ".", "៕": ".",
  "៉": "",
  "៊": "",
};

function graphemeName(value: string) {
  const code = value.charCodeAt(0);
  if (code >= 0x1780 && code <= 0x17a2) return "Consonant";
  if (code >= 0x17a3 && code <= 0x17b3) return "Independent Vowel";
  if (code >= 0x17b6 && code <= 0x17c5) return "Dependent Vowel";
  if (code >= 0x17c6 && code <= 0x17d3) return "Diacritic";
  if (code === 0x17d2) return "Coeng";
  if (code >= 0x17e0 && code <= 0x17e9) return "Numeral";
  if (code >= 0x17d4 && code <= 0x17da) return "Punctuation";
  if (code === 0x200b) return "ZWSP";
  return "Other";
}

function romanize(value: string) {
  let out = "";
  let prev = "";
  for (const ch of value) {
    const mapped = TRANSLIT[ch];
    if (mapped !== undefined) {
      if (mapped !== "" || prev === "") out += mapped;
      prev = mapped;
    } else {
      // If previous mapped was empty (coeng fallback), keep the vowel
      if (prev === "") out += ch;
      prev = ch;
    }
  }
  return out.replace(/-+/g, "-").trim();
}

function analyze(value: string) {
  const cleaned = value.replace(/\u200b/g, "").trim();
  if (!cleaned) return null;
  const parts = cleaned.split(/\s+/);
  const structure = parts.length === 1 ? { surname: null, given: parts[0] } : { surname: parts[0], given: parts.slice(1).join(" ") };
  let graphemes: { cluster: string; chars: { char: string; hex: string; type: string }[] }[] = [];
  try {
    if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
      const segmenter = new Intl.Segmenter("km", { granularity: "grapheme" });
      graphemes = Array.from(segmenter.segment(value))
        .map((seg) => ({
          cluster: seg.segment,
          chars: Array.from(seg.segment).map((char) => ({
            char,
            hex: "U+" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0"),
            type: graphemeName(char),
          })),
        }))
        .filter((node) => node.cluster && node.cluster !== "\u200b");
    } else {
      graphemes = Array.from(value).map((char) => ({
        cluster: char,
        chars: [{ char, hex: "U+" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0"), type: graphemeName(char) }],
      }));
    }
  } catch {
    graphemes = [];
  }
  return { original: value, structure, structureType: parts.length === 1 ? "single" : parts.length === 2 ? "standard" : "multi", isKhmer: /[\u1780-\u17ff]/.test(value), graphemes, romanization: romanize(cleaned) };
}

export default function KhmerNameStructureExplorer() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("knse:input", "សុខ ដារ៉ា");
  const analysis = useMemo(() => analyze(input), [input]);

  return (
    <ToolShell
      title="Khmer Name Structure Explorer"
      khmerTitle="កម្មវិធីវិភាគរចនាសម្ព័ន្ធឈ្មោះខ្មែរ"
      description="Deconstruct Khmer names into family and given positions, grapheme clusters, and structural transliteration."
      descriptionKm="បំបែកឈ្មោះខ្មែរជាផ្នែកត្រកូល ផ្នែកនាមខ្លួន តួអក្សរ និងការបកប្រែជាលំដាប់។"
    >
      <div className="mb-4 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        {t("Analytical tool. Cambodian naming conventions can vary. The traditional pattern is [Family Name] [Given Name], but modern usage may differ.", "ឧបករណ៍វិភាគ។ ទម្លាប់ដាក់ឈ្មោះខ្មែរអាចប្រែប្រួល។ លំនាំបុរាណគឺ [នាមត្រកូល] [នាមខ្លួន] ប៉ុន្តែការប្រើប្រាស់សម័យថ្មីអាចដាក់ផ្សេង។")}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("e.g. សុខ ដារ៉ា", "e.g. សុខ ដារ៉ា")}
        className="mb-5 w-full rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3 text-lg font-semibold text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]"
      />

      {analysis && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
              <Split size={16} className="text-[var(--gold)]" />
              {t("Name Structure", "រចនាសម្ព័ន្ធឈ្មោះ")}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {analysis.structure.surname && (
                <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--gold)]/5 p-4 text-center">
                  <div className="font-khmer text-2xl font-bold text-[var(--ink)]">{analysis.structure.surname}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--gold)]">
                    {t("Surname", "នាមត្រកូល")}
                  </div>
                </div>
              )}
              <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--success)]/5 p-4 text-center">
                <div className="font-khmer text-2xl font-bold text-[var(--ink)]">{analysis.structure.given}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--success)]">
                  {analysis.structure.surname
                    ? t("Given name", "នាមខ្លួន")
                    : t("Mononym", "ឈ្មោះមួយម៉ាត់")}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                <BookA size={15} className="text-[var(--gold)]" />
                {t("Transliteration", "អក្សរឡាតាំង")}
              </div>
              {analysis.isKhmer ? (
                <div className="rounded-md bg-[var(--ground)] p-3 font-mono-ui text-center text-[var(--ink)]">
                  {analysis.romanization}
                </div>
              ) : (
                <div className="text-xs text-[var(--ink-faint)]">
                  {t("No Khmer characters detected.", "រកមិនឃើញតួអក្សរខ្មែរ។")}
                </div>
              )}
              <p className="mt-2 text-[10px] text-[var(--ink-faint)]">
                {t("Character-by-character transliteration, not phonetic.", "បកប្រែតួអក្សរ មិនមែនច្បាស់សំឡេង។")}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                <Type size={15} className="text-[var(--gold)]" />
                {t("Script analysis", "ការវិភាគអក្សរ")}
              </div>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2">
                  <span className="text-[var(--ink-dim)]">{t("Primary script", "អក្សរចម្បង")}</span>
                  <span className="rounded-md bg-[var(--ground-raised)] px-2 py-0.5 font-bold text-[var(--ink)]">
                    {analysis.isKhmer ? t("Khmer", "ខ្មែរ") : t("Other", "ផ្សេងៗ")}
                  </span>
                </div>
                <div className="flex justify-between rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2">
                  <span className="text-[var(--ink-dim)]">{t("Grapheme clusters", "ចំនួនតួអក្សរ")}</span>
                  <span className="rounded-md bg-[var(--ground-raised)] px-2 py-0.5 font-bold text-[var(--ink)]">
                    {analysis.graphemes.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
              <Binary size={15} className="text-[var(--gold)]" />
              {t("Grapheme decomposition", "ការបំបែកតួអក្សរ")}
            </div>
            <div className="flex flex-wrap gap-3">
              {analysis.graphemes.map((grapheme, idx) => (
                <div key={idx} className="min-w-[120px] flex-1 rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-3">
                  <div className="mb-2 text-center font-khmer text-2xl text-[var(--ink)]">{grapheme.cluster}</div>
                  {grapheme.chars.map((char, cIdx) => (
                    <div key={cIdx} className="mb-1 flex items-center justify-between gap-2 border-b border-[var(--ground-line)]/50 pb-1 text-[10px] font-mono last:border-0 last:pb-0">
                      <span className="text-[var(--ink-dim)]">{char.char}</span>
                      <span className="text-[var(--gold)]">{char.hex}</span>
                      <span className="text-[var(--ink-faint)]">{char.type}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="mb-3 text-sm font-semibold text-[var(--ink)]">
              {t("Related tools for Khmer names", "ឧបករណ៍ពាក់ព័ន្ធសម្រាប់ឈ្មោះខ្មែរ")}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {([
                { id: "name-generator", title: t("Khmer Name Generator", "បង្កើតឈ្មោះខ្មែរ") },
                { id: "romanization", title: t("Khmer Romanization", "បម្លែងអក្សរខ្មែរជាអក្សរឡាតាំង") },
                { id: "loanword-explorer", title: t("Khmer Loanword Explorer", "កម្មវិធីស្រាវជ្រាវពាក្យកម្ចីក្នុងភាសាខ្មែរ") },
                { id: "khmer-lexicon", title: t("Homophone", "សទិសសូរ") },
                { id: "phone-formatter", title: t("Khmer Phone Formatter", "រៀបចំទម្រង់លេខទូរស័ព្ទ") },
                { id: "address-formatter", title: t("Cambodia Bilingual Address Formatter", "រៀបចំទម្រង់អាសយដ្ឋានកម្ពុជាពីរភាសា") },
              ] as const).map((related) => (
                <a
                  key={related.id}
                  href={toolHref(related.id)}
                  className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)]"
                >
                  {related.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
