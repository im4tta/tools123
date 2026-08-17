"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function rad(d: number) { return (d * Math.PI) / 180; }
function deg(r: number) { return (r * 180) / Math.PI; }

/** Approximate solar times (standard formula, no API). Treats local clock time ≈ solar time. */
function sunTimes(lat: number, lon: number, date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const doy = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const latR = rad(lat);
  const decl = rad(-23.44 * Math.cos(rad((360 / 365) * (doy + 10))));
  const zenith = rad(90.833);

  const cosH = (Math.cos(zenith) - Math.sin(latR) * Math.sin(decl)) / (Math.cos(latR) * Math.cos(decl));
  let sunrise: Date | null = null;
  let sunset: Date | null = null;
  if (cosH >= -1 && cosH <= 1) {
    const H = deg(Math.acos(cosH)) / 15;
    sunrise = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(12 - H), Math.round((12 - H - Math.floor(12 - H)) * 60));
    sunset = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(12 + H), Math.round((12 + H - Math.floor(12 + H)) * 60));
  }
  return { sunrise, sunset };
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function SunriseSunset() {
  const { text: t } = useLanguage();
  const [lat, setLat] = useToolState("sun:lat", "11.5564");
  const [lon, setLon] = useToolState("sun:lon", "104.9282");
  const [date, setDate] = useToolState("sun:date", new Date().toISOString().slice(0, 10));

  const calc = useMemo(() => {
    const la = Number(lat);
    const lo = Number(lon);
    if (Number.isNaN(la) || Number.isNaN(lo) || la < -90 || la > 90 || lo < -180 || lo > 180) return null;
    const parsed = new Date(date + "T12:00:00");
    if (Number.isNaN(parsed.getTime())) return null;
    return sunTimes(la, lo, parsed);
  }, [lat, lon, date]);

  const dayLen = calc?.sunrise && calc?.sunset ? (calc.sunset.getTime() - calc.sunrise.getTime()) / 3600000 : null;

  return (
    <ToolShell
      title="Sunrise / Sunset Calculator"
      khmerTitle="គណនាថ្ងៃរះ/ថ្ងៃលិច"
      description="Calculate sunrise and sunset times for any location and date — Phnom Penh by default."
      descriptionKm="គណនាម៉ោងថ្ងៃរះ និងថ្ងៃលិចសម្រាប់ទីតាំង និងកាលបរិច្ឆេទណាមួយ — លំនាំដើមគឺភ្នំពេញ។"
    >
      <Row>
        <Field label={t("Latitude", "រយៈទទឹង")}>
          <TextInput inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="11.5564" />
        </Field>
        <Field label={t("Longitude", "រយៈបណ្ដោយ")}>
          <TextInput inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value)} placeholder="104.9282" />
        </Field>
        <Field label={t("Date", "កាលបរិច្ឆេទ")}>
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </Row>

      {calc ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Sunrise", "ថ្ងៃរះ")}</div>
            <div className="mt-1 font-display text-2xl font-semibold text-[var(--gold)]">{fmtDate(calc.sunrise)}</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Sunset", "ថ្ងៃលិច")}</div>
            <div className="mt-1 font-display text-2xl font-semibold text-[var(--ink)]">{fmtDate(calc.sunset)}</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Day length", "រយៈពេលថ្ងៃ")}</div>
            <div className="mt-1 font-display text-2xl font-semibold text-[var(--ink)]">{dayLen !== null ? `${dayLen.toFixed(1)} h` : "—"}</div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter valid coordinates and date.", "សូមបញ្ចូលកូអរដោនេ និងកាលបរិច្ឆេទឱ្យបានត្រឹមត្រូវ។")}</p>
      )}
    </ToolShell>
  );
}