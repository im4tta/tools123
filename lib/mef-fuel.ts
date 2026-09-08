// Official Cambodia retail fuel-price ceilings, published on the Ministry of
// Economy and Finance (MEF) Open Data Platform. The underlying figures are set
// by the Ministry of Commerce (moc.gov.kh); each period carries a source_link
// back to its MoC announcement. Prices are KHR per litre.
export const MEF_FUEL_SOURCE =
  "https://data.mef.gov.kh/api/v1/public-datasets/pd_681d89b4dbc953000126f5e7/json?page=1&page_size=12";
export const MEF_FUEL_HOME = "https://data.mef.gov.kh";

export type FuelPeriod = {
  startDate: string;
  endDate: string;
  gasoline92: number;
  gasoline92Change: number;
  diesel: number;
  dieselChange: number;
  sourceLink: string | null;
};

type RawPeriod = {
  start_date?: unknown;
  end_date?: unknown;
  gasoline_92_unit_price?: unknown;
  gasoline_92_unit_price_change?: unknown;
  gasoil_50ppm_unit_price?: unknown;
  gasoil_50ppm_unit_price_change?: unknown;
  source_link?: unknown;
};

function numeric(value: unknown): number {
  return Number(typeof value === "string" ? value.replaceAll(",", "") : value);
}

export function normalizeFuelPeriod(raw: RawPeriod): FuelPeriod | null {
  const startDate = typeof raw.start_date === "string" ? raw.start_date : "";
  const endDate = typeof raw.end_date === "string" ? raw.end_date : "";
  const gasoline92 = numeric(raw.gasoline_92_unit_price);
  const diesel = numeric(raw.gasoil_50ppm_unit_price);
  if (!startDate || !Number.isFinite(gasoline92) || gasoline92 <= 0 || !Number.isFinite(diesel) || diesel <= 0) {
    return null;
  }
  const gasoline92Change = numeric(raw.gasoline_92_unit_price_change);
  const dieselChange = numeric(raw.gasoil_50ppm_unit_price_change);
  return {
    startDate,
    endDate: endDate || startDate,
    gasoline92,
    gasoline92Change: Number.isFinite(gasoline92Change) ? gasoline92Change : 0,
    diesel,
    dieselChange: Number.isFinite(dieselChange) ? dieselChange : 0,
    sourceLink: typeof raw.source_link === "string" ? raw.source_link : null,
  };
}

/** Fetches recent MEF fuel-price periods, newest first. Throws on failure. */
export async function fetchMefFuelPeriods(options: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<FuelPeriod[]> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(new DOMException("MEF request timed out", "TimeoutError")), options.timeoutMs ?? 12_000);
  const relayAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", relayAbort, { once: true });
  if (options.signal?.aborted) relayAbort();
  try {
    const response = await fetch(MEF_FUEL_SOURCE, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Fuel-price request failed with ${response.status}`);
    const payload = (await response.json()) as { items?: RawPeriod[] };
    if (!Array.isArray(payload.items)) throw new Error("Invalid MEF fuel response");
    const periods = payload.items.map(normalizeFuelPeriod).filter((p): p is FuelPeriod => p !== null);
    if (!periods.length) throw new Error("MEF fuel response contained no usable periods");
    return periods.sort((a, b) => b.startDate.localeCompare(a.startDate));
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", relayAbort);
  }
}
