"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function BaseConverter() {
  const [decimal, setDecimal] = useToolState("base-converter:decimal", "123");

  function fromDecimal() {
    const n = parseInt(decimal, 10);
    if (isNaN(n) || n < 0) return null;
    return { bin: n.toString(2), oct: n.toString(8), hex: n.toString(16).toUpperCase() };
  }

  function updateFrom(base: number, value: string) {
    const n = parseInt(value, base);
    if (!isNaN(n) && n >= 0) setDecimal(String(n));
  }

  const r = fromDecimal();

  return (
    <ToolShell title="Number Base Converter" description="Convert whole numbers between decimal, binary, octal, and hexadecimal.">
      <Row>
        <Field label="Decimal"><TextInput value={decimal} onChange={(e) => setDecimal(e.target.value.replace(/[^0-9]/g, ""))} className="font-mono-ui" /></Field>
        <Field label="Binary"><TextInput value={r?.bin ?? ""} onChange={(e) => updateFrom(2, e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Octal"><TextInput value={r?.oct ?? ""} onChange={(e) => updateFrom(8, e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Hexadecimal"><TextInput value={r?.hex ?? ""} onChange={(e) => updateFrom(16, e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="Decimal value" value={decimal} error={!r} />
    </ToolShell>
  );
}
