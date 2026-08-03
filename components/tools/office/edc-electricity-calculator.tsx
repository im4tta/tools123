"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Calculator,
  CircleCheck,
  Copy,
  Fan,
  Home,
  Lightbulb,
  ListChecks,
  Plug,
  Plus,
  Refrigerator,
  RotateCcw,
  ShowerHead,
  Snowflake,
  Table2,
  Thermometer,
  Trash2,
  Tv,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

interface Preset {
  en: string;
  km: string;
  power: number;
  hours: number;
  days: number;
  qty: number;
  icon: LucideIcon;
}

const PRESETS: Preset[] = [
  { en: "LED Light Bulb 50W", km: "អំពូល LED 50W", power: 50, hours: 6, days: 30, qty: 1, icon: Lightbulb },
  { en: "Air Conditioner 1.5HP", km: "ម៉ាស៊ីនត្រជាក់ 1.5 HP", power: 1200, hours: 8, days: 30, qty: 1, icon: Snowflake },
  { en: "Refrigerator 2-Door", km: "ទូរទឹកកក 2 ទ្វារ", power: 150, hours: 24, days: 30, qty: 1, icon: Refrigerator },
  { en: "Smart TV 43-inch", km: "ទូរទស្សន៍ Smart TV 43\"", power: 100, hours: 5, days: 30, qty: 1, icon: Tv },
  { en: "Standing Fan", km: "កង្ហារឈរ", power: 65, hours: 10, days: 30, qty: 1, icon: Fan },
  { en: "Water Heater", km: "ម៉ាស៊ីនទឹកក្ដៅ", power: 3500, hours: 0.5, days: 30, qty: 1, icon: ShowerHead },
];

interface Tier {
  en: string;
  km: string;
  rate: number;
  usd: string;
  active?: boolean;
}

const TIERS: Tier[] = [
  { en: "Tier 1: 0 – 10 kWh / month", km: "កម្រិត ១: ០ – ១០ kWh / ខែ", rate: 380, usd: "$0.092 / kWh" },
  { en: "Tier 2: 11 – 50 kWh / month", km: "កម្រិត ២: ១១ – ៥០ kWh / ខែ", rate: 480, usd: "$0.117 / kWh" },
  { en: "Tier 3: 51 – 200 kWh / month", km: "កម្រិត ៣: ៥១ – ២០០ kWh / ខែ", rate: 610, usd: "$0.148 / kWh" },
  { en: "Tier 4: > 200 kWh / month", km: "កម្រិត ៤: លើសពី ២០០ kWh / ខែ", rate: 730, usd: "$0.178 / kWh", active: true },
  { en: "Rental room / sub-metered", km: "ផ្ទះជួល / បន្ទប់ជួល", rate: 800, usd: "$0.190 – $0.244" },
];

const RATE_PRESETS = [
  { rate: 630, labelEn: "630 ៛ (low rate)", labelKm: "630 ៛ (អត្រាទាប)" },
  { rate: 710, labelEn: "710 ៛ (average rate)", labelKm: "710 ៛ (អត្រាមធ្យម)" },
  { rate: 730, labelEn: "730 ៛ (EDC standard)", labelKm: "730 ៛ (ស្តង់ដារ EDC)" },
  { rate: 780, labelEn: "780 ៛ (rental room)", labelKm: "780 ៛ (ផ្ទះជួល/បន្ទប់)" },
];

const SEGMENT_COLORS = ["#0f4c81", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#64748b"];

const TIPS = [
  { icon: Thermometer, titleEn: "Air Conditioner Optimization", titleKm: "ការប្រើប្រាស់ម៉ាស៊ីនត្រជាក់", bodyEn: "Set AC at 25°C or 26°C with a ceiling fan. Every 1°C lower increases power consumption by ~6–10%.", bodyKm: "កំណត់សីតុណ្ហភាព ២៥°C ឬ ២៦°C ហើយប្រើប្រាស់កង្ហាររួមគ្នា។ ការបន្ថយសីតុណ្ហភាព ១°C បង្កើនការស៊ីភ្លើងពី ៦% ទៅ ១០%។" },
  { icon: Lightbulb, titleEn: "LED Lighting Efficiency", titleKm: "ប្តូរមកប្រើអំពូល LED", bodyEn: "Replacing older incandescent 60W bulbs with 9W–12W LED lights cuts lighting electricity costs by over 80%.", bodyKm: "ការជំនួសអំពូលចាស់ៗ (៦០W) មកប្រើអំពូល LED (៩W – ១២W) អាចជួយកាត់បន្ថយថ្លៃភ្លើងផ្នែកបំភ្លឺបានលើសពី ៨០%។" },
  { icon: Plug, titleEn: "Avoid Standby Power", titleKm: "ដកដុំសាកនិងឧបករណ៍ចោល", bodyEn: "Unplug chargers, water heaters, and TVs when not in use. Standby power can add 5% to 10% to your monthly bill.", bodyKm: "ដកព្រែកសាកទូរស័ព្ទ ម៉ាស៊ីនទឹកក្ដៅ និងទូរទស្សន៍ពេលមិនប្រើ។ ថាមពល Standby អាចបន្ថែមថ្លៃភ្លើងពី ៥% ទៅ ១០% លើវិក្កយបត្រ។" },
];

interface ComparisonItem {
  id: number;
  name: string;
  powerW: number;
  qty: number;
  totalW: number;
  hours: number;
  days: number;
  monthlyKwh: number;
  rateKhr: number;
  monthlyCostKhr: number;
}

function toNumber(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatKhr(amount: number) {
  return `${Math.round(amount).toLocaleString("en-US")} ៛`;
}

function DonutChart({ items }: { items: { label: string; value: number }[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  let accumulated = 0;
  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 100 100" className="h-44 w-44 shrink-0">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--ground-line)" strokeWidth="14" />
        {total > 0 &&
          items.map((item, i) => {
            const dash = (item.value / total) * circ;
            const offset = accumulated;
            accumulated += dash;
            return (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                strokeWidth="14"
                strokeDasharray={`${Math.max(dash - 2, 0)} ${circ}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 50 50)"
              />
            );
          })}
        <text x="50" y="47" textAnchor="middle" className="fill-[var(--ink)] text-[10px] font-bold">
          {Math.round(total).toLocaleString("en-US")}
        </text>
        <text x="50" y="58" textAnchor="middle" className="fill-[var(--ink-dim)] text-[6px]">
          kWh
        </text>
      </svg>
      {items.length > 0 && (
        <ul className="w-full space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }} />
                <span className="truncate text-[var(--ink-dim)]">{item.label}</span>
              </span>
              <span className="shrink-0 font-semibold text-[var(--ink)]">{formatKhr(item.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function EdcElectricityCalculator() {
  const { text } = useLanguage();

  const [applianceName, setApplianceName] = useToolState("edc-calculator:name", "អំពូលភ្លើង LED 50W");
  const [powerValue, setPowerValue] = useToolState("edc-calculator:power", "50");
  const [quantity, setQuantity] = useToolState("edc-calculator:qty", "1");
  const [hoursPerDay, setHoursPerDay] = useToolState("edc-calculator:hours", "6");
  const [daysPerMonth, setDaysPerMonth] = useToolState("edc-calculator:days", "30");
  const [edcRate, setEdcRate] = useToolState("edc-calculator:rate", "730");
  const [exchangeRate, setExchangeRate] = useToolState("edc-calculator:exchange", "4100");

  const [comparison, setComparison] = useState<ComparisonItem[]>([]);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const powerW = toNumber(powerValue);
    const qty = Math.max(1, Math.round(toNumber(quantity)) || 1);
    const hours = toNumber(hoursPerDay);
    const days = toNumber(daysPerMonth);
    const rateKhr = toNumber(edcRate);
    const exchange = toNumber(exchangeRate) || 1;

    const totalPowerWatts = powerW * qty;
    const powerKw = totalPowerWatts / 1000;
    const dailyKwh = powerKw * hours;
    const monthlyKwh = dailyKwh * days;
    const monthlyCostKhr = monthlyKwh * rateKhr;
    const monthlyCostUsd = monthlyCostKhr / exchange;
    const yearlyCostUsd = monthlyCostUsd * 12;
    const yearlyCostKhr = monthlyCostKhr * 12;

    return {
      name: applianceName.trim() || "—",
      powerW,
      qty,
      totalPowerWatts,
      powerKw,
      hours,
      days,
      dailyKwh,
      monthlyKwh,
      rateKhr,
      monthlyCostKhr,
      monthlyCostUsd,
      yearlyCostUsd,
      yearlyCostKhr,
      exchange,
    };
  }, [applianceName, powerValue, quantity, hoursPerDay, daysPerMonth, edcRate, exchangeRate]);

  const totals = useMemo(() => {
    const kwh = comparison.reduce((sum, item) => sum + item.monthlyKwh, 0);
    const cost = comparison.reduce((sum, item) => sum + item.monthlyCostKhr, 0);
    return { kwh, cost, usd: cost / (toNumber(exchangeRate) || 1) };
  }, [comparison, exchangeRate]);

  function loadPreset(preset: Preset) {
    setApplianceName(preset.km);
    setPowerValue(String(preset.power));
    setQuantity(String(preset.qty));
    setHoursPerDay(String(preset.hours));
    setDaysPerMonth(String(preset.days));
  }

  function resetExample() {
    setApplianceName("អំពូលភ្លើង LED 50W");
    setPowerValue("50");
    setQuantity("1");
    setHoursPerDay("6");
    setDaysPerMonth("30");
    setEdcRate("730");
  }

  function addToComparison() {
    const item: ComparisonItem = {
      id: Date.now(),
      name: result.name,
      powerW: result.powerW,
      qty: result.qty,
      totalW: result.totalPowerWatts,
      hours: result.hours,
      days: result.days,
      monthlyKwh: result.monthlyKwh,
      rateKhr: result.rateKhr,
      monthlyCostKhr: result.monthlyCostKhr,
    };
    setComparison((prev) => [...prev, item]);
  }

  function removeFromComparison(id: number) {
    setComparison((prev) => prev.filter((item) => item.id !== id));
  }

  function loadSampleHousehold() {
    const rate = toNumber(edcRate);
    const sample: ComparisonItem[] = [
      { id: 1, name: text("Air Conditioner (1.5 HP)", "ម៉ាស៊ីនត្រជាក់ (1.5 HP)"), powerW: 1200, qty: 1, totalW: 1200, hours: 8, days: 30, monthlyKwh: 288, rateKhr: rate, monthlyCostKhr: 288 * rate },
      { id: 2, name: text("Refrigerator (Inverter)", "ទូរទឹកកក Inverter"), powerW: 150, qty: 1, totalW: 150, hours: 24, days: 30, monthlyKwh: 108, rateKhr: rate, monthlyCostKhr: 108 * rate },
      { id: 3, name: text("LED Bulbs (6x)", "អំពូល LED (បន្ទប់)"), powerW: 12, qty: 6, totalW: 72, hours: 6, days: 30, monthlyKwh: 12.96, rateKhr: rate, monthlyCostKhr: 12.96 * rate },
      { id: 4, name: text("Smart TV 50-inch", "ទូរទស្សន៍ Smart TV 50\""), powerW: 110, qty: 1, totalW: 110, hours: 4, days: 30, monthlyKwh: 13.2, rateKhr: rate, monthlyCostKhr: 13.2 * rate },
      { id: 5, name: text("Washing Machine", "ម៉ាស៊ីនបោកខោអាវ"), powerW: 500, qty: 1, totalW: 500, hours: 1, days: 30, monthlyKwh: 15, rateKhr: rate, monthlyCostKhr: 15 * rate },
    ];
    setComparison(sample);
  }

  async function copyCalculation() {
    const r = result;
    const textToCopy = `=== Cambodia EDC Electricity Calculation ===
${text("Appliance", "ឧបករណ៍អគ្គិសនី")}: ${r.name}
${text("Power Rating", "កម្លាំងអគ្គិសនី")}: ${r.totalPowerWatts} W
${text("Daily Usage", "រយៈពេលប្រើ/ថ្ងៃ")}: ${r.hours} ${text("hours/day", "ម៉ោង/ថ្ងៃ")} (${r.days} ${text("days/month", "ថ្ងៃ/ខែ")})
${text("EDC Tariff Rate", "អត្រាអគ្គិសនី EDC")}: ${r.rateKhr} KHR / kWh

${text("CALCULATION SUMMARY", "សេចក្តីសង្ខេបការគណនា")}:
1. ${text("Daily Consumption", "ការប្រើប្រាស់ប្រចាំថ្ងៃ")} = ${r.dailyKwh.toFixed(3)} kWh/day
2. ${text("Monthly Consumption", "ការប្រើប្រាស់ប្រចាំខែ")} = ${r.monthlyKwh.toFixed(2)} kWh/month
3. ${text("Monthly Cost", "ចំណាយប្រចាំខែ")} = ${formatKhr(r.monthlyCostKhr)} ($${r.monthlyCostUsd.toFixed(2)})`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <ToolShell
      title="EDC Electricity Calculator"
      khmerTitle="គណនាថ្លៃអគ្គិសនី EDC កម្ពុជា"
      description="Estimate monthly electricity consumption and cost for Cambodian households using Electricité du Cambodge (EDC) tiered tariffs, with a multi-appliance bill estimator and usage chart."
      descriptionKm="ប៉ាន់ស្មានការប្រើប្រាស់ និងថ្លៃអគ្គិសនីប្រចាំខែសម្រាប់គ្រួសារកម្ពុជា ដោយផ្អែកលើតារាងអត្រា EDC ព្រមទាំងប្រព័ន្ធប៉ាន់ប្រមាណវិក្កយបត្រច្រើនឧបករណ៍ និងដ្យាក្រាមបង្ហាញការប្រើប្រាស់។"
    >
      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="flex items-center gap-2 font-medium text-[var(--ink)]">
            <Zap size={16} className="text-[var(--gold)]" />
            {text("Quick Appliance Presets", "ជ្រើសរើសឧបករណ៍ប្រើប្រាស់រហ័ស")}
          </h2>
          <span className="text-xs text-[var(--ink-faint)]">{text("Click to auto-fill the form", "ចុចដើម្បីបំពេញទិន្នន័យស្វ័យប្រវត្តិ")}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
          {PRESETS.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => loadPreset(preset)}
                className="flex flex-col items-center gap-1 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2 py-3 text-center transition hover:border-[var(--gold-dim)] hover:bg-[var(--ground-raised-hi)]"
              >
                <Icon size={20} className="text-[var(--gold)]" />
                <span className="w-full truncate text-xs font-semibold text-[var(--ink)]">{text(preset.en, preset.km)}</span>
                <span className="text-[11px] text-[var(--ink-faint)]">
                  {preset.power}W · {preset.hours}h/d
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-5">
          <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-medium text-[var(--ink)]">
                <Calculator size={16} className="text-[var(--gold)]" />
                {text("Calculation Parameters", "ប៉ារ៉ាម៉ែត្រគណនា")}
              </h2>
              <button
                type="button"
                onClick={resetExample}
                className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2.5 py-1 text-xs font-medium text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
              >
                <RotateCcw size={12} />
                {text("Reset example (LED 50W)", "គំរូដើម (LED 50W)")}
              </button>
            </div>

            <Field label="Appliance name" labelKm="ឈ្មោះឧបករណ៍អគ្គិសនី">
              <TextInput value={applianceName} onChange={(e) => setApplianceName(e.target.value)} placeholder={text("e.g. LED Light 50W", "ឧ. អំពូល LED 50W")} />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field label="Power rating (Watts)" labelKm="កម្លាំងអគ្គិសនី (Watts)">
                  <TextInput type="number" min="0.1" step="any" value={powerValue} onChange={(e) => setPowerValue(e.target.value)} />
                </Field>
              </div>
              <Field label="Quantity (pcs)" labelKm="ចំនួន (គ្រឿង)">
                <TextInput type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Hours used / day" labelKm="រយៈពេលប្រើ/ថ្ងៃ" hint={text("hours", "ម៉ោង")}>
                <TextInput type="number" min="0" max="24" step="any" value={hoursPerDay} onChange={(e) => setHoursPerDay(e.target.value)} />
              </Field>
              <Field label="Days / month" labelKm="ចំនួនថ្ងៃ/ខែ" hint={text("days", "ថ្ងៃ")}>
                <TextInput type="number" min="1" max="31" step="1" value={daysPerMonth} onChange={(e) => setDaysPerMonth(e.target.value)} />
              </Field>
            </div>

            <Field
              label="EDC rate (KHR / kWh)"
              labelKm="ថ្លៃអគ្គិសនី EDC (រៀល/kWh)"
              hint={`${formatKhr(toNumber(edcRate))} / kWh`}
            >
              <div className="mb-2 grid grid-cols-4 gap-1.5">
                {RATE_PRESETS.map((rp) => {
                  const active = toNumber(edcRate) === rp.rate;
                  return (
                    <button
                      key={rp.rate}
                      type="button"
                      onClick={() => setEdcRate(String(rp.rate))}
                      className={`rounded-md border px-1 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-[var(--gold-dim)] bg-[var(--gold)]/15 text-[var(--gold)]"
                          : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {rp.rate} ៛
                    </button>
                  );
                })}
              </div>
              <TextInput type="number" min="1" step="1" value={edcRate} onChange={(e) => setEdcRate(e.target.value)} />
            </Field>

            <Field label="Exchange rate" labelKm="អត្រាប្តូរប្រាក់" hint={`$1 = ${Math.round(toNumber(exchangeRate) || 0).toLocaleString("en-US")} ៛`}>
              <TextInput type="number" min="1" step="1" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} />
            </Field>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={addToComparison}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]"
              >
                <Plus size={16} />
                {text("Add to household list", "បន្ថែមក្នុងបញ្ជីផ្ទះ")}
              </button>
              <button
                type="button"
                onClick={copyCalculation}
                className="flex items-center justify-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-sm font-medium text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
              >
                {copied ? <CircleCheck size={16} className="text-[var(--success)]" /> : <Copy size={16} />}
                {copied ? text("Copied!", "បានចម្លង!") : text("Copy summary", "ចម្លងព័ត៌មាន")}
              </button>
            </div>
          </section>

          <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
            <h2 className="flex items-center gap-2 font-medium text-[var(--ink)]">
              <Table2 size={16} className="text-[var(--gold)]" />
              {text("EDC Tariff Schedule (Residential)", "តារាងថ្លៃអគ្គិសនី EDC កម្ពុជា (លំនៅឋាន)")}
            </h2>
            <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
              {text(
                "In Cambodia, residential electricity tariffs are split into consumption tiers. Click a tier to apply its rate.",
                "នៅកម្ពុជា តម្លៃអគ្គិសនីសម្រាប់លំនៅឋានត្រូវបានបែងចែកតាមកម្រិតនៃការប្រើប្រាស់។ ចុចលើកម្រិតណាមួយដើម្បីអនុវត្តអត្រានោះ។"
              )}
            </p>
            <div className="space-y-1.5">
              {TIERS.map((tier, idx) => {
                const active = toNumber(edcRate) === tier.rate;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setEdcRate(String(tier.rate))}
                    className={`flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-xs transition ${
                      active
                        ? "border-[var(--gold-dim)] bg-[var(--gold)]/10"
                        : "border-[var(--ground-line)] bg-[var(--ground-raised)] hover:bg-[var(--ground-raised-hi)]"
                    }`}
                  >
                    <span className={`font-semibold ${active ? "text-[var(--gold)]" : "text-[var(--ink)]"}`}>{text(tier.en, tier.km)}</span>
                    <span className={`shrink-0 rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-2 py-0.5 font-bold ${active ? "text-[var(--gold)]" : "text-[var(--ink-dim)]"}`}>
                      {tier.rate} ៛ <span className="font-normal text-[var(--ink-faint)]">· {tier.usd}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-start gap-2 rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-xs leading-relaxed text-[var(--danger)]">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>
                {text(
                  "Many landlords or sub-metered rental rooms charge flat rates of 780–1,000 KHR/kWh to cover shared lighting and management overhead.",
                  "ម្ចាស់ផ្ទះជួលជាច្រើនកំណត់ថ្លៃអគ្គិសនីថេរ 780–1,000 រៀលក្នុង ១ kWh ដើម្បីរ៉ាប់រងលើថ្លៃភ្លើងសាធារណៈ និងការគ្រប់គ្រង។"
                )}
              </span>
            </div>
          </section>
        </div>

        <div className="space-y-5 lg:col-span-7">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{text("Daily", "ថាមពល/ថ្ងៃ")}</div>
              <div className="mt-1 text-xl font-bold text-[var(--ink)]">{result.dailyKwh.toFixed(2)}</div>
              <div className="text-[11px] text-[var(--ink-faint)]">kWh / {text("day", "ថ្ងៃ")}</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{text("Monthly", "ថាមពល/ខែ")}</div>
              <div className="mt-1 text-xl font-bold text-[var(--gold)]">{result.monthlyKwh.toFixed(2)}</div>
              <div className="text-[11px] text-[var(--ink-faint)]">kWh / {text("month", "ខែ")}</div>
            </div>
            <div className="rounded-md border border-[var(--success)]/40 bg-[var(--success)]/10 p-4 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--success)]">{text("Monthly cost", "ចំណាយប្រចាំខែ")}</div>
              <div className="mt-1 text-xl font-bold text-[var(--success)]">{formatKhr(result.monthlyCostKhr)}</div>
              <div className="text-[11px] font-semibold text-[var(--success)]">${result.monthlyCostUsd.toFixed(2)} USD</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{text("Yearly cost", "ចំណាយប្រចាំឆ្នាំ")}</div>
              <div className="mt-1 text-xl font-bold text-[var(--ink)]">${result.yearlyCostUsd.toFixed(2)}</div>
              <div className="text-[11px] text-[var(--ink-faint)]">
                {formatKhr(result.yearlyCostKhr)} / {text("year", "ឆ្នាំ")}
              </div>
            </div>
          </div>

          <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
            <h2 className="flex items-center gap-2 font-medium text-[var(--ink)]">
              <ListChecks size={16} className="text-[var(--gold)]" />
              {text("Step-by-Step Calculation", "ព័ត៌មានលម្អិតអំពីជំហាននៃការគណនា")}
            </h2>
            <div className="space-y-2.5 text-xs">
              <StepRow
                number={1}
                title={text("Convert power to kilowatts (kW)", "បំផ្លែងកម្លាំងជា គីឡូវ៉ាត់ (kW)")}
                formula={`${result.totalPowerWatts.toFixed(0)} W ÷ 1,000 = ${result.powerKw.toFixed(4)} kW`}
              />
              <StepRow
                number={2}
                title={text("Daily energy consumption (kWh/day)", "គណនាការប្រើប្រាស់ថាមពលប្រចាំថ្ងៃ (kWh/ថ្ងៃ)")}
                formula={`${result.powerKw.toFixed(4)} kW × ${result.hours} h = ${result.dailyKwh.toFixed(4)} kWh/day`}
              />
              <StepRow
                number={3}
                title={text("Monthly energy consumption (kWh/month)", "គណនាការប្រើប្រាស់ថាមពលប្រចាំខែ (kWh/ខែ)")}
                formula={`${result.dailyKwh.toFixed(4)} kWh/day × ${result.days} days = ${result.monthlyKwh.toFixed(2)} kWh/month`}
              />
              <StepRow
                number={4}
                title={text("Monthly cost in KHR", "គណនាថ្លៃប្រាក់ជា រៀល (KHR ៛)")}
                formula={`${result.monthlyKwh.toFixed(2)} kWh × ${result.rateKhr} ៛ = ${formatKhr(result.monthlyCostKhr)}`}
                highlight
              />
              <StepRow
                number={5}
                title={text("USD conversion & yearly cost", "បំផ្លែងជាប្រាក់ដុល្លារ ($) និងប្រចាំឆ្នាំ")}
                formula={`${formatKhr(result.monthlyCostKhr)} ÷ ${Math.round(result.exchange).toLocaleString("en-US")} = $${result.monthlyCostUsd.toFixed(2)} / month → $${result.yearlyCostUsd.toFixed(2)} / year`}
              />
            </div>
          </section>
        </div>
      </div>

      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 font-medium text-[var(--ink)]">
              <Home size={16} className="text-[var(--gold)]" />
              {text("Household Bill Estimator", "ប្រព័ន្ធប៉ាន់ប្រមាណវិក្កយបត្រអគ្គិសនីក្នុងផ្ទះ")}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--ink-dim)]">
              {text("Add multiple devices to see total estimated monthly consumption and bill.", "បន្ថែមឧបករណ៍ច្រើន ដើម្បីមើលការប្រើប្រាស់សរុប និងការចំណាយប្រចាំខែ។")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadSampleHousehold}
              className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
            >
              <Home size={13} />
              {text("Load sample house", "ផ្ទុកគំរូក្នុងផ្ទះ")}
            </button>
            <button
              type="button"
              onClick={() => setComparison([])}
              disabled={comparison.length === 0}
              className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:text-[var(--danger)] disabled:opacity-40"
            >
              <Trash2 size={13} />
              {text("Clear list", "សម្អាតបញ្ជី")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="overflow-x-auto lg:col-span-7">
            {comparison.length === 0 ? (
              <div className="rounded-md border border-dashed border-[var(--ground-line)] p-6 text-center text-sm text-[var(--ink-faint)]">
                {text("No appliances added yet. Click \"Add to household list\" or \"Load sample house\" above.", "មិនទាន់មានឧបករណ៍ត្រូវបានបន្ថែម។ ចុច \"បន្ថែមក្នុងបញ្ជីផ្ទះ\" ឬ \"ផ្ទុកគំរូក្នុងផ្ទះ\" ខាងលើ។")}
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--ground-line)] text-left font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
                    <th className="py-2 pr-2">{text("Appliance", "ឧបករណ៍")}</th>
                    <th className="py-2 pr-2 text-center">{text("Power", "កម្លាំង")}</th>
                    <th className="py-2 pr-2 text-center">{text("Usage", "ការប្រើប្រាស់")}</th>
                    <th className="py-2 pr-2 text-right">{text("Monthly kWh", "ប្រចាំខែ (kWh)")}</th>
                    <th className="py-2 pr-2 text-right">{text("Cost", "ចំណាយ")}</th>
                    <th className="py-2 text-center">{text("Del", "លុប")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ground-line)]">
                  {comparison.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 pr-2 font-semibold text-[var(--ink)]">
                        {item.name} <span className="text-[var(--ink-faint)]">({item.qty}x)</span>
                      </td>
                      <td className="py-2 pr-2 text-center text-[var(--ink-dim)]">{item.totalW} W</td>
                      <td className="py-2 pr-2 text-center text-[var(--ink-dim)]">{item.hours} h/d</td>
                      <td className="py-2 pr-2 text-right font-semibold text-[var(--ink)]">{item.monthlyKwh.toFixed(1)} kWh</td>
                      <td className="py-2 pr-2 text-right font-bold text-[var(--success)]">
                        {formatKhr(item.monthlyCostKhr)}{" "}
                        <span className="font-normal text-[var(--ink-faint)]">(${(item.monthlyCostKhr / (toNumber(exchangeRate) || 1)).toFixed(2)})</span>
                      </td>
                      <td className="py-2 text-center">
                        <button type="button" onClick={() => removeFromComparison(item.id)} className="rounded p-1 text-[var(--ink-faint)] transition hover:text-[var(--danger)]">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[var(--ground-line)] font-bold text-[var(--ink)]">
                    <td colSpan={3} className="py-2.5 pr-2 text-right">
                      {text("TOTAL ESTIMATED MONTHLY BILL:", "ការចំណាយសរុបប្រចាំខែ៖")}
                    </td>
                    <td className="py-2.5 pr-2 text-right text-[var(--gold)]">{totals.kwh.toFixed(1)} kWh</td>
                    <td className="py-2.5 pr-2 text-right text-[var(--success)]">
                      {formatKhr(totals.cost)} (${totals.usd.toFixed(2)})
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          <div className="flex flex-col items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 lg:col-span-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
              {text("Energy Consumption Distribution", "ដ្យាក្រាមចែករំលែកការប្រើប្រាស់ថាមពល")}
            </h3>
            <DonutChart items={comparison.map((item) => ({ label: item.name, value: item.monthlyCostKhr }))} />
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <h2 className="flex items-center gap-2 font-medium text-[var(--ink)]">
          <Lightbulb size={16} className="text-[var(--gold)]" />
          {text("Power Saving Tips in Cambodia", "គន្លឹះសំខាន់ៗក្នុងការសន្សំសំចៃអគ្គិសនីនៅកម្ពុជា")}
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {TIPS.map((tip, idx) => {
            const Icon = tip.icon;
            return (
              <div key={idx} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3.5">
                <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-[var(--ink)]">
                  <Icon size={15} className="text-[var(--gold)]" />
                  {text(tip.titleEn, tip.titleKm)}
                </div>
                <p className="text-xs leading-relaxed text-[var(--ink-dim)]">{text(tip.bodyEn, tip.bodyKm)}</p>
              </div>
            );
          })}
        </div>
      </section>
    </ToolShell>
  );
}

function StepRow({
  number,
  title,
  formula,
  highlight,
}: {
  number: number;
  title: string;
  formula: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-md border p-3 ${highlight ? "border-[var(--success)]/40 bg-[var(--success)]/10" : "border-[var(--ground-line)] bg-[var(--ground-raised)]"}`}>
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-[#0a0c0d] ${highlight ? "bg-[var(--success)]" : "bg-[var(--gold)]"}`}
      >
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-[var(--ink)]">{title}</div>
        <div className="mt-1 overflow-x-auto rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-2.5 py-1.5 font-mono-ui text-xs text-[var(--ink)]">
          {formula}
        </div>
      </div>
    </div>
  );
}
