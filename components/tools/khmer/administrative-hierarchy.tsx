"use client";
import addressData from "@/data/address_data.json";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Select, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
type Province = (typeof addressData)[number];

export default function AdministrativeHierarchy() {
  const { text: t } = useLanguage();
  const [provinceCode, setProvinceCode] = useToolState("administrative-hierarchy:province", ""), [districtCode, setDistrictCode] = useToolState("administrative-hierarchy:district", ""), [communeCode, setCommuneCode] = useToolState("administrative-hierarchy:commune", ""), [villageCode, setVillageCode] = useToolState("administrative-hierarchy:village", "");
  const province: Province | undefined = addressData.find((item) => item.code === provinceCode), district = province?.districts.find((item) => item.code === districtCode), commune = district?.communes.find((item) => item.code === communeCode), village = commune?.villages.find((item) => item.code === villageCode);
  const selected = [province, district, commune, village].filter(Boolean), pathEn = selected.map((item) => item?.en).join(" › "), pathKm = selected.map((item) => item?.kh).join(" › "), path = t(pathEn, pathKm), copy = `${path}\n${selected.map((item) => item?.code).join(" › ")}`;
  return <ToolShell title="Cambodia Administrative Hierarchy" khmerTitle="ឋានានុក្រមរដ្ឋបាលកម្ពុជា" description="Browse 25 provinces/capital, 210 districts, 1,661 communes, and 14,546 villages with official-style codes." descriptionKm="រកមើលរាជធានី-ខេត្តចំនួន ២៥ ក្រុង-ស្រុក-ខណ្ឌចំនួន ២១០ ឃុំ-សង្កាត់ចំនួន ១,៦៦១ និងភូមិចំនួន ១៤,៥៤៦ ជាមួយលេខកូដរដ្ឋបាល។">
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
