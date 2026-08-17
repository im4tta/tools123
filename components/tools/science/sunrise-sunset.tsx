"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { CAMBODIA_PROVINCES } from "@/lib/cambodia-provinces";

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

/** Provincial-town coordinates for every Cambodian province. */
const KHMER_COORDS: Record<string, { lat: number; lon: number }> = {
  "12": { lat: 11.5564, lon: 104.9282 },
  "01": { lat: 13.5883, lon: 102.9787 },
  "02": { lat: 13.1027, lon: 103.2025 },
  "03": { lat: 11.9959, lon: 105.4542 },
  "04": { lat: 12.2503, lon: 104.6667 },
  "05": { lat: 11.4527, lon: 104.5143 },
  "06": { lat: 12.7111, lon: 104.8887 },
  "07": { lat: 10.6105, lon: 104.1805 },
  "08": { lat: 11.4833, lon: 104.95 },
  "23": { lat: 10.5364, lon: 104.3181 },
  "09": { lat: 11.6155, lon: 102.9811 },
  "10": { lat: 12.4881, lon: 106.0188 },
  "11": { lat: 12.4519, lon: 107.1881 },
  "22": { lat: 14.1817, lon: 103.5176 },
  "24": { lat: 12.8539, lon: 102.6083 },
  "13": { lat: 13.786, lon: 104.977 },
  "14": { lat: 11.481, lon: 105.3198 },
  "15": { lat: 12.5388, lon: 103.9195 },
  "16": { lat: 13.7412, lon: 106.9944 },
  "17": { lat: 13.3622, lon: 103.8597 },
  "18": { lat: 10.6253, lon: 103.5234 },
  "19": { lat: 13.5225, lon: 105.968 },
  "20": { lat: 11.087, lon: 105.8 },
  "21": { lat: 10.9831, lon: 104.7837 },
  "25": { lat: 11.894, lon: 105.6725 },
};

type WorldCity = { id: string; en: string; km: string; lat: number; lon: number };

const WORLD_CITIES: WorldCity[] = [
  { id: "bangkok", en: "Bangkok", km: "បាងកក", lat: 13.7563, lon: 100.5018 },
  { id: "ho-chi-minh", en: "Ho Chi Minh City", km: "ហូជីមិញ", lat: 10.8231, lon: 106.6297 },
  { id: "hanoi", en: "Hanoi", km: "ហាណូយ", lat: 21.0278, lon: 105.8342 },
  { id: "kuala-lumpur", en: "Kuala Lumpur", km: "កូឡាឡាំពួរ", lat: 3.139, lon: 101.6869 },
  { id: "singapore", en: "Singapore", km: "សិង្ហបុរី", lat: 1.3521, lon: 103.8198 },
  { id: "jakarta", en: "Jakarta", km: "ចាការតា", lat: -6.2088, lon: 106.8456 },
  { id: "manila", en: "Manila", km: "ម៉ានីល", lat: 14.5995, lon: 120.9842 },
  { id: "hong-kong", en: "Hong Kong", km: "ហុងកុង", lat: 22.3193, lon: 114.1694 },
  { id: "taipei", en: "Taipei", km: "តៃប៉ិ", lat: 25.033, lon: 121.5654 },
  { id: "tokyo", en: "Tokyo", km: "តូក្យូ", lat: 35.6762, lon: 139.6503 },
  { id: "seoul", en: "Seoul", km: "សេអ៊ូល", lat: 37.5665, lon: 126.978 },
  { id: "beijing", en: "Beijing", km: "ប៉េកាំង", lat: 39.9042, lon: 116.4074 },
  { id: "shanghai", en: "Shanghai", km: "សៀងហៃ", lat: 31.2304, lon: 121.4737 },
  { id: "delhi", en: "New Delhi", km: "ញូដេលី", lat: 28.7041, lon: 77.1025 },
  { id: "mumbai", en: "Mumbai", km: "មុមបៃ", lat: 19.076, lon: 72.8777 },
  { id: "dubai", en: "Dubai", km: "ឌូបៃ", lat: 25.2048, lon: 55.2708 },
  { id: "sydney", en: "Sydney", km: "ស៊ីដនី", lat: -33.8688, lon: 151.2093 },
  { id: "auckland", en: "Auckland", km: "អូកលែន", lat: -36.8485, lon: 174.7633 },
  { id: "london", en: "London", km: "ទីក្រុងឡុងដ៍", lat: 51.5074, lon: -0.1278 },
  { id: "paris", en: "Paris", km: "ទីក្រុងប៉ារីស", lat: 48.8566, lon: 2.3522 },
  { id: "berlin", en: "Berlin", km: "ទីក្រុងប៊ែរឡាំង", lat: 52.52, lon: 13.405 },
  { id: "moscow", en: "Moscow", km: "ទីក្រុងមូស្គូ", lat: 55.7558, lon: 37.6173 },
  { id: "new-york", en: "New York", km: "ទីក្រុងញូវយ៉ក", lat: 40.7128, lon: -74.006 },
  { id: "los-angeles", en: "Los Angeles", km: "ឡូសអេនជឺលេស", lat: 34.0522, lon: -118.2437 },
  { id: "san-francisco", en: "San Francisco", km: "សាន់ហ្វ្រាន់ស៊ីស្កូ", lat: 37.7749, lon: -122.4194 },
  { id: "toronto", en: "Toronto", km: "តូរ៉ុនតូ", lat: 43.6532, lon: -79.3832 },
  { id: "mexico-city", en: "Mexico City", km: "ទីក្រុងម៉ិកស៊ិក", lat: 19.4326, lon: -99.1332 },
  { id: "sao-paulo", en: "São Paulo", km: "សៅប៉ូឡូ", lat: -23.5505, lon: -46.6333 },
  { id: "nairobi", en: "Nairobi", km: "ណៃរ៉ូប៊ី", lat: -1.2921, lon: 36.8219 },
  { id: "cairo", en: "Cairo", km: "កៃរ៉ូ", lat: 30.0444, lon: 31.2357 },
  { id: "cape-town", en: "Cape Town", km: "កេបថោន", lat: -33.9249, lon: 18.4241 },
];

export default function SunriseSunset() {
  const { text: t } = useLanguage();
  const [loc, setLoc] = useToolState("sun:loc", "12");
  const [lat, setLat] = useToolState("sun:lat", "11.5564");
  const [lon, setLon] = useToolState("sun:lon", "104.9282");
  const [date, setDate] = useToolState("sun:date", new Date().toISOString().slice(0, 10));

  const pickLocation = (id: string) => {
    setLoc(id);
    if (id === "custom") return;
    const world = WORLD_CITIES.find((c) => c.id === id);
    const coords = world ? { lat: world.lat, lon: world.lon } : KHMER_COORDS[id];
    if (coords) {
      setLat(String(coords.lat));
      setLon(String(coords.lon));
    }
  };

  const onLat = (v: string) => { setLat(v); setLoc("custom"); };
  const onLon = (v: string) => { setLon(v); setLoc("custom"); };

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
        <Field label={t("Location", "ទីតាំង")}>
          <Select value={loc} onChange={(e) => pickLocation(e.target.value)}>
            <optgroup label={t("Cambodia", "កម្ពុជា")}>
              {CAMBODIA_PROVINCES.map((p) => (
                <option key={p.code} value={p.code}>{t(p.en, p.km)}</option>
              ))}
            </optgroup>
            <optgroup label={t("World", "ពិភពលោក")}>
              {WORLD_CITIES.map((c) => (
                <option key={c.id} value={c.id}>{t(c.en, c.km)}</option>
              ))}
            </optgroup>
            <optgroup label={t("Custom", "ផ្ទាល់ខ្លួន")}>
              <option value="custom">{t("Custom coordinates…", "កូអរដោនេផ្ទាល់ខ្លួន…")}</option>
            </optgroup>
          </Select>
        </Field>
        <Field label={t("Date", "កាលបរិច្ឆេទ")}>
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </Row>

      <Row>
        <Field label={t("Latitude", "រយៈទទឹង")}>
          <TextInput inputMode="decimal" value={lat} onChange={(e) => onLat(e.target.value)} placeholder="11.5564" />
        </Field>
        <Field label={t("Longitude", "រយៈបណ្ដោយ")}>
          <TextInput inputMode="decimal" value={lon} onChange={(e) => onLon(e.target.value)} placeholder="104.9282" />
        </Field>
        <div className="self-end pb-1 text-xs text-[var(--ink-dim)]">{t("Picking a location fills these in. Edit them for a custom spot.", "ការជ្រើសរើសទីតាំងនឹងបំពេញតម្លៃទាំងនេះ។ កែសម្រួលវាសម្រាប់ទីតាំងផ្ទាល់ខ្លួន។")}</div>
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