"use client";
import { useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { KHMER_CONSONANTS } from "@/lib/data/khmer-romanization";
import { sampleLetters, sortByAlphabet } from "@/lib/khmer-games";
import { shuffle } from "@/lib/khmer-learning";
import { toKhmerNumerals } from "@/lib/khmer-number-words";

// The shared consonant table is stored in dictionary order (ក ខ គ … ឡ អ).
const ALPHABET = Object.keys(KHMER_CONSONANTS);
const LEVELS = [5, 8, 12, 33] as const;
type Level = (typeof LEVELS)[number];

// Monotonic clock for timing a round; only read from event handlers.
const elapsedClock = () => performance.now();

export default function KhmerAlphabetOrder() {
  const { text: t } = useLanguage();
  const [level, setLevel] = useToolState<Level>("khmer-alphabet-order:level", 8);
  const [best, setBest] = useToolState<Record<string, number>>("khmer-alphabet-order:best", {});
  const [tiles, setTiles] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [result, setResult] = useState<{ ms: number; mistakes: number } | null>(null);
  const startedAt = useRef(0);

  const start = (count: Level = level) => {
    setTiles(shuffle(sampleLetters(ALPHABET, count, Math.random), Math.random));
    setPicked([]);
    setMistakes(0);
    setWrong(null);
    setResult(null);
    startedAt.current = 0;
  };

  const target = sortByAlphabet(tiles, ALPHABET);
  const expected = target[picked.length];

  const tap = (letter: string) => {
    if (result || picked.includes(letter)) return;
    if (!startedAt.current) startedAt.current = elapsedClock();
    if (letter !== expected) {
      setMistakes((m) => m + 1);
      setWrong(letter);
      return;
    }
    setWrong(null);
    const next = [...picked, letter];
    setPicked(next);
    if (next.length === tiles.length) {
      const ms = elapsedClock() - startedAt.current;
      setResult({ ms, mistakes });
      const key = String(tiles.length);
      if (mistakes === 0 && (!best[key] || ms < best[key])) setBest({ ...best, [key]: ms });
    }
  };

  const seconds = (ms: number) => (ms / 1000).toFixed(1);

  return (
    <ToolShell
      title="Khmer Alphabet Order Game"
      khmerTitle="ល្បែងតម្រៀបលំដាប់អក្សរ"
      description="Tap the Khmer consonants in dictionary order, from ក to អ, as fast as you can. Choose how many letters to sort; a wrong tap counts as a mistake and flashes red. Clean rounds (no mistakes) set your best time for that level."
      descriptionKm="ចុចព្យញ្ជនៈខ្មែរតាមលំដាប់វចនានុក្រម ពី ក ដល់ អ ឱ្យលឿនតាមដែលអាចធ្វើបាន។ ជ្រើសចំនួនអក្សរដែលត្រូវតម្រៀប ការចុចខុសរាប់ជាកំហុស ហើយភ្លឺពណ៌ក្រហម។ ជុំដែលគ្មានកំហុសនឹងកត់ត្រាពេលល្អបំផុតសម្រាប់កម្រិតនោះ។"
    >
      <PillGroup label={t("Letters per round", "ចំនួនអក្សរក្នុងមួយជុំ")}>
        {LEVELS.map((n) => (
          <Pill key={n} active={level === n} onClick={() => { setLevel(n); start(n); }}>
            {n === 33 ? t("All 33", "ទាំង ៣៣") : t(String(n), toKhmerNumerals(String(n)))}
          </Pill>
        ))}
      </PillGroup>

      {tiles.length === 0 ? (
        <Button onClick={() => start()}>{t("Start", "ចាប់ផ្តើម")}</Button>
      ) : (
        <div className="space-y-4">
          <div className="min-h-[3.5rem] rounded-md border border-dashed border-[var(--ground-line)] p-2" aria-label={t("Your order", "លំដាប់របស់អ្នក")}>
            <div className="flex flex-wrap gap-1.5">
              {picked.length === 0 && <span className="px-1 py-2 text-xs text-[var(--ink-faint)]">{t("Tap the first letter of the alphabet among the tiles below.", "ចុចអក្សរដែលមកមុនគេក្នុងចំណោមអក្សរខាងក្រោម។")}</span>}
              {picked.map((l) => (
                <span key={l} lang="km" className="flex h-10 min-w-10 items-center justify-center rounded-md bg-[var(--gold)]/15 px-2 font-khmer text-xl text-[var(--gold)]">{l}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
            {tiles.map((l) => {
              const used = picked.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  disabled={used || Boolean(result)}
                  onClick={() => tap(l)}
                  aria-label={KHMER_CONSONANTS[l].name}
                  className={`flex h-16 items-center justify-center rounded-md border font-khmer text-3xl transition ${used ? "invisible" : wrong === l ? "border-[var(--danger)]/60 bg-[var(--danger)]/10 text-[var(--danger)]" : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink)] hover:border-[var(--gold-dim)] active:scale-95"}`}
                >
                  <span lang="km">{l}</span>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-[var(--ink-faint)]" role="status">
            {result
              ? ""
              : t(`${picked.length} of ${tiles.length} · mistakes ${mistakes}`, `${toKhmerNumerals(String(picked.length))} ក្នុងចំណោម ${toKhmerNumerals(String(tiles.length))} · កំហុស ${toKhmerNumerals(String(mistakes))}`)}
          </p>

          {result && (
            <div className="space-y-3 rounded-md border border-[var(--gold)] p-4" role="status">
              <p className="text-sm text-[var(--ink)]">
                {t(
                  `Done in ${seconds(result.ms)} s with ${result.mistakes} mistake(s).`,
                  `រួចរាល់ក្នុងរយៈពេល ${toKhmerNumerals(seconds(result.ms))} វិនាទី មានកំហុស ${toKhmerNumerals(String(result.mistakes))}។`,
                )}{" "}
                {best[String(tiles.length)] != null && t(`Best clean time: ${seconds(best[String(tiles.length)])} s.`, `ពេលល្អបំផុតគ្មានកំហុស៖ ${toKhmerNumerals(seconds(best[String(tiles.length)]))} វិនាទី។`)}
              </p>
              <PillAction onClick={() => start()}><RefreshCw size={13} />{t("Play again", "លេងម្តងទៀត")}</PillAction>
            </div>
          )}
        </div>
      )}

      <details className="rounded-md border border-[var(--ground-line)] px-3 py-2 text-sm">
        <summary className="cursor-pointer py-1 text-[var(--ink-dim)]">{t("Show the full order", "បង្ហាញលំដាប់ទាំងមូល")}</summary>
        <p lang="km" className="mt-2 break-words font-khmer text-xl leading-loose tracking-wide text-[var(--ink)]">{ALPHABET.join(" ")}</p>
      </details>

      <SourceCredits>
        <p>{t(
          "The order is the traditional dictionary order of the 33 modern Khmer consonants (ក ខ គ ឃ ង … ស ហ ឡ អ), taken from the app's shared consonant table (lib/data/khmer-romanization.ts), the same one used by the Consonant Series Quiz. Best times are saved in this browser only. Original Tools123 implementation.",
          "លំដាប់គឺជាលំដាប់វចនានុក្រមប្រពៃណីនៃព្យញ្ជនៈខ្មែរ ៣៣ ដែលប្រើសព្វថ្ងៃ (ក ខ គ ឃ ង … ស ហ ឡ អ) យកពីតារាងព្យញ្ជនៈរួមរបស់កម្មវិធី (lib/data/khmer-romanization.ts) ដូចគ្នានឹងល្បែងសំណួរស៊េរីព្យញ្ជនៈ។ ពេលល្អបំផុតរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
