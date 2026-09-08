"use client";

import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Select, TextInput, ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { decodePlusCode, encodePlusCode, isValidPlusCode } from "@/lib/open-location-code";

function toNum(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function PlusCodeConverter() {
  const { text: t } = useLanguage();
  const [lat, setLat] = useToolState("pluscode:lat", "11.5564");
  const [lng, setLng] = useToolState("pluscode:lng", "104.9282");
  const [codeLength, setCodeLength] = useToolState("pluscode:len", "10");
  const [code, setCode] = useToolState("pluscode:code", "");

  const encoded = useMemo(() => {
    const la = toNum(lat);
    const lo = toNum(lng);
    if (la === null || lo === null || la < -90 || la > 90 || lo < -180 || lo > 180) return null;
    return encodePlusCode(la, lo, Number(codeLength));
  }, [lat, lng, codeLength]);

  const decoded = useMemo(() => (code.trim() ? decodePlusCode(code) : null), [code]);
  const decodeError = code.trim() !== "" && !isValidPlusCode(code);

  const encodeSummary = useMemo(() => {
    if (!encoded) return "";
    return [
      `${t("Plus Code", "លេខកូដ Plus")}: ${encoded}`,
      `${t("Coordinates", "កូអរដោនេ")}: ${lat}, ${lng}`,
      `plus.codes/${encoded}`,
    ].join("\n");
  }, [encoded, lat, lng, t]);

  const decodeSummary = useMemo(() => {
    if (!decoded) return "";
    const m = 111320; // metres per degree latitude (approx)
    const latSize = (decoded.latHi - decoded.latLo) * m;
    const lngSize = (decoded.lngHi - decoded.lngLo) * m * Math.cos((decoded.latCenter * Math.PI) / 180);
    return [
      `${t("Center", "ចំណុចកណ្តាល")}: ${decoded.latCenter.toFixed(6)}, ${decoded.lngCenter.toFixed(6)}`,
      `${t("Bounds", "ព្រំដែន")}: ${decoded.latLo.toFixed(6)},${decoded.lngLo.toFixed(6)} → ${decoded.latHi.toFixed(6)},${decoded.lngHi.toFixed(6)}`,
      `${t("Cell size", "ទំហំក្រឡា")}: ≈ ${latSize.toFixed(1)} m × ${Math.abs(lngSize).toFixed(1)} m`,
    ].join("\n");
  }, [decoded, t]);

  return (
    <ToolShell
      title="Plus Code Converter"
      khmerTitle="ឧបករណ៍បម្លែងលេខកូដ Plus"
      description="Convert between latitude/longitude and Plus Codes (Open Location Code) — a free, standard way to share a precise location that has no street address."
      descriptionKm="បម្លែងរវាងរយៈទទឹង/រយៈបណ្តោយ និងលេខកូដ Plus (Open Location Code) — ជាមធ្យោបាយស្តង់ដារឥតគិតថ្លៃសម្រាប់ចែករំលែកទីតាំងច្បាស់លាស់ដែលគ្មានអាសយដ្ឋានផ្លូវ។"
    >
      {/* Coordinates → Plus Code */}
      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <h2 className="font-medium text-[var(--ink)]">{t("Coordinates → Plus Code", "កូអរដោនេ → លេខកូដ Plus")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Latitude" labelKm="រយៈទទឹង">
            <TextInput type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} />
          </Field>
          <Field label="Longitude" labelKm="រយៈបណ្តោយ">
            <TextInput type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} />
          </Field>
          <Field label="Code length" labelKm="ប្រវែងកូដ" hint="higher = more precise" hintKm="ខ្ពស់ = ច្បាស់ជាង">
            <Select value={codeLength} onChange={(e) => setCodeLength(e.target.value)}>
              <option value="10">{t("10 digits (~14 m)", "១០ ខ្ទង់ (~១៤ ម)")}</option>
              <option value="11">{t("11 digits (~3 m)", "១១ ខ្ទង់ (~៣ ម)")}</option>
              <option value="12">{t("12 digits (~0.6 m)", "១២ ខ្ទង់ (~០.៦ ម)")}</option>
            </Select>
          </Field>
        </div>
        {!encoded && (lat.trim() !== "" || lng.trim() !== "") && (
          <p className="text-sm text-[var(--danger)]">{t("Enter a valid latitude (−90…90) and longitude (−180…180).", "សូមបញ្ចូលរយៈទទឹង (−៩០…៩០) និងរយៈបណ្តោយ (−១៨០…១៨០) ត្រឹមត្រូវ។")}</p>
        )}
        <Output label={t("Plus Code", "លេខកូដ Plus")} value={encodeSummary} mono />
        {encoded && (
          <a href={`https://plus.codes/${encoded}`} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-[var(--gold)] underline underline-offset-2">
            {t("Open on plus.codes", "បើកនៅ plus.codes")} ↗
          </a>
        )}
      </section>

      {/* Plus Code → Coordinates */}
      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <h2 className="font-medium text-[var(--ink)]">{t("Plus Code → Coordinates", "លេខកូដ Plus → កូអរដោនេ")}</h2>
        <Field label="Full Plus Code" labelKm="លេខកូដ Plus ពេញ" hint="e.g. 7P36HW4H+H7" hintKm="ឧ. 7P36HW4H+H7">
          <TextInput value={code} onChange={(e) => setCode(e.target.value)} className="font-mono-ui" />
        </Field>
        {decodeError && (
          <p className="text-sm text-[var(--danger)]">{t("That is not a valid full Plus Code (it needs the + separator, e.g. 7P36HW4H+H7).", "នេះមិនមែនជាលេខកូដ Plus ពេញត្រឹមត្រូវទេ (ត្រូវមានសញ្ញា + ឧ. 7P36HW4H+H7)។")}</p>
        )}
        <Output label={t("Decoded location", "ទីតាំងដែលបានឌិកូដ")} value={decodeSummary} mono />
        {decoded && (
          <a href={`https://www.google.com/maps?q=${decoded.latCenter},${decoded.lngCenter}`} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-[var(--gold)] underline underline-offset-2">
            {t("Open center on Google Maps", "បើកចំណុចកណ្តាលនៅ Google Maps")} ↗
          </a>
        )}
      </section>

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Plus Codes (Open Location Code) are an open standard by Google (Apache-2.0). Codes are computed on your device from the coordinates you enter — nothing is sent to a server.",
          "លេខកូដ Plus (Open Location Code) ជាស្តង់ដារបើកចំហរបស់ Google (Apache-2.0)។ លេខកូដត្រូវបានគណនានៅលើឧបករណ៍របស់អ្នកពីកូអរដោនេដែលអ្នកបញ្ចូល — គ្មានអ្វីត្រូវបានផ្ញើទៅម៉ាស៊ីនមេទេ។"
        )}
      </p>
    </ToolShell>
  );
}
