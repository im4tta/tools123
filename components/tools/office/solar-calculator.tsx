"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// Rule-of-thumb solar sizing. Every assumption is editable; all results are
// estimates for planning only — verify with a solar installer.

const VOLTAGES = [12, 24, 48];

function toNum(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function SolarCalculator() {
  const { text: t } = useLanguage();
  const [dailyKwh, setDailyKwh] = useToolState("solar:daily", "10");
  const [sunHours, setSunHours] = useToolState("solar:sun", "4.5");
  const [efficiency, setEfficiency] = useToolState("solar:eff", "80");
  const [panelW, setPanelW] = useToolState("solar:panel", "550");
  const [autonomy, setAutonomy] = useToolState("solar:autonomy", "1");
  const [dod, setDod] = useToolState("solar:dod", "50");
  const [voltage, setVoltage] = useToolState("solar:voltage", "48");
  const [invFactor, setInvFactor] = useToolState("solar:inv", "1.25");

  const result = useMemo(() => {
    const daily = Math.max(0, toNum(dailyKwh));
    const sun = Math.max(0.1, toNum(sunHours));
    const eff = Math.max(1, toNum(efficiency)) / 100;
    const pw = Math.max(1, toNum(panelW));
    const aut = Math.max(0, toNum(autonomy));
    const dodPct = Math.min(100, Math.max(1, toNum(dod))) / 100;
    const volt = Math.max(1, toNum(voltage));
    const inv = Math.max(1, toNum(invFactor));

    const requiredKw = daily / (sun * eff);
    const panels = Math.ceil((requiredKw * 1000) / pw);
    const actualKw = (panels * pw) / 1000;
    const batteryAh = (daily * 1000 * aut) / (volt * dodPct);
    const inverterW = requiredKw * 1000 * inv;
    return { requiredKw, panels, actualKw, batteryAh, inverterW, sun, eff, aut, dodPct, volt, inv };
  }, [dailyKwh, sunHours, efficiency, panelW, autonomy, dod, voltage, invFactor]);

  return (
    <ToolShell
      title="Solar Panel Sizing"
      khmerTitle="គណនាប្រព័ន្ធពន្លឺព្រះអាទិត្យ"
      description="Estimate the solar array, battery bank and inverter size for a daily energy target — every assumption (sun hours, efficiency, DoD, voltage) is editable."
      descriptionKm="ប៉ាន់ស្មានទំហំបន្ទះសូឡា ថ្ម និងអាំងវឺរទ័រសម្រាប់គោលដៅថាមពលប្រចាំថ្ងៃ — រាល់ការសន្មត់ (ម៉ោងពន្លឺ ប្រសិទ្ធភាព DoD តង់ស្យុង) អាចកែប្រែបាន។"
    >
      <Row>
        <Field label={t("Daily energy use (kWh)", "ការប្រើប្រាស់ថាមពលប្រចាំថ្ងៃ (kWh)")}>
          <TextInput type="number" min="0" step="any" value={dailyKwh} onChange={(e) => setDailyKwh(e.target.value)} />
        </Field>
        <Field label={t("Peak sun hours", "ម៉ោងពន្លឺព្រះអាទិត្យកំពូល")}>
          <TextInput type="number" min="0.1" step="any" value={sunHours} onChange={(e) => setSunHours(e.target.value)} />
        </Field>
        <Field label={t("System efficiency (%)", "ប្រសិទ្ធភាពប្រព័ន្ធ (%)")}>
          <TextInput type="number" min="1" max="100" step="any" value={efficiency} onChange={(e) => setEfficiency(e.target.value)} />
        </Field>
        <Field label={t("Panel wattage (W)", "ថាមពលបន្ទះ (W)")}>
          <TextInput type="number" min="1" step="any" value={panelW} onChange={(e) => setPanelW(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label={t("Days of autonomy", "ថ្ងៃស្វ័យភាព (គ្មានពន្លឺ)")}>
          <TextInput type="number" min="0" step="any" value={autonomy} onChange={(e) => setAutonomy(e.target.value)} />
        </Field>
        <Field label={t("Depth of discharge (%)", "កម្រិតបញ្ចេញថ្ម (%)")}>
          <TextInput type="number" min="1" max="100" step="any" value={dod} onChange={(e) => setDod(e.target.value)} />
        </Field>
        <Field label={t("System voltage (V)", "តង់ស្យុងប្រព័ន្ធ (V)")}>
          <Select value={voltage} onChange={(e) => setVoltage(e.target.value)}>
            {VOLTAGES.map((v) => (
              <option key={v} value={v}>{v} V</option>
            ))}
          </Select>
        </Field>
        <Field label={t("Inverter safety factor", "កត្តាសុវត្ថិភាពអាំងវឺរទ័រ")}>
          <TextInput type="number" min="1" step="any" value={invFactor} onChange={(e) => setInvFactor(e.target.value)} />
        </Field>
      </Row>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Required array", "ទំហំបន្ទះដែលត្រូវការ")}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--gold)]">{result.requiredKw.toFixed(2)} kW</div>
          <div className="text-xs text-[var(--ink-dim)]">{result.sun} h × {Math.round(result.eff * 100)}%</div>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Panels needed", "ចំនួនបន្ទះដែលត្រូវការ")}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{result.panels}</div>
          <div className="text-xs text-[var(--ink-dim)]">{result.actualKw.toFixed(2)} kW {t("installed", "ដំឡើង")}</div>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Battery bank", "សមត្ថភាពថ្ម")}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{Math.ceil(result.batteryAh)} Ah</div>
          <div className="text-xs text-[var(--ink-dim)]">{result.volt} V · {Math.round(result.dodPct * 100)}% DoD · {result.aut} {t("day(s)", "ថ្ងៃ")}</div>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Inverter size", "ទំហំអាំងវឺរទ័រ")}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{Math.ceil(result.inverterW)} W</div>
          <div className="text-xs text-[var(--ink-dim)]">× {result.inv}</div>
        </div>
      </div>

      <p className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-xs leading-relaxed text-[var(--danger)]">
        {t(
          "Estimate only — peak sun hours vary by location and season; battery sizing ignores C-rate and temperature derating. Confirm the design with a qualified solar installer before purchase.",
          "ការប៉ាន់ស្មានតែប៉ុណ្ណោះ — ម៉ោងពន្លឺព្រះអាទិត្យកំពូលប្រែប្រួលតាមទីតាំង និងរដូវ; ការគណនាថ្មមិនរាប់បញ្ចូលអត្រា C និងការថយចុះដោយសីតុណ្ហភាពទេ។ សូមបញ្ជាក់ការរចនាជាមួយអ្នកដំឡើងសូឡាដែលមានសមត្ថភាពមុនពេលទិញ។"
        )}
      </p>
    </ToolShell>
  );
}
