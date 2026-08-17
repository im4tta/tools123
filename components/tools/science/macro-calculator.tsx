"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function MacroCalculator() {
  const { text: t } = useLanguage();
  const [weight, setWeight] = useToolState("macro:weight", "60");
  const [height, setHeight] = useToolState("macro:height", "165");
  const [age, setAge] = useToolState("macro:age", "28");
  const [sex, setSex] = useToolState("macro:sex", "male");
  const [activity, setActivity] = useToolState("macro:activity", "1.375");
  const [goal, setGoal] = useToolState("macro:goal", "maintain");

  const calc = useMemo(() => {
    const w = Number(weight);
    const h = Number(height);
    const a = Number(age);
    const act = Number(activity);
    if ([w, h, a, act].some(Number.isNaN) || w <= 0 || h <= 0) return null;

    const bmr = sex === "male" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
    const tdee = bmr * act;
    const target = goal === "lose" ? tdee - 500 : goal === "gain" ? tdee + 300 : tdee;

    // Balanced split: 30% protein / 40% carbs / 30% fat
    const protein = (target * 0.3) / 4;
    const carbs = (target * 0.4) / 4;
    const fat = (target * 0.3) / 9;
    return { bmr, tdee, target, protein, carbs, fat };
  }, [weight, height, age, sex, activity, goal]);

  const kcal = Math.round;

  return (
    <ToolShell
      title="Macro Calculator"
      khmerTitle="គណនា Macronutrient"
      description="Estimate BMR, TDEE, and a balanced protein / carbs / fat split (30/40/30)."
      descriptionKm="ប៉ាន់ស្មាន BMR, TDEE និងការបែងចែកប្រូតេអ៊ីន / កាបូ / ខ្លាញ់ (៣០/៤០/៣០)។"
    >
      <Row>
        <Field label={t("Weight (kg)", "ទម្ងន់ (គីឡូ)")}>
          <TextInput inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </Field>
        <Field label={t("Height (cm)", "កម្ពស់ (ស.ម)")}>
          <TextInput inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} />
        </Field>
        <Field label={t("Age", "អាយុ")}>
          <TextInput inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
        </Field>
        <Field label={t("Sex", "ភេទ")}>
          <Select value={sex} onChange={(e) => setSex(e.target.value)}>
            <option value="male">{t("Male", "ប្រុស")}</option>
            <option value="female">{t("Female", "ស្រី")}</option>
          </Select>
        </Field>
      </Row>
      <Row>
        <Field label={t("Activity level", "កម្រិតសកម្មភាព")}>
          <Select value={activity} onChange={(e) => setActivity(e.target.value)}>
            <option value="1.2">{t("Sedentary", "អង្គុយផ្អែក")}</option>
            <option value="1.375">{t("Light (1–3x/week)", "ស្រាល (១–៣ ដង/សប្ដាហ៍)")}</option>
            <option value="1.55">{t("Moderate (3–5x/week)", "មធ្យម (៣–៥ ដង/សប្ដាហ៍)")}</option>
            <option value="1.725">{t("Active (6–7x/week)", "សកម្ម (៦–៧ ដង/សប្ដាហ៍)")}</option>
            <option value="1.9">{t("Very active", "សកម្មខ្លាំង")}</option>
          </Select>
        </Field>
        <Field label={t("Goal", "គោលដៅ")}>
          <Select value={goal} onChange={(e) => setGoal(e.target.value)}>
            <option value="lose">{t("Lose weight (−500 kcal)", "បញ្ចុះទម្ងន់ (−៥០០ kcal)")}</option>
            <option value="maintain">{t("Maintain", "រក្សាទម្ងន់")}</option>
            <option value="gain">{t("Gain weight (+300 kcal)", "ឡើងទម្ងន់ (+៣០០ kcal)")}</option>
          </Select>
        </Field>
      </Row>

      {calc ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-center">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">BMR</div>
              <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{kcal(calc.bmr)} kcal</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-center">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">TDEE</div>
              <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{kcal(calc.tdee)} kcal</div>
            </div>
            <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4 text-center">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Target calories", "កាឡូរីគោលដៅ")}</div>
              <div className="mt-1 text-lg font-semibold text-[var(--gold)]">{kcal(calc.target)} kcal</div>
            </div>
          </div>
          <div className="overflow-hidden rounded-md border border-[var(--ground-line)]">
            {[
              { label: t("Protein (30%)", "ប្រូតេអ៊ីន (៣០%)"), g: calc.protein, color: "text-[var(--gold)]" },
              { label: t("Carbs (40%)", "កាបូ (៤០%)"), g: calc.carbs, color: "text-[var(--ink)]" },
              { label: t("Fat (30%)", "ខ្លាញ់ (៣០%)"), g: calc.fat, color: "text-[var(--ink)]" },
            ].map((m, i) => (
              <div key={m.label} className={`flex items-center justify-between px-4 py-2.5 ${i % 2 ? "bg-[var(--ground-raised)]" : ""}`}>
                <span className="text-sm text-[var(--ink-dim)]">{m.label}</span>
                <span className={`font-mono-ui text-base font-semibold ${m.color}`}>{Math.round(m.g)} g / {kcal(m.g * 4)} kcal</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter valid details.", "សូមបញ្ចូលព័ត៌មានឱ្យបានត្រឹមត្រូវ។")}</p>
      )}
    </ToolShell>
  );
}