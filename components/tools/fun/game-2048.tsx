"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const SIZE = 4;
type Dir = "left" | "right" | "up" | "down";

const emptyBoard = (): number[][] => Array.from({ length: SIZE }, () => Array<number>(SIZE).fill(0));

function addRandom(grid: number[][]): number[][] {
  const empty: [number, number][] = [];
  grid.forEach((row, r) => row.forEach((v, c) => void (v === 0 && empty.push([r, c]))));
  if (!empty.length) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = grid.map((row) => [...row]);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function slide(row: number[]): { row: number[]; gained: number } {
  const tiles = row.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      out.push(tiles[i] * 2);
      gained += tiles[i] * 2;
      i++;
    } else {
      out.push(tiles[i]);
    }
  }
  while (out.length < SIZE) out.push(0);
  return { row: out, gained };
}

const transpose = (g: number[][]) => g[0].map((_, c) => g.map((row) => row[c]));
const reverseRows = (g: number[][]) => g.map((row) => [...row].reverse());

function gridsEqual(a: number[][], b: number[][]): boolean {
  return a.every((row, r) => row.every((v, c) => v === b[r][c]));
}

function move(grid: number[][], dir: Dir): { grid: number[][]; gained: number; moved: boolean } {
  let g = grid.map((row) => [...row]);
  if (dir === "left" || dir === "right") {
    if (dir === "right") g = reverseRows(g);
    const rows = g.map(slide);
    g = rows.map((r) => r.row);
    const gained = rows.reduce((s, r) => s + r.gained, 0);
    if (dir === "right") g = reverseRows(g);
    return { grid: g, gained, moved: !gridsEqual(grid, g) };
  }
  g = transpose(g);
  if (dir === "down") g = reverseRows(g);
  const rows = g.map(slide);
  g = rows.map((r) => r.row);
  const gained = rows.reduce((s, r) => s + r.gained, 0);
  if (dir === "down") g = reverseRows(g);
  g = transpose(g);
  return { grid: g, gained, moved: !gridsEqual(grid, g) };
}

function canMove(grid: number[][]): boolean {
  if (grid.some((row) => row.some((v) => v === 0))) return true;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return true;
      if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return true;
    }
  }
  return false;
}

function tileClass(v: number): string {
  if (v === 0) return "bg-[var(--ground-raised)] text-transparent";
  if (v <= 4) return "bg-[var(--gold)]/25 text-[var(--ink)]";
  if (v <= 16) return "bg-[var(--gold)]/40 text-[var(--ink)]";
  if (v <= 64) return "bg-[var(--gold)]/60 text-[var(--ink)]";
  if (v <= 256) return "bg-[var(--gold)]/75 text-[#0a0c0d]";
  return "bg-[var(--gold)] text-[#0a0c0d]";
}

export default function Game2048() {
  const { text: t } = useLanguage();
  const [grid, setGrid] = useState<number[][]>(() => addRandom(addRandom(emptyBoard())));
  const [score, setScore] = useState(0);
  const [best, setBest] = useToolState("game-2048:best", 0);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const [history, setHistory] = useState<{ grid: number[][]; score: number }[]>([]);

  const gridRef = useRef(grid);
  const scoreRef = useRef(score);
  const wonRef = useRef(won);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    gridRef.current = grid;
    scoreRef.current = score;
    wonRef.current = won;
  });

  const handleMove = useCallback((dir: Dir) => {
    const g = gridRef.current;
    const { grid: ng, gained, moved } = move(g, dir);
    if (!moved) return;
    setHistory((h) => [...h.slice(-49), { grid: g, score: scoreRef.current }]);
    const ng2 = addRandom(ng);
    setGrid(ng2);
    const ns = scoreRef.current + gained;
    setScore(ns);
    setBest((prev) => Math.max(prev, ns));
    if (!wonRef.current && ng2.some((row) => row.some((v) => v >= 2048))) setWon(true);
    if (!canMove(ng2)) setOver(true);
  }, [setBest]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
      };
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();
      handleMove(dir);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleMove]);

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchRef.current.x;
    const dy = touch.clientY - touchRef.current.y;
    touchRef.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
    handleMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
  };

  const undo = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setGrid(last.grid);
    setScore(last.score);
    setOver(false);
    setHistory(history.slice(0, -1));
  };

  const newGame = () => {
    setGrid(addRandom(addRandom(emptyBoard())));
    setScore(0);
    setOver(false);
    setWon(false);
    setHistory([]);
  };

  return (
    <ToolShell
      title="2048"
      khmerTitle="ល្បែង ២០៤៨"
      description="Slide tiles with arrow keys (or swipe on mobile) to merge matching numbers and reach 2048."
      descriptionKm="រុញក្រឡាដោយប្រើប៊ូតុងព្រួញ (ឬអូសលើទូរសព្ទ) ដើម្បីបញ្ចូលលេខដូចគ្នា ហើយឈានទៅដល់លេខ ២០៤៨។"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3 text-sm text-[var(--ink-dim)]">
          <span>
            {t("Score", "ពិន្ទុ")}: <b className="text-[var(--gold)]">{score}</b>
          </span>
          <span>
            {t("Best", "ល្អបំផុត")}: <b className="text-[var(--gold)]">{best}</b>
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={!history.length}
            className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-sm text-[var(--ink-dim)] transition hover:text-[var(--ink)] disabled:opacity-40"
          >
            {t("Undo", "មិនធ្វើវិញ")}
          </button>
          <Button type="button" onClick={newGame}>
            {t("New game", "ល្បែងថ្មី")}
          </Button>
        </div>
      </div>

      <div
        className="relative mx-auto w-full max-w-sm touch-none select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="grid grid-cols-4 gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2">
          {grid.flat().map((v, i) => (
            <div
              key={i}
              className={`flex aspect-square items-center justify-center rounded-md font-display text-2xl font-semibold sm:text-3xl ${tileClass(v)}`}
            >
              {v || ""}
            </div>
          ))}
        </div>
        {over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-md bg-[var(--ground-raised)]/90">
            <div className="font-display text-2xl font-semibold text-[var(--ink)]">{t("Game over!", "បញ្ចប់ល្បែង!")}</div>
            <Button type="button" onClick={newGame}>
              {t("Try again", "សាកលេងម្ដងទៀត")}
            </Button>
          </div>
        )}
        {won && !over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-md bg-[var(--ground-raised)]/90">
            <div className="font-display text-2xl font-semibold text-[var(--gold)]">{t("You reached 2048!", "អ្នកឈានដល់លេខ ២០៤៨ ហើយ!")}</div>
            <div className="text-sm text-[var(--ink-dim)]">{t("Keep going to beat your best.", "បន្តលេងទៀត ដើម្បីបំបែកកំណត់ត្រាផ្ទាល់ខ្លួន។")}</div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
