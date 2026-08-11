"use client";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const ANIMALS = [
  ["ជូត", "Rat"], ["ឆ្លូវ", "Ox"], ["ខាល", "Tiger"], ["ថោះ" , "Rabbit"],
  ["រោង", "Dragon"], ["ម្សាញ់", "Snake"], ["មមី", "Horse"], ["មមែ", "Goat"],
  ["វក", "Monkey"], ["រកា", "Rooster"], ["ច", "Dog"], ["កុរ", "Pig"],
];
// anchor: 2020 = Rat (index 0)

export default function ZodiacYear() {
  const [year, setYear] = useToolState("zodiac-year:year", String(new Date().getFullYear()));
  const y = Number(year);
  const idx = isNaN(y) ? null : (((y - 2020) % 12) + 12) % 12;

  return (
    <ToolShell title="12-Year Zodiac Cycle" khmerTitle="ឆ្នាំសត្វ" description="Find the animal sign for a Gregorian year in the Khmer 12-year zodiac cycle (នាំ​ចន្លោះ​ត្រូវ​គ្នា​ជាមួយ​ចិន)." >
      <Field label="Year"><TextInput value={year} onChange={(e) => setYear(e.target.value)} className="w-40 font-mono-ui" /></Field>
      <Output
        label="Zodiac animal"
        value={idx === null ? "" : `${ANIMALS[idx][0]} — ${ANIMALS[idx][1]}`}
        error={idx === null}
        mono={false}
      />
    </ToolShell>
  );
}
