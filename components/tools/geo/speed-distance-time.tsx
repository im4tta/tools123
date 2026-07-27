"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

interface State {
  solveFor: "speed" | "distance" | "time";
  distance: number;
  distanceUnit: "km" | "mi";
  speed: number;
  speedUnit: "kmh" | "mph";
  hours: number;
  minutes: number;
}

const initial: State = {
  solveFor: "time",
  distance: 100,
  distanceUnit: "km",
  speed: 60,
  speedUnit: "kmh",
  hours: 1,
  minutes: 40,
};

export default function SpeedDistanceTimeTool() {
  const [s, setS] = useToolState<State>("speed-distance-time", initial);
  const update = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }));

  // Normalize to km and km/h internally.
  const distanceKm = s.distanceUnit === "mi" ? s.distance * 1.60934 : s.distance;
  const speedKmh = s.speedUnit === "mph" ? s.speed * 1.60934 : s.speed;
  const timeHours = s.hours + s.minutes / 60;

  const result = useMemo(() => {
    if (s.solveFor === "time") {
      if (speedKmh <= 0) return "Speed must be greater than 0";
      const t = distanceKm / speedKmh;
      const h = Math.floor(t);
      const m = Math.round((t - h) * 60);
      return `Time: ${h}h ${m}m`;
    }
    if (s.solveFor === "distance") {
      const d = speedKmh * timeHours;
      return `Distance: ${d.toLocaleString(undefined, { maximumFractionDigits: 2 })} km (${(d / 1.60934).toLocaleString(undefined, { maximumFractionDigits: 2 })} mi)`;
    }
    if (timeHours <= 0) return "Time must be greater than 0";
    const sp = distanceKm / timeHours;
    return `Speed: ${sp.toLocaleString(undefined, { maximumFractionDigits: 2 })} km/h (${(sp / 1.60934).toLocaleString(undefined, { maximumFractionDigits: 2 })} mph)`;
  }, [s.solveFor, distanceKm, speedKmh, timeHours]);

  return (
    <ToolShell
      title="Speed / Distance / Time Calculator"
      description="Pick which value to solve for, then fill in the other two — handles km and miles interchangeably."
    >
      <Field label="Solve for">
        <Select value={s.solveFor} onChange={(e) => update({ solveFor: e.target.value as State["solveFor"] })}>
          <option value="time">Time</option>
          <option value="distance">Distance</option>
          <option value="speed">Speed</option>
        </Select>
      </Field>
      {s.solveFor !== "distance" && (
        <Row>
          <Field label="Distance">
            <TextInput type="number" value={s.distance} onChange={(e) => update({ distance: Number(e.target.value) })} />
          </Field>
          <Field label="Unit">
            <Select value={s.distanceUnit} onChange={(e) => update({ distanceUnit: e.target.value as State["distanceUnit"] })}>
              <option value="km">km</option>
              <option value="mi">miles</option>
            </Select>
          </Field>
        </Row>
      )}
      {s.solveFor !== "speed" && (
        <Row>
          <Field label="Speed">
            <TextInput type="number" value={s.speed} onChange={(e) => update({ speed: Number(e.target.value) })} />
          </Field>
          <Field label="Unit">
            <Select value={s.speedUnit} onChange={(e) => update({ speedUnit: e.target.value as State["speedUnit"] })}>
              <option value="kmh">km/h</option>
              <option value="mph">mph</option>
            </Select>
          </Field>
        </Row>
      )}
      {s.solveFor !== "time" && (
        <Row>
          <Field label="Hours">
            <TextInput type="number" min={0} value={s.hours} onChange={(e) => update({ hours: Number(e.target.value) })} />
          </Field>
          <Field label="Minutes">
            <TextInput type="number" min={0} max={59} value={s.minutes} onChange={(e) => update({ minutes: Number(e.target.value) })} />
          </Field>
        </Row>
      )}
      <Output label="Result" value={result} mono={false} />
    </ToolShell>
  );
}
