"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const MAP: Record<string, string> = {
  "ក":"k","ខ":"kh","គ":"k","ឃ":"kh","ង":"ng","ច":"ch","ឆ":"chh","ជ":"j","ឈ":"chh","ញ":"nh",
  "ដ":"d","ឋ":"th","ឌ":"d","ឍ":"th","ណ":"n","ត":"t","ថ":"th","ទ":"t","ធ":"th","ន":"n",
  "ប":"b","ផ":"ph","ព":"p","ភ":"ph","ម":"m","យ":"y","រ":"r","ល":"l","វ":"v",
  "ស":"s","ហ":"h","ឡ":"l","អ":"a",
  "ា":"a","ិ":"i","ី":"i","ឹ":"eu","ឺ":"eu","ុ":"o","ូ":"u","ួ":"uo","ើ":"aeu",
  "ែ":"ae","ៃ":"ai","ោ":"ao","ៅ":"au","ំ":"m","ះ":"h","ាំ":"am","ៀ":"ie",
  "០":"0","១":"1","២":"2","៣":"3","៤":"4","៥":"5","៦":"6","៧":"7","៨":"8","៩":"9",
  "្":"","​":"",
};

export default function Romanization() {
  const [input, setInput] = useToolState("romanization:input", "សួស្តី កម្ពុជា");
  const output = useMemo(
    () => [...input].map((c) => (c in MAP ? MAP[c] : c)).join(""),
    [input]
  );

  return (
    <ToolShell title="Khmer Romanization (approximate)" khmerTitle="សរសេរជាឡាតាំង" description="A simple character-by-character Latin transliteration for quick reference. It's approximate — it does not apply full UNGEGN rules for clusters, coeng stacking, or series-2 vowel shifts.">
      <Field label="Khmer text"><TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} className="font-khmer" /></Field>
      <Output label="Approximate romanization" value={output} />
    </ToolShell>
  );
}
