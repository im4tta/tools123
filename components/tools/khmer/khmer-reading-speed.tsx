"use client";
import { useMemo, useRef, useState } from "react";
import { Play, RotateCcw, Square } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { PillAction } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { splitClusters, splitWords } from "@/lib/khmer-syllables";
import { perMinute } from "@/lib/khmer-learning";

const KHMER_LETTER = /[ក-ឳ]/;
const SAMPLE = "ទន្លេមេគង្គហូរកាត់ប្រទេសកម្ពុជាពីខាងជើងទៅខាងត្បូង។ នៅរដូវវស្សា ទឹកទន្លេឡើងខ្ពស់ ហើយហូរចូលបឹងទន្លេសាប ធ្វើឱ្យបឹងរីកធំជាងមុនច្រើនដង។ នៅរដូវប្រាំង ទឹកហូរត្រឡប់មកវិញ។ អ្នកនេសាទជាច្រើនរស់នៅតាមមាត់ទន្លេ និងពឹងផ្អែកលើត្រីសម្រាប់ជីវភាពប្រចាំថ្ងៃ។ ត្រីជាអាហារសំខាន់មួយរបស់ប្រជាជនខ្មែរ។";

type Attempt = { at: string; wpm: number; spm: number; seconds: number };

const KH = "០១២៣៤៥៦៧៨៩";
const kh = (n: number) => String(n).replace(/\d/g, (d) => KH[Number(d)]);

export default function KhmerReadingSpeed() {
  const { text: t } = useLanguage();
  const [passage, setPassage] = useToolState("khmer-reading-speed:passage", SAMPLE);
  const [history, setHistory] = useToolState<Attempt[]>("khmer-reading-speed:history", []);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [result, setResult] = useState<Attempt | null>(null);
  const startRef = useRef<number | null>(null);

  const counts = useMemo(() => {
    const words = splitWords(passage).filter((w) => w.isWord && KHMER_LETTER.test(w.text)).length;
    const syllables = splitClusters(passage).filter((c) => KHMER_LETTER.test(c)).length;
    return { words, syllables };
  }, [passage]);

  const start = () => {
    const now = performance.now();
    startRef.current = now;
    setStartedAt(now);
    setResult(null);
  };

  const stop = () => {
    if (startRef.current === null) return;
    const elapsed = performance.now() - startRef.current;
    startRef.current = null;
    setStartedAt(null);
    const attempt: Attempt = {
      at: new Date().toISOString(),
      wpm: Math.round(perMinute(counts.words, elapsed)),
      spm: Math.round(perMinute(counts.syllables, elapsed)),
      seconds: Math.round(elapsed / 100) / 10,
    };
    setResult(attempt);
    setHistory([attempt, ...history].slice(0, 10));
  };

  const reading = startedAt !== null;

  return (
    <ToolShell
      title="Khmer Reading Speed Test"
      khmerTitle="តេស្តល្បឿនអានខ្មែរ"
      description="Measure how fast you read Khmer. Use the sample passage or paste your own, press Start, read at your normal pace (silently or aloud), and press Done. You get your speed in words and syllables per minute, plus a history of your last ten attempts so you or your students can track progress. Everything stays in your browser."
      descriptionKm="វាស់ល្បឿនអានភាសាខ្មែររបស់អ្នក។ ប្រើអត្ថបទគំរូ ឬបិទភ្ជាប់អត្ថបទផ្ទាល់ខ្លួន ចុច ចាប់ផ្តើម អានតាមល្បឿនធម្មតា (អានក្នុងចិត្ត ឬអានឮៗ) ហើយចុច រួចរាល់។ អ្នកទទួលបានល្បឿនជាពាក្យ និងព្យាង្គក្នុងមួយនាទី ព្រមទាំងប្រវត្តិនៃការសាកល្បងដប់ដងចុងក្រោយ ដើម្បីឱ្យអ្នក ឬសិស្សរបស់អ្នកតាមដានការរីកចម្រើន។ អ្វីៗនៅក្នុងកម្មវិធីរុករករបស់អ្នក។"
    >
      {!reading && (
        <Field label="Passage" labelKm="អត្ថបទ" hint={`${counts.words} words · ${counts.syllables} syllables`} hintKm={`${kh(counts.words)} ពាក្យ · ${kh(counts.syllables)} ព្យាង្គ`}>
          <TextArea value={passage} onChange={(e) => setPassage(e.target.value)} rows={5} lang="km" className="font-khmer" />
        </Field>
      )}

      {reading ? (
        <div className="space-y-4">
          <div lang="km" className="rounded-md border border-[var(--gold)] bg-[var(--ground-raised)] p-5 font-khmer text-xl leading-[2.2] text-[var(--ink)]">{passage}</div>
          <Button onClick={stop} className="flex items-center gap-2"><Square size={15} />{t("Done reading", "អានរួចរាល់")}</Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={start} disabled={counts.words === 0} className="flex items-center gap-2"><Play size={15} />{t("Start reading", "ចាប់ផ្តើមអាន")}</Button>
          <PillAction onClick={() => setPassage(SAMPLE)}>{t("Use the sample passage", "ប្រើអត្ថបទគំរូ")}</PillAction>
        </div>
      )}

      {result && !reading && (
        <div className="grid grid-cols-3 gap-3" role="status">
          {[
            [t("Words / minute", "ពាក្យ / នាទី"), t(String(result.wpm), kh(result.wpm))],
            [t("Syllables / minute", "ព្យាង្គ / នាទី"), t(String(result.spm), kh(result.spm))],
            [t("Time", "រយៈពេល"), t(`${result.seconds}s`, `${kh(result.seconds)} វិនាទី`)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <div className="text-xs text-[var(--ink-faint)]">{label}</div>
              <div className="mt-1 text-2xl font-semibold text-[var(--ink)]">{value}</div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && !reading && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Recent attempts", "ការសាកល្បងថ្មីៗ")}</span>
            <PillAction onClick={() => setHistory([])}><RotateCcw size={13} />{t("Clear", "សម្អាត")}</PillAction>
          </div>
          <ul className="divide-y divide-[var(--ground-line)] rounded-md border border-[var(--ground-line)] text-sm">
            {history.map((h) => (
              <li key={h.at} className="flex flex-wrap justify-between gap-2 px-3 py-2 text-[var(--ink-dim)]">
                <span>{new Date(h.at).toLocaleString()}</span>
                <span className="text-[var(--ink)]">{t(`${h.wpm} wpm · ${h.spm} syllables/min · ${h.seconds}s`, `${kh(h.wpm)} ពាក្យ/នាទី · ${kh(h.spm)} ព្យាង្គ/នាទី · ${kh(h.seconds)} វិនាទី`)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <SourceCredits>
        <p>{t(
          "Words are counted with the browser's Unicode (ICU) Khmer word segmenter and syllables as Khmer orthographic clusters (Intl.Segmenter). Khmer is written without spaces, so word counts are approximate — the syllable rate is the more stable number for comparing attempts. This tool deliberately shows no “average reader” benchmark: speeds depend heavily on the text, reading aloud vs silently, and the reader, so compare your own attempts on similar passages. History is saved in this browser only. Original Tools123 implementation.",
          "ពាក្យត្រូវរាប់ដោយកម្មវិធីបំបែកពាក្យខ្មែរ Unicode (ICU) របស់កម្មវិធីរុករក ហើយព្យាង្គជាក្រុមអក្សរខ្មែរ (Intl.Segmenter)។ ភាសាខ្មែរសរសេរគ្មានចន្លោះ ដូច្នេះចំនួនពាក្យជាការប៉ាន់ស្មាន — ល្បឿនព្យាង្គជាលេខដែលថេរជាងសម្រាប់ប្រៀបធៀបការសាកល្បង។ ឧបករណ៍នេះមិនបង្ហាញស្តង់ដារ «អ្នកអានមធ្យម» ទេ៖ ល្បឿនអាស្រ័យខ្លាំងលើអត្ថបទ ការអានឮៗ ឬក្នុងចិត្ត និងអ្នកអាន ដូច្នេះសូមប្រៀបធៀបការសាកល្បងរបស់អ្នកផ្ទាល់លើអត្ថបទស្រដៀងគ្នា។ ប្រវត្តិរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
