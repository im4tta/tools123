"use client";
import { useMemo } from "react";
import data from "@/data/institutions_data.json";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Row, Select, TextInput, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

export default function MinistryDirectory() {
  const { mode, text: t } = useLanguage();
  const [query, setQuery] = useToolState("ministry-directory:query", "");
  const [category, setCategory] = useToolState("ministry-directory:category", "all");
  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("km");
    return data.institutions.filter((item) => (category === "all" || item.category_km === category) && (!q || [item.acronym, item.name_en, item.name_km, item.responsibility, item.leader, item.leader_km, item.position, item.position_km, item.address_en, item.address_km].some((value) => value.toLocaleLowerCase("km").includes(q))));
  }, [category, query]);
  return <ToolShell title="Cambodia Government Institution Directory" khmerTitle="បញ្ជីក្រសួង និងស្ថាប័នរាជរដ្ឋាភិបាលកម្ពុជា" description="Search 32 Cambodian ministries and public institutions by name, acronym, category, leadership, or address." descriptionKm="ស្វែងរកក្រសួង និងស្ថាប័នសាធារណៈទាំង ៣២ តាមឈ្មោះ អក្សរកាត់ ប្រភេទ ថ្នាក់ដឹកនាំ ឬអាសយដ្ឋាន។">
    <Row>
      <Field label="Institution category" labelKm="ប្រភេទស្ថាប័ន"><Select value={category} onChange={(e) => setCategory(e.target.value)}>{data.categories.map((item) => <option key={item.id} value={item.id}>{t(item.name_en, item.name_km)}</option>)}</Select></Field>
      <Field label="Search" labelKm="ស្វែងរក"><TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Name, acronym, leader, or address…", "ឈ្មោះ អក្សរកាត់ ថ្នាក់ដឹកនាំ ឬអាសយដ្ឋាន…")} /></Field>
    </Row>
    <p className="text-xs text-[var(--ink-faint)]">{t(`${results.length} institutions found. Leadership and contact details can change; verify on the official website.`, `រកឃើញស្ថាប័នចំនួន ${results.length}។ ព័ត៌មានថ្នាក់ដឹកនាំ និងទំនាក់ទំនងអាចផ្លាស់ប្តូរ សូមផ្ទៀងផ្ទាត់ជាមួយគេហទំព័រផ្លូវការ។`)}</p>
    {!results.length && <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 text-center text-sm text-[var(--ink-faint)]">{t("No matching institution found.", "រកមិនឃើញស្ថាប័នដែលត្រូវនឹងការស្វែងរកនេះទេ។")}</p>}
    <div className="grid gap-3 sm:grid-cols-2">{results.map((item) => {
      const name = t(item.name_en, item.name_km), leader = t(`${item.leader} · ${item.position}`, `${item.leader_km} · ${item.position_km}`), address = t(item.address_en, item.address_km);
      const copy = [name, item.acronym, `${t("Leader", "ថ្នាក់ដឹកនាំ")}: ${leader}`, `${t("Address", "អាសយដ្ឋាន")}: ${address}`, mode !== "km" ? item.responsibility : "", item.website, item.phone, item.email].filter(Boolean).join("\n");
      return <article key={item.id} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <div className="flex items-start justify-between gap-3"><div><h2 className="font-medium leading-7 text-[var(--ink)]">{name}</h2><span className="text-[10px] text-[var(--ink-faint)]">{item.acronym}</span></div><CopyButton text={copy} compact /></div>
        {mode !== "km" && <p className="mt-3 text-xs leading-5 text-[var(--ink-dim)]">{item.responsibility}</p>}
        <dl className="mt-3 space-y-2 text-xs leading-6"><div><dt className="inline text-[var(--ink-faint)]">{t("Leader", "ថ្នាក់ដឹកនាំ")}៖ </dt><dd className="inline text-[var(--ink-dim)]">{leader}</dd></div><div><dt className="inline text-[var(--ink-faint)]">{t("Address", "អាសយដ្ឋាន")}៖ </dt><dd className="inline text-[var(--ink-dim)]">{address}</dd></div></dl>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-xs">{item.website && <a href={item.website} target="_blank" rel="noreferrer" className="text-[var(--gold)]">{t("Website", "គេហទំព័រ")} ↗</a>}{item.phone && <a href={`tel:${item.phone}`} className="text-[var(--ink-dim)]">{t("Phone", "ទូរស័ព្ទ")}៖ {item.phone}</a>}{item.email && <a href={`mailto:${item.email}`} className="text-[var(--ink-dim)]">{t("Email", "អ៊ីមែល")}</a>}</div>
      </article>;
    })}</div>
  </ToolShell>;
}
