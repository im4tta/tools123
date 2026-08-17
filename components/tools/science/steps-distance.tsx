"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function StepsDistance() {
  const { text: t } = useLanguage();
  const [steps, setSteps] = useToolState("steps:count", "10000");
  const [height, setHeight] = useToolState("steps:height", "165");
  const [unit, setUnit] = useToolState("steps:unit", "km");

  const calc = useMemo(() => {
    const s = Number(steps);
    const h = Number(height);
    if (Number.isNaN(s) || Number.isNaN(h) || s < 0 || h <= 0) return null;
    const stride = h * 0.415;
    const distanceCm = s * stride;
    const km = distanceCm / 100000;
    const miles = km * 0.621371;
    const calories = s * 0.04;
    return { km, miles, calories };
  }, [steps, height]);

  return (
    <ToolShell
      title="Steps → Distance"
      khmerTitle="បម្លែងជំហានទៅចម្ងាយ"
      description="Convert step count into distance (km / miles) and calories based on your height."
      descriptionKm="បម្លែងចំនួនជំហានទៅជាចម្ងាយ (គ.ម / ម៉ាយ) និងកាឡូរីដោយផ្អែកលើកម្ពស់របស់អ្នក។"
    >
      <Row>
        <Field label={t("Steps", "ចំនួនជំហាន")}>
          <TextInput inputMode="numeric" value={steps} onChange={(e) => setSteps(e.target.value)} />
        </Field>
        <Field label={t("Height (cm)", "កម្ពស់ (ស.ម)")}>
          <TextInput inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} />
        </Field>
        <Field label={t("Show", "បង្ហាញ")}>
          <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="km">{t("Kilometres", "គីឡូម៉ែត្រ")}</option>
            <option value="mi">{t("Miles", "ម៉ាយ")}</option>
          </Select>
        </Field>
      </Row>

      {calc ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-center">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Distance", "ចម្ងាយ")}</div>
            <div className="mt-1 text-xl font-semibold text-[var(--ink)]">
              {unit === "km" ? `${calc.km.toFixed(2)} km` : `${calc.miles.toFixed(2)} mi`}
            </div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-center">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("In miles", "គិតជាម៉ាយ")}</div>
            <div className="mt-1 text-xl font-semibold text-[var(--ink)]">{calc.miles.toFixed(2)} mi</div>
          </div>
          <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4 text-center">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Est. calories", "កាឡូរីប្រហាក់ប្រហែល")}</div>
            <div className="mt-1 text-xl font-semibold text-[var(--gold)]">~{Math.round(calc.calories)} kcal</div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter valid numbers.", "សូមបញ្ចូលលេខឱ្យបានត្រឹមត្រូវ។")}</p>
      )}
    </ToolShell>
  );
}