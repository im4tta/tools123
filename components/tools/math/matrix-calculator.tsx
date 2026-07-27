"use client";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function parseMatrix(text: string): number[][] | null {
  const rows = text.trim().split("\n").map((r) => r.trim().split(/[,\s]+/).map(Number));
  if (rows.length === 0 || rows.some((r) => r.some(isNaN))) return null;
  const width = rows[0].length;
  if (rows.some((r) => r.length !== width)) return null;
  return rows;
}

function determinant(m: number[][]): number | null {
  const n = m.length;
  if (n !== m[0].length) return null;
  if (n === 1) return m[0][0];
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  if (n === 3) {
    return (
      m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
      m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
      m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
    );
  }
  return null;
}

export default function MatrixCalculator() {
  const [input, setInput] = useToolState("matrix-calculator:input", "1, 2, 3\n0, 1, 4\n5, 6, 0");
  const matrix = parseMatrix(input);
  const det = matrix ? determinant(matrix) : null;

  return (
    <ToolShell title="Matrix Determinant" description="Enter a square matrix (2×2 or 3×3), one row per line, values comma or space separated.">
      <Field label="Matrix" hint="rows on separate lines"><TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" /></Field>
      <Output
        label="Determinant"
        value={det === null ? "" : String(det)}
        error={det === null}
      />
      {matrix && det === null && (
        <p className="text-xs text-[var(--danger)]">Only 2×2 and 3×3 square matrices are supported.</p>
      )}
    </ToolShell>
  );
}
