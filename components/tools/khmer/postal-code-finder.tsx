"use client";
import { useMemo } from "react";
import postalCodes from "@/data/postal_codes.json";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
type PostalRow = (typeof postalCodes)[number];

export default function PostalCodeFinder() {
  const { text: t } = useLanguage();
  const [query, setQuery] = useToolState("postal-code-finder:query", "");
  const results = useMemo(() => { const q = query.trim().toLowerCase(); if (!q) return [] as PostalRow[]; return postalCodes.filter((row) => [row.code, row.province_kh, row.province_en, row.district_kh, row.district_en, row.commune_kh, row.commune_en, row.village_kh, row.village_en].some((value) => value.toLowerCase().includes(q))).slice(0, 60); }, [query]);
  return <ToolShell title="Cambodia Postal Code Finder" khmerTitle="ស្វែងរកលេខកូដប្រៃសណីយ៍កម្ពុជា" description="Search 1,886 Cambodian postal records by code or province, district, commune, and village name." descriptionKm="ស្វែងរកទិន្នន័យប្រៃសណីយ៍កម្ពុជាចំនួន ១,៨៨៦ កំណត់ត្រា តាមលេខកូដ ឬឈ្មោះខេត្ត ស្រុក ឃុំ និងភូមិ។">
    <Field label="Postal code or place" labelKm="លេខកូដប្រៃសណីយ៍ ឬទីកន្លែង"><TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("e.g. 010201, Battambang…", "ឧ. 010201, បាត់ដំបង, បន្ទាយនាង…")} autoFocus /></Field>
    <p className="text-xs text-[var(--ink-faint)]">{query ? t(`${results.length}${results.length === 60 ? "+" : ""} matches`, `រកឃើញ ${results.length}${results.length === 60 ? "+" : ""} លទ្ធផល`) : t("Enter a code or place name to search.", "សូមបញ្ចូលលេខកូដ ឬឈ្មោះទីកន្លែងដើម្បីស្វែងរក។")}</p>
    <div className="space-y-2">{results.map((row) => {
      const en = [row.province_en, row.district_en, row.commune_en, row.village_en].filter(Boolean).join(" › ");
      const km = [row.province_kh, row.district_kh, row.commune_kh, row.village_kh].filter(Boolean).join(" › ");
      const path = t(en, km), copy = `${row.code}\n${path}`;
      return <article key={`${row.code}-${row.commune_en}-${row.village_en}`} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3"><div className="flex items-start justify-between gap-3"><strong className="text-[var(--ink)]">{t(row.village_en || row.commune_en || row.district_en || row.province_en, row.village_kh || row.commune_kh || row.district_kh || row.province_kh)}</strong><div className="flex items-center gap-2"><code className="rounded bg-[var(--ground)] px-2 py-1 text-[var(--gold)]">{row.code}</code><CopyButton text={copy} compact /></div></div><p className="mt-2 text-xs leading-6 text-[var(--ink-faint)]">{path}</p></article>;
    })}</div>
  </ToolShell>;
}
