"use client";

import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Select, TextArea, TextInput, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { countSentences, countSpokenSyllables } from "@/lib/khmer-syllables";

// Speaking rates are given in syllables per minute. These defaults are a
// reasonable, ADJUSTABLE starting point for read-aloud Khmer — not an official
// standard. The syllable count is exact (from the Unicode segmenter); the time
// is an estimate the user can tune with the pace and per-sentence pause.
const PACES = [
  { id: "slow", label: "Slow", km: "យឺត", spm: 180 },
  { id: "normal", label: "Normal", km: "ធម្មតា", spm: 240 },
  { id: "fast", label: "Fast", km: "លឿន", spm: 300 },
  { id: "custom", label: "Custom", km: "ផ្ទាល់ខ្លួន", spm: 0 },
] as const;

function fmtDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${String(rem).padStart(2, "0")}s` : `${rem}s`;
}

export default function KhmerSpeechTime() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-speech:input", "សូមស្វាគមន៍មកកាន់កម្មវិធីរបស់យើង។ ថ្ងៃនេះយើងនឹងនិយាយអំពីបច្ចេកវិទ្យាថ្មី។");
  const [paceId, setPaceId] = useToolState("khmer-speech:pace", "normal");
  const [customSpm, setCustomSpm] = useToolState("khmer-speech:spm", "240");
  const [pauseSec, setPauseSec] = useToolState("khmer-speech:pause", "0.5");

  const stats = useMemo(() => {
    const syllables = countSpokenSyllables(input);
    const sentences = countSentences(input);
    const pause = Math.max(0, Number(pauseSec) || 0);
    const chosen = PACES.find((p) => p.id === paceId) ?? PACES[1];
    const spm = paceId === "custom" ? Math.max(1, Number(customSpm) || 1) : chosen.spm;
    const seconds = (syllables / spm) * 60 + sentences * pause;
    const comparison = PACES.filter((p) => p.id !== "custom").map((p) => ({
      id: p.id, label: p.label, km: p.km, spm: p.spm,
      seconds: (syllables / p.spm) * 60 + sentences * pause,
    }));
    return { syllables, sentences, spm, seconds, comparison };
  }, [input, paceId, customSpm, pauseSec]);

  return (
    <ToolShell
      title="Khmer Speech Time Estimator"
      khmerTitle="ឧបករណ៍ប៉ាន់ស្មានពេលនិយាយខ្មែរ"
      description="Estimate how long a Khmer passage takes to read aloud — for voice-overs, subtitles, radio scripts, and speeches. The syllable count is exact; the time is an adjustable estimate you control with the speaking pace."
      descriptionKm="ប៉ាន់ស្មានរយៈពេលអានឮៗនៃអត្ថបទខ្មែរ — សម្រាប់ការថតសំឡេង ចំណងជើងរង អត្ថបទវិទ្យុ និងសុន្ទរកថា។ ចំនួនព្យាង្គជាក់លាក់; ចំណែករយៈពេលជាការប៉ាន់ស្មានដែលអ្នកអាចកែតាមល្បឿននិយាយ។"
    >
      <Field label="Khmer text" labelKm="អត្ថបទខ្មែរ">
        <TextArea rows={5} value={input} onChange={(e) => setInput(e.target.value)} className="font-khmer text-base" />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Speaking pace" labelKm="ល្បឿននិយាយ">
          <Select value={paceId} onChange={(e) => setPaceId(e.target.value)}>
            {PACES.map((p) => (
              <option key={p.id} value={p.id}>{t(p.label, p.km)}{p.spm ? ` (${p.spm} ${t("syll/min", "ព្យាង្គ/នាទី")})` : ""}</option>
            ))}
          </Select>
        </Field>
        {paceId === "custom" && (
          <Field label="Custom rate (syllables/min)" labelKm="អត្រាផ្ទាល់ខ្លួន (ព្យាង្គ/នាទី)">
            <TextInput type="number" min="1" value={customSpm} onChange={(e) => setCustomSpm(e.target.value)} />
          </Field>
        )}
        <Field label="Pause per sentence (seconds)" labelKm="ការផ្អាកក្នុងមួយប្រយោគ (វិនាទី)">
          <TextInput type="number" min="0" step="0.1" value={pauseSec} onChange={(e) => setPauseSec(e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-[var(--gold)]/30 bg-[var(--ground-raised)] p-4 sm:col-span-1">
          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--ink-faint)]">{t("Estimated read-aloud time", "ពេលអានឮៗប៉ាន់ស្មាន")}</div>
          <div className="mt-1 font-mono-ui text-2xl font-semibold text-[var(--gold)]">{fmtDuration(stats.seconds)}</div>
          <div className="mt-1 text-[10px] text-[var(--ink-faint)]">{t("at", "នៅ")} {stats.spm} {t("syll/min", "ព្យាង្គ/នាទី")}</div>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--ink-faint)]">{t("Syllables", "ព្យាង្គ")}</div>
          <div className="mt-1 font-mono-ui text-2xl font-semibold text-[var(--ink)]">{stats.syllables}</div>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--ink-faint)]">{t("Sentences", "ប្រយោគ")}</div>
          <div className="mt-1 font-mono-ui text-2xl font-semibold text-[var(--ink)]">{stats.sentences}</div>
        </div>
      </div>

      <section className="space-y-2 rounded-md border border-[var(--ground-line)] p-4">
        <h2 className="text-sm font-medium text-[var(--ink)]">{t("Time at each pace", "ពេលនៅល្បឿននីមួយៗ")}</h2>
        <div className="grid grid-cols-3 gap-3">
          {stats.comparison.map((c) => (
            <div key={c.id} className="text-center">
              <div className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{t(c.label, c.km)}</div>
              <div className="font-mono-ui text-sm font-semibold text-[var(--ink)]">{fmtDuration(c.seconds)}</div>
              <div className="text-[10px] text-[var(--ink-faint)]">{c.spm} {t("syll/min", "ព្យាង្គ/នាទី")}</div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "The syllable count comes from the Unicode grapheme segmenter (one Khmer cluster ≈ one syllable; Latin words and digits are counted approximately). The speaking rates are adjustable defaults, not an official reading standard — tune them to your speaker.",
          "ចំនួនព្យាង្គមកពីកម្មវិធីបំបែក Unicode (ព្យាង្គខ្មែរមួយ ≈ ព្យាង្គមួយ; ពាក្យឡាតាំង និងលេខរាប់ដោយប្រហាក់ប្រហែល)។ អត្រានិយាយជាតម្លៃលំនាំដើមអាចកែបាន មិនមែនជាស្តង់ដារអានផ្លូវការទេ — សូមកែតាមអ្នកនិយាយរបស់អ្នក។"
        )}
      </p>
    </ToolShell>
  );
}
