"use client";
import { useMemo } from "react";
import { Shuffle } from "lucide-react";
import khmerWords from "@/data/khmer-words.json";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { splitClusters } from "@/lib/khmer-syllables";

const WORDS = khmerWords as string[];

// Pre-compute each dictionary word's sorted cluster signature once.
const WORD_CLUSTERS: { word: string; clusters: string[] }[] = WORDS.map((word) => ({ word, clusters: splitClusters(word) }));

function multisetOf(clusters: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const c of clusters) m.set(c, (m.get(c) ?? 0) + 1);
  return m;
}

function isSubset(part: Map<string, number>, whole: Map<string, number>): boolean {
  for (const [k, v] of part) if ((whole.get(k) ?? 0) < v) return false;
  return true;
}

export default function KhmerAnagramFinder() {
  const { text: t } = useLanguage();
  const [letters, setLetters] = useToolState("khmer-anagram:letters", "");
  const [mode, setMode] = useToolState<"exact" | "subset">("khmer-anagram:mode", "exact");

  const { results, active } = useMemo(() => {
    const clusters = splitClusters(letters.trim());
    const active = clusters.length > 0;
    if (!active) return { results: [] as string[], active };
    const pool = multisetOf(clusters);
    const poolSize = clusters.length;
    const out: string[] = [];
    for (const { word, clusters: wc } of WORD_CLUSTERS) {
      if (wc.length === 0) continue;
      if (mode === "exact") {
        if (wc.length !== poolSize) continue;
        const need = multisetOf(wc);
        if (isSubset(need, pool) && isSubset(pool, need)) out.push(word);
      } else {
        if (wc.length > poolSize) continue;
        if (isSubset(multisetOf(wc), pool)) out.push(word);
      }
      if (out.length >= 300) break;
    }
    // Longest first so the most interesting words are on top.
    out.sort((a, b) => splitClusters(b).length - splitClusters(a).length || a.localeCompare(b));
    return { results: out, active };
  }, [letters, mode]);

  return (
    <ToolShell
      title="Khmer Anagram Finder"
      khmerTitle="ឧបករណ៍ស្វែងរកពាក្យច្របូកអក្សរ"
      description="Enter a set of Khmer letters (orthographic clusters) and find real Khmer words you can spell from them — exact anagrams that use every cluster, or shorter words that use only some. Great for word games, unscrambling puzzles, and vocabulary practice. Checks a list of ~1,850 common Khmer words in your browser."
      descriptionKm="បញ្ចូលក្រុមអក្សរខ្មែរ ហើយស្វែងរកពាក្យខ្មែរពិតដែលអ្នកអាចផ្គុំបាន — ពាក្យច្របូកត្រង់ៗដែលប្រើគ្រប់ក្រុមអក្សរ ឬពាក្យខ្លីៗដែលប្រើតែខ្លះ។ ល្អសម្រាប់ល្បែងពាក្យ ការស្រាយអក្សរ និងការអនុវត្តវាក្យសព្ទ។ ផ្ទៀងផ្ទាត់នឹងបញ្ជីពាក្យខ្មែរធម្មតាប្រមាណ ១,៨៥០ ក្នុងកម្មវិធីរុករក។"
    >
      <Field label="Your letters" labelKm="អក្សររបស់អ្នក" hint="e.g. ក ា រ ង" hintKm="ឧ. ក ា រ ង">
        <TextInput value={letters} onChange={(e) => setLetters(e.target.value)} placeholder={t("Type or paste Khmer letters…", "វាយ ឬបិទភ្ជាប់អក្សរខ្មែរ…")} lang="km" className="font-khmer" autoComplete="off" />
      </Field>

      <div className="flex flex-wrap gap-2">
        {([["exact", "Exact anagram", "ច្របូកត្រង់"], ["subset", "Words from these letters", "ពាក្យពីអក្សរទាំងនេះ"]] as const).map(([id, en, km]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
              mode === id ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"
            }`}
          >
            {t(en, km)}
          </button>
        ))}
      </div>

      {active ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-xs text-[var(--ink-faint)]">
              <Shuffle size={13} className="text-[var(--gold)]" />
              {t(`${results.length}${results.length === 300 ? "+" : ""} word${results.length === 1 ? "" : "s"} found`, `រកឃើញ ${results.length}${results.length === 300 ? "+" : ""} ពាក្យ`)}
            </span>
            {results.length > 0 && <CopyButton text={results.join("\n")} compact />}
          </div>
          {results.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {results.map((w) => (
                <span key={w} lang="km" className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2.5 py-1 font-khmer text-sm text-[var(--ink)]">{w}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--ink-faint)]">{t("No dictionary words can be spelled from these letters. Try more or different letters.", "គ្មានពាក្យក្នុងវចនានុក្រមអាចផ្គុំពីអក្សរទាំងនេះទេ។ សូមសាកអក្សរច្រើន ឬផ្សេង។")}</p>
          )}
        </>
      ) : (
        <p className="text-xs text-[var(--ink-faint)]">{t("Enter some Khmer letters to search.", "បញ្ចូលអក្សរខ្មែរខ្លះដើម្បីស្វែងរក។")}</p>
      )}

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Letters are grouped into Khmer orthographic clusters with the browser's Intl.Segmenter, and matched against the offline word list bundled in this app (~1,850 words, built from Chuon Nath & Headley dictionary data and the common-word POS lexicon). It runs entirely in your browser and is not an exhaustive dictionary.",
          "អក្សរត្រូវបានដាក់ជាក្រុមអក្សរខ្មែរដោយ Intl.Segmenter របស់កម្មវិធីរុករក ហើយផ្គូផ្គងនឹងបញ្ជីពាក្យក្រៅបណ្តាញដែលភ្ជាប់មកជាមួយកម្មវិធីនេះ (~១,៨៥០ ពាក្យ បង្កើតពីទិន្នន័យវចនានុក្រមជួន ណាត និង Headley និងវចនានុក្រមពាក្យធម្មតា)។ វាដំណើរការទាំងស្រុងក្នុងកម្មវិធីរុករក ហើយមិនមែនជាវចនានុក្រមពេញលេញទេ។",
        )}</p>
      </section>
    </ToolShell>
  );
}
