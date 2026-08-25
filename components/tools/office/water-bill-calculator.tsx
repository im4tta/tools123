"use client";
import { useMemo, useState } from "react";
import { Droplets, Info } from "lucide-react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// PPWSA residential water tariff — the DEFAULT tier bands/rates below are SAMPLE
// placeholders only, NOT official values. They are editable and MUST be replaced
// with your actual rates (from your bill or the official PPWSA schedule) before
// the result means anything. Always verify — READFIRST: no fabricated official data.
interface Tier { label: string; labelKm: string; upTo: number; rate: number }
const DEFAULT_TIERS: Tier[] = [
  { label: "Tier 1 (sample)", labelKm: "កម្រិត ១ (គំរូ)", upTo: 3, rate: 600 },
  { label: "Tier 2 (sample)", labelKm: "កម្រិត ២ (គំរូ)", upTo: 10, rate: 1000 },
  { label: "Tier 3 (sample)", labelKm: "កម្រិត ៣ (គំរូ)", upTo: 15, rate: 1200 },
  { label: "Tier 4 (sample)", labelKm: "កម្រិត ៤ (គំរូ)", upTo: 30, rate: 1500 },
  { label: "Tier 5 (sample)", labelKm: "កម្រិត ៥ (គំរូ)", upTo: 50, rate: 1800 },
  { label: "Tier 6 (sample)", labelKm: "កម្រិត ៦ (គំរូ)", upTo: Infinity, rate: 2500 },
];

function toNum(v: string) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function khr(n: number) { return `${Math.round(n).toLocaleString("en-US")} ៛`; }

export default function WaterBillCalculator() {
  const { text: t } = useLanguage();
  const [use, setUse] = useToolState("water-bill:use", "12");
  const [exchange, setExchange] = useToolState("water-bill:exchange", "4100");
  const [tiers, setTiers] = useToolState<Tier[]>("water-bill:tiers", DEFAULT_TIERS);
  const [editing, setEditing] = useState(false);

  const m3 = Math.max(0, toNum(use));
  const result = useMemo(() => {
    let remaining = m3;
    let prev = 0;
    const rows: { label: string; m3: number; rate: number; cost: number }[] = [];
    let total = 0;
    for (const tier of tiers) {
      if (remaining <= 0) break;
      const span = Math.min(remaining, tier.upTo - prev);
      const cost = span * tier.rate;
      rows.push({ label: tier.label, m3: span, rate: tier.rate, cost });
      total += cost;
      remaining -= span;
      prev = tier.upTo;
    }
    const usd = total / (toNum(exchange) || 1);
    return { rows, total, usd };
  }, [m3, tiers, exchange]);

  function setTierRate(i: number, rate: number) {
    setTiers((prev) => prev.map((x, idx) => (idx === i ? { ...x, rate } : x)));
  }

  return (
    <ToolShell
      title="Phnom Penh Water Bill Calculator"
      khmerTitle="គណនាវិក្កយបត្រទឹកភ្នំពេញ"
      description="Estimate a residential water bill from monthly cubic-meter usage with editable tier rates — the defaults are sample placeholders, so replace them with your actual rates before relying on the result."
      descriptionKm="ប៉ាន់ស្មានវិក្កយបត្រទឹកលំនៅឋានពីចំនួនម៉ែត្រគូបប្រចាំខែ ដោយប្រើអត្រាកម្រិតដែលអាចកែបាន — អត្រាលំនាំដើមគឺជាគំរូ សូមជំនួសដោយអត្រាពិតរបស់អ្នក មុនពេលពឹងផ្អែកលើលទ្ធផល។"
    >
      <Row>
        <Field label={t("Monthly usage (m³)", "ការប្រើប្រាស់ប្រចាំខែ (ម៉ែត្រគូប)")}>
          <TextInput type="number" min="0" step="0.1" value={use} onChange={(e) => setUse(e.target.value)} />
        </Field>
        <Field label={t("Exchange rate", "អត្រាប្តូរប្រាក់")} hint={`$1 = ${Math.round(toNum(exchange) || 0).toLocaleString("en-US")} ៛`}>
          <TextInput type="number" min="1" step="1" value={exchange} onChange={(e) => setExchange(e.target.value)} />
        </Field>
      </Row>

      <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{t("Bill breakdown", "ការបែងចែកវិក្កយបត្រ")}</div>
        {result.rows.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--ink-dim)]">{t("Enter usage above 0 to see the estimate.", "បញ្ចូលការប្រើប្រាស់ធំជាង 0 ដើម្បីមើលការប៉ាន់ស្មាន។")}</p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {result.rows.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-xs">
                <span className="text-[var(--ink)]">{r.label} × {r.m3.toFixed(1)} m³</span>
                <span className="font-semibold text-[var(--ink-dim)]">{r.rate} ៛/ម³</span>
                <span className="font-bold text-[var(--ink)]">{khr(r.cost)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-[var(--ground-line)] pt-2 text-sm">
              <span className="font-semibold text-[var(--ink)]">{t("Estimated monthly bill", "ការចំណាយប្រចាំខែប៉ាន់ស្មាន")}</span>
              <span className="font-bold text-[var(--gold)]">{khr(result.total)} · ${result.usd.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      <button type="button" onClick={() => setEditing((e) => !e)} className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs font-medium text-[var(--ink-dim)] transition hover:text-[var(--ink)]">
        <Droplets size={13} />
        {editing ? t("Done editing rates", "រួចរាល់ក្នុងការកែអត្រា") : t("Edit tier rates", "កែសម្រួលអត្រាកម្រិត")}
      </button>

      {editing && (
        <div className="space-y-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
          {tiers.map((tier, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-32 shrink-0 text-xs text-[var(--ink-dim)]">{tier.label}</span>
              <TextInput type="number" min="0" step="10" value={String(tier.rate)} onChange={(e) => setTierRate(i, toNum(e.target.value))} className="w-28" />
              <span className="text-xs text-[var(--ink-faint)]">៛/ម³</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <Info size={14} className="mt-0.5 shrink-0 text-[var(--gold)]" />
        <span>
          {t("The default tier bands and rates are sample placeholders only — they are not official PPWSA values. Use your actual bill or the official schedule to replace them before drawing any conclusion.", "អត្រាកម្រិតលំនាំដើមគឺជាគំរូតែប៉ុណ្ណោះ — មិនមែនជាតម្លៃផ្លូវការរបស់ PPWSA ទេ។ សូមប្រើវិក្កយបត្រពិត ឬកាលវិភាគផ្លូវការដើម្បីជំនួសវា មុនពេលសន្និដ្ឋាន។")}
        </span>
      </div>
    </ToolShell>
  );
}
