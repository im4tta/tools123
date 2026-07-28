"use client";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function TextToBinary() {
  const [input, setInput] = useToolState("text-to-binary:input", "Angkor");
  const [direction, setDirection] = useToolState<"encode" | "decode">("text-to-binary:direction", "encode");

  function encode(text: string) {
    return [...new TextEncoder().encode(text)].map((b) => b.toString(2).padStart(8, "0")).join(" ");
  }
  function decode(bin: string) {
    try {
      const bytes = bin.trim().split(/\s+/).filter(Boolean).map((b) => parseInt(b, 2));
      if (bytes.some((b) => isNaN(b) || b < 0 || b > 255)) return "";
      return new TextDecoder().decode(new Uint8Array(bytes));
    } catch {
      return "";
    }
  }

  const output = direction === "encode" ? encode(input) : decode(input);

  return (
    <ToolShell title="Text ⟷ Binary" description="Convert text to space-separated 8-bit binary and back, via UTF-8 bytes.">
      <Field label="Mode">
        <Select value={direction} onChange={(e) => setDirection(e.target.value as typeof direction)}>
          <option value="encode">Text → Binary</option>
          <option value="decode">Binary → Text</option>
        </Select>
      </Field>
      <Field label="Input"><TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" /></Field>
      <Output label="Output" value={output} />
    </ToolShell>
  );
}
