"use client";
import { ToolShell, TextInput, Field, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-6)) return n.toExponential(8);
  return String(Number(n.toPrecision(12)));
}

export default function ExponentLogarithm() {
  // Power: a^b = c
  const [target, setTarget] = useToolState<string>("exponent-logarithm:target", "result");
  const [aStr, setA] = useToolState("exponent-logarithm:a", "2");
  const [bStr, setB] = useToolState("exponent-logarithm:b", "10");
  const [cStr, setC] = useToolState("exponent-logarithm:c", "");

  // Logarithm: log_a(x) = y
  const [baseStr, setBase] = useToolState("exponent-logarithm:logbase", "10");
  const [xStr, setX] = useToolState("exponent-logarithm:x", "100");

  let powerResult = "";
  let powerError = false;
  const a = Number(aStr);
  const b = Number(bStr);
  const c = Number(cStr);

  if (target === "result") {
    if (aStr !== "" && bStr !== "" && !isNaN(a) && !isNaN(b)) {
      const r = Math.pow(a, b);
      if (Number.isFinite(r)) powerResult = fmt(r);
      else powerError = true;
    }
  } else if (target === "base") {
    if (cStr !== "" && bStr !== "" && !isNaN(c) && !isNaN(b) && b !== 0) {
      const r = Math.pow(c, 1 / b);
      if (Number.isFinite(r)) powerResult = fmt(r);
      else powerError = true;
    } else if (b === 0) {
      powerError = true;
    }
  } else {
    if (cStr !== "" && aStr !== "" && !isNaN(c) && !isNaN(a) && c > 0 && a > 0 && a !== 1) {
      const r = Math.log(c) / Math.log(a);
      if (Number.isFinite(r)) powerResult = fmt(r);
      else powerError = true;
    } else if ((aStr !== "" && cStr !== "" && (!(c > 0 && a > 0 && a !== 1)))) {
      powerError = true;
    }
  }

  const logBase = Number(baseStr);
  const x = Number(xStr);
  const logValid = baseStr !== "" && xStr !== "" && !isNaN(logBase) && !isNaN(x) && logBase > 0 && logBase !== 1 && x > 0;
  const logResult = logValid ? Math.log(x) / Math.log(logBase) : NaN;

  return (
    <ToolShell
      title="Exponent & Logarithm Solver"
      description="Solve aᵇ = c for any one of base, exponent, or result, and compute logarithms in any base."
    >
      <div className="space-y-5">
        <div className="space-y-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">aᵇ = c</div>
          <Field label="Solve for">
            <Select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="result">Result (c)</option>
              <option value="base">Base (a)</option>
              <option value="exponent">Exponent (b)</option>
            </Select>
          </Field>
          <Row>
            {target !== "base" && (
              <Field label="Base (a)">
                <TextInput inputMode="decimal" value={aStr} onChange={(e) => setA(e.target.value)} className="font-mono-ui" />
              </Field>
            )}
            {target !== "exponent" && (
              <Field label="Exponent (b)">
                <TextInput inputMode="decimal" value={bStr} onChange={(e) => setB(e.target.value)} className="font-mono-ui" />
              </Field>
            )}
            {target !== "result" && (
              <Field label="Result (c)">
                <TextInput inputMode="decimal" value={cStr} onChange={(e) => setC(e.target.value)} className="font-mono-ui" />
              </Field>
            )}
          </Row>
          <Output label={target === "base" ? "Base (a)" : target === "exponent" ? "Exponent (b)" : "Result (c)"} value={powerResult} error={powerError} />
        </div>

        <div className="border-t border-[var(--ground-line)] pt-4">
          <div className="mb-4 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">logₐ(x)</div>
          <Row>
            <Field label="Base (a)">
              <TextInput inputMode="decimal" value={baseStr} onChange={(e) => setBase(e.target.value)} className="font-mono-ui" />
            </Field>
            <Field label="Argument (x)">
              <TextInput inputMode="decimal" value={xStr} onChange={(e) => setX(e.target.value)} className="font-mono-ui" />
            </Field>
          </Row>
          <Output label="logₐ(x)" value={logValid ? fmt(logResult) : ""} error={!(logValid || baseStr === "" || xStr === "")} />
        </div>
      </div>
    </ToolShell>
  );
}