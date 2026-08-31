"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------
// Low-precision solar position (Jean Meeus, "Astronomical Algorithms", 2nd ed.
// ch. 22/25; equations also used by the NOAA Solar Calculator):
//   • Julian Date ↔ Gregorian calendar: Meeus ch. 7.
//   • Apparent solar longitude λ: mean longitude + equation of centre,
//     corrected for nutation/aberration (Meeus ch. 25).
//   • Seasons occur when the geocentric apparent longitude of the Sun reaches
//     0° (March equinox), 90° (June solstice), 180° (Sept equinox),
//     270° (Dec solstice). Newton iteration uses the Sun's mean motion
//     ≈ 0.98564736°/day.
//   • Day length from the NOAA sunrise equation: cos ω0 = −tan φ · tan δ,
//     daylight = 2·ω0 / 15 hours, with declination δ = asin(sin ε · sin λ).
// Results are an approximate astronomical estimate (accurate to a few minutes).
// ---------------------------------------------------------------------------

function jdn(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

function fromJD(jd: number): { y: number; m: number; d: number; frac: number } {
  const Z = Math.floor(jd + 0.5);
  const F = jd + 0.5 - Z;
  let A = Z;
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const day = B - D - Math.floor(30.6001 * E) + F;
  const m = E < 14 ? E - 1 : E - 13;
  const y = m > 2 ? C - 4716 : C - 4715;
  return { y, m, d: Math.floor(day), frac: day - Math.floor(day) };
}

function solarLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mr = M * DEG;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) +
    0.000289 * Math.sin(3 * Mr);
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * DEG);
  return ((lambda % 360) + 360) % 360;
}

function solarDeclination(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  const eps = 23.43929111 - 0.0130042 * T; // mean obliquity of the ecliptic (deg)
  const lambda = solarLongitude(jd) * DEG;
  return Math.asin(Math.sin(eps * DEG) * Math.sin(lambda)) / DEG;
}

const APPROX_EVENT_DATE: Record<number, [number, number]> = {
  0: [3, 20],
  90: [6, 21],
  180: [9, 22],
  270: [12, 21],
};

function eventJD(year: number, target: number): number {
  const [m, d] = APPROX_EVENT_DATE[target];
  let jd = jdn(year, m, d) - 0.5; // 0h UT
  for (let i = 0; i < 5; i++) {
    const lam = solarLongitude(jd);
    const diff = ((lam - target + 540) % 360) - 180;
    jd -= diff / 0.98564736;
  }
  return jd;
}

function dayLengthHours(jd: number, lat: number): number {
  const dec = solarDeclination(jd) * DEG;
  const phi = lat * DEG;
  const cosOmega = -Math.tan(phi) * Math.tan(dec);
  if (cosOmega >= 1) return 24; // polar day
  if (cosOmega <= -1) return 0; // polar night
  return ((2 * Math.acos(cosOmega)) / DEG) / 15;
}

const pad = (n: number) => String(n).padStart(2, "0");

const EVENTS = [
  { target: 0, nameEn: "March equinox", nameKm: "ថ្ងៃសមរាត្រីខែមីនា", seasonEn: "Spring", seasonKm: "រដូវផ្ការីក" },
  { target: 90, nameEn: "June solstice", nameKm: "ថ្ងៃសូលស្ទីសខែមិថុនា", seasonEn: "Summer", seasonKm: "រដូវក្ដៅ" },
  { target: 180, nameEn: "September equinox", nameKm: "ថ្ងៃសមរាត្រីខែកញ្ញា", seasonEn: "Autumn", seasonKm: "រដូវស្លឹកឈើជ្រុះ" },
  { target: 270, nameEn: "December solstice", nameKm: "ថ្ងៃសូលស្ទីសខែធ្នូ", seasonEn: "Winter", seasonKm: "រដូវរងា" },
];

export default function SolsticeCalculator() {
  const { text: t } = useLanguage();
  const [yearStr, setYearStr] = useToolState("solstice-calculator:year", "2026");
  const [latStr, setLatStr] = useToolState("solstice-calculator:lat", "40");

  const result = useMemo(() => {
    const year = Math.floor(Number(yearStr));
    const lat = Number(latStr);
    if (!Number.isFinite(year) || year < 1600 || year > 3000) return null;
    if (!Number.isFinite(lat) || lat < -66.5 || lat > 66.5) return null;
    return EVENTS.map((e) => {
      const jd = eventJD(year, e.target);
      const { y, m, d, frac } = fromJD(jd);
      const totalMin = Math.round(frac * 1440);
      const hh = Math.floor(totalMin / 60);
      const mm = totalMin % 60;
      const hours = dayLengthHours(jd, lat);
      const date = new Date(Date.UTC(y, m - 1, d, hh, mm));
      return { ...e, iso: `${y}-${pad(m)}-${pad(d)} ${pad(hh)}:${pad(mm)} UTC`, date, hours };
    });
  }, [yearStr, latStr]);

  return (
    <ToolShell
      title="Solstice & Equinox Calculator"
      khmerTitle="គណនាសុរិយដ្ឋាន"
      description="Approximate dates and times of the equinoxes and solstices for any year, with day-length comparison."
      descriptionKm="គណនាកាលបរិច្ឆេទ និងម៉ោងប្រហាក់ប្រហែលនៃថ្ងៃសមរាត្រី និងថ្ងៃសូលស្ទីស សម្រាប់ឆ្នាំណាមួយ រួមជាមួយការប្រៀបធៀបរយៈពេលថ្ងៃ។"
    >
      <Row>
        <Field label={t("Year", "ឆ្នាំ")} hint={t("1600–3000", "១៦០០–៣០០០")}>
          <TextInput inputMode="numeric" value={yearStr} onChange={(e) => setYearStr(e.target.value)} />
        </Field>
        <Field label={t("Latitude (north positive)", "រយៈទទឹង (ខាងជើងជាវិជ្ជមាន)")}>
          <TextInput inputMode="decimal" value={latStr} onChange={(e) => setLatStr(e.target.value)} />
        </Field>
      </Row>

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Approximate astronomical estimate based on low-precision solar-position formulas (Meeus / NOAA). Times are UT; local time is also shown.",
          "ការប៉ាន់ស្មានតារាសាស្ត្រប្រហាក់ប្រហែល ដោយផ្អែកលើរូបមន្តទីតាំងព្រះអាទិត្យ (Meeus / NOAA)។ ម៉ោងគិតជា UT ហើយក៏បង្ហាញម៉ោងតាមមូលដ្ឋានផងដែរ។"
        )}
      </p>

      {result ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {result.map((e) => (
            <div key={e.target} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-sm font-semibold text-[var(--ink)]">{t(e.nameEn, e.nameKm)}</div>
                <div className="text-xs text-[var(--gold)]">{t(e.seasonEn, e.seasonKm)}</div>
              </div>
              <div className="mt-2 font-mono-ui text-sm text-[var(--ink)]">{e.iso}</div>
              <div className="text-xs text-[var(--ink-dim)]">
                {t("Local", "មូលដ្ឋាន")}: {e.date.toLocaleString()}
              </div>
              <div className="mt-2 text-xs text-[var(--ink-dim)]">
                {t("Day length at", "រយៈពេលថ្ងៃនៅ")} {latStr}°:{" "}
                <b className="text-[var(--gold)]">
                  {Math.floor(e.hours)}h {Math.round((e.hours % 1) * 60)}m
                </b>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">
          {t(
            "Enter a valid year (1600–3000) and a latitude between -66.5 and 66.5.",
            "សូមបញ្ចូលឆ្នាំ (១៦០០–៣០០០) និងរយៈទទឹងចន្លោះ -៦៦.៥ និង ៦៦.៥ ឱ្យបានត្រឹមត្រូវ។"
          )}
        </p>
      )}
    </ToolShell>
  );
}
