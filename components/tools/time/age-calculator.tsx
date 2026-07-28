"use client";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function AgeCalculator() {
  const [dob, setDob] = useToolState("age-calculator:dob", "1995-06-15");
  const birth = new Date(dob);
  const valid = !isNaN(birth.getTime());
  const now = new Date();

  function age() {
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    if (days < 0) { months -= 1; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (months < 0) { years -= 1; months += 12; }
    return { years, months, days };
  }
  const a = valid ? age() : null;
  const totalDays = valid ? Math.floor((now.getTime() - birth.getTime()) / 86400000) : 0;

  return (
    <ToolShell title="Age Calculator" description="Exact age in years, months, and days from a birth date.">
      <Field label="Date of birth"><TextInput type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="font-mono-ui" /></Field>
      <Output label="Age" value={a ? `${a.years} years, ${a.months} months, ${a.days} days` : ""} error={!valid} />
      <Output label="Total days lived" value={valid ? totalDays.toLocaleString() : ""} error={!valid} />
    </ToolShell>
  );
}
