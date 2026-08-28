"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { depreciationSchedule, type DepreciationMethod } from "@/lib/calc/finance";

const METHODS: { id: DepreciationMethod; en: string; km: string }[] = [
  { id: "straight-line", en: "Straight-line", km: "ត្រង់ៗ (Straight-line)" },
  { id: "declining", en: "Declining balance", km: "តុល្យភាពធ្លាក់ចុះ (Declining balance)" },
  { id: "double-declining", en: "Double declining balance", km: "តុល្យភាពធ្លាក់ចុះពីរដង (Double declining)" },
  { id: "sum-of-years", en: "Sum-of-years digits", km: "ផលបូកលេខឆ្នាំ (Sum-of-years digits)" },
];

export default function DepreciationCalculator() {
  const { text: t } = useLanguage();
  const [cost, setCost] = useToolState("depreciation:cost", "10000");
  const [salvage, setSalvage] = useToolState("depreciation:salvage", "1000");
  const [life, setLife] = useToolState("depreciation:life", "5");
  const [method, setMethod] = useToolState<DepreciationMethod>("depreciation:method", "straight-line");

  const rows = useMemo(
    () => depreciationSchedule(method, Number(cost), Number(salvage), Number(life)),
    [method, cost, salvage, life],
  );

  const fmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <ToolShell
      title="Depreciation Calculator"
      khmerTitle="គណនាការធ្លាក់តម្លៃសម្បត្តិ"
      description="Year-by-year depreciation schedule for an asset: straight-line, declining balance, double declining, or sum-of-years digits."
      descriptionKm="តារាងការធ្លាក់តម្លៃសម្បត្តិរយៈពេលឆ្នាំម្ដងៗ៖ ត្រង់ៗ តុល្យភាពធ្លាក់ចុះ ធ្លាក់ចុះពីរដង ឬផលបូកលេខឆ្នាំ។"
    >
      <Row>
        <Field label={t("Asset cost", "តម្លៃសម្បត្តិ")}>
          <TextInput type="number" step="any" min="0" value={cost} onChange={(e) => setCost(e.target.value)} />
        </Field>
        <Field label={t("Salvage value (end value)", "តម្លៃសល់នៅចុងបញ្ចប់")}>
          <TextInput type="number" step="any" min="0" value={salvage} onChange={(e) => setSalvage(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label={t("Useful life (years)", "អាយុកាលប្រើប្រាស់ (ឆ្នាំ)")}>
          <TextInput type="number" step="1" min="1" max="100" value={life} onChange={(e) => setLife(e.target.value)} />
        </Field>
        <Field label={t("Method", "វិធីសាស្ត្រ")}>
          <Select value={method} onChange={(e) => setMethod(e.target.value as DepreciationMethod)}>
            {METHODS.map((m) => <option key={m.id} value={m.id}>{t(m.en, m.km)}</option>)}
          </Select>
        </Field>
      </Row>

      {rows ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-[var(--ground-line)] text-left text-xs uppercase tracking-wide text-[var(--ink-dim)]">
                <th className="py-2 pr-3">{t("Year", "ឆ្នាំ")}</th>
                <th className="py-2 pr-3">{t("Depreciation", "ការធ្លាក់តម្លៃ")}</th>
                <th className="py-2 pr-3">{t("Accumulated", "ការធ្លាក់តម្លៃប្រមូលបាន")}</th>
                <th className="py-2">{t("Book value", "តម្លៃតាមសៀវភៅ")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.year} className="border-b border-[var(--ground-line)]/60">
                  <td className="py-1.5 pr-3 font-mono-ui">{row.year}</td>
                  <td className="py-1.5 pr-3 font-mono-ui">{fmt(row.depreciation)}</td>
                  <td className="py-1.5 pr-3 font-mono-ui">{fmt(row.accumulated)}</td>
                  <td className="py-1.5 font-mono-ui">{fmt(row.bookValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
          {t("Enter a non-negative cost, a salvage value not above the cost, and a useful life between 1 and 100 years.", "សូមបញ្ចូលតម្លៃសម្បត្តិ (≥០) តម្លៃសល់មិនលើសតម្លៃសម្បត្តិ និងអាយុកាលពី ១ ដល់ ១០០ ឆ្នាំ។")}
        </p>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t("Standard accounting formulas: straight-line = (cost − salvage)/life; declining balance rate = 1 − (salvage/cost)^(1/life); double-declining = book × 2/life floored at salvage; sum-of-years digits weighted. This is a calculation aid, not tax or accounting advice — follow your accountant's policy choices.", "រូបមន្តគណនេយ្យស្តង់ដារ៖ ត្រង់ៗ = (តម្លៃ − តម្លៃសល់)/អាយុកាល; តុល្យភាពធ្លាក់ចុះ rate = 1 − (សល់/តម្លៃ)^(១/អាយុកាល); ពីរដង = តម្លៃសៀវភៅ × ២/អាយុកាល (ដល់ដែនតម្លៃសល់); ផលបូកលេខឆ្នាំ។ នេះជាឧបករណ៍គណនា មិនមែនជាដំបូន្មានពន្ធដារ ឬគណនេយ្យទេ។")}
      </p>
    </ToolShell>
  );
}
