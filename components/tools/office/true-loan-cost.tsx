"use client";

// True Loan Cost — reveal the real interest rate hidden in a flat-rate loan or a
// monthly instalment quote.
//
// In Cambodia, shop instalments and many microloans are quoted as a "flat" rate
// ("just 1.5% per month") charged on the whole original amount for the whole
// term. Because you keep paying interest on money you've already repaid, the
// real (reducing-balance) rate is almost double the flat rate — but nobody tells
// you that number. This tool computes it two ways:
//   • from a quoted flat rate → the monthly payment and the true effective rate;
//   • from a monthly payment you're being asked to pay → the true rate it hides.
//
// The effective monthly rate is found by solving the standard annuity equation
//   P = M · (1 − (1+i)^−n) / i
// for i with bisection (the present value is strictly decreasing in i, so a
// bracket always converges). Nothing here is looked up — every figure comes from
// what you enter. Original Tools123 implementation.

import { useMemo } from "react";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { ToolShell, Field, TextInput, Select } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";
import { useToolState } from "@/lib/storage";

type Mode = "flat" | "payment";
type FlatUnit = "year" | "month";

const num = (s: string): number | null => {
  const v = parseFloat(s.replace(/,/g, "").trim());
  return Number.isFinite(v) ? v : null;
};

const money = (v: number, sym: string) =>
  `${sym}${v.toLocaleString(undefined, { maximumFractionDigits: sym === "៛" ? 0 : 2 })}`;

const pct = (v: number) => `${(v * 100).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;

/**
 * Solve the monthly reducing-balance rate `i` that makes a loan of `P` repaid in
 * `n` equal payments of `M` balance to zero. Returns 0 when the payments never
 * exceed the principal (an interest-free or subsidised plan).
 */
function solveMonthlyRate(P: number, M: number, n: number): number {
  if (P <= 0 || M <= 0 || n <= 0) return NaN;
  if (M * n <= P + 1e-6) return 0;
  const pv = (i: number) => (M * (1 - Math.pow(1 + i, -n))) / i;
  let lo = 1e-9;
  let hi = 3; // 300%/month — far above anything real; just a safe bracket
  if (pv(hi) > P) return hi; // payment so high even 300%/mo can't explain it
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    if (pv(mid) > P) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export default function TrueLoanCost() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState<Mode>("true-loan:mode", "flat");
  const [currency, setCurrency] = useToolState("true-loan:currency", "$");
  const [principal, setPrincipal] = useToolState("true-loan:principal", "");
  const [months, setMonths] = useToolState("true-loan:months", "12");
  const [flatRate, setFlatRate] = useToolState("true-loan:flat", "");
  const [flatUnit, setFlatUnit] = useToolState<FlatUnit>("true-loan:flatUnit", "month");
  const [payment, setPayment] = useToolState("true-loan:payment", "");

  const result = useMemo(() => {
    const P = num(principal);
    const n = num(months);
    if (P == null || P <= 0 || n == null || n < 1) return null;
    const term = Math.round(n);

    let monthlyPayment: number;
    let quotedFlatAnnual: number | null = null;

    if (mode === "flat") {
      const fr = num(flatRate);
      if (fr == null || fr < 0) return null;
      const flatMonthly = flatUnit === "month" ? fr / 100 : fr / 100 / 12;
      quotedFlatAnnual = flatMonthly * 12;
      const totalInterest = P * flatMonthly * term;
      monthlyPayment = (P + totalInterest) / term;
    } else {
      const m = num(payment);
      if (m == null || m <= 0) return null;
      monthlyPayment = m;
    }

    const totalPaid = monthlyPayment * term;
    const totalInterest = totalPaid - P;
    const i = solveMonthlyRate(P, monthlyPayment, term);
    if (Number.isNaN(i)) return null;
    const effectiveAnnual = Math.pow(1 + i, 12) - 1;
    const nominalApr = i * 12;
    // The flat rate an equivalent flat loan would have quoted (for the reverse mode).
    const impliedFlatAnnual = term > 0 ? (totalInterest / P) * (12 / term) : 0;

    return {
      P,
      term,
      monthlyPayment,
      totalPaid,
      totalInterest,
      monthlyRate: i,
      effectiveAnnual,
      nominalApr,
      quotedFlatAnnual,
      impliedFlatAnnual,
      interestRatio: P > 0 ? totalInterest / P : 0,
    };
  }, [mode, principal, months, flatRate, flatUnit, payment]);

  const sym = currency;

  return (
    <ToolShell
      title="True Loan Cost"
      khmerTitle="តម្លៃពិតនៃប្រាក់កម្ចី"
      description="See the real interest rate behind a “flat rate” loan or a monthly instalment. Shop instalments and many microloans in Cambodia quote a flat rate charged on the full amount for the whole term, which hides a much higher real rate — because you keep paying interest on money you have already repaid. Enter the flat rate you were quoted, or just the monthly payment they want, and this reveals the true effective annual rate and how much extra you pay. Everything is calculated in your browser."
      descriptionKm="មើលអត្រាការប្រាក់ពិតនៅពីក្រោយប្រាក់កម្ចី «អត្រាថេរ» ឬការបង់រំលស់ប្រចាំខែ។ ការបង់រំលស់តាមហាង និងប្រាក់កម្ចីខ្នាតតូចជាច្រើននៅកម្ពុជាកំណត់អត្រាថេរដែលគិតលើប្រាក់ពេញរយៈពេល ដែលលាក់អត្រាពិតខ្ពស់ជាង — ព្រោះអ្នកបន្តបង់ការប្រាក់លើប្រាក់ដែលអ្នកបានសងរួច។ បញ្ចូលអត្រាថេរដែលគេប្រាប់ ឬគ្រាន់តែចំនួនប្រាក់បង់ប្រចាំខែ រួចឧបករណ៍នេះបង្ហាញអត្រាការប្រាក់ពិតប្រចាំឆ្នាំ និងចំនួនប្រាក់បន្ថែមដែលអ្នកបង់។ គណនាទាំងអស់ក្នុងកម្មវិធីរុករករបស់អ្នក។"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="What do you know?" labelKm="អ្នកដឹងអ្វី?">
          <Select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="flat">A flat interest rate</option>
            <option value="payment">The monthly payment</option>
          </Select>
        </Field>
        <Field label="Amount borrowed" labelKm="ចំនួនប្រាក់ខ្ចី" hint="or the price financed" hintKm="ឬតម្លៃទំនិញ">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <TextInput inputMode="decimal" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="1000" />
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-28">
              <option value="$">USD ($)</option>
              <option value="៛">KHR (៛)</option>
            </Select>
          </div>
        </Field>
        <Field label="Term" labelKm="រយៈពេល" hint="months" hintKm="ខែ">
          <TextInput inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} placeholder="12" />
        </Field>
      </div>

      {mode === "flat" ? (
        <Field label="Quoted flat rate" labelKm="អត្រាថេរដែលគេប្រាប់">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <TextInput inputMode="decimal" value={flatRate} onChange={(e) => setFlatRate(e.target.value)} placeholder="1.5" />
            <Select value={flatUnit} onChange={(e) => setFlatUnit(e.target.value as FlatUnit)} className="w-auto">
              <option value="month">% per month</option>
              <option value="year">% per year</option>
            </Select>
          </div>
        </Field>
      ) : (
        <Field label="Monthly payment they want" labelKm="ប្រាក់បង់ប្រចាំខែ">
          <TextInput inputMode="decimal" value={payment} onChange={(e) => setPayment(e.target.value)} placeholder="95" />
        </Field>
      )}

      {result && (
        <>
          {/* Headline: the true rate */}
          <div className="rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--gold)]">
              <TrendingUp size={14} /> {t("True effective interest rate", "អត្រាការប្រាក់ពិតប្រចាំឆ្នាំ")}
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-3xl font-semibold text-[var(--ink)]">{pct(result.effectiveAnnual)}</span>
              <span className="text-sm text-[var(--ink-dim)]">{t("per year (reducing balance)", "ក្នុងមួយឆ្នាំ (បញ្ចុះសមតុល្យ)")}</span>
            </div>
            {mode === "flat" && result.quotedFlatAnnual != null && result.quotedFlatAnnual > 0 && (
              <p className="mt-2 text-sm text-[var(--ink-dim)]">
                {t(
                  `You were quoted ${pct(result.quotedFlatAnnual)} per year flat — the real cost is about ${(result.effectiveAnnual / result.quotedFlatAnnual).toFixed(1)}× that.`,
                  `គេប្រាប់អ្នក ${pct(result.quotedFlatAnnual)} ក្នុងមួយឆ្នាំថេរ — តម្លៃពិតប្រហែល ${(result.effectiveAnnual / result.quotedFlatAnnual).toFixed(1)}ដង។`,
                )}
              </p>
            )}
            {mode === "payment" && (
              <p className="mt-2 text-sm text-[var(--ink-dim)]">
                {t(
                  `That monthly payment is the same as a flat rate of about ${pct(result.impliedFlatAnnual)} per year.`,
                  `ការបង់ប្រចាំខែនោះស្មើនឹងអត្រាថេរប្រហែល ${pct(result.impliedFlatAnnual)} ក្នុងមួយឆ្នាំ។`,
                )}
              </p>
            )}
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: t("Monthly payment", "បង់ប្រចាំខែ"), value: money(result.monthlyPayment, sym), strong: mode === "flat" },
              { label: t("Total you repay", "សរុបត្រូវសង"), value: money(result.totalPaid, sym) },
              { label: t("Extra (interest)", "បន្ថែម (ការប្រាក់)"), value: money(result.totalInterest, sym), warn: true },
              { label: t("Nominal APR", "APR បន្ទាប់"), value: pct(result.nominalApr) },
            ].map((cell) => (
              <div key={cell.label} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
                <div className="text-[11px] text-[var(--ink-faint)]">{cell.label}</div>
                <div className={`mt-0.5 text-lg font-semibold ${cell.warn ? "text-[var(--danger)]" : cell.strong ? "text-[var(--gold)]" : "text-[var(--ink)]"}`}>
                  {cell.value}
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm leading-relaxed text-[var(--ink-dim)]">
            {t(
              `Over ${result.term} month(s) you repay ${money(result.totalInterest, sym)} more than you borrowed — that is ${pct(result.interestRatio)} of the amount, on top of getting the money back.`,
              `ក្នុងរយៈពេល ${result.term} ខែ អ្នកសងច្រើនជាងអ្វីដែលអ្នកខ្ចី ${money(result.totalInterest, sym)} — ស្មើនឹង ${pct(result.interestRatio)} នៃចំនួនប្រាក់ បន្ថែមលើការសងប្រាក់ដើមវិញ។`,
            )}
          </p>

          {result.effectiveAnnual > 0.6 && (
            <div className="flex items-start gap-2 rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                {t(
                  "This is a very high effective rate. It may be worth comparing offers from a licensed bank or MFI, or asking for a reducing-balance loan instead of a flat one.",
                  "នេះជាអត្រាពិតខ្ពស់ណាស់។ គួរប្រៀបធៀបជាមួយធនាគារ ឬគ្រឹះស្ថានមីក្រូហិរញ្ញវត្ថុមានអាជ្ញាបណ្ណ ឬសុំកម្ចីបែបបញ្ចុះសមតុល្យជំនួសឱ្យបែបថេរ។",
                )}
              </span>
            </div>
          )}
        </>
      )}

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
        <ul className="list-inside list-disc space-y-0.5">
          <li>{t("Original Tools123 implementation using standard time-value-of-money formulas — no external data or rate lookups.", "ជាការសរសេរដើមរបស់ Tools123 ដោយប្រើរូបមន្តតម្លៃប្រាក់តាមពេលវេលាស្តង់ដារ — គ្មានទិន្នន័យខាងក្រៅ ឬការរកមើលអត្រាទេ។")}</li>
          <li>{t("The effective rate is the reducing-balance rate that reproduces the same payments; the nominal APR is that monthly rate ×12.", "អត្រាពិតគឺជាអត្រាបញ្ចុះសមតុល្យដែលផ្តល់ការបង់ដូចគ្នា។ APR បន្ទាប់គឺអត្រាប្រចាំខែ ×១២។")}</li>
          <li>{t("This is an estimate to help you compare offers — it is not financial advice, and lenders may add fees not shown here.", "នេះជាការប៉ាន់ស្មានដើម្បីជួយប្រៀបធៀប — មិនមែនជាដំបូន្មានហិរញ្ញវត្ថុទេ ហើយអ្នកឱ្យខ្ចីអាចបន្ថែមថ្លៃសេវាដែលមិនបង្ហាញនៅទីនេះ។")}</li>
        </ul>
      </div>
    </ToolShell>
  );
}
