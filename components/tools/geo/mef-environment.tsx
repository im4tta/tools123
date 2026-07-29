"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/Output";
import { Field, Select, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

type EndpointMode = "weather" | "uv" | "aqi";
type Mode = EndpointMode | "overview";
type Status = "loading" | "ready" | "error";
type MefRow = { name?: unknown; last_updated?: unknown; [key: string]: unknown };

const META = {
  overview: { title: "Cambodia Environment Dashboard", khmer: "ផ្ទាំងព័ត៌មានបរិស្ថានកម្ពុជា", description: "View live weather, UV, and air quality together for Cambodian locations using official Ministry of Economy and Finance datasets.", descriptionKm: "មើលអាកាសធាតុ សន្ទស្សន៍កាំរស្មី UV និងគុណភាពខ្យល់បច្ចុប្បន្នរួមគ្នាសម្រាប់ទីតាំងនៅកម្ពុជា ដោយប្រើទិន្នន័យផ្លូវការរបស់ក្រសួងសេដ្ឋកិច្ច និងហិរញ្ញវត្ថុ។" },
  weather: { title: "Cambodia Live Weather", khmer: "អាកាសធាតុបច្ចុប្បន្ននៅកម្ពុជា", description: "Current weather for Cambodian locations from the Ministry of Economy and Finance live dataset.", descriptionKm: "អាកាសធាតុបច្ចុប្បន្នសម្រាប់ទីតាំងនៅកម្ពុជា ពីទិន្នន័យបច្ចុប្បន្នរបស់ក្រសួងសេដ្ឋកិច្ច និងហិរញ្ញវត្ថុ។" },
  uv: { title: "Cambodia UV Index", khmer: "សន្ទស្សន៍កាំរស្មី UV នៅកម្ពុជា", description: "Current ultraviolet index and exposure category for Cambodian locations from the Ministry of Economy and Finance.", descriptionKm: "សន្ទស្សន៍កាំរស្មីអ៊ុលត្រាវីយូឡេ និងកម្រិតហានិភ័យបច្ចុប្បន្នសម្រាប់ទីតាំងនៅកម្ពុជា ពីក្រសួងសេដ្ឋកិច្ច និងហិរញ្ញវត្ថុ។" },
  aqi: { title: "Cambodia Air Quality", khmer: "គុណភាពខ្យល់នៅកម្ពុជា", description: "Current US EPA air-quality category and pollutant readings for Cambodian locations from the Ministry of Economy and Finance.", descriptionKm: "កម្រិតគុណភាពខ្យល់តាមស្តង់ដារ US EPA និងទិន្នន័យសារធាតុបំពុលបច្ចុប្បន្នសម្រាប់ទីតាំងនៅកម្ពុជា ពីក្រសួងសេដ្ឋកិច្ច និងហិរញ្ញវត្ថុ។" },
} as const;

const LOCATION_KM: Record<string, string> = {
  "Phnom Penh": "ភ្នំពេញ", "Sihanoukville": "ព្រះសីហនុ", "Kampong Chhnang": "កំពង់ឆ្នាំង", "Ratanakiri": "រតនគិរី", "Siem Reap": "សៀមរាប", "Battambang": "បាត់ដំបង", "Takeo": "តាកែវ", "Koh Kong": "កោះកុង", "Kratie": "ក្រចេះ", "Kampot": "កំពត", "Kep": "កែប", "Kampong Thom": "កំពង់ធំ", "Svay Rieng": "ស្វាយរៀង", "Mondulkiri": "មណ្ឌលគិរី", "Banteay Meanchey": "បន្ទាយមានជ័យ", "Kandal": "កណ្ដាល", "Prey Veng": "ព្រៃវែង", "Strung Treng": "ស្ទឹងត្រែង", "Preah Vihear": "ព្រះវិហារ", "Tboung Khmum": "ត្បូងឃ្មុំ", "Pailin": "ប៉ៃលិន", "Kampong Speu": "កំពង់ស្ពឺ", "Kampong Cham": "កំពង់ចាម", "Oddar Meanchey": "ឧត្តរមានជ័យ", "Pursat": "ពោធិ៍សាត់",
};

const CONDITION_KM: Record<string, string> = {
  "Moderate or heavy rain shower": "ភ្លៀងធ្លាក់ពីមធ្យមទៅខ្លាំង", "Light rain shower": "ភ្លៀងរលឹមស្រាល", "Light drizzle": "ភ្លៀងរលឹម", "Patchy rain nearby": "មានភ្លៀងនៅក្បែរ", "Moderate rain": "ភ្លៀងមធ្យម", "Light rain": "ភ្លៀងស្រាល",
};
function numberValue(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function textValue(value: unknown) { return typeof value === "string" && value.trim() ? value : null; }
function condition(row: MefRow) { return row.condition && typeof row.condition === "object" ? textValue((row.condition as { text?: unknown }).text) : null; }
function uvBand(value: number): [string, string] {
  if (value < 3) return ["Low", "ទាប"];
  if (value < 6) return ["Moderate", "មធ្យម"];
  if (value < 8) return ["High", "ខ្ពស់"];
  if (value < 11) return ["Very high", "ខ្ពស់ខ្លាំង"];
  return ["Extreme", "គ្រោះថ្នាក់ខ្លាំង"];
}
const AQI_BANDS: [string, string][] = [["Unknown", "មិនស្គាល់"], ["Good", "ល្អ"], ["Moderate", "មធ្យម"], ["Unhealthy for sensitive groups", "មិនល្អសម្រាប់ក្រុមងាយរងគ្រោះ"], ["Unhealthy", "មិនល្អ"], ["Very unhealthy", "មិនល្អខ្លាំង"], ["Hazardous", "គ្រោះថ្នាក់"]];

async function fetchEndpoint(mode: EndpointMode, signal?: AbortSignal) {
  const response = await fetch(`https://data.mef.gov.kh/api/v1/realtime-api/${mode}`, { signal, cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`MEF returned ${response.status}`);
  const payload = (await response.json()) as { data?: MefRow[] };
  if (!Array.isArray(payload.data)) throw new Error("Invalid MEF response");
  return payload.data.filter((row) => textValue(row.name));
}

async function fetchRows(mode: Mode, signal?: AbortSignal) {
  if (mode !== "overview") {
    const rows = await fetchEndpoint(mode, signal);
    if (!rows.length) throw new Error("MEF returned no locations");
    return rows.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }
  const results = await Promise.allSettled([
    fetchEndpoint("weather", signal),
    fetchEndpoint("uv", signal),
    fetchEndpoint("aqi", signal),
  ]);
  if (signal?.aborted) throw new DOMException("Request aborted", "AbortError");

  // Merge the union of every fulfilled dataset instead of treating weather as
  // the master list. A temporary failure or a naming-order difference in one
  // feed no longer hides valid locations from the combined dashboard.
  const byLocation = new Map<string, MefRow>();
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const row of result.value) {
      const name = String(row.name).trim();
      const key = name.toLocaleLowerCase("en");
      const previous = byLocation.get(key);
      byLocation.set(key, { ...previous, ...row, name: previous?.name ?? name });
    }
  }
  const rows = Array.from(byLocation.values());
  if (!rows.length) throw new Error("MEF returned no locations");
  return rows.sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

function LocalizedLocation({ name }: { name: string }) {
  const { text: t } = useLanguage();
  return <>{t(name, LOCATION_KM[name] ?? name)}</>;
}
function Summary({ mode, row }: { mode: Mode; row: MefRow }) {
  const { text: t } = useLanguage();
  const weather = condition(row);
  const weatherLabel = weather ? t(weather, CONDITION_KM[weather] ?? weather) : t("No condition", "គ្មានព័ត៌មានអាកាសធាតុ");
  const uv = numberValue(row.uv);
  const uvLevel = uv === null ? ["Unknown", "មិនស្គាល់"] as [string, string] : uvBand(uv);
  const index = numberValue(row.us_epa_index);
  const airLevel = index === null ? AQI_BANDS[0] : AQI_BANDS[index] ?? AQI_BANDS[0];
  if (mode === "overview") return <><strong className="text-xl text-[var(--ink)]">{numberValue(row.temp_c)?.toFixed(1) ?? "—"}°C · UV {uv?.toFixed(1) ?? "—"} · EPA {index ?? "—"}</strong><span>{weatherLabel} · {t(uvLevel[0], uvLevel[1])} · {t(airLevel[0], airLevel[1])}</span><span>{t("Humidity", "សំណើម")} {numberValue(row.humidity) ?? "—"}% · PM2.5 {numberValue(row.pm2_5) ?? "—"} µg/m³</span></>;
  if (mode === "weather") return <><strong className="text-2xl text-[var(--ink)]">{numberValue(row.temp_c)?.toFixed(1) ?? "—"}°C</strong><span>{weatherLabel}</span><span>{t("Humidity", "សំណើម")} {numberValue(row.humidity) ?? "—"}% · {t("Wind", "ខ្យល់")} {numberValue(row.wind_kph) ?? "—"} km/h</span></>;
  if (mode === "uv") return <><strong className="text-2xl text-[var(--ink)]">UV {uv?.toFixed(1) ?? "—"}</strong><span>{t(uvLevel[0], uvLevel[1])}</span><span>{t("Use sun protection when exposure is elevated.", "សូមប្រើការការពារកម្តៅថ្ងៃ នៅពេលកម្រិតកាំរស្មីកើនឡើង។")}</span></>;
  return <><strong className="text-2xl text-[var(--ink)]">EPA {index ?? "—"}</strong><span>{t(airLevel[0], airLevel[1])}</span><span>PM2.5 {numberValue(row.pm2_5) ?? "—"} · PM10 {numberValue(row.pm10) ?? "—"} µg/m³</span></>;
}

function DetailGrid({ mode, row }: { mode: Mode; row: MefRow }) {
  const { text: t } = useLanguage();
  const weather = condition(row);
  const uv = numberValue(row.uv);
  const index = numberValue(row.us_epa_index);
  const values: [string, string, string][] = mode === "overview"
    ? [["Temperature", "សីតុណ្ហភាព", `${numberValue(row.temp_c)?.toFixed(1) ?? "—"}°C`], ["Weather", "អាកាសធាតុ", weather ? t(weather, CONDITION_KM[weather] ?? weather) : "—"], ["UV index", "សន្ទស្សន៍ UV", uv?.toFixed(1) ?? "—"], ["UV exposure", "កម្រិតកាំរស្មី UV", uv === null ? "—" : t(...uvBand(uv))], ["Air quality", "គុណភាពខ្យល់", index === null ? "—" : t(...(AQI_BANDS[index] ?? AQI_BANDS[0]))], ["PM2.5", "PM2.5", `${numberValue(row.pm2_5) ?? "—"} µg/m³`]]
    : mode === "weather"
      ? [["Feels like", "មានអារម្មណ៍ដូច", `${numberValue(row.feelslike_c)?.toFixed(1) ?? "—"}°C`], ["Rain", "ទឹកភ្លៀង", `${numberValue(row.precip_mm) ?? "—"} mm`], ["Pressure", "សម្ពាធ", `${numberValue(row.pressure_mb) ?? "—"} mb`], ["Visibility", "ចម្ងាយមើលឃើញ", `${numberValue(row.vis_km) ?? "—"} km`], ["Cloud", "ពពក", `${numberValue(row.cloud) ?? "—"}%`], ["Wind", "ខ្យល់", `${textValue(row.wind_dir) ?? "—"} ${numberValue(row.wind_kph) ?? "—"} km/h`]]
      : mode === "uv"
        ? [["UV index", "សន្ទស្សន៍ UV", uv?.toFixed(1) ?? "—"], ["Exposure", "កម្រិតហានិភ័យ", uv === null ? "—" : t(...uvBand(uv))]]
        : [["PM2.5", "PM2.5", `${numberValue(row.pm2_5) ?? "—"} µg/m³`], ["PM10", "PM10", `${numberValue(row.pm10) ?? "—"} µg/m³`], ["CO", "CO", `${numberValue(row.co) ?? "—"} µg/m³`], ["NO₂", "NO₂", `${numberValue(row.no2) ?? "—"} µg/m³`], ["O₃", "O₃", `${numberValue(row.o3) ?? "—"} µg/m³`], ["SO₂", "SO₂", `${numberValue(row.so2) ?? "—"} µg/m³`]];
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{values.map(([english, khmer, value]) => <div key={english} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3"><div className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{t(english, khmer)}</div><div className="mt-1 font-mono-ui text-sm text-[var(--ink)]">{value}</div></div>)}</div>;
}
export function MefEnvironmentTool({ mode }: { mode: Mode }) {
  const { text: t } = useLanguage();
  const meta = META[mode];
  const sourceModes: EndpointMode[] = mode === "overview" ? ["weather", "uv", "aqi"] : [mode];
  const [location, setLocation] = useToolState(`mef-${mode}:location`, "Phnom Penh");
  const [rows, setRows] = useState<MefRow[]>([]);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const controller = new AbortController();
    void fetchRows(mode, controller.signal).then((data) => { setRows(data); setStatus("ready"); }, (error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("error");
    });
    return () => controller.abort();
  }, [mode]);

  async function refresh() {
    setStatus("loading");
    try { setRows(await fetchRows(mode)); setStatus("ready"); } catch { setStatus("error"); }
  }

  const selected = useMemo(() => rows.find((row) => row.name === location) ?? rows.find((row) => row.name === "Phnom Penh") ?? rows[0] ?? null, [location, rows]);
  const datasetLabel = mode === "overview" ? t("weather, UV, and air quality", "អាកាសធាតុ កាំរស្មី UV និងគុណភាពខ្យល់") : t("live environmental data", "ទិន្នន័យបរិស្ថានបច្ចុប្បន្ន");

  return <ToolShell title={meta.title} khmerTitle={meta.khmer} description={meta.description} descriptionKm={meta.descriptionKm}>
    <div className={`rounded-md border p-3 text-xs leading-relaxed ${status === "error" ? "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]" : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`} role="status" aria-live="polite">
      {status === "loading" && t(`Loading ${mode === "overview" ? "weather, UV, and air-quality" : "live MEF"} data…`, `កំពុងទាញយកទិន្នន័យ${mode === "overview" ? "អាកាសធាតុ កាំរស្មី UV និងគុណភាពខ្យល់" : "បច្ចុប្បន្នពី កសហវ"}…`)}
      {status === "ready" && selected && <>{t(`${rows.length} locations · updated ${textValue(selected.last_updated) ?? "recently"}.`, `${rows.length} ទីតាំង · បានធ្វើបច្ចុប្បន្នភាព ${textValue(selected.last_updated) ?? "ថ្មីៗនេះ"}។`)} {t(`This ${datasetLabel} request goes directly from your browser to MEF, so its rate limit uses your IP—not the Toolbox123 host.`, `សំណើទិន្នន័យ${datasetLabel}ត្រូវបានផ្ញើដោយផ្ទាល់ពីកម្មវិធីរុករករបស់អ្នកទៅ កសហវ ដូច្នេះការកំណត់អត្រាប្រើ IP របស់អ្នក មិនមែនម៉ាស៊ីនមេ Toolbox123 ទេ។`)}</>}
      {status === "error" && t("MEF data is temporarily unavailable. No request was proxied through the Toolbox123 server.", "ទិន្នន័យ កសហវ មិនអាចប្រើបានបណ្ដោះអាសន្ន។ គ្មានសំណើណាមួយត្រូវបានបញ្ជូនកាត់ម៉ាស៊ីនមេ Toolbox123 ទេ។")}
    </div>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1"><Field label="Location" labelKm="ទីតាំង"><Select value={selected ? String(selected.name) : location} onChange={(event) => setLocation(event.target.value)} disabled={!rows.length}>{!rows.length && <option value={location}>{t(location, LOCATION_KM[location] ?? location)}</option>}{rows.map((row) => { const name = String(row.name); return <option key={name} value={name}>{t(name, LOCATION_KM[name] ?? name)}</option>; })}</Select></Field></div>
      <Button type="button" onClick={() => void refresh()} disabled={status === "loading"} className="inline-flex items-center justify-center gap-2"><RefreshCw size={14} className={status === "loading" ? "animate-spin" : ""} />{t("Refresh", "ធ្វើបច្ចុប្បន្នភាព")}</Button>
    </div>

    {selected && <><div className="mb-1 text-sm font-medium text-[var(--gold)]"><LocalizedLocation name={String(selected.name)} /></div><div className="flex flex-col gap-1 rounded-md border border-[var(--gold-dim)] bg-[var(--gold)]/5 p-4 text-sm text-[var(--ink-dim)]"><Summary mode={mode} row={selected} /></div><DetailGrid mode={mode} row={selected} /></>}

    {rows.length > 0 && <section><div className="mb-2 flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-display text-sm font-medium text-[var(--ink)]">{t("All available locations", "ទីតាំងដែលមានទាំងអស់")}</h2><div className="flex flex-wrap gap-2">{sourceModes.map((sourceMode) => <a key={sourceMode} href={`https://data.mef.gov.kh/api/v1/realtime-api/${sourceMode}`} target="_blank" rel="noreferrer" className="text-xs text-[var(--gold)] underline underline-offset-2">{t(`${sourceMode.toUpperCase()} source`, `ប្រភព ${sourceMode.toUpperCase()}`)}</a>)}</div></div><div className="grid max-h-96 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">{rows.map((row) => { const name = String(row.name); return <button key={name} type="button" onClick={() => setLocation(name)} className={`flex flex-col gap-1 rounded-md border p-3 text-left text-xs transition ${row.name === selected.name ? "border-[var(--gold-dim)] bg-[var(--gold)]/10" : "border-[var(--ground-line)] bg-[var(--ground-raised)] hover:border-[var(--gold-dim)]"}`}><span className="font-medium text-[var(--ink)]"><LocalizedLocation name={name} /></span><Summary mode={mode} row={row} /></button>; })}</div></section>}
  </ToolShell>;
}
