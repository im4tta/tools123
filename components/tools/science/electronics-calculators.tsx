"use client";
import { ToolShell, TextInput, Field, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const COLORS: Record<string, { hex: string; digit: number | null; mult: number; tol: number | null }> = {
  Black: { hex: "#111111", digit: 0, mult: 1, tol: null },
  Brown: { hex: "#8b5a2b", digit: 1, mult: 10, tol: 1 },
  Red: { hex: "#e53935", digit: 2, mult: 100, tol: 2 },
  Orange: { hex: "#fb8c00", digit: 3, mult: 1e3, tol: null },
  Yellow: { hex: "#fdd835", digit: 4, mult: 1e4, tol: null },
  Green: { hex: "#43a047", digit: 5, mult: 1e5, tol: 0.5 },
  Blue: { hex: "#1e88e5", digit: 6, mult: 1e6, tol: 0.25 },
  Violet: { hex: "#8e24aa", digit: 7, mult: 1e7, tol: 0.1 },
  Grey: { hex: "#9e9e9e", digit: 8, mult: 1e8, tol: null },
  White: { hex: "#f5f5f5", digit: 9, mult: 1e9, tol: null },
  Gold: { hex: "#c9a227", digit: null, mult: 0.1, tol: 5 },
  Silver: { hex: "#bdbdbd", digit: null, mult: 0.01, tol: 10 },
};

const DIGIT_KEYS = ["Black", "Brown", "Red", "Orange", "Yellow", "Green", "Blue", "Violet", "Grey", "White"];
const MULTIPLIER_KEYS = ["Black", "Brown", "Red", "Orange", "Yellow", "Green", "Blue", "Violet", "Gold", "Silver"];
const TOLERANCE_KEYS = ["Brown", "Red", "Green", "Blue", "Violet", "Gold", "Silver"];

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e9 || abs < 1e-6)) return n.toExponential(6);
  return String(Number(n.toPrecision(9)));
}

function formatOhms(ohms: number): string {
  if (!Number.isFinite(ohms)) return "";
  const abs = Math.abs(ohms);
  if (abs >= 1e6) return `${fmt(ohms / 1e6)} MΩ`;
  if (abs >= 1e3) return `${fmt(ohms / 1e3)} kΩ`;
  if (abs >= 1) return `${fmt(ohms)} Ω`;
  if (abs >= 1e-3) return `${fmt(ohms * 1e3)} mΩ`;
  return `${fmt(ohms)} Ω`;
}

function nearestE24(ohms: number): number {
  const E24 = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];
  if (ohms <= 0) return ohms;
  const exp = Math.floor(Math.log10(ohms));
  const mant = ohms / 10 ** exp;
  let best = E24[0];
  for (const e of E24) if (Math.abs(e - mant) < Math.abs(best - mant)) best = e;
  return best * 10 ** exp;
}

function Band({ value, colors, onChange, label }: { value: string; colors: string[]; onChange: (v: string) => void; label: string }) {
  return (
    <Field label={label}>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {colors.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function BandStrip({ colors }: { colors: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {colors.map((c, i) => (
        <span
          key={i}
          className="inline-block h-6 w-3 rounded-sm border border-[var(--ground-line)]"
          style={{ background: COLORS[c]?.hex ?? "#888888" }}
          title={c}
        />
      ))}
    </div>
  );
}

export default function ElectronicsCalculators() {
  const { text } = useLanguage();
  // Resistor color code (4-band)
  const [b1, setB1] = useToolState("electronics:b1", "Yellow");
  const [b2, setB2] = useToolState("electronics:b2", "Violet");
  const [mult, setMult] = useToolState("electronics:mult", "Red");
  const [tol, setTol] = useToolState("electronics:tol", "Gold");
  // Value → bands
  const [valueStr, setValueStr] = useToolState("electronics:value", "4700");
  // LED series resistor
  const [vsStr, setVs] = useToolState("electronics:vs", "5");
  const [vfStr, setVf] = useToolState("electronics:vf", "2");
  const [ifStr, setIf] = useToolState("electronics:if", "20");
  // Voltage divider
  const [vinStr, setVin] = useToolState("electronics:vin", "5");
  const [r1Str, setR1] = useToolState("electronics:r1", "10000");
  const [r2Str, setR2] = useToolState("electronics:r2", "10000");
  // Ohm's law
  const [solveFor, setSolveFor] = useToolState("electronics:ohmSolve", "R");
  const [vStr, setV] = useToolState("electronics:V", "12");
  const [iStr, setI] = useToolState("electronics:I", "");
  const [rStr, setR] = useToolState("electronics:R", "");

  const d1 = COLORS[b1]?.digit;
  const d2 = COLORS[b2]?.digit;
  const m = COLORS[mult]?.mult;
  const t = COLORS[tol]?.tol;
  const resistorValid = d1 !== null && d2 !== null && m !== undefined && d1 !== undefined && d2 !== undefined;
  const resistorOhms = resistorValid ? (d1! * 10 + d2!) * m : NaN;

  function parseOhms(s: string): number | null {
    const text = s.trim().toLowerCase();
    const match = text.match(/^(\d*\.?\d+)\s*([kmr]?)(?:ohm|Ω)?$/);
    if (!match) return null;
    const n = Number(match[1]);
    const suffix = match[2];
    if (suffix === "k") return n * 1e3;
    if (suffix === "m") return n * 1e6;
    return n;
  }
  const targetOhms = parseOhms(valueStr);
  let bands = null as null | { d1: number; d2: number; m: number };
  if (targetOhms !== null && targetOhms > 0 && Number.isFinite(targetOhms)) {
    const rounded = nearestE24(targetOhms);
    const exp = Math.floor(Math.log10(rounded));
    const mant = rounded / 10 ** exp;
    let a = Math.floor(mant);
    let b = Math.round((mant - a) * 10);
    if (b === 10) { a += 1; b = 0; }
    if (a === 10) { a = 1; /* exp stays */ }
    bands = { d1: a, d2: b, m: exp - 1 };
  }
  const digitColor = (n: number) => DIGIT_KEYS[n];
  const multColor = (mm: number) => {
    const map: Record<string, string> = { "-2": "Silver", "-1": "Gold", "0": "Black", "1": "Brown", "2": "Red", "3": "Orange", "4": "Yellow", "5": "Green", "6": "Blue", "7": "Violet" };
    return map[String(mm)] ?? null;
  };

  // LED series resistor
  const vs = Number(vsStr);
  const vf = Number(vfStr);
  const iF = Number(ifStr);
  const ledValid = [vs, vf, iF].every((x) => !isNaN(x) && Number.isFinite(x));
  const ledCurrent = iF / 1000;
  const ledR = ledValid && ledCurrent > 0 ? (vs - vf) / ledCurrent : NaN;
  const ledRValid = ledValid && ledCurrent > 0 && ledR > 0;
  const ledRounded = ledRValid ? nearestE24(ledR) : NaN;
  const ledPower = ledRValid ? (vs - vf) * ledCurrent : NaN;

  // Voltage divider
  const vin = Number(vinStr);
  const r1 = Number(r1Str);
  const r2 = Number(r2Str);
  const divValid = [vin, r1, r2].every((x) => !isNaN(x) && x >= 0) && r1 + r2 > 0;
  const vout = divValid ? (vin * r2) / (r1 + r2) : NaN;
  const divCurrent = divValid ? vin / (r1 + r2) : NaN;

  // Ohm's law (solve for V / I / R, plus power)
  const vNum = Number(vStr);
  const iNum = Number(iStr);
  const rNum = Number(rStr);
  let ohmResult = "";
  let ohmError = false;
  let power = "";
  const hasV = vStr !== "" && !isNaN(vNum);
  const hasI = iStr !== "" && !isNaN(iNum);
  const hasR = rStr !== "" && !isNaN(rNum);
  if (solveFor === "R" && hasV && hasI && iNum !== 0) {
    ohmResult = fmt(vNum / iNum);
    power = fmt(vNum * iNum);
  } else if (solveFor === "I" && hasV && hasR && rNum !== 0) {
    ohmResult = fmt(vNum / rNum);
    power = fmt((vNum * vNum) / rNum);
  } else if (solveFor === "V" && hasI && hasR) {
    ohmResult = fmt(iNum * rNum);
    power = fmt(iNum * iNum * rNum);
  } else if (hasV && hasI && hasR && (solveFor === "R" || solveFor === "I" || solveFor === "V")) {
    ohmError = true;
  }

  return (
    <ToolShell
      title="Electronics Calculators"
      description="Resistor color codes, LED series resistors, voltage dividers, and Ohm's law."
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--ink)]">{text("Resistor color code (4-band)", "កូដពណ៌រេស៊ីស្ទ័រ (៤ខ្សែ)")}</h2>
          <Row>
            <Band label="Band 1" value={b1} colors={DIGIT_KEYS} onChange={setB1} />
            <Band label="Band 2" value={b2} colors={DIGIT_KEYS} onChange={setB2} />
            <Band label="Multiplier" value={mult} colors={MULTIPLIER_KEYS} onChange={setMult} />
            <Band label="Tolerance" value={tol} colors={TOLERANCE_KEYS} onChange={setTol} />
          </Row>
          <div className="flex items-center gap-4">
            <BandStrip colors={[b1, b2, mult, tol]} />
            <Output label="Resistance" value={resistorValid ? formatOhms(resistorOhms) : ""} error={!resistorValid} />
          </div>
          {resistorValid && t != null && (
            <div className="text-xs text-[var(--ink-faint)]">
              {text("Tolerance", "ភាពអត់ឱន")} ±{fmt(t)}%
            </div>
          )}
        </section>

        <section className="space-y-3 border-t border-[var(--ground-line)] pt-4">
          <h2 className="text-sm font-semibold text-[var(--ink)]">{text("Resistor value → color bands", "តម្លៃរេស៊ីស្ទ័រ → ខ្សែពណ៌")}</h2>
          <Field label="Resistance (e.g. 4700, 4.7k, 1M)">
            <TextInput inputMode="decimal" value={valueStr} onChange={(e) => setValueStr(e.target.value)} className="font-mono-ui" />
          </Field>
          {targetOhms !== null && targetOhms > 0 && bands ? (
            <div className="flex items-center gap-4">
              <BandStrip colors={[digitColor(bands.d1), digitColor(bands.d2), multColor(bands.m) ?? "Gold", "Gold"]} />
              <div className="text-xs text-[var(--ink-dim)]">
                ≈ {formatOhms(nearestE24(targetOhms))} · {bands.d1}{bands.d2} × 10^{bands.m}
              </div>
            </div>
          ) : (
            <div className="text-xs text-[var(--ink-faint)]">{text("Enter a resistance value.", "បញ្ចូលតម្លៃរេស៊ីស្ទ័រ។")}</div>
          )}
        </section>

        <section className="space-y-3 border-t border-[var(--ground-line)] pt-4">
          <h2 className="text-sm font-semibold text-[var(--ink)]">{text("LED series resistor", "រេស៊ីស្ទ័រ LED")}</h2>
          <Row>
            <Field label="Supply voltage (V)">
              <TextInput inputMode="decimal" value={vsStr} onChange={(e) => setVs(e.target.value)} className="font-mono-ui" />
            </Field>
            <Field label="LED forward voltage (V)">
              <TextInput inputMode="decimal" value={vfStr} onChange={(e) => setVf(e.target.value)} className="font-mono-ui" />
            </Field>
            <Field label="LED current (mA)">
              <TextInput inputMode="decimal" value={ifStr} onChange={(e) => setIf(e.target.value)} className="font-mono-ui" />
            </Field>
          </Row>
          <Row>
            <Output label="Calculated resistor" value={ledRValid ? formatOhms(ledR) : ""} error={!ledRValid} />
            <Output label="Nearest standard (E24)" value={ledRValid ? formatOhms(ledRounded) : ""} error={!ledRValid} />
          </Row>
          <Output label="Power dissipated" value={ledRValid ? `${fmt(ledPower * 1000)} mW` : ""} error={!ledRValid} />
        </section>

        <section className="space-y-3 border-t border-[var(--ground-line)] pt-4">
          <h2 className="text-sm font-semibold text-[var(--ink)]">{text("Voltage divider", "បំរែបំរួលតង់ស្យុង")}</h2>
          <Row>
            <Field label="Input voltage (V)">
              <TextInput inputMode="decimal" value={vinStr} onChange={(e) => setVin(e.target.value)} className="font-mono-ui" />
            </Field>
            <Field label="R1 (Ω)">
              <TextInput inputMode="decimal" value={r1Str} onChange={(e) => setR1(e.target.value)} className="font-mono-ui" />
            </Field>
            <Field label="R2 (Ω)">
              <TextInput inputMode="decimal" value={r2Str} onChange={(e) => setR2(e.target.value)} className="font-mono-ui" />
            </Field>
          </Row>
          <Row>
            <Output label="Output voltage" value={divValid ? `${fmt(vout)} V` : ""} error={!divValid} />
            <Output label="Current" value={divValid ? `${fmt(divCurrent * 1000)} mA` : ""} error={!divValid} />
          </Row>
        </section>

        <section className="space-y-3 border-t border-[var(--ground-line)] pt-4">
          <h2 className="text-sm font-semibold text-[var(--ink)]">{text("Ohm's law", "ច្បាប់អូម")}</h2>
          <Field label="Solve for">
            <Select value={solveFor} onChange={(e) => setSolveFor(e.target.value)}>
              <option value="V">Voltage (V)</option>
              <option value="I">Current (I)</option>
              <option value="R">Resistance (R)</option>
            </Select>
          </Field>
          <Row>
            {solveFor !== "V" && (
              <Field label="Voltage (V)">
                <TextInput inputMode="decimal" value={vStr} onChange={(e) => setV(e.target.value)} className="font-mono-ui" />
              </Field>
            )}
            {solveFor !== "I" && (
              <Field label="Current (A)">
                <TextInput inputMode="decimal" value={iStr} onChange={(e) => setI(e.target.value)} className="font-mono-ui" />
              </Field>
            )}
            {solveFor !== "R" && (
              <Field label="Resistance (Ω)">
                <TextInput inputMode="decimal" value={rStr} onChange={(e) => setR(e.target.value)} className="font-mono-ui" />
              </Field>
            )}
          </Row>
          <Row>
            <Output label={solveFor === "V" ? "Voltage (V)" : solveFor === "I" ? "Current (A)" : "Resistance (Ω)"} value={ohmResult} error={ohmError} />
            <Output label="Power (W)" value={power} error={ohmError} />
          </Row>
        </section>
      </div>
    </ToolShell>
  );
}