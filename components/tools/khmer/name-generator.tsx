"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const FAMILY_NAMES = [
  "ស៊ុន", "ហេង", "ចាន់", "ស្រេង", "កែវ", "ម៉ែន", "ជា", "យិន", "ថន", "ព្រំ",
  "ខៀវ", "សុខ", "ឡេង", "នួន", "ទូច", "ភួង", "ឈូក", "អ៊ុំ", "ទេព", "សេង",
];

const MALE_GIVEN = [
  "សុវណ្ណា", "បញ្ញា", "វិរៈ", "សម្បត្តិ", "ច័ន្ទតារា", "សុភ័ក្ត្រ", "រតនៈ", "សិទ្ធិ", "សំណាង", "វិបុល",
  "ធារិទ្ធិ", "សុវត្ថិ", "សិរីមង្គល", "ពិសិដ្ឋ", "ធនកម្ម", "ចន្ទរស្មី", "សុជាតិ", "វណ្ណៈ", "ព្រហ្មរាជ", "សុវិចិត្រ",
];

const FEMALE_GIVEN = [
  "សុភា", "ចន្ទថា", "ស្រីមុំ", "កញ្ញា", "សុវណ្ណារី", "ចន្ទនីម៉ុល", "ស្រីនាង", "ពេជ្រសោភា", "រស្មី", "សុផល្លីន",
  "សុភាព័ត្រ", "ចន្ទសោភា", "ស្រីលក្ខិណា", "កញ្ញាណា", "ពន្លក", "សុវត្ថនា", "ចន្ទមុនីរតន៍", "ស្រីអូន", "ទេពកញ្ញា", "សុជាតា",
];

type Gender = "male" | "female" | "any";

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generate(gender: Gender): { family: string; given: string; gender: "male" | "female" } {
  const g: "male" | "female" = gender === "any" ? (Math.random() < 0.5 ? "male" : "female") : gender;
  const given = g === "male" ? randomFrom(MALE_GIVEN) : randomFrom(FEMALE_GIVEN);
  return { family: randomFrom(FAMILY_NAMES), given, gender: g };
}

export default function NameGenerator() {
  const [gender, setGender] = useToolState<Gender>("name-generator:gender", "any");
  const [count, setCount] = useToolState("name-generator:count", "5");
  const [results, setResults] = useState(() => Array.from({ length: 5 }, () => generate("any")));

  function roll() {
    const n = Math.min(20, Math.max(1, Number(count) || 5));
    setResults(Array.from({ length: n }, () => generate(gender)));
  }

  return (
    <ToolShell
      title="Khmer Name Generator"
      khmerTitle="បង្កើតឈ្មោះ"
      description="Generate plausible Khmer full names (family name + given name) for placeholder data, sample forms, or character names. Names are combined from a small representative syllable bank — not drawn from any real-person registry."
    >
      <Row>
        <Field label="Gender">
          <Select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
            <option value="any">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
        </Field>
        <Field label="How many" hint="1–20">
          <Select value={count} onChange={(e) => setCount(e.target.value)}>
            {[1, 3, 5, 10, 20].map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </Field>
      </Row>
      <Button onClick={roll} className="inline-flex items-center gap-1.5">
        <RefreshCw size={14} /> Generate
      </Button>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {results.map((r, i) => (
          <div key={i} className="flex items-center justify-between rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2">
            <span className="font-khmer text-lg text-[var(--ink)]">{r.family} {r.given}</span>
            <span className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{r.gender}</span>
          </div>
        ))}
      </div>
      <Output label="Plain list" value={results.map((r) => `${r.family} ${r.given}`).join("\n")} mono={false} />
    </ToolShell>
  );
}
