"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function range(gender: string, heightCm: number) {
  // Devine formula: ideal weight
  const inches = heightCm / 2.54;
  const devine = gender === "male" ? 50 + 2.3 * (inches - 60) : 45.5 + 2.3 * (inches - 60);
  const min = devine * 0.9;
  const max = devine * 1.1;
  return { min, max, mid: devine };
}

export default function IdealWeight() {
  const { text: t } = useLanguage();
  const [gender, setGender] = useToolState("ideal-weight:gender", "male");
  const [height, setHeight] = useToolState("ideal-weight:height", "170");

  const calc = useMemo(() => {
    const h = Number(height);
    if (Number.isNaN(h) || h < 50 || h > 250) return null;
    return range(gender, h);
  }, [gender, height]);

  return (
    <ToolShell
      title="Ideal Weight Calculator"
      khmerTitle="គណនាទម្ងន់សមស្រប"
      description="Estimate a healthy weight range for your height using the Devine formula."
      descriptionKm="ប៉ាន់ស្មានរង្វង់ទម្ងន់ល្អសម្រាប់កម្ពស់របស់អ្នក ដោយរូបមន្ត Devine។"
    >
      <Row>
        <Field label={t("Gender", "ភេទ")}>
          <Select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="male">{t("Male", "ប្រុស")}</option>
            <option value="female">{t("Female", "ស្រី")}</option>
          </Select>
        </Field>
        <Field label={t("Height (cm)", "កម្ពស់ (ស.ម)")}>
          <TextInput inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} />
        </Field>
      </Row>

      {calc ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Healthy range", "រង្វង់ល្អ")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--ink)]">
              {calc.min.toFixed(1)} – {calc.max.toFixed(1)} kg
            </div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Ideal (Devine)", "ល្អបំផុត (Devine)")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{calc.mid.toFixed(1)} kg</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("In pounds", "ជាផោន")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{(calc.mid * 2.20462).toFixed(0)} lb</div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter a valid height.", "សូមបញ្ចូលកម្ពស់ឱ្យបានត្រឹមត្រូវ។")}</p>
      )}
    </ToolShell>
  );
}