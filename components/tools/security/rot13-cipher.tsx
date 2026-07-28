"use client";
import { ToolShell, TextArea, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function Rot13Cipher() {
  const [input, setInput] = useToolState("rot13-cipher:input", "Meet at the temple by dawn");
  const [shift, setShift] = useToolState("rot13-cipher:shift", "13");

  function caesar(text: string, n: number) {
    const s = ((n % 26) + 26) % 26;
    return text.replace(/[a-zA-Z]/g, (c) => {
      const base = c <= "Z" ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + s) % 26) + base);
    });
  }

  return (
    <ToolShell title="ROT13 / Caesar Cipher" description="Shift letters by a fixed amount. ROT13 is shift 13; try any shift for a general Caesar cipher.">
      <Field label="Text"><TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} /></Field>
      <Field label="Shift"><TextInput value={shift} onChange={(e) => setShift(e.target.value)} className="font-mono-ui" /></Field>
      <Output label="Result" value={caesar(input, Number(shift) || 0)} />
    </ToolShell>
  );
}
