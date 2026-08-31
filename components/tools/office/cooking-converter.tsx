"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface VolumeUnit {
  id: string;
  label: [string, string];
  ml: number;
}

// Volume bases are common US cooking conventions (1 cup = 240 ml legal cup,
// 1 tbsp = 15 ml, 1 tsp = 5 ml, 1 fl oz ≈ 29.57 ml) — close enough for
// everyday cooking and labelled approximate below.
const VOLUME_UNITS: VolumeUnit[] = [
  { id: "cup", label: ["cup", "ពែង"], ml: 240 },
  { id: "tbsp", label: ["tablespoon (tbsp)", "ស្លាបព្រាបាយ"], ml: 15 },
  { id: "tsp", label: ["teaspoon (tsp)", "ស្លាបព្រាកាហ្វេ"], ml: 5 },
  { id: "floz", label: ["fluid ounce (US)", "អោនស៍រាវ (US)"], ml: 29.5735 },
  { id: "ml", label: ["milliliter (ml)", "មីលីលីត្រ"], ml: 1 },
  { id: "liter", label: ["liter", "លីត្រ"], ml: 1000 },
];

interface Ingredient {
  id: string;
  label: [string, string];
  density: number; // grams per milliliter, approximate
}

const INGREDIENTS: Ingredient[] = [
  { id: "water", label: ["Water", "ទឹក"], density: 1.0 },
  { id: "milk", label: ["Milk", "ទឹកដោះគោ"], density: 1.03 },
  { id: "flour", label: ["All-purpose flour", "ម្សៅស្រូវសាលី"], density: 0.53 },
  { id: "sugar", label: ["Granulated sugar", "ស្ករស"], density: 0.85 },
  { id: "butter", label: ["Butter", "ប៊ឺ"], density: 0.91 },
  { id: "rice", label: ["Rice (uncooked)", "អង្ករ (មិនទាន់ស្ងោរ)"], density: 0.77 },
  { id: "salt", label: ["Table salt", "អំបិល"], density: 1.2 },
];

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1000) return Math.round(n).toLocaleString("en-US");
  if (abs >= 100) return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  if (abs >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export default function CookingConverter() {
  const { text: t } = useLanguage();
  const [amount, setAmount] = useToolState("cooking-converter:amount", "1");
  const [unitId, setUnitId] = useToolState("cooking-converter:unit", "cup");
  const [ingredientId, setIngredientId] = useToolState("cooking-converter:ingredient", "water");

  const unit = VOLUME_UNITS.find((u) => u.id === unitId) ?? VOLUME_UNITS[0];
  const ingredient = INGREDIENTS.find((ing) => ing.id === ingredientId) ?? null;

  const converted = useMemo(() => {
    const value = Number(amount);
    if (Number.isNaN(value) || value <= 0) return null;
    const ml = value * unit.ml;
    return {
      ml,
      grams: ingredient ? ml * ingredient.density : null,
      rows: VOLUME_UNITS.map((u) => ({ ...u, value: ml / u.ml })),
    };
  }, [amount, unit, ingredient]);

  return (
    <ToolShell
      title="Cooking Measurement Converter"
      khmerTitle="បម្លែងឯកតាចម្អិនអាហារ"
      description="Convert between cup, tbsp, tsp, fl oz, ml and liter, and to grams for common ingredients with approximate densities."
      descriptionKm="បម្លែងរវាងពែង ស្លាបព្រាបាយ ស្លាបព្រាកាហ្វេ អោនស៍រាវ មីលីលីត្រ និងលីត្រ ហើយទៅជាក្រាមសម្រាប់គ្រឿងផ្សំទូទៅដែលមានដង់ស៊ីតេប្រហាក់ប្រហែល។"
    >
      <Row>
        <Field label={t("Ingredient", "គ្រឿងផ្សំ")}>
          <Select value={ingredientId} onChange={(e) => setIngredientId(e.target.value)}>
            <option value="none">{t("Plain volume (no weight)", "បរិមាណសុទ្ធ (គ្មានទម្ងន់)")}</option>
            {INGREDIENTS.map((ing) => (
              <option key={ing.id} value={ing.id}>
                {t(ing.label[0], ing.label[1])}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("Amount", "ចំនួន")}>
          <TextInput inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Unit", "ឯកតា")}>
          <Select value={unitId} onChange={(e) => setUnitId(e.target.value)}>
            {VOLUME_UNITS.map((u) => (
              <option key={u.id} value={u.id}>
                {t(u.label[0], u.label[1])}
              </option>
            ))}
          </Select>
        </Field>
      </Row>

      {converted ? (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--ground-line)] bg-[var(--ground-raised)] text-left text-xs uppercase tracking-wide text-[var(--ink-dim)]">
                  <th className="px-3 py-2">{t("Unit", "ឯកតា")}</th>
                  <th className="px-3 py-2">{t("Amount", "ចំនួន")}</th>
                  {converted.grams !== null && <th className="px-3 py-2">{t("Grams (approx.)", "ក្រាម (ប្រហាក់ប្រហែល)")}</th>}
                </tr>
              </thead>
              <tbody>
                {converted.rows.map((r) => (
                  <tr key={r.id} className={`border-b border-[var(--ground-line)] last:border-0 ${r.id === unit.id ? "bg-[var(--gold)]/10" : ""}`}>
                    <td className="px-3 py-2 text-[var(--ink)]">{t(r.label[0], r.label[1])}</td>
                    <td className="px-3 py-2 font-mono-ui text-[var(--ink)]">{fmt(r.value)}</td>
                    {converted.grams !== null && (
                      <td className="px-3 py-2 font-mono-ui text-[var(--ink-dim)]">
                        {r.value >= 1 ? `${fmt(r.value * (ingredient?.density ?? 1))} g` : "—"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {converted.grams !== null && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                  {t("Weight (approx.)", "ទម្ងន់ (ប្រហាក់ប្រហែល)")}
                </div>
                <div className="mt-1 text-2xl font-semibold text-[var(--gold)]">
                  {fmt(converted.grams)} <span className="text-xs font-normal text-[var(--ink-dim)]">g</span>
                </div>
                <div className="mt-0.5 text-[10px] text-[var(--ink-dim)]">
                  {fmt(converted.ml)} ml × {fmt(ingredient?.density ?? 0)} g/ml
                </div>
              </div>
              <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                  {t("Reference: 1 cup ≈", "ឯកសារយោង៖ ១ ពែង ≈")}
                </div>
                <div className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                  {fmt((ingredient?.density ?? 0) * 240)} <span className="text-xs font-normal text-[var(--ink-dim)]">g</span>
                </div>
                <div className="mt-0.5 text-[10px] text-[var(--ink-dim)]">{t(ingredient?.label[0] ?? "", ingredient?.label[1] ?? "")}</div>
              </div>
            </div>
          )}

          <p className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
            {t(
              "Bases: 1 cup = 240 ml (US legal cup), 1 tbsp = 15 ml, 1 tsp = 5 ml, 1 fl oz ≈ 29.57 ml, 1 liter = 1000 ml. Ingredient densities (g/ml) are approximate — water 1.00, milk 1.03, flour 0.53, sugar 0.85, butter 0.91, rice 0.77, salt 1.20 — and vary with brand, moisture and packing. Treat results as estimates.",
              "មូលដ្ឋាន៖ ១ ពែង = 240 មីលីលីត្រ (ពែងផ្លូវការ US), ១ ស្លាបព្រាបាយ = 15 មីលីលីត្រ, ១ ស្លាបព្រាកាហ្វេ = 5 មីលីលីត្រ, ១ អោនស៍រាវ ≈ 29.57 មីលីលីត្រ, ១ លីត្រ = 1000 មីលីលីត្រ។ ដង់ស៊ីតេគ្រឿងផ្សំ (ក្រាម/មីលីលីត្រ) គឺប្រហាក់ប្រហែល — ទឹក 1.00, ទឹកដោះគោ 1.03, ម្សៅ 0.53, ស្ករ 0.85, ប៊ឺ 0.91, អង្ករ 0.77, អំបិល 1.20 — ហើយប្រែប្រួលតាមម៉ាក សំណើម និងការវេចខ្ចប់។ សូមចាត់ទុកលទ្ធផលជាការប៉ាន់ស្មាន។"
            )}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter a positive amount.", "សូមបញ្ចូលចំនួនវិជ្ជមាន។")}</p>
      )}
    </ToolShell>
  );
}
