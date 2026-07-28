"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const KH = "០១២៣៤៥៦៧៨៩";

export default function DigitConverter() {
  const [input, setInput] = useToolState("digit-converter:input", "ចំណាយ ១២៥០០០ រៀល សម្រាប់ 3 ថ្ងៃ");

  const toArabic = useMemo(
    () => [...input].map((c) => (KH.includes(c) ? String(KH.indexOf(c)) : c)).join(""),
    [input]
  );
  const toKhmer = useMemo(
    () => [...input].map((c) => (c >= "0" && c <= "9" ? KH[Number(c)] : c)).join(""),
    [input]
  );

  return (
    <ToolShell title="Khmer ⟷ Arabic Digits" khmerTitle="លេខខ្មែរ" description="Convert Khmer numerals (០–៩) to Arabic digits and back, leaving the rest of the text untouched.">
      <Field label="Mixed text"><TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} className="font-khmer" /></Field>
      <Output label="Khmer digits → Arabic" value={toArabic} />
      <Output label="Arabic digits → Khmer" value={toKhmer} />
    </ToolShell>
  );
}
