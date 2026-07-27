"use client";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const SERIES1 = new Set(["ក","ខ","ច","ឆ","ដ","ឋ","ត","ថ","ប","ផ","រ","ស","ហ","អ"]);
const SERIES2 = new Set(["គ","ឃ","ង","ជ","ឈ","ញ","ឌ","ឍ","ណ","ទ","ធ","ន","ព","ភ","ម","យ","ល","វ","ឡ"]);

export default function ConsonantClassifier() {
  const [input, setInput] = useToolState("consonant-classifier:input", "កខគឃងចឆជឈ");
  const chars = [...input].filter((c) => SERIES1.has(c) || SERIES2.has(c));

  return (
    <ToolShell title="Consonant Series Classifier" khmerTitle="អក្សរជើង" description="Every Khmer consonant belongs to the 1st series (â-register) or 2nd series (ô-register), which determines how dependent vowels are pronounced.">
      <Field label="Khmer consonants"><TextInput value={input} onChange={(e) => setInput(e.target.value)} className="font-khmer text-lg" /></Field>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
        {chars.map((c, i) => (
          <div key={i} className={`rounded-md border p-3 text-center font-khmer text-2xl ${SERIES1.has(c) ? "border-[var(--slate-accent-dim)] bg-[var(--slate-accent-dim)]/15 text-[var(--slate-accent)]" : "border-[var(--teal-dim)] bg-[var(--teal-dim)]/15 text-[var(--teal)]"}`}>
            {c}
            <div className="mt-1 text-[10px] font-mono-ui uppercase tracking-wide">{SERIES1.has(c) ? "1st" : "2nd"}</div>
          </div>
        ))}
      </div>
    </ToolShell>
  );
}
