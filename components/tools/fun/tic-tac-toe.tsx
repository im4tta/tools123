"use client";
import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";

type Cell = "X" | "O" | null;

function pickMove(board: Cell[]): number {
  const wins = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  const empty = board.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  if (empty.length === 0) return -1;
  for (const w of wins) {
    const cells = w.map((i) => board[i]);
    if (cells.filter((c) => c === "O").length === 2 && cells.includes(null)) return w[cells.indexOf(null)];
  }
  for (const w of wins) {
    const cells = w.map((i) => board[i]);
    if (cells.filter((c) => c === "X").length === 2 && cells.includes(null)) return w[cells.indexOf(null)];
  }
  if (board[4] === null) return 4;
  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return empty[Math.floor(Math.random() * empty.length)];
}

function winnerOf(board: Cell[]): "X" | "O" | "draw" | null {
  const wins = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const w of wins) {
    const [a, b, c] = w;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a] as "X" | "O";
  }
  return board.every((c) => c) ? "draw" : null;
}

export default function TicTacToe() {
  const { text: t } = useLanguage();
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [score, setScore] = useState({ you: 0, comp: 0, draw: 0 });

  const winner = useMemo(() => winnerOf(board), [board]);

  const play = (i: number) => {
    if (board[i] || winner) return;
    const next = [...board];
    next[i] = turn;
    setBoard(next);
    setTurn(turn === "X" ? "O" : "X");
    const w = winnerOf(next);
    if (w === "X") setScore((s) => ({ ...s, you: s.you + 1 }));
    else if (w === "O") setScore((s) => ({ ...s, comp: s.comp + 1 }));
    else if (w === "draw") setScore((s) => ({ ...s, draw: s.draw + 1 }));
    else {
      const move = pickMove(next);
      if (move >= 0) {
        setTimeout(() => {
          setBoard((b) => {
            const b2 = [...b];
            b2[move] = "O";
            setTurn("X");
            return b2;
          });
        }, 350);
      }
    }
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setTurn("X");
    setScore({ you: 0, comp: 0, draw: 0 });
  };

  const status = winner === "X" ? t("You win!", "អ្នកឈ្នះ!") : winner === "O" ? t("Computer wins!", "ម៉ាស៊ីនឈ្នះ!") : winner === "draw" ? t("Draw!", "ស្មើ!") : t(`Your turn — ${turn === "X" ? "you are X" : "computer thinking…"}`, `វេនអ្នក — ${turn === "X" ? "អ្នកគឺ X" : "ម៉ាស៊ីនកំពុងគិត…"}`);

  return (
    <ToolShell
      title="Tic Tac Toe"
      khmerTitle="លេងគូសបន្ទាត់"
      description="Play tic-tac-toe against the computer."
      descriptionKm="លេងហ្គេមគូសបន្ទាត់ (Tic Tac Toe) ជាមួយម៉ាស៊ីន។"
    >
      <div className="mx-auto w-full max-w-xs">
        <div className="grid grid-cols-3 gap-2">
          {board.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => play(i)}
              disabled={!!c || !!winner}
              className="flex h-24 w-full items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] font-display text-4xl font-semibold text-[var(--ink)] transition hover:border-[var(--gold-dim)] disabled:cursor-default disabled:opacity-90"
            >
              {c}
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-[var(--ink-dim)]">{status}</p>
        <div className="mt-2 flex justify-center gap-4 text-xs text-[var(--ink-dim)]">
          <span>{t("You", "អ្នក")}: <b className="text-[var(--ink)]">{score.you}</b></span>
          <span>{t("Computer", "ម៉ាស៊ីន")}: <b className="text-[var(--ink)]">{score.comp}</b></span>
          <span>{t("Draws", "ស្មើ")}: <b className="text-[var(--ink)]">{score.draw}</b></span>
        </div>
        <Button type="button" onClick={reset} className="mt-4 w-full">
          <RotateCcw size={15} className="mr-1 inline" />
          {t("New game", "លេងថ្មី")}
        </Button>
      </div>
    </ToolShell>
  );
}