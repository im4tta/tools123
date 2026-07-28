"use client";
import { useMemo } from "react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

function segment(value: string) { return value.trim().split(/(?<=[។៕!?])\s*|\n+/u).map((part) => part.trim()).filter(Boolean); }
export default function KhmerSentenceSegmenter() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-sentence-segmenter:input", "");
  const sentences = useMemo(() => segment(input), [input]);
  return <ToolShell title="Khmer Sentence Segmenter" khmerTitle="បំបែកប្រយោគខ្មែរ" description="Split Khmer text at sentence marks, question/exclamation marks, and line breaks. This is punctuation-based, not an AI model." descriptionKm="បំបែកអត្ថបទខ្មែរត្រង់សញ្ញាខណ្ឌ សញ្ញាបញ្ចប់ សញ្ញាសួរ សញ្ញាឧទាន និងបន្ទាត់ថ្មី។ ឧបករណ៍នេះពឹងផ្អែកលើសញ្ញាវណ្ណយុត្តិ មិនមែនជាម៉ូដែលបញ្ញាសិប្បនិម្មិតទេ។">
    <Field label="Khmer text" labelKm="អត្ថបទខ្មែរ"><TextArea rows={8} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("Enter Khmer text…", "បញ្ចូលអត្ថបទខ្មែរ…")} /></Field>
    <div className="flex items-center justify-between text-xs text-[var(--ink-faint)]"><span>{sentences.length} {t("sentences", "ប្រយោគ")}</span><CopyButton text={sentences.join("\n")} /></div>
    <ol className="space-y-2">{sentences.map((sentence, index) => <li key={`${index}-${sentence}`} className="flex items-start gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3"><span className="font-mono-ui text-xs text-[var(--gold)]">{index + 1}</span><span className="flex-1 text-sm leading-7 text-[var(--ink)]">{sentence}</span><CopyButton text={sentence} compact /></li>)}</ol>
  </ToolShell>;
}
