"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const TO_SQM: Record<string, number> = {
  "m²": 1,
  "ha": 10000,
  "km²": 1_000_000,
  "acre": 4046.8564224,
  "rai (Thai/Khmer land unit)": 1600,
};

export default function AreaUnits() {
  const [value, setValue] = useToolState("area-units:value", "1");
  const [unit, setUnit] = useToolState("area-units:unit", "ha");
  const sqm = useMemo(() => {
    const n = Number(value);
    return isNaN(n) ? null : n * TO_SQM[unit];
  }, [value, unit]);

  return (
    <ToolShell title="Area Unit Converter" description="Convert between square meters, hectares, km², acres, and rai — mixed units seen across Cambodian land documents.">
      <div className="flex items-end gap-3">
        <Field label="Value"><TextInput value={value} onChange={(e) => setValue(e.target.value)} className="w-40 font-mono-ui" /></Field>
        <Field label="Unit">
          <Select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-64">
            {Object.keys(TO_SQM).map((u) => <option key={u} value={u}>{u}</option>)}
          </Select>
        </Field>
      </div>
      <div className="space-y-2">
        {Object.entries(TO_SQM).map(([u, factor]) => (
          <Output key={u} label={u} value={sqm === null ? "" : (sqm / factor).toLocaleString(undefined, { maximumFractionDigits: 4 })} />
        ))}
      </div>
    </ToolShell>
  );
}
