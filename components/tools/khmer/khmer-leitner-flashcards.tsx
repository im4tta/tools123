"use client";
import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell, Field, Select } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { PillAction } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { STATIC_DATABASE } from "@/lib/khmer-lexicon-db";
import { KHMER_CONSONANTS } from "@/lib/data/khmer-romanization";
import { LEITNER_INTERVAL_DAYS, boxCounts, dueCards, reviewCard, type LeitnerState } from "@/lib/khmer-games";
import { toKhmerNumerals } from "@/lib/khmer-number-words";

const ALL_WORDS = Object.keys(STATIC_DATABASE);
const FIRST_LETTERS = Object.keys(KHMER_CONSONANTS).filter((c) => ALL_WORDS.some((w) => w.startsWith(c)));
const kh = (n: number) => toKhmerNumerals(String(n));

export default function KhmerLeitnerFlashcards() {
  const { text: t } = useLanguage();
  const [progress, setProgress] = useToolState<LeitnerState>("khmer-leitner-flashcards:progress", {});
  const [letter, setLetter] = useToolState("khmer-leitner-flashcards:letter", "");
  const [newPerSession, setNewPerSession] = useToolState("khmer-leitner-flashcards:new", 10);
  // "now" is fixed when a session starts, so the queue does not reshuffle mid-review.
  const [now, setNow] = useState(() => Date.now());
  const [queue, setQueue] = useState<string[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const deck = useMemo(() => (letter ? ALL_WORDS.filter((w) => w.startsWith(letter)) : ALL_WORDS), [letter]);
  const counts = boxCounts(progress, deck);
  const dueNow = dueCards(progress, deck, now, newPerSession);

  const startSession = () => {
    const at = Date.now();
    setNow(at);
    setQueue(dueCards(progress, deck, at, newPerSession));
    setRevealed(false);
    setReviewed(0);
  };

  const card = queue?.[0];
  const entry = card ? STATIC_DATABASE[card] : null;

  const grade = (correct: boolean) => {
    if (!card || !queue) return;
    const at = Date.now();
    setProgress(reviewCard(progress, card, correct, at));
    // A missed card comes back at the end of this session.
    setQueue(correct ? queue.slice(1) : [...queue.slice(1), card]);
    setRevealed(false);
    setReviewed(reviewed + 1);
  };

  const resetProgress = () => {
    if (!window.confirm(t("Forget all flashcard progress on this device?", "លុបវឌ្ឍនភាពកាតទាំងអស់នៅលើឧបករណ៍នេះ?"))) return;
    setProgress({});
    setQueue(null);
  };

  return (
    <ToolShell
      title="Khmer Vocabulary Flashcards"
      khmerTitle="កាតរៀនពាក្យខ្មែរ (ធ្វើម្តងទៀតតាមពេល)"
      description="Learn Khmer words and their Khmer definitions with spaced repetition. Cards you know move up through five Leitner boxes and come back after longer and longer gaps (1, 2, 4, 8 and 16 days); a card you miss drops back to box 1 and returns in the same session. Progress is saved on this device."
      descriptionKm="រៀនពាក្យខ្មែរ និងនិយមន័យជាភាសាខ្មែរ ដោយការរំលឹកតាមចន្លោះពេល។ កាតដែលអ្នកស្គាល់ឡើងទៅប្រអប់ Leitner ទាំងប្រាំ ហើយត្រឡប់មកវិញក្រោយចន្លោះពេលវែងជាងមុន (១ ២ ៤ ៨ និង ១៦ ថ្ងៃ) កាតដែលអ្នកភ្លេចធ្លាក់មកប្រអប់ទី ១ វិញ ហើយត្រឡប់មកក្នុងវគ្គដដែល។ វឌ្ឍនភាពរក្សាទុកនៅលើឧបករណ៍នេះ។"
    >
      <div className="grid grid-cols-6 gap-1.5 text-center" aria-label={t("Cards per box", "ចំនួនកាតក្នុងប្រអប់នីមួយៗ")}>
        {counts.map((n, box) => (
          <div key={box} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-1 py-2">
            <p className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{box === 0 ? t("New", "ថ្មី") : t(`Box ${box}`, `ប្រអប់ ${kh(box)}`)}</p>
            <p className="font-display text-lg text-[var(--ink)]">{t(String(n), kh(n))}</p>
          </div>
        ))}
      </div>

      {!queue ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Words starting with" labelKm="ពាក្យចាប់ផ្តើមដោយ">
              <Select value={letter} onChange={(e) => setLetter(e.target.value)} className="font-khmer">
                <option value="">{t("Any letter", "គ្រប់អក្សរ")}</option>
                {FIRST_LETTERS.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="New cards per session" labelKm="កាតថ្មីក្នុងមួយវគ្គ">
              <Select value={String(newPerSession)} onChange={(e) => setNewPerSession(Number(e.target.value))}>
                {[5, 10, 20, 40].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </Field>
          </div>
          <p className="text-sm text-[var(--ink-dim)]">{t(`${dueNow.length} card(s) ready to study.`, `កាត ${kh(dueNow.length)} រួចរាល់សម្រាប់រៀន។`)}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={startSession} disabled={dueNow.length === 0}>{t("Start session", "ចាប់ផ្តើមវគ្គ")}</Button>
            <PillAction onClick={resetProgress}><RotateCcw size={13} />{t("Reset progress", "កំណត់វឌ្ឍនភាពឡើងវិញ")}</PillAction>
          </div>
        </div>
      ) : !entry ? (
        <div className="space-y-3 rounded-md border border-[var(--gold)] p-4" role="status">
          <p className="text-sm text-[var(--ink)]">{t(`Session done — ${reviewed} review(s). Come back when more cards are due.`, `វគ្គរួចរាល់ — បានរំលឹក ${kh(reviewed)} ដង។ សូមត្រឡប់មកវិញពេលមានកាតដល់ពេលរំលឹក។`)}</p>
          <PillAction onClick={() => setQueue(null)}>{t("Back to decks", "ត្រឡប់ទៅកញ្ចប់កាត")}</PillAction>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-[var(--ink-faint)]">
            {t(`${queue.length} left in this session · box ${progress[card!]?.box ?? 0}`, `នៅសល់ ${kh(queue.length)} ក្នុងវគ្គនេះ · ប្រអប់ ${kh(progress[card!]?.box ?? 0)}`)}
          </p>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 text-center">
            <p lang="km" className="font-khmer text-6xl leading-[1.6] text-[var(--ink)]">{entry.word}</p>
            {revealed && (
              <div className="mt-4 space-y-2 border-t border-[var(--ground-line)] pt-4 text-left">
                {entry.pronunciation && entry.pronunciation !== entry.word && <p className="text-xs text-[var(--ink-faint)]">{t("Said like", "អានថា")} <span lang="km" className="font-khmer text-base text-[var(--ink-dim)]">{entry.pronunciation}</span></p>}
                <p lang="km" className="font-khmer text-lg leading-relaxed text-[var(--ink)]">{entry.definition}</p>
                {entry.example && <p lang="km" className="font-khmer text-sm italic leading-relaxed text-[var(--ink-dim)]">{entry.example}</p>}
              </div>
            )}
          </div>
          {!revealed ? (
            <Button onClick={() => setRevealed(true)} className="w-full">{t("Show meaning", "បង្ហាញអត្ថន័យ")}</Button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => grade(false)} className="ui-touch rounded-md border border-[var(--danger)]/50 bg-[var(--danger)]/10 px-3 py-3 text-sm font-medium text-[var(--danger)]">
                {t("Didn't know", "មិនស្គាល់")}
              </button>
              <button type="button" onClick={() => grade(true)} className="ui-touch rounded-md border border-[var(--gold)] bg-[var(--gold)]/15 px-3 py-3 text-sm font-medium text-[var(--ink)]">
                {t("Knew it", "ស្គាល់")}
                <span className="block text-[10px] font-normal text-[var(--ink-faint)]">
                  {t(`next in ${LEITNER_INTERVAL_DAYS[Math.min(5, (progress[card!]?.box ?? 0) + 1)]} day(s)`, `បន្ទាប់ក្នុង ${kh(LEITNER_INTERVAL_DAYS[Math.min(5, (progress[card!]?.box ?? 0) + 1)])} ថ្ងៃ`)}
                </span>
              </button>
            </div>
          )}
          <PillAction onClick={() => setQueue(null)}>{t("End session", "បញ្ចប់វគ្គ")}</PillAction>
        </div>
      )}

      <SourceCredits>
        <p>{t(
          "Words, definitions and examples come from the app's offline Khmer lexicon (lib/khmer-lexicon-db.ts, compiled from Chuon Nath and Headley dictionary data), the same one used by the Khmer Lexicon tool; definitions are monolingual Khmer. The Leitner box method is from Sebastian Leitner's “So lernt man lernen” (1972); the 1-2-4-8-16-day gaps are this app's own schedule, not a standard. Progress is saved in this browser only. Original Tools123 implementation.",
          "ពាក្យ និយមន័យ និងឧទាហរណ៍មកពីវចនានុក្រមខ្មែរក្រៅបណ្តាញរបស់កម្មវិធី (lib/khmer-lexicon-db.ts ចងក្រងពីទិន្នន័យវចនានុក្រមជួន ណាត និង Headley) ដូចគ្នានឹងឧបករណ៍វចនានុក្រមខ្មែរ និយមន័យជាភាសាខ្មែរសុទ្ធ។ វិធីប្រអប់ Leitner មកពីសៀវភៅ «So lernt man lernen» (១៩៧២) របស់ Sebastian Leitner ចំណែកចន្លោះ ១-២-៤-៨-១៦ ថ្ងៃ ជាកាលវិភាគរបស់កម្មវិធីនេះផ្ទាល់ មិនមែនស្តង់ដារទេ។ វឌ្ឍនភាពរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
