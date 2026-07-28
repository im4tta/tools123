"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

export default function CharFrequency() {
  const [input, setInput] = useToolState("char-frequency:input", "one hundred twenty-three instruments");
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const ch of input) {
      if (ch.trim() === "") continue;
      map.set(ch, (map.get(ch) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [input]);
  const max = counts[0]?.[1] ?? 1;

  return (
    <ToolShell title="Character Frequency Counter" description="Counts how often each character appears, sorted by frequency.">
      <Field label="Text"><TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} /></Field>
      <div className="space-y-1">
        {counts.map(([ch, n]) => (
          <div key={ch} className="flex items-center gap-3 text-sm">
            <span className="w-6 shrink-0 font-mono-ui text-[var(--ink)]">{ch}</span>
            <div className="h-2 flex-1 overflow-hidden rounded bg-[var(--ground-raised)]">
              <div className="h-full rounded bg-[var(--gold)]" style={{ width: `${(n / max) * 100}%` }} />
            </div>
            <span className="w-8 shrink-0 text-right font-mono-ui text-[var(--ink-faint)]">{n}</span>
          </div>
        ))}
      </div>
    </ToolShell>
  );
}
