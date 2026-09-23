"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { splitClusters, splitWords } from "@/lib/khmer-syllables";
import { msPerWord } from "@/lib/khmer-learning";

const KHMER_LETTER = /[ក-ឳ]/;
const SAMPLE = "ថ្ងៃនេះ ខ្ញុំទៅសាលារៀនជាមួយមិត្តភក្តិ។ យើងរៀនអាន និងសរសេរភាសាខ្មែរ។ គ្រូបង្រៀនយើងឱ្យអានយឺតៗ និងច្បាស់ៗ។ បន្ទាប់ពីរៀនរួច យើងលេងនៅទីធ្លាសាលា។";

type Unit = "word" | "syllable";
const SPEEDS = [20, 40, 60, 90, 120];
const SIZES = [
  { id: "md", cls: "text-2xl", en: "Medium", km: "មធ្យម" },
  { id: "lg", cls: "text-3xl", en: "Large", km: "ធំ" },
  { id: "xl", cls: "text-5xl", en: "Extra large", km: "ធំណាស់" },
];

const KH = "០១២៣៤៥៦៧៨៩";
const kh = (n: number) => String(n).replace(/\d/g, (d) => KH[Number(d)]);

export default function KhmerGuidedReader() {
  const { text: t } = useLanguage();
  const [passage, setPassage] = useToolState("khmer-guided-reader:passage", SAMPLE);
  const [unit, setUnit] = useToolState<Unit>("khmer-guided-reader:unit", "word");
  const [speed, setSpeed] = useToolState("khmer-guided-reader:speed", 40);
  const [size, setSize] = useToolState("khmer-guided-reader:size", "lg");
  const [pos, setPos] = useState(-1);
  const [playing, setPlaying] = useState(false);

  // Tokens keep spaces/punctuation so the passage reads naturally; only Khmer
  // words (or syllables) are "steps" the highlight moves through.
  const tokens = useMemo(() => {
    if (unit === "word") return splitWords(passage).map((w) => ({ text: w.text, step: w.isWord && KHMER_LETTER.test(w.text) }));
    const out: { text: string; step: boolean }[] = [];
    for (const g of [...new Intl.Segmenter("km", { granularity: "grapheme" }).segment(passage)].map((s) => s.segment)) {
      out.push({ text: g, step: KHMER_LETTER.test(g) && splitClusters(g).length > 0 });
    }
    return out;
  }, [passage, unit]);
  const steps = useMemo(() => tokens.map((tok, i) => (tok.step ? i : -1)).filter((i) => i >= 0), [tokens]);
  const current = pos >= 0 && pos < steps.length ? steps[pos] : -1;

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => {
      if (pos + 1 >= steps.length) setPlaying(false);
      else setPos(pos + 1);
    }, msPerWord(speed));
    return () => window.clearTimeout(id);
  }, [playing, pos, steps.length, speed]);

  const play = () => { if (pos < 0 || pos >= steps.length - 1) setPos(0); setPlaying(true); };
  const step = (d: number) => { setPlaying(false); setPos((p) => Math.min(steps.length - 1, Math.max(0, p + d))); };
  const reset = () => { setPlaying(false); setPos(-1); };
  const sizeCls = SIZES.find((s) => s.id === size)?.cls ?? "text-3xl";

  return (
    <ToolShell
      title="Khmer Guided Reader"
      khmerTitle="ជំនួយការអានខ្មែរតាមល្បឿន"
      description="A reading companion for children and new readers of Khmer: the passage is shown in large type and a highlight moves through it one word — or one syllable — at a time, at a pace you choose. Pause, step back and forward, and speed up as reading improves. Paste any text; nothing leaves your browser."
      descriptionKm="ជំនួយការអានសម្រាប់កុមារ និងអ្នកទើបរៀនអានភាសាខ្មែរ៖ អត្ថបទបង្ហាញជាអក្សរធំ ហើយពន្លឺរំកិលម្តងមួយពាក្យ — ឬម្តងមួយព្យាង្គ — តាមល្បឿនដែលអ្នកជ្រើស។ ផ្អាក ថយក្រោយ និងទៅមុខ ហើយបង្កើនល្បឿននៅពេលអានបានល្អជាងមុន។ បិទភ្ជាប់អត្ថបទណាក៏បាន គ្មានអ្វីចេញពីកម្មវិធីរុករករបស់អ្នកទេ។"
    >
      {!playing && pos < 0 && (
        <Field label="Passage" labelKm="អត្ថបទ">
          <TextArea value={passage} onChange={(e) => setPassage(e.target.value)} rows={4} lang="km" className="font-khmer" />
        </Field>
      )}

      <PillGroup label={t("Move by", "រំកិលតាម")}>
        <Pill active={unit === "word"} onClick={() => { setUnit("word"); reset(); }}>{t("Word", "ពាក្យ")}</Pill>
        <Pill active={unit === "syllable"} onClick={() => { setUnit("syllable"); reset(); }}>{t("Syllable", "ព្យាង្គ")}</Pill>
      </PillGroup>
      <PillGroup label={t(`Speed (${unit === "word" ? "words" : "syllables"} per minute)`, `ល្បឿន (${unit === "word" ? "ពាក្យ" : "ព្យាង្គ"}ក្នុងមួយនាទី)`)}>
        {SPEEDS.map((s) => <Pill key={s} active={speed === s} onClick={() => setSpeed(s)}>{t(String(s), kh(s))}</Pill>)}
      </PillGroup>
      <PillGroup label={t("Text size", "ទំហំអក្សរ")}>
        {SIZES.map((s) => <Pill key={s.id} active={size === s.id} onClick={() => setSize(s.id)}>{t(s.en, s.km)}</Pill>)}
      </PillGroup>

      <div className="flex flex-wrap items-center gap-2">
        {playing
          ? <PillAction onClick={() => setPlaying(false)}><Pause size={13} />{t("Pause", "ផ្អាក")}</PillAction>
          : <PillAction onClick={play} disabled={steps.length === 0}><Play size={13} />{pos >= 0 ? t("Resume", "បន្ត") : t("Start", "ចាប់ផ្តើម")}</PillAction>}
        <PillAction onClick={() => step(-1)} disabled={pos <= 0}><ChevronLeft size={13} />{t("Back", "ថយក្រោយ")}</PillAction>
        <PillAction onClick={() => step(1)} disabled={pos >= steps.length - 1}>{t("Next", "បន្ទាប់")}<ChevronRight size={13} /></PillAction>
        <PillAction onClick={reset} disabled={pos < 0}><RotateCcw size={13} />{t("Reset", "កំណត់ឡើងវិញ")}</PillAction>
        {pos >= 0 && <span className="text-xs text-[var(--ink-faint)]">{t(`${pos + 1} / ${steps.length}`, `${kh(pos + 1)} / ${kh(steps.length)}`)}</span>}
      </div>

      <div lang="km" className={`rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 font-khmer leading-[1.9] text-[var(--ink-faint)] ${sizeCls}`}>
        {tokens.map((tok, i) => (
          <span
            key={i}
            className={i === current ? "rounded bg-[var(--gold)]/30 text-[var(--ink)]" : current >= 0 && i < current ? "text-[var(--ink-dim)]" : current < 0 ? "text-[var(--ink)]" : ""}
          >
            {tok.text}
          </span>
        ))}
      </div>

      <SourceCredits>
        <p>{t(
          "Word steps come from the browser's Unicode (ICU) Khmer word segmenter and syllable steps from Khmer grapheme clusters (Intl.Segmenter); both are approximate, so a highlight may occasionally cover two short words or split a compound. The speed presets are simple choices, not reading-level standards — start slow and adjust. Original Tools123 implementation.",
          "ជំហានពាក្យមកពីកម្មវិធីបំបែកពាក្យខ្មែរ Unicode (ICU) របស់កម្មវិធីរុករក ហើយជំហានព្យាង្គមកពីក្រុមអក្សរខ្មែរ (Intl.Segmenter) ទាំងពីរជាការប៉ាន់ស្មាន ដូច្នេះពន្លឺពេលខ្លះអាចគ្របពាក្យខ្លីពីរ ឬបំបែកពាក្យផ្សំ។ ល្បឿនដែលកំណត់ស្រាប់ជាជម្រើសសាមញ្ញ មិនមែនស្តង់ដារកម្រិតអានទេ — ចាប់ផ្តើមយឺតៗ ហើយកែតាមតម្រូវការ។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
