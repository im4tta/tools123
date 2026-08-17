"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function BmiCalculator() {
  const { text: t } = useLanguage();
  const [heightCm, setHeightCm] = useToolState("bmi-calculator:height", "170");
  const [weightKg, setWeightKg] = useToolState("bmi-calculator:weight", "65");

  const result = useMemo(() => {
    const h = Number(heightCm) / 100;
    const w = Number(weightKg);
    if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) return null;
    const bmi = w / (h * h);
    let category: string;
    if (bmi < 18.5) category = t("Underweight", "ធាត់មិនគ្រប់");
    else if (bmi < 25) category = t("Normal", "ធម្មតា");
    else if (bmi < 30) category = t("Overweight", "ធាត់លើស");
    else category = t("Obese", "ធាត់ខ្លាំង");
    return { bmi: bmi.toFixed(1), category };
  }, [heightCm, weightKg, t]);

  return (
    <ToolShell
      title="BMI Calculator"
      khmerTitle="គណនា BMI"
      description="Calculate your Body Mass Index (BMI) from height and weight, with a category label."
      descriptionKm="គណនាសន្ទស្សន៍ម៉ាសរាងកាយ (BMI) ពីកម្ពស់ និងទម្ងន់ ជាមួយស្លាកប្រភេទ។"
    >
      <Row>
        <Field label={t("Height (cm)", "កម្ពស់ (សង់ទីម៉ែត្រ)")}>
          <TextInput type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Weight (kg)", "ទម្ងន់ (គីឡូក្រាម)")}>
          <TextInput type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>
      {result && (
        <Output
          label={t("Your BMI", "BMI របស់អ្នក")}
          value={`${result.bmi} — ${result.category}`}
          mono={false}
        />
      )}
      <p className="text-xs text-[var(--ink-faint)]">
        {t("BMI is a general screening tool, not a medical diagnosis. Consult a health professional for advice.", "BMI ជាឧបករណ៍ពិនិត្យទូទៅ មិនមែនជាការធ្វើរោគវិនិច្ឆ័យផ្នែកវេជ្ជសាស្ត្រទេ។ សូមពិគ្រោះជាមួយអ្នកជំនាញសុខភាព។")}
      </p>
    </ToolShell>
  );
}
