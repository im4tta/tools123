"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { KHMER_CONSONANTS } from "@/lib/data/khmer-romanization";
import { convertUnder100, toKhmerNumerals } from "@/lib/khmer-number-words";
import { buildPairDeck, type PairCard } from "@/lib/khmer-word-games";
import { shuffle } from "@/lib/khmer-learning";

type Theme = "name" | "subscript" | "numeral" | "word";
const COENG = "្";
const CARRIER = "ស";
const kh = (n: number) => toKhmerNumerals(String(n));

/** Pairs for a theme: always built from the app's shared tables, never typed in by hand. */
function pairsFor(theme: Theme, count: number, rand: () => number): [string, string][] {
  if (theme === "name" || theme === "subscript") {
    // ឡ has no subscript form, so it is left out of the subscript theme.
    const letters = shuffle(Object.keys(KHMER_CONSONANTS).filter((c) => theme === "name" || c !== "ឡ"), rand).slice(0, count);
    return letters.map((c) => [c, theme === "name" ? KHMER_CONSONANTS[c].name : CARRIER + COENG + c]);
  }
  const numbers = shuffle(Array.from({ length: theme === "numeral" ? 99 : 30 }, (_, i) => i + 1), rand).slice(0, count);
  return numbers.map((n) => (theme === "numeral" ? [String(n), kh(n)] : [kh(n), convertUnder100(n)]));
}

const THEMES: { id: Theme; en: string; km: string }[] = [
  { id: "name", en: "Letter ↔ name", km: "អក្សរ ↔ ឈ្មោះ" },
  { id: "subscript", en: "Letter ↔ subscript", km: "អក្សរ ↔ ជើង" },
  { id: "numeral", en: "12 ↔ ១២", km: "12 ↔ ១២" },
  { id: "word", en: "Numeral ↔ word", km: "លេខ ↔ ពាក្យ" },
];

export default function KhmerMatchingPairs() {
  const { text: t } = useLanguage();
  const [theme, setTheme] = useToolState<Theme>("khmer-matching-pairs:theme", "name");
  const [size, setSize] = useToolState<6 | 8 | 10>("khmer-matching-pairs:size", 8);
  const [best, setBest] = useToolState<Record<string, number>>("khmer-matching-pairs:best", {});
  const [deck, setDeck] = useState<PairCard[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const deal = (th: Theme = theme, n: number = size) => {
    setDeck(buildPairDeck(pairsFor(th, n, Math.random), Math.random));
    setOpen([]); setMatched([]); setMoves(0);
  };

  // Two face-up cards that don't match turn back over after a short look.
  useEffect(() => {
    if (open.length !== 2) return;
    const [a, b] = open.map((id) => deck.find((c) => c.id === id)!);
    if (a.pairId === b.pairId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMatched((m) => [...m, a.pairId]);
      setOpen([]);
      return;
    }
    const timer = window.setTimeout(() => setOpen([]), 900);
    return () => window.clearTimeout(timer);
  }, [open, deck]);

  const done = deck.length > 0 && matched.length * 2 === deck.length;
  const key = `${theme}-${size}`;
  useEffect(() => {
    if (done && (!best[key] || moves < best[key])) setBest({ ...best, [key]: moves });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const flip = (card: PairCard) => {
    if (open.length === 2 || open.includes(card.id) || matched.includes(card.pairId)) return;
    const next = [...open, card.id];
    setOpen(next);
    if (next.length === 2) setMoves(moves + 1);
  };

  return (
    <ToolShell
      title="Khmer Matching Pairs"
      khmerTitle="ល្បែងផ្គូផ្គងគូខ្មែរ"
      description="A memory game for learning Khmer: flip two cards at a time and match each consonant with its name or subscript, each digit with its Khmer numeral, or each Khmer numeral with its word. Fewer moves is better."
      descriptionKm="ល្បែងចងចាំសម្រាប់រៀនភាសាខ្មែរ៖ បើកកាតម្តងពីរ ហើយផ្គូផ្គងព្យញ្ជនៈនីមួយៗជាមួយឈ្មោះ ឬជើងរបស់វា លេខនីមួយៗជាមួយលេខខ្មែរ ឬលេខខ្មែរនីមួយៗជាមួយពាក្យរបស់វា។ ចំនួនជំហានកាន់តែតិច កាន់តែល្អ។"
    >
      <PillGroup label={t("Match", "ផ្គូផ្គង")}>
        {THEMES.map((th) => <Pill key={th.id} active={theme === th.id} onClick={() => { setTheme(th.id); deal(th.id, size); }}>{t(th.en, th.km)}</Pill>)}
      </PillGroup>
      <PillGroup label={t("Pairs", "ចំនួនគូ")}>
        {([6, 8, 10] as const).map((n) => <Pill key={n} active={size === n} onClick={() => { setSize(n); deal(theme, n); }}>{t(String(n), kh(n))}</Pill>)}
      </PillGroup>

      {deck.length === 0 ? (
        <Button onClick={() => deal()}>{t("Deal cards", "ចែកកាត")}</Button>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-[var(--ink-faint)]" role="status">
            {t(`Moves ${moves} · pairs ${matched.length} of ${deck.length / 2}`, `ជំហាន ${kh(moves)} · គូ ${kh(matched.length)} ក្នុងចំណោម ${kh(deck.length / 2)}`)}
            {best[key] != null && t(` · best ${best[key]}`, ` · ល្អបំផុត ${kh(best[key])}`)}
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {deck.map((card) => {
              const shown = open.includes(card.id) || matched.includes(card.pairId);
              const isMatched = matched.includes(card.pairId);
              const latin = /^[\x20-\x7E]+$/.test(card.face);
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => flip(card)}
                  aria-label={shown ? card.face : t("Hidden card", "កាតបិទ")}
                  className={`flex aspect-[3/4] items-center justify-center rounded-lg border p-1 text-center transition ${isMatched ? "border-[var(--teal)] bg-[var(--teal)]/10" : shown ? "border-[var(--gold)] bg-[var(--ground-raised)]" : "border-[var(--ground-line)] bg-[var(--gold)]/15 active:scale-95"}`}
                >
                  {shown ? (
                    <span lang={latin ? "en" : "km"} className={latin ? "break-words text-sm font-medium text-[var(--ink)]" : `font-khmer leading-[1.6] text-[var(--ink)] ${[...card.face].length > 4 ? "text-base" : "text-3xl"}`}>{card.face}</span>
                  ) : (
                    <span aria-hidden="true" className="font-khmer text-xl text-[var(--gold)]/60">✦</span>
                  )}
                </button>
              );
            })}
          </div>
          {done && <p className="rounded-md border border-[var(--gold)] p-3 text-sm text-[var(--ink)]" role="status">{t(`All pairs found in ${moves} moves!`, `រកឃើញគូទាំងអស់ក្នុង ${kh(moves)} ជំហាន!`)}</p>}
          <PillAction onClick={() => deal()}><RefreshCw size={13} />{t("New game", "ល្បែងថ្មី")}</PillAction>
        </div>
      )}

      <SourceCredits>
        <p>{t(
          "Consonant names and subscripts come from the app's shared Khmer romanization table (lib/data/khmer-romanization.ts); number words come from the shared Khmer number engine (lib/khmer-number-words.ts). Subscripts are shown stacked under ស and drawn by your Khmer font. Matching-pairs (“Concentration”) is a traditional card game; original Tools123 implementation. Best scores are saved in this browser only.",
          "ឈ្មោះព្យញ្ជនៈ និងជើងអក្សរមកពីតារាងបម្លែងអក្សរខ្មែររួមរបស់កម្មវិធី (lib/data/khmer-romanization.ts) ចំណែកពាក្យលេខមកពីម៉ាស៊ីនលេខខ្មែររួម (lib/khmer-number-words.ts)។ ជើងអក្សរបង្ហាញនៅក្រោម ស ហើយគូរដោយពុម្ពអក្សរខ្មែររបស់អ្នក។ ល្បែងផ្គូផ្គងគូ («Concentration») ជាល្បែងបៀប្រពៃណី។ ការអនុវត្តដើមរបស់ Tools123។ ពិន្ទុល្អបំផុតរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
