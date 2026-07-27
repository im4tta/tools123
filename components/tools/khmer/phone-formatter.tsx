"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function PhoneFormatter() {
  const [input, setInput] = useToolState("phone-formatter:input", "012345678");
  const digits = input.replace(/\D/g, "");

  const formatted = useMemo(() => {
    let d = digits;
    if (d.startsWith("855")) d = "0" + d.slice(3);
    if (!d.startsWith("0")) return null;
    const local = d.slice(1);
    if (local.length === 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    if (local.length === 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    return null;
  }, [digits]);

  const intl = formatted ? "+855 " + formatted.slice(1) : null;

  return (
    <ToolShell title="Cambodian Phone Number Formatter" khmerTitle="លេខទូរស័ព្ទ" description="Format an 8- or 9-digit Cambodian mobile number into local and +855 international styles.">
      <Field label="Raw number"><TextInput value={input} onChange={(e) => setInput(e.target.value)} className="w-56 font-mono-ui" /></Field>
      <Output label="Local" value={formatted ?? ""} error={!formatted} />
      <Output label="International" value={intl ?? ""} error={!intl} />
    </ToolShell>
  );
}
