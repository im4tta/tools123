"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function ElevationGrade() {
  const [rise, setRise] = useToolState("elevation-grade:rise", "2.5");
  const [run, setRun] = useToolState("elevation-grade:run", "500");
  const r = Number(rise), d = Number(run);
  const pct = !isNaN(r) && !isNaN(d) && d !== 0 ? (r / d) * 100 : null;
  const deg = pct !== null ? Math.atan(r / d) * (180 / Math.PI) : null;

  return (
    <ToolShell title="Slope / Grade Calculator" description="Convert rise and run into a percent grade and angle — for canal, road, or drainage slope checks.">
      <Row>
        <Field label="Rise (elevation change, m)"><TextInput value={rise} onChange={(e) => setRise(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Run (horizontal distance, m)"><TextInput value={run} onChange={(e) => setRun(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="Grade" value={pct === null ? "" : `${pct.toFixed(3)} %`} error={pct === null} />
      <Output label="Angle" value={deg === null ? "" : `${deg.toFixed(3)}°`} error={deg === null} />
    </ToolShell>
  );
}
