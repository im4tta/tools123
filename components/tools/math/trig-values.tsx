"use client";
import { ToolShell, TextInput, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

interface Special {
  deg: number;
  rad: string;
  sin: string;
  cos: string;
  tan: string;
}

const SPECIAL: Special[] = [
  { deg: 0, rad: "0", sin: "0", cos: "1", tan: "0" },
  { deg: 30, rad: "π/6", sin: "1/2", cos: "√3/2", tan: "√3/3" },
  { deg: 45, rad: "π/4", sin: "√2/2", cos: "√2/2", tan: "1" },
  { deg: 60, rad: "π/3", sin: "√3/2", cos: "1/2", tan: "√3" },
  { deg: 90, rad: "π/2", sin: "1", cos: "0", tan: "undefined" },
  { deg: 120, rad: "2π/3", sin: "√3/2", cos: "−1/2", tan: "−√3" },
  { deg: 135, rad: "3π/4", sin: "√2/2", cos: "−√2/2", tan: "−1" },
  { deg: 150, rad: "5π/6", sin: "1/2", cos: "−√3/2", tan: "−√3/3" },
  { deg: 180, rad: "π", sin: "0", cos: "−1", tan: "0" },
  { deg: 270, rad: "3π/2", sin: "−1", cos: "0", tan: "undefined" },
  { deg: 360, rad: "2π", sin: "0", cos: "1", tan: "0" },
];

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "";
  return String(Number(n.toPrecision(12)));
}

export default function TrigValues() {
  const [unit, setUnit] = useToolState<"deg" | "rad">("trig-values:unit", "deg");
  const [angleStr, setAngle] = useToolState("trig-values:angle", "45");

  const raw = Number(angleStr);
  const valid = !isNaN(raw) && angleStr !== "";
  const radians = unit === "deg" ? (raw * Math.PI) / 180 : raw;
  const sin = valid ? Math.sin(radians) : NaN;
  const cos = valid ? Math.cos(radians) : NaN;
  const tan = valid ? Math.tan(radians) : NaN;
  const tanValid = valid && Math.abs(Math.cos(radians)) > 1e-12;

  return (
    <ToolShell
      title="Trig Values Table"
      description="Exact sine, cosine, and tangent for common angles, plus a calculator for any angle."
    >
      <div className="space-y-5">
        <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--ground-line)] bg-[var(--ground-raised)] text-xs uppercase tracking-wide text-[var(--ink-dim)]">
                <th className="px-3 py-2 text-left">Angle (°)</th>
                <th className="px-3 py-2 text-left">Radians</th>
                <th className="px-3 py-2 text-right">sin</th>
                <th className="px-3 py-2 text-right">cos</th>
                <th className="px-3 py-2 text-right">tan</th>
              </tr>
            </thead>
            <tbody>
              {SPECIAL.map((row) => (
                <tr key={row.deg} className="border-b border-[var(--ground-line)] last:border-0">
                  <td className="px-3 py-2 font-medium text-[var(--ink)]">{row.deg}°</td>
                  <td className="px-3 py-2 font-mono-ui text-[var(--ink-dim)]">{row.rad}</td>
                  <td className="px-3 py-2 text-right font-mono-ui text-[var(--ink)]">{row.sin}</td>
                  <td className="px-3 py-2 text-right font-mono-ui text-[var(--ink)]">{row.cos}</td>
                  <td className="px-3 py-2 text-right font-mono-ui text-[var(--ink)]">{row.tan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--ground-line)] pt-4">
          <div className="mb-4 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Any angle</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
            <Field label="Angle">
              <TextInput inputMode="decimal" value={angleStr} onChange={(e) => setAngle(e.target.value)} className="font-mono-ui" />
            </Field>
            <Field label="Unit">
              <Select value={unit} onChange={(e) => setUnit(e.target.value as "deg" | "rad")}>
                <option value="deg">Degrees (°)</option>
                <option value="rad">Radians</option>
              </Select>
            </Field>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Output label="sin" value={valid ? fmt(sin) : ""} error={!valid} />
            <Output label="cos" value={valid ? fmt(cos) : ""} error={!valid} />
            <Output label="tan" value={valid && tanValid ? fmt(tan) : ""} error={!valid || !tanValid} />
          </div>
        </div>
      </div>
    </ToolShell>
  );
}