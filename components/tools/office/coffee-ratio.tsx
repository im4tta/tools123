"use client";
import { useState } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Method = { id: string; label: string; labelKm: string; coffee: number; water: number };

const METHODS: Method[] = [
  { id: "pour-over", label: "Pour-over", labelKm: "កាហ្វេចាក់ចម្រោះ", coffee: 1, water: 16 },
  { id: "french-press", label: "French press", labelKm: "ហ្វ្រេនស៍ប្រេស", coffee: 1, water: 12 },
  { id: "espresso", label: "Espresso", labelKm: "អេស្ប្រេសសូ", coffee: 1, water: 2 },
  { id: "cold-brew", label: "Cold brew", labelKm: "កាហ្វេត្រជាក់", coffee: 1, water: 8 },
  { id: "aeropress", label: "AeroPress", labelKm: "អេរ៉ូប្រេស", coffee: 1, water: 15 },
];

const ML_PER_CUP = 250;

const toNum = (s: string) => (s.trim() === "" ? NaN : Number(s));

const fmtGrams = (n: number) => {
  if (!Number.isFinite(n) || n < 0) return "";
  const r = Math.round(n * 10) / 10;
  return String(r % 1 === 0 ? r : r.toFixed(1));
};

const fmtMl = (n: number) => (Number.isFinite(n) && n >= 0 ? String(Math.round(n)) : "");

const fmtServings = (n: number) => {
  if (!Number.isFinite(n) || n < 0) return "";
  return n < 10 ? String(Math.round(n * 10) / 10) : String(Math.round(n));
};

export default function CoffeeRatio() {
  const { text: t } = useLanguage();
  const [methodId, setMethodId] = useToolState("coffee-ratio:method", "pour-over");
  const [coffeeParts, setCoffeeParts] = useToolState("coffee-ratio:coffee-parts", "1");
  const [waterParts, setWaterParts] = useToolState("coffee-ratio:water-parts", "16");
  const [coffee, setCoffee] = useToolState("coffee-ratio:coffee", "20");
  const [water, setWater] = useToolState("coffee-ratio:water", "");
  const [source, setSource] = useState<"coffee" | "water">("coffee");

  const w = Number(waterParts);
  const c = Number(coffeeParts);
  const ratioOk = Number.isFinite(w) && Number.isFinite(c) && w > 0 && c > 0;

  const coffeeN = toNum(coffee);
  const waterN = toNum(water);

  const displayedCoffee = source === "coffee" ? coffeeN : ratioOk && Number.isFinite(waterN) ? (waterN * c) / w : NaN;
  const displayedWater = source === "water" ? waterN : ratioOk && Number.isFinite(coffeeN) ? (coffeeN * w) / c : NaN;

  const valid =
    ratioOk &&
    Number.isFinite(displayedCoffee) &&
    Number.isFinite(displayedWater) &&
    displayedCoffee >= 0 &&
    displayedWater >= 0;

  const applyMethod = (id: string) => {
    const m = METHODS.find((x) => x.id === id);
    if (!m) return;
    setMethodId(id);
    setCoffeeParts(String(m.coffee));
    setWaterParts(String(m.water));
  };

  return (
    <ToolShell
      title="Coffee Ratio Calculator"
      khmerTitle="គណនាសមាមាត្រកាហ្វេ"
      description="Pick a brew method or set your own ratio, then enter coffee grams or water millilitres — the other value and an approximate cup count are computed for you."
      descriptionKm="ជ្រើសរើសវិធីចម្រោះ ឬកំណត់សមាមាត្រដោយខ្លួនឯង រួចបញ្ចូលកាហ្វេជាក្រាម ឬទឹកជាមីលីលីត្រ — តម្លៃម្ខាងទៀត និងចំនួនពែងប្រហាក់ប្រហែល នឹងត្រូវគណនាដោយស្វ័យប្រវត្តិ។"
    >
      <Row>
        <Field label={t("Brew method", "វិធីចម្រោះ")}>
          <Select value={methodId} onChange={(e) => applyMethod(e.target.value)}>
            {METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {t(m.label, m.labelKm)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("Ratio (coffee : water)", "សមាមាត្រ (កាហ្វេ : ទឹក)")}>
          <div className="flex items-center gap-2">
            <TextInput
              inputMode="decimal"
              value={coffeeParts}
              onChange={(e) => setCoffeeParts(e.target.value)}
              aria-label={t("Coffee parts", "ចំណែកកាហ្វេ")}
            />
            <span className="shrink-0 text-sm text-[var(--ink-dim)]">:</span>
            <TextInput
              inputMode="decimal"
              value={waterParts}
              onChange={(e) => setWaterParts(e.target.value)}
              aria-label={t("Water parts", "ចំណែកទឹក")}
            />
          </div>
        </Field>
      </Row>

      <Row>
        <Field label={t("Coffee (g)", "កាហ្វេ (ក្រាម)")}>
          <TextInput
            inputMode="decimal"
            value={source === "coffee" ? coffee : fmtGrams(displayedCoffee)}
            onChange={(e) => {
              setSource("coffee");
              setCoffee(e.target.value);
            }}
            placeholder={t("e.g. 20", "ឧ. 20")}
          />
        </Field>
        <Field label={t("Water (ml)", "ទឹក (មីលីលីត្រ)")}>
          <TextInput
            inputMode="decimal"
            value={source === "water" ? water : fmtMl(displayedWater)}
            onChange={(e) => {
              setSource("water");
              setWater(e.target.value);
            }}
            placeholder={t("e.g. 320", "ឧ. 320")}
          />
        </Field>
      </Row>

      <Output
        label={t("Approx. servings (250 ml each)", "ចំនួនពែងប្រហាក់ប្រហែល (២៥០ មីលីលីត្រ/ពែង)")}
        value={
          valid
            ? `${fmtServings(displayedWater / ML_PER_CUP)} ${t("cups", "ពែង")} · ${fmtGrams(displayedCoffee)} g → ${fmtMl(displayedWater)} ml`
            : t("Enter positive numbers for ratio, coffee, and water.", "សូមបញ្ចូលលេខវិជ្ជមានសម្រាប់សមាមាត្រ កាហ្វេ និងទឹក។")
        }
        error={!valid}
        mono={false}
      />

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "General guideline — adjust to taste. Ratios vary with bean, roast, grind size, and brew time; start from the preset and dial it in from there.",
          "ជាគោលការណ៍ទូទៅ — កែតម្រូវតាមចំណូលចិត្ត។ សមាមាត្រប្រែប្រួលតាមប្រភេទសណ្ដែកកាហ្វេ ការអាំង កម្រិតកិន និងពេលចម្រោះ; ចាប់ផ្ដើមពីតម្លៃដែលបានកំណត់ រួចកែតម្រូវបន្ថែមទៀត។"
        )}
      </p>
    </ToolShell>
  );
}
