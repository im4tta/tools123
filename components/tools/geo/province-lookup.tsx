"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const PROVINCES: { en: string; km: string; capital: string }[] = [
  { en: "Banteay Meanchey", km: "បន្ទាយមានជ័យ", capital: "Serei Saophoan" },
  { en: "Battambang", km: "បាត់ដំបង", capital: "Battambang" },
  { en: "Kampong Cham", km: "កំពង់ចាម", capital: "Kampong Cham" },
  { en: "Kampong Chhnang", km: "កំពង់ឆ្នាំង", capital: "Kampong Chhnang" },
  { en: "Kampong Speu", km: "កំពង់ស្ពឺ", capital: "Chbar Mon" },
  { en: "Kampong Thom", km: "កំពង់ធំ", capital: "Kampong Thom" },
  { en: "Kampot", km: "កំពត", capital: "Kampot" },
  { en: "Kandal", km: "កណ្តាល", capital: "Ta Khmau" },
  { en: "Kep", km: "កែប", capital: "Kep" },
  { en: "Koh Kong", km: "កោះកុង", capital: "Khemarak Phoumin" },
  { en: "Kratie", km: "ក្រចេះ", capital: "Kratie" },
  { en: "Mondulkiri", km: "មណ្ឌលគិរី", capital: "Senmonorom" },
  { en: "Oddar Meanchey", km: "ឧត្តរមានជ័យ", capital: "Samraong" },
  { en: "Pailin", km: "ប៉ៃលិន", capital: "Pailin" },
  { en: "Phnom Penh", km: "ភ្នំពេញ", capital: "—" },
  { en: "Preah Sihanouk", km: "ព្រះសីហនុ", capital: "Sihanoukville" },
  { en: "Preah Vihear", km: "ព្រះវិហារ", capital: "Tbeng Meanchey" },
  { en: "Prey Veng", km: "ព្រៃវែង", capital: "Prey Veng" },
  { en: "Pursat", km: "ពោធិ៍សាត់", capital: "Pursat" },
  { en: "Ratanakiri", km: "រតនគិរី", capital: "Banlung" },
  { en: "Siem Reap", km: "សៀមរាប", capital: "Siem Reap" },
  { en: "Stung Treng", km: "ស្ទឹងត្រែង", capital: "Stung Treng" },
  { en: "Svay Rieng", km: "ស្វាយរៀង", capital: "Svay Rieng" },
  { en: "Takeo", km: "តាកែវ", capital: "Doun Kaev" },
  { en: "Tboung Khmum", km: "ត្បូងឃ្មុំ", capital: "Suong" },
];

export default function ProvinceLookup() {
  const [q, setQ] = useToolState("province-lookup:q", "");
  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return PROVINCES;
    return PROVINCES.filter((p) => p.en.toLowerCase().includes(query) || p.km.includes(q));
  }, [q]);

  return (
    <ToolShell title="Cambodia Province Lookup" khmerTitle="ខេត្ត" description="Quick reference for Cambodia's 25 provinces/municipalities, their Khmer names, and capitals.">
      <Field label="Filter"><TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search English or Khmer..." /></Field>
      <div className="overflow-hidden rounded-md border border-[var(--ground-line)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--ground-raised)] text-xs uppercase tracking-wide text-[var(--ink-dim)]">
            <tr><th className="px-3 py-2 text-left">English</th><th className="px-3 py-2 text-left">Khmer</th><th className="px-3 py-2 text-left">Capital</th></tr>
          </thead>
          <tbody>
            {results.map((p) => (
              <tr key={p.en} className="border-t border-[var(--ground-line)]">
                <td className="px-3 py-2">{p.en}</td>
                <td className="px-3 py-2 font-khmer">{p.km}</td>
                <td className="px-3 py-2 text-[var(--ink-dim)]">{p.capital}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ToolShell>
  );
}
