"use client";
import { useMemo } from "react";
import { Info } from "lucide-react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// Micro / health insurance premium estimator — reference monthly base rates
// per person per coverage tier (USD), editable. Real premiums vary by insurer,
// age band and health assessment — verify before purchase.
// Insurance premium estimator — the DEFAULT per-person base rates are SAMPLE
// placeholders only, NOT real insurer rates. Edit the base rate (or use "base
// rate" field) with your actual quote. Always verify — READFIRST.
type Tier = { id: string; label: string; labelKm: string; base: number; desc: string; descKm: string };
const TIERS: Tier[] = [
  { id: "basic", label: "Basic (sample)", labelKm: "មូលដ្ឋាន (គំរូ)", base: 12, desc: "Outpatient + basic inpatient", descKm: "ពិនិត្យអ្នកជំងឺក្រៅ + អ្នកជំងឺក្នុងមូលដ្ឋាន" },
  { id: "standard", label: "Standard (sample)", labelKm: "ស្តង់ដារ (គំរូ)", base: 25, desc: "Broader inpatient + some surgery", descKm: "អ្នកជំងឺក្នុងទូលំទូលាយ + ការវះកាត់មួយចំនួន" },
  { id: "premium", label: "Premium (sample)", labelKm: "ពិសេស (គំរូ)", base: 45, desc: "Comprehensive, private hospitals", descKm: "ទូលំទូលាយ មន្ទីរពេទ្យឯកជន" },
];
const AGE_FACTORS = [
  { label: "18 – 30", labelKm: "១៨ – ៣០", factor: 1 },
  { label: "31 – 45", labelKm: "៣១ – ៤៥", factor: 1.3 },
  { label: "46 – 60", labelKm: "៤៦ – ៦០", factor: 1.8 },
  { label: "Over 60", labelKm: "លើស ៦០", factor: 2.6 },
];

function toNum(v: string) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

export default function InsurancePremiumEstimator() {
  const { text: t } = useLanguage();
  const [tierId, setTierId] = useToolState("insure:tier", "basic");
  const [ageId, setAgeId] = useToolState("insure:age", "2");
  const [members, setMembers] = useToolState("insure:members", "1");
  const [baseAdjust, setBaseAdjust] = useToolState("insure:adjust", ""); // optional custom base

  const tier = TIERS.find((x) => x.id === tierId) ?? TIERS.find((x) => x.id === "standard")!;
  const age = AGE_FACTORS[toNum(ageId)];
  const n = Math.max(1, Math.round(toNum(members)) || 1);

  const result = useMemo(() => {
    const effBase = toNum(baseAdjust) || tier.base;
    const monthlyPer = effBase * age.factor;
    const monthly = monthlyPer * n;
    return { effBase, monthlyPer, monthly, yearly: monthly * 12 };
  }, [tier, age, baseAdjust, n]);

  return (
    <ToolShell
      title="Health Insurance Premium Estimator"
      khmerTitle="ប៉ាន់ស្មានបុព្វលាភធានារ៉ាប់រងសុខភាព"
      description="Estimate a monthly insurance premium from coverage tier, age band and members — the default base rates are sample placeholders, so enter your actual quote before relying on it."
      descriptionKm="ប៉ាន់ស្មានបុព្វលាភប្រចាំខែពីកម្រិតការធានា ក្រុមអាយុ និងចំនួនអ្នកធានា — អត្រាមូលដ្ឋានលំនាំដើមគឺជាគំរូ សូមបញ្ចូលតម្លៃពិតរបស់អ្នកមុនពេលពឹងផ្អែក។"
    >
      <Row>
        <Field label={t("Coverage tier", "កម្រិតការធានា")}>
          <Select value={tierId} onChange={(e) => setTierId(e.target.value)}>
            {TIERS.map((x) => (
              <option key={x.id} value={x.id}>{x.label} — {x.desc}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("Age band", "ក្រុមអាយុ")}>
          <Select value={String(ageId)} onChange={(e) => setAgeId(String(e.target.value))}>
            {AGE_FACTORS.map((a, i) => (
              <option key={i} value={String(i)}>{a.label}</option>
            ))}
          </Select>
        </Field>
      </Row>
      <Row>
        <Field label={t("Members covered", "ចំនួនអ្នកធានា")}>
          <TextInput type="number" min="1" step="1" value={members} onChange={(e) => setMembers(e.target.value)} />
        </Field>
        <Field label={t("Base rate (USD/person, optional)", "អត្រាមូលដ្ឋាន (ដុល្លារ/នាក់, ជាជម្រើស)")}>
          <TextInput type="number" min="0" step="1" value={baseAdjust} onChange={(e) => setBaseAdjust(e.target.value)} placeholder={String(tier.base)} />
        </Field>
      </Row>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{t("Per person", "ក្នុងនាក់")}</div>
          <div className="mt-1 text-xl font-bold text-[var(--ink)]">${result.monthlyPer.toFixed(2)}</div>
          <div className="text-[11px] text-[var(--ink-faint)]">{t("per month", "ប្រចាំខែ")}</div>
        </div>
        <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--gold)]">{t("Monthly premium", "បុព្វលាភប្រចាំខែ")}</div>
          <div className="mt-1 text-xl font-bold text-[var(--gold)]">${result.monthly.toFixed(2)}</div>
          <div className="text-[11px] font-semibold text-[var(--gold)]">{t("for", "សម្រាប់")} {n} {t("member(s)", "នាក់")}</div>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{t("Yearly", "ប្រចាំឆ្នាំ")}</div>
          <div className="mt-1 text-xl font-bold text-[var(--ink)]">${result.yearly.toFixed(2)}</div>
          <div className="text-[11px] text-[var(--ink-faint)]">{t("if paid monthly", "បើបង់ប្រចាំខែ")}</div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <Info size={14} className="mt-0.5 shrink-0 text-[var(--gold)]" />
        <span>
          {t("The default base rates are sample placeholders only — they are not real insurer quotes. Actual premiums depend on the insurer, exact age, health history, coverage limits and deductibles. Enter your real base rate and always request a proper quote before purchase.", "អត្រាមូលដ្ឋានលំនាំដើមគឺជាគំរូតែប៉ុណ្ណោះ — មិនមែនជាតម្លៃពិតពីក្រុមហ៊ុនធានាទេ។ បុព្វលាភពិតអាស្រ័យលើក្រុមហ៊ុន អាយុពិត ប្រវត្តិសុខភាព ដែនកំណត់ និងការកាត់។ បញ្ចូលអត្រាមូលដ្ឋានពិត ហើយស្នើសុំតម្លៃឱ្យបានត្រឹមត្រូវមុនពេលទិញ។")}
        </span>
      </div>
    </ToolShell>
  );
}
