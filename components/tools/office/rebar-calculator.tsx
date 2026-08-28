"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// Standard theoretical rebar weights: kg/m = d² ÷ 162, derived from steel
// density 7,850 kg/m³ (π/4 × d² × 7,850 ÷ 10⁶ ≈ d²/162). ASTM A615 / A615M
// defines the corresponding standard bar sizes, grades and tolerances; actual
// delivered weights vary slightly by mill. Table values are reference only.

const DIAMETERS = [6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32, 36, 40];
const kgPerM = (d: number) => (d * d) / 162;

function toNum(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function RebarCalculator() {
  const { text: t } = useLanguage();
  const [dia, setDia] = useToolState("rebar:dia", "12");
  const [length, setLength] = useToolState("rebar:length", "6");
  const [qty, setQty] = useToolState("rebar:qty", "10");
  const [estType, setEstType] = useToolState("rebar:est", "slab");
  const [estLength, setEstLength] = useToolState("rebar:estLength", "4");
  const [estWidth, setEstWidth] = useToolState("rebar:estWidth", "3");
  const [spacing, setSpacing] = useToolState("rebar:spacing", "20");
  const [perimeter, setPerimeter] = useToolState("rebar:perimeter", "1.2");
  const [waste, setWaste] = useToolState("rebar:waste", "5");

  const kgm = kgPerM(toNum(dia) || 12);

  const weight = useMemo(() => {
    const l = Math.max(0, toNum(length));
    const q = Math.max(0, Math.round(toNum(qty)));
    const totalLength = l * q;
    return { totalLength, weight: totalLength * kgm };
  }, [length, qty, kgm]);

  const estimate = useMemo(() => {
    const extra = Math.max(0, toNum(waste)) / 100;
    const s = Math.max(1, toNum(spacing));
    const l = Math.max(0, toNum(estLength));
    if (estType === "beam") {
      const p = Math.max(0, toNum(perimeter));
      const count = Math.floor((l * 100) / s) + 1;
      const totalLength = count * p * (1 + extra);
      return { count, totalLength, weight: totalLength * kgm };
    }
    const w = Math.max(0, toNum(estWidth));
    const countL = Math.floor((w * 100) / s) + 1; // bars running along length
    const countW = Math.floor((l * 100) / s) + 1; // bars running along width
    const count = countL + countW;
    const totalLength = (countL * l + countW * w) * (1 + extra);
    return { count, totalLength, weight: totalLength * kgm };
  }, [estType, estLength, estWidth, spacing, perimeter, waste, kgm]);

  const output = [
    `${t("Bar diameter", "អង្កត់ផ្ចិតដែក")}: ${dia} mm — ${kgm.toFixed(3)} kg/m`,
    `${t("Length × quantity", "ប្រវែង × ចំនួន")}: ${length} m × ${qty} = ${weight.totalLength.toFixed(1)} m`,
    `${t("Total weight", "ទម្ងន់សរុប")}: ${weight.weight.toFixed(1)} kg (${(weight.weight / 1000).toFixed(3)} t)`,
    "",
    `${t("Spacing estimate", "ការប៉ាន់ស្មានពីគម្លាត")}: ${estType === "slab" ? t("slab, both directions", "កម្រាល ទិសទាំងពីរ") : t("beam stirrups", "រ៉ាប់ដែកធ្នឹម")}`,
    `${t("Bars", "ចំនួនដែក")}: ${estimate.count}`,
    `${t("Total length incl. laps/waste", "ប្រវែងសរុបរាប់បញ្ចូលការត/ខូច")}: ${estimate.totalLength.toFixed(1)} m`,
    `${t("Total weight", "ទម្ងន់សរុប")}: ${estimate.weight.toFixed(1)} kg (${(estimate.weight / 1000).toFixed(3)} t)`,
  ].join("\n");

  return (
    <ToolShell
      title="Rebar Weight Calculator"
      khmerTitle="គណនាទម្ងន់ដែក"
      description="Theoretical rebar weight from diameter (6–40 mm), length and quantity, plus a simple slab / beam bar-quantity estimate from spacing."
      descriptionKm="ទម្ងន់ដែកតាមទ្រឹស្តីពីអង្កត់ផ្ចិត (៦–៤០ មម) ប្រវែង និងចំនួន ព្រមទាំងការប៉ាន់ស្មានចំនួនដែកសម្រាប់កម្រាល / ធ្នឹម ពីគម្លាតដាក់។"
    >
      <Row>
        <Field label={t("Bar diameter", "អង្កត់ផ្ចិតដែក")}>
          <Select value={dia} onChange={(e) => setDia(e.target.value)}>
            {DIAMETERS.map((d) => (
              <option key={d} value={d}>
                {d} mm — {kgPerM(d).toFixed(3)} kg/m
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("Bar length (m)", "ប្រវែងដែក (ម)")}>
          <TextInput type="number" min="0" step="any" value={length} onChange={(e) => setLength(e.target.value)} />
        </Field>
        <Field label={t("Quantity (bars)", "ចំនួន (ដើម)")}>
          <TextInput type="number" min="0" step="1" value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Weight", "ទម្ងន់")}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--gold)]">{weight.weight.toFixed(1)} kg</div>
          <div className="text-xs text-[var(--ink-dim)]">{weight.totalLength.toFixed(1)} m · {kgm.toFixed(3)} kg/m</div>
        </div>
      </Row>

      <section className="rounded-md border border-[var(--ground-line)] p-4">
        <h2 className="font-medium text-[var(--ink)]">{t("Standard reference values (theoretical weight)", "តម្លៃស្ដង់ដារយោង (ទម្ងន់តាមទ្រឹស្តី)")}</h2>
        <p className="mt-1 text-xs leading-relaxed text-[var(--ink-dim)]">
          {t(
            "kg/m = d² ÷ 162 (steel density 7,850 kg/m³). ASTM A615 / A615M defines the standard bar sizes and grades; actual delivered weights vary slightly by mill.",
            "គីឡូ/ម = d² ÷ 162 (ដង់ស៊ីតេដែក 7,850 គីឡូក្រាម/ម³)។ ASTM A615 / A615M កំណត់ទំហំ និងថ្នាក់ដែកស្ដង់ដារ; ទម្ងន់ជាក់ស្តែងប្រែប្រួលបន្តិចបន្តួចតាមរោងចក្រ។"
          )}
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--ground-line)] text-left font-semibold uppercase tracking-wide text-[var(--ink-dim)]">
                <th className="py-2 pr-2">{t("Diameter (mm)", "អង្កត់ផ្ចិត (មម)")}</th>
                <th className="py-2 pr-2">{t("Weight (kg/m)", "ទម្ងន់ (គីឡូ/ម)")}</th>
                <th className="py-2">{t("Weight (kg/12 m bar)", "ទម្ងន់ (គីឡូ/ដើម ១២ ម)")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ground-line)]">
              {DIAMETERS.map((d) => (
                <tr key={d}>
                  <td className="py-1.5 pr-2 font-semibold text-[var(--ink)]">{d} mm</td>
                  <td className="py-1.5 pr-2 text-[var(--ink-dim)]">{kgPerM(d).toFixed(3)}</td>
                  <td className="py-1.5 text-[var(--ink-dim)]">{(kgPerM(d) * 12).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-md border border-[var(--ground-line)] p-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-medium text-[var(--ink)]">{t("Quantity estimate from spacing", "ការប៉ាន់ស្មានចំនួនពីគម្លាតដាក់")}</h2>
          <span className="text-xs text-[var(--ink-dim)]">{t("simple estimate", "ការប៉ាន់ស្មានសាមញ្ញ")}</span>
        </div>
        <Row>
          <Field label={t("Element", "ធាតុ")}>
            <Select value={estType} onChange={(e) => setEstType(e.target.value)}>
              <option value="slab">{t("Slab (two directions)", "កម្រាល (ទិសពីរ)")}</option>
              <option value="beam">{t("Beam (stirrups)", "ធ្នឹម (រ៉ាប់ដែក)")}</option>
            </Select>
          </Field>
          <Field label={t("Slab / beam length (m)", "ប្រវែងកម្រាល / ធ្នឹម (ម)")}>
            <TextInput type="number" min="0" step="any" value={estLength} onChange={(e) => setEstLength(e.target.value)} />
          </Field>
          {estType === "slab" ? (
            <Field label={t("Slab width (m)", "ទទឹងកម្រាល (ម)")}>
              <TextInput type="number" min="0" step="any" value={estWidth} onChange={(e) => setEstWidth(e.target.value)} />
            </Field>
          ) : (
            <Field label={t("Stirrup perimeter (m)", "បរិវេណរ៉ាប់ដែក (ម)")}>
              <TextInput type="number" min="0" step="any" value={perimeter} onChange={(e) => setPerimeter(e.target.value)} />
            </Field>
          )}
          <Field label={estType === "slab" ? t("Bar spacing (cm)", "គម្លាតដាក់ដែក (ស.ម)") : t("Stirrup spacing (cm)", "គម្លាតរ៉ាប់ដែក (ស.ម)")}>
            <TextInput type="number" min="1" step="any" value={spacing} onChange={(e) => setSpacing(e.target.value)} />
          </Field>
          <Field label={t("Extra for laps / waste (%)", "បន្ថែមសម្រាប់ការត / ខូច (%)")}>
            <TextInput type="number" min="0" step="any" value={waste} onChange={(e) => setWaste(e.target.value)} />
          </Field>
        </Row>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Bars", "ចំនួនដែក")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{estimate.count}</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Total length", "ប្រវែងសរុប")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{estimate.totalLength.toFixed(1)} m</div>
          </div>
          <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--gold)]">{t("Total weight", "ទម្ងន់សរុប")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--gold)]">{estimate.weight.toFixed(1)} kg</div>
            <div className="text-xs text-[var(--gold)]">{(estimate.weight / 1000).toFixed(3)} t</div>
          </div>
        </div>
      </section>

      <Output label={t("Rebar summary", "សេចក្តីសង្ខេបដែក")} value={output} mono={false} />
    </ToolShell>
  );
}
