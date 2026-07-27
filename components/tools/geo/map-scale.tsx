"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function MapScale() {
  const [ratio, setRatio] = useToolState("map-scale:ratio", "10000");
  const [mapDistanceCm, setMapDistanceCm] = useToolState("map-scale:mapDistanceCm", "5");
  const r = Number(ratio), cm = Number(mapDistanceCm);
  const groundM = !isNaN(r) && !isNaN(cm) ? (cm * r) / 100 : null;

  return (
    <ToolShell title="Map Scale Calculator" description="Given a map scale (e.g. 1:10,000) and a measured distance on the map, find the real-world ground distance.">
      <Row>
        <Field label="Scale — 1 : ___"><TextInput value={ratio} onChange={(e) => setRatio(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Distance on map (cm)"><TextInput value={mapDistanceCm} onChange={(e) => setMapDistanceCm(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="Ground distance" value={groundM === null ? "" : `${groundM.toLocaleString()} m  ·  ${(groundM / 1000).toFixed(3)} km`} error={groundM === null} />
    </ToolShell>
  );
}
