"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import {
  cleanSequence, transcribe, reverseComplement, gcContent, translate, proteinString,
} from "@/lib/calc/science";

export default function DnaTranslator() {
  const { text: t } = useLanguage();
  const [raw, setRaw] = useToolState("dna:seq", "ATGGCCTATGGTTAA");
  const [frame, setFrame] = useToolState("dna:frame", "0");

  const seq = useMemo(() => cleanSequence(raw), [raw]);
  const frameNum = Number(frame) as 0 | 1 | 2 | 3 | 4 | 5;

  const stats = useMemo(() => {
    if (!seq) return null;
    const isReverse = frameNum >= 3;
    const strand = isReverse ? reverseComplement(seq) : seq;
    const offset = (isReverse ? frameNum - 3 : frameNum) as 0 | 1 | 2;
    return {
      length: strand.length,
      gc: gcContent(seq),
      rna: transcribe(seq),
      rc: reverseComplement(seq),
      protein: translate(strand, offset),
      openReading: proteinString(strand, offset),
    };
  }, [seq, frameNum]);

  return (
    <ToolShell
      title="DNA Sequence Translator"
      khmerTitle="បកប្រែលំដាប់ DNA"
      description="Clean a DNA/RNA sequence, transcribe to mRNA, get the reverse complement, GC content, and translate all six reading frames with the standard genetic code."
      descriptionKm="សម្អាតលំដាប់ DNA/RNA បម្លែងទៅ mRNA គណនា reverse complement ខ្លឹមសារ GC និងបកប្រែស៊ុមអានទាំង ៦ តាមកូដពូជស្តង់ដារ។"
    >
      <Field label={t("Sequence (DNA or RNA; other letters ignored)", "លំដាប់ (DNA ឬ RNA; អក្សរផ្សេងមិនរាប់បញ្ចូល)")}>
        <TextArea rows={5} value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="ATGGCCTATGGTTAA" />
      </Field>
      <Field label={t("Reading frame", "ស៊ុមអាន")}>
        <Select value={frame} onChange={(e) => setFrame(e.target.value)} className="w-64">
          <option value="0">{t("Frame 1 (forward)", "ស៊ុម ១ (ទៅមុខ)")}</option>
          <option value="1">{t("Frame 2 (forward)", "ស៊ុម ២ (ទៅមុខ)")}</option>
          <option value="2">{t("Frame 3 (forward)", "ស៊ុម ៣ (ទៅមុខ)")}</option>
          <option value="3">{t("Frame 4 (reverse complement)", "ស៊ុម ៤ (បញ្ច្រាសបំពេញ)")}</option>
          <option value="4">{t("Frame 5 (reverse complement)", "ស៊ុម ៥ (បញ្ច្រាសបំពេញ)")}</option>
          <option value="5">{t("Frame 6 (reverse complement)", "ស៊ុម ៦ (បញ្ច្រាសបំពេញ)")}</option>
        </Select>
      </Field>

      {!stats ? (
        <Output label={t("Status", "ស្ថានភាព")} value={t("Paste a sequence containing A, C, G, T (or U).", "សូមបិទភ្ជាប់លំដាប់ដែលមាន A, C, G, T (ឬ U)។")} error />
      ) : (
        <div className="space-y-2">
          <Output label={t("Length (bases)", "ប្រវែង (បៃ)")} value={String(stats.length)} />
          <Output label={t("GC content", "ខ្លឹមសារ GC")} value={`${(stats.gc * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`} />
          <Output label={t("mRNA transcript (5'→3')", "ការបកប្រែ mRNA (៥'→៣')")} value={stats.rna} />
          <Output label={t("Reverse complement", "បញ្ច្រាសបំពេញ")} value={stats.rc} />
          <Output label={t("Protein (frame selected; * = stop, X = unknown)", "ប្រូតេអ៊ីន (ស៊ុមដែលបានជ្រើស; * = ឈប់, X = មិនស្គាល់)")} value={stats.protein || t("Sequence shorter than one codon", "លំដាប់ខ្លីជាងមួយ codon")} />
          <Output label={t("Protein without stop", "ប្រូតេអ៊ីនដោយគ្មានសញ្ញាឈប់")} value={stats.openReading || "—"} />
        </div>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t("Standard genetic code (NCBI translation table 1): 64 codons, ATG = start/Methionine, TAA/TAG/TGA = stop. U in the input is treated as T. For the reverse-complement frames the engine first builds the reverse complement, then reads it in the chosen forward offset. Educational tool — not for clinical or diagnostic use.", "កូដពូជស្តង់ដារ (NCBI តារាងបកប្រែ ១)៖ ៦៤ codon, ATG = ចាប់ផ្តើម/Methionine, TAA/TAG/TGA = ឈប់។ U ក្នុងទិន្នន័យត្រូវចាត់ទុកជា T។ ស៊ុមបញ្ច្រាសបំពេញត្រូវបង្កើតបញ្ច្រាសបំពេញជាមុន រួចអានតាមស៊ុមទៅមុខ។ ឧបករណ៍សម្រាប់សិក្សា — មិនសម្រាប់ប្រើក្នុងវេជ្ជសាស្ត្រទេ។")}
      </p>
    </ToolShell>
  );
}
