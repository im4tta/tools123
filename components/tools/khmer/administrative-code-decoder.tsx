"use client";

import { useMemo } from "react";
import addressData from "@/data/address_data.json";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

type Place = { code: string; kh: string; en: string };
type Decoded = { code: string; places: Place[]; error?: "format" | "length" | "unknown" };
const KHMER_DIGITS = "០១២៣៤៥៦៧៨៩";

function normalizeCode(value: string) {
  return value.normalize("NFC").replace(/[០-៩]/g, (digit) => String(KHMER_DIGITS.indexOf(digit))).replace(/[\s\-‐‑‒–—−_./]+/g, "");
}

function decode(value: string): Decoded | null {
  if (!value.trim()) return null;
  const code = normalizeCode(value);
  if (!/^\d+$/.test(code)) return { code, places: [], error: "format" };
  if (![2, 4, 6, 8].includes(code.length)) return { code, places: [], error: "length" };
  const province = addressData.find((item) => item.code === code.slice(0, 2));
  const district = code.length >= 4 ? province?.districts.find((item) => item.code === code.slice(0, 4)) : undefined;
  const commune = code.length >= 6 ? district?.communes.find((item) => item.code === code.slice(0, 6)) : undefined;
  const village = code.length === 8 ? commune?.villages.find((item) => item.code === code) : undefined;
  const places = [province, district, commune, village].filter((item): item is Place => Boolean(item));
  return places.at(-1)?.code === code ? { code, places } : { code, places, error: "unknown" };
}

export default function AdministrativeCodeDecoder() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("administrative-code-decoder:input", "");
  const decoded = useMemo(() => decode(input), [input]);
  const levelsEn = ["Province / Capital", "District / Municipality / Khan", "Commune / Sangkat", "Village"];
  const levelsKm = ["រាជធានី / ខេត្ត", "ក្រុង / ស្រុក / ខណ្ឌ", "ឃុំ / សង្កាត់", "ភូមិ"];
  const error = decoded?.error === "format" ? t("Use digits and separators only.", "សូមប្រើតែលេខ និងសញ្ញាបំបែកប៉ុណ្ណោះ។")
    : decoded?.error === "length" ? t("A code must contain 2, 4, 6, or 8 digits.", "លេខកូដត្រូវមាន ២, ៤, ៦ ឬ ៨ ខ្ទង់។")
    : decoded?.error === "unknown" ? t("No exact administrative unit matches this code.", "រកមិនឃើញអង្គភាពរដ្ឋបាលដែលត្រូវនឹងលេខកូដនេះទេ។") : "";
  const copy = decoded?.places.map((place, index) => `${levelsEn[index]}: ${place.en} (${place.code})\n${levelsKm[index]}៖ ${place.kh} (${place.code})`).join("\n") ?? "";
  return <ToolShell title="Cambodia Administrative Code Decoder" khmerTitle="ឧបករណ៍អានលេខកូដរដ្ឋបាលកម្ពុជា" description="Decode and validate 2-, 4-, 6-, or 8-digit Cambodian administrative codes, including Khmer numerals." descriptionKm="អាន និងផ្ទៀងផ្ទាត់លេខកូដរដ្ឋបាលកម្ពុជា ២, ៤, ៦ ឬ ៨ ខ្ទង់ រួមទាំងលេខខ្មែរ។">
    <Field label="Administrative code" labelKm="លេខកូដរដ្ឋបាល" hint="2 / 4 / 6 / 8 digits" hintKm="២ / ៤ / ៦ / ៨ ខ្ទង់"><TextInput value={input} onChange={(event) => setInput(event.target.value)} placeholder={t("Example: 01020101", "ឧទាហរណ៍៖ ០១០២០១០១")} autoFocus /></Field>
    {decoded && <section className={`rounded-md border p-4 ${decoded.error ? "border-[var(--danger)]/60" : "border-[var(--gold-dim)]"}`}>
      <div className="flex items-start justify-between gap-3"><div><div className="text-xs text-[var(--ink-faint)]">{t("Normalized code", "លេខកូដដែលបានសម្រួល")}</div><code className="text-lg text-[var(--gold)]">{decoded.code || "—"}</code></div>{copy && <CopyButton text={copy} compact />}</div>
      {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
      {!!decoded.places.length && <dl className="mt-4 space-y-3">{decoded.places.map((place, index) => <div key={place.code} className="grid gap-1 border-t border-[var(--ground-line)] pt-3 sm:grid-cols-[11rem_1fr]"><dt className="text-xs text-[var(--ink-faint)]">{t(levelsEn[index], levelsKm[index])}</dt><dd><span className="text-sm text-[var(--ink)]">{t(place.en, place.kh)}</span> <code className="ml-1 text-xs text-[var(--gold)]">{place.code}</code></dd></div>)}</dl>}
    </section>}
    <p className="text-xs text-[var(--ink-faint)]">{t("Codes are matched exactly against the bundled reference dataset; gaps are not treated as sequential IDs.", "លេខកូដត្រូវបានផ្គូផ្គងជាក់លាក់ជាមួយទិន្នន័យយោងក្នុងកម្មវិធី ហើយលេខដែលរំលងមិនត្រូវបានចាត់ទុកជាលំដាប់ទេ។")}</p>
  </ToolShell>;
}
