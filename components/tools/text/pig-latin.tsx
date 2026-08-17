"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function pigLatin(word: string): string {
  const vowels = new Set(["a", "e", "i", "o", "u"]);
  const isCap = word[0] === word[0].toUpperCase();
  const leading = (word.match(/^[^a-zA-Z]*/) ?? [""])[0];
  const core = word.slice(leading.length);
  const trailing = (word.match(/[^a-zA-Z]*$/) ?? [""])[0];
  if (!core) return word;
  const c = core.toLowerCase();
  const clean = c.replace(/[^a-zA-Z]/g, "");
  const punct = c.slice(clean.length);
  let out: string;
  if (vowels.has(clean[0])) out = clean + "way";
  else {
    const idx = clean.split("").findIndex((ch) => vowels.has(ch));
    if (idx === -1) out = clean + "ay";
    else out = clean.slice(idx) + clean.slice(0, idx) + "ay";
  }
  if (isCap) out = out[0].toUpperCase() + out.slice(1);
  return leading + out + punct + trailing;
}

export default function PigLatin() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("pig-latin:input", "Hello world, this is fun!");

  const output = useMemo(
    () => (input.trim() ? input.split(/(\s+)/).map((w) => pigLatin(w)).join("") : ""),
    [input],
  );

  return (
    <ToolShell
      title="Pig Latin Translator"
      khmerTitle="បម្លែង Pig Latin"
      description="Convert English text to Pig Latin — a playful word game language."
      descriptionKm="បម្លែងអត្ថបទអង់គ្លេសទៅជា Pig Latin — ភាសាលេងសប្បាយ។"
    >
      <Field label={t("English", "អង់គ្លេស")}>
        <TextArea rows={5} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      <Output label="Pig Latin" value={output} mono={false} />
    </ToolShell>
  );
}