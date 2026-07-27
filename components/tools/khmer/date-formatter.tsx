"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const MONTHS = ["មករា","កុម្ភៈ","មីនា","មេសា","ឧសភា","មិថុនា","កក្កដា","សីហា","កញ្ញា","តុលា","វិច្ឆិកា","ធ្នូ"];
const DAYS = ["អាទិត្យ","ចន្ទ","អង្គារ","ពុធ","ព្រហស្បតិ៍","សុក្រ","សៅរ៍"];
const KH = "០១២៣៤៥៦៧៨៩";
const toKh = (n: number) => String(n).split("").map((d) => KH[Number(d)]).join("");

export default function DateFormatter() {
  const [date, setDate] = useToolState("date-formatter:date", new Date().toISOString().slice(0, 10));
  const d = useMemo(() => (date ? new Date(date + "T00:00:00") : null), [date]);
  const valid = d && !isNaN(d.getTime());

  return (
    <ToolShell title="Khmer Date Formatter" khmerTitle="កាលបរិច្ឆេទ" description="Render a Gregorian calendar date with Khmer day names, month names, and Khmer numerals.">
      <Field label="Date"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-48" /></Field>
      <Output
        label="Khmer formatted"
        value={valid ? `ថ្ងៃ${DAYS[d!.getDay()]} ទី${toKh(d!.getDate())} ខែ${MONTHS[d!.getMonth()]} ឆ្នាំ${toKh(d!.getFullYear())}` : ""}
        error={!valid}
        mono={false}
      />
    </ToolShell>
  );
}
