"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

export default function TemperatureConverter() {
  const [celsius, setCelsius] = useToolState("temperature-converter:celsius", "25");
  const c = Number(celsius);
  const valid = !isNaN(c);
  const f = valid ? (c * 9) / 5 + 32 : NaN;
  const k = valid ? c + 273.15 : NaN;

  function fromF(v: string) {
    const n = Number(v);
    if (!isNaN(n)) setCelsius(String(((n - 32) * 5) / 9));
  }
  function fromK(v: string) {
    const n = Number(v);
    if (!isNaN(n)) setCelsius(String(n - 273.15));
  }

  return (
    <ToolShell title="Temperature Converter" description="Convert between Celsius, Fahrenheit, and Kelvin.">
      <Row>
        <Field label="Celsius (°C)"><TextInput value={celsius} onChange={(e) => setCelsius(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Fahrenheit (°F)"><TextInput value={valid ? f.toFixed(2) : ""} onChange={(e) => fromF(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Kelvin (K)"><TextInput value={valid ? k.toFixed(2) : ""} onChange={(e) => fromK(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
    </ToolShell>
  );
}
