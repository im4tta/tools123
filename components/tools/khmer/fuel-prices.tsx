"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Droplet, ExternalLink, Flame, Fuel, Info, Loader2, MapPin, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";

const API_URL = "https://khfuel.vercel.app/api/public/prices";

interface StationPrice {
  station: string;
  gasoline92: number;
  diesel: number;
}

interface FuelData {
  mandateRef: string | null;
  effectiveAt: string;
  gasoline92: number;
  diesel: number;
  kerosene: number | null;
  stations: StationPrice[];
  notes: string | null;
  sourceUrl: string | null;
  updatedAt: string;
}

function fmtKHR(n: number): string {
  return n.toLocaleString("en-US") + " ៛";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("km-KH", { year: "numeric", month: "long", day: "numeric" });
}

export default function CambodiaFuelPrices() {
  const { text: t } = useLanguage();
  const [data, setData] = useState<FuelData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_URL);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.error || t("Failed to load", "មិនអាចទាញទិន្នន័យ"));
      }
    } catch {
      setError(t("Could not reach fuel price server", "មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេ"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  return (
    <ToolShell
      title="Cambodia Fuel Prices"
      khmerTitle="តម្លៃប្រេងឥន្ធនៈកម្ពុជា"
      description="Official fuel prices from the Ministry of Commerce, updated live from khfuel.vercel.app — gasoline, diesel, and station-specific pricing."
      descriptionKm="តម្លៃប្រេងឥន្ធនៈផ្លូវការពីក្រសួងពាណិជ្ជកម្ម — សាំង ម៉ាស៊ូត និងតម្លៃតាមស្ថានីយ បច្ចុប្បន្នភាពពី khfuel.vercel.app។"
    >
      {/* Refresh + Source link */}
      <div className="mb-5 flex items-center gap-2">
        <button type="button" onClick={fetchData} disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-dim)] hover:text-[var(--ink)] disabled:opacity-50">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> {t("Refresh", "ធ្វើឲ្យថ្មី")}
        </button>
        <a href="https://khfuel.vercel.app" target="_blank" rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink-faint)] hover:text-[var(--ink)] transition">
          khfuel.vercel.app <ExternalLink size={11} />
        </a>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--ground-line)] p-14">
          <Loader2 size={20} className="animate-spin text-[var(--gold)]" />
          <span className="text-sm text-[var(--ink-dim)]">{t("Loading fuel prices…", "កំពុងទាញតម្លៃប្រេង…")}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-6 text-center text-sm text-[var(--danger)]">
          {error}
          <button onClick={fetchData} className="mt-3 block w-full rounded-lg border border-[var(--danger)]/30 px-3 py-2 text-xs font-semibold hover:bg-[var(--danger)]/10">
            {t("Retry", "ព្យាយាមម្តងទៀត")}
          </button>
        </div>
      )}

      {data && (
        <div className="space-y-5">
          {/* Header */}
          <div className="rounded-2xl border border-[var(--gold)]/30 bg-[var(--ground-raised)] p-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
              <CalendarDays size={14} /> {fmtDate(data.effectiveAt)}
              {data.mandateRef && <span className="rounded bg-[var(--gold)]/10 px-2 py-0.5 font-mono-ui text-[10px] text-[var(--gold)]">🇰🇭 {t("Mandate", "អាណត្តិ")} #{data.mandateRef}</span>}
            </div>
            {data.notes && <p className="mt-2 text-xs text-[var(--ink-dim)]">{data.notes}</p>}
          </div>

          {/* Price cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Gasoline 92", km: "សាំង 92", value: data.gasoline92, icon: Fuel, cls: "border-sky-500/30 bg-sky-500/5" },
              { label: "Diesel", km: "ម៉ាស៊ូត", value: data.diesel, icon: Flame, cls: "border-amber-500/30 bg-amber-500/5" },
              ...(data.kerosene ? [{ label: "Kerosene", km: "កាតូសែន", value: data.kerosene, icon: Droplet, cls: "border-teal-500/30 bg-teal-500/5" }] : []),
            ].map((card) => (
              <div key={card.label} className={`rounded-xl border p-4 ${card.cls}`}>
                <card.icon size={16} className="mb-2 text-[var(--ink-faint)]" />
                <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">{t(card.label, card.km)}</div>
                <div className="mt-1 font-mono-ui text-lg font-bold text-[var(--ink)]">{fmtKHR(card.value)}</div>
                <div className="text-[10px] text-[var(--ink-faint)]">/ {t("liter", "លីត្រ")}</div>
              </div>
            ))}
          </div>

          {/* Station prices */}
          {data.stations.length > 0 && (
            <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                <MapPin size={14} className="text-[var(--gold)]" />
                {t("Station Prices", "តម្លៃតាមស្ថានីយ")}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--ground-line)] text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
                      <th className="px-3 py-2">{t("Station", "ស្ថានីយ")}</th>
                      <th className="px-3 py-2 text-right">{t("Gasoline 92", "សាំង 92")}</th>
                      <th className="px-3 py-2 text-right">{t("Diesel", "ម៉ាស៊ូត")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ground-line)]">
                    {data.stations.map((s) => (
                      <tr key={s.station} className="hover:bg-[var(--ground)]/50 transition">
                        <td className="px-3 py-2.5 font-semibold text-[var(--ink)]">{s.station}</td>
                        <td className="px-3 py-2.5 text-right font-mono-ui font-bold text-[var(--ink)]">{fmtKHR(s.gasoline92)}</td>
                        <td className="px-3 py-2.5 text-right font-mono-ui font-bold text-[var(--ink)]">{fmtKHR(s.diesel)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Info footer */}
          <div className="flex items-start gap-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-3 text-[11px] leading-relaxed text-[var(--ink-faint)]">
            <Info size={13} className="mt-0.5 shrink-0" />
            <span>
              {t(
                "Data sourced from the Cambodia Ministry of Commerce via khfuel.vercel.app. Prices are in Cambodian Riel (KHR) per liter. Station prices may vary slightly by location.",
                "ទិន្នន័យពីក្រសួងពាណិជ្ជកម្មកម្ពុជា តាមរយៈ khfuel.vercel.app។ តម្លៃគិតជារៀលកម្ពុជា (KHR) ក្នុងមួយលីត្រ។ តម្លៃតាមស្ថានីយអាចខុសគ្នាបន្តិចបន្តួចតាមទីតាំង។"
              )}
            </span>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
