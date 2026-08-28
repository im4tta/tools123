"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// Cambodia gold conventions: 1 chi (ជី) = 3.75 g; 1 troy ounce = 31.1035 g.
// The price per chi and the exchange rate are USER-SUPPLIED — this tool never
// fetches or claims official NBC / market gold prices.

const GRAMS_PER_CHI = 3.75;
const GRAMS_PER_OZT = 31.1035;
const KARATS = [24, 22, 18];

const UNITS = [
  { id: "chi", en: "Chi (ជី)", km: "ជី" },
  { id: "gram", en: "Gram", km: "ក្រាម" },
  { id: "ozt", en: "Troy ounce", km: "អោនស៍ត្រយ" },
] as const;

function toNum(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function GoldPriceCalculator() {
  const { text: t } = useLanguage();
  const [priceChi, setPriceChi] = useToolState("gold:priceChi", "");
  const [fx, setFx] = useToolState("gold:fx", "4100");
  const [amount, setAmount] = useToolState("gold:amount", "1");
  const [unit, setUnit] = useToolState("gold:unit", "chi");
  const [karat, setKarat] = useToolState("gold:karat", "24");

  const valid = toNum(priceChi) > 0 && toNum(fx) > 0 && toNum(amount) > 0;

  const result = useMemo(() => {
    const price = Math.max(0, toNum(priceChi));
    const rate = Math.max(0, toNum(fx)) || 1;
    const amt = Math.max(0, toNum(amount));
    const k = Math.min(24, Math.max(0, toNum(karat))) / 24;
    const gramsPerUnit = unit === "chi" ? GRAMS_PER_CHI : unit === "ozt" ? GRAMS_PER_OZT : 1;
    const grams = amt * gramsPerUnit;
    const pricePerGram24k = price / GRAMS_PER_CHI;
    const pricePerGram = pricePerGram24k * k;
    const valueKhr = grams * pricePerGram;
    return {
      grams,
      k,
      rate,
      valueKhr,
      valueUsd: valueKhr / rate,
      perChi: pricePerGram * GRAMS_PER_CHI,
      perGram: pricePerGram,
      perOzt: pricePerGram * GRAMS_PER_OZT,
    };
  }, [priceChi, fx, amount, unit, karat]);

  const khr = (n: number) => `${Math.round(n).toLocaleString("en-US")} ៛`;
  const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

  const unitLabel = UNITS.find((u) => u.id === unit)?.en ?? unit;

  const output = [
    t("GOLD VALUE — USER-SUPPLIED RATE", "តម្លៃមាស — អត្រាបញ្ចូលដោយអ្នកប្រើ"),
    "─".repeat(46),
    `${t("Weight", "ទម្ងន់")}: ${amount} ${unitLabel} = ${result.grams.toFixed(2)} g`,
    `${t("Purity", "ភាពសុទ្ធ")}: ${karat}K (${(result.k * 100).toFixed(1)}%)`,
    `${t("Value", "តម្លៃ")}: ${khr(result.valueKhr)}`,
    `${t("Value (USD)", "តម្លៃ (ដុល្លារ)")}: ${usd(result.valueUsd)}`,
    "",
    t("PER-UNIT BREAKDOWN (KHR / USD)", "តម្លៃក្នុងមួយឯកតា (រៀល / ដុល្លារ)"),
    "─".repeat(46),
    `${t("Per chi (ជី)", "ក្នុងមួយជី")}: ${khr(result.perChi)} / ${usd(result.perChi / result.rate)}`,
    `${t("Per gram", "ក្នុងមួយក្រាម")}: ${khr(result.perGram)} / ${usd(result.perGram / result.rate)}`,
    `${t("Per troy ounce", "ក្នុងមួយអោនស៍ត្រយ")}: ${khr(result.perOzt)} / ${usd(result.perOzt / result.rate)}`,
  ].join("\n");

  return (
    <ToolShell
      title="Gold Price Calculator (Cambodia)"
      khmerTitle="គណនាតម្លៃមាសកម្ពុជា"
      description="Compute the value of gold in KHR and USD from a user-supplied price per chi (ជី), weight and karat — the rate is entered by you, not fetched from any official source."
      descriptionKm="គណនាតម្លៃមាសជារៀល និងដុល្លារ ពីតម្លៃក្នុងមួយជី ទម្ងន់ និងការ៉ាត់ដែលអ្នកបញ្ចូលដោយខ្លួនឯង — អត្រាគឺបញ្ចូលដោយអ្នក មិនមែនទាញយកពីប្រភពផ្លូវការណាមួយទេ។"
    >
      <Row>
        <Field label={t("Price per chi, 24K (KHR) — user-supplied", "តម្លៃក្នុងមួយជី 24K (រៀល) — បញ្ចូលដោយអ្នកប្រើ")}>
          <TextInput type="number" min="0" step="any" value={priceChi} onChange={(e) => setPriceChi(e.target.value)} placeholder={t("e.g. 2,500,000", "ឧ. 2,500,000")} />
        </Field>
        <Field label={t("Exchange rate (KHR per USD) — user-supplied", "អត្រាប្តូរប្រាក់ (រៀល/ដុល្លារ) — បញ្ចូលដោយអ្នកប្រើ")}>
          <TextInput type="number" min="0" step="any" value={fx} onChange={(e) => setFx(e.target.value)} />
        </Field>
        <Field label={t("Amount", "ចំនួន")}>
          <TextInput type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label={t("Unit", "ឯកតា")}>
          <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
            {UNITS.map((u) => (
              <option key={u.id} value={u.id}>{t(u.en, u.km)}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("Karat (editable)", "ការ៉ាត់ (អាចកែប្រែបាន)")}>
          <TextInput type="number" min="0" max="24" step="any" value={karat} onChange={(e) => setKarat(e.target.value)} />
        </Field>
        <div className="flex flex-wrap items-end gap-1.5">
          {KARATS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKarat(String(k))}
              className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
                toNum(karat) === k
                  ? "border-[var(--gold-dim)] bg-[var(--gold)]/15 text-[var(--gold)]"
                  : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
              }`}
            >
              {k}K
            </button>
          ))}
        </div>
      </Row>

      {valid ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Weight", "ទម្ងន់")}</div>
              <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{result.grams.toFixed(2)} g</div>
              <div className="text-xs text-[var(--ink-dim)]">{t("pure gold", "មាសសុទ្ធ")} {(result.k * 100).toFixed(1)}%</div>
            </div>
            <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--gold)]">{t("Value", "តម្លៃ")}</div>
              <div className="mt-1 text-lg font-semibold text-[var(--gold)]">{khr(result.valueKhr)}</div>
              <div className="text-xs text-[var(--gold)]">{usd(result.valueUsd)} USD</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("24K price per gram", "តម្លៃ 24K ក្នុងមួយក្រាម")}</div>
              <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{khr(toNum(priceChi) / 3.75)}</div>
              <div className="text-xs text-[var(--ink-dim)]">{usd(toNum(priceChi) / 3.75 / result.rate)} USD</div>
            </div>
          </div>
          <Output label={t("Value & per-unit breakdown", "តម្លៃ និងតម្លៃក្នុងមួយឯកតា")} value={output} mono={false} />
        </>
      ) : (
        <p className="text-sm text-[var(--danger)]">
          {t("Enter a valid price per chi, exchange rate and amount.", "សូមបញ្ចូលតម្លៃក្នុងមួយជី អត្រាប្តូរប្រាក់ និងចំនួនឱ្យបានត្រឹមត្រូវ។")}
        </p>
      )}

      <div className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-xs leading-relaxed text-[var(--danger)]">
        {t(
          "User-supplied rate, not official — enter the current market price yourself. This tool does not fetch or claim official NBC (National Bank of Cambodia) or market gold prices.",
          "អត្រាបញ្ចូលដោយអ្នកប្រើ មិនមែនជាផ្លូវការទេ — សូមបញ្ចូលតម្លៃទីផ្សារបច្ចុប្បន្នដោយខ្លួនឯង។ ឧបករណ៍នេះមិនទាញយក ឬអះអាងតម្លៃមាសផ្លូវការរបស់ NBC (ធនាគារជាតិនៃកម្ពុជា) ឬទីផ្សារឡើយ។"
        )}
      </div>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <h3 className="font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងក្រេឌីត")}</h3>
        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[var(--ink-dim)]">
          <li>{t("1 chi (ជី) = 3.75 g — the standard Cambodian gold weight unit.", "១ ជី = 3.75 ក្រាម — ឯកតាទម្ងន់មាសស្ដង់ដារកម្ពុជា។")}</li>
          <li>{t("1 troy ounce = 31.1035 g — the international standard for precious metals.", "១ អោនស៍ត្រយ = 31.1035 ក្រាម — ស្ដង់ដារអន្តរជាតិសម្រាប់លោហៈមានតម្លៃ។")}</li>
          <li>{t("Karat factor is editable: 24K = 100%, 22K ≈ 91.7%, 18K = 75% of the 24K price.", "កត្តាការ៉ាត់អាចកែប្រែបាន: 24K = 100%, 22K ≈ 91.7%, 18K = 75% នៃតម្លៃ 24K។")}</li>
          <li>{t("Prices and the exchange rate must be entered by the user — this tool never claims official data.", "តម្លៃ និងអត្រាប្តូរប្រាក់ត្រូវតែបញ្ចូលដោយអ្នកប្រើ — ឧបករណ៍នេះមិនដែលអះអាងទិន្នន័យផ្លូវការទេ។")}</li>
        </ul>
      </div>
    </ToolShell>
  );
}
