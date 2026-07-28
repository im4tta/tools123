"use client";
import { useMemo } from "react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

function normalizeKhmer(value: string) { return value.normalize("NFC").replace(/[\u200B\u200C\u200D\uFEFF]+/g, "").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim(); }
export default function KhmerUnicodeNormalizer() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-unicode-normalizer:input", "");
  const output = useMemo(() => normalizeKhmer(input), [input]);
  return <ToolShell title="Khmer Unicode Normalizer" khmerTitle="សម្អាតយូនីកូដខ្មែរ" description="Normalize Khmer text to NFC and remove invisible zero-width/BOM characters plus accidental spacing." descriptionKm="កែសម្រួលអត្ថបទខ្មែរទៅជាទម្រង់ NFC ដកតួអក្សរមើលមិនឃើញ និងដកចន្លោះដែលមិនចាំបាច់។ សូមពិនិត្យលទ្ធផលមុនជំនួសអត្ថបទដើម។">
    <Field label="Input" labelKm="អត្ថបទដើម"><TextArea rows={7} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("Paste Khmer Unicode text…", "បិទភ្ជាប់អត្ថបទយូនីកូដខ្មែរ…")} /></Field>
    <Field label="Normalized output" labelKm="លទ្ធផលដែលបានសម្អាត" hint={`${output.length} ${t("characters", "តួអក្សរ")}`}><div className="relative"><TextArea rows={7} value={output} readOnly className="pr-12" /><CopyButton text={output} compact className="absolute right-2 top-2" /></div></Field>
  </ToolShell>;
}
