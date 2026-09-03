"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ToolShell, Field, Select } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { RotateCcw } from "lucide-react";

// Built-in Khmer passages (អត្ថបទ) — short and medium length. Khmer does not
// use consistent word spacing, so this test measures characters per minute
// (CPM) rather than words per minute.
const SAMPLES = [
  {
    labelEn: "Short 1 — greeting",
    labelKm: "ខ្លី ១ — ការស្វាគមន៍",
    text: "សួស្ដី ខ្ញុំឈ្មោះណារី។ រីករាយដែលបានស្គាល់អ្នក។",
  },
  {
    labelEn: "Short 2 — the Khmer language",
    labelKm: "ខ្លី ២ — ភាសាខ្មែរ",
    text: "ភាសាខ្មែរជាភាសាជាតិរបស់កម្ពុជា។ សូមអនុវត្តការសរសេររាល់ថ្ងៃ។",
  },
  {
    labelEn: "Medium — daily practice",
    labelKm: "មធ្យម — ការអនុវត្តប្រចាំថ្ងៃ",
    text: "អក្សរខ្មែរមានព្យញ្ជនៈ ស្រៈ និងសញ្ញាសម្គាល់ផ្សេងៗ។ បើយើងអនុវត្តរាល់ថ្ងៃ យើងនឹងវាយអក្សរបានលឿន និងត្រឹមត្រូវជាងមុន។",
  },
  {
    labelEn: "Medium — about Cambodia",
    labelKm: "មធ្យម — អំពីកម្ពុជា",
    text: "ប្រទេសកម្ពុជាមានប្រាសាទអង្គរវត្ត ដែលជាសម្បត្តិវប្បធម៌ដ៏ល្បីល្បាញលើពិភពលោក។ ទន្លេមេគង្គហូរកាត់ប្រទេស ផ្ដល់ផលប្រយោជន៍ដល់កសិកម្ម។ ប្រជាជនខ្មែរមានចិត្តសប្បុរស និងរួសរាយរាក់ទាក់។ យើងទាំងអស់គ្នាគួរខំប្រឹងរៀនសូត្រ ដើម្បីអនាគតដ៏ល្អប្រសើរ។",
  },
];

type Result = { cpm: number; acc: number; errors: number; seconds: number };

export default function KhmerTypingTest() {
  const { text: t } = useLanguage();
  const [sampleIdx, setSampleIdx] = useToolState("khmer-typing-test:sample", 0);
  const [input, setInput] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<Result | null>(null);
  const [seconds, setSeconds] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sampleChars = useMemo(() => [...SAMPLES[sampleIdx].text], [sampleIdx]);

  // Live elapsed-time ticker while the test is running.
  useEffect(() => {
    if (finished || startedAt === null) return;
    const id = window.setInterval(() => setSeconds((Date.now() - startedAt) / 1000), 200);
    return () => window.clearInterval(id);
  }, [startedAt, finished]);

  const live = useMemo(() => {
    const typed = [...input];
    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === sampleChars[i]) correct += 1;
    }
    const errors = typed.length - correct;
    const acc = typed.length === 0 ? 100 : (correct / typed.length) * 100;
    const cpm = seconds > 0 ? Math.round((typed.length / seconds) * 60) : 0;
    return { correct, errors, acc, cpm, progress: Math.min(100, (typed.length / sampleChars.length) * 100) };
  }, [input, sampleChars, seconds]);

  const finish = (value: string) => {
    const elapsedMs = startedAt ? Date.now() - startedAt : 0;
    const elapsed = elapsedMs / 1000;
    const typed = [...value];
    let correct = 0;
    for (let i = 0; i < sampleChars.length; i++) {
      if (typed[i] === sampleChars[i]) correct += 1;
    }
    const errors = sampleChars.length - correct;
    const cpm = elapsed > 0 ? Math.round((sampleChars.length / elapsed) * 60) : 0;
    setFinished(true);
    setResults({ cpm, acc: Math.round((correct / sampleChars.length) * 100), errors, seconds: Math.round(elapsed) });
  };

  const reset = () => {
    setInput("");
    setStartedAt(null);
    setFinished(false);
    setResults(null);
    setSeconds(0);
    inputRef.current?.focus();
  };

  const renderSample = () =>
    sampleChars.map((ch, i) => {
      const typed = input[i];
      let cls = "text-[var(--ink-faint)]";
      if (typed !== undefined) {
        cls = typed === ch ? "text-[var(--ink)]" : "bg-[var(--danger)]/30 text-[var(--danger)]";
      }
      return (
        <span key={i} className={cls}>
          {ch}
        </span>
      );
    });

  return (
    <ToolShell
      title="Khmer Typing Test"
      khmerTitle="តេស្តល្បឿនវាយអក្សរខ្មែរ"
      description="Type a short Khmer passage and measure characters-per-minute (CPM), accuracy, and errors — with a live timer. Khmer words lack consistent spacing, so CPM (not WPM) is used here."
      descriptionKm="វាយអត្ថបទខ្មែរខ្លីមួយ ហើយវាស់ចំនួនតួអក្សរក្នុងមួយនាទី (CPM) ភាពត្រឹមត្រូវ និងកំហុស — ជាមួយម៉ោងរាប់ផ្ទាល់។ ដោយសារពាក្យខ្មែរគ្មានដកឃ្លាទៀងទាត់ គេវាស់ជាតួអក្សរក្នុងមួយនាទី (CPM) មិនមែន WPM ទេ។"
    >
      <div className="flex flex-wrap items-end gap-3">
        <Field label={t("Passage", "អត្ថបទ")}>
          <Select
            value={sampleIdx}
            onChange={(e) => {
              setSampleIdx(Number(e.target.value));
              reset();
            }}
          >
            {SAMPLES.map((s, i) => (
              <option key={s.labelEn} value={i}>
                {t(s.labelEn, s.labelKm)}
              </option>
            ))}
          </Select>
        </Field>
        {!finished && (
          <div className="flex flex-wrap gap-4 pb-2 text-sm text-[var(--ink-dim)]">
            <span>
              {t("Time", "ពេលវេលា")}: <b className="font-mono-ui text-[var(--gold)]">{seconds.toFixed(1)}s</b>
            </span>
            <span>
              {t("CPM", "អក្សរ/នាទី")}: <b className="text-[var(--gold)]">{live.cpm}</b>
            </span>
            <span>
              {t("Accuracy", "ភាពត្រឹមត្រូវ")}: <b className="text-[var(--gold)]">{live.acc.toFixed(0)}%</b>
            </span>
            <span>
              {t("Errors", "កំហុស")}: <b className="text-[var(--danger)]">{live.errors}</b>
            </span>
          </div>
        )}
      </div>

      <div lang="km" className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 font-khmer text-xl leading-relaxed">
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
            if (v.length >= sampleChars.length) finish(v);
          }}
          onPaste={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          lang="km"
          className="h-28 w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 font-khmer text-xl leading-relaxed text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]"
        />
      ) : (
        <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-6 text-center">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
            {t("Final result", "លទ្ធផលចុងក្រោយ")}
          </div>
          <div className="font-display text-4xl font-semibold text-[var(--ink)]">
            {results?.cpm ?? 0} <span className="text-lg text-[var(--ink-dim)]">{t("CPM", "អក្សរ/នាទី")}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-[var(--ink-dim)]">
            <span>
              {t("Accuracy", "ភាពត្រឹមត្រូវ")}: <b className="text-[var(--gold)]">{results?.acc ?? 0}%</b>
            </span>
            <span>
              {t("Errors", "កំហុស")}: <b className="text-[var(--danger)]">{results?.errors ?? 0}</b>
            </span>
            <span>
              {t("Time", "ពេលវេលា")}: <b className="font-mono-ui text-[var(--ink)]">{results?.seconds ?? 0}s</b>
            </span>
          </div>
          <Button type="button" onClick={reset} className="mt-5 inline-flex items-center gap-1.5">
            <RotateCcw size={14} />
            {t("Try again", "សាកល្បងម្ដងទៀត")}
          </Button>
        </div>
      )}

      <p className="text-xs text-[var(--ink-dim)]">
        {t("Characters are matched in order against the passage; Khmer vowel signs and diacritics count as characters. Since Khmer is written without consistent word boundaries, speed is reported in characters per minute (CPM) instead of words per minute.", "តួអក្សរត្រូវបានផ្គូផ្គងតាមលំដាប់ជាមួយអត្ថបទ; ស្រៈនិស្ស័យ និងវណ្ណយុត្តិខ្មែររាប់ជាតួអក្សរ។ ដោយសារការសរសេរខ្មែរគ្មានព្រំដែនពាក្យច្បាស់លាស់ ល្បឿនត្រូវរាយការណ៍ជាតួអក្សរក្នុងមួយនាទី (CPM) ជំនួសឱ្យពាក្យក្នុងមួយនាទី។")}
      </p>
    </ToolShell>
  );
}
