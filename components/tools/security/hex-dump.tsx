"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

export default function HexDump() {
  const [input, setInput] = useToolState("hex-dump:input", "Angkor Wat, 1113");

  const lines = useMemo(() => {
    const bytes = new TextEncoder().encode(input);
    const rows: string[] = [];
    for (let i = 0; i < bytes.length; i += 16) {
      const chunk = bytes.slice(i, i + 16);
      const hex = [...chunk].map((b) => b.toString(16).padStart(2, "0")).join(" ").padEnd(47, " ");
      const ascii = [...chunk].map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : ".")).join("");
      rows.push(`${i.toString(16).padStart(8, "0")}  ${hex}  ${ascii}`);
    }
    return rows.join("\n");
  }, [input]);

  return (
    <ToolShell title="Hex Dump Viewer" description="Renders text as a classic offset / hex / ASCII hex dump.">
      <Field label="Text"><TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} /></Field>
      <pre className="overflow-auto rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 font-mono-ui text-xs text-[var(--ink)]">{lines}</pre>
    </ToolShell>
  );
}
