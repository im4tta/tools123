"use client";
import { useMemo } from "react";
import { MapPin, Navigation } from "lucide-react";
import addressData from "@/data/address_data.json";
import postalCodes from "@/data/postal_codes.json";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Select, TextInput, ToolShell } from "@/components/ui/Shell";
import { PROVINCE_CAPITALS, haversineKm } from "@/lib/cambodia-geo";
import { useToolState } from "@/lib/storage";

type Level = "province" | "district" | "commune" | "village";

type Place = {
  level: Level;
  code: string;
  en: string;
  kh: string;
  pathEn: string;
  pathKh: string;
  /** Commune-level 6-digit postal code, or "" when the area has no listed code. */
  postal: string;
};

const LEVEL_LABEL: Record<Level, [string, string]> = {
  province: ["Province / Capital", "រាជធានី / ខេត្ត"],
  district: ["District", "ក្រុង / ស្រុក / ខណ្ឌ"],
  commune: ["Commune / Sangkat", "ឃុំ / សង្កាត់"],
  village: ["Village", "ភូមិ"],
};

const LEVEL_RANK: Record<Level, number> = { province: 0, district: 1, commune: 2, village: 3 };

// Postal codes are assigned at commune (6-digit) level. A village inherits its
// parent commune's code (the first 6 digits of its 8-digit administrative code).
// We only present a postal code when it actually appears in the postal dataset,
// so we never invent one for the ~1% of communes not yet listed.
const POSTAL_SET = new Set(postalCodes.map((row) => row.code));
function postalFor(level: Level, code: string): string {
  const communeCode = level === "village" ? code.slice(0, 6) : level === "commune" ? code : "";
  return communeCode && POSTAL_SET.has(communeCode) ? communeCode : "";
}

export default function CambodiaPlaceFinder() {
  const { text: t } = useLanguage();
  const [query, setQuery] = useToolState("cambodia-place-finder:query", "");
  const [fromProv, setFromProv] = useToolState("cambodia-place-finder:from", "Phnom Penh");
  const [toProv, setToProv] = useToolState("cambodia-place-finder:to", "Siem Reap");

  // Flatten every province/district/commune/village into one searchable index.
  const index = useMemo(() => {
    const out: Place[] = [];
    for (const p of addressData) {
      out.push({ level: "province", code: p.code, en: p.en, kh: p.kh, pathEn: p.en, pathKh: p.kh, postal: "" });
      for (const d of p.districts) {
        out.push({ level: "district", code: d.code, en: d.en, kh: d.kh, pathEn: `${p.en} › ${d.en}`, pathKh: `${p.kh} › ${d.kh}`, postal: "" });
        for (const c of d.communes) {
          out.push({ level: "commune", code: c.code, en: c.en, kh: c.kh, pathEn: `${p.en} › ${d.en} › ${c.en}`, pathKh: `${p.kh} › ${d.kh} › ${c.kh}`, postal: postalFor("commune", c.code) });
          for (const v of c.villages) {
            out.push({ level: "village", code: v.code, en: v.en, kh: v.kh, pathEn: `${p.en} › ${d.en} › ${c.en} › ${v.en}`, pathKh: `${p.kh} › ${d.kh} › ${c.kh} › ${v.kh}`, postal: postalFor("village", v.code) });
          }
        }
      }
    }
    return out;
  }, []);

  // Rank matches so the most direct answer surfaces first: exact name, then
  // "starts with", then "contains"; higher administrative levels win ties.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as Place[];
    const scored: { place: Place; score: number }[] = [];
    for (const place of index) {
      const en = place.en.toLowerCase();
      const kh = place.kh;
      let score = -1;
      if (en === q || kh === q || place.code === q) score = 0;
      else if (en.startsWith(q) || kh.startsWith(q)) score = 1;
      else if (en.includes(q) || kh.includes(q) || place.code.includes(q)) score = 2;
      if (score >= 0) scored.push({ place, score });
    }
    scored.sort((a, b) => a.score - b.score || LEVEL_RANK[a.place.level] - LEVEL_RANK[b.place.level] || a.place.en.localeCompare(b.place.en));
    return scored.slice(0, 40).map((s) => s.place);
  }, [index, query]);

  const from = PROVINCE_CAPITALS.find((p) => p.en === fromProv);
  const to = PROVINCE_CAPITALS.find((p) => p.en === toProv);
  const distanceKm = from && to ? haversineKm(from.lat, from.lng, to.lat, to.lng) : null;

  return (
    <ToolShell
      title="Cambodia Place Finder"
      khmerTitle="ស្វែងរកទីកន្លែងកម្ពុជា"
      description="Ask about any place in Cambodia and get an instant answer: where it is (province › district › commune › village), its postal code, and the straight-line distance between two provinces. Covers all 25 provinces, 210 districts, 1,661 communes, and 14,546 villages."
      descriptionKm="សួរអំពីទីកន្លែងណាមួយក្នុងកម្ពុជា ហើយទទួលបានចម្លើយភ្លាមៗ៖ ស្ថិតនៅឯណា (ខេត្ត › ស្រុក › ឃុំ › ភូមិ) លេខកូដប្រៃសណីយ៍ និងចម្ងាយបន្ទាត់ត្រង់រវាងខេត្តពីរ។ គ្របដណ្តប់រាជធានី-ខេត្ត ២៥ ស្រុក ២១០ ឃុំ ១,៦៦១ និងភូមិ ១៤,៥៤៦។"
    >
      {/* ---- Ask about a place ---- */}
      <Field label="Where is it? Type a place name or code" labelKm="ស្ថិតនៅឯណា? វាយឈ្មោះទីកន្លែង ឬលេខកូដ" hint="EN, Khmer, or code" hintKm="ខ្មែរ អង់គ្លេស ឬលេខកូដ">
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("e.g. Siem Reap, បឹងកេងកង, Phnom, 12101…", "ឧ. សៀមរាប, បឹងកេងកង, ភ្នំ, 12101…")}
          autoComplete="off"
          autoFocus
        />
      </Field>

      <p className="text-xs text-[var(--ink-faint)]">
        {query.trim()
          ? t(`${results.length}${results.length === 40 ? "+" : ""} match${results.length === 1 ? "" : "es"}`, `រកឃើញ ${results.length}${results.length === 40 ? "+" : ""} លទ្ធផល`)
          : t("Type a province, district, commune, or village to get its location and postal code.", "វាយឈ្មោះខេត្ត ស្រុក ឃុំ ឬភូមិ ដើម្បីដឹងទីតាំង និងលេខកូដប្រៃសណីយ៍។")}
      </p>

      <div className="space-y-2">
        {results.map((place) => {
          const path = t(place.pathEn, place.pathKh);
          const name = t(place.en, place.kh);
          const copy = place.postal ? `${name}\n${path}\n${t("Postal code", "លេខកូដប្រៃសណីយ៍")}: ${place.postal}` : `${name}\n${path}`;
          return (
            <article key={`${place.level}-${place.code}`} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-[var(--gold)]" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <strong className="text-[var(--ink)]">{name}</strong>
                      <span className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{t(...LEVEL_LABEL[place.level])}</span>
                    </div>
                    <p className="mt-1 text-xs leading-6 text-[var(--ink-faint)]">{path}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {place.postal ? (
                    <code className="rounded bg-[var(--ground)] px-2 py-1 text-[var(--gold)]" title={t("Postal code", "លេខកូដប្រៃសណីយ៍")}>{place.postal}</code>
                  ) : (
                    <code className="rounded bg-[var(--ground)] px-2 py-1 text-[var(--ink-faint)]" title={t("Administrative code", "លេខកូដរដ្ឋបាល")}>{place.code}</code>
                  )}
                  <CopyButton text={copy} compact />
                </div>
              </div>
              {!place.postal && (place.level === "province" || place.level === "district") && (
                <p className="mt-2 pl-6 text-[11px] text-[var(--ink-faint)]">{t("Postal codes are assigned per commune — search a commune or village here for its code.", "លេខកូដប្រៃសណីយ៍ត្រូវបានកំណត់តាមឃុំ — សូមស្វែងរកឃុំ ឬភូមិ ដើម្បីដឹងលេខកូដ។")}</p>
              )}
            </article>
          );
        })}
      </div>

      {/* ---- Distance between provinces ---- */}
      <section className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--ink)]">
          <Navigation size={16} className="text-[var(--gold)]" />
          {t("Distance between two provinces", "ចម្ងាយរវាងខេត្តពីរ")}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="From" labelKm="ពី">
            <Select value={fromProv} onChange={(e) => setFromProv(e.target.value)}>
              {PROVINCE_CAPITALS.map((p) => <option key={p.en} value={p.en}>{p.en}</option>)}
            </Select>
          </Field>
          <Field label="To" labelKm="ទៅ">
            <Select value={toProv} onChange={(e) => setToProv(e.target.value)}>
              {PROVINCE_CAPITALS.map((p) => <option key={p.en} value={p.en}>{p.en}</option>)}
            </Select>
          </Field>
        </div>
        {distanceKm !== null && from && to && (
          <div className="mt-3 rounded-md border border-[var(--gold-dim)] bg-[var(--ground)] p-3">
            <p className="text-sm text-[var(--ink)]">
              {t(from.en, from.km)} <span className="text-[var(--ink-faint)]">→</span> {t(to.en, to.km)}
            </p>
            <p className="mt-1 text-2xl font-semibold text-[var(--gold)]">
              {fromProv === toProv ? t("Same province", "ខេត្តតែមួយ") : `≈ ${distanceKm.toFixed(0)} ${t("km", "គ.ម")}`}
            </p>
            <p className="mt-1 text-[11px] text-[var(--ink-faint)]">
              {t("Straight-line distance between provincial towns — not road distance. Approximate.", "ចម្ងាយបន្ទាត់ត្រង់រវាងទីរួមខេត្ត — មិនមែនចម្ងាយតាមផ្លូវទេ។ ជាការប៉ាន់ស្មាន។")}
            </p>
          </div>
        )}
      </section>

      {/* ---- Source & Credits ---- */}
      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t("Place names, administrative hierarchy, and codes come from Cambodia's standard province/district/commune/village dataset bundled with this app; postal codes are matched from the bundled Cambodia postal-code list. Province reference points are provincial-town coordinates, used only for the straight-line distance estimate.", "ឈ្មោះទីកន្លែង ឋានានុក្រមរដ្ឋបាល និងលេខកូដ មកពីទិន្នន័យខេត្ត-ស្រុក-ឃុំ-ភូមិស្តង់ដារកម្ពុជាដែលភ្ជាប់មកជាមួយកម្មវិធីនេះ។ លេខកូដប្រៃសណីយ៍ត្រូវបានផ្គូផ្គងពីបញ្ជីលេខកូដប្រៃសណីយ៍កម្ពុជា។ ចំណុចយោងខេត្តគឺជាកូអរដោនេទីរួមខេត្ត ប្រើសម្រាប់តែការប៉ាន់ស្មានចម្ងាយបន្ទាត់ត្រង់។")}</p>
        <p className="mt-2">{t("For official mail, addresses, or boundaries, verify against current Ministry of Interior and Cambodia Post records before use.", "សម្រាប់ការប្រើប្រាស់ផ្លូវការ សូមផ្ទៀងផ្ទាត់ជាមួយទិន្នន័យបច្ចុប្បន្នរបស់ក្រសួងមហាផ្ទៃ និងប្រៃសណីយ៍កម្ពុជាជាមុនសិន។")}</p>
      </section>
    </ToolShell>
  );
}
