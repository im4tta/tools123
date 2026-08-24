export interface WordSearchEntry {
  text: string;
  clue: string;
}

export interface WordSearchPlacement {
  text: string;
  clue: string;
  graphemes: string[];
  row: number;
  col: number;
  dir: [number, number];
}

export interface WordSearchGrid {
  size: number;
  cells: string[][];
  placements: WordSearchPlacement[];
  skipped: WordSearchEntry[];
}

const DIRECTIONS: [number, number][] = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

const FILLERS = [
  "ក", "ខ", "គ", "ឃ", "ង", "ច", "ឆ", "ជ", "ញ", "ត",
  "ថ", "ទ", "ធ", "ន", "ប", "ផ", "ព", "ភ", "ម", "យ",
  "រ", "ល", "វ", "ស", "ហ", "អ",
];

function graphemes(word: string): string[] {
  const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return Array.from(seg.segment(word), (s) => s.segment);
}

export function generateWordSearch(
  entries: WordSearchEntry[],
  rng: () => number = Math.random,
): WordSearchGrid {
  const cleaned = entries
    .map((e) => ({ text: e.text.trim(), clue: e.clue.trim() }))
    .filter((e) => e.text.length > 0)
    .sort((a, b) => graphemes(b.text).length - graphemes(a.text).length);

  const wordData = cleaned.map((e) => ({ entry: e, g: graphemes(e.text) }));
  const longest = Math.max(0, ...wordData.map((w) => w.g.length));
  const totalLetters = wordData.reduce((sum, w) => sum + w.g.length, 0);

  const size = Math.max(
    longest + 2,
    Math.min(22, Math.ceil(Math.sqrt(totalLetters * 2.2)) || 8),
    8,
  );

  const cells: (string | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  );

  function canPlace(g: string[], row: number, col: number, dir: [number, number]) {
    for (let i = 0; i < g.length; i++) {
      const r = row + dir[0] * i;
      const c = col + dir[1] * i;
      if (r < 0 || r >= size || c < 0 || c >= size) return false;
      const existing = cells[r][c];
      if (existing !== null && existing !== g[i]) return false;
    }
    return true;
  }

  const placements: WordSearchPlacement[] = [];
  const skipped: WordSearchEntry[] = [];

  for (const { entry, g } of wordData) {
    let placed = false;
    for (let attempt = 0; attempt < 500 && !placed; attempt++) {
      const dir = DIRECTIONS[Math.floor(rng() * DIRECTIONS.length)];
      const row = Math.floor(rng() * size);
      const col = Math.floor(rng() * size);
      if (!canPlace(g, row, col, dir)) continue;

      for (let i = 0; i < g.length; i++) {
        cells[row + dir[0] * i][col + dir[1] * i] = g[i];
      }
      placements.push({ text: entry.text, clue: entry.clue, graphemes: g, row, col, dir });
      placed = true;
    }
    if (!placed) skipped.push(entry);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (cells[r][c] === null) {
        cells[r][c] = FILLERS[Math.floor(rng() * FILLERS.length)];
      }
    }
  }

  return {
    size,
    cells: cells as string[][],
    placements,
    skipped,
  };
}
