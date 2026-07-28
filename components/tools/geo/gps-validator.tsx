"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";

export default function GpsValidatorTool() {
  const [lat, setLat] = useState("11.5564");
  const [lng, setLng] = useState("104.9282");

  const result = useMemo(() => {
    const latNum = Number(lat.trim());
    const lngNum = Number(lng.trim());
    const issues: string[] = [];

    if (lat.trim() === "" || Number.isNaN(latNum)) issues.push("Latitude is not a valid number.");
    else if (latNum < -90 || latNum > 90) issues.push("Latitude must be between -90 and 90.");

    if (lng.trim() === "" || Number.isNaN(lngNum)) issues.push("Longitude is not a valid number.");
    else if (lngNum < -180 || lngNum > 180) issues.push("Longitude must be between -180 and 180.");

    const valid = issues.length === 0;
    let hemisphere = "";
    if (valid) {
      hemisphere = `${latNum >= 0 ? "N" : "S"} ${lngNum >= 0 ? "E" : "W"}`;
    }
    return { valid, issues, latNum, lngNum, hemisphere };
  }, [lat, lng]);

  return (
    <ToolShell
      title="GPS Coordinate Validator"
      description="Check whether a latitude/longitude pair is within valid range and see which hemisphere it falls in."
    >
      <Row>
        <Field label="Latitude">
          <TextInput value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-90 to 90" />
        </Field>
        <Field label="Longitude">
          <TextInput value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-180 to 180" />
        </Field>
      </Row>
      <Output
        label="Result"
        mono={false}
        error={!result.valid}
        value={
          result.valid
            ? `✓ Valid coordinate\nHemisphere: ${result.hemisphere}\nLat: ${result.latNum}, Lng: ${result.lngNum}`
            : result.issues.join("\n")
        }
      />
    </ToolShell>
  );
}
