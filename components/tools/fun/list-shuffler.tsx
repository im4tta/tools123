"use client";
import { useMemo, useState } from "react";
import { Shuffle } from "lucide-react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function ListShuffler() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("shuffler:input", "Alice\nBob\nCharlie\nDara\nElena");
  const [shuffled, setShuffled] = useState<string[]>([]);
  const [seed, setSeed] = useState(0);

  const list = useMemo(() => input.split("\n").map((s) => s.trim()).filter(Boolean), [input]);

  const shuffle = () => {
    const arr = [...list];
    const nextSeed = seed + 1;
    setSeed(nextSeed);
    const rng = mulberry32(nextSeed);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffled(arr);
  };

  return (
    <ToolShell
      title="List Shuffler"
      khmerTitle="សាប់បញ្ជី"
      description="Randomly reorder a list of items — one per line."
      descriptionKm="រៀបចំបញ្ជីរបស់របរឡើងវិញដោយចៃដន្យ — មួយក្នុងមួយបន្ទាត់។"
    >
      <Field label={t("Items (one per line)", "របស់ (មួយក្នុងមួយបន្ទាត់)")}>
        <TextArea rows={6} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      <Button type="button" onClick={shuffle} className="w-full">
        <Shuffle size={15} className="mr-1 inline" />
        {t("Shuffle", "សាប់")} ({list.length})
      </Button>

      {shuffled.length > 0 && (
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("New order", "លំដាប់ថ្មី")}</div>
          <ol className="list-inside list-decimal space-y-1 text-sm text-[var(--ink)]">
            {shuffled.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
      )}
    </ToolShell>
  );
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}