// Polite support ask after exports (shown by components/SponsorAsk.tsx, triggered from recordExport in lib/export.ts).
// It never shares an export count with the share milestones (so only one prompt shows at a time), waits
// SPONSOR_COOLDOWN_DAYS between asks, and stops for good after "Don't ask again". Kept free of path aliases so the
// schedule can be unit-tested with plain Node (tests/sponsor-ask.test.mjs).

export const SPONSOR_ASK_EVENT = "tools123:sponsor-ask";
const SPONSOR_ASK_KEY = "toolbox123:sponsorAsk";
export const SPONSOR_FIRST_ASKS = [3, 8, 15] as const;
export const SPONSOR_EVERY = 15;
export const SPONSOR_COOLDOWN_DAYS = 14;

export interface SponsorAskState {
  lastAskedAt?: number;
  optedOut?: boolean;
}

/** Export counts where an ask may show: 3, 8, 15, then every 15th, never on a share milestone. */
export function isSponsorAskCount(count: number, milestones: readonly number[]): boolean {
  if (!Number.isInteger(count) || count < 1 || milestones.includes(count)) return false;
  const last = SPONSOR_FIRST_ASKS[SPONSOR_FIRST_ASKS.length - 1];
  return (SPONSOR_FIRST_ASKS as readonly number[]).includes(count) || (count > last && count % SPONSOR_EVERY === 0);
}

/** False after "Don't ask again" or within the cooldown since the last ask. */
export function sponsorAskAllowed(state: SponsorAskState, now = Date.now()): boolean {
  if (state.optedOut) return false;
  return !state.lastAskedAt || now - state.lastAskedAt >= SPONSOR_COOLDOWN_DAYS * 86_400_000;
}

export function readSponsorAsk(): SponsorAskState {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(SPONSOR_ASK_KEY) ?? "{}") as SponsorAskState;
  } catch {
    return {};
  }
}

/** Record that the ask was shown (starts the cooldown), or that the user asked not to be asked again. */
export function markSponsorAsked(optOut = false) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SPONSOR_ASK_KEY, JSON.stringify({ ...readSponsorAsk(), lastAskedAt: Date.now(), ...(optOut ? { optedOut: true } : {}) }));
  } catch {
    // ignore storage errors
  }
}
