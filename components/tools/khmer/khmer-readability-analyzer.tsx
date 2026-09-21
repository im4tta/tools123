"use client";
import { useMemo } from "react";
import { Gauge } from "lucide-react";
import { split as splitKhmer } from "split-khmer";
import { normalize } from "khmer-nlp-toolkit";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

// Khmer letters that start an orthographic syllable (consonants + independent
// vowels). A grapheme cluster containing one of these counts as one syllable.
const KHMER_BASE = /[ក-អឥ-ឳ]/;
const KHMER_ANY = /[ក-៿]/;

function khmerSyllables(text: string): number {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    let n = 0;
    for (const { segment } of new Intl.Segmenter("km", { granularity: "grapheme" }).segment(text)) {
      if (KHMER_BASE.test(segment)) n += 1;
    }
    return n;
  }
  return [...text].filter((c) => KHMER_BASE.test(c)).length;
}

// A transparent, heuristic difficulty band. It is NOT an official readability
// standard (Khmer has none) — just the two structural signals readability
// formulas use everywhere: how long sentences run, and how long words run.
function difficultyBand(wps: number, spw: number): { key: string; km: string; color: string } {
  if (wps <= 10 && spw <= 2.2) return { key: "Easy", km: "ងាយស្រួល", color: "#16a34a" };
  if (wps >= 18 || spw >= 2.8) return { key: "Complex", km: "ស្មុគស្មាញ", color: "#dc2626" };
  return { key: "Moderate", km: "មធ្យម", color: "#d97706" };
}

export default function KhmerReadabilityAnalyzer() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState(
    "khmer-readability-analyzer:input",
    "ភាសាខ្មែរ គឺជាភាសាផ្លូវការរបស់ប្រទេសកម្ពុជា។ វាមានអក្សរផ្ទាល់ខ្លួន ដែលមានប្រវត្តិយូរលង់ណាស់។ សិស្សានុសិស្សគ្រប់រូបគួររៀនសរសេរ និងអានឲ្យបានស្ទាត់ជំនាញ។",
  );

  const stats = useMemo(() => {
    const clean = normalize(input).trim();
    if (!clean || !KHMER_ANY.test(clean)) return null;

    // Sentences: split on Khmer/Latin sentence enders and hard line breaks.
    const sentences = clean.split(/[។៕!?]+|\n+/).map((s) => s.trim()).filter((s) => KHMER_ANY.test(s));
    const sentenceCount = Math.max(sentences.length, 1);

    // Words: split-khmer segments; keep only those with Khmer letters.
    const words = splitKhmer(clean)
      .flatMap((chunk) => chunk.split(/\s+/))
      .filter((w) => KHMER_ANY.test(w));
    const wordCount = words.length;
    if (!wordCount) return null;

    const syllables = khmerSyllables(clean);
    const uniqueWords = new Set(words).size;
    const wps = wordCount / sentenceCount;
    const spw = syllables / wordCount;
    const variety = uniqueWords / wordCount;
    const band = difficultyBand(wps, spw);

    return { sentenceCount, wordCount, syllables, uniqueWords, wps, spw, variety, band };
  }, [input]);

  const copyText = useMemo(() => {
    if (!stats) return "";
    return [
      `${t("Sentences", "ប្រយោគ")}: ${stats.sentenceCount}`,
      `${t("Words", "ពាក្យ")}: ${stats.wordCount}`,
      `${t("Syllables", "ព្យាង្គ")}: ${stats.syllables}`,
      `${t("Unique words", "ពាក្យខុសៗ")}: ${stats.uniqueWords}`,
      `${t("Words / sentence", "ពាក្យ/ប្រយោគ")}: ${stats.wps.toFixed(1)}`,
      `${t("Syllables / word", "ព្យាង្គ/ពាក្យ")}: ${stats.spw.toFixed(2)}`,
      `${t("Lexical variety", "ភាពសម្បូរពាក្យ")}: ${Math.round(stats.variety * 100)}%`,
      `${t("Difficulty", "កម្រិតលំបាក")}: ${t(stats.band.key, stats.band.km)}`,
    ].join("\n");
  }, [stats, t]);

  const cards = stats
    ? [
        { label: t("Sentences", "ប្រយោគ"), value: String(stats.sentenceCount) },
        { label: t("Words", "ពាក្យ"), value: String(stats.wordCount) },
        { label: t("Syllables", "ព្យាង្គ"), value: String(stats.syllables) },
        { label: t("Unique words", "ពាក្យខុសៗ"), value: String(stats.uniqueWords) },
        { label: t("Words / sentence", "ពាក្យ/ប្រយោគ"), value: stats.wps.toFixed(1) },
        { label: t("Syllables / word", "ព្យាង្គ/ពាក្យ"), value: stats.spw.toFixed(2) },
        { label: t("Lexical variety", "ភាពសម្បូរពាក្យ"), value: `${Math.round(stats.variety * 100)}%` },
      ]
    : [];

  return (
    <ToolShell
      title="Khmer Readability Analyzer"
      khmerTitle="ឧបករណ៍វិភាគភាពងាយអានខ្មែរ"
      description="Measure how easy a Khmer text is to read. It segments the text with split-khmer and counts sentences, words, and syllables, then reports the average sentence length, average word length, vocabulary variety, and a plain difficulty band. Useful for teachers, writers, and editors checking whether a passage is simple enough for its audience."
      descriptionKm="វាស់ថាតើអត្ថបទខ្មែរងាយអានកម្រិតណា។ វាបំបែកអត្ថបទដោយ split-khmer រាប់ប្រយោគ ពាក្យ និងព្យាង្គ រួចរាយការណ៍ប្រវែងប្រយោគមធ្យម ប្រវែងពាក្យមធ្យម ភាពសម្បូរនៃវាក្យស័ព្ទ និងកម្រិតលំបាកសាមញ្ញ។ មានប្រយោជន៍សម្រាប់គ្រូ អ្នកនិពន្ធ និងអ្នកកែសម្រួល ដើម្បីពិនិត្យថាតើអត្ថបទសាមញ្ញគ្រប់គ្រាន់សម្រាប់អ្នកអានឬអត់។"
    >
      <Field label="Khmer text" labelKm="អត្ថបទខ្មែរ" hint="A paragraph or more works best" hintKm="កថាខណ្ឌ ឬវែងជាងនេះកាន់តែល្អ">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={5} placeholder={t("Paste Khmer text to analyse…", "បិទភ្ជាប់អត្ថបទខ្មែរដើម្បីវិភាគ…")} autoFocus />
      </Field>

      {stats && (
        <>
          {/* Difficulty headline */}
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Gauge size={22} style={{ color: stats.band.color }} className="shrink-0" />
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">{t("Estimated difficulty", "កម្រិតលំបាកប៉ាន់ស្មាន")}</div>
                  <div className="text-xl font-semibold" style={{ color: stats.band.color }}>{t(stats.band.key, stats.band.km)}</div>
                </div>
              </div>
              <CopyButton text={copyText} compact />
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--ink-faint)]">
              {t(
                `Based on ${stats.wps.toFixed(1)} words per sentence and ${stats.spw.toFixed(2)} syllables per word. Longer sentences and longer words make text harder to read.`,
                `ផ្អែកលើ ${stats.wps.toFixed(1)} ពាក្យក្នុងមួយប្រយោគ និង ${stats.spw.toFixed(2)} ព្យាង្គក្នុងមួយពាក្យ។ ប្រយោគវែង និងពាក្យវែង ធ្វើឲ្យអត្ថបទពិបាកអានជាង។`,
              )}
            </p>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {cards.map((c) => (
              <div key={c.label} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
                <div className="text-[11px] text-[var(--ink-faint)]">{c.label}</div>
                <div className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--ink)]">{c.value}</div>
              </div>
            ))}
          </div>

          <p className="text-[11px] leading-5 text-[var(--ink-faint)]">
            {t(
              "The difficulty band is a transparent heuristic from average sentence and word length — not an official readability grade (Khmer has no standard one). Word boundaries are automatic and may differ slightly from a human's; treat the figures as a guide, not an exact measure.",
              "កម្រិតលំបាកគឺជាការប៉ាន់ស្មានតាមប្រវែងប្រយោគ និងពាក្យមធ្យម — មិនមែនជាកម្រិតអានផ្លូវការទេ (ភាសាខ្មែរគ្មានស្តង់ដារបែបនេះ)។ ព្រំដែនពាក្យគឺស្វ័យប្រវត្តិ ហើយអាចខុសបន្តិចពីមនុស្ស។ សូមចាត់ទុកតួលេខជាការណែនាំ មិនមែនជារង្វាស់ជាក់លាក់ទេ។",
            )}
          </p>
        </>
      )}

      {/* Source & Credits */}
      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>
          {t(
            "Word segmentation by split-khmer (Seanghay Yath, MIT); text normalisation by khmer-nlp-toolkit (github:vengmony, MIT). Syllables are counted as Khmer orthographic clusters via the browser's Intl.Segmenter. All metrics are computed from your text in the browser — nothing is looked up or sent anywhere.",
            "ការបំបែកពាក្យដោយ split-khmer (Seanghay Yath, MIT)។ ការធ្វើឲ្យអត្ថបទធម្មតាដោយ khmer-nlp-toolkit (github:vengmony, MIT)។ ព្យាង្គត្រូវរាប់ជាក្រុមអក្សរខ្មែរតាម Intl.Segmenter របស់កម្មវិធីរុករក។ តួលេខទាំងអស់គណនាពីអត្ថបទរបស់អ្នកក្នុងកម្មវិធីរុករក គ្មានការរកមើល ឬបញ្ជូនទៅណាទេ។",
          )}
        </p>
      </section>
    </ToolShell>
  );
}
