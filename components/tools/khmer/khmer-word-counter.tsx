"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

export default function KhmerWordCounter() {
  const [text, setText] = useToolState("khmer-word-counter:text", "ខ្មែរ​ជា​ភាសា​មួយ​ដ៏​សម្បូរបែប។");

  const stats = useMemo(() => {
    const graphemes = "Segmenter" in Intl
      ? [...new (Intl as any).Segmenter("km", { granularity: "grapheme" }).segment(text)].length
      : [...text].length;
    const codepoints = [...text].length;
    const utf16units = text.length;
    const khmerChars = (text.match(/[\u1780-\u17ff]/g) || []).length;
    return { graphemes, codepoints, utf16units, khmerChars };
  }, [text]);

  return (
    <ToolShell title="Khmer Grapheme Counter" khmerTitle="រាប់តួអក្សរ" description="Khmer syllables are built from stacked codepoints, so a naive .length is wrong. This counts visible grapheme clusters using Intl.Segmenter.">
      <Field label="Text"><TextArea rows={6} value={text} onChange={(e) => setText(e.target.value)} className="font-khmer" /></Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(stats).map(([k, v]) => (
          <div key={k} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-center">
            <div className="font-mono-ui text-xl text-[var(--gold)]">{v}</div>
            <div className="text-xs text-[var(--ink-dim)]">{k}</div>
          </div>
        ))}
      </div>
    </ToolShell>
  );
}
