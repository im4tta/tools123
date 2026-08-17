"use client";
import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ToolShell, Field } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";

const L1 = ["silent", "green", "golden", "soft", "cold", "warm", "dark", "still", "bright", "quiet", "wild", "gentle"];
const L2 = ["rain", "moon", "river", "market", "village", "sunrise", "monsoon", "wind", "star", "lotus", "temple", "bamboo"];
const L3 = ["gently falls", "slowly fades", "drifts away", "keeps on shining", "calls me home", "wakes the day", "flows forever", "whispers low", "burns so bright", "sings at dawn"];

function makeHaiku(): string {
  const a = () => L1[Math.floor(Math.random() * L1.length)];
  const b = () => L2[Math.floor(Math.random() * L2.length)];
  const c = () => L3[Math.floor(Math.random() * L3.length)];
  return `${a()} ${b()},\n${a()} ${b()} ${c()},\n${a()} ${b()}.`;
}

export default function HaikuGenerator() {
  const { text: t } = useLanguage();
  const [haiku, setHaiku] = useState(() => makeHaiku());

  const syllableCount = useMemo(
    () => haiku.split(/\s+/).reduce((s, w) => s + Math.max(1, Math.min(3, (w.match(/[aeiouy]/gi) ?? []).length)), 0),
    [haiku],
  );

  return (
    <ToolShell
      title="Haiku Generator"
      khmerTitle="បង្កើតកំណាព្យ Haiku"
      description="Generate a random 5-7-5 syllable haiku poem."
      descriptionKm="បង្កើតកំណាព្យ haiku ៥-៧-៥ ព្យាង្គចៃដន្យ។"
    >
      <Field label={t("Your haiku", "Haiku របស់អ្នក")}>
        <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-5">
          <pre className="whitespace-pre-wrap font-display text-lg leading-loose text-[var(--ink)]">{haiku}</pre>
          <div className="mt-2 text-xs text-[var(--ink-dim)]">≈ {syllableCount} {t("syllables", "ព្យាង្គ")}</div>
        </div>
      </Field>
      <Button type="button" onClick={() => setHaiku(makeHaiku())} className="w-full">
        <RefreshCw size={15} className="mr-1 inline" />
        {t("New haiku", "Haiku ថ្មី")}
      </Button>
    </ToolShell>
  );
}