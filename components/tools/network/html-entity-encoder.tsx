"use client";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function HtmlEntityEncoder() {
  const [input, setInput] = useToolState("html-entity-encoder:input", '<div class="card">Tom & Jerry\'s "adventure"</div>');
  const [direction, setDirection] = useToolState<"encode" | "decode">("html-entity-encoder:direction", "encode");

  function encode(text: string) {
    return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
  }
  function decode(text: string) {
    return text
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
  }

  return (
    <ToolShell title="HTML Entity Encoder / Decoder" description="Escape or unescape HTML special characters.">
      <Field label="Mode">
        <Select value={direction} onChange={(e) => setDirection(e.target.value as typeof direction)}>
          <option value="encode">Encode</option>
          <option value="decode">Decode</option>
        </Select>
      </Field>
      <Field label="Input"><TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" /></Field>
      <Output label="Output" value={direction === "encode" ? encode(input) : decode(input)} />
    </ToolShell>
  );
}
