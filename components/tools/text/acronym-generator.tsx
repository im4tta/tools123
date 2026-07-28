"use client";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function AcronymGenerator() {
  const [input, setInput] = useToolState("acronym-generator:input", "One Hundred Twenty Three Instruments");
  const words = input.trim().split(/\s+/).filter(Boolean);
  const acronym = words.map((w) => w[0]?.toUpperCase() ?? "").join("");

  return (
    <ToolShell title="Acronym Generator" description="Builds an acronym from the first letter of each word.">
      <Field label="Phrase"><TextArea rows={3} value={input} onChange={(e) => setInput(e.target.value)} /></Field>
      <Output label="Acronym" value={acronym} />
    </ToolShell>
  );
}
