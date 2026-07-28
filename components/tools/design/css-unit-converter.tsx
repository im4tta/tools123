"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function CssUnitConverter() {
  const [px, setPx] = useToolState("css-unit-converter:px", "16");
  const [base, setBase] = useToolState("css-unit-converter:base", "16");
  const p = Number(px), b = Number(base) || 16;
  const valid = !isNaN(p) && !isNaN(b) && b > 0;

  return (
    <ToolShell title="CSS Unit Converter" description="Convert pixels to rem/em (and points) given a base font size.">
      <Row>
        <Field label="Pixels"><TextInput value={px} onChange={(e) => setPx(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Root font size (px)"><TextInput value={base} onChange={(e) => setBase(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="rem / em" value={valid ? `${(p / b).toFixed(4)}rem` : ""} error={!valid} />
      <Output label="Points (pt)" value={valid ? `${(p * 0.75).toFixed(2)}pt` : ""} error={!valid} />
    </ToolShell>
  );
}
