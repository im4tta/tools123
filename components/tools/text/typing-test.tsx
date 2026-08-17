"use client";
import { useMemo, useRef, useState } from "react";
import { ToolShell, Field, Select } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

const SAMPLES = [
  "The quick brown fox jumps over the lazy dog while the moon rises above the quiet village of Phnom Penh.",
  "In Cambodia the Mekong river flows past busy markets full of fresh fruit and smiling vendors selling mangoes.",
  "Good typing is the secret to fast work and fewer mistakes on any keyboard in any language you choose.",
  "Angkor Wat stands tall in the morning light and visitors climb the old stone steps to watch the sunrise.",
  "Practice makes perfect and every day of careful practice makes your fingers faster and more accurate.",
  "A good programmer solves problems quietly reading code carefully and testing every change before moving on.",
];

export default function TypingTest() {
  const { text: t } = useLanguage();
  const [sampleIdx, setSampleIdx] = useState(0);
  const [input, setInput] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<{ wpm: number; acc: number } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sample = SAMPLES[sampleIdx];

  const accuracy = useMemo(() => {
    const typed = input.split("");
    const correct = typed.filter((ch, i) => ch === sample[i]).length;
    const chars = typed.length;
    const acc = chars === 0 ? 100 : (correct / chars) * 100;
    return { correct, chars, acc };
  }, [input, sample]);

  const finish = (value: string) => {
    const elapsedMs = startedAt ? Date.now() - startedAt : 0;
    const elapsed = elapsedMs / 1000 / 60;
    const words = sample.split(/\s+/).length;
    const wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;
    const typed = value.split("");
    const correct = typed.filter((ch, i) => ch === sample[i]).length;
    const acc = (correct / sample.length) * 100;
    setFinished(true);
    setResults({ wpm, acc: Math.round(acc) });
  };

  const reset = () => {
    setInput("");
    setStartedAt(null);
    setFinished(false);
    setResults(null);
    inputRef.current?.focus();
  };

  const renderSample = () =>
    sample.split("").map((ch, i) => {
      const typed = input[i];
      let cls = "text-[var(--ink-faint)]";
      if (typed !== undefined) cls = typed === ch ? "text-[var(--ink)]" : "bg-[var(--danger)]/30 text-[var(--danger)]";
      return (
        <span key={i} className={cls}>
          {ch}
        </span>
      );
    });

  return (
    <ToolShell
      title="Typing Speed Test"
      khmerTitle="តេស្តល្បឿនវាយអក្សរ"
      description="Measure your words-per-minute and accuracy on a short English passage."
      descriptionKm="វាស់ចំនួនពាក្យក្នុងមួយនាទី និងភាពត្រឹមត្រូវលើអត្ថបទអង់គ្លេសខ្លី។"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Field label={t("Passage", "អត្ថបទ")}>
          <Select value={sampleIdx} onChange={(e) => { setSampleIdx(Number(e.target.value)); reset(); }}>
            {SAMPLES.map((_, i) => (
              <option key={i} value={i}>
                {t("Sample", "អត្ថបទ")} {i + 1}
              </option>
            ))}
          </Select>
        </Field>
        {!finished && (
          <div className="flex gap-4 text-sm text-[var(--ink-dim)]">
            <span>
              {t("Accuracy", "ភាពត្រឹមត្រូវ")}: <b className="text-[var(--gold)]">{accuracy.acc.toFixed(0)}%</b>
            </span>
            <span>
              {t("Progress", "វឌ្ឍនភាព")}: <b className="text-[var(--gold)]">{accuracy.correct}/{sample.length}</b>
            </span>
          </div>
        )}
      </div>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-lg leading-relaxed">
        {renderSample()}
      </div>

      {!finished ? (
        <textarea
          ref={inputRef}
          autoFocus
          value={input}
          placeholder={t("Start typing here…", "ចាប់ផ្ដើមវាយនៅទីនេះ…")}
          onChange={(e) => {
            const v = e.target.value;
            if (!startedAt) setStartedAt(Date.now());
            setInput(v);
            if (v.length >= sample.length) finish(v);
          }}
          className="h-24 w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-lg text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]"
        />
      ) : (
        <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-6 text-center">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Final result", "លទ្ធផលចុងក្រោយ")}</div>
          <div className="font-display text-4xl font-semibold text-[var(--ink)]">{results?.wpm ?? 0} <span className="text-lg text-[var(--ink-dim)]">WPM</span></div>
          <div className="mt-1 text-sm text-[var(--ink-dim)]">
            {t("Accuracy", "ភាពត្រឹមត្រូវ")}: <b className="text-[var(--gold)]">{results?.acc ?? 0}%</b>
          </div>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[var(--ground-base)] transition hover:opacity-90"
          >
            {t("Try again", "សាកល្បងម្ដងទៀត")}
          </button>
        </div>
      )}
    </ToolShell>
  );
}