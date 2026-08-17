"use client";
import { useMemo, useState } from "react";
import { Hand, Scissors, FileQuestion, RotateCcw } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";

const ICONS = { rock: Hand, paper: FileQuestion, scissors: Scissors };
const OPTIONS: (keyof typeof ICONS)[] = ["rock", "paper", "scissors"];

function pickComputer(): keyof typeof ICONS {
  return OPTIONS[Math.floor(Math.random() * OPTIONS.length)];
}

export default function RockPaperScissors() {
  const { text: t } = useLanguage();
  const [player, setPlayer] = useState<keyof typeof ICONS | null>(null);
  const [computer, setComputer] = useState<keyof typeof ICONS | null>(null);
  const [scores, setScores] = useState({ w: 0, l: 0, d: 0 });

  const play = (p: keyof typeof ICONS) => {
    const c = pickComputer();
    setPlayer(p);
    setComputer(c);
    if (p === c) setScores((s) => ({ ...s, d: s.d + 1 }));
    else if ((p === "rock" && c === "scissors") || (p === "scissors" && c === "paper") || (p === "paper" && c === "rock"))
      setScores((s) => ({ ...s, w: s.w + 1 }));
    else setScores((s) => ({ ...s, l: s.l + 1 }));
  };

  const verdict = useMemo(() => {
    if (!player || !computer) return "";
    if (player === computer) return t("Draw!", "ស្មើ!");
    const win = (player === "rock" && computer === "scissors") || (player === "scissors" && computer === "paper") || (player === "paper" && computer === "rock");
    return win ? t("You win!", "អ្នកឈ្នះ!") : t("Computer wins!", "ម៉ាស៊ីនឈ្នះ!");
  }, [player, computer, t]);

  const reset = () => {
    setPlayer(null);
    setComputer(null);
    setScores({ w: 0, l: 0, d: 0 });
  };

  return (
    <ToolShell
      title="Rock Paper Scissors"
      khmerTitle="ថ្ម កន្ត្រៃ ក្រដាស"
      description="Play rock, paper, scissors against the computer."
      descriptionKm="លេងថ្ម កន្ត្រៃ ក្រដាស ជាមួយម៉ាស៊ីន។"
    >
      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(ICONS) as (keyof typeof ICONS)[]).map((k) => {
          const Icon = ICONS[k];
          return (
            <button
              key={k}
              type="button"
              onClick={() => play(k)}
              className={`flex flex-col items-center gap-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-6 transition hover:border-[var(--gold-dim)] ${player === k ? "border-[var(--gold)]" : ""}`}
            >
              <Icon size={32} className="text-[var(--ink)]" />
              <span className="text-xs font-medium text-[var(--ink-dim)]">{t(k.charAt(0).toUpperCase() + k.slice(1), "")}</span>
            </button>
          );
        })}
      </div>

      {player && computer && (
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-center">
          <div className="flex items-center justify-center gap-8">
            {[player, computer].map((c, i) => {
              const Icon = ICONS[c];
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <Icon size={40} className={i === 0 ? "text-[var(--gold)]" : "text-[var(--ink-dim)]"} />
                  <span className="text-xs text-[var(--ink-faint)]">{i === 0 ? t("You", "អ្នក") : t("Computer", "ម៉ាស៊ីន")}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 font-display text-2xl font-semibold text-[var(--ink)]">{verdict}</div>
          <div className="mt-2 text-sm text-[var(--ink-dim)]">
            {t("Wins", "ឈ្នះ")}: {scores.w} · {t("Losses", "ចាញ់")}: {scores.l} · {t("Draws", "ស្មើ")}: {scores.d}
          </div>
        </div>
      )}

      <Button type="button" onClick={reset} className="w-full">
        <RotateCcw size={15} className="mr-1 inline" />
        {t("Reset score", "កំណត់ពិន្ទុឡើងវិញ")}
      </Button>
    </ToolShell>
  );
}