"use client";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function ddToDms(dd: number, isLat: boolean) {
  const dir = isLat ? (dd >= 0 ? "N" : "S") : dd >= 0 ? "E" : "W";
  const abs = Math.abs(dd);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = ((minFloat - min) * 60).toFixed(2);
  return `${deg}° ${min}' ${sec}" ${dir}`;
}

export default function DmsConverter() {
  const [lat, setLat] = useToolState("dms-converter:lat", "11.556");
  const [lng, setLng] = useToolState("dms-converter:lng", "104.928");

  const latN = Number(lat), lngN = Number(lng);
  const valid = !isNaN(latN) && !isNaN(lngN);

  return (
    <ToolShell title="Decimal Degrees ⟷ DMS" description="Convert latitude/longitude between decimal degrees and degrees-minutes-seconds. Defaults are Phnom Penh.">
      <Row>
        <Field label="Latitude (decimal)"><TextInput value={lat} onChange={(e) => setLat(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Longitude (decimal)"><TextInput value={lng} onChange={(e) => setLng(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="DMS" value={valid ? `${ddToDms(latN, true)}, ${ddToDms(lngN, false)}` : ""} error={!valid} />
    </ToolShell>
  );
}
