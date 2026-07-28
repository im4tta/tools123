"use client";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const PHASES = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
const SYNODIC_MONTH = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

export default function MoonPhaseCalculator() {
  const [date, setDate] = useToolState("moon-phase-calculator:date", new Date().toISOString().slice(0, 10));
  const d = new Date(date);
  const valid = !isNaN(d.getTime());

  function phase() {
    const days = (d.getTime() - KNOWN_NEW_MOON) / 86400000;
    const cycles = days / SYNODIC_MONTH;
    const position = cycles - Math.floor(cycles);
    const index = Math.floor(position * 8 + 0.5) % 8;
    const illumination = (1 - Math.cos(position * 2 * Math.PI)) / 2;
    return { name: PHASES[index], illumination };
  }
  const r = valid ? phase() : null;

  return (
    <ToolShell title="Moon Phase Calculator" description="Approximate moon phase and illumination for a given date, using a fixed synodic month.">
      <Field label="Date"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} className="font-mono-ui" /></Field>
      <Output label="Phase" value={r ? r.name : ""} error={!valid} />
      <Output label="Illumination" value={r ? `${(r.illumination * 100).toFixed(0)}%` : ""} error={!valid} />
    </ToolShell>
  );
}
