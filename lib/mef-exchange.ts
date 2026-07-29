export const MEF_EXCHANGE_SOURCE = "https://data.mef.gov.kh/api/v1/realtime-api/exchange-rate";

export type MefCurrencyRate = {
  code: string;
  name: string;
  symbol: string;
  unit: number;
  bid: number;
  ask: number;
  average: number;
  validDate: string | null;
};

type RawRate = {
  currency_id?: unknown;
  currency?: unknown;
  symbol?: unknown;
  unit?: unknown;
  bid?: unknown;
  ask?: unknown;
  average?: unknown;
  valid_date?: unknown;
};

function numeric(value: unknown) {
  return Number(typeof value === "string" ? value.replaceAll(",", "") : value);
}

export function normalizeMefRate(raw: RawRate): MefCurrencyRate | null {
  const code = typeof raw.currency_id === "string" ? raw.currency_id.trim().toUpperCase() : "";
  const unit = numeric(raw.unit);
  const bid = numeric(raw.bid);
  const ask = numeric(raw.ask);
  const average = numeric(raw.average);
  if (!code || !Number.isFinite(unit) || unit <= 0 || !Number.isFinite(bid) || !Number.isFinite(ask) || !Number.isFinite(average) || average <= 0) return null;
  return {
    code,
    name: typeof raw.currency === "string" ? raw.currency : code,
    symbol: typeof raw.symbol === "string" ? raw.symbol : `${code}/KHR`,
    unit,
    bid: bid / unit,
    ask: ask / unit,
    average: average / unit,
    validDate: typeof raw.valid_date === "string" ? raw.valid_date : null,
  };
}

export async function fetchMefExchangeRates(options: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<MefCurrencyRate[]> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(new DOMException("MEF request timed out", "TimeoutError")), options.timeoutMs ?? 12_000);
  const relayAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", relayAbort, { once: true });
  if (options.signal?.aborted) relayAbort();
  try {
    const response = await fetch(MEF_EXCHANGE_SOURCE, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Rate request failed with ${response.status}`);
    const payload = (await response.json()) as { data?: RawRate[] };
    if (!Array.isArray(payload.data)) throw new Error("Invalid MEF response");
    const rates = payload.data.map(normalizeMefRate).filter((rate): rate is MefCurrencyRate => rate !== null);
    if (!rates.length) throw new Error("MEF response contained no usable rates");
    return rates.sort((a, b) => a.code.localeCompare(b.code));
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", relayAbort);
  }
}

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function editableMefRate(value: number) {
  return String(Number(value.toFixed(6)));
}