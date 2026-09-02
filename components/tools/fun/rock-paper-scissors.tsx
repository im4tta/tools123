"use client";
import { useMemo, useState } from "react";
import { Hand, Scissors, FileQuestion, RotateCcw } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";

const ICONS = { rock: Hand, paper: FileQuestion, scissors: Scissors };
type Choice = keyof typeof ICONS;
type Result = "win" | "lose" | "draw";

const OPTIONS: Choice[] = ["rock", "paper", "scissors"];
const CHOICE_LABELS: Record<Choice, [string, string]> = {
  rock: ["Rock", "ថ្ម"],
  paper: ["Paper", "ក្រដាស"],
  scissors: ["Scissors", "កន្ត្រៃ"],
};

interface Round {
  id: number;
  player: Choice;
  computer: Choice;
  result: Result;
}

function pickComputer(): Choice {
  return OPTIONS[Math.floor(Math.random() * OPTIONS.length)];
}

function outcome(player: Choice, computer: Choice): Result {
  if (player === computer) return "draw";
  const wins =
    (player === "rock" && computer === "scissors") ||
    (player === "scissors" && computer === "paper") ||
    (player === "paper" && computer === "rock");
  return wins ? "win" : "lose";
}

export default function RockPaperScissors() {
  const { text: t } = useLanguage();
  const [player, setPlayer] = useState<Choice | null>(null);
  const [computer, setComputer] = useState<Choice | null>(null);
  const [scores, setScores] = useState({ w: 0, l: 0, d: 0 });
  const [history, setHistory] = useState<Round[]>([]);
  const [roundId, setRoundId] = useState(0);

  const play = (p: Choice) => {
    const c = pickComputer();
    const res = outcome(p, c);
    setPlayer(p);
    setComputer(c);
    setScores((s) =>
      res === "win" ? { ...s, w: s.w + 1 } : res === "lose" ? { ...s, l: s.l + 1 } : { ...s, d: s.d + 1 }
    );
    const id = roundId + 1;
    setRoundId(id);
    setHistory((h) => [{ id, player: p, computer: c, result: res }, ...h].slice(0, 10));
  };

  const reset = () => {
    setPlayer(null);
    setComputer(null);
    setScores({ w: 0, l: 0, d: 0 });
    setHistory([]);
    setRoundId(0);
  };

  const verdict = useMemo(() => {
    if (!player || !computer) return "";
    const res = outcome(player, computer);
    if (res === "draw") return t("Draw!", "ស្មើ!");
    return res === "win" ? t("You win!", "អ្នកឈ្នះ!") : t("Computer wins!", "ម៉ាស៊ីនឈ្នះ!");
  }, [player, computer, t]);

  return (
    <ToolShell
      title="Rock Paper Scissors"
      khmerTitle="ថ្ម កន្ត្រៃ ក្រដាស"
      description="Play rock, paper, scissors against the computer and track your rounds."
      descriptionKm="លេងថ្ម កន្ត្រៃ ក្រដាស ជាមួយម៉ាស៊ីន និងតាមដានជុំលេងរបស់អ្នក។"
    >
      <div className="grid grid-cols-3 gap-3">
        {OPTIONS.map((k) => {
          const Icon = ICONS[k];
          return (
            <button
              key={k}
              type="button"
              onClick={() => play(k)}
              className={`flex flex-col items-center gap-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-6 transition hover:border-[var(--gold-dim)] ${player === k ? "border-[var(--gold)]" : ""}`}
            >
              <Icon size={32} className="text-[var(--ink)]" />
              <span className="text-xs font-medium text-[var(--ink-dim)]">{t(CHOICE_LABELS[k][0], CHOICE_LABELS[k][1])}</span>
            </button>
          );
        })}
      </div>

      {player && computer && (
        <div key={roundId} className="fade-rise rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-center">
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

      {history.length > 0 && (
        <div className="rounded-md border border-[var(--ground-line)]">
          <div className="border-b border-[var(--ground-line)] px-3 py-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
            {t("Round history", "ប្រវត្តិជុំលេង")}
          </div>
          <div className="divide-y divide-[var(--ground-line)]">
            {history.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm">
                <span className="text-xs text-[var(--ink-faint)]">#{r.id}</span>
                <span className="text-[var(--ink)]">
                  {t(CHOICE_LABELS[r.player][0], CHOICE_LABELS[r.player][1])} → {t(CHOICE_LABELS[r.computer][0], CHOICE_LABELS[r.computer][1])}
                </span>
                <span
                  className={
                    r.result === "win"
                      ? "text-[var(--green)]"
                      : r.result === "lose"
                        ? "text-[var(--danger)]"
                        : "text-[var(--ink-faint)]"
                  }
                >
                  {r.result === "win" ? t("Win", "ឈ្នះ") : r.result === "lose" ? t("Loss", "ចាញ់") : t("Draw", "ស្មើ")}
                </span>
              </div>
            ))}
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
