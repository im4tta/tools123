"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface Zone {
  zone: string;
  city: string;
  flag: string;
}

const ALL_ZONES: Zone[] = [
  { zone: "Asia/Phnom_Penh", city: "Phnom Penh", flag: "🇰🇭" },
  { zone: "Asia/Bangkok", city: "Bangkok", flag: "🇹🇭" },
  { zone: "Asia/Singapore", city: "Singapore", flag: "🇸🇬" },
  { zone: "Asia/Tokyo", city: "Tokyo", flag: "🇯🇵" },
  { zone: "Asia/Shanghai", city: "Shanghai", flag: "🇨🇳" },
  { zone: "Asia/Kolkata", city: "New Delhi", flag: "🇮🇳" },
  { zone: "Asia/Dubai", city: "Dubai", flag: "🇦🇪" },
  { zone: "Europe/London", city: "London", flag: "🇬🇧" },
  { zone: "Europe/Paris", city: "Paris", flag: "🇫🇷" },
  { zone: "Europe/Berlin", city: "Berlin", flag: "🇩🇪" },
  { zone: "Europe/Moscow", city: "Moscow", flag: "🇷🇺" },
  { zone: "America/New_York", city: "New York", flag: "🇺🇸" },
  { zone: "America/Chicago", city: "Chicago", flag: "🇺🇸" },
  { zone: "America/Los_Angeles", city: "Los Angeles", flag: "🇺🇸" },
  { zone: "America/Sao_Paulo", city: "São Paulo", flag: "🇧🇷" },
  { zone: "Africa/Cairo", city: "Cairo", flag: "🇪🇬" },
  { zone: "Africa/Johannesburg", city: "Johannesburg", flag: "🇿🇦" },
  { zone: "Australia/Sydney", city: "Sydney", flag: "🇦🇺" },
  { zone: "Pacific/Auckland", city: "Auckland", flag: "🇳🇿" },
  { zone: "UTC", city: "UTC", flag: "🌐" },
];

const DEFAULT_ZONES = ["Asia/Phnom_Penh", "Asia/Tokyo", "Europe/London", "America/New_York"];

function fmtTime(zone: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: zone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    }).format(new Date());
  } catch {
    return "--:--:--";
  }
}

function fmtDate(zone: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: zone, weekday: "short", day: "2-digit", month: "short", year: "numeric",
    }).format(new Date());
  } catch {
    return "";
  }
}

export default function WorldClock() {
  const { text: t } = useLanguage();
  const [zones, setZones] = useToolState<string[]>("world-clock:zones", DEFAULT_ZONES);
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const active = useMemo(() => zones.map((z) => ALL_ZONES.find((a) => a.zone === z) ?? { zone: z, city: z, flag: "🌐" }), [zones]);

  // `now` is read below to keep the live clock ticking every second.
  void now;

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_ZONES.filter((z) => !zones.includes(z.zone) && (z.city.toLowerCase().includes(q) || z.zone.toLowerCase().includes(q))).slice(0, 6);
  }, [query, zones]);

  function add(zone: string) {
    setZones((prev) => (prev.includes(zone) ? prev : [...prev, zone]));
    setQuery("");
  }

  function remove(zone: string) {
    setZones((prev) => prev.filter((z) => z !== zone));
  }

  return (
    <ToolShell
      title="World Clock"
      khmerTitle="នាឡិកាពិភពលោក"
      description="See the live time across multiple cities at a glance — add cities from around the world and watch the clocks tick in real time."
      descriptionKm="មើលពេលវេលាបច្ចុប្បន្ននៃទីក្រុងជាច្រើនក្នុងពេលតែមួយ — បន្ថែមទីក្រុងពីជុំវិញពិភពលោក ហើយមើលនាឡិកាដើរពេលវេលាជាក់ស្តែង។"
    >
      <Field label={t("Add a city", "បន្ថែមទីក្រុង")}>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search a city or timezone…", "ស្វែងរកទីក្រុង ឬតំបន់ពេលវេលា…")}
            className="pl-8"
          />
        </div>
        {suggestions.length > 0 && (
          <div className="mt-1 overflow-hidden rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]">
            {suggestions.map((z) => (
              <button
                key={z.zone}
                type="button"
                onClick={() => add(z.zone)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--ink)] transition hover:bg-[var(--ground-raised-hi)]"
              >
                <span>{z.flag}</span>
                <span className="flex-1">{z.city}</span>
                <span className="font-mono-ui text-xs text-[var(--ink-faint)]">{z.zone}</span>
              </button>
            ))}
          </div>
        )}
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {active.map((z) => (
          <div key={z.zone} className="flex items-center gap-3 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3">
            <span className="text-2xl">{z.flag}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-[var(--ink)]">{z.city}</div>
              <div className="text-xs text-[var(--ink-faint)]">{fmtDate(z.zone)}</div>
            </div>
            <div className="text-right">
              <div className="font-mono-ui text-lg font-semibold text-[var(--gold)]">{fmtTime(z.zone)}</div>
            </div>
            <button
              type="button"
              onClick={() => remove(z.zone)}
              aria-label={t("Remove", "ដកចេញ")}
              className="rounded p-1 text-[var(--ink-faint)] transition hover:bg-[var(--ground-line)] hover:text-[var(--danger)]"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-[var(--ink-faint)]">
        {t("Times update every second and are shown in 24-hour format.", "ពេលវេលាត្រូវបានធ្វើបច្ចុប្បន្នភាពរៀងរាល់វិនាទី និងបង្ហាញជាទម្រង់ ២៤ ម៉ោង។")}
      </p>
    </ToolShell>
  );
}
