"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const COLS = 20;
const ROWS = 20;
type Pt = { x: number; y: number };
type Dir = "up" | "down" | "left" | "right";
type Status = "idle" | "playing" | "paused" | "over";

const DIRS: Record<Dir, Pt> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };

function initialSnake(): Pt[] {
  return [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
}

function randomFood(snake: Pt[]): Pt {
  for (;;) {
    const p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    if (!snake.some((s) => s.x === p.x && s.y === p.y)) return p;
  }
}

export default function Snake() {
  const { text: t } = useLanguage();
  const [snake, setSnake] = useState<Pt[]>(initialSnake);
  const [food, setFood] = useState<Pt>(() => randomFood(initialSnake()));
  const [status, setStatus] = useState<Status>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useToolState("snake:best", 0);

  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const currentDirRef = useRef<Dir>("right");
  const nextDirRef = useRef<Dir>("right");
  const scoreRef = useRef(score);
  const statusRef = useRef(status);

  useEffect(() => {
    snakeRef.current = snake;
    foodRef.current = food;
    scoreRef.current = score;
    statusRef.current = status;
  });

  useEffect(() => {
    if (status !== "playing") return;
    const speed = Math.max(70, 220 - score * 6);
    const id = window.setInterval(() => {
      currentDirRef.current = nextDirRef.current;
      const d = DIRS[currentDirRef.current];
      const s = snakeRef.current;
      const head = { x: s[0].x + d.x, y: s[0].y + d.y };
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS || s.some((p) => p.x === head.x && p.y === head.y)) {
        setStatus("over");
        setBest((b) => Math.max(b, scoreRef.current));
        return;
      }
      const f = foodRef.current;
      const ate = head.x === f.x && head.y === f.y;
      const next = [head, ...s];
      if (!ate) next.pop();
      snakeRef.current = next;
      setSnake(next);
      if (ate) {
        const ns = scoreRef.current + 1;
        scoreRef.current = ns;
        setScore(ns);
        setFood(randomFood(next));
      }
    }, speed);
    return () => window.clearInterval(id);
  }, [status, score, setBest]);

  const changeDir = useCallback((nd: Dir) => {
    if (statusRef.current !== "playing") return;
    if (OPPOSITE[nd] === currentDirRef.current) return; // no 180° reversal
    if (nd === nextDirRef.current) return; // no-op
    nextDirRef.current = nd;
  }, []);

  const togglePause = useCallback(() => {
    setStatus((s) => (s === "playing" ? "paused" : s === "paused" ? "playing" : s));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
        W: "up",
        S: "down",
        A: "left",
        D: "right",
      };
      const nd = map[e.key];
      if (nd) {
        e.preventDefault();
        changeDir(nd);
        return;
      }
      if (e.key === " " || e.key === "p" || e.key === "P") {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changeDir, togglePause]);

  const startGame = () => {
    const s = initialSnake();
    snakeRef.current = s;
    setSnake(s);
    setFood(randomFood(s));
    scoreRef.current = 0;
    setScore(0);
    currentDirRef.current = "right";
    nextDirRef.current = "right";
    setStatus("playing");
  };

  return (
    <ToolShell
      title="Snake"
      khmerTitle="ល្បែងពស់"
      description="Guide the snake to eat food and grow, without hitting the walls or yourself. Arrow keys or WASD to move."
      descriptionKm="ដឹកនាំពស់ឱ្យស៊ីអាហារ ហើយធំឡើង ដោយមិនបុកជញ្ជាំង ឬបុកខ្លួនឯង។ ប្រើប៊ូតុងព្រួញ ឬ WASD ដើម្បីផ្លាស់ទី។"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3 text-sm text-[var(--ink-dim)]">
          <span>
            {t("Score", "ពិន្ទុ")}: <b className="text-[var(--gold)]">{score}</b>
          </span>
          <span>
            {t("Best", "ល្អបំផុត")}: <b className="text-[var(--gold)]">{best}</b>
          </span>
          <span>
            {t("Speed", "ល្បឿន")}: <b className="text-[var(--ink)]">{Math.max(70, 220 - score * 6)}ms</b>
          </span>
        </div>
        <div className="flex gap-2">
          {status === "playing" || status === "paused" ? (
            <button
              type="button"
              onClick={togglePause}
              className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-sm text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
            >
              {status === "paused" ? t("Resume", "បន្ត") : t("Pause", "ផ្អាក")}
            </button>
          ) : (
            <Button type="button" onClick={startGame}>
              {status === "over" ? t("Play again", "លេងម្ដងទៀត") : t("Start", "ចាប់ផ្ដើម")}
            </Button>
          )}
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-md select-none overflow-hidden rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]">
        <div className="grid aspect-square w-full gap-px" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
          {Array.from({ length: ROWS * COLS }, (_, i) => {
            const x = i % COLS;
            const y = Math.floor(i / COLS);
            const isHead = snake[0].x === x && snake[0].y === y;
            const isBody = !isHead && snake.some((p) => p.x === x && p.y === y);
            const isFood = food.x === x && food.y === y;
            const cls = isHead
              ? "bg-[var(--gold)]"
              : isBody
                ? "bg-[var(--gold)]/40"
                : isFood
                  ? "bg-[var(--danger)]"
                  : "bg-[var(--ground-raised)]";
            return <div key={i} className={cls} />;
          })}
        </div>
        {status === "paused" && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--ground-raised)]/80 text-lg font-medium text-[var(--ink)]">
            {t("Paused — press Space", "ផ្អាក — ចុច Space ដើម្បីបន្ត")}
          </div>
        )}
        {status === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--ground-raised)]/90">
            <div className="font-display text-2xl font-semibold text-[var(--danger)]">{t("Game over!", "បញ្ចប់ល្បែង!")}</div>
            <div className="text-sm text-[var(--ink-dim)]">
              {t("Score", "ពិន្ទុ")}: {score}
            </div>
            <Button type="button" onClick={startGame}>
              {t("Play again", "លេងម្ដងទៀត")}
            </Button>
          </div>
        )}
        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--ground-raised)]/90">
            <div className="text-sm text-[var(--ink-dim)]">{t("Press Start to play", "ចុច ចាប់ផ្ដើម ដើម្បីលេង")}</div>
          </div>
        )}
      </div>

      <div className="mx-auto grid w-fit grid-cols-3 gap-1.5">
        <div />
        <button
          type="button"
          aria-label="Up"
          onClick={() => changeDir("up")}
          className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-[var(--ink)] active:bg-[var(--gold)]"
        >
          ▲
        </button>
        <div />
        <button
          type="button"
          aria-label="Left"
          onClick={() => changeDir("left")}
          className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-[var(--ink)] active:bg-[var(--gold)]"
        >
          ◀
        </button>
        <button
          type="button"
          aria-label="Down"
          onClick={() => changeDir("down")}
          className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-[var(--ink)] active:bg-[var(--gold)]"
        >
          ▼
        </button>
        <button
          type="button"
          aria-label="Right"
          onClick={() => changeDir("right")}
          className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-[var(--ink)] active:bg-[var(--gold)]"
        >
          ▶
        </button>
      </div>
    </ToolShell>
  );
}
