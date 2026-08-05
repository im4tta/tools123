"use client";

import { CloudSun, Coins, Fuel, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { CAMBODIA_PROVINCES } from "@/lib/cambodia-provinces";
import { fetchMefExchangeRates, type MefCurrencyRate } from "@/lib/mef-exchange";

const FUEL_API = "https://khfuel.vercel.app/api/public/prices";
type FuelData = { gasoline92: number; diesel: number; kerosene: number | null; effectiveAt: string };
type WeatherRow = { name?: string; temp_c?: number; condition?: { text?: string }; humidity?: number; wind_kph?: number; uv?: number; us_epa_index?: number; pm2_5?: number };

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const API_LOCATION_ALIASES: Record<string, string> = {
  Sihanoukville: "Preah Sihanouk",
  Kratie: "Kratié",
  Takeo: "Takéo",
  "Strung Treng": "Stung Treng",
};

function khmerLocation(name: string) {
  const canonical = API_LOCATION_ALIASES[name] ?? name;
  return CAMBODIA_PROVINCES.find((province) => province.en === canonical)?.km ?? name;
}

export function HomeSpotlightCarousel() {
  const { text: t } = useLanguage();
  const [financeSlide, setFinanceSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [fuel, setFuel] = useState<FuelData | null>(null);
  const [rates, setRates] = useState<MefCurrencyRate[]>([]);
  const [weatherRows, setWeatherRows] = useState<WeatherRow[]>([]);
  const [weatherIndex, setWeatherIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.allSettled([
      fetch(FUEL_API, { signal: controller.signal }).then(async (response) => {
        const payload = await response.json() as { success?: boolean; data?: FuelData };
        if (payload.success && payload.data) setFuel(payload.data);
      }),
      fetchMefExchangeRates({ signal: controller.signal }).then(setRates),
      Promise.allSettled(["weather", "uv", "aqi"].map((mode) => fetch(`https://data.mef.gov.kh/api/v1/realtime-api/${mode}`, { signal: controller.signal }).then(async (response) => (await response.json() as { data?: WeatherRow[] }).data ?? []))).then((results) => {
        const byLocation = new Map<string, WeatherRow>();
        for (const result of results) {
          if (result.status !== "fulfilled") continue;
          for (const row of result.value) {
            if (!row.name) continue;
            const previous = byLocation.get(row.name) ?? {};
            byLocation.set(row.name, { ...previous, ...row });
          }
        }
        setWeatherRows([...byLocation.values()].sort((a, b) => String(a.name).localeCompare(String(b.name))));
      }),
    ]);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setFinanceSlide((current) => (current + 1) % 2), 5000);
    return () => window.clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    if (paused || weatherRows.length < 2) return;
    const timer = window.setInterval(() => setWeatherIndex((current) => (current + 1) % weatherRows.length), 4000);
    return () => window.clearInterval(timer);
  }, [paused, weatherRows.length]);

  const usd = rates.find((rate) => rate.code === "USD") ?? rates[0];
  const weather = weatherRows[weatherIndex] ?? null;
  const condition = weather?.condition?.text ?? "—";
  const weatherValues = [
    ["Temp", number(weather?.temp_c) === null ? "—" : `${number(weather?.temp_c)}°C`],
    ["Condition", condition],
    ["Humidity", number(weather?.humidity) === null ? "—" : `${number(weather?.humidity)}%`],
    ["Wind", number(weather?.wind_kph) === null ? "—" : `${number(weather?.wind_kph)} km/h`],
    ["UV", number(weather?.uv) ?? "—"],
    ["AQI", number(weather?.us_epa_index) ?? "—"],
    ["PM2.5", number(weather?.pm2_5) === null ? "—" : `${number(weather?.pm2_5)} µg/m³`],
  ];

  return (
    <section className="home-spotlight-carousel pointer-events-none relative z-20 mx-auto mt-6 w-full max-w-[77rem] px-5 sm:px-10 xl:absolute xl:inset-x-5 xl:top-20 xl:mt-0 xl:px-0">
      <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 xl:flex xl:flex-row xl:justify-between">
        <article className="home-spotlight-card pointer-events-auto w-full rounded-2xl border border-amber-500/25 bg-[var(--ground-raised)] p-4 shadow-sm sm:max-w-none xl:w-64" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="home-spotlight-heading mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600"><Coins size={15} /> {t("Finance", "ហិរញ្ញវត្ថុ")}</div>
            <button type="button" onClick={() => setPaused((value) => !value)} className="text-[var(--ink-faint)] hover:text-[var(--ink)]" aria-label={paused ? t("Resume finance carousel", "បន្ត Carousel ហិរញ្ញវត្ថុ") : t("Pause finance carousel", "ផ្អាក Carousel ហិរញ្ញវត្ថុ")}>{paused ? <Play size={13} /> : <Pause size={13} />}</button>
          </div>
          {financeSlide === 0 ? (
            <>
              <div className="mb-2 flex items-center gap-2 font-khmer text-base font-bold text-[var(--ink)]"><Fuel size={18} className="text-amber-600" /> {t("Fuel Prices", "តម្លៃប្រេង")}</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-amber-500/10 p-2"><p className="text-[10px] text-[var(--ink-faint)]">{t("Gasoline 92", "សាំង 92")}</p><p className="mt-1 font-mono-ui text-sm font-bold text-[var(--ink)]">{fuel ? `${fuel.gasoline92.toLocaleString()} ៛` : "—"}</p></div>
                <div className="rounded-lg bg-amber-500/10 p-2"><p className="text-[10px] text-[var(--ink-faint)]">{t("Diesel", "ម៉ាស៊ូត")}</p><p className="mt-1 font-mono-ui text-sm font-bold text-[var(--ink)]">{fuel ? `${fuel.diesel.toLocaleString()} ៛` : "—"}</p></div>
              </div>
              <p className="mt-2 text-[10px] text-[var(--ink-faint)]">{fuel ? new Date(fuel.effectiveAt).toLocaleDateString() : t("Loading…", "កំពុងទាញយក…")}</p>
            </>
          ) : (
            <>
              <div className="mb-2 flex items-center gap-2 font-khmer text-base font-bold text-[var(--ink)]"><Coins size={18} className="text-teal-600" /> {t("Exchange Rate", "អត្រាប្តូរប្រាក់")}</div>
              <p className="text-[10px] text-[var(--ink-faint)]">USD · KHR per 1 unit</p>
              <p className="home-spotlight-value mt-2 font-mono-ui text-2xl font-bold text-[var(--ink)]">{usd ? usd.average.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}៛</p>
              <p className="mt-1 text-[10px] text-[var(--ink-faint)]">{usd?.validDate ?? t("Loading…", "កំពុងទាញយក…")}</p>
            </>
          )}
          <div className="mt-3 flex items-center gap-0.5" aria-label={t("Finance slides", "ផ្ទាំងហិរញ្ញវត្ថុ")}>{["Fuel prices", "Exchange rate"].map((label, index) => <button key={label} type="button" onClick={() => setFinanceSlide(index)} className="group flex h-4 w-5 items-center justify-center" aria-label={label}><span className={`h-1.5 rounded-full transition-all ${financeSlide === index ? "w-5 bg-amber-500" : "w-1.5 bg-amber-500/40 group-hover:w-3"}`} /></button>)}</div>
        </article>

        <article className="home-spotlight-card pointer-events-auto w-full rounded-2xl border border-blue-500/25 bg-[var(--ground-raised)] p-4 shadow-sm sm:max-w-none xl:w-64" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="home-spotlight-heading mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600"><CloudSun size={15} /> {t("Weather · All types", "អាកាសធាតុ · គ្រប់ប្រភេទ")}</div>
          <div className="mb-2 flex items-center justify-between"><p className="font-khmer text-base font-bold text-[var(--ink)]">{weather?.name ? t(String(weather.name), khmerLocation(String(weather.name))) : t("Loading…", "កំពុងទាញយក…")}</p><p className="home-spotlight-value font-mono-ui text-xl font-bold text-[var(--ink)]">{weatherValues[0][1]}</p></div>
          <p className="mb-3 truncate text-xs text-[var(--ink-dim)]">{weatherValues[1][1]}</p>
          <div className="home-spotlight-detail-grid grid grid-cols-2 gap-x-3 gap-y-2">{weatherValues.slice(2).map(([label, value]) => <div key={label}><p className="text-[10px] text-[var(--ink-faint)]">{label}</p><p className="font-mono-ui text-xs font-bold text-[var(--ink)]">{value}</p></div>)}</div>
          {!weather && <p className="mt-3 text-[10px] text-[var(--ink-faint)]">{t("Loading live data…", "កំពុងទាញទិន្នន័យ…")}</p>}
          {weatherRows.length > 1 && <div className="home-spotlight-location-dots mt-3 flex max-w-full flex-wrap gap-0.5" aria-label={t("Weather locations", "ទីតាំងអាកាសធាតុ")}>{weatherRows.map((row, index) => <button key={row.name} type="button" onClick={() => setWeatherIndex(index)} className="group flex h-4 w-3 items-center justify-center" aria-label={String(row.name)} title={t(String(row.name), khmerLocation(String(row.name)))}><span className={`h-1 rounded-full transition-all ${index === weatherIndex ? "w-3 bg-blue-600" : "w-1 bg-blue-600/30 group-hover:w-2"}`} /></button>)}</div>}
        </article>
      </div>
    </section>
  );
}
