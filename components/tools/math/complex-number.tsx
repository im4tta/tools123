"use client";
import { ToolShell, TextInput, Field, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

type Op = "add" | "subtract" | "multiply" | "divide";

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-6)) return n.toExponential(6);
  return String(Number(n.toPrecision(10)));
}

function formatComplex(x: number, y: number): string {
  const xi = Math.abs(x) < 1e-12 ? 0 : x;
  const yi = Math.abs(y) < 1e-12 ? 0 : y;
  const rx = fmt(xi);
  const ry = fmt(Math.abs(yi));
  if (yi === 0) return rx || "0";
  const sign = yi < 0 ? " − " : " + ";
  const mag = Math.abs(yi) === 1 ? "" : ry;
  if (xi === 0) return `${yi < 0 ? "−" : ""}${mag}i`;
  return `${rx}${sign}${mag}i`;
}

export default function ComplexNumberCalculator() {
  const [aStr, setA] = useToolState("complex-number:a", "3");
  const [bStr, setB] = useToolState("complex-number:b", "4");
  const [cStr, setC] = useToolState("complex-number:c", "1");
  const [dStr, setD] = useToolState("complex-number:d", "-2");
  const [op, setOp] = useToolState<Op>("complex-number:op", "multiply");

  const a = Number(aStr);
  const b = Number(bStr);
  const c = Number(cStr);
  const d = Number(dStr);
  const valid = [a, b, c, d].every((v) => !isNaN(v));

  let x = 0;
  let y = 0;
  let error = false;
  if (valid) {
    if (op === "add") {
      x = a + c;
      y = b + d;
    } else if (op === "subtract") {
      x = a - c;
      y = b - d;
    } else if (op === "multiply") {
      x = a * c - b * d;
      y = a * d + b * c;
    } else {
      const denom = c * c + d * d;
      if (denom === 0) {
        error = true;
      } else {
        x = (a * c + b * d) / denom;
        y = (b * c - a * d) / denom;
      }
    }
  }

  const modulus = valid && !error ? Math.hypot(x, y) : NaN;
  const arg = valid && !error ? Math.atan2(y, x) : NaN;
  const argDeg = Number.isFinite(arg) ? (arg * 180) / Math.PI : NaN;

  return (
    <ToolShell
      title="Complex Number Calculator"
      description="Add, subtract, multiply, and divide complex numbers (a + bi), with modulus, argument, and conjugate."
    >
      <div className="space-y-4">
        <Field label="Operation">
          <Select value={op} onChange={(e) => setOp(e.target.value as Op)}>
            <option value="add">Addition (a + b)</option>
            <option value="subtract">Subtraction (a − b)</option>
            <option value="multiply">Multiplication (a × b)</option>
            <option value="divide">Division (a ÷ b)</option>
          </Select>
        </Field>

        <Row>
          <Field label="z₁ real part (a)">
            <TextInput inputMode="decimal" value={aStr} onChange={(e) => setA(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label="z₁ imaginary part (b)">
            <TextInput inputMode="decimal" value={bStr} onChange={(e) => setB(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label="z₂ real part (c)">
            <TextInput inputMode="decimal" value={cStr} onChange={(e) => setC(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label="z₂ imaginary part (d)">
            <TextInput inputMode="decimal" value={dStr} onChange={(e) => setD(e.target.value)} className="font-mono-ui" />
          </Field>
        </Row>

        <Output label="Result" value={valid && !error ? formatComplex(x, y) : ""} error={!valid || error} />
        <Row>
          <Output label="Modulus |z|" value={valid && !error ? fmt(modulus) : ""} error={!valid || error} />
          <Output label="Argument (rad)" value={valid && !error ? fmt(arg) : ""} error={!valid || error} />
        </Row>
        <Row>
          <Output label="Argument (°)" value={valid && !error ? fmt(argDeg) : ""} error={!valid || error} />
          <Output label="Conjugate" value={valid && !error ? formatComplex(x, -y) : ""} error={!valid || error} />
        </Row>
      </div>
    </ToolShell>
  );
}