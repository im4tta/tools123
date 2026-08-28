"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// Rule-of-thumb cooling estimate (common AC-sizing approximation):
// BTU/h ≈ (area ft² × 20 × ceiling÷2.4 m) + (600 × max(0, occupants − 2))
//        + (3.41 × electronics W), then × sun factor (1.0 / 1.1 / 1.2).
// kW = BTU ÷ 3,412. Approximate only — a proper heat-load calculation (JIS/ASHRAE)
// is needed for final selection.

const SUN_FACTORS = [
  { id: "low", en: "Low", km: "ទាប", factor: 1 },
  { id: "medium", en: "Medium", km: "មធ្យម", factor: 1.1 },
  { id: "high", en: "High", km: "ខ្ពស់", factor: 1.2 },
] as const;

const CAPACITIES = [
  { btu: 9000, hp: "1 HP" },
  { btu: 12000, hp: "1.5 HP" },
  { btu: 18000, hp: "2 HP" },
  { btu: 24000, hp: "2.5 HP" },
  { btu: 28000, hp: "3 HP" },
  { btu: 36000, hp: "4 HP" },
  { btu: 48000, hp: "5 HP" },
] as const;

function toNum(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function AcBtuCalculator() {
  const { text: t } = useLanguage();
  const [length, setLength] = useToolState("ac:length", "4");
  const [width, setWidth] = useToolState("ac:width", "4");
  const [height, setHeight] = useToolState("ac:height", "2.7");
  const [occupants, setOccupants] = useToolState("ac:occupants", "2");
  const [sun, setSun] = useToolState("ac:sun", "medium");
  const [watts, setWatts] = useToolState("ac:watts", "300");

  const result = useMemo(() => {
    const l = Math.max(0, toNum(length));
    const w = Math.max(0, toNum(width));
    const h = Math.max(2, toNum(height));
    const occ = Math.max(0, Math.round(toNum(occupants)));
    const elec = Math.max(0, toNum(watts));
    const sunFactor = SUN_FACTORS.find((s) => s.id === sun) ?? SUN_FACTORS[1];

    const areaFt2 = l * w * 10.7639;
    const base = areaFt2 * 20 * (h / 2.4);
    const people = Math.max(0, occ - 2) * 600;
    const electronics = elec * 3.41;
    const btu = Math.ceil((base + people + electronics) * sunFactor.factor);
    const kw = btu / 3412.14;
    const suggested = CAPACITIES.find((c) => c.btu >= btu);
    return { areaFt2, sunFactor, btu, kw, suggested, h };
  }, [length, width, height, occupants, sun, watts]);

  return (
    <ToolShell
      title="AC / BTU Room Cooling"
      khmerTitle="គណនា BTU ម៉ាស៊ីនត្រជាក់"
      description="Estimate the cooling capacity (BTU/h and kW) and a suggested air conditioner size for a room from its dimensions, occupants, sun exposure and electronics load."
      descriptionKm="ប៉ាន់ស្មានកម្លាំងត្រជាក់ (BTU/h និង kW) និងទំហំម៉ាស៊ីនត្រជាក់ដែលណែនាំសម្រាប់បន្ទប់ ពីទំហំ ចំនួនមនុស្ស កម្រិតពន្លឺព្រះអាទិត្យ និងបន្ទុកឧបករណ៍អគ្គិសនី។"
    >
      <Row>
        <Field label={t("Room length (m)", "ប្រវែងបន្ទប់ (ម)")}>
          <TextInput type="number" min="0" step="any" value={length} onChange={(e) => setLength(e.target.value)} />
        </Field>
        <Field label={t("Room width (m)", "ទទឹងបន្ទប់ (ម)")}>
          <TextInput type="number" min="0" step="any" value={width} onChange={(e) => setWidth(e.target.value)} />
        </Field>
        <Field label={t("Ceiling height (m)", "កម្ពស់ពិដាន (ម)")}>
          <TextInput type="number" min="2" step="any" value={height} onChange={(e) => setHeight(e.target.value)} />
        </Field>
        <Field label={t("Occupants", "ចំនួនមនុស្ស")}>
          <TextInput type="number" min="0" step="1" value={occupants} onChange={(e) => setOccupants(e.target.value)} />
        </Field>
        <Field label={t("Sun exposure", "កម្រិតពន្លឺព្រះអាទិត្យ")}>
          <Select value={sun} onChange={(e) => setSun(e.target.value)}>
            {SUN_FACTORS.map((s) => (
              <option key={s.id} value={s.id}>{t(s.en, s.km)} (×{s.factor})</option>
            ))}
          </Select>
        </Field>
        <Field label={t("Electronics load (W)", "បន្ទុកឧបករណ៍អគ្គិសនី (W)")}>
          <TextInput type="number" min="0" step="any" value={watts} onChange={(e) => setWatts(e.target.value)} />
        </Field>
      </Row>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Recommended cooling", "កម្លាំងត្រជាក់ដែលណែនាំ")}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--gold)]">{result.btu.toLocaleString("en-US")} BTU/h</div>
          <div className="text-xs text-[var(--ink-dim)]">{result.areaFt2.toFixed(1)} ft² · {result.h} m {t("ceiling", "ពិដាន")}</div>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Cooling power", "ថាមពលត្រជាក់")}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{result.kw.toFixed(2)} kW</div>
          <div className="text-xs text-[var(--ink-dim)]">{result.btu.toLocaleString("en-US")} ÷ 3,412</div>
        </div>
        <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--gold)]">{t("Suggested AC", "ម៉ាស៊ីនត្រជាក់ដែលណែនាំ")}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--gold)]">
            {result.suggested
              ? `${result.suggested.btu.toLocaleString("en-US")} BTU — ${result.suggested.hp}`
              : t("Larger than 48,000 BTU — consider multiple units", "ធំជាង 48,000 BTU — សូមពិចារណាដំឡើងច្រើនគ្រឿង")}
          </div>
          <div className="text-xs text-[var(--gold)]">{t("standard capacity", "សមត្ថភាពស្ដង់ដារ")}</div>
        </div>
      </div>

      <section className="rounded-md border border-[var(--ground-line)] p-4">
        <h2 className="font-medium text-[var(--ink)]">{t("Rule of thumb (approximate)", "ច្បាប់ប្រហាក់ប្រហែល (ការប៉ាន់ស្មាន)")}</h2>
        <pre className="mt-2 overflow-x-auto rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5 font-mono-ui text-xs text-[var(--ink)]">
          {`${t("Formula", "រូបមន្ត")}:
BTU/h ≈ (area ft² × 20 × ceiling÷2.4) + (600 × max(0, occupants − 2)) + (3.41 × electronics W)
      then × sun factor (${result.sunFactor.en}: ${result.sunFactor.factor})
kW = BTU ÷ 3,412`}
        </pre>
        <p className="mt-3 text-xs leading-relaxed text-[var(--ink-dim)]">
          {t(
            "Approximate sizing rule only — for final selection use a proper heat-load calculation that also accounts for windows, insulation, orientation and local climate.",
            "គ្រាន់តែជាច្បាប់ប្រហាក់ប្រហែលសម្រាប់ការប៉ាន់ស្មាន — សម្រាប់ការជ្រើសរើសចុងក្រោយ សូមប្រើការគណនាបន្ទុកកម្ដៅត្រឹមត្រូវ ដែលរាប់បញ្ចូលបង្អួច អ៊ីសូឡង់ ទិសដៅ និងអាកាសធាតុក្នុងតំបន់ផងដែរ។"
          )}
        </p>
      </section>
    </ToolShell>
  );
}
