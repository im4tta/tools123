"use client";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";
import { useToolState } from "@/lib/storage";
import { KHMER_CONSONANTS } from "@/lib/data/khmer-romanization";

// Series come from the shared consonant table so every Khmer tool agrees on them.
const consonantsOf = (series: 1 | 2) => new Set(Object.entries(KHMER_CONSONANTS).filter(([, c]) => c.series === series).map(([letter]) => letter));
const SERIES1 = consonantsOf(1);
const SERIES2 = consonantsOf(2);

export default function ConsonantClassifier() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("consonant-classifier:input", "កខគឃងចឆជឈ");
  const chars = [...input].filter((c) => SERIES1.has(c) || SERIES2.has(c));

  return (
    <ToolShell title="Consonant Series Classifier" khmerTitle="អក្សរជើង" description="Every Khmer consonant belongs to the 1st series (â-register) or 2nd series (ô-register), which determines how dependent vowels are pronounced." descriptionKm="ព្យញ្ជនៈខ្មែរនីមួយៗស្ថិតក្នុងពួកទី ១ (សំឡេងអ) ឬពួកទី ២ (សំឡេងអូ) ដែលកំណត់របៀបអានស្រៈនិស្ស័យ។">
      <Field label="Khmer consonants" labelKm="ព្យញ្ជនៈខ្មែរ"><TextInput value={input} onChange={(e) => setInput(e.target.value)} className="font-khmer text-lg" /></Field>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
        {chars.map((c, i) => (
          <div key={i} className={`rounded-md border p-3 text-center font-khmer text-2xl ${SERIES1.has(c) ? "border-[var(--slate-accent-dim)] bg-[var(--slate-accent-dim)]/15 text-[var(--slate-accent)]" : "border-[var(--teal-dim)] bg-[var(--teal-dim)]/15 text-[var(--teal)]"}`}>
            {c}
            <div className="mt-1 text-[10px] font-mono-ui uppercase tracking-wide">{SERIES1.has(c) ? t("1st", "ទី ១") : t("2nd", "ទី ២")}</div>
          </div>
        ))}
      </div>
    </ToolShell>
  );
}
