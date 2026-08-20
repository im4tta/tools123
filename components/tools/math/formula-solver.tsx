"use client";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

interface VarDef {
  key: string;
  label: string;
}

interface Formula {
  id: string;
  name: string;
  nameKm: string;
  latex: string;
  vars: VarDef[];
  solve: (target: string, vals: Record<string, number>) => number | null;
}

const FORMULAS: Formula[] = [
  {
    id: "area-rectangle",
    name: "Area of a rectangle",
    nameKm: "ផ្ទៃក្រឡាចតុកោណកែង",
    latex: "A = l × w",
    vars: [
      { key: "A", label: "Area (m²)" },
      { key: "l", label: "Length (m)" },
      { key: "w", label: "Width (m)" },
    ],
    solve: (t, v) => (t === "A" ? v.l * v.w : t === "l" ? v.A / v.w : v.A / v.l),
  },
  {
    id: "area-triangle",
    name: "Area of a triangle",
    nameKm: "ផ្ទៃក្រឡាត្រីកោណ",
    latex: "A = ½ b h",
    vars: [
      { key: "A", label: "Area (m²)" },
      { key: "b", label: "Base (m)" },
      { key: "h", label: "Height (m)" },
    ],
    solve: (t, v) => (t === "A" ? 0.5 * v.b * v.h : t === "b" ? (2 * v.A) / v.h : (2 * v.A) / v.b),
  },
  {
    id: "area-circle",
    name: "Area of a circle",
    nameKm: "ផ្ទៃក្រឡារង្វង់",
    latex: "A = π r²",
    vars: [
      { key: "A", label: "Area (m²)" },
      { key: "r", label: "Radius (m)" },
    ],
    solve: (t, v) => (t === "A" ? Math.PI * v.r * v.r : v.A >= 0 ? Math.sqrt(v.A / Math.PI) : null),
  },
  {
    id: "circumference",
    name: "Circumference of a circle",
    nameKm: "បរិមាត្ររង្វង់",
    latex: "C = 2π r",
    vars: [
      { key: "C", label: "Circumference (m)" },
      { key: "r", label: "Radius (m)" },
    ],
    solve: (t, v) => (t === "C" ? 2 * Math.PI * v.r : v.C / (2 * Math.PI)),
  },
  {
    id: "speed",
    name: "Speed / distance / time",
    nameKm: "ល្បឿន / ចម្ងាយ / ពេលវេលា",
    latex: "s = d / t",
    vars: [
      { key: "s", label: "Speed (m/s)" },
      { key: "d", label: "Distance (m)" },
      { key: "t", label: "Time (s)" },
    ],
    solve: (t, v) => (t === "s" ? v.d / v.t : t === "d" ? v.s * v.t : v.d / v.s),
  },
  {
    id: "density",
    name: "Density",
    nameKm: "ដង់ស៊ីតេ",
    latex: "ρ = m / V",
    vars: [
      { key: "ρ", label: "Density (kg/m³)" },
      { key: "m", label: "Mass (kg)" },
      { key: "V", label: "Volume (m³)" },
    ],
    solve: (t, v) => (t === "ρ" ? v.m / v.V : t === "m" ? v["ρ"] * v.V : v.m / v["ρ"]),
  },
  {
    id: "ohms-law",
    name: "Ohm's law",
    nameKm: "ច្បាប់អូម",
    latex: "V = I × R",
    vars: [
      { key: "V", label: "Voltage (V)" },
      { key: "I", label: "Current (A)" },
      { key: "R", label: "Resistance (Ω)" },
    ],
    solve: (t, v) => (t === "V" ? v.I * v.R : t === "I" ? v.V / v.R : v.V / v.I),
  },
  {
    id: "force",
    name: "Force (Newton's 2nd law)",
    nameKm: "កម្លាំង (ច្បាប់ទី២ ញូតុន)",
    latex: "F = m × a",
    vars: [
      { key: "F", label: "Force (N)" },
      { key: "m", label: "Mass (kg)" },
      { key: "a", label: "Acceleration (m/s²)" },
    ],
    solve: (t, v) => (t === "F" ? v.m * v.a : t === "m" ? v.F / v.a : v.F / v.m),
  },
  {
    id: "percentage",
    name: "Percentage",
    nameKm: "ភាគរយ",
    latex: "P = (part / whole) × 100",
    vars: [
      { key: "P", label: "Percent (%)" },
      { key: "part", label: "Part" },
      { key: "whole", label: "Whole" },
    ],
    solve: (t, v) => (t === "P" ? (v.part / v.whole) * 100 : t === "part" ? (v.P * v.whole) / 100 : (v.part * 100) / v.P),
  },
  {
    id: "pythagorean",
    name: "Pythagorean theorem",
    nameKm: "ទ្រឹស្តីបទពីតាហ្គោរ",
    latex: "c² = a² + b²",
    vars: [
      { key: "a", label: "Leg a (m)" },
      { key: "b", label: "Leg b (m)" },
      { key: "c", label: "Hypotenuse c (m)" },
    ],
    solve: (t, v) => {
      if (t === "c") return Math.sqrt(v.a * v.a + v.b * v.b);
      if (t === "a") {
        const x = v.c * v.c - v.b * v.b;
        return x >= 0 ? Math.sqrt(x) : null;
      }
      const x = v.c * v.c - v.a * v.a;
      return x >= 0 ? Math.sqrt(x) : null;
    },
  },
  {
    id: "simple-interest",
    name: "Simple interest",
    nameKm: "ការប្រាក់សាមញ្ញ",
    latex: "I = P × r × t",
    vars: [
      { key: "I", label: "Interest" },
      { key: "P", label: "Principal" },
      { key: "r", label: "Rate (%)" },
      { key: "t", label: "Time (years)" },
    ],
    solve: (t, v) => {
      if (t === "I") return v.P * (v.r / 100) * v.t;
      if (t === "P") return v.I / ((v.r / 100) * v.t);
      if (t === "r") return (v.I / (v.P * v.t)) * 100;
      return v.I / (v.P * (v.r / 100));
    },
  },
  {
    id: "sphere-volume",
    name: "Volume of a sphere",
    nameKm: "មាឌស៊្វែរ",
    latex: "V = 4/3 π r³",
    vars: [
      { key: "V", label: "Volume (m³)" },
      { key: "r", label: "Radius (m)" },
    ],
    solve: (t, v) => (t === "V" ? (4 / 3) * Math.PI * v.r ** 3 : v.V >= 0 ? Math.cbrt((3 * v.V) / (4 * Math.PI)) : null),
  },
  {
    id: "cylinder-volume",
    name: "Volume of a cylinder",
    nameKm: "មាឌស៊ីឡាំង",
    latex: "V = π r² h",
    vars: [
      { key: "V", label: "Volume (m³)" },
      { key: "r", label: "Radius (m)" },
      { key: "h", label: "Height (m)" },
    ],
    solve: (t, v) => (t === "V" ? Math.PI * v.r * v.r * v.h : t === "r" ? (v.V >= 0 && v.h ? Math.sqrt(v.V / (Math.PI * v.h)) : null) : v.V / (Math.PI * v.r * v.r)),
  },
  {
    id: "cone-volume",
    name: "Volume of a cone",
    nameKm: "មាឌកោណ",
    latex: "V = ⅓ π r² h",
    vars: [
      { key: "V", label: "Volume (m³)" },
      { key: "r", label: "Radius (m)" },
      { key: "h", label: "Height (m)" },
    ],
    solve: (t, v) => (t === "V" ? (Math.PI * v.r * v.r * v.h) / 3 : t === "r" ? (v.V >= 0 && v.h ? Math.sqrt((3 * v.V) / (Math.PI * v.h)) : null) : (3 * v.V) / (Math.PI * v.r * v.r)),
  },
];

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-6)) return n.toExponential(6);
  return String(Number(n.toPrecision(10)));
}

export default function FormulaSolver() {
  const [formulaId, setFormulaId] = useToolState("formula-solver:formula", FORMULAS[0].id);
  const [solveFor, setSolveFor] = useToolState("formula-solver:solveFor", FORMULAS[0].vars[0].key);
  const [vals, setVals] = useToolState<Record<string, string>>("formula-solver:vals", {});

  const formula = FORMULAS.find((f) => f.id === formulaId) ?? FORMULAS[0];
  const target = formula.vars.some((v) => v.key === solveFor) ? solveFor : formula.vars[0].key;
  const known = formula.vars.filter((v) => v.key !== target);

  const numbers: Record<string, number> = {};
  let allValid = true;
  for (const v of known) {
    const n = Number(vals[v.key]);
    if (vals[v.key] === undefined || vals[v.key] === "" || isNaN(n)) {
      allValid = false;
      break;
    }
    numbers[v.key] = n;
  }

  let result: number | null = null;
  let error = false;
  if (allValid) {
    result = formula.solve(target, numbers);
    if (result === null || !Number.isFinite(result)) {
      error = true;
      result = null;
    }
  }

  function changeFormula(id: string) {
    setFormulaId(id);
    const f = FORMULAS.find((x) => x.id === id) ?? FORMULAS[0];
    setSolveFor(f.vars[0].key);
    setVals({});
  }

  const targetDef = formula.vars.find((v) => v.key === target)!;

  return (
    <ToolShell
      title="Formula Solver"
      description="Pick a formula, enter the values you know, and solve for any one variable."
    >
      <div className="space-y-4">
        <Field label="Formula">
          <Select value={formula.id} onChange={(e) => changeFormula(e.target.value)}>
            {FORMULAS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5 text-center font-mono-ui text-sm text-[var(--ink)]">
          {formula.latex}
        </div>

        <Field label="Solve for">
          <Select value={target} onChange={(e) => setSolveFor(e.target.value)}>
            {formula.vars.map((v) => (
              <option key={v.key} value={v.key}>
                {v.label}
              </option>
            ))}
          </Select>
        </Field>

        <Row>
          {known.map((v) => (
            <Field key={v.key} label={v.label}>
              <TextInput
                inputMode="decimal"
                value={vals[v.key] ?? ""}
                onChange={(e) => setVals((prev) => ({ ...prev, [v.key]: e.target.value }))}
                className="font-mono-ui"
              />
            </Field>
          ))}
        </Row>

        <Output label={targetDef.label} value={result !== null ? fmt(result) : ""} error={error} />
      </div>
    </ToolShell>
  );
}