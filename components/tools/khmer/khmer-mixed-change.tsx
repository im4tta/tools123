"use client";
import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Row, TextInput, ToolShell } from "@/components/ui/Shell";
import { Pill, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { computeChange, DEFAULT_RIEL_DENOMS, greedyBreakdown, parseDenoms } from "@/lib/khmer-money";

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const khr = (n: number) => `${Math.round(n).toLocaleString("en-US")} ៛`;
// $2 bills are legal tender but rarely handled in Cambodia, so change suggestions skip them.
const USD_NOTES = [100, 50, 20, 10, 5, 1];
/** Blank fields count as 0; anything else goes through Number() (invalid → NaN → rejected). */
const num = (s: string) => (s.trim() === "" ? 0 : Number(s));

export default function KhmerMixedChange() {
  const { text: t } = useLanguage();
  const [rate, setRate] = useToolState("khmer-change:rate", "");
  const [priceUsd, setPriceUsd] = useToolState("khmer-change:price-usd", "");
  const [priceKhr, setPriceKhr] = useToolState("khmer-change:price-khr", "");
  const [paidUsd, setPaidUsd] = useToolState("khmer-change:paid-usd", "");
  const [paidKhr, setPaidKhr] = useToolState("khmer-change:paid-khr", "");
  const [mode, setMode] = useToolState<"riel" | "mixed">("khmer-change:mode", "mixed");
  const [roundTo, setRoundTo] = useToolState("khmer-change:round", 100);

  const r = Number(rate);
  const result = useMemo(
    () => computeChange({ priceUsd: num(priceUsd), priceKhr: num(priceKhr), paidUsd: num(paidUsd), paidKhr: num(paidKhr), rate: r, mode, roundTo }),
    [priceUsd, priceKhr, paidUsd, paidKhr, r, mode, roundTo],
  );
  const entered = [priceUsd, priceKhr].some((s) => s.trim() !== "") && [paidUsd, paidKhr].some((s) => s.trim() !== "");
  const rielNotes = result ? greedyBreakdown(result.changeKhr, parseDenoms(DEFAULT_RIEL_DENOMS)).rows : [];
  const usdNotes = result ? greedyBreakdown(result.changeUsd, USD_NOTES).rows : [];

  return (
    <ToolShell
      title="USD / Riel Mixed Change Calculator"
      khmerTitle="ម៉ាស៊ីនគិតប្រាក់អាប់ ដុល្លារ / រៀល"
      description="In Cambodia prices, payments, and change often mix dollars and riel. Enter the price (in USD, KHR, or both), what the customer hands over (USD and/or KHR), and the shop's exchange rate, and see exactly how much change to give — all in riel, or whole dollars first with the remainder in riel — including which notes to use and any amount lost to rounding. Handy for shops, market stalls, and checking your own change."
      descriptionKm="នៅកម្ពុជា តម្លៃ ការបង់ប្រាក់ និងប្រាក់អាប់ ច្រើនតែលាយដុល្លារ និងរៀល។ បញ្ចូលតម្លៃ (ជាដុល្លារ រៀល ឬទាំងពីរ) ប្រាក់ដែលអតិថិជនឱ្យ (ដុល្លារ និង/ឬរៀល) និងអត្រាប្តូរប្រាក់របស់ហាង ហើយមើលឱ្យច្បាស់ថាត្រូវអាប់ប៉ុន្មាន — ជារៀលទាំងអស់ ឬដុល្លារគត់មុន ហើយនៅសល់ជារៀល — រួមទាំងក្រដាសប្រាក់ដែលត្រូវប្រើ និងចំនួនដែលបាត់ដោយការបង្គត់។ ងាយស្រួលសម្រាប់ហាង តូបផ្សារ និងពិនិត្យប្រាក់អាប់របស់អ្នកផ្ទាល់។"
    >
      <Field label="Exchange rate — riel per 1 USD" labelKm="អត្រាប្តូរប្រាក់ — រៀលក្នុង ១ ដុល្លារ" hint="Use the rate the shop uses" hintKm="ប្រើអត្រាដែលហាងប្រើ">
        <TextInput type="number" min={0} inputMode="numeric" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="e.g. 4000" />
      </Field>
      <Row>
        <Field label="Price in USD ($)" labelKm="តម្លៃជាដុល្លារ ($)">
          <TextInput type="number" min={0} step="any" inputMode="decimal" value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} />
        </Field>
        <Field label="Price in KHR (៛)" labelKm="តម្លៃជារៀល (៛)">
          <TextInput type="number" min={0} step="100" inputMode="numeric" value={priceKhr} onChange={(e) => setPriceKhr(e.target.value)} />
        </Field>
        <Field label="Customer pays USD ($)" labelKm="អតិថិជនបង់ជាដុល្លារ ($)">
          <TextInput type="number" min={0} step="any" inputMode="decimal" value={paidUsd} onChange={(e) => setPaidUsd(e.target.value)} />
        </Field>
        <Field label="Customer pays KHR (៛)" labelKm="អតិថិជនបង់ជារៀល (៛)">
          <TextInput type="number" min={0} step="100" inputMode="numeric" value={paidKhr} onChange={(e) => setPaidKhr(e.target.value)} />
        </Field>
      </Row>
      <PillGroup label={t("Give change as", "អាប់ប្រាក់ជា")}>
        <Pill active={mode === "mixed"} onClick={() => setMode("mixed")}>{t("Whole dollars + riel", "ដុល្លារគត់ + រៀល")}</Pill>
        <Pill active={mode === "riel"} onClick={() => setMode("riel")}>{t("All in riel", "រៀលទាំងអស់")}</Pill>
      </PillGroup>
      <PillGroup label={t("Round riel down to", "បង្គត់រៀលចុះទៅ")}>
        {[1, 100, 500, 1000].map((n) => <Pill key={n} active={roundTo === n} onClick={() => setRoundTo(n)}>{n === 1 ? t("No rounding", "មិនបង្គត់") : khr(n)}</Pill>)}
      </PillGroup>

      {!(r > 0) ? (
        <p className="text-sm text-[var(--ink-faint)]">{t("Enter the exchange rate the shop uses to start.", "បញ្ចូលអត្រាប្តូរប្រាក់ដែលហាងប្រើដើម្បីចាប់ផ្តើម។")}</p>
      ) : !result ? (
        <p className="text-sm text-[var(--danger)]" role="alert">{t("Amounts must be zero or more.", "ចំនួនទឹកប្រាក់ត្រូវតែសូន្យ ឬច្រើនជាងនេះ។")}</p>
      ) : entered && (
        <div className="space-y-3" role="status">
          <div className="grid grid-cols-2 gap-3">
            <Stat label={t("Total due", "ត្រូវបង់សរុប")} value={`${khr(result.dueKhr)} · ${usd(result.dueKhr / r)}`} />
            <Stat label={t("Customer paid", "អតិថិជនបានបង់")} value={`${khr(result.paidKhr)} · ${usd(result.paidKhr / r)}`} />
          </div>
          {result.owedKhr > 0 ? (
            <div className="rounded-md border border-[var(--danger)]/50 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
              {t(`Not enough — the customer still owes ${khr(result.owedKhr)} (≈ ${usd(result.owedUsd)}).`, `មិនគ្រប់ — អតិថិជននៅជំពាក់ ${khr(result.owedKhr)} (≈ ${usd(result.owedUsd)})។`)}
            </div>
          ) : (
            <div className="rounded-md border border-[var(--gold)] bg-[var(--ground-raised)] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Give back", "ត្រូវអាប់")}</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                {result.changeUsd > 0 && <>{usd(result.changeUsd)}{result.changeKhr > 0 && " + "}</>}
                {(result.changeKhr > 0 || result.changeUsd === 0) && khr(result.changeKhr)}
              </p>
              {(usdNotes.length > 0 || rielNotes.length > 0) && (
                <p className="mt-2 text-sm text-[var(--ink-dim)]">
                  {[...usdNotes.map((n) => `${n.count} × $${n.denom}`), ...rielNotes.map((n) => `${n.count} × ${khr(n.denom)}`)].join(" · ")}
                </p>
              )}
              {result.roundedOffKhr > 0 && (
                <p className="mt-2 text-xs text-[var(--ink-faint)]">{t(`${khr(result.roundedOffKhr)} is kept by rounding down to ${khr(roundTo)}.`, `${khr(result.roundedOffKhr)} មិនត្រូវអាប់ ដោយសារបង្គត់ចុះទៅ ${khr(roundTo)}។`)}</p>
              )}
            </div>
          )}
        </div>
      )}

      <SourceCredits>
        <p>{t(
          "Every value is converted to whole riel with the rate you enter — no rate is fetched or assumed, because shops set their own (the official NBC/MEF reference rate is available in the KHR Currency Converter). Rounding always goes down and the kept amount is shown. The note suggestion uses the common riel banknotes (100 to 100,000 ៛) and US notes ($1, $5, $10, $20, $50, $100); a shop may not have every note on hand. Original Tools123 implementation.",
          "តម្លៃនីមួយៗត្រូវបម្លែងជារៀលគត់ដោយអត្រាដែលអ្នកបញ្ចូល — គ្មានអត្រាត្រូវទាញយក ឬសន្មតទេ ព្រោះហាងកំណត់អត្រាផ្ទាល់ខ្លួន (អត្រាយោងផ្លូវការ ធនាគារជាតិ/កសហវ មាននៅក្នុងឧបករណ៍បម្លែងរូបិយប័ណ្ណរៀល)។ ការបង្គត់តែងតែចុះក្រោម ហើយចំនួនដែលមិនអាប់ត្រូវបង្ហាញ។ ការណែនាំក្រដាសប្រាក់ប្រើក្រដាសរៀលទូទៅ (១០០ ដល់ ១០០,០០០ ៛) និងក្រដាសដុល្លារ ($1, $5, $10, $20, $50, $100) ហាងប្រហែលមិនមានគ្រប់ក្រដាសទេ។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
      <div className="text-xs text-[var(--ink-faint)]">{label}</div>
      <div className="mt-1 text-base font-semibold text-[var(--ink)]">{value}</div>
    </div>
  );
}
