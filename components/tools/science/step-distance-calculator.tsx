"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// Approximate walking speed / MET pairs (rounded, based on common references
// such as the Compendium of Physical Activities). Actual values depend on the
// walker and terrain — treat the calorie figure as a rough estimate.
const PACES = [
  { id: "slow", label: ["Slow walk", "ដើរយឺត"], speedKmh: 3.2, met: 2.8 },
  { id: "medium", label: ["Normal walk", "ដើរធម្មតា"], speedKmh: 4.8, met: 3.5 },
  { id: "brisk", label: ["Brisk walk", "ដើរលឿន"], speedKmh: 6.4, met: 4.3 },
];

export default function StepDistanceCalculator() {
  const { text: t } = useLanguage();
  const [steps, setSteps] = useToolState("step-distance:steps", "8000");
  const [method, setMethod] = useToolState("step-distance:method", "height");
  const [height, setHeight] = useToolState("step-distance:height", "165");
  const [stride, setStride] = useToolState("step-distance:stride", "68");
  const [weight, setWeight] = useToolState("step-distance:weight", "60");
  const [paceId, setPaceId] = useToolState("step-distance:pace", "medium");

  const calc = useMemo(() => {
    const s = Number(steps);
    const w = Number(weight);
    if (Number.isNaN(s) || s < 0 || Number.isNaN(w) || w <= 0) return null;
    let strideCm: number;
    if (method === "height") {
      const h = Number(height);
      if (Number.isNaN(h) || h <= 0) return null;
      // Common rule of thumb: stride ≈ 0.415 × height.
      strideCm = h * 0.415;
    } else {
      const st = Number(stride);
      if (Number.isNaN(st) || st <= 0) return null;
      strideCm = st;
    }
    const km = (s * strideCm) / 100000;
    const pace = PACES.find((p) => p.id === paceId) ?? PACES[1];
    const hours = km / pace.speedKmh;
    // kcal = MET × weight (kg) × hours
    const kcal = pace.met * w * hours;
    return { km, strideCm, kcal, pace };
  }, [steps, method, height, stride, weight, paceId]);

  return (
    <ToolShell
      title="Step Distance Calculator"
      khmerTitle="គណនាចម្ងាយតាមជំហាន"
      description="Estimate the distance covered by a number of steps — from your height or a direct stride length — plus a rough calorie estimate based on a walking MET assumption."
      descriptionKm="ប៉ាន់ស្មានចម្ងាយដែលដើរបានពីចំនួនជំហាន — ពីកម្ពស់ ឬប្រវែងជំហានផ្ទាល់ — ព្រមទាំងការប៉ាន់ស្មានកាឡូរីដោយផ្អែកលើការសន្មត MET នៃការដើរ។"
    >
      <Row>
        <Field label={t("Steps", "ចំនួនជំហាន")}>
          <TextInput inputMode="numeric" value={steps} onChange={(e) => setSteps(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Stride from", "គណនាជំហានពី")}>
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="height">{t("Height", "កម្ពស់")}</option>
            <option value="stride">{t("Direct stride length", "ប្រវែងជំហានផ្ទាល់")}</option>
          </Select>
        </Field>
        {method === "height" ? (
          <Field label={t("Height", "កម្ពស់")} hint={t("cm", "ស.ម")}>
            <TextInput inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} className="font-mono-ui" />
          </Field>
        ) : (
          <Field label={t("Stride length", "ប្រវែងជំហាន")} hint={t("cm", "ស.ម")}>
            <TextInput inputMode="decimal" value={stride} onChange={(e) => setStride(e.target.value)} className="font-mono-ui" />
          </Field>
        )}
        <Field label={t("Weight", "ទម្ងន់")} hint={t("kg", "គីឡូក្រាម")}>
          <TextInput inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Walking pace", "ល្បឿនដើរ")}>
          <Select value={paceId} onChange={(e) => setPaceId(e.target.value)}>
            {PACES.map((p) => (
              <option key={p.id} value={p.id}>
                {t(p.label[0], p.label[1])} — {p.speedKmh} km/h
              </option>
            ))}
          </Select>
        </Field>
      </Row>

      {calc ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                {t("Distance", "ចម្ងាយ")}
              </div>
              <div className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                {calc.km < 1 ? `${(calc.km * 1000).toFixed(0)} m` : `${calc.km.toFixed(2)} km`}
              </div>
              <div className="mt-0.5 text-[10px] text-[var(--ink-dim)]">
                {calc.km >= 1 ? `${(calc.km * 1000).toFixed(0)} m` : `${calc.km.toFixed(3)} km`}
              </div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                {t("Stride used", "ជំហានប្រើ")}
              </div>
              <div className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                {calc.strideCm.toFixed(1)} <span className="text-xs font-normal text-[var(--ink-dim)]">cm</span>
              </div>
              <div className="mt-0.5 text-[10px] text-[var(--ink-dim)]">
                {method === "height"
                  ? t("height × 0.415 (approx.)", "កម្ពស់ × 0.415 (ប្រហាក់ប្រហែល)")
                  : t("entered directly", "បញ្ចូលផ្ទាល់")}
              </div>
            </div>
            <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                {t("Est. calories", "កាឡូរីប្រហាក់ប្រហែល")}
              </div>
              <div className="mt-1 text-2xl font-semibold text-[var(--gold)]">
                ~{Math.round(calc.kcal)} <span className="text-xs font-normal text-[var(--ink-dim)]">kcal</span>
              </div>
              <div className="mt-0.5 text-[10px] text-[var(--ink-dim)]">
                {t("MET", "MET")} {calc.pace.met} × {t("kg × hours", "គីឡូក្រាម × ម៉ោង")}
              </div>
            </div>
          </div>

          <p className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
            {t(
              "Stride = height × 0.415 is a common rule of thumb, and the calorie figure uses an assumed walking MET (3.2–4.3 by pace) with time derived from the pace speed. Real stride, pace and burn vary with the person and terrain — treat both figures as rough estimates.",
              "ជំហាន = កម្ពស់ × 0.415 ជាច្បាប់ងាយទូទៅ ហើយកាឡូរីប្រើការសន្មត MET នៃការដើរ (៣.២–៤.៣ តាមល្បឿន) ជាមួយពេលវេលាគណនាពីល្បឿន។ ជំហាន ល្បឿន និងការដុតកាឡូរីពិតប្រាកដប្រែប្រួលតាមបុគ្គល និងផ្លូវដី — សូមចាត់ទុកលេខទាំងពីរជាការប៉ាន់ស្មានប្រហាក់ប្រហែលប៉ុណ្ណោះ។"
            )}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">
          {t(
            "Enter valid numbers (steps and weight required).",
            "សូមបញ្ចូលលេខឱ្យបានត្រឹមត្រូវ (ត្រូវការជំហាន និងទម្ងន់)។"
          )}
        </p>
      )}
    </ToolShell>
  );
}
