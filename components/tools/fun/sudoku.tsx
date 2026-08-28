"use client";
import { useEffect, useMemo, useState } from "react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";

type Difficulty = "easy" | "medium" | "hard";

// Clue counts per difficulty (fewer clues = harder). Standard range: easy ~40,
// medium ~33, hard ~27 given cells.
const CLUES: Record<Difficulty, number> = { easy: 40, medium: 33, hard: 27 };

const shuffled = (arr: number[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const canPlace = (g: number[], r: number, c: number, v: number) => {
  for (let k = 0; k < 9; k++) {
    if (g[r * 9 + k] === v || g[k * 9 + c] === v) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (g[(br + i) * 9 + bc + j] === v) return false;
    }
  }
  return true;
};

// Backtracking solver: fills the grid with a random-ordered valid solution.
const fillGrid = (g: number[]): boolean => {
  const i = g.indexOf(0);
  if (i === -1) return true;
  const r = Math.floor(i / 9);
  const c = i % 9;
  for (const v of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (canPlace(g, r, c, v)) {
      g[i] = v;
      if (fillGrid(g)) return true;
      g[i] = 0;
    }
  }
  return false;
};

// Counts solutions up to `limit` (early exit) to enforce unique puzzles.
const countSolutions = (g: number[], limit = 2): number => {
  const i = g.indexOf(0);
  if (i === -1) return 1;
  let count = 0;
  for (let v = 1; v <= 9; v++) {
    if (canPlace(g, Math.floor(i / 9), i % 9, v)) {
      g[i] = v;
      count += countSolutions(g, limit);
      g[i] = 0;
      if (count >= limit) return count;
    }
  }
  return count;
};

function generatePuzzle(clues: number): { puzzle: number[]; solution: number[] } {
  const solution = new Array(81).fill(0);
  fillGrid(solution);
  const puzzle = [...solution];
  let removed = 0;
  const target = 81 - clues;
  for (const i of shuffled([...Array(81).keys()])) {
    if (removed >= target) break;
    const backup = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions([...puzzle]) === 1) removed++;
    else puzzle[i] = backup;
  }
  return { puzzle, solution };
}

export default function Sudoku() {
  const { text: t } = useLanguage();
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [game, setGame] = useState<{ puzzle: number[]; solution: number[] } | null>(null);
  const [board, setBoard] = useState<number[]>(Array(81).fill(0));
  const [notes, setNotes] = useState<Set<number>[]>(() => Array.from({ length: 81 }, () => new Set<number>()));
  const [selected, setSelected] = useState<number | null>(null);
  const [noteMode, setNoteMode] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [wrong, setWrong] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState<null | "win" | "error" | "ok">(null);

  useEffect(() => {
    // Fresh puzzle must be generated after mount so the random board matches
    // between server and client render (SSR-safe).
    /* eslint-disable react-hooks/set-state-in-effect */
    const g = generatePuzzle(CLUES[difficulty]);
    setGame(g);
    setBoard([...g.puzzle]);
    setNotes(Array.from({ length: 81 }, () => new Set<number>()));
    setSelected(null);
    setSeconds(0);
    setWrong(new Set());
    setMessage(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [difficulty]);

  useEffect(() => {
    if (message === "win") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [message]);

  // Cells whose value collides with another in the same row/column/box.
  const conflicts = useMemo(() => {
    const s = new Set<number>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const i = r * 9 + c;
        const v = board[i];
        if (v === 0) continue;
        for (let k = 0; k < 9; k++) {
          if (k !== c && board[r * 9 + k] === v) {
            s.add(i);
            s.add(r * 9 + k);
          }
          if (k !== r && board[k * 9 + c] === v) {
            s.add(i);
            s.add(k * 9 + c);
          }
        }
        const br = Math.floor(r / 3) * 3;
        const bc = Math.floor(c / 3) * 3;
        for (let a = 0; a < 3; a++) {
          for (let b = 0; b < 3; b++) {
            const j = (br + a) * 9 + bc + b;
            if (j !== i && board[j] === v) {
              s.add(i);
              s.add(j);
            }
          }
        }
      }
    }
    return s;
  }, [board]);

  // Cells sharing the selected cell's value (standard "same number" highlight).
  const sameValue = useMemo(() => {
    if (selected === null) return new Set<number>();
    const v = board[selected];
    if (v === 0) return new Set<number>();
    return new Set(board.map((x, i) => (x === v ? i : -1)).filter((i) => i >= 0));
  }, [board, selected]);

  const place = (v: number) => {
    if (selected === null || !game) return;
    const i = selected;
    if (game.puzzle[i] !== 0) return;
    if (noteMode) {
      setNotes((ns) => {
        const n = ns.map((s) => new Set(s));
        if (n[i].has(v)) n[i].delete(v);
        else n[i].add(v);
        return n;
      });
      return;
    }
    const next = [...board];
    next[i] = v;
    setBoard(next);
    setNotes((ns) => {
      const n = ns.map((s) => new Set(s));
      n[i].clear();
      return n;
    });
    if (next.every((x, idx) => x === game.solution[idx])) setMessage("win");
  };

  const erase = () => {
    if (selected === null) return;
    const i = selected;
    if (game && game.puzzle[i] !== 0) return;
    setBoard((b) => {
      const n = [...b];
      n[i] = 0;
      return n;
    });
    setNotes((ns) => {
      const n = ns.map((s) => new Set(s));
      n[i].clear();
      return n;
    });
  };

  const check = () => {
    if (!game) return;
    const diff = new Set<number>();
    board.forEach((v, i) => {
      if (v !== 0 && v !== game.solution[i]) diff.add(i);
    });
    setWrong(diff);
    if (diff.size === 0 && board.every((v) => v !== 0)) setMessage("win");
    else if (diff.size === 0) setMessage("ok");
    else setMessage("error");
  };

  const solve = () => {
    if (!game) return;
    setBoard([...game.solution]);
    setNotes(Array.from({ length: 81 }, () => new Set<number>()));
    setMessage("win");
  };

  const hint = () => {
    if (!game || message === "win") return;
    const candidates: number[] = [];
    board.forEach((v, i) => {
      if (v !== game.solution[i]) candidates.push(i);
    });
    if (candidates.length === 0) return;
    const i = candidates[Math.floor(Math.random() * candidates.length)];
    setBoard((b) => {
      const n = [...b];
      n[i] = game.solution[i];
      return n;
    });
    setNotes((ns) => {
      const n = ns.map((s) => new Set(s));
      n[i].clear();
      return n;
    });
  };

  const cellClass = (i: number) => {
    const c = i % 9;
    const r = Math.floor(i / 9);
    const edges =
      (c === 2 || c === 5 ? " border-r-2 border-r-[var(--ink-dim)]" : "") +
      (r === 2 || r === 5 ? " border-b-2 border-b-[var(--ink-dim)]" : "");
    const bg = wrong.has(i)
      ? " bg-[var(--danger)]/15"
      : conflicts.has(i)
        ? " bg-[var(--danger)]/10"
        : selected === i
          ? " bg-[var(--gold)]/25"
          : sameValue.has(i)
            ? " bg-[var(--gold)]/10"
            : " bg-[var(--ground-raised)]";
    const text =
      game && game.puzzle[i] !== 0
        ? " font-semibold text-[var(--ink)]"
        : conflicts.has(i) || wrong.has(i)
          ? " text-[var(--danger)]"
          : " text-[var(--gold)]";
    return `flex aspect-square items-center justify-center font-mono-ui text-sm transition sm:text-base ${edges}${bg}${text}`;
  };

  return (
    <ToolShell
      title="Sudoku"
      khmerTitle="ល្បែងស៊ូដូគូ"
      description="Play unlimited Sudoku puzzles generated fresh from a backtracking solver, in three difficulties."
      descriptionKm="លេងល្បែងស៊ូដូគូគ្មានកំណត់ បង្កើតថ្មីពីក្បួនដោះស្រាយ Backtracking មាន ៣ កម្រិត។"
    >
      <Row>
        <Field label={t("Difficulty", "កម្រិត")}>
          <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
            <option value="easy">{t("Easy", "ងាយស្រួល")}</option>
            <option value="medium">{t("Medium", "មធ្យម")}</option>
            <option value="hard">{t("Hard", "ពិបាក")}</option>
          </Select>
        </Field>
        <Field label={t("Input mode", "របៀបបញ្ចូល")}>
          <Select value={noteMode ? "note" : "value"} onChange={(e) => setNoteMode(e.target.value === "note")}>
            <option value="value">{t("Numbers", "លេខ")}</option>
            <option value="note">{t("Pencil notes", "កំណត់ចំណាំខ្មៅដៃ")}</option>
          </Select>
        </Field>
      </Row>

      <div className="mx-auto w-full max-w-md">
        <div className="grid grid-cols-9 gap-px overflow-hidden rounded-lg border-2 border-[var(--ink-dim)] bg-[var(--ground-line)]">
          {board.map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={cellClass(i)}
              aria-label={t("Cell", "ក្រឡា") + ` ${Math.floor(i / 9) + 1}-${(i % 9) + 1}`}
            >
              {v !== 0 ? (
                v
              ) : notes[i].size > 0 ? (
                <span className="grid grid-cols-3 gap-px p-0.5 text-[8px] leading-none">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <span key={n} className={notes[i].has(n) ? "text-[var(--ink-dim)]" : "text-transparent"}>
                      {n}
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="font-mono-ui text-[var(--ink)]">
            {t("Time", "ម៉ោង")}: {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
          </div>
          {message === "win" && <div className="font-medium text-[var(--gold)]">{t("Solved — congratulations!", "បានដោះស្រាយ — សូមអបអរសាទរ!")}</div>}
          {message === "error" && <div className="text-[var(--danger)]">{t("Some filled cells are incorrect.", "មានក្រឡាខ្លះមិនត្រឹមត្រូវ។")}</div>}
          {message === "ok" && <div className="text-[var(--gold)]">{t("No mistakes so far.", "មិនទាន់មានកំហុសទេ។")}</div>}
        </div>

        <div className="mt-3 grid grid-cols-9 gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => place(n)}
              className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] py-2 font-mono-ui text-sm text-[var(--ink)] transition hover:border-[var(--gold-dim)]"
            >
              {n}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={check}>{t("Check", "ពិនិត្យ")}</Button>
          <Button onClick={hint} className="!bg-[var(--ground-raised)] !text-[var(--ink)]">{t("Hint", "ជំនួយ")}</Button>
          <Button onClick={solve} className="!bg-[var(--ground-raised)] !text-[var(--ink)]">{t("Solve", "ដោះស្រាយ")}</Button>
          <Button onClick={erase} className="!bg-[var(--ground-raised)] !text-[var(--ink)]">{t("Erase", "លុប")}</Button>
        </div>
      </div>
    </ToolShell>
  );
}
