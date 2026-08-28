"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { sampleSize, marginOfError, Z_SCORES } from "@/lib/calc/stats";

export default function SampleSizeCalculator() {
  const { text: t } = useLanguage();
  const [confidence, setConfidence] = useToolState("sample-size:conf", "95");
  const [margin, setMargin] = useToolState("sample-size:margin", "5");
  const [proportion, setProportion] = useToolState("sample-size:p", "50");
  const [population, setPopulation] = useToolState("sample-size:pop", "");

  const z = Z_SCORES[Number(confidence)];
  const result = useMemo(() => {
    if (!z) return null;
    const pop = population.trim() === "" ? undefined : Number(population.replace(/,/g, ""));
    return sampleSize(z, Number(margin), (Number(proportion) || 0) / 100, Number.isFinite(pop as number) ? (pop as number) : undefined);
  }, [z, margin, proportion, population]);

  const achievedMoE = useMemo(() => {
    if (!z || !result) return null;
    const pop = population.trim() === "" ? undefined : Number(population.replace(/,/g, ""));
    return marginOfError(z, result.sampleSize, (Number(proportion) || 0) / 100, Number.isFinite(pop as number) ? (pop as number) : undefined);
  }, [z, result, proportion, population]);

  return (
    <ToolShell
      title="Sample Size Calculator"
      khmerTitle="គណនាទំហំគំរូ"
      description="How many people to survey: Cochran's sample-size formula with optional finite-population correction, plus the achieved margin of error."
      descriptionKm="ត្រូវស្ទង់មតិមនុស្សប៉ុន្មាននាក់៖ រូបមន្ត Cochran ជាមួយដែនកំណត់ចំនួនប្រជាជន (ជម្រើស) និងគម្លាតកំហុសដែលទទួលបាន។"
    >
      <Row>
        <Field label={t("Confidence level", "កម្រិតទំនុកចិត្ត")}>
          <Select value={confidence} onChange={(e) => setConfidence(e.target.value)} className="w-48">
            <option value="90">90%</option>
            <option value="95">95%</option>
            <option value="99">99%</option>
          </Select>
        </Field>
        <Field label={t("Margin of error (± percentage points)", "គម្លាតកំហុស (± ភាគរយ)")}>
          <TextInput type="number" step="any" min="0.1" max="99" value={margin} onChange={(e) => setMargin(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label={t("Expected proportion (%)", "សមាមាត្រដែលរំពឹងទុក (%)")} hintKm={t("50 = most conservative", "៥០ = អនុរក្សបំផុត")}>
          <TextInput type="number" step="any" min="0" max="100" value={proportion} onChange={(e) => setProportion(e.target.value)} />
        </Field>
        <Field label={t("Population size (optional)", "ចំនួនប្រជាជន (ជម្រើស)")}>
          <TextInput type="number" step="any" min="1" value={population} onChange={(e) => setPopulation(e.target.value)} placeholder="10000" />
        </Field>
      </Row>

      {result ? (
        <div className="space-y-2">
          <Output label={t("Required sample size", "ទំហំគំរូដែលត្រូវការ")} value={result.sampleSize.toLocaleString()} />
          {achievedMoE !== null && (
            <Output label={t("Margin of error you will achieve", "គម្លាតកំហុសដែលនឹងទទួលបាន")} value={`± ${achievedMoE.toLocaleString(undefined, { maximumFractionDigits: 3 })}%`} />
          )}
          <Output label={t("Calculation detail", "ព័ត៌មានលម្អិត")} value={result.finiteCorrected ? t("Cochran n₀ with finite-population correction", "Cochran n₀ ជាមួយការកែតម្រូវចំនួនប្រជាជន") : t("Cochran n₀ (infinite population assumed)", "Cochran n₀ (សន្មតចំនួនប្រជាជនគ្មានដែនកំណត់)")} mono={false} />
        </div>
      ) : (
        <Output label={t("Status", "ស្ថានភាព")} value={t("Enter a margin of error between 0.1 and 99, a proportion between 0 and 100, and a population of at least 1.", "សូមបញ្ចូលគម្លាតកំហុសពី ០.១ ដល់ ៩៩ សមាមាត្រពី ០ ដល់ ១០០ និងប្រជាជនយ៉ាងតិច ១។")} error />
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t("Formula: n₀ = z²·p(1−p)/e² with z = 1.6449 (90%), 1.96 (95%), 2.576 (99%); finite population n = n₀/(1+(n₀−1)/N); sample size rounded up. Assumes simple random sampling of yes/no questions.", "រូបមន្ត៖ n₀ = z²·p(1−p)/e² ដោយ z = ១.៦៤៤៩ (៩០%), ១.៩៦ (៩៥%), ២.៥៧៦ (៩៩%); ចំនួនប្រជាជនកំណត់ n = n₀/(១+(n₀−១)/N); តម្លៃបង្គ្រប់ឡើង។ សន្មតការស្ទង់ចៃដន្យសាមញ្ញលើសំណួរបាទ/ចំលើយ។")}
      </p>
    </ToolShell>
  );
}
