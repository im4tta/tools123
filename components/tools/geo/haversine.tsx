"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function Haversine() {
  const [a, setA] = useToolState("haversine:a", { lat: "11.5564", lng: "104.9282" });
  const [b, setB] = useToolState("haversine:b", { lat: "11.0686", lng: "104.9531" });

  const meters = useMemo(() => {
    const nums = [a.lat, a.lng, b.lat, b.lng].map(Number);
    if (nums.some(isNaN)) return null;
    return haversine(nums[0], nums[1], nums[2], nums[3]);
  }, [a, b]);

  return (
    <ToolShell title="Haversine Distance" description="Great-circle distance between two lat/lng points — defaults are Phnom Penh to Takhmau.">
      <Row>
        <Field label="Point A"><div className="flex gap-2"><TextInput value={a.lat} onChange={(e) => setA({ ...a, lat: e.target.value })} placeholder="lat" className="font-mono-ui" /><TextInput value={a.lng} onChange={(e) => setA({ ...a, lng: e.target.value })} placeholder="lng" className="font-mono-ui" /></div></Field>
        <Field label="Point B"><div className="flex gap-2"><TextInput value={b.lat} onChange={(e) => setB({ ...b, lat: e.target.value })} placeholder="lat" className="font-mono-ui" /><TextInput value={b.lng} onChange={(e) => setB({ ...b, lng: e.target.value })} placeholder="lng" className="font-mono-ui" /></div></Field>
      </Row>
      <Output label="Distance" value={meters === null ? "" : `${meters.toFixed(1)} m  ·  ${(meters / 1000).toFixed(3)} km`} error={meters === null} />
    </ToolShell>
  );
}
