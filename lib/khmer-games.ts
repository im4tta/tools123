// Pure engines behind the Khmer learning games added in the mobile/robustness round: crossword
// layout, cluster word ladders, Leitner spaced repetition, alphabet order, syllable composition,
// keyboard row drills and number bingo. No React or browser APIs here so the logic is unit
// tested in tests/khmer-games.test.mjs. Randomness is always injected (`rand`) for testability.

export type Rand = () => number;

// ---------------------------------------------------------------- crossword

export interface CrosswordEntry { answer: string; clusters: string[]; clue: string }
export interface CrosswordPlacement extends CrosswordEntry { row: number; col: number; across: boolean; number: number }
export interface Crossword { rows: number; cols: number; grid: (string | null)[][]; placements: CrosswordPlacement[]; skipped: CrosswordEntry[] }

type Cell = string | null;

function canPlace(grid: Cell[][], clusters: string[], row: number, col: number, across: boolean, size: number): number {
  const dr = across ? 0 : 1, dc = across ? 1 : 0;
  const endR = row + dr * (clusters.length - 1), endC = col + dc * (clusters.length - 1);
  if (row < 0 || col < 0 || endR >= size || endC >= size) return -1;
  // The cells just before and after the word must be empty so words do not run together.
  const beforeR = row - dr, beforeC = col - dc, afterR = endR + dr, afterC = endC + dc;
  if (beforeR >= 0 && beforeC >= 0 && grid[beforeR][beforeC] !== null) return -1;
  if (afterR < size && afterC < size && grid[afterR]?.[afterC] != null) return -1;
  let crossings = 0;
  for (let i = 0; i < clusters.length; i++) {
    const r = row + dr * i, c = col + dc * i;
    const existing = grid[r][c];
    if (existing !== null) {
      if (existing !== clusters[i]) return -1;
      crossings++;
      continue;
    }
    // A new cell must not touch parallel neighbours (that would form unintended words).
    const n1 = across ? grid[r - 1]?.[c] : grid[r]?.[c - 1];
    const n2 = across ? grid[r + 1]?.[c] : grid[r]?.[c + 1];
    if ((n1 ?? null) !== null || (n2 ?? null) !== null) return -1;
  }
  return crossings;
}

/**
 * Greedy crossword layout on a cluster grid: the longest word goes in the middle, then each
 * word is placed where it crosses the most existing letters (ties broken by `rand`); with
 * `keepOrder` the given order is used instead of longest-first; `maxWords` stops early. Words that
 * never find a crossing are reported in `skipped`. The grid is cropped to its used area.
 */
export interface CrosswordOptions { keepOrder?: boolean; maxWords?: number }

export function buildCrossword(entries: CrosswordEntry[], size: number, rand: Rand, { keepOrder = false, maxWords = Infinity }: CrosswordOptions = {}): Crossword {
  const usable = entries.filter((e) => e.clusters.length >= 2 && e.clusters.length <= size);
  const seen = new Set<string>();
  const unique = usable.filter((e) => (seen.has(e.answer) ? false : (seen.add(e.answer), true)));
  const ordered = keepOrder ? unique : [...unique].sort((a, b) => b.clusters.length - a.clusters.length || rand() - 0.5);
  const grid: Cell[][] = Array.from({ length: size }, () => Array<Cell>(size).fill(null));
  const placed: Omit<CrosswordPlacement, "number">[] = [];
  const skipped: CrosswordEntry[] = [...entries.filter((e) => !usable.includes(e))];

  const write = (e: CrosswordEntry, row: number, col: number, across: boolean) => {
    e.clusters.forEach((cl, i) => { grid[row + (across ? 0 : i)][col + (across ? i : 0)] = cl; });
    placed.push({ ...e, row, col, across });
  };

  const bestSpot = (entry: CrosswordEntry) => {
    let best: { row: number; col: number; across: boolean; score: number } | null = null;
    for (const p of placed) {
      for (let i = 0; i < p.clusters.length; i++) {
        for (let j = 0; j < entry.clusters.length; j++) {
          if (p.clusters[i] !== entry.clusters[j]) continue;
          const across = !p.across;
          const crossR = p.row + (p.across ? 0 : i), crossC = p.col + (p.across ? i : 0);
          const row = across ? crossR : crossR - j, col = across ? crossC - j : crossC;
          const crossings = canPlace(grid, entry.clusters, row, col, across, size);
          if (crossings < 1) continue;
          const score = crossings + rand() * 0.5;
          if (!best || score > best.score) best = { row, col, across, score };
        }
      }
    }
    return best;
  };

  // Words that cannot cross anything yet are retried after each pass, since later words may
  // give them a letter to hang on.
  let pending = ordered;
  if (pending.length) {
    const first = pending[0];
    write(first, Math.floor(size / 2), Math.floor((size - first.clusters.length) / 2), true);
    pending = pending.slice(1);
  }
  for (let progress = true; progress && pending.length && placed.length < maxWords; ) {
    progress = false;
    const stillPending: CrosswordEntry[] = [];
    for (const entry of pending) {
      const spot = placed.length < maxWords ? bestSpot(entry) : null;
      if (spot) { write(entry, spot.row, spot.col, spot.across); progress = true; }
      else stillPending.push(entry);
    }
    pending = stillPending;
  }
  skipped.push(...pending);

  if (placed.length === 0) return { rows: 0, cols: 0, grid: [], placements: [], skipped };
  let minR = size, minC = size, maxR = 0, maxC = 0;
  for (const p of placed) {
    minR = Math.min(minR, p.row); minC = Math.min(minC, p.col);
    maxR = Math.max(maxR, p.row + (p.across ? 0 : p.clusters.length - 1));
    maxC = Math.max(maxC, p.col + (p.across ? p.clusters.length - 1 : 0));
  }
  const cropped = grid.slice(minR, maxR + 1).map((line) => line.slice(minC, maxC + 1));
  // Number start cells in reading order (top-to-bottom, left-to-right), shared by across/down.
  const shifted = placed.map((p) => ({ ...p, row: p.row - minR, col: p.col - minC }));
  const starts = [...new Set(shifted.map((p) => p.row * 1000 + p.col))].sort((a, b) => a - b);
  const placements = shifted
    .map((p) => ({ ...p, number: starts.indexOf(p.row * 1000 + p.col) + 1 }))
    .sort((a, b) => a.number - b.number || Number(b.across) - Number(a.across));
  return { rows: cropped.length, cols: cropped[0].length, grid: cropped, placements, skipped };
}

// ---------------------------------------------------------------- word ladder

/** Maps each word (as clusters) to "wildcard" buckets so one-cluster neighbours are found fast. */
export interface LadderIndex { words: Map<string, string[]>; buckets: Map<string, string[]> }

const bucketKey = (clusters: string[], i: number) => `${clusters.length}:${clusters.map((c, j) => (j === i ? "*" : c)).join("|")}`;

export function buildLadderIndex(words: string[][]): LadderIndex {
  const index: LadderIndex = { words: new Map(), buckets: new Map() };
  for (const clusters of words) {
    const word = clusters.join("");
    if (index.words.has(word)) continue;
    index.words.set(word, clusters);
    clusters.forEach((_, i) => {
      const key = bucketKey(clusters, i);
      const list = index.buckets.get(key);
      if (list) list.push(word);
      else index.buckets.set(key, [word]);
    });
  }
  return index;
}

/** Runs `attempts` layouts with different random orders and keeps the one that places the most words. */
export function bestCrossword(entries: CrosswordEntry[], size: number, attempts: number, rand: Rand, maxWords = Infinity): Crossword {
  let best = buildCrossword(entries, size, rand, { maxWords });
  for (let i = 1; i < attempts; i++) {
    // Other attempts try a random word order instead of longest-first.
    const shuffled = entries.map((e) => ({ e, k: rand() })).sort((a, b) => a.k - b.k).map(({ e }) => e);
    const next = buildCrossword(shuffled, size, rand, { keepOrder: true, maxWords });
    if (next.placements.length > best.placements.length) best = next;
  }
  return best;
}

/** Dictionary words that differ from `word` in exactly one cluster position. */
export function ladderNeighbors(word: string, index: LadderIndex): string[] {
  const clusters = index.words.get(word);
  if (!clusters) return [];
  const out = new Set<string>();
  clusters.forEach((_, i) => { for (const w of index.buckets.get(bucketKey(clusters, i)) ?? []) if (w !== word) out.add(w); });
  return [...out];
}

/** True when a and b have the same cluster count and differ in exactly one cluster. */
export function isLadderStep(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
  return diff === 1;
}

/** Shortest ladder from start to end (inclusive) by breadth-first search, or null if none. */
export function findLadder(start: string, end: string, index: LadderIndex): string[] | null {
  if (!index.words.has(start) || !index.words.has(end)) return null;
  if (start === end) return [start];
  const prev = new Map<string, string>([[start, ""]]);
  let frontier = [start];
  while (frontier.length) {
    const nextFrontier: string[] = [];
    for (const word of frontier) {
      for (const n of ladderNeighbors(word, index)) {
        if (prev.has(n)) continue;
        prev.set(n, word);
        if (n === end) {
          const path = [end];
          for (let w = word; w; w = prev.get(w) ?? "") path.unshift(w);
          return path;
        }
        nextFrontier.push(n);
      }
    }
    frontier = nextFrontier;
  }
  return null;
}

/** Picks a start/end pair whose shortest ladder has between minSteps and maxSteps steps. */
export function pickLadderPuzzle(index: LadderIndex, clusterCount: number, minSteps: number, maxSteps: number, rand: Rand, tries = 200): string[] | null {
  const pool = [...index.words.entries()].filter(([, c]) => c.length === clusterCount).map(([w]) => w);
  if (pool.length < 2) return null;
  for (let t = 0; t < tries; t++) {
    const start = pool[Math.floor(rand() * pool.length)];
    // Walk outward by BFS layers from start and take a word at the wanted distance.
    const dist = new Map<string, number>([[start, 0]]);
    let frontier = [start];
    for (let d = 1; d <= maxSteps && frontier.length; d++) {
      const next: string[] = [];
      for (const w of frontier) for (const n of ladderNeighbors(w, index)) if (!dist.has(n)) { dist.set(n, d); next.push(n); }
      frontier = next;
    }
    const candidates = [...dist.entries()].filter(([, d]) => d >= minSteps && d <= maxSteps).map(([w]) => w);
    if (candidates.length) {
      const end = candidates[Math.floor(rand() * candidates.length)];
      return findLadder(start, end, index);
    }
  }
  return null;
}

// ---------------------------------------------------------------- Leitner spaced repetition

/** Days until a card in each box is due again. This is this app's schedule (doubling), not a standard. */
export const LEITNER_INTERVAL_DAYS = [0, 1, 2, 4, 8, 16] as const;
export const LEITNER_TOP_BOX = LEITNER_INTERVAL_DAYS.length - 1;
const DAY_MS = 86_400_000;

export interface LeitnerCard { box: number; due: number }
export type LeitnerState = Record<string, LeitnerCard>;

/** Correct answers move a card up one box; a miss sends it back to box 1, due immediately. */
export function reviewCard(state: LeitnerState, id: string, correct: boolean, now: number): LeitnerState {
  const current = state[id]?.box ?? 0;
  const box = correct ? Math.min(LEITNER_TOP_BOX, current + 1) : 1;
  const due = correct ? now + LEITNER_INTERVAL_DAYS[box] * DAY_MS : now;
  return { ...state, [id]: { box, due } };
}

/** Cards due now: seen cards whose due time has passed (lowest box first), then up to `newLimit` unseen cards. */
export function dueCards(state: LeitnerState, ids: string[], now: number, newLimit: number): string[] {
  const seen = ids.filter((id) => state[id] && state[id].due <= now).sort((a, b) => state[a].box - state[b].box || state[a].due - state[b].due);
  const fresh = ids.filter((id) => !state[id]).slice(0, Math.max(0, newLimit));
  return [...seen, ...fresh];
}

/** Number of cards per box (index 0 = never seen). */
export function boxCounts(state: LeitnerState, ids: string[]): number[] {
  const counts = Array(LEITNER_TOP_BOX + 1).fill(0);
  for (const id of ids) counts[state[id]?.box ?? 0]++;
  return counts;
}

// ---------------------------------------------------------------- alphabet order

/** Index of the first letter that breaks the given order, or -1 when the sequence is in order. */
export function firstOrderError(sequence: string[], alphabet: string[]): number {
  for (let i = 1; i < sequence.length; i++) if (alphabet.indexOf(sequence[i]) < alphabet.indexOf(sequence[i - 1])) return i;
  return -1;
}

export function sortByAlphabet(letters: string[], alphabet: string[]): string[] {
  return [...letters].sort((a, b) => alphabet.indexOf(a) - alphabet.indexOf(b));
}

/** `count` distinct letters drawn at random from the alphabet. */
export function sampleLetters(alphabet: string[], count: number, rand: Rand): string[] {
  const pool = [...alphabet];
  const out: string[] = [];
  while (out.length < Math.min(count, alphabet.length)) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return out;
}

// ---------------------------------------------------------------- syllable builder

export const COENG = "្";

export interface SyllableParts { consonant: string; subscripts?: string[]; shifter?: string; vowel?: string; sign?: string }

/**
 * Joins the parts in Unicode's stored order for Khmer: base consonant, each subscript as
 * COENG + consonant, register shifter (៉ / ៊), dependent vowel, then a final sign (ំ ះ ់ …).
 * Typing order does not matter to the reader, but storing them in this order keeps search,
 * sorting and fonts working.
 */
export function composeSyllable({ consonant, subscripts = [], shifter = "", vowel = "", sign = "" }: SyllableParts): string {
  if (!consonant) return "";
  return consonant + subscripts.filter(Boolean).map((s) => COENG + s).join("") + shifter + vowel + sign;
}

/** Code points as U+XXXX labels, for showing exactly what was built. */
export function codePoints(text: string): string[] {
  return [...text].map((ch) => `U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`);
}

// ---------------------------------------------------------------- keyboard drills

/** Space-separated practice groups built only from the given characters. */
export function buildDrill(chars: string[], groups: number, groupSize: number, rand: Rand): string {
  const pool = chars.filter(Boolean);
  if (!pool.length || groups < 1 || groupSize < 1) return "";
  return Array.from({ length: groups }, () => Array.from({ length: groupSize }, () => pool[Math.floor(rand() * pool.length)]).join("")).join(" ");
}

/** Per-code-point comparison of typed text against the target. */
export function compareTyped(target: string, typed: string): { correct: number; errors: number; done: boolean; states: ("ok" | "bad" | "todo")[] } {
  const t = [...target], y = [...typed];
  const states = t.map((ch, i) => (i >= y.length ? "todo" : y[i] === ch ? "ok" : "bad") as "ok" | "bad" | "todo");
  const correct = states.filter((s) => s === "ok").length;
  const errors = states.filter((s) => s === "bad").length + Math.max(0, y.length - t.length);
  return { correct, errors, done: y.length >= t.length, states };
}

// ---------------------------------------------------------------- bingo

/** Column ranges of the common 75-ball game: 1–15, 16–30, 31–45, 46–60, 61–75. */
export const BINGO_COLUMNS: [number, number][] = [[1, 15], [16, 30], [31, 45], [46, 60], [61, 75]];
export const BINGO_FREE = 0;

/** A 5×5 card as rows; the centre cell is BINGO_FREE. */
export function makeBingoCard(rand: Rand): number[][] {
  const cols = BINGO_COLUMNS.map(([lo, hi]) => {
    const pool = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
    return Array.from({ length: 5 }, () => pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  });
  cols[2][2] = BINGO_FREE;
  return Array.from({ length: 5 }, (_, r) => cols.map((col) => col[r]));
}

/** Draws a number not yet called, or null when all `max` numbers are out. */
export function drawBingoNumber(called: number[], max: number, rand: Rand): number | null {
  const taken = new Set(called);
  const left = Array.from({ length: max }, (_, i) => i + 1).filter((n) => !taken.has(n));
  return left.length ? left[Math.floor(rand() * left.length)] : null;
}

/** Completed lines (rows, columns, diagonals) on a card given the called numbers. */
export function bingoLines(card: number[][], called: number[]): string[] {
  const hit = (n: number) => n === BINGO_FREE || called.includes(n);
  const lines: string[] = [];
  for (let i = 0; i < 5; i++) {
    if (card[i].every(hit)) lines.push(`row-${i}`);
    if (card.every((row) => hit(row[i]))) lines.push(`col-${i}`);
  }
  if (card.every((row, i) => hit(row[i]))) lines.push("diag-0");
  if (card.every((row, i) => hit(row[4 - i]))) lines.push("diag-1");
  return lines;
}
