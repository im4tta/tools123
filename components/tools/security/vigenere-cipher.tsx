"use client";
import { ToolShell, TextArea, TextInput, Field, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function vigenere(text: string, key: string, decrypt: boolean) {
  const k = key.toUpperCase().replace(/[^A-Z]/g, "");
  if (!k) return "";
  let ki = 0;
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    const shift = k.charCodeAt(ki % k.length) - 65;
    ki++;
    const s = decrypt ? -shift : shift;
    return String.fromCharCode(((c.charCodeAt(0) - base + s + 26) % 26) + base);
  });
}

export default function VigenereCipher() {
  const [input, setInput] = useToolState("vigenere-cipher:input", "Meet me at the temple");
  const [key, setKey] = useToolState("vigenere-cipher:key", "ANGKOR");
  const [mode, setMode] = useToolState<"encrypt" | "decrypt">("vigenere-cipher:mode", "encrypt");

  return (
    <ToolShell title="Vigenère Cipher" description="Classic polyalphabetic cipher using a repeating keyword.">
      <Field label="Text"><TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} /></Field>
      <Row>
        <Field label="Key"><TextInput value={key} onChange={(e) => setKey(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Mode">
          <Select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
            <option value="encrypt">Encrypt</option>
            <option value="decrypt">Decrypt</option>
          </Select>
        </Field>
      </Row>
      <Output label="Result" value={vigenere(input, key, mode === "decrypt")} />
    </ToolShell>
  );
}
