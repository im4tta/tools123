"use client";
import { useMemo } from "react";
import { SpellCheck, Check } from "lucide-react";
import khmerWords from "@/data/khmer-words.json";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const WORDS = khmerWords as string[];
const WORD_SET = new Set(WORDS);
const KHMER = /[ក-៿]/;

function clusters(word: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return [...new Intl.Segmenter("km", { granularity: "grapheme" }).segment(word)].map((s) => s.segment);
  }
  return [...word];
}

// Levenshtein edit distance over orthographic clusters (better for Khmer than
// code points, since a consonant + its vowels/coeng count as one unit).
function editDistance(a: string[], b: string[]): number {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j - 1], prev[j], cur[j - 1]);
    }
    prev = cur;
  }
  return prev[n];
}

export default function KhmerSpellSuggester() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-spell-suggester:input", "");

  const result = useMemo(() => {
    const word = input.trim();
    if (!word || !KHMER.test(word)) return null;
    if (WORD_SET.has(word)) return { known: true, suggestions: [] as { word: string; dist: number }[] };
    const target = clusters(word);
    const scored: { word: string; dist: number }[] = [];
    for (const w of WORDS) {
      const d = editDistance(target, clusters(w));
      // Only keep close candidates; the threshold scales a little with length.
      if (d <= Math.max(2, Math.round(target.length / 3) + 1)) scored.push({ word: w, dist: d });
    }
    scored.sort((a, b) => a.dist - b.dist || [...a.word].length - [...b.word].length || a.word.localeCompare(b.word, "km"));
    return { known: false, suggestions: scored.slice(0, 12) };
  }, [input]);

  return (
    <ToolShell
      title="Khmer Spell Suggester"
      khmerTitle="ឧបករណ៍ណែនាំអក្ខរាវិរុទ្ធខ្មែរ"
      description="Type a Khmer word and, if it isn't in the dictionary, get the closest real words — ranked by how few letters need changing. A quick way to catch a typo or find the correct spelling of a word you half-remember, checked against a list of ~1,850 common Khmer words."
      descriptionKm="វាយពាក្យខ្មែរ ហើយបើវាមិនមានក្នុងវចនានុក្រម អ្នកនឹងទទួលបានពាក្យពិតជិតបំផុត — តម្រៀបតាមចំនួនតួអក្សរដែលត្រូវផ្លាស់ប្តូរតិចបំផុត។ ជាមធ្យោបាយរហ័សដើម្បីចាប់កំហុសអក្ខរាវិរុទ្ធ ឬរកអក្ខរាវិរុទ្ធត្រឹមត្រូវនៃពាក្យដែលអ្នកចាំមិនច្បាស់ ផ្ទៀងផ្ទាត់នឹងបញ្ជីពាក្យខ្មែរធម្មតាប្រមាណ ១,៨៥០។"
    >
      <Field label="Khmer word" labelKm="ពាក្យខ្មែរ">
        <TextInput value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("Type a word, e.g. សំរាប់", "វាយពាក្យ ឧ. សំរាប់")} autoFocus autoComplete="off" />
      </Field>

      {result?.known && (
        <div className="flex items-center gap-2 rounded-md border border-[var(--success)]/40 bg-[var(--success)]/10 p-3 text-sm text-[var(--success)]">
          <Check size={16} className="shrink-0" />
          {t("This word is in the dictionary.", "ពាក្យនេះមានក្នុងវចនានុក្រម។")}
        </div>
      )}

      {result && !result.known && (
        result.suggestions.length > 0 ? (
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]"><SpellCheck size={14} className="text-[var(--gold)]" />{t("Did you mean", "តើអ្នកចង់មានន័យថា")}</div>
            <div className="flex flex-wrap gap-2">
              {result.suggestions.map((s) => (
                <button key={s.word} type="button" onClick={() => setInput(s.word)} lang="km" className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 font-khmer text-sm text-[var(--ink)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)]">
                  {s.word}
                  <span className="ml-1.5 text-[10px] text-[var(--ink-faint)]">{s.dist === 1 ? t("1 change", "១ ផ្លាស់ប្តូរ") : t(`${s.dist} changes`, `${s.dist} ផ្លាស់ប្តូរ`)}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--ink-faint)]">{t("No close match in the common-word list — the word may be rare, a name, or spelled very differently.", "គ្មានពាក្យជិតគ្នាក្នុងបញ្ជីពាក្យធម្មតា — ពាក្យនេះអាចជាពាក្យកម្រ ឈ្មោះ ឬសរសេរខុសគ្នាឆ្ងាយ។")}</p>
        )
      )}

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "The word list is built from the offline Chuon Nath & Headley dictionary data and the common-word POS lexicon bundled in this app (~1,850 words). Suggestions use edit distance over Khmer clusters, computed in your browser. Coverage is common vocabulary only — a missing suggestion doesn't mean a word is wrong.",
          "បញ្ជីពាក្យបង្កើតពីទិន្នន័យវចនានុក្រមជួន ណាត និង Headley និងវចនានុក្រមពាក្យធម្មតា ដែលភ្ជាប់មកជាមួយកម្មវិធីនេះ (~១,៨៥០ ពាក្យ)។ ការណែនាំប្រើគម្លាតកែតម្រូវលើក្រុមអក្សរខ្មែរ គណនាក្នុងកម្មវិធីរុករក។ គ្របដណ្តប់តែពាក្យធម្មតា — ការគ្មានពាក្យណែនាំមិនមានន័យថាពាក្យខុសទេ។",
        )}</p>
      </section>
    </ToolShell>
  );
}
