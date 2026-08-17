"use client";
import { useMemo, useState } from "react";
import { Dices } from "lucide-react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Button, Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const FIRST = ["Sok", "Dara", "Chea", "Sreymom", "Vannak", "Chanthou", "Kosal", "Malis", "Sophea", "Rithy", "Channary", "Sovann", "Kimheng", "Bopha"];
const LAST = ["Sok", "Chan", "Kim", "Heng", "Sovan", "Chin", "Narith", "Pich", "Srey", "Touch", "Vibol", "Mao"];
const DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "khmer.com", "example.org"];
const CITIES = ["Phnom Penh", "Siem Reap", "Battambang", "Sihanoukville", "Kampong Cham", "Takeo"];

function randomName() {
  const f = FIRST[Math.floor(Math.random() * FIRST.length)];
  const l = LAST[Math.floor(Math.random() * LAST.length)];
  return `${f} ${l}`;
}

function randomPhone() {
  const prefixes = ["012", "010", "096", "077", "088", "015", "031", "070"];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  let n = "";
  for (let i = 0; i < 7; i++) n += Math.floor(Math.random() * 10);
  return `${p} ${n.slice(0, 3)} ${n.slice(3)}`;
}

function randomEmail() {
  return randomName().toLowerCase().replace(/\s+/g, ".") + Math.floor(Math.random() * 100) + "@" + DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
}

function randomDate() {
  const y = 1990 + Math.floor(Math.random() * 35);
  const m = 1 + Math.floor(Math.random() * 12);
  const d = 1 + Math.floor(Math.random() * 28);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function makeRow() {
  return {
    name: randomName(),
    email: randomEmail(),
    phone: randomPhone(),
    city: CITIES[Math.floor(Math.random() * CITIES.length)],
    birthdate: randomDate(),
    id: "000" + Math.floor(Math.random() * 9999),
  };
}

export default function MockData() {
  const { text: t } = useLanguage();
  const [count, setCount] = useToolState("mock-data:count", "10");
  const [format, setFormat] = useToolState("mock-data:format", "json");
  const [rows, setRows] = useState<ReturnType<typeof makeRow>[]>([]);

  const generate = () => {
    const n = Math.max(1, Math.min(200, Number(count) || 10));
    setRows(Array.from({ length: n }, makeRow));
  };

  const output = useMemo(() => {
    if (rows.length === 0) return "";
    if (format === "json") return JSON.stringify(rows, null, 2);
    const headers = ["name", "email", "phone", "city", "birthdate", "id"];
    const esc = (v: string) => (v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v);
    return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(String(r[h as keyof typeof r]))).join(","))].join("\n");
  }, [rows, format]);

  return (
    <ToolShell
      title="Mock Data Generator"
      khmerTitle="បង្កើតទិន្នន័យសាកល្បង"
      description="Generate realistic fake people (names, emails, phones, dates) for testing apps — as JSON or CSV."
      descriptionKm="បង្កើតទិន្នន័យមនុស្សក្លែង (ឈ្មោះ អ៊ីមែល ទូរស័ព្ទ កាលបរិច្ឆេទ) សម្រាប់សាកល្បងកម្មវិធី — ជា JSON ឬ CSV។"
    >
      <Row>
        <Field label={t("Rows", "ចំនួនជួរដេក")}>
          <TextInput inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} placeholder="10" />
        </Field>
        <Field label={t("Format", "ទម្រង់")}>
          <Select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </Select>
        </Field>
      </Row>
      <Button type="button" onClick={generate} className="w-full">
        <Dices size={15} className="mr-1 inline" />
        {t("Generate", "បង្កើត")}
      </Button>
      <Output label={t("Result", "លទ្ធផល")} value={output} />
    </ToolShell>
  );
}