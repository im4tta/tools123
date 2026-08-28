// Pure statistics engines. Formula references:
// - Cochran's sample-size formula: n₀ = z² · p(1 − p) / e²
// - Finite-population correction: n = n₀ / (1 + (n₀ − 1) / N)
// - Margin of error: e = z · √(p(1 − p)/n), with FPC factor √((N − n)/(N − 1)) when N is finite.
// z-values: 90 % → 1.6449, 95 % → 1.96, 99 % → 2.576 (two-sided standard normal).

export const Z_SCORES: Record<number, number> = {
  90: 1.6449,
  95: 1.96,
  99: 2.576,
};

export function zFromConfidence(confidencePct: number): number | null {
  return Z_SCORES[confidencePct] ?? null;
}

export interface SampleSizeResult {
  /** Required sample size (Cochran n₀ when no population given, corrected otherwise). */
  sampleSize: number;
  uncorrected: number;
  finiteCorrected: boolean;
}

export function sampleSize(
  z: number,
  marginPct: number,
  proportion: number,
  population?: number,
): SampleSizeResult | null {
  if (!isFinite(z) || z <= 0) return null;
  const e = marginPct / 100;
  if (!isFinite(e) || e <= 0 || e >= 1) return null;
  if (!isFinite(proportion) || proportion < 0 || proportion > 1) return null;
  const uncorrected = (z * z * proportion * (1 - proportion)) / (e * e);
  let final = uncorrected;
  let finiteCorrected = false;
  if (population !== undefined) {
    if (!isFinite(population) || population < 1) return null;
    if (population > 1) {
      final = uncorrected / (1 + (uncorrected - 1) / population);
      finiteCorrected = true;
    }
  }
  return {
    sampleSize: Math.max(1, Math.ceil(final)),
    uncorrected,
    finiteCorrected,
  };
}

/** Margin of error (percentage points) for a completed sample of size n. */
export function marginOfError(
  z: number,
  n: number,
  proportion: number,
  population?: number,
): number | null {
  if (!isFinite(z) || z <= 0) return null;
  if (!isFinite(n) || n < 1) return null;
  if (!isFinite(proportion) || proportion < 0 || proportion > 1) return null;
  let variance = (proportion * (1 - proportion)) / n;
  if (population !== undefined && isFinite(population) && population > 1 && n < population) {
    variance *= (population - n) / (population - 1);
  }
  return Math.sqrt(variance) * z * 100;
}
