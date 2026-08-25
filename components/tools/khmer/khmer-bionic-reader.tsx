"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// Split text into grapheme clusters (keeps a stacked Khmer syllable — base
// consonant + subscript + vowel — as one unit).
function graphemes(text: string): string[] {
  try {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment);
  } catch {
    return Array.from(text);
  }
}

const KH = /[\u1780-\u17FF]/;

// Bold the leading `boldCount` graphemes of each Khmer word run, and the leading
// half of each Latin word (classic bionic) — keeping stacked syllables intact.
function buildHtml(text: string, boldCount: number): string {
  const segs = graphemes(text);
  let run = 0;
  let html = "";
  for (let i = 0; i < segs.length; i++) {
    const g = segs[i];
    if (/^\s+$/.test(g)) { run = 0; html += g; continue; }
    if (KH.test(g)) {
      html += run < boldCount ? `<b>${g}</b>` : g;
      run++;
    } else {
      const half = Math.max(1, Math.ceil(g.length / 2));
      html += `<b>${g.slice(0, half)}</b>${g.slice(half)}`;
    }
  }
  return html;
}

export default function KhmerBionicReader() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-bionic:input", "រាជធានីភ្នំពេញ ជាទីក្រុងធំបំផុតរបស់កម្ពុជា និងជាមជ្ឈមណ្ឌលសេដ្ឋកិច្ច នយោបាយ និងវប្បធម៌របស់ប្រទេស។ ភាសាខ្មែរមានអក្សរស្រស់ស្អាត និងការសរសេរពិសេស។");
  const [intensity, setIntensity] = useToolState<1 | 2 | 3>("khmer-bionic:intensity", 2);

  const html = useMemo(() => (input.trim() ? buildHtml(input, intensity) : ""), [input, intensity]);
  const plain = useMemo(() => graphemes(input).filter((g) => KH.test(g)).length, [input]);

  const levelNote =
    intensity === 1
      ? t("Light: bold 1 leading cluster per Khmer word.", "ស្រាល៖ ដិត 1 ក្រុមនាំមុខនៃពាក្យខ្មែរនីមួយៗ។")
      : intensity === 2
        ? t("Medium: bold 2 leading clusters per Khmer word.", "មធ្យម៖ ដិត 2 ក្រុមនាំមុខនៃពាក្យខ្មែរនីមួយៗ។")
        : t("Strong: bold 3 leading clusters per Khmer word.", "ខ្លាំង៖ ដិត 3 ក្រុមនាំមុខនៃពាក្យខ្មែរនីមួយៗ។");

  return (
    <ToolShell
      title="Khmer Bionic Reader"
      khmerTitle="អានខ្មែរលឿន"
      description="Bold the leading grapheme clusters of each Khmer word so your eye skims stacked-syllable text faster — a Khmer-tuned bionic reader."
      descriptionKm="ដិតក្រុមអក្សរនាំមុខនៃពាក្យខ្មែរនីមួយៗ ដើម្បីឱ្យភ្នែកស្កេនអត្ថបទដែលមានព្យាង្គពីរតួគ្នាបានលឿនជាងមុន។"
    >
      <Field label={t("Text", "អត្ថបទ")}>
        <TextArea rows={7} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>

      <Field label={t("Intensity", "កម្រិត")}>
        <Select value={String(intensity)} onChange={(e) => setIntensity(Number(e.target.value) as 1 | 2 | 3)}>
          <option value="1">{t("Light", "ស្រាល")}</option>
          <option value="2">{t("Medium", "មធ្យម")}</option>
          <option value="3">{t("Strong", "ខ្លាំង")}</option>
        </Select>
        <p className="mt-1 text-[11px] text-[var(--ink-faint)]">{levelNote}</p>
      </Field>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 leading-loose text-[var(--ink)]">
        <p lang="km" className="font-khmer" dangerouslySetInnerHTML={{ __html: html || " " }} />
      </div>

      <Output label={t("HTML output", "លទ្ធផល HTML")} value={html} />

      <p className="text-[11px] leading-relaxed text-[var(--ink-faint)]">
        {t(`Khmer-tuned bionic reading: the leading graphemes of each Khmer word are bolded, keeping a whole stacked syllable (base + subscript + vowel) together. ${plain} Khmer grapheme clusters detected.`, `ការអានបែប bionic សម្រាប់ខ្មែរ៖ ដិតក្រុមអក្សរនាំមុខនៃពាក្យខ្មែរនីមួយៗ ដោយរក្សាព្យាង្គពីរតួគ្នា (ព្យញ្ជនៈ + ជើង + ស្រៈ) ជាមួយគ្នា។ បានរកឃើញ ${plain} ក្រុមអក្សរខ្មែរ។`)}
      </p>
    </ToolShell>
  );
}
