"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

// Heuristic: insert a zero-width space before a Khmer consonant that is not
// itself preceded by a COENG (subscript) sign, i.e. a likely new syllable start.
function insertZwsp(text: string) {
  const COENG = "\u17d2";
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const prev = text[i - 1];
    const isConsonant = c >= "\u1780" && c <= "\u17a2";
    if (isConsonant && prev && prev !== COENG && prev !== "\u200b" && i > 0) {
      const prevIsConsonantOrIndep = prev >= "\u1780" && prev <= "\u17b3";
      if (prevIsConsonantOrIndep) out += "\u200b";
    }
    out += c;
  }
  return out;
}

export default function LineBreakHelper() {
  const [input, setInput] = useToolState("line-break-helper:input", "កម្ពុជាមានខេត្តចំនួនម្ភៃប្រាំ");
  const withZwsp = useMemo(() => insertZwsp(input), [input]);
  const visible = useMemo(() => withZwsp.replace(/\u200b/g, "|"), [withZwsp]);

  return (
    <ToolShell title="Khmer Soft Line-break Helper" khmerTitle="ចន្លោះខណ្ឌ" description="Khmer script has no spaces between words, which breaks web text wrapping. This inserts zero-width spaces at likely syllable boundaries so long strings can wrap in narrow layouts. Heuristic — proofread before using in production.">
      <Field label="Khmer text"><TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} className="font-khmer" /></Field>
      <Output label="Boundary preview (| = inserted ZWSP)" value={visible} mono={false} />
      <Output label="With ZWSP (copy this)" value={withZwsp} />
    </ToolShell>
  );
}
