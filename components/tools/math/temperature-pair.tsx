"use client";
import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function toCelsius(v: number, unit: string) {
  if (unit === "celsius") return v;
  if (unit === "fahrenheit") return ((v - 32) * 5) / 9;
  if (unit === "kelvin") return v - 273.15;
  return v;
}
function fromCelsius(c: number, unit: string) {
  if (unit === "celsius") return c;
  if (unit === "fahrenheit") return (c * 9) / 5 + 32;
  if (unit === "kelvin") return c + 273.15;
  return c;
}
function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function TemperaturePair({ from, to }: { from: string; to: string }) {
  const [swapped, setSwapped] = useState(false);
  const a = swapped ? to : from;
  const b = swapped ? from : to;
  const [value, setValue] = useToolState(`temp-pair:${from}:${to}:value`, "0");

  function convert() {
    const v = Number(value);
    if (isNaN(v)) return "";
    const c = toCelsius(v, a);
    return fromCelsius(c, b).toLocaleString(undefined, { maximumFractionDigits: 4 });
  }

  return (
    <ToolShell title={`${cap(a)} ⟷ ${cap(b)}`} description={`Convert between ${cap(a)} and ${cap(b)}.`}>
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
