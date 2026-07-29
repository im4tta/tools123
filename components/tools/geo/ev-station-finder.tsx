"use client";

import { useMemo, useState } from "react";
import rawStationData from "@/data/evskh_stations_verified.json";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/Output";
import { Field, Row, Select, TextInput, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const stationData = {
  ...rawStationData,
  stations: rawStationData.stations.map((station) => ({ ...station, rating: station.rating ?? 0 })),
};
type Station = (typeof stationData.stations)[number];
type ConnectorFilter = "all" | "ccs2" | "gbt";
type SortMode = "name" | "rating" | "distance";
type LocationStatus = "idle" | "loading" | "ready" | "unsupported" | "denied" | "unavailable" | "timeout" | "error";
type UserLocation = { lat: number; lng: number };

const PAGE_SIZE = 24;
const PROVINCE_KM: Record<string, string> = {
  "Banteay Meanchey": "បន្ទាយមានជ័យ", Battambang: "បាត់ដំបង", "Kampong Cham": "កំពង់ចាម",
  "Kampong Chhnang": "កំពង់ឆ្នាំង", "Kampong Speu": "កំពង់ស្ពឺ", "Kampong Thom": "កំពង់ធំ",
  Kampot: "កំពត", Kandal: "កណ្ដាល", Kep: "កែប", "Koh Kong": "កោះកុង", Kratie: "ក្រចេះ",
  Mondulkiri: "មណ្ឌលគិរី", Pailin: "ប៉ៃលិន", "Phnom Penh": "រាជធានីភ្នំពេញ",
  "Preah Sihanouk": "ព្រះសីហនុ", "Preah Vihear": "ព្រះវិហារ", "Prey Veng": "ព្រៃវែង",
  Pursat: "ពោធិ៍សាត់", Ratanakiri: "រតនគិរី", "Siem Reap": "សៀមរាប",
  "Stung Treng": "ស្ទឹងត្រែង", "Svay Rieng": "ស្វាយរៀង", Takeo: "តាកែវ", "Tboung Khmum": "ត្បូងឃ្មុំ",
};

const PROVINCES = [...new Set(stationData.stations.map((station) => station.province).filter(Boolean))].sort();

function normalize(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function searchable(value: unknown): string {
  return normalize(value).toLocaleLowerCase("km");
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const radiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * radiusKm * Math.asin(Math.sqrt(a));
}

function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function mapsUrl(station: Station): string {
  return safeHttpUrl(station.maps_url) ?? `https://www.google.com/maps/search/?api=1&query=${station.lat},${station.lng}`;
}

function locationMessage(status: LocationStatus, t: (en: string, km: string) => string): string {
  const messages: Record<LocationStatus, [string, string]> = {
    idle: ["Use your location to sort stations by straight-line distance.", "ប្រើទីតាំងរបស់អ្នក ដើម្បីតម្រៀបស្ថានីយតាមចម្ងាយផ្លូវត្រង់។"],
    loading: ["Requesting your location…", "កំពុងស្នើសុំទីតាំងរបស់អ្នក…"],
    ready: ["Location found. Results are sorted by distance.", "បានរកឃើញទីតាំង។ លទ្ធផលត្រូវបានតម្រៀបតាមចម្ងាយ។"],
    unsupported: ["Geolocation is not supported by this browser.", "កម្មវិធីរុករកនេះមិនគាំទ្រការកំណត់ទីតាំងទេ។"],
    denied: ["Location access was denied. Allow it in browser settings to sort by distance.", "ការចូលប្រើទីតាំងត្រូវបានបដិសេធ។ សូមអនុញ្ញាតក្នុងការកំណត់កម្មវិធីរុករក ដើម្បីតម្រៀបតាមចម្ងាយ។"],
    unavailable: ["Your location is currently unavailable.", "មិនអាចរកទីតាំងរបស់អ្នកបាននៅពេលនេះទេ។"],
    timeout: ["The location request timed out. Please try again.", "ការស្នើសុំទីតាំងបានផុតពេល។ សូមព្យាយាមម្ដងទៀត។"],
    error: ["Could not determine your location.", "មិនអាចកំណត់ទីតាំងរបស់អ្នកបានទេ។"],
  };
  return t(...messages[status]);
}

export default function EvStationFinder() {
  const { mode, text: t } = useLanguage();
  const [query, setQuery] = useToolState("evskh:query", "");
  const [province, setProvince] = useToolState("evskh:province", "all");
  const [connector, setConnector] = useToolState<ConnectorFilter>("evskh:connector", "all");
  const [sort, setSort] = useToolState<SortMode>("evskh:sort", "name");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");

  const resetVisible = () => setVisibleCount(PAGE_SIZE);

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("unsupported");
      return;
    }
    setLocationStatus("loading");
    setUserLocation(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ lat: coords.latitude, lng: coords.longitude });
        setSort("distance");
        setLocationStatus("ready");
        resetVisible();
      },
      (error) => {
        setLocationStatus(error.code === 1 ? "denied" : error.code === 2 ? "unavailable" : error.code === 3 ? "timeout" : "error");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const results = useMemo(() => {
    const term = searchable(query);
    const filtered = stationData.stations
      .filter((station) => province === "all" || station.province === province)
      .filter((station) => connector === "all" || (connector === "ccs2" ? station.is_ccs2 : station.is_gbt))
      .filter((station) => {
        if (!term) return true;
        const values = [station.name, station.local_name, station.gmaps_name, station.address, station.district, station.province,
          PROVINCE_KM[station.province], station.max_kw, station.payment_method, station.open_from_to,
          station.is_ccs2 ? "CCS2" : "", station.is_gbt ? "GB/T" : ""];
        return values.some((value) => searchable(value).includes(term));
      })
      .map((station) => ({
        station,
        distance: userLocation ? haversineKm(userLocation.lat, userLocation.lng, station.lat, station.lng) : null,
      }));

    const effectiveSort = sort === "distance" && !userLocation ? "name" : sort;
    return filtered.sort((a, b) => {
      if (effectiveSort === "distance") return (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY);
      if (effectiveSort === "rating") return b.station.rating - a.station.rating || b.station.reviews - a.station.reviews;
      return a.station.name.localeCompare(b.station.name, "en");
    });
  }, [connector, province, query, sort, userLocation]);

  const displayed = results.slice(0, visibleCount);
  const selectedSort = sort === "distance" && !userLocation ? "name" : sort;

  return <ToolShell
    title="Cambodia EV Charging Station Finder"
    khmerTitle="ស្វែងរកស្ថានីយសាករថយន្តអគ្គិសនីនៅកម្ពុជា"
    description={`Search ${stationData.meta.total} EV charging-station records across ${stationData.meta.regions_count} Cambodian provinces and regions, filter by connector, or use your location to find nearby stations.`}
    descriptionKm={`ស្វែងរកទិន្នន័យស្ថានីយសាករថយន្តអគ្គិសនីចំនួន ${stationData.meta.total} កន្លែង នៅរាជធានី-ខេត្តចំនួន ${stationData.meta.regions_count} ត្រងតាមប្រភេទក្បាលសាក ឬប្រើទីតាំងរបស់អ្នកដើម្បីរកស្ថានីយនៅជិត។`}
  >
    <div className="rounded-md border border-[var(--gold-dim)]/40 bg-[var(--gold)]/5 p-3 text-xs leading-6 text-[var(--ink-dim)]">
      <strong className="text-[var(--ink)]">{t("Reference data — not live status.", "ទិន្នន័យយោង — មិនមែនជាស្ថានភាពផ្ទាល់ទេ។")}</strong>{" "}
      {t("Availability, connector support, power, hours, fees, and payment methods may have changed. Confirm with the station before travelling. Connector badges only show recorded support; missing badges mean unknown, not unsupported.", "ស្ថានភាពប្រើប្រាស់ ប្រភេទក្បាលសាក កម្លាំងសាក ម៉ោងបើក ថ្លៃសេវា និងវិធីទូទាត់អាចផ្លាស់ប្ដូរ។ សូមផ្ទៀងផ្ទាត់ជាមួយស្ថានីយមុនធ្វើដំណើរ។ ស្លាកក្បាលសាកបង្ហាញតែព័ត៌មានដែលបានកត់ត្រា បើគ្មានស្លាក មិនមានន័យថាមិនគាំទ្រនោះទេ។")}
    </div>

    <Row>
      <Field label="Search stations" labelKm="ស្វែងរកស្ថានីយ">
        <TextInput value={query} onChange={(event) => { setQuery(event.target.value); resetVisible(); }} placeholder={t("Name, address, province, power, payment…", "ឈ្មោះ អាសយដ្ឋាន រាជធានី-ខេត្ត កម្លាំងសាក វិធីទូទាត់…")} autoFocus />
      </Field>
      <Field label="Province / Capital" labelKm="រាជធានី / ខេត្ត">
        <Select value={province} onChange={(event) => { setProvince(event.target.value); resetVisible(); }}>
          <option value="all">{t("All provinces", "រាជធានី-ខេត្តទាំងអស់")}</option>
          {PROVINCES.map((name) => <option key={name} value={name}>{t(name, PROVINCE_KM[name] ?? name)}</option>)}
        </Select>
      </Field>
    </Row>

    <Row>
      <Field label="Connector" labelKm="ប្រភេទក្បាលសាក">
        <Select value={connector} onChange={(event) => { setConnector(event.target.value as ConnectorFilter); resetVisible(); }}>
          <option value="all">{t("All recorded connectors", "ក្បាលសាកដែលបានកត់ត្រាទាំងអស់")}</option>
          <option value="ccs2">CCS2</option>
          <option value="gbt">GB/T</option>
        </Select>
      </Field>
      <Field label="Sort results" labelKm="តម្រៀបលទ្ធផល">
        <Select value={selectedSort} onChange={(event) => { setSort(event.target.value as SortMode); resetVisible(); }}>
          <option value="name">{t("Name (A–Z)", "ឈ្មោះ (ក–អ)")}</option>
          <option value="rating">{t("Highest rating", "ពិន្ទុខ្ពស់បំផុត")}</option>
          <option value="distance" disabled={!userLocation}>{t("Nearest first", "នៅជិតបំផុតមុន")}</option>
        </Select>
      </Field>
    </Row>

    <div className="flex flex-wrap items-center gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
      <Button type="button" onClick={requestLocation} disabled={locationStatus === "loading"}>
        {locationStatus === "loading" ? t("Locating…", "កំពុងរកទីតាំង…") : t("Use my location", "ប្រើទីតាំងរបស់ខ្ញុំ")}
      </Button>
      <p aria-live="polite" className={`min-w-0 flex-1 text-xs leading-5 ${["denied", "unavailable", "timeout", "error", "unsupported"].includes(locationStatus) ? "text-[var(--danger)]" : "text-[var(--ink-faint)]"}`}>
        {locationMessage(locationStatus, t)}
      </p>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-faint)]">
      <p>{t(`${results.length} stations found`, `រកឃើញស្ថានីយចំនួន ${results.length}`)}</p>
      <p>{t("Dataset verified 28 April 2026", "ទិន្នន័យបានផ្ទៀងផ្ទាត់នៅថ្ងៃទី ២៨ ខែមេសា ឆ្នាំ ២០២៦")}</p>
    </div>

    {!results.length && <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 text-center text-sm text-[var(--ink-faint)]">
      {t("No stations match these filters.", "រកមិនឃើញស្ថានីយដែលត្រូវនឹងលក្ខខណ្ឌនេះទេ។")}
    </p>}

    <div className="grid gap-3 sm:grid-cols-2">
      {displayed.map(({ station, distance }) => {
        const englishName = normalize(station.name || station.gmaps_name || station.local_name) || t("Unnamed station", "ស្ថានីយគ្មានឈ្មោះ");
        const khmerName = normalize(station.local_name) || englishName;
        const name = mode === "en" ? englishName : mode === "km" ? khmerName : khmerName !== englishName ? `${englishName} / ${khmerName}` : englishName;
        const provinceName = station.province ? t(station.province, PROVINCE_KM[station.province] ?? station.province) : t("Province not recorded", "មិនបានកត់ត្រារាជធានី-ខេត្ត");
        const place = [normalize(station.district), provinceName].filter(Boolean).join(" · ");
        const hours = normalize(station.open_from_to);
        const payment = normalize(station.payment_method);
        const hasRating = station.rating > 0 && station.reviews > 0;
        const power = station.max_kw && station.max_kw > 0 ? `${station.max_kw} kW` : "";
        const map = mapsUrl(station);
        const connectors = [station.is_ccs2 ? "CCS2" : "", station.is_gbt ? "GB/T" : ""].filter(Boolean);
        const copy = [name, normalize(station.address), place, `${station.lat}, ${station.lng}`, distance !== null ? `${distance.toFixed(1)} km` : "", power,
          connectors.length ? `${t("Connectors", "ក្បាលសាក")}: ${connectors.join(", ")}` : "",
          hours ? `${t("Hours", "ម៉ោងបើក")}: ${hours}` : "", payment ? `${t("Payment", "ការទូទាត់")}: ${payment}` : "",
          normalize(station.phone), map].filter(Boolean).join("\n");

        return <article key={station.id} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-medium leading-6 text-[var(--ink)]">{name}</h2>
              {place && <p className="mt-1 text-xs text-[var(--ink-faint)]">{place}</p>}
            </div>
            <CopyButton text={copy} compact />
          </div>
          {normalize(station.address) && <p className="mt-3 text-xs leading-5 text-[var(--ink-dim)]">{normalize(station.address)}</p>}
          <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
            {distance !== null && <span className="rounded-full bg-[var(--gold)]/15 px-2 py-1 text-[var(--gold)]">≈ {distance.toFixed(1)} km</span>}
            {power && <span className="rounded-full bg-[var(--ground)] px-2 py-1 text-[var(--ink-dim)]">⚡ {power}</span>}
            {connectors.map((item) => <span key={item} className="rounded-full bg-[var(--ground)] px-2 py-1 text-[var(--ink-dim)]">{item}</span>)}
            {!connectors.length && <span className="rounded-full bg-[var(--ground)] px-2 py-1 text-[var(--ink-faint)]">{t("Connector not recorded", "មិនបានកត់ត្រាប្រភេទក្បាលសាក")}</span>}
            {hasRating && <span className="rounded-full bg-[var(--ground)] px-2 py-1 text-[var(--ink-dim)]">★ {station.rating.toFixed(1)} ({station.reviews})</span>}
          </div>
          {(hours || payment || normalize(station.phone)) && <dl className="mt-3 space-y-1 text-xs leading-5">
            {hours && <div><dt className="inline text-[var(--ink-faint)]">{t("Hours", "ម៉ោងបើក")}៖ </dt><dd className="inline text-[var(--ink-dim)]">{hours}</dd></div>}
            {payment && <div><dt className="inline text-[var(--ink-faint)]">{t("Payment", "ការទូទាត់")}៖ </dt><dd className="inline text-[var(--ink-dim)]">{payment}</dd></div>}
            {normalize(station.phone) && <div><dt className="inline text-[var(--ink-faint)]">{t("Phone", "ទូរស័ព្ទ")}៖ </dt><dd className="inline text-[var(--ink-dim)]">{normalize(station.phone)}</dd></div>}
          </dl>}
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <a href={map} target="_blank" rel="noreferrer" className="text-[var(--gold)] hover:underline">{t("Open in Google Maps", "បើកក្នុង Google Maps")} ↗</a>
            {safeHttpUrl(station.reviews_url) && <a href={safeHttpUrl(station.reviews_url) ?? undefined} target="_blank" rel="noreferrer" className="text-[var(--ink-dim)] hover:text-[var(--gold)]">{t("Reviews", "ការវាយតម្លៃ")} ↗</a>}
          </div>
        </article>;
      })}
    </div>

    {visibleCount < results.length && <div className="text-center">
      <Button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
        {t(`Show more (${results.length - visibleCount} remaining)`, `បង្ហាញបន្ថែម (នៅសល់ ${results.length - visibleCount})`)}
      </Button>
    </div>}
  </ToolShell>;
}