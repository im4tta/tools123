"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

// Common Cambodian civilian plate shapes: 1-2 digit code + 1-2 letters, a hyphen, then 3-5 digits.
// This is a format check only — it does not decode province/type codes or verify against any registry.
const PLATE_RE = /^\d{1,2}[A-Z]{1,2}-\d{3,5}$/;

function normalize(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^0-9A-Z-]/g, "");
  if (cleaned.includes("-")) return cleaned;
  const m = cleaned.match(/^(\d{1,2}[A-Z]{1,2})(\d{3,5})$/);
  return m ? `${m[1]}-${m[2]}` : cleaned;
}

export default function VehiclePlate() {
  const [input, setInput] = useToolState("vehicle-plate:input", "2KA1234");
  const normalized = useMemo(() => normalize(input), [input]);
  const valid = PLATE_RE.test(normalized);

  return (
    <ToolShell
      title="Cambodia Vehicle Plate Format Checker"
      khmerTitle="ស្លាកលេខយានយន្ត"
      description="Checks a value against the common Cambodian civilian plate shape (1–2 digit prefix + 1–2 letters + 3–5 digits, e.g. 2KA-1234) and inserts the hyphen for you. This is a format check only — plate systems vary by vehicle type and era, and this doesn't decode province codes or verify against any registry."
    >
      <Field label="Plate value"><TextInput value={input} onChange={(e) => setInput(e.target.value)} className="w-56 font-mono-ui uppercase" /></Field>
      <Output label={valid ? "Matches common civilian plate shape" : "Does not match the common shape"} value={normalized || "—"} error={!valid} />
    </ToolShell>
  );
}
