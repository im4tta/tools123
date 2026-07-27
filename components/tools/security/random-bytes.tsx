"use client";
import { ToolShell, TextInput, Field, Select, Row } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function RandomBytes() {
  const [length, setLength] = useToolState("random-bytes:length", "32");
  const [encoding, setEncoding] = useToolState<"hex" | "base64">("random-bytes:encoding", "hex");
  const [result, setResult] = useToolState("random-bytes:result", "");

  function generate() {
    const n = Math.max(1, Math.min(1024, Number(length) || 32));
    const bytes = crypto.getRandomValues(new Uint8Array(n));
    if (encoding === "hex") {
      setResult([...bytes].map((b) => b.toString(16).padStart(2, "0")).join(""));
    } else {
      let str = "";
      bytes.forEach((b) => (str += String.fromCharCode(b)));
      setResult(btoa(str));
    }
  }

  return (
    <ToolShell title="Random Bytes / Key Generator" description="Cryptographically random bytes for keys, tokens, or nonces.">
      <Row>
        <Field label="Byte length"><TextInput value={length} onChange={(e) => setLength(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Encoding">
          <Select value={encoding} onChange={(e) => setEncoding(e.target.value as typeof encoding)}>
            <option value="hex">Hex</option>
            <option value="base64">Base64</option>
          </Select>
        </Field>
      </Row>
      <Button onClick={generate}>Generate</Button>
      <Output label="Result" value={result} />
    </ToolShell>
  );
}
