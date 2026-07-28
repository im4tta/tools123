"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const KH = "០១២៣៤៥៦៧៨៩";
const toKhmerDigits = (s: string) => s.replace(/[0-9]/g, (d) => KH[Number(d)]);

export default function RielFormatter() {
  const [amount, setAmount] = useToolState("riel-formatter:amount", "125000");
  const n = Number(amount.replace(/[^0-9.-]/g, ""));

  const grouped = useMemo(() => (isNaN(n) ? "" : n.toLocaleString("en-US")), [n]);

  return (
    <ToolShell title="Riel Currency Formatter" khmerTitle="រៀល" description="Format a raw number as Cambodian Riel, in both Arabic and Khmer numeral styles.">
      <Field label="Amount"><TextInput value={amount} onChange={(e) => setAmount(e.target.value)} className="w-48 font-mono-ui" /></Field>
      <Output label="Arabic numerals" value={isNaN(n) ? "" : `៛${grouped}`} error={isNaN(n)} />
      <Output label="Khmer numerals" value={isNaN(n) ? "" : `${toKhmerDigits(grouped)}៛`} error={isNaN(n)} />
    </ToolShell>
  );
}
