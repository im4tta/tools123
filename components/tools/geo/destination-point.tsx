"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function destination(lat: number, lon: number, bearingDeg: number, distM: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180, toDeg = (r: number) => (r * 180) / Math.PI;
  const la1 = toRad(lat), lo1 = toRad(lon), brng = toRad(bearingDeg), d = distM / R;
  const la2 = Math.asin(Math.sin(la1) * Math.cos(d) + Math.cos(la1) * Math.sin(d) * Math.cos(brng));
  const lo2 = lo1 + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(la1), Math.cos(d) - Math.sin(la1) * Math.sin(la2));
  return { lat: toDeg(la2), lng: toDeg(lo2) };
}

export default function DestinationPoint() {
  const [lat, setLat] = useToolState("destination-point:lat", "11.5564");
  const [lng, setLng] = useToolState("destination-point:lng", "104.9282");
  const [brng, setBrng] = useToolState("destination-point:brng", "45");
  const [dist, setDist] = useToolState("destination-point:dist", "10000");

  const result = useMemo(() => {
    const nums = [lat, lng, brng, dist].map(Number);
    if (nums.some(isNaN)) return null;
    return destination(nums[0], nums[1], nums[2], nums[3]);
  }, [lat, lng, brng, dist]);

  return (
    <ToolShell title="Destination Point Calculator" description="Given a start point, bearing, and distance, compute the resulting coordinate — useful for laying out survey or canal alignment points.">
      <Row>
        <Field label="Start latitude"><TextInput value={lat} onChange={(e) => setLat(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Start longitude"><TextInput value={lng} onChange={(e) => setLng(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Row>
        <Field label="Bearing (°)"><TextInput value={brng} onChange={(e) => setBrng(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Distance (m)"><TextInput value={dist} onChange={(e) => setDist(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="Destination" value={result ? `${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}` : ""} error={!result} />
    </ToolShell>
  );
}
