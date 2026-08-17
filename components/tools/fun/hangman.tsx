"use client";
import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ToolShell, TextInput } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const WORDS = ["KHME", "ANGKOR", "MOTO", "BENGAL", "PAGODA", "RIEL", "BATTAMBANG", "TONLE", "MECHATREY", "SOKA", "PRASAT", "KARMA", "PUMPKIN", "JUNGLE", "SILK", "LOTUS", "TEMPLE", "MARKET", "RIVER", "PAPAYA"];

function pickWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function mask(word: string, guesses: Set<string>): string {
  return word.split("").map((ch) => (guesses.has(ch) ? ch : "_")).join(" ");
}

export default function Hangman() {
  const { text: t } = useLanguage();
  const [word, setWord] = useState(() => pickWord());
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [guess, setGuess] = useToolState("hangman:guess", "");

  const MAX_WRONG = 6;
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const state = useMemo(() => {
    const lettersLeft = word.split("").filter((ch) => !guessed.has(ch)).length;
    if (lettersLeft === 0) return "win";
    if (wrong >= MAX_WRONG) return "lose";
    return "play";
  }, [word, guessed, wrong]);

  const submit = () => {
    const ch = guess.toUpperCase().trim();
    if (!ch || state !== "play") return;
    if (guessed.has(ch)) return;
    const next = new Set(guessed);
    next.add(ch);
    setGuessed(next);
    if (!word.includes(ch)) setWrong((w) => w + 1);
    setGuess("");
  };

  const reset = () => {
    setWord(pickWord());
    setGuessed(new Set());
    setWrong(0);
    setGuess("");
  };

  return (
    <ToolShell
      title="Hangman"
      khmerTitle="ល្បែងទាយពាក្យ"
      description="Guess the hidden English word before you run out of tries."
      descriptionKm="ទាយពាក្យអង់គ្លេសដែលលាក់ទុក មុនពេលអ្នកអស់ឱកាស។"
    >
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-center">
        <div className="font-mono-ui text-2xl font-semibold tracking-widest text-[var(--ink)]">
          {mask(word, guessed)}
        </div>
        <div className="mt-3 text-sm text-[var(--ink-dim)]">
          {t("Wrong guesses", "ទាយខុស")}: {wrong}/{MAX_WRONG}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5">
        {letters.map((l) => (
          <button
            key={l}
            type="button"
            disabled={guessed.has(l) || state !== "play"}
            onClick={() => {
              const next = new Set(guessed);
              next.add(l);
              setGuessed(next);
              if (!word.includes(l)) setWrong((w) => w + 1);
            }}
            className={`h-8 w-8 rounded text-xs font-medium transition ${guessed.has(l) ? (word.includes(l) ? "bg-[var(--gold)]/20 text-[var(--gold)]" : "bg-[var(--danger)]/10 text-[var(--danger)]") : "border border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink)] hover:border-[var(--gold-dim)]"}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <TextInput value={guess} onChange={(e) => setGuess(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} maxLength={1} className="text-center uppercase" placeholder={t("Letter", "អក្សរ")} />
        <Button type="button" onClick={submit} disabled={state !== "play"}>
          {t("Guess", "ទាយ")}
        </Button>
      </div>

      {state !== "play" && (
        <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4 text-center">
          <div className="text-lg font-semibold text-[var(--ink)]">
            {state === "win" ? t("You got it!", "ទាយត្រូវហើយ!") : t("Out of tries!", "អស់ឱកាសហើយ!")}
          </div>
          <div className="mt-1 text-sm text-[var(--ink-dim)]">
            {t("Word was", "ពាក្យគឺ")}: <b className="text-[var(--ink)]">{word}</b>
          </div>
          <Button type="button" onClick={reset} className="mt-3">
            <RotateCcw size={15} className="mr-1 inline" />
            {t("Play again", "លេងម្ដងទៀត")}
          </Button>
        </div>
      )}
    </ToolShell>
  );
}