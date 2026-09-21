"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { PROVINCE_CAPITALS, haversineKm } from "@/lib/cambodia-geo";

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
