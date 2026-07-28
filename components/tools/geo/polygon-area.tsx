"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

// Shoelace formula on an equirectangular projection — fine for small parcels.
function polygonAreaM2(points: [number, number][]) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const lat0 = points.reduce((s, p) => s + p[0], 0) / points.length;
  const xy = points.map(([lat, lng]) => [
    toRad(lng) * R * Math.cos(toRad(lat0)),
    toRad(lat) * R,
  ]);
  let sum = 0;
  for (let i = 0; i < xy.length; i++) {
    const [x1, y1] = xy[i];
    const [x2, y2] = xy[(i + 1) % xy.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum / 2);
}

export default function PolygonArea() {
  const [input, setInput] = useToolState("polygon-area:input", "11.5564,104.9282\n11.5600,104.9320\n11.5540,104.9350\n11.5510,104.9300");

  const { area, error } = useMemo(() => {
    try {
      const pts = input.trim().split("\n").filter(Boolean).map((line) => {
        const [lat, lng] = line.split(",").map((v) => Number(v.trim()));
        if (isNaN(lat) || isNaN(lng)) throw new Error("bad row");
        return [lat, lng] as [number, number];
      });
      if (pts.length < 3) return { area: null, error: "Need at least 3 points" };
      return { area: polygonAreaM2(pts), error: null };
    } catch {
      return { area: null, error: "Each line must be 'lat,lng'" };
    }
  }, [input]);

  return (
    <ToolShell title="Polygon Area Calculator" description="Paste polygon vertices as one 'lat,lng' pair per line and get the enclosed area — handy for parcel or canal-easement footprints.">
      <Field label="Vertices (lat,lng per line)"><TextArea rows={6} value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" /></Field>
      <Output
        label={error ?? "Area"}
        value={area === null ? "" : `${area.toFixed(1)} m²  ·  ${(area / 10000).toFixed(4)} ha`}
        error={!!error}
      />
    </ToolShell>
  );
}
