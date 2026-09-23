// Pure helpers for the Khmer classroom/puzzle tools (cloze exercises, cluster
// word-search grids, keyboard passphrases, word games, quizzes, and reading
// pace). No imports, so tests/khmer-devkit.test.mjs and tests/khmer-everyday.test.mjs
// can run them directly under Node. Callers pass in already-segmented
// tokens/clusters and a random source.

export type Rand = () => number;

// ---------------------------------------------------------------------------
// Cloze (fill-in-the-blank)
// ---------------------------------------------------------------------------

export type ClozeMode = "nth" | "random";

/**
 * Choose which candidate tokens become blanks. `candidates` are token indexes
 * eligible for blanking (in text order). "nth" blanks every `n`th candidate
 * (starting from the `n`th, so the opening words stay as context); "random"
 * blanks about `percent`% of candidates. Returns sorted token indexes.
 */
export function pickClozeBlanks(candidates: number[], mode: ClozeMode, n: number, percent: number, rand: Rand): number[] {
  if (candidates.length === 0) return [];
  if (mode === "nth") {
    const step = Math.max(2, Math.floor(n) || 2);
    return candidates.filter((_, i) => (i + 1) % step === 0);
  }
  const pct = Math.min(100, Math.max(0, percent));
  const want = Math.max(1, Math.round((candidates.length * pct) / 100));
  return shuffle(candidates, rand).slice(0, Math.min(want, candidates.length)).sort((a, b) => a - b);
}

/** Fisher–Yates shuffle (copy). */
export function shuffle<T>(items: T[], rand: Rand): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Word search (one grid cell = one Khmer orthographic cluster)
// ---------------------------------------------------------------------------

export type Direction = [dr: number, dc: number];
export const DIR_RIGHT: Direction = [0, 1];
export const DIR_DOWN: Direction = [1, 0];
export const DIR_DIAGONAL: Direction = [1, 1];

export interface PlacedWord {
  word: string;
  cells: [number, number][];
}

export interface WordSearchGrid {
  size: number;
  cells: string[][];
  placed: PlacedWord[];
  skipped: string[];
}

/**
 * Place each word (given as its cluster list) into a size×size grid, reading
 * only in the allowed directions, then fill blanks from `fillPool`. Words that
 * do not fit after many random attempts are reported in `skipped`.
 */
export function buildWordSearch(words: { word: string; clusters: string[] }[], size: number, directions: Direction[], fillPool: string[], rand: Rand): WordSearchGrid {
  const n = Math.max(4, Math.min(20, Math.floor(size)));
  const grid: (string | null)[][] = Array.from({ length: n }, () => Array<string | null>(n).fill(null));
  const placed: PlacedWord[] = [];
  const skipped: string[] = [];
  const dirs = directions.length ? directions : [DIR_RIGHT];
  // Longest first gives the best packing.
  const order = words.slice().sort((a, b) => b.clusters.length - a.clusters.length);

  for (const { word, clusters } of order) {
    const len = clusters.length;
    let done = false;
    if (len > 0 && len <= n) {
      for (let attempt = 0; attempt < 300 && !done; attempt++) {
        const [dr, dc] = dirs[Math.floor(rand() * dirs.length)];
        const maxR = n - 1 - dr * (len - 1);
        const maxC = n - 1 - dc * (len - 1);
        if (maxR < 0 || maxC < 0) continue;
        const r0 = Math.floor(rand() * (maxR + 1));
        const c0 = Math.floor(rand() * (maxC + 1));
        let fits = true;
        for (let k = 0; k < len; k++) {
          const cur = grid[r0 + dr * k][c0 + dc * k];
          if (cur !== null && cur !== clusters[k]) { fits = false; break; }
        }
        if (!fits) continue;
        const cells: [number, number][] = [];
        for (let k = 0; k < len; k++) {
          grid[r0 + dr * k][c0 + dc * k] = clusters[k];
          cells.push([r0 + dr * k, c0 + dc * k]);
        }
        placed.push({ word, cells });
        done = true;
      }
    }
    if (!done) skipped.push(word);
  }

  const pool = fillPool.length ? fillPool : ["ក"];
  const cells = grid.map((row) => row.map((c) => c ?? pool[Math.floor(rand() * pool.length)]));
  return { size: n, cells, placed, skipped };
}

// ---------------------------------------------------------------------------
// Passphrase (cryptographically random word choice)
// ---------------------------------------------------------------------------

/** Unbiased integer in [0, max) from a crypto-strength source of 32-bit words. */
export function uniformIndex(max: number, next32: () => number): number {
  if (max <= 0) throw new RangeError("max must be positive");
  const limit = Math.floor(0x100000000 / max) * max; // reject the biased tail
  for (;;) {
    const x = next32() >>> 0;
    if (x < limit) return x % max;
  }
}

/** Entropy in bits of `count` independent uniform picks from `pool` items. */
export function passphraseBits(pool: number, count: number): number {
  if (pool <= 1 || count <= 0) return 0;
  return count * Math.log2(pool);
}

// ---------------------------------------------------------------------------
// Wordle-style scoring over orthographic clusters
// ---------------------------------------------------------------------------

/** "hit" = right cluster, right place; "near" = in the word elsewhere; "base" = same first letter as the answer's cluster here; "miss" = none. */
export type ClusterScore = "hit" | "near" | "base" | "miss";

/**
 * Score a guess against the answer, cluster by cluster, using the standard
 * Wordle rules for repeated tiles: exact matches are claimed first, then
 * "near" matches consume the remaining answer clusters left to right. As a
 * Khmer-specific hint, a cluster that is otherwise a miss but starts with the
 * same base letter as the answer's cluster in that position scores "base".
 */
export function scoreGuess(guess: string[], answer: string[]): ClusterScore[] {
  const result: ClusterScore[] = guess.map(() => "miss");
  const remaining = new Map<string, number>();
  guess.forEach((g, i) => {
    if (g === answer[i]) result[i] = "hit";
    else if (answer[i] !== undefined) remaining.set(answer[i], (remaining.get(answer[i]) ?? 0) + 1);
  });
  // Answer clusters beyond the guess length still count for "near".
  for (let i = guess.length; i < answer.length; i++) remaining.set(answer[i], (remaining.get(answer[i]) ?? 0) + 1);
  guess.forEach((g, i) => {
    if (result[i] === "hit") return;
    const left = remaining.get(g) ?? 0;
    if (left > 0) {
      result[i] = "near";
      remaining.set(g, left - 1);
    } else if (answer[i] && g[0] === answer[i][0]) {
      result[i] = "base";
    }
  });
  return result;
}

// ---------------------------------------------------------------------------
// Word chain
// ---------------------------------------------------------------------------

export type ChainRule = "cluster" | "letter";

/** The key the next word must start with: the previous word's last cluster, or its first letter. */
export function chainKey(clusters: string[], rule: ChainRule): string {
  const last = clusters[clusters.length - 1] ?? "";
  return rule === "cluster" ? last : last.slice(0, 1);
}

/** Does a word (as clusters) continue the chain from the previous word? */
export function continuesChain(prev: string[], next: string[], rule: ChainRule): boolean {
  if (prev.length === 0 || next.length === 0) return false;
  const key = chainKey(prev, rule);
  return rule === "cluster" ? next[0] === key : next[0].startsWith(key);
}

// ---------------------------------------------------------------------------
// Multiple-choice helpers
// ---------------------------------------------------------------------------

/**
 * Build `n` shuffled options: the correct one plus distinct distractors drawn
 * from `pool` (never equal to the correct option). Returns fewer than `n` if
 * the pool is too small.
 */
export function buildOptions<T>(correct: T, pool: T[], n: number, rand: Rand, key: (t: T) => string = String): T[] {
  const seen = new Set([key(correct)]);
  const picks: T[] = [correct];
  for (const cand of shuffle(pool, rand)) {
    if (picks.length >= n) break;
    const k = key(cand);
    if (seen.has(k)) continue;
    seen.add(k);
    picks.push(cand);
  }
  return shuffle(picks, rand);
}

/**
 * Plausible wrong numbers for a number quiz: swap two digits, change one digit,
 * or shift by a place value — all different from `n` and non-negative.
 */
export function numberDistractors(n: number, count: number, rand: Rand): number[] {
  const out = new Set<number>();
  const digits = String(n).split("");
  let guard = 0;
  while (out.size < count && guard++ < 200) {
    const kind = Math.floor(rand() * 3);
    let cand = n;
    if (kind === 0 && digits.length > 1) {
      const d = digits.slice();
      const i = Math.floor(rand() * d.length);
      const j = Math.floor(rand() * d.length);
      [d[i], d[j]] = [d[j], d[i]];
      if (d[0] !== "0") cand = Number(d.join(""));
    } else if (kind === 1) {
      const d = digits.slice();
      const i = Math.floor(rand() * d.length);
      const nd = String((Number(d[i]) + 1 + Math.floor(rand() * 9)) % 10);
      if (!(i === 0 && nd === "0" && d.length > 1)) d[i] = nd;
      cand = Number(d.join(""));
    } else {
      const place = 10 ** Math.floor(rand() * digits.length);
      cand = rand() < 0.5 ? n + place : n - place;
    }
    if (cand !== n && cand >= 0 && Number.isInteger(cand)) out.add(cand);
  }
  return [...out];
}

// ---------------------------------------------------------------------------
// Reading speed
// ---------------------------------------------------------------------------

/** Units per minute, or 0 when the elapsed time is not positive. */
export function perMinute(units: number, elapsedMs: number): number {
  if (!(elapsedMs > 0) || units <= 0) return 0;
  return units / (elapsedMs / 60000);
}

/** Milliseconds each word should stay highlighted at `wpm` words per minute. */
export function msPerWord(wpm: number): number {
  const w = Math.min(1000, Math.max(10, wpm || 0));
  return 60000 / w;
}
