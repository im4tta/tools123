"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function midpoint(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180, toDeg = (r: number) => (r * 180) / Math.PI;
  const [la1, lo1, la2, lo2] = [lat1, lon1, lat2, lon2].map(toRad);
  const bx = Math.cos(la2) * Math.cos(lo2 - lo1);
  const by = Math.cos(la2) * Math.sin(lo2 - lo1);
  const la3 = Math.atan2(Math.sin(la1) + Math.sin(la2), Math.sqrt((Math.cos(la1) + bx) ** 2 + by ** 2));
  const lo3 = lo1 + Math.atan2(by, Math.cos(la1) + bx);
  return { lat: toDeg(la3), lng: toDeg(lo3) };
}

export default function Midpoint() {
  const [a, setA] = useToolState("midpoint:a", { lat: "11.5564", lng: "104.9282" });
  const [b, setB] = useToolState("midpoint:b", { lat: "10.6104", lng: "104.1817" });
  const result = useMemo(() => {
    const nums = [a.lat, a.lng, b.lat, b.lng].map(Number);
    if (nums.some(isNaN)) return null;
    return midpoint(nums[0], nums[1], nums[2], nums[3]);
  }, [a, b]);

  return (
    <ToolShell title="Midpoint Calculator" description="Find the geographic midpoint along the great-circle path between two coordinates.">
      <Row>
        <Field label="Point A"><div className="flex gap-2"><TextInput value={a.lat} onChange={(e) => setA({ ...a, lat: e.target.value })} className="font-mono-ui" /><TextInput value={a.lng} onChange={(e) => setA({ ...a, lng: e.target.value })} className="font-mono-ui" /></div></Field>
        <Field label="Point B"><div className="flex gap-2"><TextInput value={b.lat} onChange={(e) => setB({ ...b, lat: e.target.value })} className="font-mono-ui" /><TextInput value={b.lng} onChange={(e) => setB({ ...b, lng: e.target.value })} className="font-mono-ui" /></div></Field>
      </Row>
      <Output label="Midpoint" value={result ? `${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}` : ""} error={!result} />
    </ToolShell>
  );
}
