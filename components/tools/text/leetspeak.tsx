"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const LEET: Record<string, string> = {
  a: "4", b: "8", e: "3", g: "9", i: "1", l: "1", o: "0", s: "5", t: "7", z: "2",
};

export default function Leetspeak() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("leetspeak:input", "hello world");
  const [mode, setMode] = useToolState("leetspeak:mode", "to");

  const output = useMemo(() => {
    if (mode === "to") {
      return input
        .split("")
        .map((ch) => LEET[ch.toLowerCase()] ?? ch)
        .join("");
    }
    const reverse = Object.fromEntries(Object.entries(LEET).map(([k, v]) => [v, k]));
    return input
      .split("")
      .map((ch) => reverse[ch.toLowerCase()] ?? ch)
      .join("");
  }, [input, mode]);

  return (
    <ToolShell
      title="Leetspeak Converter"
      khmerTitle="បំប្លែង Leetspeak"
      description="Convert text to and from leetspeak (1337) — a → 4, e → 3, and so on."
      descriptionKm="បំប្លែងអត្ថបទទៅជា leetspeak (1337) និងពី leetspeak មកវិញ — a → 4, e → 3 ជាដើម។"
    >
      <Field label={t("Mode", "របៀប")}>
        <Select value={mode} onChange={(e) => setMode(e.target.value)} className="w-48">
          <option value="to">{t("Text → Leetspeak", "អត្ថបទ → Leetspeak")}</option>
          <option value="from">{t("Leetspeak → Text", "Leetspeak → អត្ថបទ")}</option>
        </Select>
      </Field>
      <Field label={t("Text", "អត្ថបទ")}>
        <TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      <Output label={t("Result", "លទ្ធផល")} value={output} />
    </ToolShell>
  );
}
