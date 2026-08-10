"use client";

import { useMemo, useState } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";
import { useToolState } from "@/lib/storage";
import airportsData from "@/data/airports.json";

// Data is an array of [iata, icao, name, city, country, type] tuples
type AirportRow = [string, string, string, string, string, string];

const AIRPORTS = airportsData.airports as AirportRow[];

const TYPE_LABELS: Record<string, { en: string; km: string }> = {
  large_airport: { en: "Large", km: "ធំ" },
  medium_airport: { en: "Medium", km: "មធ្យម" },
  small_airport: { en: "Small", km: "តូច" },
  heliport: { en: "Heliport", km: "ហេលីផត" },
  seaplane_base: { en: "Seaplane Base", km: "មូលដ្ឋានយន្តហោះទន្លេ" },
  closed: { en: "Closed", km: "បិទ" },
};

function typeLabel(type: string, mode: string): string {
  const entry = TYPE_LABELS[type];
  if (!entry) return type.replace("_", " ");
  if (mode === "km") return entry.km;
  if (mode === "en") return entry.en;
  return `${entry.en} / ${entry.km}`;
}

const TYPE_OPTIONS = [
  { value: "", en: "All types", km: "ប្រភេទទាំងអស់" },
  { value: "large_airport", en: "Large", km: "ធំ" },
  { value: "medium_airport", en: "Medium", km: "មធ្យម" },
  { value: "small_airport", en: "Small", km: "តូច" },
  { value: "heliport", en: "Heliport", km: "ហេលីផត" },
  { value: "seaplane_base", en: "Seaplane Base", km: "មូលដ្ឋានយន្តហោះទន្លេ" },
  { value: "closed", en: "Closed", km: "បិទ" },
];

const MAX_RESULTS = 100;

export default function AirportLookup() {
  const { mode, text } = useLanguage();
  const [q, setQ] = useToolState("airport-lookup:q", "");
  const [typeFilter, setTypeFilter] = useToolState("airport-lookup:type", "");
  const [selected, setSelected] = useState<AirportRow | null>(null);

  const results = useMemo(() => {
    const raw = q.trim().toUpperCase();
    const lower = q.trim().toLowerCase();
    if (!raw && !typeFilter) return [];

    return AIRPORTS.filter(([iata, icao, name, city, country, type]) => {
      const matchType = !typeFilter || type === typeFilter;
      if (!matchType) return false;
      if (!raw) return true;
      return (
        iata === raw ||
        icao === raw ||
        name.toLowerCase().includes(lower) ||
        city.toLowerCase().includes(lower) ||
        country.toLowerCase() === lower ||
        country === raw
      );
    }).slice(0, MAX_RESULTS);
  }, [q, typeFilter]);

  const isEmpty = q.trim() === "" && typeFilter === "";
  const overLimit = results.length === MAX_RESULTS;

  return (
    <ToolShell
      title="Airport Lookup"
      khmerTitle="ស្វែងរកព្រលានយន្តហោះ"
      description="Search 8,800+ airports worldwide by IATA/ICAO code, name, city, or country. Data from OurAirports (Public Domain)."
      descriptionKm="ស្វែងរកព្រលានយន្តហោះជាង ៨.៨០០ ទូទាំងពិភពលោក តាម IATA/ICAO លេខកូដ ឈ្មោះ ទីក្រុង ឬប្រទេស។ ទិន្នន័យពី OurAirports (Public Domain)។"
    >
      <Row>
        <Field
          label="Search"
          labelKm="ស្វែងរក"
          hint="IATA, ICAO, name, city, country"
          hintKm="IATA, ICAO, ឈ្មោះ, ទីក្រុង, ប្រទេស"
        >
          <TextInput
            value={q}
            onChange={(e) => { setQ(e.target.value); setSelected(null); }}
            placeholder="e.g. PNH, VDPP, Phnom Penh…"
            autoFocus
          />
        </Field>
        <Field label="Type" labelKm="ប្រភេទ">
          <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setSelected(null); }}>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {mode === "km" ? o.km : mode === "en" ? o.en : `${o.en} / ${o.km}`}
              </option>
            ))}
          </Select>
        </Field>
      </Row>

      {/* Detail panel */}
      {selected && (
        <div className="rounded-md border border-[var(--gold-dim)] bg-[var(--ground-raised)] p-4 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-[var(--ink)]">{selected[2]}</h2>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-[var(--ink-dim)] hover:text-[var(--ink)]"
              aria-label={text("Close", "បិទ")}
            >
              ✕
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
            <InfoRow label={text("IATA", "IATA")} value={selected[0] || "—"} />
            <InfoRow label={text("ICAO", "ICAO")} value={selected[1] || "—"} />
            <InfoRow label={text("Type", "ប្រភេទ")} value={typeLabel(selected[5], mode)} />
            <InfoRow label={text("City", "ទីក្រុង")} value={selected[3] || "—"} />
            <InfoRow label={text("Country", "ប្រទេស")} value={selected[4] || "—"} />
          </dl>
        </div>
      )}

      {/* Results table */}
      {!isEmpty && (
        <div>
          {overLimit && (
            <p className="mb-2 text-xs text-[var(--ink-dim)]">
              {text(
                `Showing first ${MAX_RESULTS} results. Refine your search to narrow down.`,
                `បង្ហាញ ${MAX_RESULTS} លទ្ធផលដំបូង។ សូមស្វែងរកលម្អិតជាងនេះ។`
              )}
            </p>
          )}
          {results.length === 0 && (
            <p className="py-6 text-center text-sm text-[var(--ink-dim)]">
              {text("No airports found.", "រកមិនឃើញព្រលានយន្តហោះ។")}
            </p>
          )}
          {results.length > 0 && (
            <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-[var(--ground-raised)] text-xs uppercase tracking-wide text-[var(--ink-dim)]">
                  <tr>
                    <th className="px-3 py-2 text-left">{text("IATA", "IATA")}</th>
                    <th className="px-3 py-2 text-left">{text("ICAO", "ICAO")}</th>
                    <th className="px-3 py-2 text-left">{text("Airport Name", "ឈ្មោះព្រលាន")}</th>
                    <th className="px-3 py-2 text-left">{text("City", "ទីក្រុង")}</th>
                    <th className="px-3 py-2 text-left">{text("Country", "ប្រទេស")}</th>
                    <th className="px-3 py-2 text-left">{text("Type", "ប្រភេទ")}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr
                      key={`${row[0]}-${row[1]}-${i}`}
                      className="cursor-pointer border-t border-[var(--ground-line)] hover:bg-[var(--ground-raised)] focus-within:bg-[var(--ground-raised)]"
                      onClick={() => setSelected(row)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setSelected(row)}
                      aria-label={`${row[2]}, ${row[3]}, ${row[4]}`}
                    >
                      <td className="px-3 py-2 font-mono-ui font-medium text-[var(--gold)]">
                        {row[0] || "—"}
                      </td>
                      <td className="px-3 py-2 font-mono-ui text-[var(--ink-dim)]">
                        {row[1] || "—"}
                      </td>
                      <td className="px-3 py-2">{row[2]}</td>
                      <td className="px-3 py-2 text-[var(--ink-dim)]">{row[3]}</td>
                      <td className="px-3 py-2 text-[var(--ink-dim)]">{row[4]}</td>
                      <td className="px-3 py-2 text-[var(--ink-faint)] text-xs">{typeLabel(row[5], mode)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {isEmpty && (
        <p className="py-4 text-center text-sm text-[var(--ink-dim)]">
          {text(
            "Enter a search term or select a type to browse airports.",
            "បញ្ចូលពាក្យស្វែងរក ឬជ្រើសរើសប្រភេទ ដើម្បីមើលព្រលានយន្តហោះ។"
          )}
        </p>
      )}

      {/* Attribution */}
      <p className="text-xs text-[var(--ink-faint)]">
        {text("Data source:", "ប្រភពទិន្នន័យ:")}{" "}
        <a
          href="https://ourairports.com/data/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-[var(--ink-dim)]"
        >
          OurAirports
        </a>{" "}
        — {text("Public Domain", "Public Domain")} ·{" "}
        {text("8,800+ airports worldwide", "ព្រលានយន្តហោះជាង ៨.៨០០ ទូទាំងពិភពលោក")}
      </p>
    </ToolShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--ink-dim)]">{label}</dt>
      <dd className="font-medium text-[var(--ink)]">{value}</dd>
    </div>
  );
}
