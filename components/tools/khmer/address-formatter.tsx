"use client";

import addressData from "@/data/address_data.json";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/Output";
import { Field, Select, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

type Province = (typeof addressData)[number];

function csvCell(value: string) { return `"${value.replaceAll('"', '""')}"`; }

export default function AddressFormatter() {
  const { mode, text: t } = useLanguage();
  const [provinceCode, setProvinceCode] = useToolState("address-formatter:province", "");
  const [districtCode, setDistrictCode] = useToolState("address-formatter:district", "");
  const [communeCode, setCommuneCode] = useToolState("address-formatter:commune", "");
  const [villageCode, setVillageCode] = useToolState("address-formatter:village", "");
  const province: Province | undefined = addressData.find((item) => item.code === provinceCode);
  const district = province?.districts.find((item) => item.code === districtCode);
  const commune = district?.communes.find((item) => item.code === communeCode);
  const village = commune?.villages.find((item) => item.code === villageCode);
  const selected = [village, commune, district, province].filter(Boolean);
  const khmer = selected.map((item) => item?.kh).join(", ") + (selected.length ? ", កម្ពុជា" : "");
  const english = selected.map((item) => item?.en).join(", ") + (selected.length ? ", Cambodia" : "");
  const bilingual = `${khmer}\n${english}`;

  function downloadCsv() {
    const code = village?.code ?? commune?.code ?? district?.code ?? province?.code ?? "";
    const csv = `\uFEFFcode,khmer_address,english_address\r\n${[code, khmer, english].map(csvCell).join(",")}\r\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `cambodia-address-${code || "export"}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return <ToolShell title="Cambodia Bilingual Address Formatter" khmerTitle="រៀបចំទម្រង់អាសយដ្ឋានកម្ពុជាពីរភាសា" description="Build consistent Khmer, English, and bilingual addresses from Cambodia's administrative hierarchy, then copy or export them as CSV." descriptionKm="បង្កើតអាសយដ្ឋានខ្មែរ អង់គ្លេស និងពីរភាសា ពីឋានានុក្រមរដ្ឋបាលកម្ពុជា ហើយចម្លង ឬនាំចេញជា CSV។">
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Province / Capital" labelKm="រាជធានី / ខេត្ត"><Select value={provinceCode} onChange={(event) => { setProvinceCode(event.target.value); setDistrictCode(""); setCommuneCode(""); setVillageCode(""); }}><option value="">{t("Select…", "សូមជ្រើសរើស…")}</option>{addressData.map((item) => <option key={item.code} value={item.code}>{item.code} · {t(item.en, item.kh)}</option>)}</Select></Field>
      <Field label="District" labelKm="ក្រុង / ស្រុក / ខណ្ឌ"><Select value={districtCode} disabled={!province} onChange={(event) => { setDistrictCode(event.target.value); setCommuneCode(""); setVillageCode(""); }}><option value="">{t("Select…", "សូមជ្រើសរើស…")}</option>{province?.districts.map((item) => <option key={item.code} value={item.code}>{item.code} · {t(item.en, item.kh)}</option>)}</Select></Field>
      <Field label="Commune / Sangkat" labelKm="ឃុំ / សង្កាត់"><Select value={communeCode} disabled={!district} onChange={(event) => { setCommuneCode(event.target.value); setVillageCode(""); }}><option value="">{t("Select…", "សូមជ្រើសរើស…")}</option>{district?.communes.map((item) => <option key={item.code} value={item.code}>{item.code} · {t(item.en, item.kh)}</option>)}</Select></Field>
      <Field label="Village" labelKm="ភូមិ"><Select value={villageCode} disabled={!commune} onChange={(event) => setVillageCode(event.target.value)}><option value="">{t("Select…", "សូមជ្រើសរើស…")}</option>{commune?.villages.map((item) => <option key={item.code} value={item.code}>{item.code} · {t(item.en, item.kh)}</option>)}</Select></Field>
    </div>
    {!!selected.length && <div className="space-y-3">
      {mode !== "en" && <section lang="km" className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><div className="flex items-start justify-between gap-3"><div><div className="mb-2 text-xs text-[var(--ink-faint)]">អាសយដ្ឋានខ្មែរ</div><p className="leading-7 text-[var(--ink)]">{khmer}</p></div><CopyButton text={khmer} compact /></div></section>}
      {mode !== "km" && <section lang="en" className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><div className="flex items-start justify-between gap-3"><div><div className="mb-2 text-xs text-[var(--ink-faint)]">English address</div><p className="leading-7 text-[var(--ink)]">{english}</p></div><CopyButton text={english} compact /></div></section>}
      {mode === "bi" && <section className="rounded-md border border-[var(--gold-dim)] p-4"><div className="flex items-start justify-between gap-3"><div><div className="mb-2 text-xs text-[var(--ink-faint)]">Bilingual / ពីរភាសា</div><p className="whitespace-pre-line leading-7 text-[var(--ink)]">{bilingual}</p></div><CopyButton text={bilingual} compact /></div></section>}
      <Button onClick={downloadCsv}>{t("Export CSV", "នាំចេញ CSV")}</Button>
    </div>}
    <p className="text-xs text-[var(--ink-faint)]">{t("The formatter preserves the exact names and codes in the bundled dataset. Verify recent administrative changes before official use.", "ឧបករណ៍រក្សាឈ្មោះ និងលេខកូដតាមទិន្នន័យក្នុងកម្មវិធី។ សូមផ្ទៀងផ្ទាត់ការផ្លាស់ប្តូររដ្ឋបាលថ្មីៗមុនប្រើជាផ្លូវការ។")}</p>
  </ToolShell>;
}
