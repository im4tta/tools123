"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import airportsData from "@/data/airports.json";
import coordRows from "@/data/airport-coords.json";

// Airport data © OurAirports (Public Domain); coordinates from OurAirports CSV.
type AirportRow = [string, string, string, string, string, string];
const AIRPORTS = airportsData.airports as AirportRow[];
type Coord = { iata: string; icao: string; lat: number; lon: number };
const COORD_BY_CODE = new Map<string, Coord>();
for (const c of coordRows as Coord[]) {
  if (c.iata) COORD_BY_CODE.set(c.iata.toUpperCase(), c);
  if (!c.iata && c.icao) COORD_BY_CODE.set(c.icao.toUpperCase(), c);
}

const toRad = (d: number) => (d * Math.PI) / 180;
function haversineKm(a: Coord, b: Coord): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

function emptyGeoJson(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

function searchAirports(q: string): AirportRow[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  return AIRPORTS.filter(([iata, icao, name, city, country]) =>
    iata.toLowerCase() === needle || icao.toLowerCase() === needle ||
    name.toLowerCase().includes(needle) || city.toLowerCase().includes(needle) || country.toLowerCase() === needle
  ).slice(0, 8);
}

export default function RouteOnMap() {
  const { text: t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [originQ, setOriginQ] = useToolState("route-map:origin", "PNH");
  const [destQ, setDestQ] = useToolState("route-map:dest", "SIN");
  const [showSearch, setShowSearch] = useState<"origin" | "dest" | null>(null);
  const [ready, setReady] = useState(false);

  const oCoord = useMemo(() => COORD_BY_CODE.get(originQ.trim().toUpperCase()) ?? null, [originQ]);
  const dCoord = useMemo(() => COORD_BY_CODE.get(destQ.trim().toUpperCase()) ?? null, [destQ]);
  const oAirport = useMemo(() => AIRPORTS.find((a) => a[0].toUpperCase() === originQ.trim().toUpperCase()), [originQ]);
  const dAirport = useMemo(() => AIRPORTS.find((a) => a[0].toUpperCase() === destQ.trim().toUpperCase()), [destQ]);

  const distanceKm = oCoord && dCoord ? haversineKm(oCoord, dCoord) : null;

  const originHits = useMemo(() => searchAirports(originQ), [originQ]);
  const destHits = useMemo(() => searchAirports(destQ), [destQ]);

  // Create map.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [104.92, 11.56],
      zoom: 5,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    mapRef.current = map;
    map.on("load", () => {
      setReady(true);
      map.addSource("route", { type: "geojson", data: emptyGeoJson() });
      map.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#b3402f", "line-width": 4 } });
    });
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Draw route + markers when coords change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const src = map.getSource("route") as maplibregl.GeoJSONSource | undefined;
    if (!oCoord || !dCoord) {
      // No valid route; clear the line.
      if (src) src.setData(emptyGeoJson());
      return;
    }
    const pts: [number, number][] = [
      [oCoord.lon, oCoord.lat],
      [dCoord.lon, dCoord.lat],
    ];
    const feat: GeoJSON.Feature = {
      type: "Feature",
      geometry: { type: "LineString", coordinates: pts },
      properties: {},
    };
    src?.setData({ type: "FeatureCollection", features: [feat] } as unknown as GeoJSON.FeatureCollection);

    // Focus the map on the route.
    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([oCoord.lon, oCoord.lat] as [number, number]);
    bounds.extend([dCoord.lon, dCoord.lat] as [number, number]);
    map.fitBounds(bounds, { padding: 80, maxZoom: 12 });
  }, [oCoord, dCoord, ready]);

  // Markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.getContainer().querySelectorAll(".route-marker").forEach((el) => el.remove());
    const add = (c: Coord | null, label: string) => {
      if (!c) return;
      const el = document.createElement("div");
      el.className = "route-marker";
      el.style.background = "#b3402f";
      el.style.border = "2px solid #fff";
      el.style.borderRadius = "50%";
      el.style.width = "14px";
      el.style.height = "14px";
      el.style.boxShadow = "0 0 0 3px rgba(179,64,47,0.35)";
      el.title = label;
      new maplibregl.Marker({ element: el }).setLngLat([c.lon, c.lat]).addTo(map);
    };
    add(oCoord, `${originQ}: ${oAirport?.[2] ?? ""}`);
    add(dCoord, `${destQ}: ${dAirport?.[2] ?? ""}`);
  }, [oCoord, dCoord, ready, originQ, destQ, oAirport, dAirport]);

  return (
    <ToolShell
      title="Route on Map"
      khmerTitle="ផ្លូវហោះហើរលើផែនទី"
      description="Draw a great-circle route between two airports on a real map and see the distance — using real OurAirports coordinates."
      descriptionKm="គូសផ្លូវរវាងអាកាសយានដ្ឋានពីរលើផែនទីផ្ទាល់ និងមើលចម្ងាយ — ដោយប្រើកូអរដោនេពិតប្រាកដពី OurAirports។"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("Origin — IATA / name", "ចំណុចចេញ — IATA / ឈ្មោះ")}>
          <TextInput value={originQ} onChange={(e) => { setOriginQ(e.target.value); setShowSearch("origin"); }} placeholder="PNH" className="font-mono-ui" />
          {showSearch === "origin" && originHits.length > 0 && (
            <div className="mt-1 overflow-hidden rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] text-sm">
              {originHits.map((row, i) => (
                <button key={i} type="button" onClick={() => { setOriginQ(row[0]); setShowSearch(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[var(--ground-line)]">
                  <span className="font-mono-ui text-[var(--gold)]">{row[0]}</span>
                  <span className="truncate text-[var(--ink)]">{row[2]}</span>
                  <span className="ml-auto text-xs text-[var(--ink-faint)]">{row[3]}, {row[4]}</span>
                </button>
              ))}
            </div>
          )}
        </Field>
        <Field label={t("Destination — IATA / name", "គោលដៅ — IATA / ឈ្មោះ")}>
          <TextInput value={destQ} onChange={(e) => { setDestQ(e.target.value); setShowSearch("dest"); }} placeholder="SIN" className="font-mono-ui" />
          {showSearch === "dest" && destHits.length > 0 && (
            <div className="mt-1 overflow-hidden rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] text-sm">
              {destHits.map((row, i) => (
                <button key={i} type="button" onClick={() => { setDestQ(row[0]); setShowSearch(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[var(--ground-line)]">
                  <span className="font-mono-ui text-[var(--gold)]">{row[0]}</span>
                  <span className="truncate text-[var(--ink)]">{row[2]}</span>
                  <span className="ml-auto text-xs text-[var(--ink-faint)]">{row[3]}, {row[4]}</span>
                </button>
              ))}
            </div>
          )}
        </Field>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-[var(--ground-line)]">
        <div ref={containerRef} className="h-[420px] w-full" />
        {!ready && <div className="absolute inset-0 flex items-center justify-center bg-[var(--ground-raised)] text-sm text-[var(--ink-dim)]"><Loader2 size={14} className="mr-1 inline animate-spin" />{t("Loading map…", "កំពុងផ្ទុកផែនទី…")}</div>}
        <div className="absolute bottom-1 right-2 text-[10px] text-[var(--ink-dim)] opacity-70">© OpenFreeMap · © OpenStreetMap contributors</div>
      </div>

      <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{t("Route", "ផ្លូវ")}</div>
        {oCoord && dCoord && distanceKm ? (
          <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Output label={t("Origin", "ចំណុចចេញ")} value={oAirport ? `${oAirport[0]} — ${oAirport[3]}` : originQ} error={!oAirport} />
            <Output label={t("Destination", "គោលដៅ")} value={dAirport ? `${dAirport[0]} — ${dAirport[3]}` : destQ} error={!dAirport} />
            <Output label={t("Distance", "ចម្ងាយ")} value={`${distanceKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} km`} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--ink-dim)]">{t("Enter two valid airport codes with coordinates to draw the route.", "បញ្ចូលលេខកូដអាកាសយានដ្ឋានត្រឹមត្រូវពីរ ដើម្បីគូសផ្លូវ។")}</p>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-[var(--ink-faint)]">
        {t("Live basemap · route drawn from real OurAirports coordinates (Public Domain); the great-circle line is illustrative, not the actual flight path.", "ផ្ទៃខាងក្រោយផ្ទាល់ · ផ្លូវគូសពីកូអរដោនេ OurAirports ពិតប្រាកដ (Public Domain) ជាបន្ទាត់ប្រហាក់ប្រហែល មិនមែនជាផ្លូវហោះពិតទេ។")}
      </p>
    </ToolShell>
  );
}
