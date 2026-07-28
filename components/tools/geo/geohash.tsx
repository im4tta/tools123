"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

function encodeGeohash(lat: number, lon: number, precision = 9) {
  const latRange = [-90, 90], lonRange = [-180, 180];
  let hash = "", bit = 0, ch = 0, even = true;
  while (hash.length < precision) {
    if (even) {
      const mid = (lonRange[0] + lonRange[1]) / 2;
      if (lon > mid) { ch |= 1 << (4 - bit); lonRange[0] = mid; } else { lonRange[1] = mid; }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat > mid) { ch |= 1 << (4 - bit); latRange[0] = mid; } else { latRange[1] = mid; }
    }
    even = !even;
    if (bit < 4) bit++; else { hash += BASE32[ch]; bit = 0; ch = 0; }
  }
  return hash;
}

function decodeGeohash(hash: string) {
  const latRange = [-90, 90], lonRange = [-180, 180];
  let even = true;
  for (const c of hash.toLowerCase()) {
    const idx = BASE32.indexOf(c);
    if (idx === -1) return null;
    for (let bit = 4; bit >= 0; bit--) {
      const bitVal = (idx >> bit) & 1;
      if (even) {
        const mid = (lonRange[0] + lonRange[1]) / 2;
        if (bitVal) lonRange[0] = mid; else lonRange[1] = mid;
      } else {
        const mid = (latRange[0] + latRange[1]) / 2;
        if (bitVal) latRange[0] = mid; else latRange[1] = mid;
      }
      even = !even;
    }
  }
  return { lat: (latRange[0] + latRange[1]) / 2, lng: (lonRange[0] + lonRange[1]) / 2 };
}

export default function Geohash() {
  const [lat, setLat] = useToolState("geohash:lat", "11.5564");
  const [lng, setLng] = useToolState("geohash:lng", "104.9282");
  const [hash, setHash] = useToolState("geohash:hash", "");

  const encoded = useMemo(() => {
    const la = Number(lat), lo = Number(lng);
    return isNaN(la) || isNaN(lo) ? null : encodeGeohash(la, lo);
  }, [lat, lng]);

  const decoded = useMemo(() => (hash ? decodeGeohash(hash) : null), [hash]);

  return (
    <ToolShell title="Geohash Encoder / Decoder" description="Convert lat/lng to a geohash string and back — useful for compact location keys and proximity bucketing.">
      <Row>
        <Field label="Latitude"><TextInput value={lat} onChange={(e) => setLat(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Longitude"><TextInput value={lng} onChange={(e) => setLng(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="Geohash" value={encoded ?? ""} error={!encoded} />
      <Field label="Geohash to decode"><TextInput value={hash} onChange={(e) => setHash(e.target.value)} placeholder="w4vrq..." className="font-mono-ui" /></Field>
      <Output label="Decoded center" value={decoded ? `${decoded.lat.toFixed(6)}, ${decoded.lng.toFixed(6)}` : ""} error={!!hash && !decoded} />
    </ToolShell>
  );
}
