"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { dilutionSolve, molarityFromMass, type DilutionVariable } from "@/lib/calc/science";

export default function DilutionCalculator() {
  const { text: t } = useLanguage();
  const [target, setTarget] = useToolState<DilutionVariable>("dilution:target", "V1");
  const [c1, setC1] = useToolState("dilution:c1", "5");
  const [v1, setV1] = useToolState("dilution:v1", "20");
  const [c2, setC2] = useToolState("dilution:c2", "1");
  const [v2, setV2] = useToolState("dilution:v2", "100");
  const [mass, setMass] = useToolState("dilution:mass", "5.844");
  const [molarMass, setMolarMass] = useToolState("dilution:mm", "58.44");
  const [volumeMl, setVolumeMl] = useToolState("dilution:vol", "100");

  const labels: Record<DilutionVariable, { en: string; km: string }> = {
    C1: { en: "C₁ stock concentration", km: "C₁ កំរិតរ៉ស" },
    V1: { en: "V₁ stock volume", km: "V₁ កម្រិតទឹករ៉ស" },
    C2: { en: "C₂ target concentration", km: "C₂ កំរិតគោលដៅ" },
    V2: { en: "V₂ target volume", km: "V₂ កម្រិតទឹកគោលដៅ" },
  };

  const solved = useMemo(() => dilutionSolve(target, Number(c1), Number(v1), Number(c2), Number(v2)), [target, c1, v1, c2, v2]);
  const molarity = useMemo(() => molarityFromMass(Number(mass), Number(molarMass), Number(volumeMl)), [mass, molarMass, volumeMl]);

  const fmt = (v: number | null) => (v === null ? "—" : v.toLocaleString(undefined, { maximumFractionDigits: 6 }));
  const inputFor = (key: DilutionVariable) => (key === "C1" ? c1 : key === "V1" ? v1 : key === "C2" ? c2 : v2);
  const setInputFor = (key: DilutionVariable, value: string) =>
    key === "C1" ? setC1(value) : key === "V1" ? setV1(value) : key === "C2" ? setC2(value) : setV2(value);

  return (
    <ToolShell
      title="Dilution & Molarity Calculator"
      khmerTitle="គណនាការចម្រាញ់ និងកំរិត Molarity"
      description="Solve C₁V₁ = C₂V₂ for any missing term, and compute molarity from mass, molar mass, and volume."
      descriptionKm="ដោះស្រាយ C₁V₁ = C₂V₂ សម្រាប់តួដែលបាត់បង់ និងគណនា molarity ពីម៉ាស ម៉ាសម៉ូលារ និងកម្រិតទឹក។"
    >
      <Field label={t("Solve for", "រកតួ")}>
        <Select value={target} onChange={(e) => setTarget(e.target.value as DilutionVariable)} className="w-56">
          {(["C1", "V1", "C2", "V2"] as DilutionVariable[]).map((key) => (
            <option key={key} value={key}>{key}</option>
          ))}
        </Select>
      </Field>
      <Row>
        {(["C1", "V1", "C2", "V2"] as DilutionVariable[]).filter((key) => key !== target).map((key) => (
          <Field key={key} label={t(labels[key].en, labels[key].km)}>
            <TextInput type="number" step="any" min="0" value={inputFor(key)} onChange={(e) => setInputFor(key, e.target.value)} />
          </Field>
        ))}
      </Row>
      <Output
        label={t("Result", "លទ្ធផល")}
        value={solved === null ? t("Enter three positive values (concentrations and volumes above zero).", "សូមបញ្ចូលតម្លៃវិជ្ជមាន ៣ (កំរិត និងកម្រិតទឹកលើសូន្យ)។") : `${target} = ${fmt(solved)}`}
        error={solved === null}
      />

      <hr className="border-[var(--ground-line)]" />

      <Field label={t("Molarity from mass: solute mass (g)", "Molarity ពីម៉ាស៖ ម៉ាសរលាយ (ក្រាម)")}>
        <TextInput type="number" step="any" min="0" value={mass} onChange={(e) => setMass(e.target.value)} />
      </Field>
      <Row>
        <Field label={t("Molar mass (g/mol)", "ម៉ាសម៉ូលារ (g/mol)")}>
          <TextInput type="number" step="any" min="0" value={molarMass} onChange={(e) => setMolarMass(e.target.value)} />
        </Field>
        <Field label={t("Solution volume (mL)", "កម្រិតទឹកដំណោះស្រាយ (ម.ល)")}>
          <TextInput type="number" step="any" min="0" value={volumeMl} onChange={(e) => setVolumeMl(e.target.value)} />
        </Field>
      </Row>
      <Output
        label={t("Molarity (mol/L)", "កំរិត Molarity (mol/L)")}
        value={molarity === null ? t("Molar mass and volume must be above zero.", "ម៉ាសម៉ូលារ និងកម្រិតទឹកត្រូវលើសសូន្យ។") : `${fmt(molarity)} mol/L`}
        error={molarity === null}
      />

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t("Formulas: dilution C₁V₁ = C₂V₂ (moles conserved); molarity M = mass ÷ (molar mass × litres). Concentration and volume units cancel, so any consistent pair works (e.g. mg/mL with mL).", "រូបមន្ត៖ ចម្រាញ់ C₁V₁ = C₂V₂ (ម៉ូលរក្សាទុក); molarity M = ម៉ាស ÷ (ម៉ាសម៉ូលារ × លីត្រ)។ ឯកតាកំរិត និងកម្រិតទឹកលុបចោលគ្នា ដូច្នេះអាចប្រើគូឯកតាណាមួយដែលផ្គុំគ្នា (ឧ. mg/mL ជាមួយ mL)។")}
      </p>
    </ToolShell>
  );
}
