"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const ACTIVITY: { key: string; label: string; factor: number }[] = [
  { key: "1.2", label: "Sedentary (little exercise)", factor: 1.2 },
  { key: "1.375", label: "Light (1–3 days/week)", factor: 1.375 },
  { key: "1.55", label: "Moderate (3–5 days/week)", factor: 1.55 },
  { key: "1.725", label: "Active (6–7 days/week)", factor: 1.725 },
  { key: "1.9", label: "Very active (training)", factor: 1.9 },
];

export default function BmrCalculator() {
  const { text: t } = useLanguage();
  const [age, setAge] = useToolState("bmr:age", "25");
  const [gender, setGender] = useToolState("bmr:gender", "male");
  const [height, setHeight] = useToolState("bmr:height", "170");
  const [weight, setWeight] = useToolState("bmr:weight", "60");
  const [activity, setActivity] = useToolState("bmr:activity", "1.375");

  const calc = useMemo(() => {
    const a = Number(age);
    const h = Number(height);
    const w = Number(weight);
    const f = Number(activity);
    if ([a, h, w].some(Number.isNaN) || a < 5 || a > 110 || h < 50 || w < 20) return null;
    const bmr = gender === "male" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
    return {
      bmr,
      tdee: bmr * f,
      burnCut: bmr * f - 500,
      burnGain: bmr * f + 300,
      water: Math.round(w * 0.033 * 100) / 100,
    };
  }, [age, gender, height, weight, activity]);

  return (
    <ToolShell
      title="BMR / TDEE Calculator"
      khmerTitle="គណនា BMR / TDEE"
      description="Estimate your daily calorie needs using the Mifflin-St Jeor equation."
      descriptionKm="ប៉ាន់ស្មានតម្រូវការកាឡូរីប្រចាំថ្ងៃដោយរូបមន្ត Mifflin-St Jeor។"
    >
      <Row>
        <Field label={t("Age", "អាយុ")}>
          <TextInput inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
        </Field>
        <Field label={t("Gender", "ភេទ")}>
          <Select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="male">{t("Male", "ប្រុស")}</option>
            <option value="female">{t("Female", "ស្រី")}</option>
          </Select>
        </Field>
        <Field label={t("Height (cm)", "កម្ពស់ (ស.ម)")}>
          <TextInput inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} />
        </Field>
        <Field label={t("Weight (kg)", "ទម្ងន់ (គីឡូ)")}>
          <TextInput inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </Field>
      </Row>
      <Field label={t("Activity level", "កម្រិតសកម្មភាព")}>
        <Select value={activity} onChange={(e) => setActivity(e.target.value)}>
          {ACTIVITY.map((a) => (
            <option key={a.key} value={a.key}>
              {t(a.label, a.label)}
            </option>
          ))}
        </Select>
      </Field>

      {calc ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            [t("BMR (resting)", "BMR (ពេលសម្រាក)"), Math.round(calc.bmr) + " kcal"],
            [t("TDEE (maintenance)", "TDEE (រក្សាទម្ងន់)"), Math.round(calc.tdee) + " kcal"],
            [t("Lose weight (~500 cut)", "បញ្ចុះទម្ងន់ (~កាត់ ៥០០)"), Math.round(calc.burnCut) + " kcal"],
            [t("Gain weight (+300)", "ឡើងទម្ងន់ (+៣០០)"), Math.round(calc.burnGain) + " kcal"],
            [t("Suggested water (L/day)", "ទឹកគួរផឹក (លីត្រ/ថ្ងៃ)"), calc.water.toFixed(1) + " L"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{k}</div>
              <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{v}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter valid age, height, and weight.", "សូមបញ្ចូលអាយុ កម្ពស់ និងទម្ងន់ឱ្យបានត្រឹមត្រូវ។")}</p>
      )}
    </ToolShell>
  );
}