"use client";
import { useMemo, useState } from "react";
import { Check, Eye, RotateCcw, Trophy, X } from "lucide-react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface Card {
  q: string;
  a: string;
}

function parseDeck(text: string): { cards: Card[]; skipped: number } {
  const cards: Card[] = [];
  let skipped = 0;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const sep = line.indexOf("|");
    if (sep <= 0 || sep === line.length - 1) {
      skipped++;
      continue;
    }
    const q = line.slice(0, sep).trim();
    const a = line.slice(sep + 1).trim();
    if (!q || !a) {
      skipped++;
      continue;
    }
    cards.push({ q, a });
  }
  return { cards, skipped };
}

type Phase = "edit" | "quiz" | "done";

const SAMPLE_DECK = [
  "What is the capital of Cambodia? | Phnom Penh",
  "Which planet is closest to the Sun? | Mercury",
  "What colour do you get when you mix red and white? | Pink",
  "How many legs does a spider have? | Eight",
  "What is the largest mammal on Earth? | Blue whale",
].join("\n");

export default function FlashcardQuiz() {
  const { text: t } = useLanguage();
  const [deckText, setDeckText] = useToolState("flashcard:deck", SAMPLE_DECK);
  const [phase, setPhase] = useState<Phase>("edit");
  const [deck, setDeck] = useState<Card[]>([]);
  const [queue, setQueue] = useState<number[]>([]);
  const [mastered, setMastered] = useState<Set<number>>(new Set());
  const [flipped, setFlipped] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  const parsed = useMemo(() => parseDeck(deckText), [deckText]);

  const startQuiz = () => {
    const { cards } = parseDeck(deckText);
    if (cards.length === 0) return;
    setDeck(cards);
    setQueue(cards.map((_, i) => i));
    setMastered(new Set());
    setMistakes(0);
    setFlipped(false);
    setPhase("quiz");
  };

  const backToEdit = () => {
    setPhase("edit");
    setQueue([]);
    setMastered(new Set());
    setFlipped(false);
  };

  const markKnew = () => {
    const cur = queue[0];
    if (cur === undefined) return;
    setMastered((prev) => {
      const next = new Set(prev);
      next.add(cur);
      return next;
    });
    const rest = queue.slice(1);
    if (rest.length === 0) {
      setQueue([]);
      setPhase("done");
    } else {
      setQueue(rest);
    }
    setFlipped(false);
  };

  const markWrong = () => {
    if (queue.length === 0) return;
    // Move this card to the back so it is retried until mastered.
    setQueue((q) => [...q.slice(1), q[0]]);
    setMistakes((m) => m + 1);
    setFlipped(false);
  };

  const currentIdx = phase === "quiz" ? queue[0] : undefined;
  const currentCard = currentIdx !== undefined ? deck[currentIdx] : undefined;
  const masteredCount = mastered.size;
  const totalCards = deck.length;
  const progressPct = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

  return (
    <ToolShell
      title="Flashcard Quiz Maker"
      khmerTitle="បង្កើតកម្រងសន្លឹកសំណួរ"
      description="Paste Question | Answer lines to build your own study deck, then quiz yourself until every card is mastered."
      descriptionKm="បិទភ្ជាប់បន្ទាត់ សំណួរ | ចម្លើយ ដើម្បីបង្កើតសន្លឹកសិក្សាផ្ទាល់ខ្លួន រួចសាកល្បងខ្លួនឯងរហូតដល់សន្លឹកទាំងអស់ចេះ។"
    >
      {phase === "edit" && (
        <>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
            {t("One card per line, using a pipe to separate the question from the answer.", "សន្លឹកមួយក្នុងមួយបន្ទាត់ ដោយប្រើសញ្ញា | បំបែកសំណួរ និងចម្លើយ។")}
          </div>

          <Field label={t("Deck (Question | Answer per line)", "កម្រងសន្លឹក (សំណួរ | ចម្លើយក្នុងមួយបន្ទាត់)")}>
            <TextArea rows={8} value={deckText} onChange={(e) => setDeckText(e.target.value)} />
          </Field>

          {parsed.cards.length > 0 && (
            <p className="text-xs text-[var(--ink-dim)]">
              {t(`${parsed.cards.length} card(s) ready.`, `សន្លឹកចំនួន ${parsed.cards.length} រួចរាល់។`)}
            </p>
          )}

          {parsed.skipped > 0 && (
            <p className="text-xs text-[var(--danger)]">
              {t(
                `${parsed.skipped} line(s) were skipped because they were empty or missing a "|".`,
                `បន្ទាត់ចំនួន ${parsed.skipped} ត្រូវបានរំលង ដោយសារវាទទេ ឬខ្វះសញ្ញា "|"។`
              )}
            </p>
          )}

          {parsed.cards.length > 0 && (
            <div className="rounded-md border border-[var(--ground-line)]">
              <div className="border-b border-[var(--ground-line)] px-3 py-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                {t("Deck preview", "មើលកម្រងសន្លឹកជាមុន")}
              </div>
              <ul className="max-h-56 divide-y divide-[var(--ground-line)] overflow-auto">
                {parsed.cards.map((c, i) => (
                  <li key={i} className="flex gap-3 px-3 py-2 text-sm">
                    <span className="w-6 shrink-0 text-right font-mono-ui text-xs leading-5 text-[var(--ink-faint)]">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-[var(--ink)]">{c.q}</span>
                    <span className="shrink-0 text-[var(--ink-faint)]">→</span>
                    <span className="min-w-0 flex-1 truncate text-[var(--gold)]">{c.a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button type="button" onClick={startQuiz} disabled={parsed.cards.length === 0} className="w-full sm:w-auto">
            {t("Start quiz", "ចាប់ផ្ដើមសាកល្បង")} ({parsed.cards.length})
          </Button>
        </>
      )}

      {phase === "quiz" && currentCard && (
        <div className="mx-auto max-w-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium text-[var(--gold)]">
              {masteredCount} {t("of", "ក្នុងចំណោម")} {totalCards} {t("mastered", "បានចេះ")}
            </span>
            <span className="font-mono-ui text-xs text-[var(--ink-dim)]">
              {queue.length} {t("card(s) left", "សន្លឹកនៅសល់")}
            </span>
            <button
              type="button"
              onClick={backToEdit}
              className="flex items-center gap-1 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]"
            >
              <RotateCcw size={12} /> {t("Back to deck", "ត្រឡប់ទៅកម្រងសន្លឹក")}
            </button>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--ground-line)]">
            <div className="h-full rounded-full bg-[var(--gold)] transition-all" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 text-center">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Question", "សំណួរ")}</div>
            <p className="mt-3 min-h-10 break-words font-display text-lg leading-relaxed text-[var(--ink)]">{currentCard.q}</p>
            <div className="mx-auto my-4 h-px w-2/3 bg-[var(--ground-line)]" />
            {flipped ? (
              <>
                <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Answer", "ចម្លើយ")}</div>
                <p className="mt-3 break-words text-base leading-relaxed text-[var(--gold)]">{currentCard.a}</p>
              </>
            ) : (
              <p className="text-sm italic text-[var(--ink-faint)]">{t("Think about it, then reveal the answer.", "គិតមើលសិន រួចបង្ហាញចម្លើយ។")}</p>
            )}
          </div>

          {!flipped ? (
            <Button type="button" onClick={() => setFlipped(true)} className="w-full">
              <Eye size={15} className="mr-1 inline" />
              {t("Reveal answer", "បង្ហាញចម្លើយ")}
            </Button>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                onClick={markWrong}
                className="!bg-[var(--ground-raised)] !text-[var(--danger)] border border-[var(--danger)]/40 hover:!border-[var(--danger)]"
              >
                <X size={15} className="mr-1 inline" />
                {t("Got it wrong", "ចម្លើយខុស")}
              </Button>
              <Button type="button" onClick={markKnew}>
                <Check size={15} className="mr-1 inline" />
                {t("Knew it", "ចេះហើយ")}
              </Button>
            </div>
          )}

          {flipped && (
            <p className="text-center text-xs text-[var(--ink-faint)]">
              {t("Wrong cards move to the back and are retried until you master them.", "សន្លឹកដែលឆ្លើយខុសត្រូវបានដាក់ទៅខាងចុង ហើយសាកល្បងម្តងទៀតរហូតដល់អ្នកចេះ។")}
            </p>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="mx-auto max-w-md rounded-xl border border-[var(--gold)]/40 bg-[var(--ground-raised)] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--gold)]/20 text-[var(--gold)]">
            <Trophy size={26} />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold text-[var(--ink)]">
            {t("Deck mastered!", "ចេះកម្រងសន្លឹកទាំងអស់!")}
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-dim)]">
            {t("All", "ទាំងអស់")} {totalCards} {t("card(s) mastered", "សន្លឹកបានចេះ")} {t("with", "ដោយមាន")} {mistakes} {t("wrong answer(s) along the way.", "ចម្លើយខុសនៅតាមផ្លូវ។")}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button type="button" onClick={startQuiz} className="!bg-[var(--ground-raised)] !text-[var(--ink)]">
              <RotateCcw size={15} className="mr-1 inline" />
              {t("Study again", "សិក្សាម្តងទៀត")}
            </Button>
            <Button type="button" onClick={backToEdit}>
              {t("Edit deck", "កែសម្រួលកម្រងសន្លឹក")}
            </Button>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
