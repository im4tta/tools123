"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const KH_DIGITS = "០១២៣៤៥៦៧៨៩";
const toKh = (n: number) => String(n).split("").map((d) => KH_DIGITS[Number(d)]).join("");

export default function OrdinalFormatterTool() {
  const [value, setValue] = useToolState("khmer-ordinal-formatter", "1, 2, 3, 21, 100");

  const results = useMemo(() => {
    return value
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const n = Number(s);
        if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return `${s} → (invalid)`;
        return `${s} → ទី${toKh(n)}`;
      })
      .join("\n");
  }, [value]);

  return (
    <ToolShell
      title="Khmer Ordinal Number Formatter"
      khmerTitle="លេខរៀង"
      description="Convert cardinal numbers into Khmer ordinal form (ទី១, ទី២, ទី៣…). Enter one or more numbers separated by commas or new lines."
    >
      <Field label="Numbers" hint="comma or newline separated">
        <TextInput value={value} onChange={(e) => setValue(e.target.value)} />
      </Field>
      <Output label="Ordinals" value={results} />
    </ToolShell>
  );
}
