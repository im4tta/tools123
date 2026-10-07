"use client";
import { useState } from "react";
import { Lightbulb, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { PillAction } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { STATIC_DATABASE } from "@/lib/khmer-lexicon-db";
import { KHMER_CONSONANTS, KHMER_INDEPENDENT_VOWELS } from "@/lib/data/khmer-romanization";
import { splitClusters } from "@/lib/khmer-syllables";
import { hangmanSolved, letterSet, maskClusters, wrongGuesses } from "@/lib/khmer-word-games";
import { toKhmerNumerals } from "@/lib/khmer-number-words";

const LIVES = 7;
const kh = (n: number) => toKhmerNumerals(String(n));
// Lexicon words with 2–5 clusters, so every puzzle has a Khmer definition as its clue.
const POOL = Object.values(STATIC_DATABASE).filter((e) => {
  const n = splitClusters(e.word).length;
  return n >= 2 && n <= 5 && e.definition;
});
const KEYS = [...Object.keys(KHMER_CONSONANTS), ...Object.keys(KHMER_INDEPENDENT_VOWELS)];

export default function KhmerHangman() {
  const { text: t } = useLanguage();
  const [word, setWord] = useState<string | null>(null);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [showClue, setShowClue] = useState(false);
  const [stats, setStats] = useToolState("khmer-hangman:stats", { won: 0, lost: 0 });

  const entry = word ? STATIC_DATABASE[word] : null;
  const guessedSet = new Set(guessed);
  const wrong = word ? wrongGuesses(word, guessed) : [];
  const won = Boolean(word) && hangmanSolved(word!, guessedSet);
  const lost = Boolean(word) && !won && wrong.length >= LIVES;
  const over = won || lost;
  const wordLetters = word ? new Set(letterSet(word)) : new Set<string>();
  const keys = KEYS.filter((k) => KHMER_CONSONANTS[k] || wordLetters.has(k)); // only offer independent vowels the word uses

  const start = () => {
    setWord(POOL[Math.floor(Math.random() * POOL.length)].word);
    setGuessed([]);
    setShowClue(false);
  };

  const guess = (letter: string) => {
    if (!word || over || guessedSet.has(letter)) return;
    const next = [...guessed, letter];
    setGuessed(next);
    const nowWon = hangmanSolved(word, new Set(next));
    const nowLost = !nowWon && wrongGuesses(word, next).length >= LIVES;
    if (nowWon) setStats({ ...stats, won: stats.won + 1 });
    if (nowLost) setStats({ ...stats, lost: stats.lost + 1 });
  };

  return (
    <ToolShell
      title="Khmer Hangman"
      khmerTitle="ល្បែងទាយពាក្យខ្មែរ (ហែងមែន)"
      description="Guess the hidden Khmer word one consonant at a time before you run out of seven lives. Vowel signs need no guessing — a syllable appears as soon as all its letters are found. Stuck? Read the word's Khmer dictionary definition as a clue."
      descriptionKm="ទាយពាក្យខ្មែរដែលលាក់ ម្តងមួយព្យញ្ជនៈ មុនពេលអស់ជីវិតទាំងប្រាំពីរ។ ស្រៈមិនចាំបាច់ទាយទេ — ព្យាង្គមួយលេចឡើងភ្លាមនៅពេលរកឃើញអក្សររបស់វាទាំងអស់។ ជាប់គាំង? អាននិយមន័យវចនានុក្រមខ្មែររបស់ពាក្យជាតម្រុយ។"
    >
      {!word || !entry ? (
        <Button onClick={start}>{t("New word", "ពាក្យថ្មី")}</Button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[var(--ink-faint)]">
            <span>{t(`Lives left: ${LIVES - wrong.length}`, `ជីវិតនៅសល់៖ ${kh(LIVES - wrong.length)}`)}</span>
            <span>{t(`Won ${stats.won} · lost ${stats.lost}`, `ឈ្នះ ${kh(stats.won)} · ចាញ់ ${kh(stats.lost)}`)}</span>
          </div>
          <div className="flex gap-1" aria-hidden="true">
            {Array.from({ length: LIVES }, (_, i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i < LIVES - wrong.length ? "bg-[var(--teal)]" : "bg-[var(--danger)]/40"}`} />
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5" aria-label={t("Hidden word", "ពាក្យលាក់")}>
            {maskClusters(splitClusters(word), guessedSet).map((c, i) => (
              <span key={i} lang="km" className={`flex h-16 min-w-14 items-center justify-center rounded-md border-b-2 px-2 font-khmer text-4xl leading-[1.6] ${c.revealed || over ? "border-[var(--gold)] text-[var(--ink)]" : "border-[var(--ink-faint)] text-transparent"}`}>
                {c.revealed || over ? c.text : "?"}
              </span>
            ))}
          </div>

          {over && (
            <div className={`rounded-md border p-3 text-sm ${won ? "border-[var(--gold)]" : "border-[var(--danger)]/50"}`} role="status">
              <p className="text-[var(--ink)]">{won ? t("You got it!", "អ្នកទាយត្រូវហើយ!") : t("Out of lives. The word was:", "អស់ជីវិតហើយ។ ពាក្យនោះគឺ៖")} <span lang="km" className="font-khmer text-lg">{word}</span></p>
              <p lang="km" className="mt-1 font-khmer leading-relaxed text-[var(--ink-dim)]">{entry.definition}</p>
            </div>
          )}

          {!over && (
            <>
              {showClue ? (
                <p className="rounded-md border border-[var(--ground-line)] p-3 text-sm" role="status">
                  <span className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">{t("Clue", "តម្រុយ")} · </span>
                  <span lang="km" className="font-khmer leading-relaxed text-[var(--ink)]">{entry.definition.split(word).join("＿")}</span>
                </p>
              ) : (
                <PillAction onClick={() => setShowClue(true)}><Lightbulb size={13} />{t("Show clue", "បង្ហាញតម្រុយ")}</PillAction>
              )}
              <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9" aria-label={t("Letters", "អក្សរ")}>
                {keys.map((k) => {
                  const used = guessedSet.has(k);
                  const hit = used && wordLetters.has(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      disabled={used}
                      onClick={() => guess(k)}
                      aria-label={KHMER_CONSONANTS[k]?.name ?? k}
                      className={`flex h-12 items-center justify-center rounded-md border font-khmer text-2xl transition ${hit ? "border-[var(--teal)] bg-[var(--teal)]/15 text-[var(--teal)]" : used ? "border-[var(--ground-line)] text-[var(--ink-faint)] opacity-40" : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink)] active:scale-95"}`}
                    >
                      <span lang="km">{k}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
          <PillAction onClick={start}><RefreshCw size={13} />{t("New word", "ពាក្យថ្មី")}</PillAction>
        </div>
      )}

      <SourceCredits>
        <p>{t(
          "Words and clue definitions come from the app's offline Khmer lexicon (lib/khmer-lexicon-db.ts, compiled from Chuon Nath and Headley dictionary data); the answer is blanked out of its own clue. You guess letters (consonants, subscripts included, and any independent vowel the word uses); vowel signs fill in automatically. Hangman is a traditional pencil-and-paper game; this is an original Tools123 implementation for Khmer. Win/loss totals are saved in this browser only.",
          "ពាក្យ និងនិយមន័យតម្រុយមកពីវចនានុក្រមខ្មែរក្រៅបណ្តាញរបស់កម្មវិធី (lib/khmer-lexicon-db.ts ចងក្រងពីទិន្នន័យវចនានុក្រមជួន ណាត និង Headley) ចម្លើយត្រូវបានលាក់ចេញពីតម្រុយរបស់វា។ អ្នកទាយអក្សរ (ព្យញ្ជនៈ រួមទាំងជើង និងស្រៈពេញតួដែលពាក្យប្រើ) ចំណែកស្រៈនិស្ស័យបំពេញដោយស្វ័យប្រវត្តិ។ ហែងមែនជាល្បែងប្រពៃណីលើក្រដាស នេះជាការអនុវត្តដើមរបស់ Tools123 សម្រាប់ភាសាខ្មែរ។ ចំនួនឈ្នះ/ចាញ់រក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
