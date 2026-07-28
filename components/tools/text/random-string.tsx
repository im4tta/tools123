"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*_-+=?",
};

export default function RandomString() {
  const [length, setLength] = useToolState("random-string:length", "16");
  const [useLower, setUseLower] = useToolState("random-string:useLower", true);
  const [useUpper, setUseUpper] = useToolState("random-string:useUpper", true);
  const [useDigits, setUseDigits] = useToolState("random-string:useDigits", true);
  const [useSymbols, setUseSymbols] = useToolState("random-string:useSymbols", false);
  const [result, setResult] = useToolState("random-string:result", "");

  function generate() {
    const pool = [
      useLower && SETS.lower,
      useUpper && SETS.upper,
      useDigits && SETS.digits,
      useSymbols && SETS.symbols,
    ].filter(Boolean).join("");
    if (!pool) return setResult("");
    const n = Math.max(1, Math.min(512, Number(length) || 16));
    const bytes = crypto.getRandomValues(new Uint32Array(n));
    setResult([...bytes].map((b) => pool[b % pool.length]).join(""));
  }

  return (
    <ToolShell title="Random String Generator" description="Cryptographically random strings from a custom character set.">
      <Field label="Length"><TextInput value={length} onChange={(e) => setLength(e.target.value)} className="font-mono-ui" /></Field>
      <Row>
        <label className="flex items-center gap-2 text-sm text-[var(--ink-dim)]"><input type="checkbox" checked={useLower} onChange={(e) => setUseLower(e.target.checked)} /> lowercase</label>
        <label className="flex items-center gap-2 text-sm text-[var(--ink-dim)]"><input type="checkbox" checked={useUpper} onChange={(e) => setUseUpper(e.target.checked)} /> UPPERCASE</label>
        <label className="flex items-center gap-2 text-sm text-[var(--ink-dim)]"><input type="checkbox" checked={useDigits} onChange={(e) => setUseDigits(e.target.checked)} /> digits</label>
        <label className="flex items-center gap-2 text-sm text-[var(--ink-dim)]"><input type="checkbox" checked={useSymbols} onChange={(e) => setUseSymbols(e.target.checked)} /> symbols</label>
      </Row>
      <Button onClick={generate}>Generate</Button>
      <Output label="Result" value={result} />
    </ToolShell>
  );
}
