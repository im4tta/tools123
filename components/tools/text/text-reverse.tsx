"use client";
import { ToolShell, TextArea, Field, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function TextReverse() {
  const [input, setInput] = useToolState("text-reverse:input", "one workbench, one hundred twenty-three instruments");
  const [mode, setMode] = useToolState<"chars" | "words" | "lines">("text-reverse:mode", "chars");

  function reverse(text: string) {
    if (mode === "chars") return [...text].reverse().join("");
    if (mode === "words") return text.split(/(\s+)/).reverse().join("");
    return text.split("\n").reverse().join("\n");
  }

  return (
    <ToolShell title="Text Reverse" description="Reverse text by character, word, or line.">
      <Row>
        <Field label="Input"><TextArea rows={5} value={input} onChange={(e) => setInput(e.target.value)} /></Field>
        <Field label="Mode">
          <Select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
            <option value="chars">Characters</option>
            <option value="words">Words</option>
            <option value="lines">Lines</option>
          </Select>
        </Field>
      </Row>
      <Output label="Reversed" value={reverse(input)} />
    </ToolShell>
  );
}
