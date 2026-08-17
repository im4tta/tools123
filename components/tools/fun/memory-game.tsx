"use client";
import { useMemo, useState } from "react";
import { ToolShell } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

const EMOJIS = ["🦊", "🐘", "🦁", "🐙", "🦉", "🐢", "🦋", "🐬", "🦜", "🐺", "🦩", "🐸"];

function shuffledCards(count: number): { emoji: string; id: number }[] {
  const picked = EMOJIS.slice(0, count / 2);
  return [...picked, ...picked]
    .map((emoji, id) => ({ emoji, id }))
    .sort(() => Math.random() - 0.5);
}

export default function MemoryGame() {
  const { text: t } = useLanguage();
  const [size, setSize] = useState(12);
  const [cards, setCards] = useState(() => shuffledCards(12));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [lock, setLock] = useState(false);

  const won = useMemo(() => matched.size === size, [matched, size]);

  const reset = (n = size) => {
    setSize(n);
    setCards(shuffledCards(n));
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setLock(false);
  };

  const flip = (id: number) => {
    if (lock || flipped.includes(id) || matched.has(id)) return;
    const next = [...flipped, id];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      setLock(true);
      const [a, b] = next;
      setTimeout(() => {
        if (cards[a].emoji === cards[b].emoji) {
          setMatched((s) => new Set(s).add(a).add(b));
        }
        setFlipped([]);
        setLock(false);
      }, 600);
    }
  };

  return (
    <ToolShell
      title="Memory Match Game"
      khmerTitle="ល្បែងចងចាំរូបភាព"
      description="Flip cards and find all matching pairs in as few moves as possible."
      descriptionKm="បើកសន្លឹកបៀ ហើយរកគូដែលដូចគ្នាឱ្យអស់ ដោយប្រើចលនាតិចបំផុត។"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 text-sm text-[var(--ink-dim)]">
          <span>
            {t("Moves", "ចលនា")}: <b className="text-[var(--gold)]">{moves}</b>
          </span>
          <span>
            {t("Matched", "ផ្គូផ្គងបាន")}: <b className="text-[var(--gold)]">{matched.size}/{size}</b>
          </span>
        </div>
        <div className="flex gap-2">
          {[8, 12, 16].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => reset(n)}
              className={`rounded-full border px-3 py-1 text-xs transition ${size === n ? "border-[var(--gold-dim)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}
            >
              {n}
            </button>
          ))}
          <button type="button" onClick={() => reset()} className="rounded-full border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1 text-xs text-[var(--ink-dim)] transition hover:text-[var(--ink)]">
            {t("Reset", "កំណត់ឡើងវិញ")}
          </button>
        </div>
      </div>

      <div className={`grid gap-2 ${size === 16 ? "grid-cols-4" : size === 12 ? "grid-cols-4" : "grid-cols-4"}`}>
        {cards.map((c, i) => {
          const isUp = flipped.includes(i) || matched.has(i);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => flip(i)}
              className={`flex aspect-square items-center justify-center rounded-md border text-2xl transition duration-200 ${
                isUp
                  ? matched.has(i)
                    ? "border-[var(--green)]/40 bg-[var(--green)]/15"
                    : "border-[var(--gold-dim)] bg-[var(--ground-raised)]"
                  : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-transparent hover:border-[var(--gold-dim)]"
              }`}
            >
              {isUp ? c.emoji : "?"}
            </button>
          );
        })}
      </div>

      {won && (
        <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4 text-center">
          <div className="font-display text-xl font-semibold text-[var(--ink)]">{t("You won!", "អ្នកឈ្នះហើយ!")}</div>
          <div className="mt-1 text-sm text-[var(--ink-dim)]">{t("Finished in", "បញ្ចប់ក្នុង")} {moves} {t("moves", "ចលនា")}</div>
          <button type="button" onClick={() => reset()} className="mt-3 rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[var(--ground-base)] transition hover:opacity-90">
            {t("Play again", "លេងម្ដងទៀត")}
          </button>
        </div>
      )}
    </ToolShell>
  );
}