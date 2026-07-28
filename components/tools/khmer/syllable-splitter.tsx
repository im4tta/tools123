"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function splitClusters(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter("km", { granularity: "grapheme" });
    return [...seg.segment(text)].map((s) => s.segment).filter((s) => s.trim().length > 0 || s === " ");
  }
  // Fallback: naive per-character split if the browser lacks Intl.Segmenter.
  return [...text];
}

export default function SyllableSplitter() {
  const [input, setInput] = useToolState("syllable-splitter:input", "អ្នកគ្រួបង្រៀនភាសាខ្មែរ");
  const clusters = useMemo(() => splitClusters(input).filter((c) => c !== " "), [input]);

  return (
    <ToolShell
      title="Khmer Syllable Splitter"
      khmerTitle="បំបែកព្យាង្គ"
      description="Split Khmer text into orthographic clusters — base consonant plus any coeng (subscript) stack, vowel signs, and diacritics grouped together. Uses your browser's Unicode grapheme-cluster segmenter, so results are approximate for edge cases rather than a full dictionary-based word segmenter."
    >
      <Field label="Khmer text"><TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} className="font-khmer text-lg" /></Field>
      <div className="flex flex-wrap gap-1.5">
        {clusters.map((c, i) => (
          <span key={i} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2.5 py-1.5 font-khmer text-lg text-[var(--ink)]">
            {c}
          </span>
        ))}
        {clusters.length === 0 && <span className="text-sm text-[var(--ink-faint)]">Type some Khmer text above.</span>}
      </div>
      <Output label={`${clusters.length} cluster(s)`} value={clusters.join(" · ")} mono={false} />
    </ToolShell>
  );
}
