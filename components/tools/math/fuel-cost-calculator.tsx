"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field, Row, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function FuelCostCalculator() {
  const { text: t } = useLanguage();
  const [distance, setDistance] = useToolState("fuel-cost:distance", "100");
  const [efficiency, setEfficiency] = useToolState("fuel-cost:efficiency", "7.5");
  const [price, setPrice] = useToolState("fuel-cost:price", "1.2");
  const [unit, setUnit] = useToolState<"l100km" | "kmpl">("fuel-cost:unit", "l100km");

  const result = useMemo(() => {
    const d = Number(distance);
    const eff = Number(efficiency);
    const p = Number(price);
    if (!Number.isFinite(d) || !Number.isFinite(eff) || !Number.isFinite(p) || d <= 0 || eff <= 0 || p <= 0) return null;

    const liters = unit === "l100km" ? (d / 100) * eff : d / eff;
    return { liters, cost: liters * p };
  }, [distance, efficiency, price, unit]);

  return (
    <ToolShell
      title="Fuel Cost Calculator"
      khmerTitle="គណនាថ្លៃប្រេងឥន្ធនៈ"
      description="Estimate the fuel needed and cost for a trip from distance, efficiency, and fuel price."
      descriptionKm="ប៉ាន់ស្មានបរិមាណ និងតម្លៃប្រេងសម្រាប់ការធ្វើដំណើរ ពីចម្ងាយ ប្រសិទ្ធភាព និងតម្លៃប្រេង។"
    >
      <Row>
        <Field label={t("Distance (km)", "ចម្ងាយ (គីឡូម៉ែត្រ)")}>
          <TextInput type="number" value={distance} onChange={(e) => setDistance(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Efficiency", "ប្រសិទ្ធភាព")}>
          <TextInput type="number" value={efficiency} onChange={(e) => setEfficiency(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>
      <Row>
        <Field label={t("Efficiency unit", "ឯកតាប្រសិទ្ធភាព")}>
          <Select value={unit} onChange={(e) => setUnit(e.target.value as "l100km" | "kmpl")} className="w-full">
            <option value="l100km">{t("L / 100 km", "លីត្រ / ១០០ គីឡូម៉ែត្រ")}</option>
            <option value="kmpl">{t("km / L", "គីឡូម៉ែត្រ / លីត្រ")}</option>
          </Select>
        </Field>
        <Field label={t("Fuel price (per L)", "តម្លៃប្រេង (ក្នុងមួយលីត្រ)")}>
          <TextInput type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>
      {result && (
        <div className="space-y-2">
          <Output label={t("Fuel needed", "ប្រេងត្រូវការ")} value={`${result.liters.toFixed(2)} L`} />
          <Output label={t("Total cost", "តម្លៃសរុប")} value={result.cost.toFixed(2)} />
        </div>
      )}
      <p className="text-xs text-[var(--ink-faint)]">
        {t("Estimate only — real consumption varies with driving conditions, load, and vehicle.", "ជាការប៉ាន់ស្មានតែប៉ុណ្ណោះ — ការប្រើប្រេងជាក់ស្តែងប្រែប្រួលតាមស្ថានភាពបើកបរ បន្ទុក និងយានយន្ត។")}
      </p>
    </ToolShell>
  );
}
