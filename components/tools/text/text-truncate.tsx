"use client";
import { ToolShell, TextArea, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function TextTruncate() {
  const [input, setInput] = useToolState("text-truncate:input", "Development utilities, Khmer language tools, and geospatial calculators held in a single workbench.");
  const [length, setLength] = useToolState("text-truncate:length", "40");
  const [suffix, setSuffix] = useToolState("text-truncate:suffix", "…");
  const n = Math.max(0, Number(length) || 0);
  const truncated = input.length > n ? input.slice(0, n).trimEnd() + suffix : input;

  return (
    <ToolShell title="Text Truncator" description="Shorten text to a maximum length with a custom ellipsis/suffix.">
      <Field label="Text"><TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} /></Field>
      <Row>
        <Field label="Max length"><TextInput value={length} onChange={(e) => setLength(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Suffix"><TextInput value={suffix} onChange={(e) => setSuffix(e.target.value)} /></Field>
      </Row>
      <Output label={`Truncated (${truncated.length} chars)`} value={truncated} />
    </ToolShell>
  );
}
