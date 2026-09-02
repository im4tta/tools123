"use client";
import { useMemo, useState } from "react";
import addressData from "@/data/address_data.json";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Select, TextInput, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
type Province = (typeof addressData)[number];

type Level = "province" | "district" | "commune" | "village";

type SearchHit = {
  level: Level;
  provinceCode: string;
  districtCode: string;
  communeCode: string;
  villageCode: string;
  code: string;
  en: string;
  kh: string;
  pathEn: string;
  pathKh: string;
};

const LEVEL_LABEL: Record<Level, [string, string]> = {
  province: ["Province", "ខេត្ត"],
  district: ["District", "ស្រុក"],
  commune: ["Commune", "ឃុំ"],
  village: ["Village", "ភូមិ"],
};

export default function AdministrativeHierarchy() {
  const { text: t } = useLanguage();
  const [provinceCode, setProvinceCode] = useToolState("administrative-hierarchy:province", ""), [districtCode, setDistrictCode] = useToolState("administrative-hierarchy:district", ""), [communeCode, setCommuneCode] = useToolState("administrative-hierarchy:commune", ""), [villageCode, setVillageCode] = useToolState("administrative-hierarchy:village", "");
  const [query, setQuery] = useState("");
  const province: Province | undefined = addressData.find((item) => item.code === provinceCode), district = province?.districts.find((item) => item.code === districtCode), commune = district?.communes.find((item) => item.code === communeCode), village = commune?.villages.find((item) => item.code === villageCode);
  const selected = [province, district, commune, village].filter(Boolean), pathEn = selected.map((item) => item?.en).join(" › "), pathKm = selected.map((item) => item?.kh).join(" › "), path = t(pathEn, pathKm), copy = `${path}\n${selected.map((item) => item?.code).join(" › ")}`;

  // Flat, typed index over every level so the search box can match any address.
  const index = useMemo(() => {
    const hits: SearchHit[] = [];
    for (const p of addressData) {
      hits.push({ level: "province", provinceCode: p.code, districtCode: "", communeCode: "", villageCode: "", code: p.code, en: p.en, kh: p.kh, pathEn: p.en, pathKh: p.kh });
      for (const d of p.districts) {
        hits.push({ level: "district", provinceCode: p.code, districtCode: d.code, communeCode: "", villageCode: "", code: d.code, en: d.en, kh: d.kh, pathEn: `${p.en} › ${d.en}`, pathKh: `${p.kh} › ${d.kh}` });
        for (const c of d.communes) {
          hits.push({ level: "commune", provinceCode: p.code, districtCode: d.code, communeCode: c.code, villageCode: "", code: c.code, en: c.en, kh: c.kh, pathEn: `${p.en} › ${d.en} › ${c.en}`, pathKh: `${p.kh} › ${d.kh} › ${c.kh}` });
          for (const v of c.villages) {
            hits.push({ level: "village", provinceCode: p.code, districtCode: d.code, communeCode: c.code, villageCode: v.code, code: v.code, en: v.en, kh: v.kh, pathEn: `${p.en} › ${d.en} › ${c.en} › ${v.en}`, pathKh: `${p.kh} › ${d.kh} › ${c.kh} › ${v.kh}` });
          }
        }
      }
    }
    return hits;
  }, []);

  // Case-insensitive match on English, Khmer, or the administrative code.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: SearchHit[] = [];
    for (const hit of index) {
      if (hit.code.includes(q) || hit.en.toLowerCase().includes(q) || hit.kh.includes(q)) out.push(hit);
      if (out.length >= 40) break;
    }
    return out;
  }, [index, query]);

  const apply = (hit: SearchHit) => {
    setProvinceCode(hit.provinceCode);
    setDistrictCode(hit.districtCode);
    setCommuneCode(hit.communeCode);
    setVillageCode(hit.villageCode);
    setQuery("");
  };

  return <ToolShell title="Cambodia Administrative Hierarchy" khmerTitle="ឋានានុក្រមរដ្ឋបាលកម្ពុជា" description="Browse 25 provinces/capital, 210 districts, 1,661 communes, and 14,546 villages with official-style codes." descriptionKm="រកមើលរាជធានី-ខេត្តចំនួន ២៥ ក្រុង-ស្រុក-ខណ្ឌចំនួន ២១០ ឃុំ-សង្កាត់ចំនួន ១,៦៦១ និងភូមិចំនួន ១៤,៥៤៦ ជាមួយលេខកូដរដ្ឋបាល។">
    <Field label="Search address by typing" labelKm="ស្វែងរកអាសយដ្ឋានដោយវាយ" hint="EN, Khmer, or code" hintKm="ខ្មែរ អង់គ្លេស ឬលេខកូដ">
      <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Type province, district, commune, or village…", "វាយឈ្មោះរាជធានី-ខេត្ត ក្រុង-ស្រុក-ខណ្ឌ ឃុំ-សង្កាត់ ឬភូមិ…")} autoComplete="off" />
      {!!query.trim() && (
        <div className="mt-2 max-h-64 overflow-auto rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]">
          {!results.length ? (
            <p className="px-3 py-2 text-sm text-[var(--ink-faint)]">{t("No matches.", "មិនមានលទ្ធផល។")}</p>
          ) : (
            <>
              <p className="px-3 pt-2 text-xs text-[var(--ink-faint)]">{t(`${results.length} result${results.length === 1 ? "" : "s"}`, `${results.length} លទ្ធផល`)}</p>
              <ul className="py-1">
                {results.slice(0, 12).map((hit) => (
                  <li key={`${hit.level}-${hit.code}`}>
                    <button type="button" onClick={() => apply(hit)} className="flex w-full flex-col gap-0.5 px-3 py-1.5 text-left hover:bg-[var(--gold-dim)]/10">
                      <span className="flex items-baseline gap-2 text-sm text-[var(--ink)]">
                        <span className="font-medium">{t(hit.en, hit.kh)}</span>
                        <code className="text-xs text-[var(--gold)]">{hit.code}</code>
                        <span className="ml-auto text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{t(...LEVEL_LABEL[hit.level])}</span>
                      </span>
                      <span className="truncate text-xs text-[var(--ink-faint)]">{t(hit.pathEn, hit.pathKh)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </Field>
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Province / Capital" labelKm="រាជធានី / ខេត្ត"><Select value={provinceCode} onChange={(e) => { setProvinceCode(e.target.value); setDistrictCode(""); setCommuneCode(""); setVillageCode(""); }}><option value="">{t("Select…", "សូមជ្រើសរើស…")}</option>{addressData.map((item) => <option key={item.code} value={item.code}>{item.code} · {t(item.en, item.kh)}</option>)}</Select></Field>
      <Field label="District" labelKm="ក្រុង / ស្រុក / ខណ្ឌ"><Select value={districtCode} disabled={!province} onChange={(e) => { setDistrictCode(e.target.value); setCommuneCode(""); setVillageCode(""); }}><option value="">{t("Select…", "សូមជ្រើសរើស…")}</option>{province?.districts.map((item) => <option key={item.code} value={item.code}>{item.code} · {t(item.en, item.kh)}</option>)}</Select></Field>
      <Field label="Commune / Sangkat" labelKm="ឃុំ / សង្កាត់"><Select value={communeCode} disabled={!district} onChange={(e) => { setCommuneCode(e.target.value); setVillageCode(""); }}><option value="">{t("Select…", "សូមជ្រើសរើស…")}</option>{district?.communes.map((item) => <option key={item.code} value={item.code}>{item.code} · {t(item.en, item.kh)}</option>)}</Select></Field>
      <Field label="Village" labelKm="ភូមិ"><Select value={villageCode} disabled={!commune} onChange={(e) => setVillageCode(e.target.value)}><option value="">{t("Select…", "សូមជ្រើសរើស…")}</option>{commune?.villages.map((item) => <option key={item.code} value={item.code}>{item.code} · {t(item.en, item.kh)}</option>)}</Select></Field>
    </div>
    {!!selected.length && <section className="rounded-md border border-[var(--gold-dim)] bg-[var(--ground-raised)] p-4"><div className="flex items-start justify-between gap-3"><p className="text-lg text-[var(--ink)]">{path}</p><CopyButton text={copy} compact /></div><div className="mt-3 flex flex-wrap gap-2">{selected.map((item) => item && <code key={item.code} className="rounded bg-[var(--ground)] px-2 py-1 text-xs text-[var(--gold)]">{item.code}</code>)}</div></section>}
    <p className="text-xs text-[var(--ink-faint)]">{t("Verify administrative changes against current Ministry of Interior records before official use.", "សម្រាប់ការប្រើប្រាស់ផ្លូវការ សូមផ្ទៀងផ្ទាត់ការផ្លាស់ប្តូររដ្ឋបាលជាមួយទិន្នន័យបច្ចុប្បន្នរបស់ក្រសួងមហាផ្ទៃ។")}</p>
  </ToolShell>;
}
