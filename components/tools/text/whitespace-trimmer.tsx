"use client";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function WhitespaceTrimmer() {
  const [input, setInput] = useToolState("whitespace-trimmer:input", "  Line one   \n\n\n  Line two\t\n   \nLine three  ");
  const [mode, setMode] = useToolState<"trim" | "collapse" | "blank">("whitespace-trimmer:mode", "trim");

  function clean(text: string) {
    if (mode === "trim") return text.split("\n").map((l) => l.trim()).join("\n");
    if (mode === "collapse") return text.replace(/[ \t]+/g, " ").split("\n").map((l) => l.trim()).join("\n");
    return text.split("\n").filter((l) => l.trim().length > 0).join("\n");
  }

  return (
    <ToolShell title="Whitespace / Line Cleaner" description="Trim trailing spaces, collapse repeated spaces, or drop blank lines.">
      <Field label="Text"><TextArea rows={6} value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" /></Field>
      <Field label="Mode">
        <Select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
          <option value="trim">Trim each line</option>
          <option value="collapse">Collapse extra spaces</option>
          <option value="blank">Remove blank lines</option>
        </Select>
      </Field>
      <Output label="Cleaned" value={clean(input)} />
    </ToolShell>
  );
}
