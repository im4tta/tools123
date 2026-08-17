"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const VOWELS = new Set("aeiouy");

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  let n = 0;
  let prev = false;
  for (let i = 0; i < w.length; i++) {
    const isV = VOWELS.has(w[i]);
    if (isV && !prev) n++;
    prev = isV;
  }
  if (w.endsWith("e") && n > 1) n--;
  if (w.endsWith("le") && w.length > 2 && !"aeiou".includes(w[w.length - 3])) n++;
  return Math.max(1, n);
}

export default function SyllableCounter() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("syllable:input", "This is a sentence about syllables and rhythm.");

  const result = useMemo(() => {
    const words = input.trim() ? input.trim().split(/\s+/) : [];
    const wordSyllables = words.map((w) => ({ word: w, syllables: countSyllables(w) }));
    const total = wordSyllables.reduce((s, x) => s + x.syllables, 0);
    return { words: words.length, total, wordSyllables };
  }, [input]);

  return (
    <ToolShell
      title="Syllable Counter"
      khmerTitle="រាប់ព្យាង្គអង់គ្លេស"
      description="Count the syllables in each word of your English text — handy for poetry, lyrics, and slogans."
      descriptionKm="រាប់ព្យាង្គនៃពាក្យនីមួយៗក្នុងអត្ថបទអង់គ្លេស — មានប្រយោជន៍សម្រាប់កំណាព្យ ចម្រៀង និងស្លាកស្វាគមន៍។"
    >
      <Field label={t("Text", "អត្ថបទ")}>
        <TextArea rows={6} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      <div className="flex flex-wrap gap-3">
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-sm">
          <span className="text-[var(--ink-dim)]">{t("Total syllables", "ព្យាង្គសរុប")}: </span>
          <b className="text-[var(--ink)]">{result.total}</b>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-sm">
          <span className="text-[var(--ink-dim)]">{t("Words", "ពាក្យ")}: </span>
          <b className="text-[var(--ink)]">{result.words}</b>
        </div>
      </div>
      <Output label={t("Per word", "ម្នាក់ៗពាក្យ")} value={result.wordSyllables.map((x) => `${x.word} → ${x.syllables}`).join("\n")} />
    </ToolShell>
  );
}