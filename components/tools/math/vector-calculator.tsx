"use client";
import { ToolShell, TextInput, Field, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "";
  const r = Number(n.toPrecision(9));
  return String(Math.abs(r) < 1e-12 ? 0 : r);
}

function vec(...parts: number[]): string {
  return `(${parts.map(fmt).join(", ")})`;
}

export default function VectorCalculator() {
  const [dim, setDim] = useToolState("vector-calculator:dim", "3");
  const [ax, setAx] = useToolState("vector-calculator:ax", "1");
  const [ay, setAy] = useToolState("vector-calculator:ay", "2");
  const [az, setAz] = useToolState("vector-calculator:az", "3");
  const [bx, setBx] = useToolState("vector-calculator:bx", "4");
  const [by, setBy] = useToolState("vector-calculator:by", "5");
  const [bz, setBz] = useToolState("vector-calculator:bz", "6");

  const is3D = dim === "3";
  const partsA = is3D ? [ax, ay, az] : [ax, ay];
  const partsB = is3D ? [bx, by, bz] : [bx, by];
  const numA = partsA.map(Number);
  const numB = partsB.map(Number);
  const valid = [...numA, ...numB].every((v) => !isNaN(v));

  const dot = valid ? numA.reduce((s, v, i) => s + v * numB[i], 0) : NaN;
  const magA = valid ? Math.hypot(...numA) : NaN;
  const magB = valid ? Math.hypot(...numB) : NaN;
  const angle = valid && magA > 0 && magB > 0 ? Math.acos(Math.min(1, Math.max(-1, dot / (magA * magB)))) * (180 / Math.PI) : NaN;
  const add = valid ? numA.map((v, i) => v + numB[i]) : null;
  const sub = valid ? numA.map((v, i) => v - numB[i]) : null;
  const cross = valid && is3D ? [numA[1] * numB[2] - numA[2] * numB[1], numA[2] * numB[0] - numA[0] * numB[2], numA[0] * numB[1] - numA[1] * numB[0]] : null;
  const cross2D = valid && !is3D ? numA[0] * numB[1] - numA[1] * numB[0] : NaN;
  const proj = valid && magB > 0 ? numB.map((v) => (dot / (magB * magB)) * v) : null;

  return (
    <ToolShell
      title="Vector Calculator"
      description="Dot and cross products, magnitude, angle, and projection for 2D and 3D vectors."
    >
      <div className="space-y-4">
        <Field label="Dimension">
          <Select value={dim} onChange={(e) => setDim(e.target.value)}>
            <option value="2">2D</option>
            <option value="3">3D</option>
          </Select>
        </Field>

        <Row>
          <Field label="Vector A">
            <div className="flex gap-2">
              <TextInput inputMode="decimal" value={ax} onChange={(e) => setAx(e.target.value)} className="font-mono-ui" />
              <TextInput inputMode="decimal" value={ay} onChange={(e) => setAy(e.target.value)} className="font-mono-ui" />
              {is3D && <TextInput inputMode="decimal" value={az} onChange={(e) => setAz(e.target.value)} className="font-mono-ui" />}
            </div>
          </Field>
          <Field label="Vector B">
            <div className="flex gap-2">
              <TextInput inputMode="decimal" value={bx} onChange={(e) => setBx(e.target.value)} className="font-mono-ui" />
              <TextInput inputMode="decimal" value={by} onChange={(e) => setBy(e.target.value)} className="font-mono-ui" />
              {is3D && <TextInput inputMode="decimal" value={bz} onChange={(e) => setBz(e.target.value)} className="font-mono-ui" />}
            </div>
          </Field>
        </Row>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Output label="Magnitude |A|" value={valid ? fmt(magA) : ""} error={!valid} />
          <Output label="Magnitude |B|" value={valid ? fmt(magB) : ""} error={!valid} />
          <Output label="Dot product (A·B)" value={valid ? fmt(dot) : ""} error={!valid} />
          {is3D ? (
            <Output label="Cross product (A×B)" value={valid && cross ? vec(...cross) : ""} error={!valid} />
          ) : (
            <Output label="Cross product (A×B)" value={valid ? fmt(cross2D) : ""} error={!valid} />
          )}
          <Output label="Angle between (°)" value={valid ? fmt(angle) : ""} error={!valid} />
          <Output label="Projection of A onto B" value={valid && proj ? vec(...proj) : ""} error={!valid} />
          <Output label="A + B" value={valid && add ? vec(...add) : ""} error={!valid} />
          <Output label="A − B" value={valid && sub ? vec(...sub) : ""} error={!valid} />
        </div>
      </div>
    </ToolShell>
  );
}