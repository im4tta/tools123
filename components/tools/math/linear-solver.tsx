"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Eq = { coeffs: number[]; rhs: number };

function fmt(n: number): string {
  return Object.is(n, -0) ? "0" : n.toFixed(2).replace(/\.?0+$/, "");
}

export default function LinearSolver() {
  const { text: t } = useLanguage();
  const [n, setN] = useToolState("linear-solver:n", "2");
  const [rows, setRows] = useToolState<Eq[]>("linear-solver:rows", [
    { coeffs: [2, 1], rhs: 5 },
    { coeffs: [1, -1], rhs: 1 },
  ]);

  const size = Math.max(1, Math.min(4, Number(n) || 2));

  const resize = (next: number) => {
    setN(String(next));
    setRows((prev) => {
      const out = prev.slice(0, next).map((r) => ({ coeffs: r.coeffs.slice(0, next), rhs: r.rhs }));
      while (out.length < next) out.push({ coeffs: Array(next).fill(1), rhs: 1 });
      return out.map((r) => ({ coeffs: r.coeffs.length === next ? r.coeffs : [...r.coeffs, ...Array(next - r.coeffs.length).fill(1)], rhs: r.rhs }));
    });
  };

  const setCoeff = (i: number, j: number, v: string) => {
    setRows((prev) => prev.map((r, ri) => (ri === i ? { ...r, coeffs: r.coeffs.map((c, ci) => (ci === j ? Number(v) : c)) } : r)));
  };

  const result = useMemo(() => {
    if (rows.length !== size || rows.some((r) => r.coeffs.length !== size)) return null;
    const a = rows.map((r) => [...r.coeffs, r.rhs]);
    // Gaussian elimination
    const m = a.map((r) => [...r]);
    for (let col = 0; col < size; col++) {
      let pivot = col;
      for (let r = col + 1; r < size; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
      if (Math.abs(m[pivot][col]) < 1e-9) return { singular: true } as const;
      [m[col], m[pivot]] = [m[pivot], m[col]];
      const pv = m[col][col];
      for (let c = col; c <= size; c++) m[col][c] /= pv;
      for (let r = 0; r < size; r++) {
        if (r === col) continue;
        const f = m[r][col];
        for (let c = col; c <= size; c++) m[r][c] -= f * m[col][c];
      }
    }
    const sol = m.map((r) => r[size]);
    return { sol, singular: false } as const;
  }, [rows, size]);

  return (
    <ToolShell
      title="Linear Equation Solver"
      khmerTitle="ដោះស្រាយសមីការលីនេអ៊ែរ"
      description="Solve a system of linear equations (up to 4 unknowns) using Gaussian elimination."
      descriptionKm="ដោះស្រាយប្រព័ន្ធសមីការលីនេអ៊ែរ (រហូតដល់ 4 អញ្ញាត) ដោយវិធី Gaussian elimination។"
    >
      <Field label={t("Number of unknowns", "ចំនួនអញ្ញាត")}>
        <TextInput inputMode="numeric" value={n} onChange={(e) => resize(parseInt(e.target.value, 10) || 2)} />
      </Field>
      <div className="space-y-2 overflow-x-auto">
        {Array.from({ length: size }, (_, i) => (
          <div key={i} className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2">
            {Array.from({ length: size }, (_, j) => (
              <div key={j} className="flex items-center gap-1.5">
                <TextInput
                  className="w-16 text-right font-mono-ui"
                  inputMode="decimal"
                  value={String(rows[i]?.coeffs[j] ?? 1)}
                  onChange={(e) => setCoeff(i, j, e.target.value)}
                />
                <span className="font-mono-ui text-sm text-[var(--ink-dim)]">x{j + 1}</span>
                {j < size - 1 && <span className="mx-1 text-[var(--ink-faint)]">+</span>}
              </div>
            ))}
            <span className="mx-1 font-mono-ui text-[var(--ink-faint)]">=</span>
            <TextInput
              className="w-16 text-right font-mono-ui"
              inputMode="decimal"
              value={String(rows[i]?.rhs ?? 1)}
              onChange={(e) =>
                setRows((prev) => prev.map((r, ri) => (ri === i ? { ...r, rhs: Number(e.target.value) } : r)))
              }
            />
          </div>
        ))}
      </div>

      {result && "singular" in result && result.singular ? (
        <p className="text-sm text-[var(--danger)]">{t("No unique solution (system is singular or dependent).", "គ្មានដំណោះស្រាយតែមួយ (ប្រព័ន្ធពឹងផ្អែកគ្នា)។")}</p>
      ) : result ? (
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Solution", "ដំណោះស្រាយ")}</div>
          <div className="mt-2 space-y-1 font-mono-ui text-lg text-[var(--ink)]">
            {result.sol.map((s, i) => (
              <div key={i}>
                x{i + 1} = {fmt(s)}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </ToolShell>
  );
}