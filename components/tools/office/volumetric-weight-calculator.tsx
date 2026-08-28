"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function VolumetricWeightCalculator() {
  const { text: t } = useLanguage();
  const [length, setLength] = useToolState("volumetric:l", "40");
  const [width, setWidth] = useToolState("volumetric:w", "30");
  const [height, setHeight] = useToolState("volumetric:h", "20");
  const [actual, setActual] = useToolState("volumetric:actual", "3");
  const [divisor, setDivisor] = useToolState("volumetric:divisor", "5000");
  const [custom, setCustom] = useToolState("volumetric:custom", "4500");

  const result = useMemo(() => {
    const l = Number(length);
    const w = Number(width);
    const h = Number(height);
    const a = Number(actual);
    const d = divisor === "custom" ? Number(custom) : Number(divisor);
    if (![l, w, h, a, d].every((v) => isFinite(v)) || l <= 0 || w <= 0 || h <= 0 || d <= 0 || a < 0) return null;
    const volumetric = (l * w * h) / d;
    return { volumetric, chargeable: Math.max(a, volumetric), actual: a };
  }, [length, width, height, actual, divisor, custom]);

  const fmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 3 });

  return (
    <ToolShell
      title="Volumetric Weight Calculator"
      khmerTitle="គណនាទម្ងន់តាមទំហំ"
      description="Chargeable weight for parcels: carriers bill the greater of actual weight and volumetric weight (L×W×H ÷ divisor)."
      descriptionKm="ទម្ងន់គិតថ្លៃសម្រាប់ដង្ហើយទេសចរ៖ ក្រុមហ៊ុនដឹកជញ្ជូនគិតតម្លៃលើទម្ងន់ធំជាងគេ រវាងទម្ងន់ពិត និងទម្ងន់តាមទំហំ (បណ្តោយ×ទទឹង×កម្ពស់ ÷ កត្តាបែងចែក)។"
    >
      <Row>
        <Field label={t("Length (cm)", "បណ្តោយ (ស.ម)")}>
          <TextInput type="number" min="0" step="any" value={length} onChange={(e) => setLength(e.target.value)} />
        </Field>
        <Field label={t("Width (cm)", "ទទឹង (ស.ម)")}>
          <TextInput type="number" min="0" step="any" value={width} onChange={(e) => setWidth(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label={t("Height (cm)", "កម្ពស់ (ស.ម)")}>
          <TextInput type="number" min="0" step="any" value={height} onChange={(e) => setHeight(e.target.value)} />
        </Field>
        <Field label={t("Actual weight (kg)", "ទម្ងន់ពិត (ក.ក)")}>
          <TextInput type="number" min="0" step="any" value={actual} onChange={(e) => setActual(e.target.value)} />
        </Field>
      </Row>
      <Field label={t("Divisor (cm³ per kg)", "កត្តាបែងចែក (ស.ម³ ក្នុងមួយ ក.ក)")}>
        <Select value={divisor} onChange={(e) => setDivisor(e.target.value)} className="w-64">
          <option value="5000">5000</option>
          <option value="6000">6000</option>
          <option value="custom">{t("Custom divisor…", "កត្តាផ្ទាល់ខ្លួន…")}</option>
        </Select>
      </Field>
      {divisor === "custom" && (
        <Field label={t("Custom divisor", "កត្តាបែងចែកផ្ទាល់ខ្លួន")} hintKm={t("From your carrier's price list", "ពីតារាងតម្លៃក្រុមហ៊ុនរបស់អ្នក")}>
          <TextInput type="number" min="1" step="any" value={custom} onChange={(e) => setCustom(e.target.value)} className="w-48" />
        </Field>
      )}

      {result ? (
        <div className="space-y-2">
          <Output label={t("Volumetric weight (kg)", "ទម្ងន់តាមទំហំ (ក.ក)")} value={fmt(result.volumetric)} />
          <Output label={t("Chargeable weight (kg)", "ទម្ងន់គិតថ្លៃ (ក.ក)")} value={fmt(result.chargeable)} />
          <Output label={t("Billed as", "គិតថ្លៃជា")} value={result.chargeable > result.actual ? t("Volumetric weight (size-driven)", "ទម្ងន់តាមទំហំ (ដោយទំហំ)") : t("Actual weight", "ទម្ងន់ពិត")} />
        </div>
      ) : (
        <Output label={t("Status", "ស្ថានភាព")} value={t("Enter positive dimensions and divisor; weight can be 0 or more.", "សូមបញ្ចូលទំហំ និងកត្តាបែងចែកជាលេខវិជ្ជមាន។")} error />
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t("Formula: volumetric weight = L × W × H ÷ divisor. Common divisors are 5000 and 6000 cm³/kg, but every carrier sets its own — this tool does not store carrier rates, so confirm the divisor with your courier before relying on the result.", "រូបមន្ត៖ ទម្ងន់តាមទំហំ = បណ្តោយ × ទទឹង × កម្ពស់ ÷ កត្តា។ កត្តាដែលគេប្រើច្រើនគឺ ៥០០០ និង ៦០០០ ស.ម³/ក.ក ប៉ុន្តែក្រុមហ៊ុននីមួយៗកំណត់ផ្ទាល់ខ្លួន — ឧបករណ៍នេះមិនរក្សាទុកអត្រាក្រុមហ៊ុនទេ សូមផ្ទៀងផ្ទាត់ជាមួយក្រុមហ៊ុនដឹកជញ្ជូនរបស់អ្នកមុនប្រើលទ្ធផល។")}
      </p>
    </ToolShell>
  );
}
