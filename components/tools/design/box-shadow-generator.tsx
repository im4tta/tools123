"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function BoxShadowGenerator() {
  const [x, setX] = useToolState("box-shadow-generator:x", "0");
  const [y, setY] = useToolState("box-shadow-generator:y", "8");
  const [blur, setBlur] = useToolState("box-shadow-generator:blur", "24");
  const [spread, setSpread] = useToolState("box-shadow-generator:spread", "0");
  const [color, setColor] = useToolState("box-shadow-generator:color", "rgba(0,0,0,0.35)");
  const css = `${x}px ${y}px ${blur}px ${spread}px ${color}`;

  return (
    <ToolShell title="Box Shadow Generator" description="Compose a CSS box-shadow visually.">
      <Row>
        <Field label="X offset"><TextInput value={x} onChange={(e) => setX(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Y offset"><TextInput value={y} onChange={(e) => setY(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Blur"><TextInput value={blur} onChange={(e) => setBlur(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Spread"><TextInput value={spread} onChange={(e) => setSpread(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Field label="Color"><TextInput value={color} onChange={(e) => setColor(e.target.value)} className="font-mono-ui" /></Field>
      <div className="flex justify-center py-10">
        <div className="h-20 w-32 rounded-md bg-[var(--ground-raised)]" style={{ boxShadow: css }} />
      </div>
      <Output label="CSS" value={`box-shadow: ${css};`} />
    </ToolShell>
  );
}
