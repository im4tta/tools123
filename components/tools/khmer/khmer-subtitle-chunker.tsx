"use client";

import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { CopyButton } from "@/components/CopyButton";
import { Field, TextArea, TextInput, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { countSpokenSyllables, splitClusters, splitWords } from "@/lib/khmer-syllables";

// Splits a Khmer script into subtitle-length lines without breaking words
// (ICU word segmentation), then times each line from an adjustable speaking
// rate. Timings are estimates you can tune, not an official standard.
function width(s: string): number {
  return splitClusters(s).length;
}

function chunk(script: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const sentences = script.split(/([។៕!?\n]+)/);

  for (let i = 0; i < sentences.length; i += 2) {
    const body = (sentences[i] ?? "") + (sentences[i + 1] ?? "");
    if (!body.trim()) continue;
    let current = "";
    for (const w of splitWords(body)) {
      const candidate = current + w.text;
      if (current.trim() && width(candidate) > maxWidth) {
        lines.push(current.trim());
        current = w.isWord || w.text.trim() ? w.text : "";
      } else {
        current = candidate;
      }
    }
    if (current.trim()) lines.push(current.trim());
  }
  return lines;
}

function srtTime(seconds: number): string {
  const ms = Math.round(seconds * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)},${p(millis, 3)}`;
}

export default function KhmerSubtitleChunker() {
  const { text: t } = useLanguage();
  const [script, setScript] = useToolState("khmer-sub:script", "សូមស្វាគមន៍មកកាន់វីដេអូនេះ។ ថ្ងៃនេះយើងនឹងរៀនអំពីរបៀបប្រើប្រាស់ឧបករណ៍នេះឲ្យមានប្រសិទ្ធភាព។");
  const [maxWidth, setMaxWidth] = useToolState("khmer-sub:width", "40");
  const [spm, setSpm] = useToolState("khmer-sub:spm", "240");
  const [gapMs, setGapMs] = useToolState("khmer-sub:gap", "80");
  const [minDur, setMinDur] = useToolState("khmer-sub:min", "1.2");

  const { cues, srt } = useMemo(() => {
    const w = Math.max(8, Number(maxWidth) || 40);
    const rate = Math.max(1, Number(spm) || 240) / 60; // syllables per second
    const gap = Math.max(0, Number(gapMs) || 0) / 1000;
    const floor = Math.max(0.3, Number(minDur) || 1);
    const lines = chunk(script, w);

    const cues: { index: number; start: number; end: number; text: string }[] = [];
    let start = 0;
    let idx = 1;
    for (const line of lines) {
      const dur = Math.max(floor, countSpokenSyllables(line) / rate);
      cues.push({ index: idx++, start, end: start + dur, text: line });
      start = start + dur + gap;
    }
    const srt = cues.map((c) => `${c.index}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}`).join("\n\n") + (cues.length ? "\n" : "");
    return { cues, srt };
  }, [script, maxWidth, spm, gapMs, minDur]);

  return (
    <ToolShell
      title="Khmer Subtitle Chunker"
      khmerTitle="ឧបករណ៍បំបែកចំណងជើងរងខ្មែរ"
      description="Turn a Khmer script into subtitle-length lines that never break mid-word, with automatic timing from an adjustable speaking rate, and export ready-to-use SRT."
      descriptionKm="បម្លែងអត្ថបទខ្មែរទៅជាបន្ទាត់ចំណងជើងរងដែលមិនកាត់ពាក្យពាក់កណ្តាល ជាមួយការកំណត់ពេលស្វ័យប្រវត្តិពីល្បឿននិយាយ ហើយនាំចេញ SRT រួចរាល់ប្រើប្រាស់។"
    >
      <Field label="Script" labelKm="អត្ថបទ">
        <TextArea rows={5} value={script} onChange={(e) => setScript(e.target.value)} className="font-khmer text-base" />
      </Field>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Max line width (clusters)" labelKm="ទទឹងបន្ទាត់អតិបរមា (ព្យាង្គ)">
          <TextInput type="number" min="8" value={maxWidth} onChange={(e) => setMaxWidth(e.target.value)} />
        </Field>
        <Field label="Pace (syllables/min)" labelKm="ល្បឿន (ព្យាង្គ/នាទី)">
          <TextInput type="number" min="1" value={spm} onChange={(e) => setSpm(e.target.value)} />
        </Field>
        <Field label="Gap between cues (ms)" labelKm="គម្លាតរវាងចំណងជើង (ms)">
          <TextInput type="number" min="0" value={gapMs} onChange={(e) => setGapMs(e.target.value)} />
        </Field>
        <Field label="Min cue duration (s)" labelKm="រយៈពេលអប្បបរមា (វិ)">
          <TextInput type="number" min="0.3" step="0.1" value={minDur} onChange={(e) => setMinDur(e.target.value)} />
        </Field>
      </div>

      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-[var(--ink)]">{t("Cues", "ចំណងជើង")} <span className="text-xs font-normal text-[var(--ink-dim)]">({cues.length})</span></h2>
          <CopyButton text={srt} />
        </div>
        <div className="space-y-2">
          {cues.map((c) => (
            <div key={c.index} className="flex items-start gap-3 rounded-md border border-[var(--ground-line)] p-2.5">
              <span className="mt-0.5 font-mono-ui text-[10px] text-[var(--ink-faint)]">{c.index}</span>
              <div className="min-w-0 flex-1">
                <div className="font-mono-ui text-[10px] text-[var(--gold)]">{srtTime(c.start)} → {srtTime(c.end)}</div>
                <div className="font-khmer text-sm text-[var(--ink)]">{c.text}</div>
              </div>
            </div>
          ))}
          {cues.length === 0 && <p className="text-sm text-[var(--ink-faint)]">{t("Enter a script above to generate subtitle cues.", "សូមបញ្ចូលអត្ថបទខាងលើ ដើម្បីបង្កើតចំណងជើងរង។")}</p>}
        </div>
      </section>

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Words come from your browser's Khmer segmenter, so lines never split a word. Durations are estimated from the speaking rate and are meant as a starting point — review and adjust in a subtitle editor before publishing.",
          "ពាក្យមកពីកម្មវិធីបំបែកខ្មែររបស់កម្មវិធីរុករក ដូច្នេះបន្ទាត់មិនកាត់ពាក្យទេ។ រយៈពេលប៉ាន់ស្មានពីល្បឿននិយាយ ជាចំណុចចាប់ផ្តើម — សូមពិនិត្យ និងកែក្នុងកម្មវិធីកែចំណងជើងរងមុនផ្សាយ។"
        )}
      </p>
    </ToolShell>
  );
}
