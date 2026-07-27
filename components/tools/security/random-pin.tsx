"use client";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function RandomPin() {
  const [digits, setDigits] = useToolState("random-pin:digits", "6");
  const [pin, setPin] = useToolState("random-pin:pin", "");

  function generate() {
    const n = Math.max(3, Math.min(20, Number(digits) || 6));
    const bytes = crypto.getRandomValues(new Uint8Array(n));
    setPin([...bytes].map((b) => b % 10).join(""));
  }

  return (
    <ToolShell title="Random PIN Generator" description="Cryptographically random numeric PIN of any length.">
      <Field label="Digits"><TextInput value={digits} onChange={(e) => setDigits(e.target.value)} className="font-mono-ui" /></Field>
      <Button onClick={generate}>Generate</Button>
      <Output label="PIN" value={pin} />
    </ToolShell>
  );
}
