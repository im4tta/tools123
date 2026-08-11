"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

// Simplified spherical Transverse Mercator — good to a few meters, fine for
// quick reference. Cambodia sits in UTM zone 48N / 49N.
const a = 6378137, k0 = 0.9996;

function latLngToUtm(lat: number, lon: number, zone: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const lon0 = toRad((zone - 1) * 6 - 180 + 3);
  const phi = toRad(lat), lambda = toRad(lon);
  const N = a / Math.sqrt(1 - 0.00669438 * Math.sin(phi) ** 2);
  const T = Math.tan(phi) ** 2;
  const C = 0.00669438 * Math.cos(phi) ** 2;
  const A = Math.cos(phi) * (lambda - lon0);
  const M = a * ((1 - 0.00669438 / 4 - (3 * 0.00669438 ** 2) / 64) * phi
    - ((3 * 0.00669438) / 8) * Math.sin(2 * phi));
  const easting = k0 * N * (A + (A ** 3 / 6) * (1 - T + C)) + 500000;
  let northing = k0 * (M + N * Math.tan(phi) * (A ** 2 / 2));
  if (lat < 0) northing += 10000000;
  return { easting, northing };
}

export default function UtmConverter() {
  const [lat, setLat] = useToolState("utm-converter:lat", "11.5564");
  const [lng, setLng] = useToolState("utm-converter:lng", "104.9282");
  const zone = useMemo(() => Math.floor((Number(lng) + 180) / 6) + 1, [lng]);

  const result = useMemo(() => {
    const la = Number(lat), lo = Number(lng);
    if (isNaN(la) || isNaN(lo) || isNaN(zone)) return null;
    return latLngToUtm(la, lo, zone);
  }, [lat, lng, zone]);

  return (
    <ToolShell title="Lat/Lng → UTM" description="Approximate spherical conversion to Universal Transverse Mercator — Cambodia falls mostly in zone 48N. Good for quick reference, not survey-grade.">
      <Row>
        <Field label="Latitude"><TextInput value={lat} onChange={(e) => setLat(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Longitude"><TextInput value={lng} onChange={(e) => setLng(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label={`Zone ${zone}${Number(lat) >= 0 ? "N" : "S"}`} value={result ? `E ${result.easting.toFixed(2)}  N ${result.northing.toFixed(2)}` : ""} error={!result} />
    </ToolShell>
  );
}
