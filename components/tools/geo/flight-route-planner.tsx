"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import airportsData from "@/data/airports.json";
import coordRows from "@/data/airport-coords.json";

// Airport data © OurAirports (Public Domain) — see https://ourairports.com/data/.
// The coordinates are bundled from the OurAirports CSV so distance is real and
// computes instantly/offline, with a live CSV re-fetch as a fallback.
type AirportRow = [string, string, string, string, string, string];
const AIRPORTS = airportsData.airports as AirportRow[];

type Coord = { iata: string; icao: string; lat: number; lon: number };
const BUNDLED_COORDS = coordRows as Coord[];
const CSV_URL = "https://ourairports.com/data/airports.csv";

// Fast lookup index: code -> coord. Built once from the bundled data.
const COORD_BY_CODE = new Map<string, Coord>();
for (const c of BUNDLED_COORDS) {
  if (c.iata) COORD_BY_CODE.set(c.iata.toUpperCase(), c);
  // Prefer IATA as the lookup key; fall back to icao only if iata is missing.
  if (!c.iata && c.icao) COORD_BY_CODE.set(c.icao.toUpperCase(), c);
}

// Live fallback: fetch the full CSV once and merge any codes missing from the bundle.
let liveLoaded = false;
async function mergeLiveCoords(): Promise<void> {
  if (liveLoaded || COORD_BY_CODE.size > 4000) return;
  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error(String(res.status));
    const csv = await res.text();
    const lines = csv.split("\n");
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const c = parseCsvLine(line);
      if (c.length < 14) continue;
      const iata = (c[13] || "").trim().toUpperCase();
      const icao = (c[12] || "").trim().toUpperCase();
      const lat = Number(c[4]);
      const lon = Number(c[5]);
      if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
      const key = iata || icao;
      if (key && !COORD_BY_CODE.has(key)) COORD_BY_CODE.set(key, { iata, icao, lat, lon });
    }
  } catch {
    // Bundled data is the source of truth; a failed refresh is non-fatal.
  } finally {
    liveLoaded = true;
  }
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

const toRad = (d: number) => (d * Math.PI) / 180;
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function searchAirports(q: string): AirportRow[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  return AIRPORTS.filter(([iata, icao, name, city, country]) =>
    iata.toLowerCase() === needle ||
    icao.toLowerCase() === needle ||
    name.toLowerCase().includes(needle) ||
    city.toLowerCase().includes(needle) ||
    country.toLowerCase() === needle
  ).slice(0, 8);
}

export default function FlightRoutePlanner() {
  const { text: t } = useLanguage();
  const [originQ, setOriginQ] = useToolState("flight-route:origin", "PNH");
  const [destQ, setDestQ] = useToolState("flight-route:dest", "SIN");
  const [cruise, setCruise] = useToolState("flight-route:cruise", "850");
  const [showSearch, setShowSearch] = useState<"origin" | "dest" | null>(null);

  // Synchronously resolve coords from the bundled index; kick off a live refresh
  // to top up any airport codes missing from the bundle.
  useMemo(() => { void mergeLiveCoords(); }, []);

  const originHits = useMemo(() => searchAirports(originQ), [originQ]);
  const destHits = useMemo(() => searchAirports(destQ), [destQ]);

  const oCoord = useMemo(() => {
    const code = originQ.trim().toUpperCase();
    return COORD_BY_CODE.get(code) ?? null;
  }, [originQ]);
  const dCoord = useMemo(() => {
    const code = destQ.trim().toUpperCase();
    return COORD_BY_CODE.get(code) ?? null;
  }, [destQ]);

  const distanceKm = oCoord && dCoord ? haversineKm(oCoord.lat, oCoord.lon, dCoord.lat, dCoord.lon) : null;
  const cruiseKph = Number(cruise) || 850;
  const flightHours = distanceKm && cruiseKph > 0 ? distanceKm / cruiseKph : null;
  const flightH = flightHours ? Math.floor(flightHours) : null;
  const flightM = flightHours ? Math.round((flightHours - Math.floor(flightHours)) * 60) : null;

  const oAirport = useMemo(() => AIRPORTS.find((a) => a[0].toUpperCase() === originQ.trim().toUpperCase()), [originQ]);
  const dAirport = useMemo(() => AIRPORTS.find((a) => a[0].toUpperCase() === destQ.trim().toUpperCase()), [destQ]);

  return (
    <ToolShell
      title="Flight Route Planner"
      khmerTitle="អ្នករៀបចំផ្លូវហោះហើរ"
      description="Compute the great-circle distance and estimated cruise time between two airports using real OurAirports coordinates — a truthful reference, not a live fare scanner."
      descriptionKm="គណនាចម្ងាយផ្ទៃធំ និងពេលវេលាហោះប៉ាន់ស្មានរវាងអាកាសយានដ្ឋានពីរ ដោយប្រើកូអរដោនេពិតប្រាកដពី OurAirports — ជាឯកសារយោងដ៏ពិតប្រាកដ មិនមែនជាឧបករណ៍ស្កេនតម្លៃផ្ទាល់ទេ។"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("Origin — IATA / name", "ចំណុចចេញ — IATA / ឈ្មោះ")}>
          <TextInput
            value={originQ}
            onChange={(e) => { setOriginQ(e.target.value); setShowSearch("origin"); }}
            placeholder={t("e.g. PNH or Phnom Penh", "ឧ. PNH ឬ ភ្នំពេញ")}
            className="font-mono-ui"
          />
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
          <TextInput
            value={destQ}
            onChange={(e) => { setDestQ(e.target.value); setShowSearch("dest"); }}
            placeholder={t("e.g. SIN or Singapore", "ឧ. SIN ឬ សិង្ហបុរី")}
            className="font-mono-ui"
          />
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

      <Field label={t("Assumed cruise speed (km/h)", "ល្បឿនហោះសន្មត (គីឡូម៉ែត្រ/ម៉ោង)")}>
        <TextInput value={cruise} onChange={(e) => setCruise(e.target.value)} className="w-32 font-mono-ui" />
      </Field>

      <Row>
        <Field label={t("Origin", "ចំណុចចេញ")}>
          <Output value={oAirport ? `${oAirport[0]} — ${oAirport[2]}, ${oAirport[3]}` : (originQ || "")} error={!oAirport} />
        </Field>
        <Field label={t("Destination", "គោលដៅ")}>
          <Output value={dAirport ? `${dAirport[0]} — ${dAirport[2]}, ${dAirport[3]}` : (destQ || "")} error={!dAirport} />
        </Field>
      </Row>

      <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{t("Route summary", "សេចក្តីសង្ខេបផ្លូវ")}</div>
        {oCoord && dCoord && distanceKm ? (
          <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <div className="text-2xl font-semibold text-[var(--ink)]">{distanceKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} km</div>
              <div className="text-xs text-[var(--ink-faint)]">{t("Great-circle distance", "ចម្ងាយផ្ទៃធំ")}</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-[var(--ink)]">{flightH}h {flightM}m</div>
              <div className="text-xs text-[var(--ink-faint)]">{t("Estimated cruise time", "ពេលវេលាហោះប៉ាន់ស្មាន")}</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-[var(--ink)]">{cruiseKph.toLocaleString()} km/h</div>
              <div className="text-xs text-[var(--ink-faint)]">{t("Assumed cruise speed", "ល្បឿនហោះសន្មត")}</div>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--ink-dim)]">
            {oAirport && dAirport
              ? t("Coordinates for one of these weren't available (OurAirports). Try another airport code.", "កូអរដោនេសម្រាប់អាកាសយានដ្ឋានមួយមិនមានទេ (OurAirports)។ សូមសាកលេខកូដអាកាសយានដ្ឋានផ្សេង។")
              : t("Pick both a valid origin and destination to see the route.", "ជ្រើសរើសចំណុចចេញ និងគោលដៅត្រឹមត្រូវដើម្បីមើលផ្លូវ។")}
          </p>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-[var(--ink-faint)]">
        {t("Distance is the great-circle (straight-line) length between two airports, computed from real OurAirports coordinates (Public Domain). Estimated cruise time = distance ÷ your assumed speed. This is a distance reference — it does not fetch live fares or flight schedules.", "ចម្ងាយគឺជាប្រវែងផ្ទៃធំ (បន្ទាត់ត្រង់) រវាងអាកាសយានដ្ឋានពីរ គណនាពីកូអរដោនេ OurAirports ពិតប្រាកដ (Public Domain)។ ពេលហោះប៉ាន់ស្មាន = ចម្ងាយ ÷ ល្បឿនសន្មត។ នេះជាឯកសារយោងចម្ងាយ — មិនទាញយកតម្លៃជើងហោះ ឬកាលវិភាគផ្ទាល់ទេ។")}
      </p>
    </ToolShell>
  );
}
