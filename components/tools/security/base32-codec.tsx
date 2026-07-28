"use client";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function encode(bytes: Uint8Array) {
  let bits = 0, value = 0, output = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31];
  while (output.length % 8 !== 0) output += "=";
  return output;
}
function decode(str: string) {
  const clean = str.replace(/=+$/, "").toUpperCase();
  let bits = 0, value = 0;
  const bytes: number[] = [];
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

export default function Base32Codec() {
  const [input, setInput] = useToolState("base32-codec:input", "Angkor Wat");
  const [direction, setDirection] = useToolState<"encode" | "decode">("base32-codec:direction", "encode");

  function output() {
    try {
      if (direction === "encode") return encode(new TextEncoder().encode(input));
      return new TextDecoder().decode(decode(input));
    } catch {
      return "";
    }
  }

  return (
    <ToolShell title="Base32 Encode / Decode" description="RFC 4648 Base32, commonly used for TOTP secrets and case-insensitive identifiers.">
      <Field label="Mode">
        <Select value={direction} onChange={(e) => setDirection(e.target.value as typeof direction)}>
          <option value="encode">Encode</option>
          <option value="decode">Decode</option>
        </Select>
      </Field>
      <Field label="Input"><TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" /></Field>
      <Output label="Output" value={output()} />
    </ToolShell>
  );
}
