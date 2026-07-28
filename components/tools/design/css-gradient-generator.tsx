"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function CssGradientGenerator() {
  const [c1, setC1] = useToolState("css-gradient-generator:c1", "#c9a24b");
  const [c2, setC2] = useToolState("css-gradient-generator:c2", "#3ea08c");
  const [angle, setAngle] = useToolState("css-gradient-generator:angle", "135");
  const css = `linear-gradient(${angle}deg, ${c1}, ${c2})`;

  return (
    <ToolShell title="CSS Gradient Generator" description="Build a two-color linear gradient and copy the CSS.">
      <Row>
        <Field label="Color 1"><TextInput value={c1} onChange={(e) => setC1(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Color 2"><TextInput value={c2} onChange={(e) => setC2(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Field label="Angle (deg)"><TextInput value={angle} onChange={(e) => setAngle(e.target.value)} className="font-mono-ui" /></Field>
      <div className="h-28 rounded-md border border-[var(--ground-line)]" style={{ background: css }} />
      <Output label="CSS" value={`background: ${css};`} />
    </ToolShell>
  );
}
