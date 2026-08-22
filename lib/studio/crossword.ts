export interface CrosswordEntry {
  text: string;
  clue: string;
}

export interface PlacedWord {
  text: string;
  clue: string;
  graphemes: string[];
  row: number;
  col: number;
  dir: "across" | "down";
  number: number;
}

export interface CrosswordGrid {
  width: number;
  height: number;
  cells: Map<string, string>; // "r,c" -> grapheme
  numbers: Map<string, number>; // "r,c" -> clue number
  words: PlacedWord[];
}

function graphemes(word: string): string[] {
  const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return Array.from(seg.segment(word), (s) => s.segment);
}

function key(r: number, c: number) {
  return `${r},${c}`;
}

interface RawPlacement {
  entry: CrosswordEntry;
  g: string[];
  row: number;
  col: number;
  dir: "across" | "down";
}

function canPlace(
  cellMap: Map<string, string>,
  g: string[],
  row: number,
  col: number,
  dir: "across" | "down",
): { ok: boolean; intersections: number } {
  let intersections = 0;

  // Buffer cell before the start and after the end must be empty.
  const beforeKey = dir === "across" ? key(row, col - 1) : key(row - 1, col);
  const afterKey =
    dir === "across" ? key(row, col + g.length) : key(row + g.length, col);
  if (cellMap.has(beforeKey) || cellMap.has(afterKey)) {
    return { ok: false, intersections: 0 };
  }

  for (let i = 0; i < g.length; i++) {
    const r = dir === "down" ? row + i : row;
    const c = dir === "across" ? col + i : col;
    const existing = cellMap.get(key(r, c));

    if (existing !== undefined) {
      if (existing !== g[i]) return { ok: false, intersections: 0 };
      intersections++;
    } else {
      // Perpendicular neighbours must be empty, or we'd create an
      // unintended adjacent word.
      if (dir === "across") {
        if (cellMap.has(key(r - 1, c)) || cellMap.has(key(r + 1, c))) {
          return { ok: false, intersections: 0 };
        }
      } else {
        if (cellMap.has(key(r, c - 1)) || cellMap.has(key(r, c + 1))) {
          return { ok: false, intersections: 0 };
        }
      }
    }
  }

  return { ok: true, intersections };
}

export function generateCrossword(entries: CrosswordEntry[]): CrosswordGrid {
  const cleaned = entries
    .map((e) => ({ text: e.text.trim(), clue: e.clue.trim() }))
    .filter((e) => e.text.length > 0)
    .sort((a, b) => graphemes(b.text).length - graphemes(a.text).length);

  const cellMap = new Map<string, string>();
  const raw: RawPlacement[] = [];

  for (const entry of cleaned) {
    const g = graphemes(entry.text);
    if (g.length === 0) continue;

    if (raw.length === 0) {
      // Seed word.
      for (let i = 0; i < g.length; i++) cellMap.set(key(0, i), g[i]);
      raw.push({ entry, g, row: 0, col: 0, dir: "across" });
      continue;
    }

    let best: { row: number; col: number; dir: "across" | "down"; score: number } | null =
      null;

    for (const placed of raw) {
      const perpDir = placed.dir === "across" ? "down" : "across";
      for (let gi = 0; gi < g.length; gi++) {
        for (let pj = 0; pj < placed.g.length; pj++) {
          if (g[gi] !== placed.g[pj]) continue;

          const crossR =
            placed.dir === "across" ? placed.row : placed.row + pj;
          const crossC =
            placed.dir === "across" ? placed.col + pj : placed.col;

          const row = perpDir === "down" ? crossR - gi : crossR;
          const col = perpDir === "across" ? crossC - gi : crossC;

          const result = canPlace(cellMap, g, row, col, perpDir);
          if (result.ok && (!best || result.intersections > best.score)) {
            best = { row, col, dir: perpDir, score: result.intersections };
          }
        }
      }
    }

    if (best) {
      for (let i = 0; i < g.length; i++) {
        const r = best.dir === "down" ? best.row + i : best.row;
        const c = best.dir === "across" ? best.col + i : best.col;
        cellMap.set(key(r, c), g[i]);
      }
      raw.push({ entry, g, row: best.row, col: best.col, dir: best.dir });
    } else {
      // No shared grapheme with anything placed so far — this happens
      // often with short, unrelated Khmer vocabulary, since a whole
      // stacked syllable cluster (base + subscript + vowel) is one
      // placeable unit and rarely matches another word's cluster.
      // Rather than dropping the word, seat it on its own row below
      // the current grid so every entered word still appears on the
      // page.
      const frontierRow = raw.reduce((max, p) => {
        const endRow = p.dir === "down" ? p.row + p.g.length - 1 : p.row;
        return Math.max(max, endRow);
      }, 0);
      const row = frontierRow + 2;
      const col = 0;
      for (let i = 0; i < g.length; i++) {
        cellMap.set(key(row, col + i), g[i]);
      }
      raw.push({ entry, g, row, col, dir: "across" });
    }
  }

  if (raw.length === 0) {
    return {
      width: 0,
      height: 0,
      cells: new Map(),
      numbers: new Map(),
      words: [],
    };
  }

  // Normalize to a 0-indexed bounding box.
  let minRow = Infinity,
    minCol = Infinity,
    maxRow = -Infinity,
    maxCol = -Infinity;
  for (const p of raw) {
    const endRow = p.dir === "down" ? p.row + p.g.length - 1 : p.row;
    const endCol = p.dir === "across" ? p.col + p.g.length - 1 : p.col;
    minRow = Math.min(minRow, p.row);
    minCol = Math.min(minCol, p.col);
    maxRow = Math.max(maxRow, endRow);
    maxCol = Math.max(maxCol, endCol);
  }

  const cells = new Map<string, string>();
  for (const [k, v] of cellMap) {
    const [r, c] = k.split(",").map(Number);
    cells.set(key(r - minRow, c - minCol), v);
  }

  const shifted = raw.map((p) => ({
    ...p,
    row: p.row - minRow,
    col: p.col - minCol,
  }));

  const width = maxCol - minCol + 1;
  const height = maxRow - minRow + 1;

  // Standard crossword numbering: scan top-to-bottom, left-to-right.
  const numbers = new Map<string, number>();
  let n = 1;
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (!cells.has(key(r, c))) continue;
      const startsAcross = !cells.has(key(r, c - 1)) && cells.has(key(r, c + 1));
      const startsDown = !cells.has(key(r - 1, c)) && cells.has(key(r + 1, c));
      if (startsAcross || startsDown) {
        numbers.set(key(r, c), n);
        n++;
      }
    }
  }

  const words: PlacedWord[] = shifted
    .map((p) => ({
      text: p.entry.text,
      clue: p.entry.clue,
      graphemes: p.g,
      row: p.row,
      col: p.col,
      dir: p.dir,
      number: numbers.get(key(p.row, p.col)) ?? 0,
    }))
    .sort((a, b) => a.number - b.number);

  return { width, height, cells, numbers, words };
}
