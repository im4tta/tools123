"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function JsonFormatter() {
  const [input, setInput] = useToolState("json-formatter:input", '{"cambodia":{"capital":"Phnom Penh","provinces":25}}');
  const [indent, setIndent] = useToolState("json-formatter:indent", "2");

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: false };
    try {
      const parsed = JSON.parse(input);
      return { output: JSON.stringify(parsed, null, indent === "min" ? 0 : Number(indent)), error: false };
    } catch (e) {
      return { output: e instanceof Error ? e.message : "Invalid JSON", error: true };
    }
  }, [input, indent]);

  return (
    <ToolShell title="JSON Formatter" description="Validate and pretty-print JSON, or collapse it to a single line.">
      <Field label="Input JSON">
        <TextArea rows={10} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      <Field label="Indent">
        <Select value={indent} onChange={(e) => setIndent(e.target.value)} className="w-40">
          <option value="2">2 spaces</option>
          <option value="4">4 spaces</option>
          <option value="min">Minified</option>
        </Select>
      </Field>
      <Output label={error ? "Parse error" : "Formatted output"} value={output} error={error} />
    </ToolShell>
  );
}
