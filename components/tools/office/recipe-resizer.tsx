"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Button, Output } from "@/components/ui/Output";
import { CopyButton } from "@/components/CopyButton";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Ingredient = {
  id: number;
  name: string;
  amount: string;
  unit: string;
  servings: string;
};

const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 1, name: "Rice", amount: "200", unit: "g", servings: "4" },
  { id: 2, name: "Chicken breast", amount: "150", unit: "g", servings: "" },
  { id: 3, name: "Water", amount: "300", unit: "ml", servings: "" },
];

function roundSensible(v: number): number {
  const abs = Math.abs(v);
  if (abs < 1) return Math.round(v / 0.25) * 0.25;
  if (abs < 10) return Math.round(v / 0.5) * 0.5;
  return Math.round(v);
}

function fmtNum(v: number): string {
  return v.toFixed(2).replace(/\.?0+$/, "");
}

export default function RecipeResizer() {
  const { text: t } = useLanguage();
  const [servingsIn, setServingsIn] = useToolState("recipe-resizer:in", "4");
  const [servingsOut, setServingsOut] = useToolState("recipe-resizer:out", "8");
  const [ingredients, setIngredients] = useToolState<Ingredient[]>(
    "recipe-resizer:ingredients",
    INITIAL_INGREDIENTS
  );

  const inN = Number(servingsIn);
  const outN = Number(servingsOut);
  const valid =
    Number.isFinite(inN) && Number.isFinite(outN) && inN > 0 && outN > 0;
  const factor = valid ? outN / inN : 1;

  const updateIngredient = (id: number, patch: Partial<Omit<Ingredient, "id">>) =>
    setIngredients((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );

  const addIngredient = () =>
    setIngredients((prev) => {
      const nextId = prev.reduce((max, row) => Math.max(max, row.id), 0) + 1;
      return [...prev, { id: nextId, name: "", amount: "", unit: "", servings: "" }];
    });

  const removeIngredient = (id: number) =>
    setIngredients((prev) => prev.filter((row) => row.id !== id));

  const scaledFor = (row: Ingredient): string => {
    if (!valid) return "—";
    const amt = Number(row.amount);
    if (!Number.isFinite(amt) || amt < 0) return "—";
    const rowServings = Number(row.servings);
    const divisor =
      row.servings.trim() !== "" && Number.isFinite(rowServings) && rowServings > 0
        ? rowServings
        : inN;
    return `${fmtNum(roundSensible((amt / divisor) * outN))}${row.unit ? ` ${row.unit}` : ""}`;
  };

  const scaledText = useMemo(() => {
    const head = `${t("Scaled recipe", "រូបមន្តកែទំហំ")} (${fmtNum(inN)} ${t("→", "→")} ${fmtNum(outN)} ${t("servings", "នាក់")}, ×${fmtNum(factor)})`;
    const rows = ingredients.map((row) => {
      const name = row.name.trim() || t("Ingredient", "គ្រឿងផ្សំ");
      let scaled = "—";
      if (valid) {
        const amt = Number(row.amount);
        if (Number.isFinite(amt) && amt >= 0) {
          const rowServings = Number(row.servings);
          const divisor =
            row.servings.trim() !== "" && Number.isFinite(rowServings) && rowServings > 0
              ? rowServings
              : inN;
          scaled = `${fmtNum(roundSensible((amt / divisor) * outN))}${row.unit ? ` ${row.unit}` : ""}`;
        }
      }
      return `- ${name}: ${scaled}`;
    });
    return [head, ...rows].join("\n");
  }, [ingredients, valid, inN, outN, factor, t]);

  return (
    <ToolShell
      title="Recipe Resizer"
      khmerTitle="កែទំហំរូបមន្ត"
      description="Scale any recipe from one number of servings to another. Amounts are rounded to sensible kitchen measurements, and every row stays editable."
      descriptionKm="កែទំហំរូបមន្តណាមួយពីចំនួនអ្នកញ៉ាំមួយទៅមួយទៀត។ បរិមាណត្រូវបានបង្គត់ទៅជារង្វាស់ផ្ទះបាយសមស្រប ហើយគ្រប់ជួរអាចកែប្រែបាន។"
    >
      <Row>
        <Field label={t("Servings (current)", "ចំនួនអ្នកញ៉ាំ (បច្ចុប្បន្ន)")}>
          <TextInput inputMode="numeric" value={servingsIn} onChange={(e) => setServingsIn(e.target.value)} />
        </Field>
        <Field label={t("Servings (wanted)", "ចំនួនអ្នកញ៉ាំ (ដែលចង់បាន)")}>
          <TextInput inputMode="numeric" value={servingsOut} onChange={(e) => setServingsOut(e.target.value)} />
        </Field>
      </Row>

      <Output
        label={t("Conversion factor", "កត្តាបំលែង")}
        value={
          valid
            ? `${fmtNum(factor)} ×  (${fmtNum(inN)} ${t("→", "→")} ${fmtNum(outN)} ${t("servings", "នាក់")})`
            : t("Servings must be positive numbers.", "ចំនួនអ្នកញ៉ាំត្រូវតែជាលេខវិជ្ជមាន។")
        }
        error={!valid}
        mono={false}
      />

      <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[var(--ground-raised)] text-xs text-[var(--ink-dim)]">
            <tr>
              <th className="px-3 py-2">{t("Ingredient", "គ្រឿងផ្សំ")}</th>
              <th className="w-28 px-3 py-2">{t("Amount", "បរិមាណ")}</th>
              <th className="w-32 px-3 py-2">{t("Unit", "ឯកតា")}</th>
              <th className="w-28 px-3 py-2">{t("Servings (optional)", "ចំនួនអ្នកញ៉ាំ (ស្រេចចិត្ត)")}</th>
              <th className="w-36 px-3 py-2">{t("Scaled", "បរិមាណថ្មី")}</th>
              <th className="px-3 py-2"><span className="sr-only">{t("Remove", "លុប")}</span></th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((row) => (
              <tr key={row.id} className="border-t border-[var(--ground-line)] align-top">
                <td className="px-2 py-2">
                  <TextInput
                    aria-label={t("Ingredient", "គ្រឿងផ្សំ")}
                    value={row.name}
                    onChange={(e) => updateIngredient(row.id, { name: e.target.value })}
                    placeholder={t("e.g. Rice", "ឧ. បាយ")}
                  />
                </td>
                <td className="px-2 py-2">
                  <TextInput
                    aria-label={t("Amount", "បរិមាណ")}
                    inputMode="decimal"
                    value={row.amount}
                    onChange={(e) => updateIngredient(row.id, { amount: e.target.value })}
                    placeholder={t("e.g. 200", "ឧ. 200")}
                  />
                </td>
                <td className="px-2 py-2">
                  <TextInput
                    aria-label={t("Unit", "ឯកតា")}
                    value={row.unit}
                    onChange={(e) => updateIngredient(row.id, { unit: e.target.value })}
                    placeholder={t("g / ml / cup", "ក្រាម / មីលីលីត្រ / ពែង")}
                  />
                </td>
                <td className="px-2 py-2">
                  <TextInput
                    aria-label={t("Servings (optional)", "ចំនួនអ្នកញ៉ាំ (ស្រេចចិត្ត)")}
                    inputMode="numeric"
                    value={row.servings}
                    onChange={(e) => updateIngredient(row.id, { servings: e.target.value })}
                    placeholder={t("e.g. 4", "ឧ. 4")}
                  />
                </td>
                <td className="px-3 py-3 font-mono-ui font-semibold text-[var(--gold)]">{scaledFor(row)}</td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => removeIngredient(row.id)}
                    className="rounded px-2 py-2 text-[var(--danger)] hover:bg-[var(--danger)]/10"
                    aria-label={t("Remove ingredient", "លុបគ្រឿងផ្សំ")}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!ingredients.length && (
          <p className="p-8 text-center text-sm text-[var(--ink-dim)]">
            {t("Add an ingredient to begin.", "សូមបន្ថែមគ្រឿងផ្សំដើម្បីចាប់ផ្ដើម។")}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={addIngredient}>{t("Add ingredient", "បន្ថែមគ្រឿងផ្សំ")}</Button>
        <CopyButton text={scaledText} />
      </div>

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Tip: if a listed amount is for a different number of servings (e.g. \"200 g rice — for 4\"), enter that number in the row's Servings column; otherwise the row scales with the recipe servings. Rounding uses 0.25 for amounts under 1, 0.5 under 10, and whole numbers above.",
          "គន្លឹះ: ប្រសិនបើបរិមាណដែលបានរាយគឺសម្រាប់ចំនួនអ្នកញ៉ាំផ្សេង (ឧ. \"បាយ ២០០ ក្រាម — សម្រាប់ ៤ នាក់\") សូមបញ្ចូលលេខនោះក្នុងជួរឈរ Servings របស់ជួរដេកនោះ; បើមិនដូច្នេះទេ ជួរដេកនឹងកែតាមចំនួនអ្នកញ៉ាំរបស់រូបមន្ត។ ការបង្គត់ប្រើ ០.២៥ សម្រាប់បរិមាណក្រោម ១, ០.៥ ក្រោម ១០ និងលេខទាំងមូលលើសពីនេះ។"
        )}
      </p>
    </ToolShell>
  );
}
