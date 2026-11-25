// Spaced practice for glossary flashcards (a Leitner box system). Each card the reader has seen has a box (0–5) and the
// day it is next due. "Got it" moves a card up a box and pushes it further out; "Again" sends it back to box 0, due today.
// Days are local calendar days counted from the Unix epoch, so progress survives time zones and clock changes within a day.

export interface CardProgress {
  /** 0 = still learning … 5 = well known. */
  box: number;
  /** Local day number when the card is next due. */
  due: number;
}

export type ProgressMap = Record<string, CardProgress>;

/** Days to wait after a correct answer, by the box the card moves into. */
export const INTERVALS = [0, 1, 2, 4, 8, 16] as const;
export const MAX_BOX = INTERVALS.length - 1;

export function dayNumber(date: Date = new Date()): number {
  return Math.floor((date.getTime() - date.getTimezoneOffset() * 60_000) / 86_400_000);
}

export function review(progress: CardProgress | undefined, knewIt: boolean, today: number): CardProgress {
  if (!knewIt) return { box: 0, due: today };
  const box = Math.min(MAX_BOX, (progress?.box ?? 0) + 1);
  return { box, due: today + INTERVALS[box] };
}

export function isDue(progress: CardProgress | undefined, today: number): boolean {
  return progress !== undefined && progress.due <= today;
}

/** Cards due today among the given ids. */
export function countDue(ids: string[], map: ProgressMap, today: number): number {
  return ids.reduce((n, id) => n + (isDue(map[id], today) ? 1 : 0), 0);
}

/**
 * A practice round: cards due today first (most overdue first), then cards never seen, up to `size`.
 * Cards seen before but not yet due are left out. `shuffle` is injected so tests are deterministic.
 */
export function pickRound(ids: string[], map: ProgressMap, today: number, size: number, shuffle: <T>(list: T[]) => T[]): string[] {
  const due = ids.filter((id) => isDue(map[id], today)).sort((a, b) => map[a].due - map[b].due);
  const fresh = shuffle(ids.filter((id) => map[id] === undefined));
  return [...due, ...fresh].slice(0, size);
}

/** How many of the ids are in the top box (shown as "well known"). */
export function countKnown(ids: string[], map: ProgressMap): number {
  return ids.reduce((n, id) => n + ((map[id]?.box ?? 0) >= 3 ? 1 : 0), 0);
}
