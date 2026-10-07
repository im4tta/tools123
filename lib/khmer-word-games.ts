// Pure engines for the second batch of Khmer games: Spelling Bee, Hangman, Word Grid (Boggle-style),
// Matching Pairs, Clock Reading, and a Khmer-numeral Math Drill. No React or browser APIs, so the
// logic is unit tested in tests/khmer-word-games.test.mjs. Randomness is always injected (`rand`).

export type Rand = () => number;

const pick = <T,>(items: T[], rand: Rand): T => items[Math.floor(rand() * items.length)];

function shuffled<T>(items: T[], rand: Rand): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------------------------------------------------------------- letters

/** Khmer consonants and independent vowels (U+1780–U+17B3): the "letters" a player picks. */
export function isKhmerLetter(ch: string): boolean {
  return ch >= "ក" && ch <= "ឳ";
}

/** Distinct letters in a word, in first-seen order (subscript consonants count as letters). */
export function letterSet(word: string): string[] {
  return [...new Set([...word].filter(isKhmerLetter))];
}

// ---------------------------------------------------------------- spelling bee

export interface BeePuzzle { letters: string[]; center: string }

/** Words that use only hive letters, include the centre letter and have at least two letters. */
export function beeAnswers(words: string[], puzzle: BeePuzzle): string[] {
  const hive = new Set(puzzle.letters);
  return words.filter((w) => {
    const ls = letterSet(w);
    return ls.length >= 2 && ls.includes(puzzle.center) && ls.every((l) => hive.has(l));
  });
}

export function isPangram(word: string, puzzle: BeePuzzle): boolean {
  const ls = new Set(letterSet(word));
  return puzzle.letters.every((l) => ls.has(l));
}

/** This app's scoring: one point per letter used (with repeats), plus 7 for a word using every hive letter. */
export function beeScore(word: string, puzzle: BeePuzzle): number {
  return [...word].filter(isKhmerLetter).length + (isPangram(word, puzzle) ? 7 : 0);
}

/**
 * A random puzzle: the hive is the letter set of a dictionary word with `sizes` distinct letters
 * (so at least one word uses them all), and the centre is chosen so the answer count falls
 * within [minAnswers, maxAnswers]. Returns null when the word list cannot produce one.
 */
export function pickBeePuzzle(words: string[], sizes: number[], minAnswers: number, maxAnswers: number, rand: Rand): BeePuzzle | null {
  const seeds = shuffled(words.filter((w) => sizes.includes(letterSet(w).length)), rand);
  for (const seed of seeds) {
    for (const center of shuffled(letterSet(seed), rand)) {
      const puzzle = { letters: letterSet(seed), center };
      const n = beeAnswers(words, puzzle).length;
      if (n >= minAnswers && n <= maxAnswers) return { letters: shuffled(puzzle.letters.filter((l) => l !== center), rand), center };
    }
  }
  return null;
}

// ---------------------------------------------------------------- hangman

/**
 * Clusters shown with the ones whose letters are all guessed revealed. Vowel signs and marks need
 * no guessing: they appear as soon as their cluster's letters are known.
 */
export function maskClusters(clusters: string[], guessed: Set<string>): { text: string; revealed: boolean }[] {
  return clusters.map((text) => ({ text, revealed: letterSet(text).every((l) => guessed.has(l)) }));
}

export function hangmanSolved(word: string, guessed: Set<string>): boolean {
  return letterSet(word).every((l) => guessed.has(l));
}

export function wrongGuesses(word: string, guessed: Iterable<string>): string[] {
  const ls = new Set(letterSet(word));
  return [...guessed].filter((g) => !ls.has(g));
}

// ---------------------------------------------------------------- word grid (Boggle-style)

/** Indices of the up-to-8 cells touching `index` on an n×n grid. */
export function gridNeighbors(index: number, n: number): number[] {
  const r = Math.floor(index / n), c = index % n;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && rr < n && cc >= 0 && cc < n) out.push(rr * n + cc);
  }
  return out;
}

/** True when each step moves to a touching cell and no cell is used twice. */
export function isValidPath(path: number[], n: number): boolean {
  if (new Set(path).size !== path.length) return false;
  return path.every((cell, i) => cell >= 0 && cell < n * n && (i === 0 || gridNeighbors(path[i - 1], n).includes(cell)));
}

/** Random self-avoiding path of `length` cells, or null if the walk gets stuck. */
function randomPath(length: number, n: number, rand: Rand, blocked: Set<number>): number[] | null {
  const starts = shuffled([...Array(n * n).keys()].filter((i) => !blocked.has(i)), rand);
  for (const start of starts.slice(0, 12)) {
    const path = [start];
    while (path.length < length) {
      const options = gridNeighbors(path.at(-1)!, n).filter((x) => !path.includes(x) && !blocked.has(x));
      if (!options.length) break;
      path.push(pick(options, rand));
    }
    if (path.length === length) return path;
  }
  return null;
}

/**
 * An n×n grid of clusters: a few dictionary words are laid along random touching paths (so the
 * grid always has answers), and the remaining cells are filled from `fillPool`.
 */
export function buildWordGrid(words: string[][], n: number, seedWords: number, fillPool: string[], rand: Rand): string[] {
  const grid: (string | null)[] = Array(n * n).fill(null);
  const used = new Set<number>();
  let placed = 0;
  for (const clusters of shuffled(words.filter((w) => w.length >= 2 && w.length <= n + 1), rand)) {
    if (placed >= seedWords) break;
    const path = randomPath(clusters.length, n, rand, used);
    if (!path) continue;
    path.forEach((cell, i) => { grid[cell] = clusters[i]; used.add(cell); });
    placed++;
  }
  return grid.map((cell) => cell ?? pick(fillPool, rand));
}

/** Every dictionary word (as clusters, 2+ long) that can be traced on the grid. */
export function solveWordGrid(grid: string[], n: number, words: string[][]): string[] {
  const prefixes = new Set<string>();
  const full = new Set<string>();
  for (const w of words) {
    if (w.length < 2) continue;
    for (let i = 1; i < w.length; i++) prefixes.add(w.slice(0, i).join("|"));
    full.add(w.join("|"));
  }
  const found = new Set<string>();
  const walk = (path: number[], key: string) => {
    if (path.length >= 2 && full.has(key)) found.add(key.split("|").join(""));
    if (!prefixes.has(key)) return;
    for (const next of gridNeighbors(path.at(-1)!, n)) {
      if (!path.includes(next)) walk([...path, next], `${key}|${grid[next]}`);
    }
  };
  grid.forEach((cell, i) => walk([i], cell));
  return [...found];
}

// ---------------------------------------------------------------- matching pairs

export interface PairCard { id: number; pairId: number; face: string; side: "a" | "b" }

/** Shuffled deck with two cards (side a and b) for each pair. */
export function buildPairDeck(pairs: [string, string][], rand: Rand): PairCard[] {
  const cards = pairs.flatMap(([a, b], pairId) => [
    { pairId, face: a, side: "a" as const },
    { pairId, face: b, side: "b" as const },
  ]);
  return shuffled(cards, rand).map((card, id) => ({ ...card, id }));
}

// ---------------------------------------------------------------- clock reading

export interface ClockTime { h24: number; m: number }

/** A random time on a `stepMinutes` grid (5 → :00, :05 … :55). */
export function randomClockTime(stepMinutes: number, rand: Rand): ClockTime {
  const steps = Math.floor(60 / stepMinutes);
  return { h24: Math.floor(rand() * 24), m: Math.floor(rand() * steps) * stepMinutes };
}

/** Plausible wrong answers: hour off by one, minute hand misread, or the day part changed. */
export function clockDistractors(time: ClockTime, stepMinutes: number, count: number, rand: Rand): ClockTime[] {
  const key = (t: ClockTime) => `${t.h24}:${t.m}`;
  const candidates: ClockTime[] = [
    { h24: (time.h24 + 1) % 24, m: time.m },
    { h24: (time.h24 + 23) % 24, m: time.m },
    { h24: (time.h24 + 12) % 24, m: time.m },
    { h24: time.h24, m: (time.m + 30) % 60 },
    { h24: time.h24, m: ((60 - time.m) % 60) },
    { h24: time.h24, m: (time.m + stepMinutes) % 60 },
    { h24: time.h24, m: (time.m + 60 - stepMinutes) % 60 },
  ];
  const seen = new Set([key(time)]);
  const out: ClockTime[] = [];
  for (const c of shuffled(candidates, rand)) {
    if (out.length >= count) break;
    if (seen.has(key(c))) continue;
    seen.add(key(c));
    out.push(c);
  }
  return out;
}

/** Hand angles in degrees clockwise from 12. */
export function handAngles({ h24, m }: ClockTime): { hour: number; minute: number } {
  return { hour: ((h24 % 12) + m / 60) * 30, minute: m * 6 };
}

// ---------------------------------------------------------------- math drill

export type MathOp = "+" | "-" | "×" | "÷";
export interface MathProblem { a: number; b: number; op: MathOp; answer: number }

/**
 * A problem with operands up to `max`. Subtraction never goes negative and division is always
 * exact (built from a product), so every answer is a whole number ≥ 0.
 */
export function makeMathProblem(op: MathOp, max: number, rand: Rand): MathProblem {
  const n = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
  const top = Math.max(1, Math.floor(max));
  if (op === "+") { const a = n(0, top), b = n(0, top); return { a, b, op, answer: a + b }; }
  if (op === "-") { const a = n(0, top), b = n(0, a); return { a, b, op, answer: a - b }; }
  if (op === "×") { const a = n(0, top), b = n(0, Math.min(top, 12)); return { a, b, op, answer: a * b }; }
  const b = n(1, Math.min(top, 12)), answer = n(0, top);
  return { a: b * answer, b, op, answer };
}

const KHMER_NUMERALS = "០១២៣៤៥៦៧៨៩";

/** Reads digits typed as Khmer (០–៩) or ASCII (0–9); null when there are none or anything else. */
export function parseMixedDigits(text: string): number | null {
  const ascii = text.trim().replace(/[០-៩]/g, (d) => String(KHMER_NUMERALS.indexOf(d)));
  return /^\d{1,9}$/.test(ascii) ? Number(ascii) : null;
}
