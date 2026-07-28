"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const PROVINCE_CAPITALS: { en: string; km: string; lat: number; lng: number }[] = [
  { en: "Phnom Penh", km: "ភ្នំពេញ", lat: 11.5564, lng: 104.9282 },
  { en: "Banteay Meanchey", km: "បន្ទាយមានជ័យ", lat: 13.5875, lng: 102.9857 },
  { en: "Battambang", km: "បាត់ដំបង", lat: 13.0957, lng: 103.2022 },
  { en: "Kampong Cham", km: "កំពង់ចាម", lat: 12.0, lng: 105.45 },
  { en: "Kampong Chhnang", km: "កំពង់ឆ្នាំង", lat: 12.25, lng: 104.6667 },
  { en: "Kampong Speu", km: "កំពង់ស្ពឺ", lat: 11.45, lng: 104.5167 },
  { en: "Kampong Thom", km: "កំពង់ធំ", lat: 12.7111, lng: 104.8887 },
  { en: "Kampot", km: "កំពត", lat: 10.6104, lng: 104.1817 },
  { en: "Kandal", km: "កណ្តាល", lat: 11.4833, lng: 104.95 },
  { en: "Kep", km: "កែប", lat: 10.4833, lng: 104.3167 },
  { en: "Koh Kong", km: "កោះកុង", lat: 11.6153, lng: 102.9836 },
  { en: "Kratie", km: "ក្រចេះ", lat: 12.4881, lng: 106.0189 },
  { en: "Mondulkiri", km: "មណ្ឌលគិរី", lat: 12.455, lng: 107.1931 },
  { en: "Oddar Meanchey", km: "ឧត្តរមានជ័យ", lat: 14.1867, lng: 103.5236 },
  { en: "Pailin", km: "ប៉ៃលិន", lat: 12.85, lng: 102.6 },
  { en: "Preah Sihanouk", km: "ព្រះសីហនុ", lat: 10.6167, lng: 103.53 },
  { en: "Preah Vihear", km: "ព្រះវិហារ", lat: 13.82, lng: 104.97 },
  { en: "Prey Veng", km: "ព្រៃវែង", lat: 11.4857, lng: 105.3251 },
  { en: "Pursat", km: "ពោធិ៍សាត់", lat: 12.5388, lng: 103.9199 },
  { en: "Ratanakiri", km: "រតនគិរី", lat: 13.7394, lng: 106.9873 },
  { en: "Siem Reap", km: "សៀមរាប", lat: 13.3671, lng: 103.8448 },
  { en: "Stung Treng", km: "ស្ទឹងត្រែង", lat: 13.5259, lng: 105.9683 },
  { en: "Svay Rieng", km: "ស្វាយរៀង", lat: 11.0877, lng: 105.7996 },
  { en: "Takeo", km: "តាកែវ", lat: 10.9908, lng: 104.7845 },
  { en: "Tboung Khmum", km: "ត្បូងឃ្មុំ", lat: 11.9667, lng: 105.6333 },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function NearestProvince() {
  const [lat, setLat] = useToolState("nearest-province:lat", "11.55");
  const [lng, setLng] = useToolState("nearest-province:lng", "104.92");

  const ranked = useMemo(() => {
    const la = Number(lat);
    const ln = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
    return PROVINCE_CAPITALS.map((p) => ({ ...p, dist: haversineKm(la, ln, p.lat, p.lng) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5);
  }, [lat, lng]);

  return (
    <ToolShell
      title="Nearest Province Finder"
      khmerTitle="ខេត្តជិតបំផុត"
      description="Given a GPS coordinate, ranks Cambodia's provinces/municipalities by straight-line distance from their provincial-town point. This uses a single reference point per province, not true boundary polygons, so it's a quick approximation — useful for a rough guess, not authoritative for points near a border."
    >
      <Row>
        <Field label="Latitude"><TextInput value={lat} onChange={(e) => setLat(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Longitude"><TextInput value={lng} onChange={(e) => setLng(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      {ranked ? (
        <div className="overflow-hidden rounded-md border border-[var(--ground-line)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--ground-raised)] text-xs uppercase tracking-wide text-[var(--ink-dim)]">
              <tr><th className="px-3 py-2 text-left">Province</th><th className="px-3 py-2 text-left">Khmer</th><th className="px-3 py-2 text-left">≈ Distance</th></tr>
            </thead>
            <tbody>
              {ranked.map((p, i) => (
                <tr key={p.en} className={`border-t border-[var(--ground-line)] ${i === 0 ? "bg-[var(--gold)]/10" : ""}`}>
                  <td className="px-3 py-2">{p.en}</td>
                  <td className="px-3 py-2 font-khmer">{p.km}</td>
                  <td className="px-3 py-2 text-[var(--ink-dim)]">{p.dist.toFixed(1)} km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-sm text-[var(--ink-faint)]">Enter a valid latitude and longitude.</div>
      )}
    </ToolShell>
  );
}
