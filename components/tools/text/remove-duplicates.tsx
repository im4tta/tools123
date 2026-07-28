"use client";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function RemoveDuplicates() {
  const [input, setInput] = useToolState("remove-duplicates:input", "apple\nbanana\napple\ncherry\nbanana");
  const lines = input.split("\n");
  const unique = [...new Set(lines)];

  return (
    <ToolShell title="Duplicate Line Remover" description="Strips repeated lines while keeping the first occurrence's order.">
      <Field label="Lines"><TextArea rows={6} value={input} onChange={(e) => setInput(e.target.value)} /></Field>
      <Output label={`Unique lines (${unique.length} of ${lines.length})`} value={unique.join("\n")} />
    </ToolShell>
  );
}
