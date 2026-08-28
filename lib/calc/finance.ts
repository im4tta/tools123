// Pure finance engines for the calculators batch. No React, no DOM — so the
// math can be unit-tested directly (see tests/calc.test.mjs) and reused.
//
// Formula references:
// - Margin % = (price − cost) / price × 100 ; Markup % = (price − cost) / cost × 100
// - NPV = Σ CFₜ / (1 + r)ᵗ  (standard discounted cash flow)
// - IRR: the rate r where NPV(r) = 0, solved by bisection
// - Straight-line: (cost − salvage) / life
// - Declining balance: book × rate, with rate = 1 − (salvage/cost)^(1/life)
// - Double-declining: book × 2/life, floored at salvage
// - Sum-of-years digits: (remaining life / SYD) × (cost − salvage)

export interface MarginMarkupResult {
  profit: number;
  /** Gross margin as a percent of price, or null when price is 0. */
  marginPct: number | null;
  /** Markup as a percent of cost, or null when cost is 0. */
  markupPct: number | null;
}

export function marginMarkup(cost: number, price: number): MarginMarkupResult {
  const profit = price - cost;
  const marginPct = price === 0 ? null : (profit / price) * 100;
  const markupPct = cost === 0 ? null : (profit / cost) * 100;
  return { profit, marginPct, markupPct };
}

/** Selling price that yields the requested gross margin on cost. Null when margin ≥ 100 %. */
export function priceFromMargin(cost: number, marginPct: number): number | null {
  if (!isFinite(cost) || !isFinite(marginPct) || marginPct >= 100) return null;
  return cost / (1 - marginPct / 100);
}

/** Cost that the given price implies at the requested gross margin. Null when margin ≥ 100 %. */
export function costFromMargin(price: number, marginPct: number): number | null {
  if (!isFinite(price) || !isFinite(marginPct) || marginPct >= 100) return null;
  return price * (1 - marginPct / 100);
}

/** Net present value of a cash-flow series; index 0 is time 0 (usually the investment). */
export function npv(rate: number, cashflows: number[]): number {
  return cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
}

/**
 * Internal rate of return via bisection on NPV(r) = 0 within [−90 %, 1000 %].
 * Returns null when no sign change is found in that window (no real IRR).
 */
export function irr(cashflows: number[]): number | null {
  if (cashflows.length < 2 || cashflows.some((cf) => !isFinite(cf))) return null;
  let lo = -0.9;
  let hi = 10;
  let fLo = npv(lo, cashflows);
  let fHi = npv(hi, cashflows);
  if (fLo === 0) return lo;
  if (fHi === 0) return hi;
  if (!isFinite(fLo) || !isFinite(fHi) || fLo * fHi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid, cashflows);
    if (Math.abs(fMid) < 1e-9) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

/** Simple (undiscounted) payback period in years; null when the flows never recover the outlay. */
export function paybackYears(cashflows: number[]): number | null {
  let cumulative = 0;
  for (let t = 0; t < cashflows.length; t++) {
    const previous = cumulative;
    cumulative += cashflows[t];
    if (previous < 0 && cumulative >= 0) {
      const needed = -previous;
      return t - 1 + needed / cashflows[t];
    }
  }
  return null;
}

export type DepreciationMethod = "straight-line" | "declining" | "double-declining" | "sum-of-years";

export interface DepreciationRow {
  year: number;
  depreciation: number;
  accumulated: number;
  bookValue: number;
}

export function depreciationSchedule(
  method: DepreciationMethod,
  cost: number,
  salvage: number,
  lifeYears: number,
): DepreciationRow[] | null {
  if (!isFinite(cost) || !isFinite(salvage) || !isFinite(lifeYears)) return null;
  if (cost < 0 || salvage < 0) return null;
  const life = Math.floor(lifeYears);
  if (life < 1 || life > 100) return null;
  if (salvage > cost) return null;
  if (method === "declining" && cost === 0) return null;

  const rows: DepreciationRow[] = [];
  let book = cost;
  let accumulated = 0;

  if (method === "straight-line") {
    const perYear = (cost - salvage) / life;
    for (let year = 1; year <= life; year++) {
      const isLast = year === life;
      const depreciation = isLast ? cost - salvage - accumulated : Math.min(perYear, cost - salvage - accumulated);
      accumulated += depreciation;
      book -= depreciation;
      rows.push({ year, depreciation, accumulated, bookValue: book });
    }
    return rows;
  }

  if (method === "declining") {
    // Rate chosen so book value lands exactly on salvage after `life` years.
    const rate = 1 - Math.pow(salvage / cost, 1 / life);
    for (let year = 1; year <= life; year++) {
      const isLast = year === life;
      const depreciation = isLast ? book - salvage : book * rate;
      accumulated += depreciation;
      book -= depreciation;
      rows.push({ year, depreciation, accumulated, bookValue: book });
    }
    return rows;
  }

  if (method === "double-declining") {
    const rate = 2 / life;
    for (let year = 1; year <= life; year++) {
      const isLast = year === life;
      const depreciation = isLast ? book - salvage : Math.min(book * rate, book - salvage);
      accumulated += depreciation;
      book -= depreciation;
      rows.push({ year, depreciation, accumulated, bookValue: book });
    }
    return rows;
  }

  // sum-of-years digits
  const syd = (life * (life + 1)) / 2;
  const depreciable = cost - salvage;
  for (let year = 1; year <= life; year++) {
    const depreciation = ((life - year + 1) / syd) * depreciable;
    accumulated += depreciation;
    book -= depreciation;
    rows.push({ year, depreciation, accumulated, bookValue: book });
  }
  return rows;
}
