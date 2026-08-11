"use client";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function BuddhistEra() {
  const [year, setYear] = useToolState("buddhist-era:year", String(new Date().getFullYear()));
  const y = Number(year);
  const be = isNaN(y) ? null : y + 543;

  return (
    <ToolShell title="Buddhist Era Year Converter" khmerTitle="ពុទ្ធសករាជ" description="Convert a Gregorian (Common Era) year to the Buddhist Era year used in Cambodian civic and religious contexts (CE + 543).">
      <Field label="Gregorian year"><TextInput value={year} onChange={(e) => setYear(e.target.value)} className="w-40 font-mono-ui" /></Field>
      <Output label="Buddhist Era" value={be === null ? "" : `B.E. ${be}`} error={be === null} />
    </ToolShell>
  );
}
