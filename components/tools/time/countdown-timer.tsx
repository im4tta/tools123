"use client";
import { useEffect, useState } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";

export default function CountdownTimer() {
  const [target, setTarget] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 16);
  });
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const targetDate = new Date(target);
  const valid = !isNaN(targetDate.getTime());
  const diff = valid ? targetDate.getTime() - now.getTime() : 0;

  function format() {
    if (diff <= 0) return "Target reached";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${days}d ${hours}h ${mins}m ${secs}s`;
  }

  return (
    <ToolShell title="Countdown Timer" description="Live countdown to a target date and time, updated every second.">
      <Field label="Target date & time"><TextInput type="datetime-local" value={target} onChange={(e) => setTarget(e.target.value)} className="font-mono-ui" /></Field>
      <Output label="Time remaining" value={valid ? format() : ""} error={!valid} />
    </ToolShell>
  );
}
