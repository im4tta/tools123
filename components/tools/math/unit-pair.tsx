"use client";
import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

// Factor = how many base units are in one of this unit (base unit factor = 1)
export const UNIT_CATEGORY_FACTORS: Record<string, Record<string, number>> = {
  length: {
    meter: 1, kilometer: 1000, centimeter: 0.01, millimeter: 0.001,
    mile: 1609.344, yard: 0.9144, foot: 0.3048, inch: 0.0254,
  },
  mass: {
    kilogram: 1, gram: 0.001, milligram: 0.000001,
    pound: 0.45359237, ounce: 0.028349523125, "metric ton": 1000, stone: 6.35029318,
  },
  volume: {
    liter: 1, milliliter: 0.001, "cubic meter": 1000,
    gallon: 3.785411784, quart: 0.946352946, pint: 0.473176473, cup: 0.2365882365, "fluid ounce": 0.0295735296,
  },
  area: {
    "square meter": 1, "square kilometer": 1000000, hectare: 10000,
    "square foot": 0.09290304, "square yard": 0.83612736, acre: 4046.8564224, "square mile": 2589988.110336,
  },
  speed: {
    "meter/second": 1, "kilometer/hour": 0.2777778, "mile/hour": 0.44704, knot: 0.5144444, "foot/second": 0.3048,
  },
  pressure: {
    pascal: 1, kilopascal: 1000, bar: 100000, psi: 6894.757293168, atmosphere: 101325, torr: 133.322368421,
  },
  energy: {
    joule: 1, kilojoule: 1000, calorie: 4.184, kilocalorie: 4184,
    "watt-hour": 3600, "kilowatt-hour": 3600000, BTU: 1055.05585262,
  },
  power: {
    watt: 1, kilowatt: 1000, horsepower: 745.699872, "BTU/hour": 0.29307107,
  },
  data: {
    byte: 1, kilobyte: 1000, megabyte: 1000000, gigabyte: 1000000000, terabyte: 1000000000000,
    bit: 0.125, kibibyte: 1024, mebibyte: 1048576,
  },
  time: {
    second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, year: 31556952,
  },
};

function cap(s: string) {
  return s.replace(/(^|\s|\/)([a-z])/g, (_, p, c) => p + c.toUpperCase());
}

export default function UnitPair({ categoryKey, from, to }: { categoryKey: string; from: string; to: string }) {
  const [swapped, setSwapped] = useState(false);
  const a = swapped ? to : from;
  const b = swapped ? from : to;
  const [value, setValue] = useToolState(`unit-pair:${categoryKey}:${from}:${to}:value`, "1");

  const factors = UNIT_CATEGORY_FACTORS[categoryKey] ?? {};
  const fFactor = factors[a] ?? 1;
  const tFactor = factors[b] ?? 1;

  function convert() {
    const v = Number(value);
    if (isNaN(v)) return "";
    return ((v * fFactor) / tFactor).toLocaleString(undefined, { maximumFractionDigits: 8 });
  }

  return (
    <ToolShell
      title={`${cap(a)} ⟷ ${cap(b)}`}
      description={`Convert between ${cap(a)} and ${cap(b)}.`}
    >
      <Row>
        <Field label={cap(a)}>
          <TextInput value={value} onChange={(e) => setValue(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label=" ">
          <button
            type="button"
            onClick={() => setSwapped((s) => !s)}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] text-xs text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]"
          >
            <ArrowLeftRight size={12} /> Swap
          </button>
        </Field>
      </Row>
      <Output label={cap(b)} value={convert()} />
    </ToolShell>
  );
}
