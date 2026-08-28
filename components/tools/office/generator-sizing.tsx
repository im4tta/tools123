"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Button, Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// Generator sizing estimate. Motor loads are assumed to draw ~3× their running
// watts on start-up (surge), resistive loads ~1×. Recommendation covers the
// total running load plus the largest single surge; if several motors start at
// the same time, use the conservative "total starting load" figure.

type LoadType = "motor" | "resistive";
type ApplianceRow = { id: number; name: string; watts: string; type: LoadType };

const SURGE: Record<LoadType, number> = { motor: 3, resistive: 1 };

// Sample rows are editable placeholders, not a fixed spec.
const DEFAULT_ROWS: ApplianceRow[] = [
  { id: 1, name: "អំពូល LED", watts: "100", type: "resistive" },
  { id: 2, name: "ទូរទឹកកក", watts: "200", type: "motor" },
  { id: 3, name: "ម៉ាស៊ីនត្រជាក់ 1.5 HP", watts: "1200", type: "motor" },
  { id: 4, name: "ម៉ាស៊ីនបូមទឹក", watts: "750", type: "motor" },
  { id: 5, name: "ទូរទស្សន៍ / កង្ហារ", watts: "200", type: "resistive" },
];

function toNum(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function GeneratorSizing() {
  const { text: t } = useLanguage();
  const [rows, setRows] = useToolState<ApplianceRow[]>("generator:rows", DEFAULT_ROWS);
  const [pf, setPf] = useToolState("generator:pf", "0.8");

  const calc = useMemo(() => {
    const items = rows.map((r) => {
      const watts = Math.max(0, toNum(r.watts));
      return { ...r, watts, surge: watts * SURGE[r.type] };
    });
    const runningTotal = items.reduce((s, i) => s + i.watts, 0);
    const startingTotal = items.reduce((s, i) => s + i.surge, 0);
    const largestRunning = items.reduce((m, i) => Math.max(m, i.watts), 0);
    const largestSurge = items.reduce((m, i) => Math.max(m, i.surge), 0);
    const peak = Math.max(runningTotal, runningTotal - largestRunning + largestSurge);
    const powerFactor = Math.max(0.1, toNum(pf));
    return { runningTotal, startingTotal, peak, kw: peak / 1000, kva: peak / 1000 / powerFactor, pf: powerFactor };
  }, [rows, pf]);

  function addRow() {
    setRows((prev) => [...prev, { id: Date.now(), name: "", watts: "500", type: "motor" }]);
  }

  function updateRow(id: number, patch: Partial<Omit<ApplianceRow, "id">>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const output = [
    `${t("Total running load", "បន្ទុកប្រតិបត្តិការសរុប")}: ${calc.runningTotal.toLocaleString("en-US")} W (${calc.runningTotal / 1000} kW)`,
    `${t("Total starting load (all at once, conservative)", "បន្ទុកចាប់ផ្តើមសរុប (ទាំងអស់ក្នុងពេលតែមួយ, អភិរក្សនិយម)")}: ${calc.startingTotal.toLocaleString("en-US")} W`,
    `${t("Peak demand (running + largest surge)", "តម្រូវការកំពូល (ប្រតិបត្តិការ + ការកើនធំបំផុត)")}: ${calc.peak.toLocaleString("en-US")} W`,
    "",
    `${t("Recommended generator", "ម៉ាស៊ីនភ្លើងដែលណែនាំ")}: ${calc.kw.toFixed(1)} kW / ${calc.kva.toFixed(1)} kVA (PF ${calc.pf})`,
    "",
    t("Estimate only — confirm with a qualified electrician.", "ការប៉ាន់ស្មានតែប៉ុណ្ណោះ — សូមបញ្ជាក់ជាមួយជាងអគ្គិសនីដែលមានសមត្ថភាព។"),
  ].join("\n");

  return (
    <ToolShell
      title="Generator Sizing"
      khmerTitle="គណនាទំហំម៉ាស៊ីនភ្លើង"
      description="List appliances with their running watts and load type (motor surge ×3, resistive ×1) to get total running and starting loads and a recommended generator size in kW / kVA."
      descriptionKm="រាយបញ្ជីឧបករណ៍ជាមួយថាមពលប្រតិបត្តិការ និងប្រភេទបន្ទុក (ម៉ូតូកើន ×៣, ធន់ ×១) ដើម្បីទទួលបន្ទុកសរុប និងទំហំម៉ាស៊ីនភ្លើងដែលណែនាំជា kW / kVA។"
    >
      <Row>
        <Field label={t("Power factor (PF)", "កត្តាថាមពល (PF)")}>
          <TextInput type="number" min="0.1" max="1" step="0.05" value={pf} onChange={(e) => setPf(e.target.value)} />
        </Field>
        <div className="flex items-end">
          <Button type="button" onClick={addRow}>{t("Add appliance", "បន្ថែមឧបករណ៍")}</Button>
        </div>
      </Row>

      <section className="rounded-md border border-[var(--ground-line)] p-4">
        <h2 className="mb-3 font-medium text-[var(--ink)]">{t("Appliances", "បញ្ជីឧបករណ៍")}</h2>
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_8rem_9rem_auto]">
              <TextInput
                value={row.name}
                onChange={(e) => updateRow(row.id, { name: e.target.value })}
                placeholder={t("Appliance name", "ឈ្មោះឧបករណ៍")}
                aria-label={t("Appliance name", "ឈ្មោះឧបករណ៍")}
              />
              <TextInput
                type="number"
                min="0"
                step="any"
                value={row.watts}
                onChange={(e) => updateRow(row.id, { watts: e.target.value })}
                placeholder={t("Watts", "វ៉ាត់")}
                aria-label={t("Running watts", "ថាមពលប្រតិបត្តិការ (W)")}
              />
              <Select value={row.type} onChange={(e) => updateRow(row.id, { type: e.target.value as LoadType })} aria-label={t("Load type", "ប្រភេទបន្ទុក")}>
                <option value="motor">{t("Motor (×3)", "ម៉ូតូ (×៣)")}</option>
                <option value="resistive">{t("Resistive (×1)", "ធន់ (×១)")}</option>
              </Select>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--danger)] hover:text-[var(--danger)]"
              >
                {t("Remove", "លុប")}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--ink-dim)]">
          {t("Sample rows are editable placeholders — replace them with your own appliances and watts.", "ជួរគំរូគឺជាតម្លៃសាកល្បងអាចកែប្រែបាន — សូមជំនួសដោយឧបករណ៍ និងថាមពលផ្ទាល់ខ្លួនរបស់អ្នក។")}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Total running", "បន្ទុកប្រតិបត្តិការសរុប")}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{calc.runningTotal.toLocaleString("en-US")} W</div>
          <div className="text-xs text-[var(--ink-dim)]">{(calc.runningTotal / 1000).toFixed(2)} kW</div>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Total starting", "បន្ទុកចាប់ផ្តើមសរុប")}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{calc.startingTotal.toLocaleString("en-US")} W</div>
          <div className="text-xs text-[var(--ink-dim)]">{t("all at once", "ទាំងអស់ក្នុងពេលតែមួយ")}</div>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Peak demand", "តម្រូវការកំពូល")}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{calc.peak.toLocaleString("en-US")} W</div>
          <div className="text-xs text-[var(--ink-dim)]">{t("running + largest surge", "ប្រតិបត្តិការ + ការកើនធំបំផុត")}</div>
        </div>
        <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--gold)]">{t("Recommended generator", "ម៉ាស៊ីនភ្លើងដែលណែនាំ")}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--gold)]">{calc.kw.toFixed(1)} kW</div>
          <div className="text-xs text-[var(--gold)]">{calc.kva.toFixed(1)} kVA @ PF {calc.pf}</div>
        </div>
      </div>

      <Output label={t("Generator sizing summary", "សេចក្តីសង្ខេបទំហំម៉ាស៊ីនភ្លើង")} value={output} mono={false} />
    </ToolShell>
  );
}
