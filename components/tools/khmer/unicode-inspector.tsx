"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const NAMED: Record<number, string> = {
  0x200b: "ZWSP (zero-width space)",
  0x200c: "ZWNJ (zero-width non-joiner)",
  0x200d: "ZWJ (zero-width joiner)",
  0x17d2: "COENG (subscript sign)",
  0x0020: "SPACE",
};

export default function UnicodeInspector() {
  const [input, setInput] = useToolState("unicode-inspector:input", "កម្ពុជា\u200b");

  const rows = useMemo(
    () =>
      [...input].map((ch) => {
        const cp = ch.codePointAt(0)!;
        const inKhmerBlock = cp >= 0x1780 && cp <= 0x17ff;
        return {
          ch,
          hex: "U+" + cp.toString(16).toUpperCase().padStart(4, "0"),
          name: NAMED[cp] ?? (inKhmerBlock ? "Khmer block" : cp < 128 ? "ASCII" : "other"),
        };
      }),
    [input]
  );
  const hasHidden = rows.some((r) => r.name.startsWith("ZW"));

  return (
    <ToolShell title="Khmer Unicode Inspector" khmerTitle="ត្រួតពិនិត្យតួអក្សរ" description="See every codepoint in a Khmer string — spot stray zero-width characters and confirm normalization at a glance.">
      <Field label="Text"><TextArea rows={3} value={input} onChange={(e) => setInput(e.target.value)} className="font-khmer" /></Field>
      <Output
        label={hasHidden ? "Codepoints — hidden characters found" : "Codepoints"}
        error={hasHidden}
        value={rows.map((r) => `${r.ch === "\u200b" ? "·" : r.ch}\t${r.hex}\t${r.name}`).join("\n")}
      />
      <Output label="NFC normalized" value={input.normalize("NFC")} />
    </ToolShell>
  );
}
