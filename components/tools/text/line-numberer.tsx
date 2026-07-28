"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

interface State {
  text: string;
  start: number;
  padWidth: number;
}

export default function LineNumbererTool() {
  const [s, setS] = useToolState<State>("line-numberer", {
    text: "first line\nsecond line\nthird line",
    start: 1,
    padWidth: 1,
  });
  const update = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }));

  const output = useMemo(() => {
    const lines = s.text.split(/\r?\n/);
    return lines
      .map((line, i) => `${String(s.start + i).padStart(Math.max(1, s.padWidth), "0")}  ${line}`)
      .join("\n");
  }, [s.text, s.start, s.padWidth]);

  return (
    <ToolShell title="Text Line Numberer" description="Prefix each line of text with a sequential number — useful for code snippets, scripts, or numbered lists.">
      <Field label="Text">
        <TextArea rows={6} value={s.text} onChange={(e) => update({ text: e.target.value })} />
      </Field>
      <Row>
        <Field label="Start at">
          <TextInput type="number" value={s.start} onChange={(e) => update({ start: Number(e.target.value) })} />
        </Field>
        <Field label="Zero-pad width">
          <TextInput type="number" min={1} value={s.padWidth} onChange={(e) => update({ padWidth: Number(e.target.value) })} />
        </Field>
      </Row>
      <Output label="Numbered text" value={output} />
    </ToolShell>
  );
}
