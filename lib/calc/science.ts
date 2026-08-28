// Pure science engines. Formula references:
// - Radioactive decay: N = N₀ · (1/2)^(t/T½); decay constant λ = ln 2 / T½; mean lifetime τ = 1/λ
// - Dilution: C₁V₁ = C₂V₂ (conservation of moles)
// - Molarity: M = mass (g) / (molar mass (g/mol) × volume (L))
// - DNA translation: NCBI standard genetic code (translation table 1)

export interface HalfLifeResult {
  remaining: number;
  fraction: number;
  /** Decay constant λ = ln2 / T½, in inverse time units. */
  lambda: number;
  /** Mean lifetime τ = 1/λ, in the same time unit as T½. */
  meanLifetime: number;
  halfLives: number;
}

export function halfLife(initial: number, halfLifeValue: number, elapsed: number): HalfLifeResult | null {
  if (!isFinite(initial) || !isFinite(halfLifeValue) || !isFinite(elapsed)) return null;
  if (halfLifeValue <= 0) return null;
  const remaining = initial * Math.pow(0.5, elapsed / halfLifeValue);
  const lambda = Math.LN2 / halfLifeValue;
  return {
    remaining,
    fraction: initial === 0 ? 0 : remaining / initial,
    lambda,
    meanLifetime: 1 / lambda,
    halfLives: elapsed / halfLifeValue,
  };
}

export type DilutionVariable = "C1" | "V1" | "C2" | "V2";

/** Solves C₁V₁ = C₂V₂ for the chosen unknown; the other three values must be provided. */
export function dilutionSolve(
  target: DilutionVariable,
  c1: number,
  v1: number,
  c2: number,
  v2: number,
): number | null {
  const given: Record<DilutionVariable, number> = { C1: c1, V1: v1, C2: c2, V2: v2 };
  for (const key of Object.keys(given) as DilutionVariable[]) {
    if (key !== target && (!isFinite(given[key]) || given[key] <= 0)) return null;
  }
  switch (target) {
    case "C1":
      return (c2 * v2) / v1;
    case "V1":
      return (c2 * v2) / c1;
    case "C2":
      return (c1 * v1) / v2;
    case "V2":
      return (c1 * v1) / c2;
  }
}

/** Molarity M = mass / (molarMass × litres). Volume is accepted in millilitres. */
export function molarityFromMass(massGrams: number, molarMass: number, volumeMl: number): number | null {
  if (!isFinite(massGrams) || !isFinite(molarMass) || !isFinite(volumeMl)) return null;
  if (molarMass <= 0 || volumeMl <= 0) return null;
  const litres = volumeMl / 1000;
  return massGrams / (molarMass * litres);
}

// Standard genetic code (NCBI translation table 1), DNA codons → one-letter amino acids.
export const CODON_TABLE: Record<string, string> = {
  TTT: "F", TTC: "F", TTA: "L", TTG: "L", CTT: "L", CTC: "L", CTA: "L", CTG: "L",
  ATT: "I", ATC: "I", ATA: "I", ATG: "M", GTT: "V", GTC: "V", GTA: "V", GTG: "V",
  TCT: "S", TCC: "S", TCA: "S", TCG: "S", CCT: "P", CCC: "P", CCA: "P", CCG: "P",
  ACT: "T", ACC: "T", ACA: "T", ACG: "T", GCT: "A", GCC: "A", GCA: "A", GCG: "A",
  TAT: "Y", TAC: "Y", TAA: "*", TAG: "*", CAT: "H", CAC: "H", CAA: "Q", CAG: "Q",
  AAT: "N", AAC: "N", AAA: "K", AAG: "K", GAT: "D", GAC: "D", GAA: "E", GAG: "E",
  TGT: "C", TGC: "C", TGA: "*", TGG: "W", CGT: "R", CGC: "R", CGA: "R", CGG: "R",
  AGT: "S", AGC: "S", AGA: "R", AGG: "R", GGT: "G", GGC: "G", GGA: "G", GGG: "G",
};

export const AMINO_ACIDS: Record<string, string> = {
  F: "Phenylalanine", L: "Leucine", I: "Isoleucine", M: "Methionine", V: "Valine",
  S: "Serine", P: "Proline", T: "Threonine", A: "Alanine", Y: "Tyrosine",
  H: "Histidine", Q: "Glutamine", N: "Asparagine", K: "Lysine", D: "Aspartic acid",
  E: "Glutamic acid", C: "Cysteine", W: "Tryptophan", R: "Arginine", G: "Glycine",
  "*": "Stop",
};

/** Uppercases and keeps only A/C/G/T/U. Returns null for an empty result. */
export function cleanSequence(raw: string): string | null {
  const cleaned = raw.toUpperCase().replace(/[^ACGTU]/g, "");
  return cleaned.length > 0 ? cleaned : null;
}

/** DNA → RNA transcript (T → U). U in the input is treated as T first. */
export function transcribe(sequence: string): string {
  return sequence.replace(/U/g, "T").replace(/T/g, "U");
}

/** Reverse complement of a DNA sequence (U treated as T). */
export function reverseComplement(sequence: string): string {
  const dna = sequence.replace(/U/g, "T");
  const map: Record<string, string> = { A: "T", T: "A", G: "C", C: "G" };
  let out = "";
  for (let i = dna.length - 1; i >= 0; i--) out += map[dna[i]] ?? "N";
  return out;
}

/** GC content as a fraction of A/C/G/T/U characters (0 for empty input). */
export function gcContent(sequence: string): number {
  const dna = sequence.replace(/U/g, "T");
  if (dna.length === 0) return 0;
  let gc = 0;
  for (const ch of dna) if (ch === "G" || ch === "C") gc++;
  return gc / dna.length;
}

/**
 * Translates DNA (frame 0–2) using the standard genetic code.
 * Input is treated as the coding strand read 5'→3'; U is treated as T.
 * Stop codons become "*", and any character outside ACGT becomes "X".
 */
export function translate(sequence: string, frame: 0 | 1 | 2): string {
  const dna = sequence.replace(/U/g, "T");
  let protein = "";
  for (let i = frame; i + 3 <= dna.length; i += 3) {
    const codon = dna.slice(i, i + 3);
    protein += CODON_TABLE[codon] ?? "X";
  }
  return protein;
}

/** Amino-acid chain without the trailing stop, for readability. */
export function proteinString(sequence: string, frame: 0 | 1 | 2): string {
  const protein = translate(sequence, frame);
  return protein.endsWith("*") ? protein.slice(0, -1) : protein;
}
