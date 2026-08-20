"use client";
import { ToolShell, TextInput, Field, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

interface Dim {
  key: string;
  label: string;
}

interface Shape {
  id: string;
  name: string;
  nameKm: string;
  group: "2D" | "3D";
  dims: Dim[];
  outputs: (v: Record<string, number>) => { label: string; value: number }[];
}

const SHAPES: Shape[] = [
  {
    id: "circle",
    name: "Circle",
    nameKm: "រង្វង់",
    group: "2D",
    dims: [{ key: "r", label: "Radius (r)" }],
    outputs: (v) => [
      { label: "Area", value: Math.PI * v.r * v.r },
      { label: "Circumference", value: 2 * Math.PI * v.r },
    ],
  },
  {
    id: "rectangle",
    name: "Rectangle",
    nameKm: "ចតុកោណកែង",
    group: "2D",
    dims: [
      { key: "l", label: "Length (l)" },
      { key: "w", label: "Width (w)" },
    ],
    outputs: (v) => [
      { label: "Area", value: v.l * v.w },
      { label: "Perimeter", value: 2 * (v.l + v.w) },
    ],
  },
  {
    id: "triangle",
    name: "Triangle",
    nameKm: "ត្រីកោណ",
    group: "2D",
    dims: [
      { key: "b", label: "Base (b)" },
      { key: "h", label: "Height (h)" },
    ],
    outputs: (v) => [{ label: "Area", value: 0.5 * v.b * v.h }],
  },
  {
    id: "sphere",
    name: "Sphere",
    nameKm: "ស៊្វែរ",
    group: "3D",
    dims: [{ key: "r", label: "Radius (r)" }],
    outputs: (v) => [
      { label: "Volume", value: (4 / 3) * Math.PI * v.r ** 3 },
      { label: "Surface area", value: 4 * Math.PI * v.r * v.r },
    ],
  },
  {
    id: "cube",
    name: "Cube",
    nameKm: "គូប",
    group: "3D",
    dims: [{ key: "a", label: "Side (a)" }],
    outputs: (v) => [
      { label: "Volume", value: v.a ** 3 },
      { label: "Surface area", value: 6 * v.a * v.a },
    ],
  },
  {
    id: "cylinder",
    name: "Cylinder",
    nameKm: "ស៊ីឡាំង",
    group: "3D",
    dims: [
      { key: "r", label: "Radius (r)" },
      { key: "h", label: "Height (h)" },
    ],
    outputs: (v) => [
      { label: "Volume", value: Math.PI * v.r * v.r * v.h },
      { label: "Surface area", value: 2 * Math.PI * v.r * (v.r + v.h) },
    ],
  },
  {
    id: "cone",
    name: "Cone",
    nameKm: "កោណ",
    group: "3D",
    dims: [
      { key: "r", label: "Radius (r)" },
      { key: "h", label: "Height (h)" },
    ],
    outputs: (v) => [
      { label: "Volume", value: (Math.PI * v.r * v.r * v.h) / 3 },
      { label: "Surface area", value: Math.PI * v.r * (v.r + Math.sqrt(v.r * v.r + v.h * v.h)) },
    ],
  },
  {
    id: "prism",
    name: "Rectangular prism",
    nameKm: "ព្រីសចតុកោណ",
    group: "3D",
    dims: [
      { key: "l", label: "Length (l)" },
      { key: "w", label: "Width (w)" },
      { key: "h", label: "Height (h)" },
    ],
    outputs: (v) => [
      { label: "Volume", value: v.l * v.w * v.h },
      { label: "Surface area", value: 2 * (v.l * v.w + v.l * v.h + v.w * v.h) },
    ],
  },
];

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-6)) return n.toExponential(6);
  return String(Number(n.toPrecision(10)));
}

export default function GeometryCalculator() {
  const [shapeId, setShapeId] = useToolState("geometry-calculator:shape", "circle");
  const [vals, setVals] = useToolState<Record<string, string>>("geometry-calculator:vals", {});

  const shape = SHAPES.find((s) => s.id === shapeId) ?? SHAPES[0];

  const numbers: Record<string, number> = {};
  let valid = true;
  for (const d of shape.dims) {
    const n = Number(vals[d.key]);
    if (vals[d.key] === undefined || vals[d.key] === "" || isNaN(n) || n < 0) {
      valid = false;
      break;
    }
    numbers[d.key] = n;
  }

  const outputs = valid ? shape.outputs(numbers) : [];

  function changeShape(id: string) {
    setShapeId(id);
    setVals({});
  }

  return (
    <ToolShell
      title="Geometry Area & Volume Calculator"
      description="Compute area, perimeter, volume, and surface area for common 2D and 3D shapes."
    >
      <div className="space-y-4">
        <Field label="Shape">
          <Select value={shape.id} onChange={(e) => changeShape(e.target.value)}>
            <optgroup label="2D shapes">
              {SHAPES.filter((s) => s.group === "2D").map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="3D shapes">
              {SHAPES.filter((s) => s.group === "3D").map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          </Select>
        </Field>

        <Row>
          {shape.dims.map((d) => (
            <Field key={d.key} label={d.label}>
              <TextInput
                inputMode="decimal"
                value={vals[d.key] ?? ""}
                onChange={(e) => setVals((prev) => ({ ...prev, [d.key]: e.target.value }))}
                className="font-mono-ui"
              />
            </Field>
          ))}
        </Row>

        {outputs.map((o) => (
          <Output key={o.label} label={o.label} value={fmt(o.value)} error={!valid} />
        ))}
      </div>
    </ToolShell>
  );
}