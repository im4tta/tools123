"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function BodyFatCalculator() {
  const { text: t } = useLanguage();
  const [sex, setSex] = useToolState("bf:sex", "male");
  const [height, setHeight] = useToolState("bf:height", "170");
  const [neck, setNeck] = useToolState("bf:neck", "38");
  const [waist, setWaist] = useToolState("bf:waist", "85");
  const [hip, setHip] = useToolState("bf:hip", "95");
  const [weight, setWeight] = useToolState("bf:weight", "70");

  const calc = useMemo(() => {
    const H = Number(height);
    const N = Number(neck);
    const W = Number(waist);
    const P = Number(hip);
    const w = Number(weight);
    if ([H, N, W, w].some(Number.isNaN) || H <= 0 || N <= 0 || W <= 0 || w <= 0) return null;
    let bf: number;
    if (sex === "male") {
      bf = 86.01 * Math.log10(W - N) - 70.041 * Math.log10(H) + 36.76;
    } else {
      if (P <= 0) return null;
      bf = 163.205 * Math.log10(W + P - N) - 97.684 * Math.log10(H) - 78.387;
    }
    const fatKg = (bf / 100) * w;
    const leanKg = w - fatKg;
    let category = "";
    if (sex === "male") {
      category = bf < 6 ? t("Essential fat", "ខ្លាញ់សំខាន់") : bf <= 13 ? t("Athlete", "កីឡាករ") : bf <= 17 ? t("Fit", "រាងស្អាត") : bf <= 24 ? t("Average", "មធ្យម") : bf <= 31 ? t("Overweight", "ធាត់លើស") : t("Obese", "ធាត់ខ្លាំង");
    } else {
      category = bf < 14 ? t("Essential fat", "ខ្លាញ់សំខាន់") : bf <= 20 ? t("Athlete", "កីឡាករ") : bf <= 24 ? t("Fit", "រាងស្អាត") : bf <= 31 ? t("Average", "មធ្យម") : bf <= 36 ? t("Overweight", "ធាត់លើស") : t("Obese", "ធាត់ខ្លាំង");
    }
    return { bf, fatKg, leanKg, category };
  }, [sex, height, neck, waist, hip, weight, t]);

  return (
    <ToolShell
      title="Body Fat Calculator (US Navy)"
      khmerTitle="គណនាភាគរយខ្លាញ់ក្នុងខ្លួន"
      description="Estimate body fat percentage with the US Navy tape-measure method."
      descriptionKm="ប៉ាន់ស្មានភាគរយខ្លាញ់ក្នុងខ្លួនដោយវិធីវាស់វែងរបស់កងទ័ពអាមេរិក។"
    >
      <Row>
        <Field label={t("Sex", "ភេទ")}>
          <Select value={sex} onChange={(e) => setSex(e.target.value)}>
            <option value="male">{t("Male", "ប្រុស")}</option>
            <option value="female">{t("Female", "ស្រី")}</option>
          </Select>
        </Field>
        <Field label={t("Height (cm)", "កម្ពស់ (ស.ម)")}>
          <TextInput inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} />
        </Field>
        <Field label={t("Neck (cm)", "ក (ស.ម)")}>
          <TextInput inputMode="decimal" value={neck} onChange={(e) => setNeck(e.target.value)} />
        </Field>
        <Field label={t("Waist (cm)", "ចង្កេះ (ស.ម)")}>
          <TextInput inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} />
        </Field>
        {sex === "female" && (
          <Field label={t("Hip (cm)", "ត្រគាក (ស.ម)")}>
            <TextInput inputMode="decimal" value={hip} onChange={(e) => setHip(e.target.value)} />
          </Field>
        )}
        <Field label={t("Weight (kg)", "ទម្ងន់ (គីឡូ)")}>
          <TextInput inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </Field>
      </Row>

      {calc ? (
        <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-5 text-center">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Body fat percentage", "ភាគរយខ្លាញ់ក្នុងខ្លួន")}</div>
          <div className="font-display text-4xl font-semibold text-[var(--ink)]">{calc.bf.toFixed(1)}%</div>
          <div className="mt-2 inline-block rounded-full bg-[var(--gold)] px-3 py-1 text-sm font-medium text-[var(--ground-base)]">{calc.category}</div>
          <div className="mt-3 flex justify-center gap-6 text-sm text-[var(--ink-dim)]">
            <div>{t("Fat mass", "បរិមាណខ្លាញ់")}: <b className="text-[var(--ink)]">{calc.fatKg.toFixed(1)} kg</b></div>
            <div>{t("Lean mass", "បរិមាណសាច់")}: <b className="text-[var(--ink)]">{calc.leanKg.toFixed(1)} kg</b></div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter valid measurements.", "សូមបញ្ចូលការវាស់វែងឱ្យបានត្រឹមត្រូវ។")}</p>
      )}
    </ToolShell>
  );
}