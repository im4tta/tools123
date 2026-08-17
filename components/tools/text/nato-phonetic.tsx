"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const NATO: Record<string, string> = {
  a: "Alpha", b: "Bravo", c: "Charlie", d: "Delta", e: "Echo", f: "Foxtrot",
  g: "Golf", h: "Hotel", i: "India", j: "Juliett", k: "Kilo", l: "Lima",
  m: "Mike", n: "November", o: "Oscar", p: "Papa", q: "Quebec", r: "Romeo",
  s: "Sierra", t: "Tango", u: "Uniform", v: "Victor", w: "Whiskey", x: "X-ray",
  y: "Yankee", z: "Zulu",
};

export default function NatoPhonetic() {
  const { text: t } = useLanguage();
  const [value, setValue] = useToolState("nato-phonetic:input", "hello world");

  const phonetic = useMemo(() => {
    return [...value.toLowerCase()].map((ch) => {
      if (ch === " ") return " ";
      const w = NATO[ch];
      return w ? w : ch;
    }).join("  ");
  }, [value]);

  return (
    <ToolShell
      title="NATO Phonetic Alphabet"
      khmerTitle="អក្ខរក្រមសូរសព្ទ NATO"
      description="Spell out text using the NATO phonetic alphabet (A → Alpha, B → Bravo…)."
      descriptionKm="សរសេរអក្សរដោយប្រើអក្ខរក្រមសូរសព្ទ NATO (A → Alpha, B → Bravo…)។"
    >
      <Field label={t("Text", "អត្ថបទ")}>
        <TextInput value={value} onChange={(e) => setValue(e.target.value)} />
      </Field>
      <Output label={t("Phonetic", "សូរសព្ទ")} value={phonetic} mono={false} />
    </ToolShell>
  );
}
