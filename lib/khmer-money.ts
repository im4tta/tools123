// Pure money helpers for the Cambodian cash tools: greedy note breakdown (shared
// with the Riel Cash Breakdown tool), mixed USD/KHR change, and a rotating
// savings (tontine / ហ៊ុយ) schedule. No imports, so tests can run them in Node.
//
// Nothing here is an official rate or rule: exchange rates, denominations,
// rounding, and tontine terms are always supplied by the caller/user.

/**
 * Default riel denominations: the commonly circulating National Bank of
 * Cambodia banknotes. Editable in every tool — a starting point, not an
 * authoritative list.
 */
export const DEFAULT_RIEL_DENOMS = "100, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000";

/** Parse a comma/space separated list into unique positive integers, largest first. */
export function parseDenoms(text: string): number[] {
  return [...new Set(
    text.split(/[,\s]+/).map((d) => Math.floor(Number(d.trim()))).filter((d) => Number.isFinite(d) && d > 0),
  )].sort((a, b) => b - a);
}

export interface BreakdownRow { denom: number; count: number; subtotal: number }

/** Greedy split of `amount` into the given denominations (largest first). */
export function greedyBreakdown(amount: number, denoms: number[]): { rows: BreakdownRow[]; remainder: number } {
  let remaining = Math.max(0, Math.floor(amount || 0));
  const rows: BreakdownRow[] = [];
  for (const denom of [...denoms].sort((a, b) => b - a)) {
    const count = Math.floor(remaining / denom);
    remaining -= count * denom;
    if (count > 0) rows.push({ denom, count, subtotal: count * denom });
  }
  return { rows, remainder: remaining };
}

// ---------------------------------------------------------------------------
// Mixed USD / KHR change
// ---------------------------------------------------------------------------

export interface ChangeInput {
  priceUsd: number;
  priceKhr: number;
  paidUsd: number;
  paidKhr: number;
  /** Riel per 1 USD, as used by the shop. Must be > 0. */
  rate: number;
  /** "riel": all change in riel. "mixed": whole dollars in USD, the rest in riel. */
  mode: "riel" | "mixed";
  /** Round riel change DOWN to a multiple of this (e.g. 100 = smallest common note). */
  roundTo: number;
}

export interface ChangeResult {
  /** Total price and payment expressed in riel. */
  dueKhr: number;
  paidKhr: number;
  /** Positive = change owed to the customer; negative = customer still owes. */
  balanceKhr: number;
  changeUsd: number;
  changeKhr: number;
  /** Riel lost to rounding (always ≥ 0, in the shop's favour). */
  roundedOffKhr: number;
  /** When the customer still owes: the shortfall in riel and in USD. */
  owedKhr: number;
  owedUsd: number;
}

export function computeChange(input: ChangeInput): ChangeResult | null {
  const { priceUsd, priceKhr, paidUsd, paidKhr, rate, mode } = input;
  if (!(rate > 0) || [priceUsd, priceKhr, paidUsd, paidKhr].some((v) => !Number.isFinite(v) || v < 0)) return null;
  const roundTo = Math.max(1, Math.floor(input.roundTo || 1));
  // Work in whole riel to avoid floating-point cents drift.
  const dueKhr = Math.round(priceUsd * rate + priceKhr);
  const paidTotal = Math.round(paidUsd * rate + paidKhr);
  const balanceKhr = paidTotal - dueKhr;
  if (balanceKhr < 0) {
    const owedKhr = -balanceKhr;
    return { dueKhr, paidKhr: paidTotal, balanceKhr, changeUsd: 0, changeKhr: 0, roundedOffKhr: 0, owedKhr, owedUsd: owedKhr / rate };
  }
  let changeUsd = 0;
  let rest = balanceKhr;
  if (mode === "mixed") {
    changeUsd = Math.floor(balanceKhr / rate);
    rest = balanceKhr - Math.round(changeUsd * rate);
  }
  const changeKhr = Math.floor(rest / roundTo) * roundTo;
  return { dueKhr, paidKhr: paidTotal, balanceKhr, changeUsd, changeKhr, roundedOffKhr: rest - changeKhr, owedKhr: 0, owedUsd: 0 };
}

// ---------------------------------------------------------------------------
// Rotating savings group (tontine / ហ៊ុយ)
// ---------------------------------------------------------------------------

export interface TontineRound {
  round: number;
  recipient: string;
  bid: number;
  /** What each other member pays this round, by name. */
  payments: { name: string; amount: number }[];
  pot: number;
}

export interface TontineMemberSummary { name: string; paid: number; received: number; net: number }

/**
 * Build a schedule. Model (one common arrangement — groups differ):
 *  • Each round one member (in `order`) collects the pot and pays nothing that round.
 *  • "fixed": every other member pays `contribution`.
 *  • "bid": the recipient's bid (discount) for that round is subtracted from what
 *    members who have NOT yet collected pay; members who already collected pay the
 *    full `contribution`. Bids are user-entered and clamped to [0, contribution].
 */
export function tontineSchedule(order: string[], contribution: number, model: "fixed" | "bid", bids: number[] = []): { rounds: TontineRound[]; members: TontineMemberSummary[] } {
  const c = Math.max(0, contribution || 0);
  const collected = new Set<string>();
  const paid = new Map<string, number>(order.map((n) => [n, 0]));
  const received = new Map<string, number>(order.map((n) => [n, 0]));
  const rounds: TontineRound[] = [];
  order.forEach((recipient, i) => {
    const bid = model === "bid" ? Math.min(c, Math.max(0, bids[i] || 0)) : 0;
    const payments = order.filter((n) => n !== recipient).map((name) => ({ name, amount: collected.has(name) ? c : c - bid }));
    const pot = payments.reduce((s, p) => s + p.amount, 0);
    for (const p of payments) paid.set(p.name, (paid.get(p.name) ?? 0) + p.amount);
    received.set(recipient, (received.get(recipient) ?? 0) + pot);
    collected.add(recipient);
    rounds.push({ round: i + 1, recipient, bid, payments, pot });
  });
  const members = order.map((name) => {
    const p = paid.get(name) ?? 0;
    const r = received.get(name) ?? 0;
    return { name, paid: p, received: r, net: r - p };
  });
  return { rounds, members };
}
