"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function IdPattern() {
  const [input, setInput] = useToolState("id-pattern:input", "123456789");
  const digits = input.replace(/\D/g, "");
  const validShape = /^\d{9}$/.test(digits);

  return (
    <ToolShell title="National ID Shape Checker" khmerTitle="អត្តសញ្ញាណប័ណ្ណ" description="Checks that a value matches the 9-digit shape of a Cambodian national ID number. This is a format check only — it does not verify the ID against any registry.">
      <Field label="ID value"><TextInput value={input} onChange={(e) => setInput(e.target.value)} className="w-56 font-mono-ui" /></Field>
      <Output label={validShape ? "Matches 9-digit shape" : "Does not match expected shape"} value={digits || "—"} error={!validShape} />
    </ToolShell>
  );
}
