"use client";
import { useMemo, useState } from "react";
import { Dices, Printer, RefreshCw } from "lucide-react";
import khmerWords from "@/data/khmer-words.json";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { splitClusters } from "@/lib/khmer-syllables";
import { mulberry32 } from "@/lib/prng";
import { buildWordSearch, DIR_DIAGONAL, DIR_DOWN, DIR_RIGHT, shuffle, type Direction } from "@/lib/khmer-learning";

const WORDS = khmerWords as string[];
const KHMER_LETTER = /[ក-ឳ]/;
const KH_DIGITS = "០១២៣៤៥៦៧៨៩";
const toKh = (n: number) => String(n).replace(/\d/g, (d) => KH_DIGITS[Number(d)]);

const SAMPLE = ["កម្ពុជា", "សាលារៀន", "សៀវភៅ", "គ្រូបង្រៀន", "មិត្តភក្តិ", "ទន្លេ", "ភ្នំ", "ផ្កា"].join("\n");

let clusterPool: string[] | null = null;
/** Distinct clusters from the offline word list, used to fill empty cells with real-looking Khmer. */
function getClusterPool(): string[] {
  if (!clusterPool) {
    const set = new Set<string>();
    for (const w of WORDS) for (const c of splitClusters(w)) if (KHMER_LETTER.test(c)) set.add(c);
    clusterPool = [...set];
  }
  return clusterPool;
}

export default function KhmerWordSearch() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-wordsearch:words", SAMPLE);
  const [size, setSize] = useToolState("khmer-wordsearch:size", 10);
  const [diagonal, setDiagonal] = useToolState("khmer-wordsearch:diagonal", false);
  const [showAnswers, setShowAnswers] = useToolState("khmer-wordsearch:answers", false);
  const [seed, setSeed] = useState(1);

  const words = useMemo(() => {
    const seen = new Set<string>();
    const out: { word: string; clusters: string[] }[] = [];
    for (const raw of input.split(/[\n,،、\s]+/)) {
      const word = raw.trim();
      if (!word || seen.has(word) || !KHMER_LETTER.test(word)) continue;
      seen.add(word);
      out.push({ word, clusters: splitClusters(word).filter((c) => c.trim()) });
      if (out.length >= 20) break;
    }
    return out;
  }, [input]);

  const puzzle = useMemo(() => {
    const dirs: Direction[] = diagonal ? [DIR_RIGHT, DIR_DOWN, DIR_DIAGONAL] : [DIR_RIGHT, DIR_DOWN];
    return buildWordSearch(words, size, dirs, getClusterPool(), mulberry32(seed * 2654435761 + size));
  }, [words, size, diagonal, seed]);

  const answerCells = useMemo(() => {
    const s = new Set<string>();
    for (const p of puzzle.placed) for (const [r, c] of p.cells) s.add(`${r},${c}`);
    return s;
  }, [puzzle]);

  const randomWords = () => {
    const rand = mulberry32((Date.now() & 0xffffffff) >>> 0);
    const pool = WORDS.filter((w) => { const n = splitClusters(w).length; return n >= 2 && n <= 4; });
    setInput(shuffle(pool, rand).slice(0, 8).join("\n"));
    setSeed((s) => s + 1);
  };

  return (
    <ToolShell
      title="Khmer Word Search Puzzle"
      khmerTitle="ល្បែងស្វែងរកពាក្យខ្មែរ"
      description="Make a printable Khmer word-search puzzle where each grid square holds a whole Khmer syllable cluster (like ក្រ or ពុ), so subscripts and vowels are never split apart the way letter-by-letter generators do. Enter your own vocabulary list or draw random words from the offline dictionary, choose the grid size and directions, then print it with or without the answers."
      descriptionKm="បង្កើតល្បែងស្វែងរកពាក្យខ្មែរសម្រាប់បោះពុម្ព ដែលប្រអប់នីមួយៗផ្ទុកក្រុមអក្សរខ្មែរពេញ (ដូចជា ក្រ ឬ ពុ) ដូច្នេះជើង និងស្រៈមិនដែលត្រូវបំបែកដូចឧបករណ៍ដែលបំបែកតាមតួអក្សរនោះទេ។ បញ្ចូលបញ្ជីវាក្យសព្ទផ្ទាល់ខ្លួន ឬជ្រើសពាក្យចៃដន្យពីវចនានុក្រមក្រៅបណ្តាញ ជ្រើសទំហំក្រឡា និងទិស រួចបោះពុម្ពដោយមាន ឬគ្មានចម្លើយ។"
    >
      <Field label="Words (one per line, up to 20)" labelKm="ពាក្យ (មួយក្នុងមួយបន្ទាត់ រហូតដល់ ២០)">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={5} lang="km" className="font-khmer" />
      </Field>
      <div className="flex flex-wrap gap-2">
        <PillAction onClick={randomWords}><Dices size={13} />{t("Random dictionary words", "ពាក្យចៃដន្យពីវចនានុក្រម")}</PillAction>
      </div>

      <PillGroup label={t("Grid size", "ទំហំក្រឡា")}>
        {[8, 10, 12, 14].map((n) => <Pill key={n} active={size === n} onClick={() => setSize(n)}>{t(`${n} × ${n}`, `${toKh(n)} × ${toKh(n)}`)}</Pill>)}
      </PillGroup>
      <div className="flex flex-wrap items-center gap-2">
        <Pill active={diagonal} onClick={() => setDiagonal((v) => !v)}>{t("Include diagonals ↘", "រួមទាំងអង្កត់ទ្រូង ↘")}</Pill>
        <Pill active={showAnswers} onClick={() => setShowAnswers((v) => !v)}>{t("Show answers", "បង្ហាញចម្លើយ")}</Pill>
        <PillAction onClick={() => setSeed((s) => s + 1)}><RefreshCw size={13} />{t("New layout", "ប្លង់ថ្មី")}</PillAction>
        <PillAction onClick={() => window.print()} disabled={puzzle.placed.length === 0}><Printer size={13} />{t("Print", "បោះពុម្ព")}</PillAction>
      </div>

      {words.length === 0 ? (
        <p className="text-xs text-[var(--ink-faint)]">{t("Enter some Khmer words to build the puzzle.", "បញ្ចូលពាក្យខ្មែរខ្លះដើម្បីបង្កើតល្បែង។")}</p>
      ) : (
        <div id="khmer-wordsearch-print" className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="overflow-x-auto">
            <table className="mx-auto border-collapse" lang="km">
              <tbody>
                {puzzle.cells.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td
                        key={c}
                        className={`h-9 w-9 border border-[var(--ground-line)] text-center font-khmer text-base sm:h-11 sm:w-11 sm:text-lg ${showAnswers && answerCells.has(`${r},${c}`) ? "bg-[var(--gold)]/25 font-semibold text-[var(--ink)]" : "text-[var(--ink)]"}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {puzzle.placed.map((p) => (
              <span key={p.word} lang="km" className="rounded border border-[var(--ground-line)] px-2 py-0.5 font-khmer text-[var(--ink)]">{p.word}</span>
            ))}
          </div>
          {puzzle.skipped.length > 0 && (
            <p className="mt-3 text-center text-xs text-[var(--danger)]">
              {t("Didn't fit (try a bigger grid or fewer words):", "មិនសមនឹងក្រឡា (សាកក្រឡាធំជាង ឬពាក្យតិចជាង)៖")} <span lang="km" className="font-khmer">{puzzle.skipped.join(", ")}</span>
            </p>
          )}
        </div>
      )}
      <style jsx global>{`@media print { body * { visibility: hidden !important; } #khmer-wordsearch-print, #khmer-wordsearch-print * { visibility: visible !important; } #khmer-wordsearch-print { position: absolute; inset: 0; width: 100%; border: none; background: #fff; color: #000; padding: 10mm; } #khmer-wordsearch-print td { border-color: #999 !important; color: #000 !important; } @page { size: A4 portrait; margin: 12mm; } }`}</style>

      <SourceCredits>
        <p>{t(
          "Words are split into orthographic clusters with the browser's Intl.Segmenter; empty squares are filled with clusters taken from the app's offline Khmer word list (~1,850 words, built from Chuon Nath & Headley dictionary data and the common-word POS lexicon), so the grid looks like real Khmer. Words read left→right and top→bottom (optionally diagonally); they are never reversed because Khmer clusters don't read backwards. Placement is random and seeded in your browser. Original Tools123 implementation; see also the general Word Search Generator for Latin letters.",
          "ពាក្យត្រូវបំបែកជាក្រុមអក្សរដោយ Intl.Segmenter របស់កម្មវិធីរុករក ប្រអប់ទទេត្រូវបំពេញដោយក្រុមអក្សរយកពីបញ្ជីពាក្យខ្មែរក្រៅបណ្តាញរបស់កម្មវិធី (~១,៨៥០ ពាក្យ បង្កើតពីទិន្នន័យវចនានុក្រមជួន ណាត និង Headley និងវចនានុក្រមពាក្យធម្មតា) ដូច្នេះក្រឡាមើលទៅដូចខ្មែរពិត។ ពាក្យអានពីឆ្វេង→ស្តាំ និងលើ→ក្រោម (ជាជម្រើសតាមអង្កត់ទ្រូង) មិនដែលបញ្ច្រាសទេ ព្រោះក្រុមអក្សរខ្មែរមិនអានថយក្រោយ។ ការដាក់ជាចៃដន្យក្នុងកម្មវិធីរុករក។ ការអនុវត្តដើមរបស់ Tools123 សូមមើលផងដែរឧបករណ៍បង្កើតល្បែងរកពាក្យទូទៅសម្រាប់អក្សរឡាតាំង។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
