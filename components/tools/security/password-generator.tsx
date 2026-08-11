"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const SETS = { lower: "abcdefghijkmnopqrstuvwxyz", upper: "ABCDEFGHJKLMNPQRSTUVWXYZ", digits: "23456789", symbols: "!@#$%^&*_-+=?" };

export default function PasswordGenerator() {
  const [length, setLength] = useToolState("password-generator:length", "20");
  const [useUpper, setUseUpper] = useToolState("password-generator:useUpper", true);
  const [useDigits, setUseDigits] = useToolState("password-generator:useDigits", true);
  const [useSymbols, setUseSymbols] = useToolState("password-generator:useSymbols", true);
  const [result, setResult] = useToolState("password-generator:result", "");

  function generate() {
    const pool = [SETS.lower, useUpper && SETS.upper, useDigits && SETS.digits, useSymbols && SETS.symbols]
      .filter(Boolean).join("");
    const n = Math.max(4, Math.min(128, Number(length) || 20));
    const bytes = crypto.getRandomValues(new Uint32Array(n));
    setResult([...bytes].map((b) => pool[b % pool.length]).join(""));
  }

  return (
    <ToolShell title="Password Generator" description="Cryptographically random passwords, ambiguous-looking characters (0/O, 1/l) excluded by default.">
      <Field label="Length"><TextInput value={length} onChange={(e) => setLength(e.target.value)} className="font-mono-ui" /></Field>
      <Row>
        <label className="flex items-center gap-2 text-sm text-[var(--ink-dim)]"><input type="checkbox" checked={useUpper} onChange={(e) => setUseUpper(e.target.checked)} /> Uppercase</label>
        <label className="flex items-center gap-2 text-sm text-[var(--ink-dim)]"><input type="checkbox" checked={useDigits} onChange={(e) => setUseDigits(e.target.checked)} /> Digits</label>
        <label className="flex items-center gap-2 text-sm text-[var(--ink-dim)]"><input type="checkbox" checked={useSymbols} onChange={(e) => setUseSymbols(e.target.checked)} /> Symbols</label>
      </Row>
      <Button onClick={generate}>Generate</Button>
      <Output label="Password" value={result} />
    </ToolShell>
  );
}
