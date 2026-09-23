// Pure helpers for the Khmer classroom/puzzle tools (cloze exercises, cluster
// word-search grids, acrostic lookups, keyboard passphrases). No imports, so
// tests/khmer-learning.test.mjs can run them directly under Node. Callers pass
// in already-segmented tokens/clusters and a random source.

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
