"use client";
import { useMemo } from "react";
import { CarFront, Info } from "lucide-react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// Ride / tuk-tuk fare estimator for Phnom Penh — the DEFAULT base and per-km
// rates are SAMPLE placeholders, not real fares. Actual fares vary by provider,
// surge, vehicle and time. Use with your own observed rates.
type Vehicle = { id: string; label: string; labelKm: string; base: number; perKm: number; note: string; noteKm: string };
const VEHICLES: Vehicle[] = [
  { id: "tuktuk", label: "Tuk-tuk (sample)", labelKm: "ទុកទុក (គំរូ)", base: 4000, perKm: 1200, note: "Short local trips — set your own rate", noteKm: "ដំណើរខ្លីក្នុងក្រុង — កំណត់អត្រារបស់អ្នក" },
  { id: "grab", label: "GrabBike (sample)", labelKm: "GrabBike (គំរូ)", base: 3500, perKm: 1500, note: "Booking app — use your own rate", noteKm: "កម្មវិធីកក់ — ប្រើអត្រារបស់អ្នក" },
  { id: "car", label: "Ride-hailing car (sample)", labelKm: "រថយន្តកិច្ចសន្យា (គំរូ)", base: 12000, perKm: 2500, note: "AC sedan — set your own rate", noteKm: "រថយន្តម៉ាស៊ីនត្រជាក់ — កំណត់អត្រារបស់អ្នក" },
  { id: "remork", label: "Remorque (sample)", labelKm: "រម៉ក (គំរូ)", base: 8000, perKm: 1800, note: "Groups / goods — set your own rate", noteKm: "ក្រុម / ទំនិញ — កំណត់អត្រារបស់អ្នក" },
];

const EXCHANGE_DEFAULT = "4100";

function toNum(v: string) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function khr(n: number) { return `${Math.round(n).toLocaleString("en-US")} ៛`; }
function km(v: string) { const n = toNum(v); return Number.isFinite(n) ? n : 0; }

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371, r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(lat2 - lat1), dLon = r(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export default function RideFareEstimator() {
  const { text: t } = useLanguage();
  const [vehicleId, setVehicleId] = useToolState("ride:vehicle", "grab");
  const [distance, setDistance] = useToolState("ride:distance", "5");
  const [lat1, setLat1] = useToolState("ride:lat1", "11.5564");
  const [lon1, setLon1] = useToolState("ride:lon1", "104.9282");
  const [lat2, setLat2] = useToolState("ride:lat2", "11.5626");
  const [lon2, setLon2] = useToolState("ride:lon2", "104.9908");
  const [exchange, setExchange] = useToolState("ride:exchange", EXCHANGE_DEFAULT);
  const [useCoords, setUseCoords] = useToolState<"0" | "1">("ride:useCoords", "0");

  const vehicle = VEHICLES.find((v) => v.id === vehicleId) ?? VEHICLES[0];
  const ex = toNum(exchange) || 1;

  const result = useMemo(() => {
    let dist = km(distance);
    if (useCoords === "1" && [lat1, lon1, lat2, lon2].every((v) => Number.isFinite(toNum(v)))) {
      dist = haversineKm(toNum(lat1), toNum(lon1), toNum(lat2), toNum(lon2));
    }
    const fareKhr = vehicle.base + dist * vehicle.perKm;
    return { dist, fareKhr, fareUsd: fareKhr / ex };
  }, [distance, useCoords, lat1, lon1, lat2, lon2, vehicle, ex]);

  return (
    <ToolShell
      title="Phnom Penh Ride Fare Estimator"
      khmerTitle="ប៉ាន់ស្មានថ្លៃជិះភ្នំពេញ"
      description="Estimate a tuk-tuk or ride-hailing fare from distance or two points — the default base and per-km rates are sample placeholders, so set your own rates before relying on the estimate."
      descriptionKm="ប៉ាន់ស្មានថ្លៃទុកទុក ឬរថយន្តកិច្ចសន្យាពីចម្ងាយ ឬពីរចំណុច — អត្រាមូលដ្ឋាន និងក្នុងមួយគីឡូម៉ែត្រលំនាំដើមគឺជាគំរូ សូមកំណត់អត្រាផ្ទាល់ខ្លួនមុនពេលពឹងផ្អែក។"
    >
      <Row>
        <Field label={t("Vehicle type", "ប្រភេទយាន")}>
          <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            {VEHICLES.map((v) => (
              <option key={v.id} value={v.id}>{v.label} — {v.note}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("Exchange rate", "អត្រាប្តូរប្រាក់")} hint={`$1 = ${Math.round(ex).toLocaleString("en-US")} ៛`}>
          <TextInput type="number" min="1" step="1" value={exchange} onChange={(e) => setExchange(e.target.value)} />
        </Field>
      </Row>

      <Field label={t("Distance mode", "របៀបចម្ងាយ")}>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={() => setUseCoords("0")} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${useCoords === "0" ? "bg-[var(--gold)] text-[#0a0c0d]" : "bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}>{t("Enter km", "បញ្ចូលគីឡូម៉ែត្រ")}</button>
          <button type="button" onClick={() => setUseCoords("1")} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${useCoords === "1" ? "bg-[var(--gold)] text-[#0a0c0d]" : "bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}>{t("Two points", "ពីរចំណុច")}</button>
        </div>
      </Field>

      {useCoords === "0" ? (
        <Field label={t("Distance (km)", "ចម្ងាយ (គីឡូម៉ែត្រ)")}>
          <TextInput type="number" min="0.1" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} />
        </Field>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("Start lat / lng", "ចំណុចចេញ lat / lng")}>
            <div className="flex gap-2">
              <TextInput value={lat1} onChange={(e) => setLat1(e.target.value)} placeholder="lat" className="font-mono-ui" />
              <TextInput value={lon1} onChange={(e) => setLon1(e.target.value)} placeholder="lng" className="font-mono-ui" />
            </div>
          </Field>
          <Field label={t("End lat / lng", "ចំណុចចូល lat / lng")}>
            <div className="flex gap-2">
              <TextInput value={lat2} onChange={(e) => setLat2(e.target.value)} placeholder="lat" className="font-mono-ui" />
              <TextInput value={lon2} onChange={(e) => setLon2(e.target.value)} placeholder="lng" className="font-mono-ui" />
            </div>
          </Field>
        </div>
      )}

      <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{t("Distance", "ចម្ងាយ")}</div>
            <div className="mt-1 text-xl font-bold text-[var(--ink)]">{result.dist.toFixed(2)} km</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{t("Base", "មូលដ្ឋាន")}</div>
            <div className="mt-1 text-xl font-bold text-[var(--ink)]">{khr(vehicle.base)}</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{t("Per km", "ក្នុងមួយគីឡូម៉ែត្រ")}</div>
            <div className="mt-1 text-xl font-bold text-[var(--ink)]">{khr(vehicle.perKm)}</div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-md border border-[var(--success)]/40 bg-[var(--success)]/10 px-4 py-3">
          <span className="flex items-center gap-2 font-semibold text-[var(--ink)]">
            <CarFront size={17} className="text-[var(--success)]" />
            {t("Estimated fare", "ថ្លៃប៉ាន់ស្មាន")}
          </span>
          <span className="text-xl font-bold text-[var(--success)]">
            {khr(result.fareKhr)} · ${result.fareUsd.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <Info size={14} className="mt-0.5 shrink-0 text-[var(--gold)]" />
        <span>
          {t("The default base and per-km rates are sample placeholders only, not real fares. Real fares vary by provider, demand/surge, time of day, exact route and vehicle. Use your own observed rates for the vehicle. Distance is a straight line, so the actual road distance may be longer.", "អត្រាមូលដ្ឋាន និងក្នុងមួយគីឡូម៉ែត្រលំនាំដើមគឺជាគំរូតែប៉ុណ្ណោះ មិនមែនជាថ្លៃពិតទេ។ ថ្លៃពិតប្រែប្រួលតាមក្រុមហ៊ុន តម្រូវការ ពេលវេលា ផ្លូវពិត និងយាន។ ប្រើអត្រាដែលអ្នកបានសង្កេតផ្ទាល់សម្រាប់យាននីមួយៗ។ ចម្ងាយជាបន្ទាត់ត្រង់ ផ្លូវពិតអាចវែងជាង។")}
        </span>
      </div>
    </ToolShell>
  );
}

