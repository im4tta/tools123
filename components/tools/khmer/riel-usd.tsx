"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Row, Select, TextInput, ToolShell } from "@/components/ui/Shell";
import { Button, Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { editableMefRate, fetchMefExchangeRates, isAbortError, MEF_EXCHANGE_SOURCE, type MefCurrencyRate } from "@/lib/mef-exchange";

type LoadStatus = "loading" | "ready" | "error";

function formatRate(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: value < 1 ? 4 : 2 }).format(value);
}

export default function RielUsd() {
  const { text: t } = useLanguage();
  const [riel, setRiel] = useToolState("riel-usd:riel", "400000");
  const [manualRate, setManualRate] = useToolState("riel-usd:rate", "4100");
  const [selectedCode, setSelectedCode] = useToolState("riel-usd:currency", "USD");
  const selectedCodeRef = useRef(selectedCode);
  const [rates, setRates] = useState<MefCurrencyRate[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");

  useEffect(() => {
    selectedCodeRef.current = selectedCode;
  }, [selectedCode]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchMefExchangeRates({ signal: controller.signal }).then(
      (nextRates) => {
        const active = nextRates.find((rate) => rate.code === selectedCodeRef.current)
          ?? nextRates.find((rate) => rate.code === "USD")
          ?? nextRates[0];
        setRates(nextRates);
        setSelectedCode(active.code);
        setManualRate(editableMefRate(active.average));
        setStatus("ready");
      },
      (error: unknown) => {
        if (isAbortError(error)) return;
        setStatus("error");
      }
    );
    return () => controller.abort();
  }, [setManualRate, setSelectedCode]);

  async function refreshRates() {
    try {
      const nextRates = await fetchMefExchangeRates();
      const active = nextRates.find((rate) => rate.code === selectedCodeRef.current)
        ?? nextRates.find((rate) => rate.code === "USD")
        ?? nextRates[0];
      setRates(nextRates);
      setSelectedCode(active.code);
      setManualRate(editableMefRate(active.average));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  function chooseCurrency(code: string) {
    setSelectedCode(code);
    const next = rates.find((rate) => rate.code === code);
    if (next) setManualRate(editableMefRate(next.average));
  }

  const selectedRate = rates.find((rate) => rate.code === selectedCode) ?? null;
  const rielNumber = Number(riel);
  const rateNumber = Number(manualRate);
  const converted = Number.isFinite(rielNumber) && Number.isFinite(rateNumber) && rateNumber > 0
    ? rielNumber / rateNumber
    : null;
  const validDate = selectedRate?.validDate ?? rates.find((rate) => rate.validDate)?.validDate ?? null;

  return (
    <ToolShell
      title="KHR Currency Converter"
      khmerTitle="កម្មវិធីប្តូរប្រាក់រៀល"
      description="Convert Cambodian Riel to every currency published by Cambodia's Ministry of Economy and Finance. Official bid, ask, and average rates are normalized per one currency unit, with a manual-rate fallback."
      descriptionKm="បម្លែងប្រាក់រៀលខ្មែរទៅគ្រប់រូបិយប័ណ្ណដែលក្រសួងសេដ្ឋកិច្ច និងហិរញ្ញវត្ថុបានផ្សព្វផ្សាយ។ អត្រាទិញ លក់ និងមធ្យមផ្លូវការត្រូវបានគណនាក្នុងមួយឯកតារូបិយប័ណ្ណ ហើយអាចបញ្ចូលអត្រាដោយដៃជំនួសបាន។"
    >
      <div
        role="status"
        aria-live="polite"
        className={`rounded-md border p-3 text-xs leading-relaxed ${status === "error" ? "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]" : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}
      >
        {status === "loading" && t("Loading all official MEF exchange rates…", "កំពុងទាញយកអត្រាប្តូរប្រាក់ផ្លូវការទាំងអស់ពី កសហវ…")}
        {status === "ready" && selectedRate && (
          <>
            {t(
              `${rates.length} currencies available for ${validDate ?? "the latest date"}. ${selectedRate.code} average: ${formatRate(selectedRate.average)} KHR per unit. This request goes directly from your browser to MEF, so its rate limit uses your IP—not the Toolbox123 host.`,
              `មានរូបិយប័ណ្ណ ${rates.length} សម្រាប់ថ្ងៃទី ${validDate ?? "ថ្មីបំផុត"}។ អត្រាមធ្យម ${selectedRate.code}៖ ${formatRate(selectedRate.average)} រៀលក្នុងមួយឯកតា។ សំណើនេះផ្ញើដោយផ្ទាល់ពីកម្មវិធីរុករករបស់អ្នកទៅ កសហវ ដូច្នេះការកំណត់អត្រាប្រើ IP របស់អ្នក មិនមែនម៉ាស៊ីនមេ Toolbox123 ទេ។`
            )}{" "}
            <a href={MEF_EXCHANGE_SOURCE} target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">
              {t("View official source", "មើលប្រភពផ្លូវការ")}
            </a>
          </>
        )}
        {status === "error" && t(
          "Official rates are temporarily unavailable. Your saved currency and manual rate remain usable; no request was proxied through the Toolbox123 server.",
          "មិនអាចទាញយកអត្រាផ្លូវការបានបណ្ដោះអាសន្ន។ រូបិយប័ណ្ណ និងអត្រាដែលបានរក្សាទុកនៅតែអាចប្រើបាន ហើយគ្មានសំណើណាមួយត្រូវបានបញ្ជូនកាត់ម៉ាស៊ីនមេ Toolbox123 ទេ។"
        )}
      </div>

      <Row>
        <Field label="Convert KHR to" labelKm="បម្លែងប្រាក់រៀលទៅជា">
          <Select value={selectedCode} onChange={(event) => chooseCurrency(event.target.value)} disabled={!rates.length}>
            {!rates.length && <option value={selectedCode}>{selectedCode}</option>}
            {rates.map((rate) => <option key={rate.code} value={rate.code}>{rate.code} — {rate.name}</option>)}
          </Select>
        </Field>
        <Field label="Amount (KHR)" labelKm="ចំនួនទឹកប្រាក់ (រៀល)">
          <TextInput value={riel} onChange={(event) => setRiel(event.target.value)} inputMode="decimal" className="font-mono-ui" />
        </Field>
        <Field label={`Rate (KHR per ${selectedCode})`} labelKm={`អត្រា (រៀលក្នុង ១ ${selectedCode})`} hint={selectedRate ? t("Official average; editable", "អត្រាមធ្យមផ្លូវការ; អាចកែបាន") : t("Manual fallback", "អត្រាបម្រុងបញ្ចូលដោយដៃ")}>
          <TextInput value={manualRate} onChange={(event) => setManualRate(event.target.value)} inputMode="decimal" className="font-mono-ui" />
        </Field>
      </Row>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => {
            setStatus("loading");
            void refreshRates();
          }}
          disabled={status === "loading"}
          className="inline-flex items-center gap-2"
        >
          <RefreshCw size={14} className={status === "loading" ? "animate-spin" : ""} />
          {t(status === "loading" ? "Loading official rates…" : "Refresh official rates", status === "loading" ? "កំពុងទាញយកអត្រាផ្លូវការ…" : "ធ្វើបច្ចុប្បន្នភាពអត្រាផ្លូវការ")}
        </Button>
        {selectedRate && <span className="text-xs text-[var(--ink-faint)]">{selectedRate.symbol}</span>}
      </div>

      <Output
        label={`≈ ${selectedCode}`}
        value={converted === null ? "" : `${converted.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${selectedCode}`}
        error={converted === null}
      />

      {rates.length > 0 && (
        <section>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-sm font-medium text-[var(--ink)]">{t("All available currencies", "រូបិយប័ណ្ណដែលមានទាំងអស់")}</h2>
            <span className="text-xs text-[var(--ink-faint)]">{t("KHR per 1 currency unit", "រៀលក្នុង ១ ឯកតារូបិយប័ណ្ណ")}</span>
          </div>
          <div className="max-h-96 overflow-auto rounded-md border border-[var(--ground-line)]">
            <table className="w-full min-w-[42rem] border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-[var(--ground-raised-hi)] text-[var(--ink-dim)]">
                <tr>
                  <th className="px-3 py-2">{t("Code", "កូដ")}</th>
                  <th className="px-3 py-2">{t("Currency", "រូបិយប័ណ្ណ")}</th>
                  <th className="px-3 py-2 text-right">{t("Bid", "ទិញ")}</th>
                  <th className="px-3 py-2 text-right">{t("Ask", "លក់")}</th>
                  <th className="px-3 py-2 text-right">{t("Average", "មធ្យម")}</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((currency) => (
                  <tr key={currency.code} className={`border-t border-[var(--ground-line)] ${currency.code === selectedCode ? "bg-[var(--gold)]/10" : ""}`}>
                    <td className="px-3 py-2 font-mono-ui font-medium text-[var(--ink)]">{currency.code}</td>
                    <td className="px-3 py-2 text-[var(--ink-dim)]">{currency.name}</td>
                    <td className="px-3 py-2 text-right font-mono-ui">{formatRate(currency.bid)}</td>
                    <td className="px-3 py-2 text-right font-mono-ui">{formatRate(currency.ask)}</td>
                    <td className="px-3 py-2 text-right font-mono-ui text-[var(--gold)]">{formatRate(currency.average)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </ToolShell>
  );
}
