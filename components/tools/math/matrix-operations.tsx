"use client";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Op = "add" | "subtract" | "multiply" | "transpose" | "determinant" | "inverse";

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "";
  const r = Number(n.toPrecision(6));
  return String(Math.abs(r) < 1e-9 ? 0 : r);
}

function parseMatrix(values: Record<string, string>, n: number): number[][] | null {
  const m: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      const v = Number(values[`${i},${j}`]);
      if (values[`${i},${j}`] === undefined || values[`${i},${j}`] === "" || isNaN(v)) return null;
      row.push(v);
    }
    m.push(row);
  }
  return m;
}

function add(a: number[][], b: number[][]): number[][] {
  return a.map((row, i) => row.map((v, j) => v + b[i][j]));
}
function subtract(a: number[][], b: number[][]): number[][] {
  return a.map((row, i) => row.map((v, j) => v - b[i][j]));
}
function multiply(a: number[][], b: number[][]): number[][] {
  const n = a.length;
  const out: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += a[i][k] * b[k][j];
      row.push(s);
    }
    out.push(row);
  }
  return out;
}
function transpose(m: number[][]): number[][] {
  return m[0].map((_, j) => m.map((row) => row[j]));
}
function det2(m: number[][]): number {
  return m[0][0] * m[1][1] - m[0][1] * m[1][0];
}
function det3(m: number[][]): number {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}
function determinant(m: number[][]): number {
  return m.length === 2 ? det2(m) : det3(m);
}
function inverse2(m: number[][]): number[][] | null {
  const d = det2(m);
  if (Math.abs(d) < 1e-12) return null;
  return [
    [m[1][1] / d, -m[0][1] / d],
    [-m[1][0] / d, m[0][0] / d],
  ];
}
function inverse3(m: number[][]): number[][] | null {
  const c00 = m[1][1] * m[2][2] - m[1][2] * m[2][1];
  const c01 = -(m[1][0] * m[2][2] - m[1][2] * m[2][0]);
  const c02 = m[1][0] * m[2][1] - m[1][1] * m[2][0];
  const c10 = -(m[0][1] * m[2][2] - m[0][2] * m[2][1]);
  const c11 = m[0][0] * m[2][2] - m[0][2] * m[2][0];
  const c12 = -(m[0][0] * m[2][1] - m[0][1] * m[2][0]);
  const c20 = m[0][1] * m[1][2] - m[0][2] * m[1][1];
  const c21 = -(m[0][0] * m[1][2] - m[0][2] * m[1][0]);
  const c22 = m[0][0] * m[1][1] - m[0][1] * m[1][0];
  const d = m[0][0] * c00 + m[0][1] * c01 + m[0][2] * c02;
  if (Math.abs(d) < 1e-12) return null;
  return [
    [c00 / d, c10 / d, c20 / d],
    [c01 / d, c11 / d, c21 / d],
    [c02 / d, c12 / d, c22 / d],
  ];
}
function inverse(m: number[][]): number[][] | null {
  return m.length === 2 ? inverse2(m) : inverse3(m);
}

const DEFAULT_2 = { "0,0": "1", "0,1": "2", "1,0": "3", "1,1": "4" };
const DEFAULT_2B = { "0,0": "5", "0,1": "6", "1,0": "7", "1,1": "8" };
const DEFAULT_3 = { "0,0": "1", "0,1": "2", "0,2": "3", "1,0": "4", "1,1": "5", "1,2": "6", "2,0": "7", "2,1": "8", "2,2": "9" };
const DEFAULT_3B = { "0,0": "1", "0,1": "0", "0,2": "0", "1,0": "0", "1,1": "1", "1,2": "0", "2,0": "0", "2,1": "0", "2,2": "1" };

function MatrixInput({ n, values, onChange }: { n: number; values: Record<string, string>; onChange: (key: string, val: string) => void }) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
      {Array.from({ length: n * n }, (_, idx) => {
        const i = Math.floor(idx / n);
        const j = idx % n;
        const key = `${i},${j}`;
        return (
          <input
            key={key}
            inputMode="decimal"
            value={values[key] ?? ""}
            onChange={(e) => onChange(key, e.target.value)}
            className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2 py-2 text-center font-mono-ui text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]"
          />
        );
      })}
    </div>
  );
}

function MatrixView({ m }: { m: number[][] }) {
  const n = m.length;
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
      {m.flat().map((v, idx) => (
        <div key={idx} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2 py-2 text-center font-mono-ui text-sm text-[var(--ink)]">
          {fmt(v)}
        </div>
      ))}
    </div>
  );
}

export default function MatrixOperations() {
  const { text } = useLanguage();
  const [sizeStr, setSizeStr] = useToolState("matrix-ops:size", "2");
  const [op, setOp] = useToolState<Op>("matrix-ops:op", "multiply");
  const [a, setA] = useToolState<Record<string, string>>("matrix-ops:A", DEFAULT_2);
  const [b, setB] = useToolState<Record<string, string>>("matrix-ops:B", DEFAULT_2B);

  const n = sizeStr === "3" ? 3 : 2;
  const needsB = op === "add" || op === "subtract" || op === "multiply";

  const A = parseMatrix(a, n);
  const B = parseMatrix(b, n);

  let result: number[][] | number | null = null;
  let error = false;
  if (op === "transpose") {
    if (A) result = transpose(A);
    else error = true;
  } else if (op === "determinant") {
    if (A) result = determinant(A);
    else error = true;
  } else if (op === "inverse") {
    if (A) {
      const inv = inverse(A);
      if (inv) result = inv;
      else error = true;
    } else error = true;
  } else {
    if (A && B) {
      if (op === "add") result = add(A, B);
      else if (op === "subtract") result = subtract(A, B);
      else result = multiply(A, B);
    } else {
      error = true;
    }
  }

  function changeSize(size: string) {
    setSizeStr(size);
    if (size === "3") {
      setA(DEFAULT_3);
      setB(DEFAULT_3B);
    } else {
      setA(DEFAULT_2);
      setB(DEFAULT_2B);
    }
  }

  const isScalar = op === "determinant";

  return (
    <ToolShell
      title="Matrix Operations Calculator"
      description="Add, multiply, transpose, invert, and find the determinant of 2×2 and 3×3 matrices."
    >
      <div className="space-y-4">
        <Row>
          <Field label="Matrix size">
            <Select value={sizeStr} onChange={(e) => changeSize(e.target.value)}>
              <option value="2">2×2</option>
              <option value="3">3×3</option>
            </Select>
          </Field>
          <Field label="Operation">
            <Select value={op} onChange={(e) => setOp(e.target.value as Op)}>
              <option value="add">Add (A + B)</option>
              <option value="subtract">Subtract (A − B)</option>
              <option value="multiply">Multiply (A × B)</option>
              <option value="transpose">Transpose (Aᵀ)</option>
              <option value="determinant">Determinant (det A)</option>
              <option value="inverse">Inverse (A⁻¹)</option>
            </Select>
          </Field>
        </Row>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Matrix A">
            <MatrixInput n={n} values={a} onChange={(key, val) => setA((prev) => ({ ...prev, [key]: val }))} />
          </Field>
          {needsB && (
            <Field label="Matrix B">
              <MatrixInput n={n} values={b} onChange={(key, val) => setB((prev) => ({ ...prev, [key]: val }))} />
            </Field>
          )}
        </div>

        <Field label="Result">
          {error ? (
            <div className="rounded-md border border-[var(--danger)]/50 bg-[var(--danger)]/10 px-3 py-2.5 text-sm text-[var(--danger)]">
              {op === "inverse" ? text("Matrix is singular (no inverse).", "ម៉ាទ្រីសគ្មានអ៊ីនវ៉េស (ដេតេមីណង់ស្មើសូន្យ)។") : text("Enter valid numbers.", "បញ្ចូលលេខត្រឹមត្រូវ។")}
            </div>
          ) : isScalar ? (
            <Output value={typeof result === "number" ? fmt(result) : ""} />
          ) : result ? (
            <MatrixView m={result as number[][]} />
          ) : null}
        </Field>
      </div>
    </ToolShell>
  );
}