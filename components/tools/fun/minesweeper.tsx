"use client";
import { useEffect, useRef, useState } from "react";
import { ToolShell, Select } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Difficulty = "beginner" | "intermediate" | "expert";

const DIFFS: Record<Difficulty, { rows: number; cols: number; mines: number }> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

type Cell = { mine: boolean; revealed: boolean; flagged: boolean; adj: number };
type Status = "idle" | "playing" | "won" | "lost";

function emptyBoard(rows: number, cols: number): Cell[] {
  return Array.from({ length: rows * cols }, () => ({ mine: false, revealed: false, flagged: false, adj: 0 }));
}

/** Places mines after the first click so the opening move is always safe. */
function placeMines(board: Cell[], rows: number, cols: number, mines: number, safeIdx: number): Cell[] {
  const safe = new Set<number>([safeIdx]);
  const r0 = Math.floor(safeIdx / cols);
  const c0 = safeIdx % cols;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const rr = r0 + dr;
      const cc = c0 + dc;
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) safe.add(rr * cols + cc);
    }
  }
  const candidates: number[] = [];
  for (let i = 0; i < rows * cols; i++) if (!safe.has(i)) candidates.push(i);
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const mineSet = new Set(candidates.slice(0, mines));
  const next = board.map((c, i) => ({ ...c, mine: mineSet.has(i) }));
  for (let i = 0; i < next.length; i++) {
    if (next[i].mine) continue;
    const r0 = Math.floor(i / cols);
    const c0 = i % cols;
    let n = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r0 + dr;
        const cc = c0 + dc;
        if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
        if (next[rr * cols + cc].mine) n++;
      }
    }
    next[i] = { ...next[i], adj: n };
  }
  return next;
}

export default function Minesweeper() {
  const { text: t } = useLanguage();
  const [difficulty, setDifficulty] = useToolState<Difficulty>("minesweeper:difficulty", "beginner");
  const { rows, cols, mines } = DIFFS[difficulty];
  const [cells, setCells] = useState<Cell[]>(() => emptyBoard(9, 9));
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (status !== "playing") return;
    startRef.current = Date.now();
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [status]);

  const newGame = () => {
    setCells(emptyBoard(rows, cols));
    setStatus("idle");
    setElapsed(0);
  };

  const reveal = (i: number) => {
    if (status === "won" || status === "lost") return;
    let board = cells;
    if (status === "idle") {
      board = placeMines(cells, rows, cols, mines, i);
      setCells(board);
      setStatus("playing");
    }
    const cell = board[i];
    if (cell.flagged || cell.revealed) return;
    if (cell.mine) {
      setCells(board.map((c) => (c.mine ? { ...c, revealed: true } : c)));
      setStatus("lost");
      return;
    }
    const next = [...board];
    const stack = [i];
    while (stack.length) {
      const k = stack.pop()!;
      if (next[k].revealed || next[k].flagged) continue;
      next[k] = { ...next[k], revealed: true };
      if (next[k].adj === 0) {
        const r0 = Math.floor(k / cols);
        const c0 = k % cols;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const rr = r0 + dr;
            const cc = c0 + dc;
            if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
            const ni = rr * cols + cc;
            if (!next[ni].revealed && !next[ni].flagged && !next[ni].mine) stack.push(ni);
          }
        }
      }
    }
    setCells(next);
    if (next.filter((c) => c.revealed).length === rows * cols - mines) setStatus("won");
  };

  const flag = (i: number) => {
    if (status === "won" || status === "lost") return;
    setCells((prev) => prev.map((c, k) => (k === i && !c.revealed ? { ...c, flagged: !c.flagged } : c)));
  };

  const flaggedCount = cells.filter((c) => c.flagged).length;
  const face = status === "won" ? "😎" : status === "lost" ? "😵" : "🙂";

  return (
    <ToolShell
      title="Minesweeper"
      khmerTitle="ល្បែងរុករកមីន"
      description="Reveal every safe cell without hitting a mine. Left-click to reveal, right-click to flag."
      descriptionKm="បើកក្រឡាដែលគ្មានគ្រាប់មីនទាំងអស់ ដោយមិនប៉ះគ្រាប់មីន។ ចុចឆ្វេងដើម្បីបើក ចុចស្ដាំដើម្បីដាក់ទង់។"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value as Difficulty);
            setCells(emptyBoard(DIFFS[e.target.value as Difficulty].rows, DIFFS[e.target.value as Difficulty].cols));
            setStatus("idle");
            setElapsed(0);
          }}
          className="w-auto"
        >
          <option value="beginner">{t("Beginner 9×9×10", "កម្រិតចាប់ផ្ដើម ៩×៩×១០")}</option>
          <option value="intermediate">{t("Intermediate 16×16×40", "កម្រិតមធ្យម ១៦×១៦×៤០")}</option>
          <option value="expert">{t("Expert 30×16×99", "កម្រិតជំនាញ ៣០×១៦×៩៩")}</option>
        </Select>
        <div className="flex items-center gap-3 text-sm text-[var(--ink-dim)]">
          <span>
            {t("Mines", "គ្រាប់មីន")}: <b className="text-[var(--danger)]">{mines - flaggedCount}</b>
          </span>
          <span className="text-lg">{face}</span>
          <span>
            {t("Time", "ម៉ោង")}: <b className="text-[var(--gold)]">{elapsed}s</b>
          </span>
        </div>
        <Button type="button" onClick={newGame}>
          {t("New game", "ល្បែងថ្មី")}
        </Button>
      </div>

      {status === "won" && (
        <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4 text-center text-sm text-[var(--ink)]">
          {t("You cleared the board!", "អ្នកបានបោសសម្អាតក្ដារទាំងមូលហើយ!")}
        </div>
      )}
      {status === "lost" && (
        <div className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4 text-center text-sm text-[var(--danger)]">
          {t("You hit a mine!", "អ្នកប៉ះគ្រាប់មីនហើយ!")}
        </div>
      )}

      <div className="overflow-auto rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2">
        <div className="grid w-max gap-px" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {cells.map((c, i) => {
            let content = "";
            let cls = "border border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:border-[var(--gold)]";
            if (c.flagged && !c.revealed) {
              content = "🚩";
            } else if (c.revealed && c.mine) {
              content = "💣";
              cls = "border border-[var(--danger)]/50 bg-[var(--danger)]/20 text-[var(--danger)]";
            } else if (c.revealed) {
              content = c.adj > 0 ? String(c.adj) : "";
              cls =
                c.adj > 0
                  ? "border border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--gold)]"
                  : "border border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]";
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => reveal(i)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  flag(i);
                }}
                className={`flex h-7 w-7 items-center justify-center rounded-[2px] text-[11px] font-medium leading-none transition sm:h-8 sm:w-8 sm:text-xs ${cls}`}
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>
    </ToolShell>
  );
}
