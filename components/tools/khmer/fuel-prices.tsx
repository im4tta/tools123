"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, ExternalLink, Flame, Fuel, Info, Loader2, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { fetchMefFuelPeriods, MEF_FUEL_HOME, type FuelPeriod } from "@/lib/mef-fuel";

function fmtKHR(n: number): string {
  return n.toLocaleString("en-US") + " ៛";
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("km-KH", { year: "numeric", month: "long", day: "numeric" });
}

export default function CambodiaFuelPrices() {
  const { text: t } = useLanguage();
  const [periods, setPeriods] = useState<FuelPeriod[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Runs the fetch and applies results only after the promise settles, so it
  // never calls setState synchronously inside the effect body.
  const runLoad = useCallback(() => {
    const controller = new AbortController();
    fetchMefFuelPeriods({ signal: controller.signal })
      .then(
        (next) => { setPeriods(next); setError(""); },
        () => { setError(t("Could not load fuel prices from MEF. Please try again.", "មិនអាចទាញតម្លៃប្រេងពី MEF បានទេ។ សូមព្យាយាមម្តងទៀត។")); },
      )
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [t]);

  const refresh = useCallback(() => {
    setLoading(true);
    setError("");
    runLoad();
  }, [runLoad]);

  useEffect(() => runLoad(), [runLoad]);

  const current = periods?.[0] ?? null;
  const history = periods ?? [];

  function changeMeta(change: number) {
    if (change > 0) return { label: `▲ ${fmtKHR(change)}`, cls: "text-red-500" };
    if (change < 0) return { label: `▼ ${fmtKHR(Math.abs(change))}`, cls: "text-emerald-500" };
    return { label: t("no change", "មិនប្រែប្រួល"), cls: "text-[var(--ink-faint)]" };
  }

  return (
    <ToolShell
      title="Cambodia Fuel Prices"
      khmerTitle="តម្លៃប្រេងឥន្ធនៈកម្ពុជា"
      description="Official retail fuel-price ceilings (Gasoline 92 and Diesel/Gasoil 50ppm) from Cambodia's MEF Open Data Platform, set by the Ministry of Commerce and updated each period."
      descriptionKm="ពិដានតម្លៃប្រេងឥន្ធនៈលក់រាយផ្លូវការ (សាំង 92 និងម៉ាស៊ូត/Gasoil 50ppm) ពីវេទិកាទិន្នន័យបើកចំហរបស់ក្រសួងសេដ្ឋកិច្ច និងហិរញ្ញវត្ថុ (MEF) កំណត់ដោយក្រសួងពាណិជ្ជកម្ម និងធ្វើបច្ចុប្បន្នភាពរៀងរាល់អំឡុងពេល។"
    >
      {/* Refresh + Source link */}
      <div className="mb-5 flex items-center gap-2">
        <button type="button" onClick={refresh} disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-dim)] hover:text-[var(--ink)] disabled:opacity-50">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> {t("Refresh", "ធ្វើឲ្យថ្មី")}
        </button>
        <a href={MEF_FUEL_HOME} target="_blank" rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink-faint)] hover:text-[var(--ink)] transition">
          data.mef.gov.kh <ExternalLink size={11} />
        </a>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--ground-line)] p-14">
          <Loader2 size={20} className="animate-spin text-[var(--gold)]" />
          <span className="text-sm text-[var(--ink-dim)]">{t("Loading fuel prices…", "កំពុងទាញតម្លៃប្រេង…")}</span>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-6 text-center text-sm text-[var(--danger)]">
          {error}
          <button onClick={refresh} className="mt-3 block w-full rounded-lg border border-[var(--danger)]/30 px-3 py-2 text-xs font-semibold hover:bg-[var(--danger)]/10">
            {t("Retry", "ព្យាយាមម្តងទៀត")}
          </button>
        </div>
      )}

      {current && (
        <div className="space-y-5">
          {/* Current period header */}
          <div className="rounded-2xl border border-[var(--gold)]/30 bg-[var(--ground-raised)] p-6">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
              <CalendarDays size={14} /> {fmtDate(current.startDate)} – {fmtDate(current.endDate)}
              <span className="rounded bg-[var(--gold)]/10 px-2 py-0.5 font-mono-ui text-[10px] text-[var(--gold)]">🇰🇭 {t("Current period", "អំឡុងបច្ចុប្បន្ន")}</span>
            </div>
            {current.sourceLink && (
              <a href={current.sourceLink} target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--ink-dim)] underline hover:text-[var(--ink)]">
                {t("Ministry of Commerce announcement", "សេចក្តីប្រកាសក្រសួងពាណិជ្ជកម្ម")} <ExternalLink size={10} />
              </a>
            )}
          </div>

          {/* Price cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: "Gasoline 92", km: "សាំង 92", value: current.gasoline92, change: current.gasoline92Change, icon: Fuel, cls: "border-sky-500/30 bg-sky-500/5" },
              { label: "Diesel (Gasoil 50ppm)", km: "ម៉ាស៊ូត (Gasoil 50ppm)", value: current.diesel, change: current.dieselChange, icon: Flame, cls: "border-amber-500/30 bg-amber-500/5" },
            ].map((card) => {
              const chg = changeMeta(card.change);
              return (
                <div key={card.label} className={`rounded-xl border p-4 ${card.cls}`}>
                  <card.icon size={16} className="mb-2 text-[var(--ink-faint)]" />
                  <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">{t(card.label, card.km)}</div>
                  <div className="mt-1 font-mono-ui text-lg font-bold text-[var(--ink)]">{fmtKHR(card.value)}</div>
                  <div className="text-[10px] text-[var(--ink-faint)]">/ {t("liter", "លីត្រ")}</div>
                  <div className={`mt-1.5 font-mono-ui text-[11px] font-semibold ${chg.cls}`}>
                    {chg.label}
                    {card.change !== 0 && <span className="ml-1 font-normal text-[var(--ink-faint)]">{t("vs previous", "ធៀបនឹងលើកមុន")}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent price periods */}
          {history.length > 1 && (
            <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                <CalendarDays size={14} className="text-[var(--gold)]" />
                {t("Recent price periods", "អំឡុងតម្លៃថ្មីៗ")}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--ground-line)] text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
                      <th className="px-3 py-2">{t("Period", "អំឡុងពេល")}</th>
                      <th className="px-3 py-2 text-right">{t("Gasoline 92", "សាំង 92")}</th>
                      <th className="px-3 py-2 text-right">{t("Diesel", "ម៉ាស៊ូត")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ground-line)]">
                    {history.map((p) => (
                      <tr key={p.startDate} className="hover:bg-[var(--ground)]/50 transition">
                        <td className="px-3 py-2.5 text-[var(--ink-dim)]">{fmtDate(p.startDate)} – {fmtDate(p.endDate)}</td>
                        <td className="px-3 py-2.5 text-right font-mono-ui font-bold text-[var(--ink)]">{fmtKHR(p.gasoline92)}</td>
                        <td className="px-3 py-2.5 text-right font-mono-ui font-bold text-[var(--ink)]">{fmtKHR(p.diesel)}</td>
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
                "Data from the MEF Open Data Platform (data.mef.gov.kh); prices are set by the Cambodia Ministry of Commerce. Figures are official retail ceilings in Cambodian Riel (KHR) per liter for the stated period.",
                "ទិន្នន័យពីវេទិកាទិន្នន័យបើកចំហ MEF (data.mef.gov.kh)។ តម្លៃកំណត់ដោយក្រសួងពាណិជ្ជកម្មកម្ពុជា។ តួលេខជាពិដានតម្លៃលក់រាយផ្លូវការគិតជារៀល (KHR) ក្នុងមួយលីត្រ សម្រាប់អំឡុងពេលដែលបានបញ្ជាក់។"
              )}
            </span>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
