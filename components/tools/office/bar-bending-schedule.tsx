"use client";

import { useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { CopyButton } from "@/components/CopyButton";
import { Select, TextInput, ToolShell } from "@/components/ui/Shell";

// Theoretical bar weight: kg/m = d² ÷ 162 (steel density 7,850 kg/m³, from
// π/4 × d² × 7,850 ÷ 10⁶ ≈ d²/162), the same basis as the Rebar Weight
// Calculator. ASTM A615 / BS 4449 define the standard bar sizes; delivered
// weights vary slightly by mill. Cut length is entered by the user (it already
// includes bend allowances / hooks per the bar-shape code on the drawing).
const kgPerM = (d: number) => (d * d) / 162;
const DIAMETERS = [6, 8, 10, 12, 16, 20, 25, 32, 40];

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

interface BarRow {
  id: number;
  mark: string;
  dia: number;
  cutLengthMm: string;
  bars: string;
  members: string;
}

export default function BarBendingSchedule() {
  const { text: t } = useLanguage();
  const nextId = useRef(2);
  const [rows, setRows] = useState<BarRow[]>([
    { id: 1, mark: "01", dia: 16, cutLengthMm: "5200", bars: "6", members: "4" },
    { id: 2, mark: "02", dia: 10, cutLengthMm: "1850", bars: "24", members: "4" },
  ]);

  const update = (id: number, key: keyof BarRow, value: string | number) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const addRow = () =>
    setRows((prev) => [...prev, { id: (nextId.current += 1), mark: String(prev.length + 1).padStart(2, "0"), dia: 12, cutLengthMm: "", bars: "", members: "1" }]);
  const removeRow = (id: number) => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  const computed = useMemo(() => {
    const perRow = rows.map((r) => {
      const totalBars = toNumber(r.bars) * toNumber(r.members || "1");
      const totalLengthM = (toNumber(r.cutLengthMm) / 1000) * totalBars;
      const weight = totalLengthM * kgPerM(r.dia);
      return { id: r.id, mark: r.mark, dia: r.dia, totalBars, totalLengthM, weight };
    });
    const byDia = new Map<number, number>();
    let totalLength = 0;
    let totalWeight = 0;
    for (const row of perRow) {
      byDia.set(row.dia, (byDia.get(row.dia) ?? 0) + row.weight);
      totalLength += row.totalLengthM;
      totalWeight += row.weight;
    }
    const diaSummary = [...byDia.entries()].sort((a, b) => a[0] - b[0]).map(([dia, weight]) => ({ dia, weight }));
    return { perRow, diaSummary, totalLength, totalWeight };
  }, [rows]);

  const tsv = useMemo(() => {
    const header = ["Mark", "Dia (mm)", "Cut length (mm)", "No. bars", "Members", "Total bars", "Total length (m)", "Weight (kg)"].join("\t");
    const body = rows.map((r) => {
      const c = computed.perRow.find((p) => p.id === r.id)!;
      return [r.mark, r.dia, r.cutLengthMm || "0", r.bars || "0", r.members || "1", c.totalBars, c.totalLengthM.toFixed(2), c.weight.toFixed(2)].join("\t");
    });
    body.push(["TOTAL", "", "", "", "", "", computed.totalLength.toFixed(2), computed.totalWeight.toFixed(2)].join("\t"));
    return [header, ...body].join("\n");
  }, [rows, computed]);

  return (
    <ToolShell
      title="Bar Bending Schedule (BBS)"
      khmerTitle="តារាងកាត់ និងពត់ដែក (BBS)"
      description="Build a reinforcement bar bending schedule: enter each bar mark's diameter, cut length, and quantity to get total lengths and theoretical weights, with a per-diameter and grand-total summary."
      descriptionKm="បង្កើតតារាងកាត់ និងពត់ដែក៖ បញ្ចូលអង្កត់ផ្ចិត ប្រវែងកាត់ និងបរិមាណនៃដែកនីមួយៗ ដើម្បីទទួលបានប្រវែងសរុប និងទម្ងន់តាមទ្រឹស្តី ព្រមទាំងសេចក្តីសង្ខេបតាមអង្កត់ផ្ចិត និងសរុប។"
    >
      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-[var(--ink)]">{t("Bar marks", "លេខសម្គាល់ដែក")}</h2>
          <div className="flex items-center gap-2">
            <CopyButton text={tsv} />
            <button type="button" onClick={addRow}
              className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)]">
              + {t("Add bar", "បន្ថែមដែក")}
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {computed.perRow.map((c, i) => {
            const r = rows[i];
            return (
              <div key={r.id} className="grid grid-cols-2 gap-2 rounded-md border border-[var(--ground-line)] p-3 sm:grid-cols-12 sm:items-end">
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Mark", "លេខ")}</span>
                  <TextInput value={r.mark} onChange={(e) => update(r.id, "mark", e.target.value)} />
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Dia (mm)", "អង្កត់ (មម)")}</span>
                  <Select value={r.dia} onChange={(e) => update(r.id, "dia", Number(e.target.value))}>
                    {DIAMETERS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </label>
                <label className="sm:col-span-3">
                  <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Cut length (mm)", "ប្រវែងកាត់ (មម)")}</span>
                  <TextInput type="number" min="0" value={r.cutLengthMm} onChange={(e) => update(r.id, "cutLengthMm", e.target.value)} />
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("No. bars", "ចំនួនដែក")}</span>
                  <TextInput type="number" min="0" value={r.bars} onChange={(e) => update(r.id, "bars", e.target.value)} />
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Members", "ចំនួនធាតុ")}</span>
                  <TextInput type="number" min="1" value={r.members} onChange={(e) => update(r.id, "members", e.target.value)} />
                </label>
                <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:justify-end">
                  <span className="font-mono-ui text-xs text-[var(--gold)] sm:hidden">{c.weight.toFixed(1)} kg</span>
                  <button type="button" onClick={() => removeRow(r.id)} disabled={rows.length <= 1}
                    aria-label={t("Remove bar", "លុបដែក")}
                    className="rounded-md border border-[var(--ground-line)] px-2 py-2 text-xs text-[var(--ink-faint)] transition hover:border-[var(--danger)]/50 hover:text-[var(--danger)] disabled:opacity-40">
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Computed schedule */}
      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <h2 className="font-medium text-[var(--ink)]">{t("Schedule", "តារាង")}</h2>
        <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--ground-line)] bg-[var(--ground-raised-hi)] text-[var(--ink-dim)]">
                <th className="p-2.5 font-medium">{t("Mark", "លេខ")}</th>
                <th className="p-2.5 font-medium text-right">{t("Dia (mm)", "អង្កត់ (មម)")}</th>
                <th className="p-2.5 font-medium text-right">{t("Total bars", "ដែកសរុប")}</th>
                <th className="p-2.5 font-medium text-right">{t("Length (m)", "ប្រវែង (ម)")}</th>
                <th className="p-2.5 font-medium text-right">{t("Weight (kg)", "ទម្ងន់ (គក)")}</th>
              </tr>
            </thead>
            <tbody className="font-mono-ui text-[var(--ink)]">
              {computed.perRow.map((c) => (
                <tr key={c.id} className="border-b border-[var(--ground-line)]">
                  <td className="p-2.5">{c.mark}</td>
                  <td className="p-2.5 text-right">{c.dia}</td>
                  <td className="p-2.5 text-right">{c.totalBars}</td>
                  <td className="p-2.5 text-right">{c.totalLengthM.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-semibold text-[var(--gold)]">{c.weight.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-[var(--ground-raised-hi)] font-semibold">
                <td className="p-2.5" colSpan={3}>{t("Total", "សរុប")}</td>
                <td className="p-2.5 text-right">{computed.totalLength.toFixed(2)}</td>
                <td className="p-2.5 text-right text-[var(--gold)]">{computed.totalWeight.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Per-diameter summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {computed.diaSummary.map(({ dia, weight }) => (
          <div key={dia} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--ink-faint)]">Ø{dia} mm</div>
            <div className="mt-0.5 font-mono-ui text-sm font-semibold text-[var(--ink)]">{weight.toFixed(1)} {t("kg", "គក")}</div>
          </div>
        ))}
      </div>

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Weight = length × d²/162 kg/m (steel density 7,850 kg/m³). Enter the cut length from the bar-shape code, including bend and hook allowances. Theoretical weights differ slightly from delivered weights.",
          "ទម្ងន់ = ប្រវែង × d²/162 គក/ម (ដង់ស៊ីតេដែក 7,850 គក/ម³)។ សូមបញ្ចូលប្រវែងកាត់តាមកូដរាងដែក រួមបញ្ចូលទាំងផ្នែកពត់ និងទំពក់។ ទម្ងន់តាមទ្រឹស្តីខុសបន្តិចបន្តួចពីទម្ងន់ជាក់ស្តែង។"
        )}
      </p>
    </ToolShell>
  );
}
