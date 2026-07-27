"use client";
import { ToolShell, TextArea, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function TextColumns() {
  const [input, setInput] = useToolState("text-columns:input", "name,age,city\nSophea,29,Phnom Penh\nDara,34,Siem Reap");
  const [delimiter, setDelimiter] = useToolState("text-columns:delimiter", ",");
  const [column, setColumn] = useToolState("text-columns:column", "1");

  function extract() {
    const idx = Math.max(0, (Number(column) || 1) - 1);
    return input.split("\n").map((line) => line.split(delimiter)[idx]?.trim() ?? "").join("\n");
  }

  return (
    <ToolShell title="Text to Columns Splitter" description="Split delimited text into columns and pull out one by its position.">
      <Field label="Delimited text"><TextArea rows={6} value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" /></Field>
      <Row>
        <Field label="Delimiter"><TextInput value={delimiter} onChange={(e) => setDelimiter(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Column # (1-based)"><TextInput value={column} onChange={(e) => setColumn(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="Extracted column" value={extract()} />
    </ToolShell>
  );
}
