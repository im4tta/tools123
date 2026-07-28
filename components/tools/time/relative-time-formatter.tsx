"use client";
import { useEffect, useState } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";

export default function RelativeTimeFormatter() {
  const [datetime, setDatetime] = useState(() => new Date().toISOString().slice(0, 16));
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const target = new Date(datetime);
  const valid = !isNaN(target.getTime()) && now !== null;

  function format() {
    const diffMs = target.getTime() - (now ?? 0);
    const diffSec = Math.round(diffMs / 1000);
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const units: [number, Intl.RelativeTimeFormatUnit][] = [
      [60, "second"], [60, "minute"], [24, "hour"], [7, "day"], [4.345, "week"], [12, "month"], [Infinity, "year"],
    ];
    let value = diffSec, unit: Intl.RelativeTimeFormatUnit = "second";
    for (const [amount, u] of units) {
      if (Math.abs(value) < amount) { unit = u; break; }
      value /= amount;
      unit = u;
    }
    return rtf.format(Math.round(value), unit);
  }

  return (
    <ToolShell title={'Relative Time ("Time Ago") Formatter'} description="Formats a date/time as a human relative phrase, like 'in 3 days' or '5 hours ago'.">
      <Field label="Date & time"><TextInput type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} className="font-mono-ui" /></Field>
      <Output label="Relative" value={valid ? format() : ""} error={!valid} />
    </ToolShell>
  );
}
