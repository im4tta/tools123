"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// Nominal-mix material estimate only (not a structural design). Practical
// approximations: dry loose volume = wet volume × 1.54 (sand bulking +
// concrete shrinkage), 1 bag of 50 kg cement ≈ 0.035 m³, water ≈ 25 L per bag
// (w/c ≈ 0.5). Verify quantities with an engineer before ordering.

const SHAPES = [
  { id: "slab", en: "Slab", km: "កម្រាល" },
  { id: "column", en: "Column", km: "សសរ" },
  { id: "beam", en: "Beam", km: "ធ្នឹម" },
  { id: "footing", en: "Footing", km: "គ្រឹះ" },
] as const;

const MIXES = [
  { id: "124", en: "1 : 2 : 4", km: "១ : ២ : ៤", note: "General purpose", noteKm: "ប្រើទូទៅ", parts: [1, 2, 4] as const },
  { id: "136", en: "1 : 3 : 6", km: "១ : ៣ : ៦", note: "Lean / blinding", noteKm: "លាយស្ដើង / កម្រាលក្រោម", parts: [1, 3, 6] as const },
] as const;

const FT_TO_M = 0.3048;
const DRY_FACTOR = 1.54;
const BAG_VOLUME = 0.035; // m³ per 50 kg bag
const WATER_PER_BAG = 25; // litres per 50 kg bag

function toNum(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function ConcreteCalculator() {
  const { text: t } = useLanguage();
  const [shape, setShape] = useToolState("concrete:shape", "slab");
  const [unit, setUnit] = useToolState("concrete:unit", "m");
  const [length, setLength] = useToolState("concrete:length", "5");
  const [width, setWidth] = useToolState("concrete:width", "4");
  const [height, setHeight] = useToolState("concrete:height", "0.15");
  const [mixId, setMixId] = useToolState("concrete:mix", "124");

  const result = useMemo(() => {
    const f = unit === "ft" ? FT_TO_M : 1;
    const l = Math.max(0, toNum(length)) * f;
    const w = Math.max(0, toNum(width)) * f;
    const h = Math.max(0, toNum(height)) * f;
    const volume = l * w * h;
    const dry = volume * DRY_FACTOR;
    const mix = MIXES.find((m) => m.id === mixId) ?? MIXES[0];
    const totalParts = mix.parts[0] + mix.parts[1] + mix.parts[2];
    const bags = (dry * (mix.parts[0] / totalParts)) / BAG_VOLUME;
    const sand = dry * (mix.parts[1] / totalParts);
    const gravel = dry * (mix.parts[2] / totalParts);
    return {
      volume,
      volumeFt: volume / (FT_TO_M * FT_TO_M * FT_TO_M),
      bags,
      sand,
      gravel,
      water: bags * WATER_PER_BAG,
      mix,
    };
  }, [unit, length, width, height, mixId]);

  const shapeLabel = SHAPES.find((s) => s.id === shape) ?? SHAPES[0];

  return (
    <ToolShell
      title="Concrete Calculator"
      khmerTitle="គណនាបេតុង"
      description="Estimate concrete volume and nominal-mix materials (50 kg cement bags, sand, gravel, water) for slabs, columns, beams and footings, in metres or feet."
      descriptionKm="ប៉ាន់ស្មានបរិមាណបេតុង និងសម្ភារៈតាមសមាមាត្រលាយ (បាវស៊ីម៉ង់ត៍ ៥០ គីឡូ ខ្សាច់ ក្រួស ទឹក) សម្រាប់កម្រាល សសរ ធ្នឹម និងគ្រឹះ ជាម៉ែត្រ ឬហ្វីត។"
    >
      <Row>
        <Field label={t("Shape", "ប្រភេទរាង")}>
          <Select value={shape} onChange={(e) => setShape(e.target.value)}>
            {SHAPES.map((s) => (
              <option key={s.id} value={s.id}>{t(s.en, s.km)}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("Unit", "ខ្នាត")}>
          <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="m">{t("Meters (m)", "ម៉ែត្រ (ម)")}</option>
            <option value="ft">{t("Feet (ft)", "ហ្វីត (ហ្វីត)")}</option>
          </Select>
        </Field>
      </Row>
      <Row>
        <Field label={t("Length", "ប្រវែង")}>
          <TextInput type="number" min="0" step="any" value={length} onChange={(e) => setLength(e.target.value)} />
        </Field>
        <Field label={t("Width", "ទទឹង")}>
          <TextInput type="number" min="0" step="any" value={width} onChange={(e) => setWidth(e.target.value)} />
        </Field>
        <Field label={t("Height / thickness", "កម្ពស់ / កម្រាស់")}>
          <TextInput type="number" min="0" step="any" value={height} onChange={(e) => setHeight(e.target.value)} />
        </Field>
        <Field label={t("Mix ratio (cement : sand : gravel)", "សមាមាត្រលាយ (ស៊ីម៉ង់ត៍ : ខ្សាច់ : ក្រួស)")}>
          <Select value={mixId} onChange={(e) => setMixId(e.target.value)}>
            {MIXES.map((m) => (
              <option key={m.id} value={m.id}>
                {t(m.en, m.km)} — {t(m.note, m.noteKm)}
              </option>
            ))}
          </Select>
        </Field>
      </Row>

      <section className="rounded-md border border-[var(--ground-line)] p-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-medium text-[var(--ink)]">{t("Estimate — nominal mix", "ការប៉ាន់ស្មាន — សមាមាត្រលាយតាមទម្លាប់")}</h2>
          <span className="text-xs text-[var(--ink-dim)]">
            {t(shapeLabel.en, shapeLabel.km)} · {t(result.mix.en, result.mix.km)}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Volume", "បរិមាណ")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{result.volume.toFixed(2)} m³</div>
            <div className="text-xs text-[var(--ink-dim)]">({result.volumeFt.toFixed(1)} ft³)</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Cement (50 kg)", "ស៊ីម៉ង់ត៍ (៥០ គីឡូ)")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--gold)]">{Math.ceil(result.bags)} {t("bags", "បាវ")}</div>
            <div className="text-xs text-[var(--ink-dim)]">≈ {result.bags.toFixed(1)} {t("bags", "បាវ")}</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Sand", "ខ្សាច់")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{result.sand.toFixed(2)} m³</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Gravel", "ក្រួស")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{result.gravel.toFixed(2)} m³</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Water", "ទឹក")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{Math.round(result.water)} {t("litres", "លីត្រ")}</div>
          </div>
        </div>
        <p className="mt-3 rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-xs leading-relaxed text-[var(--danger)]">
          {t(
            "Estimate only — nominal mix ratios are practical approximations (dry loose volume ×1.54; 1 bag of 50 kg cement ≈ 0.035 m³). Not a structural design — verify quantities with an engineer before ordering.",
            "ការប៉ាន់ស្មានតែប៉ុណ្ណោះ — សមាមាត្រលាយគឺជាតម្លៃប្រហាក់ប្រហែលជាក់ស្តែង (បរិមាណស្ងួត ×1.54; បាវស៊ីម៉ង់ត៍ ៥០ គីឡូ ≈ 0.035 ម៉ែត្រគូប)។ មិនមែនជាការរចនារចនាសម្ព័ន្ធទេ — សូមផ្ទៀងផ្ទាត់បរិមាណជាមួយវិស្វករមុនពេលបញ្ជាទិញ។"
          )}
        </p>
      </section>
    </ToolShell>
  );
}
