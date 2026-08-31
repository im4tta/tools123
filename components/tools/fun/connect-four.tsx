"use client";
import { useCallback, useEffect, useState } from "react";
import { ToolShell, Select } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const COLS = 7;
const ROWS = 6;
type Board = number[][]; // 0 empty, 1 player 1, 2 player 2

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<number>(COLS).fill(0));
}

function drop(board: Board, col: number, player: number): { board: Board; row: number } | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) {
      const next = board.map((row) => [...row]);
      next[r][col] = player;
      return { board: next, row: r };
    }
  }
  return null;
}

function checkWin(board: Board, player: number): boolean {
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== player) continue;
      for (const [dr, dc] of dirs) {
        let count = 1;
        for (let k = 1; k < 4; k++) {
          const rr = r + dr * k;
          const cc = c + dc * k;
          if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || board[rr][cc] !== player) break;
          count++;
        }
        if (count >= 4) return true;
      }
    }
  }
  return false;
}

function lineScore(board: Board, r: number, c: number, player: number): number {
  let best = 1;
  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];
  for (const [dr, dc] of dirs) {
    let n = 1;
    for (const sign of [1, -1]) {
      for (let k = 1; k < 4; k++) {
        const rr = r + dr * k * sign;
        const cc = c + dc * k * sign;
        if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || board[rr][cc] !== player) break;
        n++;
      }
    }
    best = Math.max(best, n);
  }
  return best;
}

/** Easy AI: win if possible, block an immediate loss, otherwise a center-weighted heuristic. */
function aiColumn(board: Board): number {
  for (let c = 0; c < COLS; c++) {
    const res = drop(board, c, 2);
    if (res && checkWin(res.board, 2)) return c;
  }
  for (let c = 0; c < COLS; c++) {
    const res = drop(board, c, 1);
    if (res && checkWin(res.board, 1)) return c;
  }
  let best = 0;
  let bestScore = -Infinity;
  for (let c = 0; c < COLS; c++) {
    const res = drop(board, c, 2);
    if (!res) continue;
    const score =
      3 - Math.abs(c - 3) + lineScore(res.board, res.row, c, 2) * 4 + lineScore(res.board, res.row, c, 1) * 2;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

export default function ConnectFour() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState("connect-four:mode", "ai");
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [player, setPlayer] = useState<1 | 2>(1);
  const [status, setStatus] = useState<"playing" | "won" | "draw">("playing");
  const [winner, setWinner] = useState<0 | 1 | 2>(0);
  const [moves, setMoves] = useState(0);

  const play = useCallback(
    (col: number) => {
      if (status !== "playing") return;
      if (mode === "ai" && player === 2) return; // wait for the computer
      const res = drop(board, col, player);
      if (!res) return;
      setBoard(res.board);
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      if (checkWin(res.board, player)) {
        setStatus("won");
        setWinner(player);
        return;
      }
      if (nextMoves >= COLS * ROWS) {
        setStatus("draw");
        return;
      }
      setPlayer((p) => (p === 1 ? 2 : 1));
    },
    [board, player, status, moves, mode]
  );

  useEffect(() => {
    if (mode !== "ai" || status !== "playing" || player !== 2) return;
    const id = window.setTimeout(() => {
      play(aiColumn(board));
    }, 450);
    return () => window.clearTimeout(id);
  }, [mode, status, player, board, play]);

  const reset = () => {
    setBoard(emptyBoard());
    setPlayer(1);
    setStatus("playing");
    setWinner(0);
    setMoves(0);
  };

  const statusLine =
    status === "won"
      ? winner === 1
        ? t("Player 1 wins!", "អ្នកលេងទី១ ឈ្នះ!")
        : t("Player 2 wins!", "អ្នកលេងទី២ ឈ្នះ!")
      : status === "draw"
        ? t("It is a draw!", "ស្មើគ្នា!")
        : player === 1
          ? t("Player 1 turn", "វេនអ្នកលេងទី១")
          : mode === "ai"
            ? t("Computer is thinking…", "កុំព្យូទ័រកំពុងគិត…")
            : t("Player 2 turn", "វេនអ្នកលេងទី២");

  return (
    <ToolShell
      title="Connect Four"
      khmerTitle="ល្បែងភ្ជាប់បួន"
      description="Drop discs into a column and be the first to connect four in a row, column, or diagonal."
      descriptionKm="ទម្លាក់ថាសចូលជួរឈរ ហើយភ្ជាប់បួនជាប់គ្នា ទាំងជួរដេក ជួរឈរ ឬទ្រេត ឱ្យបានមុនគេ។"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Select value={mode} onChange={(e) => { setMode(e.target.value); reset(); }} className="w-auto">
          <option value="ai">{t("vs Computer (easy)", "លេងជាមួយកុំព្យូទ័រ (ងាយ)")}</option>
          <option value="pvp">{t("Two players", "អ្នកលេងពីរនាក់")}</option>
        </Select>
        <div className="text-sm text-[var(--ink-dim)]">
          {t("Moves", "ចលនា")}: <b className="text-[var(--gold)]">{moves}</b>
        </div>
        <Button type="button" onClick={reset}>
          {t("Reset", "កំណត់ឡើងវិញ")}
        </Button>
      </div>

      <div
        className={`rounded-md border p-3 text-center text-sm ${
          status === "won"
            ? "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]"
            : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]"
        }`}
      >
        {statusLine}
      </div>

      <div className="mx-auto w-full max-w-sm">
        <div className="grid grid-cols-7 gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2">
          {Array.from({ length: ROWS * COLS }, (_, i) => {
            const row = Math.floor(i / COLS);
            const col = i % COLS;
            const v = board[row][col];
            return (
              <button
                key={i}
                type="button"
                onClick={() => play(col)}
                disabled={status !== "playing" || v !== 0 || (mode === "ai" && player === 2)}
                aria-label={`Column ${col + 1}`}
                className={`aspect-square rounded-full transition ${
                  v === 1
                    ? "bg-[var(--danger)]"
                    : v === 2
                      ? "bg-[var(--gold)]"
                      : "border border-[var(--ground-line)] bg-transparent hover:bg-[var(--gold)]/20 disabled:hover:bg-transparent"
                }`}
              />
            );
          })}
        </div>
      </div>
    </ToolShell>
  );
}
