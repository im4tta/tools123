"use client";

import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

type Ring = [number, number][]; // [lat, lng]
interface Poly { outer: Ring; holes: Ring[] }

// Parse the polygon input as either GeoJSON (Polygon/MultiPolygon/Feature/
// FeatureCollection, coordinates in [lng,lat]) or a plain "lat,lng" per-line
// ring. Returns one or more polygons with optional holes.
function parsePolygons(input: string): { polys: Poly[]; error: string | null } {
  const trimmed = input.trim();
  if (!trimmed) return { polys: [], error: null };

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const json = JSON.parse(trimmed);
      const geoms: { type: string; coordinates: unknown }[] = [];
      const pushGeom = (g: { type?: string; coordinates?: unknown } | null) => { if (g?.type && g.coordinates) geoms.push(g as { type: string; coordinates: unknown }); };
      if (json.type === "FeatureCollection") for (const f of json.features ?? []) pushGeom(f?.geometry);
      else if (json.type === "Feature") pushGeom(json.geometry);
      else pushGeom(json);

      const polys: Poly[] = [];
      const ringFrom = (coords: number[][]): Ring => coords.map((c) => [c[1], c[0]] as [number, number]);
      for (const g of geoms) {
        if (g.type === "Polygon") {
          const rings = g.coordinates as number[][][];
          polys.push({ outer: ringFrom(rings[0]), holes: rings.slice(1).map(ringFrom) });
        } else if (g.type === "MultiPolygon") {
          for (const poly of g.coordinates as number[][][][]) {
            polys.push({ outer: ringFrom(poly[0]), holes: poly.slice(1).map(ringFrom) });
          }
        }
      }
      if (!polys.length) return { polys: [], error: "No Polygon/MultiPolygon geometry found in the GeoJSON." };
      return { polys, error: null };
    } catch {
      return { polys: [], error: "Invalid GeoJSON." };
    }
  }

  const ring: Ring = [];
  for (const line of trimmed.split("\n")) {
    if (!line.trim()) continue;
    const [a, b] = line.split(",").map((v) => Number(v.trim()));
    if (!Number.isFinite(a) || !Number.isFinite(b)) return { polys: [], error: "Each polygon line must be 'lat,lng'." };
    ring.push([a, b]);
  }
  if (ring.length < 3) return { polys: [], error: "A polygon needs at least 3 vertices." };
  return { polys: [{ outer: ring, holes: [] }], error: null };
}

function pointInRing(lat: number, lng: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i];
    const [yj, xj] = ring[j];
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolys(lat: number, lng: number, polys: Poly[]): boolean {
  for (const poly of polys) {
    if (pointInRing(lat, lng, poly.outer) && !poly.holes.some((h) => pointInRing(lat, lng, h))) return true;
  }
  return false;
}

export default function PointInPolygon() {
  const { text: t } = useLanguage();
  const [polyInput, setPolyInput] = useToolState(
    "pip:poly",
    "11.5500,104.9200\n11.5700,104.9200\n11.5700,104.9500\n11.5500,104.9500"
  );
  const [pointInput, setPointInput] = useToolState("pip:points", "11.5564,104.9282 Central Market\n11.6000,104.9000 North point");

  const { polys, error } = useMemo(() => parsePolygons(polyInput), [polyInput]);

  const results = useMemo(() => {
    if (!polys.length) return [];
    return pointInput
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const m = line.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*(.*)$/);
        if (!m) return { line, lat: null, lng: null, label: "", inside: null as boolean | null };
        const lat = Number(m[1]);
        const lng = Number(m[2]);
        return { line, lat, lng, label: m[3].trim(), inside: pointInPolys(lat, lng, polys) };
      });
  }, [pointInput, polys]);

  const insideCount = results.filter((r) => r.inside === true).length;

  return (
    <ToolShell
      title="Point-in-Polygon Tester"
      khmerTitle="ឧបករណ៍ពិនិត្យចំណុចក្នុងពហុកោណ"
      description="Check whether coordinates fall inside a polygon or boundary. Paste a GeoJSON Polygon/MultiPolygon (or lat,lng vertices) and a list of points — single or batch."
      descriptionKm="ពិនិត្យថាតើកូអរដោនេស្ថិតនៅក្នុងពហុកោណ ឬព្រំដែនដែរឬទេ។ បិទភ្ជាប់ GeoJSON Polygon/MultiPolygon (ឬចំណុច lat,lng) និងបញ្ជីចំណុច — មួយ ឬច្រើន។"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Field label="Polygon (GeoJSON or lat,lng per line)" labelKm="ពហុកោណ (GeoJSON ឬ lat,lng ក្នុងមួយបន្ទាត់)">
          <TextArea rows={7} value={polyInput} onChange={(e) => setPolyInput(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label="Points (lat,lng optional label — one per line)" labelKm="ចំណុច (lat,lng ស្លាកស្រេចចិត្ត — មួយបន្ទាត់មួយ)">
          <TextArea rows={7} value={pointInput} onChange={(e) => setPointInput(e.target.value)} className="font-mono-ui" />
        </Field>
      </div>

      {error && <p role="status" className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">{error}</p>}

      {!error && polys.length > 0 && results.length > 0 && (
        <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-[var(--ink)]">{t("Results", "លទ្ធផល")}</h2>
            <span className="text-xs text-[var(--ink-dim)]">{insideCount} / {results.length} {t("inside", "នៅក្នុង")}</span>
          </div>
          <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--ground-line)] bg-[var(--ground-raised-hi)] text-[var(--ink-dim)]">
                  <th className="p-2.5 font-medium">{t("Point", "ចំណុច")}</th>
                  <th className="p-2.5 font-medium">{t("Label", "ស្លាក")}</th>
                  <th className="p-2.5 font-medium text-right">{t("Result", "លទ្ធផល")}</th>
                </tr>
              </thead>
              <tbody className="text-[var(--ink)]">
                {results.map((r, i) => (
                  <tr key={i} className="border-b border-[var(--ground-line)]">
                    <td className="p-2.5 font-mono-ui">{r.lat === null ? r.line : `${r.lat}, ${r.lng}`}</td>
                    <td className="p-2.5">{r.label || "—"}</td>
                    <td className="p-2.5 text-right font-semibold">
                      {r.inside === null
                        ? <span className="text-[var(--danger)]">{t("invalid", "មិនត្រឹមត្រូវ")}</span>
                        : r.inside
                          ? <span className="text-emerald-500">{t("inside", "នៅក្នុង")}</span>
                          : <span className="text-[var(--ink-faint)]">{t("outside", "នៅក្រៅ")}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Uses the ray-casting test in longitude/latitude space — accurate for local boundaries; very large polygons spanning the antimeridian or poles are not handled. GeoJSON coordinates are read as [longitude, latitude]; plain lines as lat,lng. Polygon holes are respected.",
          "ប្រើវិធីបាញ់កាំរស្មីក្នុងលំហ រយៈបណ្តោយ/រយៈទទឹង — ត្រឹមត្រូវសម្រាប់ព្រំដែនតំបន់; ពហុកោណធំឆ្លងកាត់បន្ទាត់ផ្ទុយ ឬប៉ូលមិនត្រូវបានដោះស្រាយទេ។ កូអរដោនេ GeoJSON អានជា [រយៈបណ្តោយ, រយៈទទឹង]; បន្ទាត់ធម្មតាជា lat,lng។ រន្ធក្នុងពហុកោណត្រូវបានគោរព។"
        )}
      </p>
    </ToolShell>
  );
}
