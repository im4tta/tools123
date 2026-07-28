"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

export default function TextStatistics() {
  const [input, setInput] = useToolState("text-statistics:input", "Development utilities, Khmer language tools, and geospatial calculators held in a single workbench, reached by search instead of navigation.");

  const stats = useMemo(() => {
    const words = input.trim() ? input.trim().split(/\s+/) : [];
    const sentences = input.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const chars = input.length;
    const charsNoSpaces = input.replace(/\s/g, "").length;
    const readingMinutes = words.length / 200;
    return {
      words: words.length,
      sentences: sentences.length,
      chars,
      charsNoSpaces,
      readingTime: readingMinutes < 1 ? `${Math.max(1, Math.round(readingMinutes * 60))}s` : `${readingMinutes.toFixed(1)} min`,
    };
  }, [input]);

  return (
    <ToolShell title="Text Statistics" description="Word, sentence, and character counts, plus an estimated reading time at 200 wpm.">
      <Field label="Text"><TextArea rows={6} value={input} onChange={(e) => setInput(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Words", stats.words],
          ["Sentences", stats.sentences],
          ["Characters", stats.chars],
          ["Chars (no spaces)", stats.charsNoSpaces],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5">
            <div className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">{label}</div>
            <div className="mt-1 font-mono-ui text-lg text-[var(--ink)]">{value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5">
        <div className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">Estimated reading time</div>
        <div className="mt-1 font-mono-ui text-lg text-[var(--ink)]">{stats.readingTime}</div>
      </div>
    </ToolShell>
  );
}
