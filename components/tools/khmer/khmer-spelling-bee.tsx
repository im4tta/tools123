"use client";
import { useMemo, useState } from "react";
import { Delete, RefreshCw, Shuffle } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { PillAction } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { beeAnswers, beeScore, isPangram, letterSet, pickBeePuzzle, type BeePuzzle } from "@/lib/khmer-word-games";
import { toKhmerNumerals } from "@/lib/khmer-number-words";
import { shuffle } from "@/lib/khmer-learning";
import khmerWords from "@/data/khmer-words.json";

const WORDS = khmerWords as string[];
const kh = (n: number) => toKhmerNumerals(String(n));
// Vowel signs and marks a player can add between letters (the hive only limits consonants).
const MARKS = ["ា", "ិ", "ី", "ឹ", "ឺ", "ុ", "ូ", "ួ", "ើ", "ឿ", "ៀ", "េ", "ែ", "ៃ", "ោ", "ៅ", "ំ", "ះ", "់", "្"];

export default function KhmerSpellingBee() {
  const { text: t } = useLanguage();
  const [puzzle, setPuzzle] = useToolState<BeePuzzle | null>("khmer-spelling-bee:puzzle", null);
  const [found, setFound] = useToolState<string[]>("khmer-spelling-bee:found", []);
  const [entry, setEntry] = useState("");
  const [message, setMessage] = useState("");
  const [outerOrder, setOuterOrder] = useState<string[] | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  const all = useMemo(() => (puzzle ? [puzzle.center, ...puzzle.letters] : []), [puzzle]);
  const full = useMemo(() => (puzzle ? { letters: all, center: puzzle.center } : null), [puzzle, all]);
  const answers = useMemo(() => (full ? beeAnswers(WORDS, full) : []), [full]);
  const maxScore = useMemo(() => (full ? answers.reduce((s, w) => s + beeScore(w, full), 0) : 0), [answers, full]);
  const score = full ? found.reduce((s, w) => s + beeScore(w, full), 0) : 0;
  // Shuffle only re-orders the outer letters on screen; the puzzle itself is unchanged.
  const outer = outerOrder && puzzle && outerOrder.length === puzzle.letters.length ? outerOrder : puzzle?.letters ?? [];

  const newPuzzle = () => {
    setPuzzle(pickBeePuzzle(WORDS, [6, 7], 8, 80, Math.random));
    setFound([]); setEntry(""); setMessage(""); setShowAnswers(false); setOuterOrder(null);
  };

  const submit = () => {
    const word = entry.trim();
    if (!word || !full) return;
    const ls = letterSet(word);
    if (ls.some((l) => !all.includes(l))) setMessage(t("Use only the letters in the hive.", "ប្រើតែអក្សរក្នុងសំបុក។"));
    else if (!ls.includes(full.center)) setMessage(t("Every word must use the centre letter.", "ពាក្យនីមួយៗត្រូវប្រើអក្សរកណ្តាល។"));
    else if (found.includes(word)) setMessage(t("Already found.", "បានរកឃើញរួចហើយ។"));
    else if (!answers.includes(word)) setMessage(t("Not in the offline word list.", "មិនមានក្នុងបញ្ជីពាក្យក្រៅបណ្តាញទេ។"));
    else {
      setFound([word, ...found]);
      setMessage(isPangram(word, full) ? t(`Every letter! +${beeScore(word, full)}`, `គ្រប់អក្សរ! +${kh(beeScore(word, full))}`) : t(`+${beeScore(word, full)}`, `+${kh(beeScore(word, full))}`));
    }
    setEntry("");
  };

  const tile = "flex h-14 w-14 items-center justify-center rounded-full border font-khmer text-2xl transition active:scale-95";

  return (
    <ToolShell
      title="Khmer Spelling Bee"
      khmerTitle="ល្បែងប្រកបពាក្យពីសំបុកអក្សរ"
      description="Make as many Khmer words as you can from a hive of 6–7 letters. Every word must use the centre letter, may repeat letters, and can add any vowel signs; at least one word uses every letter. Answers come from the offline word list."
      descriptionKm="បង្កើតពាក្យខ្មែរឱ្យបានច្រើនតាមដែលអាចពីសំបុកអក្សរ ៦–៧ តួ។ ពាក្យនីមួយៗត្រូវប្រើអក្សរកណ្តាល អាចប្រើអក្សរដដែលៗ និងអាចបន្ថែមស្រៈណាក៏បាន ហើយយ៉ាងហោចណាស់មានពាក្យមួយប្រើគ្រប់អក្សរ។ ចម្លើយមកពីបញ្ជីពាក្យក្រៅបណ្តាញ។"
    >
      {!puzzle || !full ? (
        <Button onClick={newPuzzle}>{t("New puzzle", "ល្បែងថ្មី")}</Button>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-[var(--ink-dim)]">{t(`Score ${score} of ${maxScore} · ${found.length} of ${answers.length} words`, `ពិន្ទុ ${kh(score)} ក្នុងចំណោម ${kh(maxScore)} · ពាក្យ ${kh(found.length)} ក្នុងចំណោម ${kh(answers.length)}`)}</span>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--ground-line)] sm:w-48">
              <div className="h-full bg-[var(--gold)] transition-all" style={{ width: `${maxScore ? (score / maxScore) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-center">
            <p lang="km" className="min-h-[2.4rem] font-khmer text-3xl leading-[1.6] text-[var(--ink)]">{entry || <span className="text-[var(--ink-faint)]">…</span>}</p>
            {message && <p className="text-sm text-[var(--ink-dim)]" role="status">{message}</p>}
          </div>

          {/* Honeycomb rows: 2 letters, then outer–centre–outer, then the rest. */}
          <div className="flex flex-col items-center gap-2" aria-label={t("Hive letters", "អក្សរក្នុងសំបុក")}>
            {[outer.slice(0, 2), [outer[2], puzzle.center, outer[3]], outer.slice(4)].map((row, r) => (
              <div key={r} className="flex justify-center gap-2">
                {row.filter(Boolean).map((l) => (
                  <button key={l} type="button" onClick={() => setEntry(entry + l)} className={`${tile} ${l === puzzle.center ? "border-[var(--gold)] bg-[var(--gold)] text-[#0a0c0d]" : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink)]"}`}>
                    <span lang="km">{l}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-1" aria-label={t("Vowel signs and marks", "ស្រៈ និងសញ្ញា")}>
            {MARKS.map((mk) => (
              <button key={mk} type="button" onClick={() => setEntry(entry + mk)} className="flex h-11 min-w-11 items-center justify-center rounded-md border border-[var(--ground-line)] font-khmer text-xl text-[var(--ink)]">
                <span lang="km">{mk === "្" ? "◌្" : `◌${mk}`}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <PillAction onClick={() => setEntry([...entry].slice(0, -1).join(""))}><Delete size={13} />{t("Delete", "លុប")}</PillAction>
            <PillAction onClick={() => setOuterOrder(shuffle(outer, Math.random))}><Shuffle size={13} />{t("Shuffle", "សាប់")}</PillAction>
            <Button onClick={submit}>{t("Enter", "បញ្ចូល")}</Button>
          </div>

          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <input value={entry} onChange={(e) => setEntry(e.target.value)} lang="km" aria-label={t("Or type the word", "ឬវាយពាក្យ")} placeholder={t("…or type with a Khmer keyboard", "…ឬវាយដោយក្ដារចុចខ្មែរ")} className="min-w-0 flex-1 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 font-khmer text-lg text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" />
          </form>

          {found.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Found", "បានរកឃើញ")}</p>
              <p lang="km" className="flex flex-wrap gap-1.5 font-khmer text-lg">
                {found.map((w) => <span key={w} className={`rounded px-2 ${isPangram(w, full) ? "bg-[var(--gold)]/20 text-[var(--gold)]" : "bg-[var(--ground-raised)] text-[var(--ink)]"}`}>{w}</span>)}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <PillAction onClick={() => setShowAnswers(!showAnswers)}>{showAnswers ? t("Hide answers", "លាក់ចម្លើយ") : t("Show answers", "បង្ហាញចម្លើយ")}</PillAction>
            <PillAction onClick={newPuzzle}><RefreshCw size={13} />{t("New puzzle", "ល្បែងថ្មី")}</PillAction>
          </div>
          {showAnswers && (
            <p lang="km" className="flex flex-wrap gap-1.5 font-khmer text-base">
              {answers.map((w) => <span key={w} className={`rounded px-2 ${found.includes(w) ? "text-[var(--teal)]" : "text-[var(--ink-dim)]"}`}>{w}</span>)}
            </p>
          )}
        </div>
      )}

      <SourceCredits>
        <p>{t(
          "Words come from the app's offline Khmer word list (built from Chuon Nath & Headley dictionary data and the common-word lexicon). Here a “letter” is a consonant or independent vowel, including subscript consonants; vowel signs are free. The hive is always taken from a real word in the list, so at least one answer uses every letter. Scoring (one point per letter, +7 for using every letter) is this app's own. Inspired by the hive-style word puzzle popularised by The New York Times' Spelling Bee; independent Tools123 implementation, not affiliated. Progress is saved in this browser only.",
          "ពាក្យមកពីបញ្ជីពាក្យខ្មែរក្រៅបណ្តាញរបស់កម្មវិធី (បង្កើតពីទិន្នន័យវចនានុក្រមជួន ណាត និង Headley និងវចនានុក្រមពាក្យធម្មតា)។ នៅទីនេះ «អក្សរ» គឺព្យញ្ជនៈ ឬស្រៈពេញតួ រួមទាំងជើងអក្សរ ចំណែកស្រៈនិស្ស័យប្រើបានសេរី។ សំបុកអក្សរតែងតែយកពីពាក្យពិតក្នុងបញ្ជី ដូច្នេះយ៉ាងហោចណាស់មានចម្លើយមួយប្រើគ្រប់អក្សរ។ ការដាក់ពិន្ទុ (មួយពិន្ទុក្នុងមួយអក្សរ +៧ សម្រាប់ប្រើគ្រប់អក្សរ) ជារបស់កម្មវិធីនេះផ្ទាល់។ បំផុសគំនិតពីល្បែងពាក្យបែបសំបុកដែល Spelling Bee របស់ The New York Times ធ្វើឱ្យល្បី។ ការអនុវត្តឯករាជ្យរបស់ Tools123 មិនពាក់ព័ន្ធទេ។ វឌ្ឍនភាពរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
