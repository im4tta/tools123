"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function BoundingBox() {
  const [lat, setLat] = useToolState("bounding-box:lat", "11.5564");
  const [lng, setLng] = useToolState("bounding-box:lng", "104.9282");
  const [radiusKm, setRadiusKm] = useToolState("bounding-box:radiusKm", "5");

  const box = useMemo(() => {
    const la = Number(lat), lo = Number(lng), r = Number(radiusKm);
    if ([la, lo, r].some(isNaN)) return null;
    const dLat = r / 111.32;
    const dLng = r / (111.32 * Math.cos((la * Math.PI) / 180));
    return { minLat: la - dLat, maxLat: la + dLat, minLng: lo - dLng, maxLng: lo + dLng };
  }, [lat, lng, radiusKm]);

  return (
    <ToolShell title="Bounding Box Calculator" description="Compute a lat/lng bounding box around a center point for a given radius, ready to paste into a map API bbox parameter.">
      <Row>
        <Field label="Center latitude"><TextInput value={lat} onChange={(e) => setLat(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Center longitude"><TextInput value={lng} onChange={(e) => setLng(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Field label="Radius (km)"><TextInput value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} className="w-40 font-mono-ui" /></Field>
      <Output
        label="bbox (minLng,minLat,maxLng,maxLat)"
        value={box ? `${box.minLng.toFixed(6)},${box.minLat.toFixed(6)},${box.maxLng.toFixed(6)},${box.maxLat.toFixed(6)}` : ""}
        error={!box}
      />
    </ToolShell>
  );
}
