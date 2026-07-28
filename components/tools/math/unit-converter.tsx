"use client";
import { ToolShell, TextInput, Field, Row, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const GROUPS: Record<string, Record<string, number>> = {
  Length: { meter: 1, kilometer: 1000, centimeter: 0.01, millimeter: 0.001, mile: 1609.344, yard: 0.9144, foot: 0.3048, inch: 0.0254 },
  Weight: { kilogram: 1, gram: 0.001, milligram: 0.000001, pound: 0.45359237, ounce: 0.0283495231, tonne: 1000 },
  Volume: { liter: 1, milliliter: 0.001, "cubic meter": 1000, gallon: 3.785411784, quart: 0.946352946, cup: 0.2365882365 },
};

export default function UnitConverter() {
  const [group, setGroup] = useToolState("unit-converter:group", "Length");
  const units = Object.keys(GROUPS[group]);
  const [from, setFrom] = useToolState("unit-converter:from", units[0]);
  const [to, setTo] = useToolState("unit-converter:to", units[1]);
  const [value, setValue] = useToolState("unit-converter:value", "1");

  function convert() {
    const u = GROUPS[group];
    const f = u[from] ?? u[Object.keys(u)[0]];
    const t = u[to] ?? u[Object.keys(u)[1]];
    const v = Number(value);
    if (isNaN(v)) return "";
    return ((v * f) / t).toLocaleString(undefined, { maximumFractionDigits: 6 });
  }

  function onGroupChange(g: string) {
    setGroup(g);
    const u = Object.keys(GROUPS[g]);
    setFrom(u[0]);
    setTo(u[1]);
  }

  return (
    <ToolShell title="Length / Weight / Volume Unit Converter" description="Convert between common units of length, weight, and volume.">
      <Field label="Category">
        <Select value={group} onChange={(e) => onGroupChange(e.target.value)}>
          {Object.keys(GROUPS).map((g) => <option key={g} value={g}>{g}</option>)}
        </Select>
      </Field>
      <Row>
        <Field label="Value"><TextInput value={value} onChange={(e) => setValue(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="From">
          <Select value={from} onChange={(e) => setFrom(e.target.value)}>
            {Object.keys(GROUPS[group]).map((u) => <option key={u} value={u}>{u}</option>)}
          </Select>
        </Field>
      </Row>
      <Field label="To">
        <Select value={to} onChange={(e) => setTo(e.target.value)}>
          {Object.keys(GROUPS[group]).map((u) => <option key={u} value={u}>{u}</option>)}
        </Select>
      </Field>
      <Output label="Result" value={convert()} />
    </ToolShell>
  );
}
