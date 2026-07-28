"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const SYNODIC_MONTH = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

function lunarDay(d: Date) {
  const days = (d.getTime() - KNOWN_NEW_MOON) / 86400000;
  const cycles = days / SYNODIC_MONTH;
  const position = cycles - Math.floor(cycles); // 0 = new moon, ~0.5 = full moon
  const dayInMonth = Math.floor(position * SYNODIC_MONTH) + 1; // 1..~30
  const half = SYNODIC_MONTH / 2;
  if (dayInMonth <= Math.round(half)) {
    return { label: `ថ្ងៃទី${dayInMonth}កើត`, en: `Day ${dayInMonth}, waxing moon (កើត)`, waxing: true, n: dayInMonth };
  }
  const n = dayInMonth - Math.round(half);
  return { label: `ថ្ងៃទី${n}រោច`, en: `Day ${n}, waning moon (រោច)`, waxing: false, n };
}

export default function LunarDay() {
  const [date, setDate] = useToolState("lunar-day:date", new Date().toISOString().slice(0, 10));

  const r = useMemo(() => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return lunarDay(d);
  }, [date]);
  const valid = r !== null;

  return (
    <ToolShell
      title="Khmer Lunar Day"
      khmerTitle="ថ្ងៃចន្ទគតិ"
      description={"Estimates the Khmer lunar day (កើត — waxing / រោច — waning) for a Gregorian date, using a fixed synodic-month cycle. This is a quick approximation only: it doesn't apply the leap-month (អធិកមាស/អធិកវារ) corrections the official Khmer/Buddhist calendar uses, so it can drift by a day or more. For an accurate result — full month name, animal year, ស័ក, ព.ស. — use the \"Khmer Full Lunar Date\" tool instead."}
    >
      <Field label="Date"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} className="font-mono-ui" /></Field>
      <Output label="Khmer lunar day (approximate)" value={r ? r.label : ""} error={!valid} mono={false} />
      <Output label="English" value={r ? r.en : ""} error={!valid} mono={false} />
    </ToolShell>
  );
}
