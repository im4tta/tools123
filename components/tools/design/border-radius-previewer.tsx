"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function BorderRadiusPreviewer() {
  const [tl, setTl] = useToolState("border-radius-previewer:tl", "24");
  const [tr, setTr] = useToolState("border-radius-previewer:tr", "8");
  const [br, setBr] = useToolState("border-radius-previewer:br", "24");
  const [bl, setBl] = useToolState("border-radius-previewer:bl", "8");
  const css = `${tl}px ${tr}px ${br}px ${bl}px`;

  return (
    <ToolShell title="Border Radius Previewer" description="Preview and copy an independent-corner border-radius value.">
      <Row>
        <Field label="Top-left"><TextInput value={tl} onChange={(e) => setTl(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Top-right"><TextInput value={tr} onChange={(e) => setTr(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Bottom-right"><TextInput value={br} onChange={(e) => setBr(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Bottom-left"><TextInput value={bl} onChange={(e) => setBl(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <div className="flex justify-center py-10">
        <div className="h-28 w-40 border-2 border-[var(--gold)] bg-[var(--ground-raised)]" style={{ borderRadius: css }} />
      </div>
      <Output label="CSS" value={`border-radius: ${css};`} />
    </ToolShell>
  );
}
