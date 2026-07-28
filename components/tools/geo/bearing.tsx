"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function bearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180, toDeg = (r: number) => (r * 180) / Math.PI;
  const [la1, lo1, la2, lo2] = [lat1, lon1, lat2, lon2].map(toRad);
  const y = Math.sin(lo2 - lo1) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(lo2 - lo1);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

const COMPASS = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];

export default function Bearing() {
  const [a, setA] = useToolState("bearing:a", { lat: "11.5564", lng: "104.9282" });
  const [b, setB] = useToolState("bearing:b", { lat: "13.3671", lng: "103.8448" });
  const deg = useMemo(() => {
    const nums = [a.lat, a.lng, b.lat, b.lng].map(Number);
    if (nums.some(isNaN)) return null;
    return bearing(nums[0], nums[1], nums[2], nums[3]);
  }, [a, b]);
  const compass = deg === null ? "" : COMPASS[Math.round(deg / 22.5) % 16];

  return (
    <ToolShell title="Bearing / Azimuth Calculator" description="Compute the initial compass bearing from point A to point B — defaults run Phnom Penh to Siem Reap.">
      <Row>
        <Field label="Point A"><div className="flex gap-2"><TextInput value={a.lat} onChange={(e) => setA({ ...a, lat: e.target.value })} className="font-mono-ui" /><TextInput value={a.lng} onChange={(e) => setA({ ...a, lng: e.target.value })} className="font-mono-ui" /></div></Field>
        <Field label="Point B"><div className="flex gap-2"><TextInput value={b.lat} onChange={(e) => setB({ ...b, lat: e.target.value })} className="font-mono-ui" /><TextInput value={b.lng} onChange={(e) => setB({ ...b, lng: e.target.value })} className="font-mono-ui" /></div></Field>
      </Row>
      <Output label="Bearing" value={deg === null ? "" : `${deg.toFixed(1)}°  (${compass})`} error={deg === null} />
    </ToolShell>
  );
}
