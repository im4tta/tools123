"use client";
// Flashcard practice for any glossary built on <Lexicon>: shows a term, reveals the other language and the first line of
// the definition (rounds of up to 20 random cards), and repeats the cards marked "Again" until every card is known. Nothing is stored; it is a study aid.
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { RotateCcw, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { SpeakButton } from "@/components/ui/SpeakButton";
import type { LexiconItem } from "@/components/ui/Lexicon";

type Direction = "en" | "km";
/** Cards per round, picked at random from the list being practised. */
const ROUND = 20;

function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function firstLine(text?: string): string | undefined {
  return text?.split("\n").find((line) => line.trim())?.trim();
}

export function LexiconFlashcards({ items, onClose, speakLang }: { items: LexiconItem[]; onClose: () => void; speakLang: string | false }) {
  const { text: t } = useLanguage();
  const [direction, setDirection] = useState<Direction>("en");
  const [deck, setDeck] = useState<LexiconItem[]>(() => shuffle(items).slice(0, ROUND));
  const [known, setKnown] = useState(0);
  const [shown, setShown] = useState(false);
  const card = deck[0];
  const total = Math.min(items.length, ROUND);

  const restart = useCallback(() => {
    setDeck(shuffle(items).slice(0, ROUND));
    setKnown(0);
    setShown(false);
  }, [items]);
  const again = useCallback(() => {
    setDeck((d) => [...d.slice(1), d[0]]);
    setShown(false);
  }, []);
  const gotIt = useCallback(() => {
    setDeck((d) => d.slice(1));
    setKnown((n) => n + 1);
    setShown(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (!card) return;
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!shown) setShown(true);
      } else if (shown && e.key === "ArrowLeft") again();
      else if (shown && e.key === "ArrowRight") gotIt();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, shown, again, gotIt, onClose]);

  const def = useMemo(() => (card ? firstLine(card.defKm) ?? firstLine(card.defEn) : undefined), [card]);
  const btn = "rounded-full border border-[var(--lx-line)] px-4 py-2 text-sm text-[var(--lx-ink-dim)] transition-colors hover:border-[var(--lx-accent)] hover:text-[var(--lx-ink)]";
  const front = card && (direction === "en" ? card.term : card.termKm);
  const back = card && (direction === "en" ? card.termKm : card.term);

  // Portalled to <body> so it sits above the mobile navigation; the "lexicon" class brings the glossary colours with it.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={t("Practise terms", "ហាត់ពាក្យ")} className="lexicon font-lexicon fixed inset-0 z-[90] flex flex-col bg-[var(--lx-page)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--lx-line)] px-5 py-3">
        <p className="lx-caps text-[var(--lx-ink-faint)]" aria-live="polite">
          {t(`${known} of ${total} known`, `ស្គាល់ ${known} ក្នុងចំណោម ${total}`)}
        </p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setDirection((d) => (d === "en" ? "km" : "en")); setShown(false); }} className={btn}>
            {direction === "en" ? t("English → Khmer", "អង់គ្លេស → ខ្មែរ") : t("Khmer → English", "ខ្មែរ → អង់គ្លេស")}
          </button>
          <button type="button" onClick={onClose} aria-label={t("Close practice", "បិទការហាត់")} className="rounded-full p-2 text-[var(--lx-ink-dim)] hover:text-[var(--lx-ink)]">
            <X size={20} aria-hidden />
          </button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-8">
        {card ? (
          <>
            <div className="rounded-3xl border border-[var(--lx-line)] bg-[var(--lx-paper)] px-6 py-10 text-center">
              <div className="flex items-start justify-center gap-1">
                <p lang={direction === "km" ? "km" : "en"} className={`text-balance break-words text-[2rem] font-medium leading-tight text-[var(--lx-ink)] ${direction === "km" ? "font-lexicon-km" : ""}`}>
                  {front}
                </p>
                {direction === "en" && speakLang && <SpeakButton text={card.term} lang={speakLang} className="mt-1 text-[var(--lx-ink-dim)]" size={20} />}
              </div>
              {shown ? (
                <div className="mt-6 border-t border-[var(--lx-line)] pt-5">
                  <p lang={direction === "en" ? "km" : "en"} className={`text-balance break-words text-[1.5rem] text-[var(--lx-accent)] ${direction === "en" ? "font-lexicon-km" : ""}`}>
                    {back}
                  </p>
                  {def && (
                    <p lang={firstLine(card.defKm) ? "km" : "en"} className={`mt-3 line-clamp-4 text-left text-[0.95rem] leading-relaxed text-[var(--lx-ink-dim)] ${firstLine(card.defKm) ? "font-lexicon-km" : ""}`}>
                      {def}
                    </p>
                  )}
                </div>
              ) : (
                <button type="button" onClick={() => setShown(true)} className="mt-8 rounded-full bg-[var(--lx-ink)] px-6 py-2.5 text-[var(--lx-paper)]">
                  {t("Show answer", "បង្ហាញចម្លើយ")}
                </button>
              )}
            </div>
            {shown && (
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" onClick={again} className={btn}>
                  {t("Again", "ម្តងទៀត")}
                </button>
                <button type="button" onClick={gotIt} className="rounded-full bg-[var(--lx-accent)] px-4 py-2 text-sm text-[var(--lx-paper)]">
                  {t("Got it", "ចាំហើយ")}
                </button>
              </div>
            )}
            <p className="mt-4 text-center text-xs text-[var(--lx-ink-faint)]">
              {t(`${deck.length} cards left`, `នៅសល់ ${deck.length} សន្លឹក`)}
            </p>
          </>
        ) : (
          <div className="text-center">
            <p className="text-xl text-[var(--lx-ink)]">{t(`All ${total} cards done.`, `រួចរាល់ទាំង ${total} សន្លឹក។`)}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={restart} className={`${btn} inline-flex items-center gap-2`}>
                <RotateCcw size={15} aria-hidden />
                {t("Start again", "ចាប់ផ្តើមម្តងទៀត")}
              </button>
              <button type="button" onClick={onClose} className={btn}>
                {t("Close", "បិទ")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
