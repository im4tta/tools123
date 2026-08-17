"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function toCurly(text: string): string {
  let inDouble = false;
  let inSingle = false;
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' && text[i - 1] !== "\\") {
      out += inDouble ? "”" : "“";
      inDouble = !inDouble;
    } else if (c === "'" && text[i - 1] !== "\\") {
      out += inSingle ? "’" : "‘";
      inSingle = !inSingle;
    } else {
      out += c;
    }
  }
  return out;
}

function toStraight(text: string): string {
  return text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
}

export default function SmartQuotes() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("smart-quotes:input", `He said "hello" and 'goodbye'.`);
  const [mode, setMode] = useToolState("smart-quotes:mode", "toCurly");

  const output = useMemo(() => (mode === "toCurly" ? toCurly(input) : toStraight(input)), [input, mode]);

  return (
    <ToolShell
      title="Smart Quotes Converter"
      khmerTitle="បម្លែងសញ្ញាសម្រង់"
      description="Convert straight quotes to curly typographic quotes, or back."
      descriptionKm="បម្លែងសញ្ញាសម្រង់ត្រង់ទៅជាសញ្ញាសម្រង់កោង ឬបញ្ច្រាសវិញ។"
    >
      <Field label={t("Mode", "របៀប")}>
        <Select value={mode} onChange={(e) => setMode(e.target.value)} className="w-56">
          <option value="toCurly">{t("Straight → Curly", "ត្រង់ → កោង")}</option>
          <option value="toStraight">{t("Curly → Straight", "កោង → ត្រង់")}</option>
        </Select>
      </Field>
      <Field label={t("Text", "អត្ថបទ")}>
        <TextArea rows={5} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      <Output label={t("Result", "លទ្ធផល")} value={output} mono={false} />
    </ToolShell>
  );
}
