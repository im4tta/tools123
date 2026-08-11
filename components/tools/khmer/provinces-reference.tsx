"use client";
import { useMemo } from "react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell, Field, Select, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

interface Province {
  en: string;
  km: string;
  capitalEn: string;
  capitalKm: string;
  region: "Capital" | "Central Plain" | "Tonlé Sap Basin" | "Northeast Plateau" | "Cardamom & Southwest" | "Coastal" | "Northwest Border" | "Mekong Corridor";
}

const PROVINCES: Province[] = [
  { en: "Phnom Penh", km: "ភ្នំពេញ", capitalEn: "Phnom Penh", capitalKm: "ភ្នំពេញ", region: "Capital" },
  { en: "Banteay Meanchey", km: "បន្ទាយមានជ័យ", capitalEn: "Serei Saophoan", capitalKm: "សិរីសោភ័ណ", region: "Northwest Border" },
  { en: "Battambang", km: "បាត់ដំបង", capitalEn: "Battambang", capitalKm: "បាត់ដំបង", region: "Northwest Border" },
  { en: "Kampong Cham", km: "កំពង់ចាម", capitalEn: "Kampong Cham", capitalKm: "កំពង់ចាម", region: "Mekong Corridor" },
  { en: "Kampong Chhnang", km: "កំពង់ឆ្នាំង", capitalEn: "Kampong Chhnang", capitalKm: "កំពង់ឆ្នាំង", region: "Tonlé Sap Basin" },
  { en: "Kampong Speu", km: "កំពង់ស្ពឺ", capitalEn: "Chbar Mon", capitalKm: "ច្បារមន", region: "Central Plain" },
  { en: "Kampong Thom", km: "កំពង់ធំ", capitalEn: "Kampong Thom", capitalKm: "កំពង់ធំ", region: "Tonlé Sap Basin" },
  { en: "Kampot", km: "កំពត", capitalEn: "Kampot", capitalKm: "កំពត", region: "Coastal" },
  { en: "Kandal", km: "កណ្ដាល", capitalEn: "Ta Khmau", capitalKm: "តាខ្មៅ", region: "Central Plain" },
  { en: "Kep", km: "កែប", capitalEn: "Kep", capitalKm: "កែប", region: "Coastal" },
  { en: "Koh Kong", km: "កោះកុង", capitalEn: "Khemarak Phoumin", capitalKm: "ខេមរភូមិន្ទ", region: "Cardamom & Southwest" },
  { en: "Kratié", km: "ក្រចេះ", capitalEn: "Kratié", capitalKm: "ក្រចេះ", region: "Mekong Corridor" },
  { en: "Mondulkiri", km: "មណ្ឌលគិរី", capitalEn: "Senmonorom", capitalKm: "សែនមនោរម្យ", region: "Northeast Plateau" },
  { en: "Oddar Meanchey", km: "ឧត្តរមានជ័យ", capitalEn: "Samraong", capitalKm: "សំរោង", region: "Northwest Border" },
  { en: "Pailin", km: "ប៉ៃលិន", capitalEn: "Pailin", capitalKm: "ប៉ៃលិន", region: "Northwest Border" },
  { en: "Preah Vihear", km: "ព្រះវិហារ", capitalEn: "Tbeng Meanchey", capitalKm: "ត្បែងមានជ័យ", region: "Tonlé Sap Basin" },
  { en: "Prey Veng", km: "ព្រៃវែង", capitalEn: "Prey Veng", capitalKm: "ព្រៃវែង", region: "Mekong Corridor" },
  { en: "Pursat", km: "ពោធិ៍សាត់", capitalEn: "Pursat", capitalKm: "ពោធិ៍សាត់", region: "Tonlé Sap Basin" },
  { en: "Ratanakiri", km: "រតនគិរី", capitalEn: "Banlung", capitalKm: "បានលុង", region: "Northeast Plateau" },
  { en: "Siem Reap", km: "សៀមរាប", capitalEn: "Siem Reap", capitalKm: "សៀមរាប", region: "Tonlé Sap Basin" },
  { en: "Preah Sihanouk", km: "ព្រះសីហនុ", capitalEn: "Sihanoukville", capitalKm: "ក្រុងព្រះសីហនុ", region: "Coastal" },
  { en: "Stung Treng", km: "ស្ទឹងត្រែង", capitalEn: "Stung Treng", capitalKm: "ស្ទឹងត្រែង", region: "Northeast Plateau" },
  { en: "Svay Rieng", km: "ស្វាយរៀង", capitalEn: "Svay Rieng", capitalKm: "ស្វាយរៀង", region: "Mekong Corridor" },
  { en: "Takéo", km: "តាកែវ", capitalEn: "Doun Kaev", capitalKm: "ដូនកែវ", region: "Central Plain" },
  { en: "Tboung Khmum", km: "ត្បូងឃ្មុំ", capitalEn: "Suong", capitalKm: "សួង", region: "Mekong Corridor" },
];

const REGIONS = ["All", "Capital", "Central Plain", "Tonlé Sap Basin", "Northeast Plateau", "Cardamom & Southwest", "Coastal", "Northwest Border", "Mekong Corridor"] as const;

export default function ProvincesReference() {
  const { text } = useLanguage();
  const [region, setRegion] = useToolState<(typeof REGIONS)[number]>("provinces-reference:region", "All");
  const [query, setQuery] = useToolState("provinces-reference:query", "");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROVINCES.filter((p) => {
      const matchesRegion = region === "All" || p.region === region;
      const matchesQuery = !q || p.en.toLowerCase().includes(q) || p.km.includes(q) || p.capitalEn.toLowerCase().includes(q);
      return matchesRegion && matchesQuery;
    }).sort((a, b) => a.en.localeCompare(b.en));
  }, [region, query]);

  return (
    <ToolShell
      title="Cambodia Provinces Reference"
      khmerTitle="បញ្ជីខេត្ត-រាជធានីកម្ពុជា"
      description={`All 25 first-level administrative divisions of Cambodia (24 provinces plus the capital Phnom Penh), with Khmer names and provincial capitals — handy for populating address dropdowns or looking up a capital. Districts and communes aren't included; verify against the Ministry of Interior's current list before use in an official filing.`}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Region">
          <Select value={region} onChange={(e) => setRegion(e.target.value as (typeof REGIONS)[number])}>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </Field>
        <Field label="Search">
          <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Province or capital name…" />
        </Field>
      </div>
      <div className="rounded-md border border-[var(--ground-line)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--ground-line)] bg-[var(--ground-raised)] text-left text-xs uppercase tracking-wide text-[var(--ink-faint)]">
              <th className="px-3 py-2">Province</th>
              <th className="px-3 py-2">Khmer</th>
              <th className="px-3 py-2">Capital</th>
              <th className="px-3 py-2">Region</th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {results.map((p) => (
              <tr key={p.en} className="border-b border-[var(--ground-line)] last:border-0">
                <td className="px-3 py-2 font-medium text-[var(--ink)]">{p.en}</td>
                <td className="px-3 py-2 text-[var(--ink-dim)]">{p.km}</td>
                <td className="px-3 py-2 text-[var(--ink-dim)]">{p.capitalEn} <span className="text-[var(--ink-faint)]">({p.capitalKm})</span></td>
                <td className="px-3 py-2 text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{p.region}</td>
                <td className="px-3 py-2">
                  <CopyButton
                    compact
                    text={`${p.en} (${p.km})\n${text("Capital", "រាជធានី")}: ${p.capitalEn} (${p.capitalKm})\n${p.region}`}
                    fields={[
                      { id: "name", label: text("Province", "ខេត្ត"), getValue: `${p.en} (${p.km})` },
                      { id: "capital", label: text("Capital", "រាជធានី"), getValue: `${p.capitalEn} (${p.capitalKm})` },
                      { id: "region", label: text("Region", "តំបន់"), getValue: p.region },
                    ]}
                  />
                </td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-[var(--ink-faint)]">No provinces match that filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </ToolShell>
  );
}
