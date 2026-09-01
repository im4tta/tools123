"use client";
import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ToolShell, Select } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Cell = "X" | "O" | null;

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function winnerOf(board: Cell[]): { winner: "X" | "O" | "draw" | null; line: number[] | null } {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as "X" | "O", line };
    }
  }
  return { winner: board.every((c) => c) ? "draw" : null, line: null };
}

/** Minimax with alpha-beta pruning for a perfect game. */
function minimax(board: Cell[], current: "X" | "O", ai: "X" | "O", depth: number, alpha: number, beta: number): number {
  const { winner } = winnerOf(board);
  if (winner === ai) return 10 - depth;
  if (winner && winner !== "draw") return depth - 10;
  if (winner === "draw") return 0;
  if (current === ai) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      const next = [...board];
      next[i] = current;
      best = Math.max(best, minimax(next, current === "X" ? "O" : "X", ai, depth + 1, alpha, beta));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = Infinity;
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    const next = [...board];
    next[i] = current;
    best = Math.min(best, minimax(next, current === "X" ? "O" : "X", ai, depth + 1, alpha, beta));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

function bestMove(board: Cell[], ai: "X" | "O"): number {
  let bestIdx = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    const next = [...board];
    next[i] = ai;
    const score = minimax(next, ai === "X" ? "O" : "X", ai, 0, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export default function TicTacToe() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState("tic-tac-toe:mode", "ai");
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [score, setScore] = useState({ you: 0, comp: 0, draw: 0 });
  const [moves, setMoves] = useState(0);

  const { winner, line } = useMemo(() => winnerOf(board), [board]);
  const placed = board.filter((c) => c !== null).length;
  const waitingForAI = mode === "ai" && !winner && placed % 2 === 1;

  const play = (i: number) => {
    if (board[i] || winner || waitingForAI) return;
    const next = [...board];
    next[i] = turn;
    setBoard(next);
    setMoves((m) => m + 1);
    const w = winnerOf(next).winner;
    if (w === "X") setScore((s) => ({ ...s, you: s.you + 1 }));
    else if (w === "O") setScore((s) => ({ ...s, comp: s.comp + 1 }));
    else if (w === "draw") setScore((s) => ({ ...s, draw: s.draw + 1 }));
    else if (mode === "ai") {
      // Unbeatable AI responds as O with a short thinking delay.
      const aiIdx = bestMove(next, "O");
      window.setTimeout(() => {
        setBoard((b) => {
          if (b[aiIdx]) return b;
          const b2 = [...b];
          b2[aiIdx] = "O";
          return b2;
        });
        setMoves((m) => m + 1);
        const after = [...next];
        after[aiIdx] = "O";
        const w2 = winnerOf(after).winner;
        if (w2 === "O") setScore((s) => ({ ...s, comp: s.comp + 1 }));
        else if (w2 === "draw") setScore((s) => ({ ...s, draw: s.draw + 1 }));
      }, 350);
    } else {
      setTurn(turn === "X" ? "O" : "X");
    }
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setTurn("X");
    setScore({ you: 0, comp: 0, draw: 0 });
    setMoves(0);
  };

  const status =
    winner === "X"
      ? mode === "ai"
        ? t("You win!", "អ្នកឈ្នះ!")
        : t("Player X wins!", "អ្នកលេង X ឈ្នះ!")
      : winner === "O"
        ? mode === "ai"
          ? t("Computer wins!", "ម៉ាស៊ីនឈ្នះ!")
          : t("Player O wins!", "អ្នកលេង O ឈ្នះ!")
        : winner === "draw"
          ? t("Draw!", "ស្មើ!")
          : waitingForAI
            ? t("Computer thinking…", "កុំព្យូទ័រកំពុងគិត…")
            : mode === "ai"
              ? t("Your turn — you are X", "វេនអ្នក — អ្នកគឺ X")
              : turn === "X"
                ? t("Player X turn", "វេនអ្នកលេង X")
                : t("Player O turn", "វេនអ្នកលេង O");

  return (
    <ToolShell
      title="Tic Tac Toe"
      khmerTitle="លេងគូសបន្ទាត់"
      description="Play tic-tac-toe against an unbeatable computer (minimax) or with a friend on the same device."
      descriptionKm="លេងហ្គេមគូសបន្ទាត់ (Tic Tac Toe) ជាមួយម៉ាស៊ីនដែលឈ្នះមិនបាន (minimax) ឬលេងជាមួយមិត្តលើឧបករណ៍តែមួយ។"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={mode}
          onChange={(e) => {
            setMode(e.target.value);
            reset();
          }}
          className="w-auto"
        >
          <option value="ai">{t("vs Computer (unbeatable)", "លេងជាមួយកុំព្យូទ័រ (ឈ្នះមិនបាន)")}</option>
          <option value="pvp">{t("Two players", "អ្នកលេងពីរនាក់")}</option>
        </Select>
        <div className="text-sm text-[var(--ink-dim)]">
          {t("Moves", "ចលនា")}: <b className="text-[var(--gold)]">{moves}</b>
        </div>
        <Button type="button" onClick={reset}>
          <RotateCcw size={15} className="mr-1 inline" />
          {t("Reset", "កំណត់ឡើងវិញ")}
        </Button>
      </div>

      <div className="mx-auto w-full max-w-xs">
        <div className="grid grid-cols-3 gap-2">
          {board.map((c, i) => {
            const inLine = line?.includes(i) ?? false;
            return (
              <button
                key={i}
                type="button"
                onClick={() => play(i)}
                disabled={!!c || !!winner || waitingForAI}
                className={`flex h-24 w-full items-center justify-center rounded-md border font-display text-4xl font-semibold transition ${
                  inLine
                    ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
                    : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink)] hover:border-[var(--gold-dim)] disabled:cursor-default disabled:opacity-90"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-center text-sm text-[var(--ink-dim)]">{status}</p>
        {mode === "ai" && (
          <div className="mt-2 flex justify-center gap-4 text-xs text-[var(--ink-dim)]">
            <span>
              {t("You", "អ្នក")}: <b className="text-[var(--ink)]">{score.you}</b>
            </span>
            <span>
              {t("Computer", "ម៉ាស៊ីន")}: <b className="text-[var(--ink)]">{score.comp}</b>
            </span>
            <span>
              {t("Draws", "ស្មើ")}: <b className="text-[var(--ink)]">{score.draw}</b>
            </span>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
