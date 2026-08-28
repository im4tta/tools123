// Secret Santa assignment engine. Original implementation (Tools123):
// randomized backtracking that guarantees every participant gives exactly one
// gift and receives exactly one, never draws themselves, and respects the
// user's exclusion pairs. Returns null when the constraints are impossible.

export interface Assignment {
  giver: string;
  receiver: string;
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Draws assignments for unique participant names. Exclusions are
 * [giver, receiver] pairs that must not be matched.
 * Returns null when fewer than 2 unique names or when no valid derangement exists.
 */
export function secretSantaDraw(
  names: string[],
  exclusions: Array<[string, string]>,
  rng: () => number = Math.random,
): Assignment[] | null {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (unique.length < 2) return null;

  const banned = new Set<string>();
  for (const [giver, receiver] of exclusions) {
    banned.add(`${giver.trim()}→${receiver.trim()}`);
  }

  const receivers = [...unique];
  const assigned = new Map<string, string>();

  function backtrack(giverIndex: number, available: string[]): boolean {
    if (giverIndex === unique.length) return true;
    const giver = unique[giverIndex];
    const candidates = shuffle(available, rng).filter((receiver) => {
      if (receiver === giver) return false;
      if (banned.has(`${giver}→${receiver}`)) return false;
      return true;
    });
    for (const receiver of candidates) {
      assigned.set(giver, receiver);
      const next = available.filter((r) => r !== receiver);
      if (backtrack(giverIndex + 1, next)) return true;
      assigned.delete(giver);
    }
    return false;
  }

  // Random giver order so repeated draws produce different results.
  const ordered = shuffle(unique, rng);
  const savedOrder = [...unique];
  unique.length = 0;
  unique.push(...ordered);
  const ok = backtrack(0, receivers);
  if (!ok) {
    // Restore original order for deterministic error reporting.
    unique.length = 0;
    unique.push(...savedOrder);
    return null;
  }
  const result: Assignment[] = ordered.map((giver) => ({ giver, receiver: assigned.get(giver) as string }));
  // Restore original order so output follows the user's list.
  unique.length = 0;
  unique.push(...savedOrder);
  return result;
}

/** Parses "A > B" or "A, B" exclusion lines into [giver, receiver] pairs. */
export function parseExclusions(raw: string): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (const line of raw.split("\n")) {
    const cleaned = line.trim();
    if (!cleaned) continue;
    const match = cleaned.match(/^(.+?)\s*(?:>|->|→|,|;)\s*(.+)$/);
    if (match) pairs.push([match[1].trim(), match[2].trim()]);
  }
  return pairs;
}
