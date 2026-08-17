"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function bionic(text: string): string {
  return text
    .split(/(\s+)/)
    .map((word) => {
      if (!/[a-zA-Z]/.test(word)) return word;
      const half = Math.max(1, Math.ceil(word.length / 2));
      const head = word.slice(0, half);
      const tail = word.slice(half);
      return `<b>${head}</b>${tail}`;
    })
    .join("");
}

export default function BionicReading() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("bionic:input", "This is a tool that bolds the beginning of each word, making long paragraphs faster and easier to read.");

  const output = useMemo(() => (input.trim() ? bionic(input) : ""), [input]);

  return (
    <ToolShell
      title="Bionic Reading Converter"
      khmerTitle="បម្លែងអក្សរសម្រាប់អានលឿន"
      description="Bold the first half of each word so the eye skims text faster."
      descriptionKm="ដិតពាក់កណ្ដាលដើមនៃពាក្យនីមួយៗ ដើម្បីឱ្យភ្នែកអានអត្ថបទបានលឿន។"
    >
      <Field label={t("Text", "អត្ថបទ")}>
        <TextArea rows={6} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 leading-loose text-[var(--ink)]">
        <p dangerouslySetInnerHTML={{ __html: output || " " }} />
      </div>
      <Output label={t("HTML output", "លទ្ធផល HTML")} value={output} />
    </ToolShell>
  );
}