"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { Button, Output } from "@/components/ui/Output";
import { Field, Row, Select, TextInput, ToolShell } from "@/components/ui/Shell";
import { editableMefRate, fetchMefExchangeRates, isAbortError, MEF_EXCHANGE_SOURCE, type MefCurrencyRate } from "@/lib/mef-exchange";

type Tab = "loan" | "vat" | "discount" | "date" | "salary";
type LoanRow = { period: number; payment: number; principal: number; interest: number; balance: number };

const TABS: { id: Tab; en: string; km: string }[] = [
  { id: "loan", en: "Loan", km: "ប្រាក់កម្ចី" },
  { id: "vat", en: "VAT", km: "អាករលើតម្លៃបន្ថែម" },
  { id: "discount", en: "Discount", km: "បញ្ចុះតម្លៃ" },
  { id: "date", en: "Date", km: "កាលបរិច្ឆេទ" },
  { id: "salary", en: "Salary tax & NSSF", km: "ពន្ធលើប្រាក់ខែ និង ប.ស.ស." },
];

const numberOf = (value: string) => value.trim() === "" ? NaN : Number(value);
const validRate = (value: number) => Number.isFinite(value) && value >= 0 && value <= 100;
const localIso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function parseLocalDate(value: string) {
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return null;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return localIso(date) === value ? date : null;
}

const KHR = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const formatKhr = (value: number) => `${KHR.format(Math.round(value))} KHR`;

function salaryTax(taxable: number) {
  if (taxable <= 1_500_000) return { tax: 0, marginalRate: 0 };
  if (taxable <= 2_000_000) return { tax: taxable * 0.05 - 75_000, marginalRate: 5 };
  if (taxable <= 8_500_000) return { tax: taxable * 0.10 - 175_000, marginalRate: 10 };
  if (taxable <= 12_500_000) return { tax: taxable * 0.15 - 600_000, marginalRate: 15 };
  return { tax: taxable * 0.20 - 1_225_000, marginalRate: 20 };
}

function healthRiskAssumedWage(gross: number) {
  if (gross <= 200_000) return 200_000;
  if (gross > 1_200_000) return 1_200_000;
  const band = Math.ceil((gross - 200_000) / 50_000);
  return 175_000 + band * 50_000;
}

export default function BusinessCalculators() {
  const { text } = useLanguage();
  const [tab, setTab] = useState<Tab>("loan");
  const [currency, setCurrency] = useState("KHR");
  const [rates, setRates] = useState<MefCurrencyRate[]>([]);
  const [exchangeRate, setExchangeRate] = useState("1");
  const [rateStatus, setRateStatus] = useState<"loading" | "ready" | "error">("loading");
  const [salary, setSalary] = useState({ gross: "3000000", dependents: "0" });
  const [salaryCurrency, setSalaryCurrency] = useState("KHR");
  const [salaryExchangeRate, setSalaryExchangeRate] = useState("1");
  const selectedRate = rates.find((rate) => rate.code === currency) ?? null;
  const salarySelectedRate = rates.find((rate) => rate.code === salaryCurrency) ?? null;
  const salaryKhrPerUnit = salaryCurrency === "KHR" ? 1 : numberOf(salaryExchangeRate);
  const validSalaryExchangeRate = Number.isFinite(salaryKhrPerUnit) && salaryKhrPerUnit > 0;
  const format = (value: number) => `${new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ${currency}`;
  const formatSalaryCurrency = (value: number) => `${new Intl.NumberFormat(undefined, { minimumFractionDigits: salaryCurrency === "KHR" ? 0 : 2, maximumFractionDigits: salaryCurrency === "KHR" ? 0 : 2 }).format(value)} ${salaryCurrency}`;
  const formatSalary = (value: number) => salaryCurrency === "KHR" ? formatKhr(value) : `${formatKhr(value)} (≈ ${formatSalaryCurrency(value / salaryKhrPerUnit)})`;

  useEffect(() => {
    const controller = new AbortController();
    void fetchMefExchangeRates({ signal: controller.signal }).then((nextRates) => {
      setRates(nextRates);
      setRateStatus("ready");
    }, (error: unknown) => {
      if (!isAbortError(error)) setRateStatus("error");
    });
    return () => controller.abort();
  }, []);

  function chooseCurrency(code: string) {
    setCurrency(code);
    if (code === "KHR") setExchangeRate("1");
    else {
      const rate = rates.find((item) => item.code === code);
      setExchangeRate(rate ? editableMefRate(rate.average) : "");
    }
  }

  function chooseSalaryCurrency(code: string) {
    const nextRate = code === "KHR" ? 1 : rates.find((item) => item.code === code)?.average;
    if (!nextRate) return;
    const entered = numberOf(salary.gross);
    const currentRate = validSalaryExchangeRate ? salaryKhrPerUnit : 1;
    const preservedKhr = Number.isFinite(entered) ? entered * currentRate : NaN;
    const converted = Number.isFinite(preservedKhr) ? preservedKhr / nextRate : NaN;
    setSalaryCurrency(code);
    setSalaryExchangeRate(editableMefRate(nextRate));
    if (Number.isFinite(converted)) setSalary((current) => ({ ...current, gross: code === "KHR" ? String(Math.round(converted)) : String(Number(converted.toFixed(2))) }));
  }

  async function refreshRates() {
    setRateStatus("loading");
    try {
      const nextRates = await fetchMefExchangeRates();
      setRates(nextRates);
      const rate = nextRates.find((item) => item.code === currency);
      if (rate) setExchangeRate(editableMefRate(rate.average));
      const nextSalaryRate = nextRates.find((item) => item.code === salaryCurrency);
      if (nextSalaryRate) setSalaryExchangeRate(editableMefRate(nextSalaryRate.average));
      setRateStatus("ready");
    } catch {
      setRateStatus("error");
    }
  }

  const [loanInput, setLoanInput] = useState({ principal: "10000", annualRate: "", months: "36" });
  const [vat, setVat] = useState({ amount: "100", rate: "", mode: "add" as "add" | "remove" });
  const [discount, setDiscount] = useState({ amount: "100", rate: "" });
  const [dateInput, setDateInput] = useState({ date: localIso(new Date()), days: "30", operation: "add" as "add" | "subtract" });

  const loan = useMemo(() => {
    const principal = numberOf(loanInput.principal);
    const annualRate = numberOf(loanInput.annualRate);
    const months = numberOf(loanInput.months);
    if (!(principal > 0) || !validRate(annualRate) || !Number.isInteger(months) || months < 1 || months > 600) return null;
    const monthlyRate = annualRate / 1200;
    const payment = monthlyRate === 0 ? principal / months : principal * monthlyRate / (1 - (1 + monthlyRate) ** -months);
    let balance = principal;
    const rows: LoanRow[] = [];
    for (let period = 1; period <= months; period++) {
      const interest = balance * monthlyRate;
      const principalPaid = period === months ? balance : Math.min(payment - interest, balance);
      const due = principalPaid + interest;
      balance = Math.max(0, balance - principalPaid);
      rows.push({ period, payment: due, principal: principalPaid, interest, balance });
    }
    return { payment, total: rows.reduce((sum, row) => sum + row.payment, 0), rows };
  }, [loanInput]);

  const vatResult = useMemo(() => {
    const amount = numberOf(vat.amount);
    const rate = numberOf(vat.rate);
    if (!(amount >= 0) || !validRate(rate)) return null;
    if (vat.mode === "add") return { net: amount, tax: amount * rate / 100, gross: amount * (1 + rate / 100) };
    const net = amount / (1 + rate / 100);
    return { net, tax: amount - net, gross: amount };
  }, [vat]);

  const discountResult = useMemo(() => {
    const amount = numberOf(discount.amount);
    const rate = numberOf(discount.rate);
    if (!(amount >= 0) || !validRate(rate)) return null;
    return { saved: amount * rate / 100, final: amount * (1 - rate / 100) };
  }, [discount]);

  const dateResult = useMemo(() => {
    const date = parseLocalDate(dateInput.date);
    const days = numberOf(dateInput.days);
    if (!date || !Number.isInteger(days) || days < 0 || days > 36500) return null;
    date.setDate(date.getDate() + (dateInput.operation === "add" ? days : -days));
    return date;
  }, [dateInput]);

  const salaryResult = useMemo(() => {
    const enteredGross = numberOf(salary.gross);
    const dependents = numberOf(salary.dependents);
    if (!(enteredGross > 0) || !validSalaryExchangeRate || !Number.isInteger(dependents) || dependents < 0 || dependents > 100) return null;
    const gross = enteredGross * salaryKhrPerUnit;

    const dependentAllowance = dependents * 150_000;
    const taxable = Math.max(0, gross - dependentAllowance);
    const bracket = salaryTax(taxable);
    const tax = Math.max(0, bracket.tax);
    const pensionBase = Math.min(Math.max(gross, 400_000), 1_200_000);
    const healthRiskBase = healthRiskAssumedWage(gross);
    const employeePension = pensionBase * 0.02;
    const employerPension = pensionBase * 0.02;
    const employerHealth = healthRiskBase * 0.026;
    const employerRisk = healthRiskBase * 0.008;
    const employerNssf = employerPension + employerHealth + employerRisk;
    const totalNssf = employeePension + employerNssf;

    return {
      gross,
      dependentAllowance,
      taxable,
      tax,
      marginalRate: bracket.marginalRate,
      effectiveRate: gross ? tax / gross * 100 : 0,
      pensionBase,
      healthRiskBase,
      employeePension,
      employerPension,
      employerHealth,
      employerRisk,
      employerNssf,
      totalNssf,
      netAfterTax: gross - tax,
      netAfterTaxAndPension: gross - tax - employeePension,
      employerCost: gross + employerNssf,
    };
  }, [salary, salaryKhrPerUnit, validSalaryExchangeRate]);

  const scheduleRows = loan?.rows ?? [];

  return (
    <ToolShell title="Business Calculators" khmerTitle="ម៉ាស៊ីនគណនាអាជីវកម្ម" description="Loan, VAT, discount, date, Cambodian resident salary-tax, and NSSF contribution calculations in one suite." descriptionKm="ឧបករណ៍គណនាប្រាក់កម្ចី អាករ ការបញ្ចុះតម្លៃ កាលបរិច្ឆេទ ពន្ធលើប្រាក់ខែអ្នកនិវាសនជនកម្ពុជា និងវិភាគទាន ប.ស.ស។">
      <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-[var(--ink)]">
        <strong>{text("Estimates only — verify current rules before payroll or filing.", "សម្រាប់តែការប៉ាន់ស្មាន — សូមផ្ទៀងផ្ទាត់បទប្បញ្ញត្តិបច្ចុប្បន្ន មុនធ្វើប្រាក់ខែ ឬប្រកាសពន្ធ។")}</strong>
        <p className="mt-1 text-[var(--ink-dim)]">{text("Loan, VAT, and discount rates remain user-entered. The salary tab uses KHR statutory reference tables and is limited to the stated resident-employee assumptions.", "អត្រាប្រាក់កម្ចី អាករ និងបញ្ចុះតម្លៃ នៅតែបញ្ចូលដោយអ្នកប្រើ។ ផ្ទាំងប្រាក់ខែប្រើតារាងយោងតាមច្បាប់ជាប្រាក់រៀល និងកំណត់ត្រឹមការសន្មត់សម្រាប់និយោជិតនិវាសនជនដែលបានបញ្ជាក់។")}</p>
      </div>
      <div role="tablist" aria-label={text("Calculator", "ម៉ាស៊ីនគណនា")} className="flex flex-wrap gap-2">
        {TABS.map((item) => <Button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={tab === item.id ? "" : "!bg-[var(--ground-raised)] !text-[var(--ink)] ring-1 ring-[var(--ground-line)]"}>{text(item.en, item.km)}</Button>)}
      </div>
      {tab !== "date" && tab !== "salary" && <>
      <div className={`rounded-md border p-3 text-xs leading-relaxed ${rateStatus === "error" ? "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]" : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`} role="status" aria-live="polite">
        {rateStatus === "loading" && text("Loading official MEF currency rates directly in your browser…", "កំពុងទាញយកអត្រារូបិយប័ណ្ណផ្លូវការពី កសហវ ដោយផ្ទាល់ក្នុងកម្មវិធីរុករករបស់អ្នក…")}
        {rateStatus === "ready" && text(`MEF currencies loaded${selectedRate?.validDate ? ` for ${selectedRate.validDate}` : ""}. Loan, VAT, and discount amounts use the selected display currency.`, `បានទាញយករូបិយប័ណ្ណពី កសហវ${selectedRate?.validDate ? ` សម្រាប់ថ្ងៃទី ${selectedRate.validDate}` : ""}។ ចំនួនប្រាក់កម្ចី អាករ និងបញ្ចុះតម្លៃប្រើរូបិយប័ណ្ណដែលបានជ្រើស។`)}
        {rateStatus === "error" && text("MEF rates are unavailable. KHR remains available, and a selected foreign currency can use a manually entered fallback rate; it is not an official rate.", "មិនអាចទាញយកអត្រា កសហវ បានទេ។ ប្រាក់រៀលនៅតែអាចប្រើបាន ហើយរូបិយប័ណ្ណបរទេសអាចប្រើអត្រាបញ្ចូលដោយដៃ ដែលមិនមែនជាអត្រាផ្លូវការ។")}{" "}
        <a href={MEF_EXCHANGE_SOURCE} target="_blank" rel="noreferrer" className="text-[var(--gold)] underline">{text("Official source", "ប្រភពផ្លូវការ")}</a>
      </div>
      <Row>
        <Field label="Currency" labelKm="រូបិយប័ណ្ណ"><Select value={currency} onChange={(event) => chooseCurrency(event.target.value)}><option value="KHR">KHR — Cambodian Riel</option>{!rates.some((rate) => rate.code === "USD") && <option value="USD">USD — manual fallback</option>}{rates.map((rate) => <option key={rate.code} value={rate.code}>{rate.code} — {rate.name}</option>)}</Select></Field>
        <Field label={`Rate (KHR per ${currency})`} labelKm={`អត្រា (រៀលក្នុង ១ ${currency})`} hint={currency === "KHR" ? "Fixed at 1" : selectedRate ? "Official MEF average; editable" : "Manual fallback, not official"} hintKm={currency === "KHR" ? "កំណត់ត្រឹម ១" : selectedRate ? "អត្រាមធ្យមផ្លូវការ កសហវ; អាចកែបាន" : "អត្រាបញ្ចូលដោយដៃ មិនមែនផ្លូវការ"}><TextInput value={exchangeRate} disabled={currency === "KHR"} inputMode="decimal" onChange={(event) => setExchangeRate(event.target.value)} /></Field>
      </Row>
      <Button type="button" onClick={() => void refreshRates()} disabled={rateStatus === "loading"} className="inline-flex items-center gap-2"><RefreshCw size={14} className={rateStatus === "loading" ? "animate-spin" : ""} />{text("Refresh MEF rates", "ធ្វើបច្ចុប្បន្នភាពអត្រា កសហវ")}</Button>
      </>}

      {tab === "loan" && <section role="tabpanel" className="space-y-4">
        <Row>
          <Field label="Principal" labelKm="ប្រាក់ដើម"><TextInput type="number" min="0.01" step="any" value={loanInput.principal} onChange={(event) => setLoanInput({ ...loanInput, principal: event.target.value })} /></Field>
          <Field label="Annual interest rate (%)" labelKm="អត្រាការប្រាក់ប្រចាំឆ្នាំ (%)" hint="User-entered" hintKm="បញ្ចូលដោយអ្នកប្រើ"><TextInput type="number" min="0" max="100" step="any" value={loanInput.annualRate} onChange={(event) => setLoanInput({ ...loanInput, annualRate: event.target.value })} /></Field>
        </Row>
        <Field label="Term (months)" labelKm="រយៈពេល (ខែ)" hint="1–600" hintKm="១–៦០០"><TextInput type="number" min="1" max="600" step="1" value={loanInput.months} onChange={(event) => setLoanInput({ ...loanInput, months: event.target.value })} /></Field>
        <Output label={text("Amortization estimate", "ការប៉ាន់ស្មានរំលស់")} error={!loan} value={loan ? `${text("Monthly payment", "ការទូទាត់ប្រចាំខែ")}: ${format(loan.payment)}\n${text("Total paid", "សរុបបានទូទាត់")}: ${format(loan.total)}\n${text("Total interest", "ការប្រាក់សរុប")}: ${format(loan.total - numberOf(loanInput.principal))}` : text("Enter a positive principal, a 0–100% rate, and a whole term of 1–600 months.", "បញ្ចូលប្រាក់ដើមវិជ្ជមាន អត្រា ០–១០០% និងរយៈពេលជាចំនួនខែពេញពី ១–៦០០។")} />
        {loan && <div className="max-h-[70vh] overflow-auto rounded-md border border-[var(--ground-line)]">
          <table className="w-full min-w-[38rem] text-right text-xs">
             <caption className="p-3 text-left text-[var(--ink-dim)]">{text("Full payment schedule", "កាលវិភាគទូទាត់ពេញលេញ")}</caption>
            <thead className="bg-[var(--ground-raised)] text-[var(--ink-dim)]"><tr><th className="p-2">#</th><th className="p-2">{text("Payment", "ទូទាត់")}</th><th className="p-2">{text("Principal", "ប្រាក់ដើម")}</th><th className="p-2">{text("Interest", "ការប្រាក់")}</th><th className="p-2">{text("Balance", "សមតុល្យ")}</th></tr></thead>
             <tbody>{scheduleRows.map((row) => <tr key={row.period} className="border-t border-[var(--ground-line)] text-[var(--ink)]"><td className="p-2">{row.period}</td><td className="p-2">{format(row.payment)}</td><td className="p-2">{format(row.principal)}</td><td className="p-2">{format(row.interest)}</td><td className="p-2">{format(row.balance)}</td></tr>)}</tbody>
          </table>
        </div>}
      </section>}

      {tab === "vat" && <section role="tabpanel" className="space-y-4">
        <Row>
          <Field label={vat.mode === "add" ? "Net amount" : "VAT-inclusive amount"} labelKm={vat.mode === "add" ? "ចំនួនមិនទាន់បូកអាករ" : "ចំនួនរួមអាករ"}><TextInput type="number" min="0" step="any" value={vat.amount} onChange={(event) => setVat({ ...vat, amount: event.target.value })} /></Field>
          <Field label="VAT rate (%)" labelKm="អត្រាអាករ (%)" hint="User-entered" hintKm="បញ្ចូលដោយអ្នកប្រើ"><TextInput type="number" min="0" max="100" step="any" value={vat.rate} onChange={(event) => setVat({ ...vat, rate: event.target.value })} /></Field>
        </Row>
        <Field label="Calculation" labelKm="ការគណនា"><Select value={vat.mode} onChange={(event) => setVat({ ...vat, mode: event.target.value as typeof vat.mode })}><option value="add">{text("Add VAT", "បូកអាករ")}</option><option value="remove">{text("Remove VAT", "ដកអាករ")}</option></Select></Field>
        <Output label={text("VAT estimate", "ការប៉ាន់ស្មានអាករ")} error={!vatResult} value={vatResult ? `${text("Net", "មិនរួមអាករ")}: ${format(vatResult.net)}\n${text("VAT", "អាករ")}: ${format(vatResult.tax)}\n${text("Total", "សរុប")}: ${format(vatResult.gross)}` : text("Enter a non-negative amount and a user-verified 0–100% rate.", "បញ្ចូលចំនួនមិនអវិជ្ជមាន និងអត្រា ០–១០០% ដែលអ្នកបានផ្ទៀងផ្ទាត់។")} />
      </section>}

      {tab === "discount" && <section role="tabpanel" className="space-y-4">
        <Row>
          <Field label="Original amount" labelKm="តម្លៃដើម"><TextInput type="number" min="0" step="any" value={discount.amount} onChange={(event) => setDiscount({ ...discount, amount: event.target.value })} /></Field>
          <Field label="Discount (%)" labelKm="បញ្ចុះតម្លៃ (%)"><TextInput type="number" min="0" max="100" step="any" value={discount.rate} onChange={(event) => setDiscount({ ...discount, rate: event.target.value })} /></Field>
        </Row>
        <Output label={text("Discount estimate", "ការប៉ាន់ស្មានបញ្ចុះតម្លៃ")} error={!discountResult} value={discountResult ? `${text("You save", "ចំនួនសន្សំ")}: ${format(discountResult.saved)}\n${text("Final amount", "តម្លៃចុងក្រោយ")}: ${format(discountResult.final)}` : text("Enter a non-negative amount and a 0–100% discount.", "បញ្ចូលចំនួនមិនអវិជ្ជមាន និងអត្រាបញ្ចុះតម្លៃ ០–១០០%។")} />
      </section>}

      {tab === "date" && <section role="tabpanel" className="space-y-4">
        <Row>
          <Field label="Start date" labelKm="កាលបរិច្ឆេទចាប់ផ្តើម"><TextInput type="date" value={dateInput.date} onChange={(event) => setDateInput({ ...dateInput, date: event.target.value })} /></Field>
          <Field label="Whole days" labelKm="ចំនួនថ្ងៃពេញ" hint="0–36,500" hintKm="០–៣៦,៥០០"><TextInput type="number" min="0" max="36500" step="1" value={dateInput.days} onChange={(event) => setDateInput({ ...dateInput, days: event.target.value })} /></Field>
        </Row>
        <Field label="Operation" labelKm="ប្រមាណវិធី"><Select value={dateInput.operation} onChange={(event) => setDateInput({ ...dateInput, operation: event.target.value as typeof dateInput.operation })}><option value="add">{text("Add days", "បូកថ្ងៃ")}</option><option value="subtract">{text("Subtract days", "ដកថ្ងៃ")}</option></Select></Field>
        <Output label={text("Resulting local date", "កាលបរិច្ឆេទក្នុងតំបន់ជាលទ្ធផល")} error={!dateResult} value={dateResult ? `${localIso(dateResult)}\n${new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(dateResult)}` : text("Enter a valid date and 0–36,500 whole days.", "បញ្ចូលកាលបរិច្ឆេទត្រឹមត្រូវ និងចំនួនថ្ងៃពេញពី ០–៣៦,៥០០។")} />
      </section>}

      {tab === "salary" && <section role="tabpanel" className="space-y-4">
        <div className="space-y-4 rounded-lg border border-[var(--gold-dim)] bg-[var(--gold)]/5 p-4">
          <div><h2 className="font-display text-base font-semibold text-[var(--ink)]">{text("1. Choose the salary currency", "១. ជ្រើសរើសរូបិយប័ណ្ណប្រាក់ខែ")}</h2><p className="mt-1 text-xs text-[var(--ink-dim)]">{text("Salary starts in KHR and is independent from Loan, VAT, and Discount currency. Switching currency preserves the same KHR salary instead of relabelling the number.", "ប្រាក់ខែចាប់ផ្តើមជារៀល និងដាច់ដោយឡែកពីរូបិយប័ណ្ណប្រាក់កម្ចី អាករ និងបញ្ចុះតម្លៃ។ ពេលប្តូររូបិយប័ណ្ណ ប្រព័ន្ធរក្សាតម្លៃប្រាក់ខែជារៀលដដែល មិនមែនគ្រាន់តែប្តូរស្លាកលេខទេ។")}</p></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Salary currency" labelKm="រូបិយប័ណ្ណប្រាក់ខែ"><Select value={salaryCurrency} onChange={(event) => chooseSalaryCurrency(event.target.value)}><option value="KHR">KHR — Cambodian Riel</option>{rates.map((rate) => <option key={rate.code} value={rate.code}>{rate.code} — {rate.name}</option>)}</Select></Field>
            <Field label={`Rate: KHR per 1 ${salaryCurrency}`} labelKm={`អត្រា៖ រៀលក្នុង ១ ${salaryCurrency}`} hint={salaryCurrency === "KHR" ? "Fixed at 1" : salarySelectedRate ? "MEF average; editable" : "Enter a verified rate"} hintKm={salaryCurrency === "KHR" ? "កំណត់ត្រឹម ១" : salarySelectedRate ? "អត្រាមធ្យម កសហវ; អាចកែបាន" : "បញ្ចូលអត្រាដែលបានផ្ទៀងផ្ទាត់"}><TextInput value={salaryExchangeRate} disabled={salaryCurrency === "KHR"} inputMode="decimal" onChange={(event) => setSalaryExchangeRate(event.target.value)} /></Field>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3"><p className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{text("Statutory KHR salary", "ប្រាក់ខែជារៀលសម្រាប់គណនាតាមច្បាប់")}</p><p className="mt-1 font-mono-ui text-lg font-semibold text-[var(--gold)]">{validSalaryExchangeRate && numberOf(salary.gross) > 0 ? formatKhr(numberOf(salary.gross) * salaryKhrPerUnit) : "—"}</p><p className="mt-1 text-xs text-[var(--ink-dim)]">{text("This KHR value enters every tax and NSSF formula.", "តម្លៃជារៀលនេះត្រូវបានប្រើក្នុងរូបមន្តពន្ធ និង ប.ស.ស. ទាំងអស់។")}</p></div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--ink-dim)]"><span>{rateStatus === "loading" ? text("Loading MEF rates directly in your browser…", "កំពុងទាញយកអត្រា កសហវ ដោយផ្ទាល់ក្នុងកម្មវិធីរុករក…") : rateStatus === "error" ? text("MEF rates unavailable; KHR calculations remain available.", "មិនអាចទាញយកអត្រា កសហវ; ការគណនាជារៀលនៅតែអាចប្រើបាន។") : text(`MEF rates ready${salarySelectedRate?.validDate ? ` — ${salarySelectedRate.validDate}` : ""}.`, `អត្រា កសហវ រួចរាល់${salarySelectedRate?.validDate ? ` — ${salarySelectedRate.validDate}` : ""}។`)}</span><Button type="button" onClick={() => void refreshRates()} disabled={rateStatus === "loading"} className="inline-flex items-center gap-2 !px-3 !py-1.5"><RefreshCw size={13} className={rateStatus === "loading" ? "animate-spin" : ""} />{text("Refresh rates", "ធ្វើបច្ចុប្បន្នភាពអត្រា")}</Button></div>
        </div>
        <div className="space-y-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-xs leading-relaxed text-[var(--ink-dim)]">
          <p>{text("Calculation flow: the selected salary amount is converted once to KHR, then the unchanged statutory KHR brackets, rebates, dependent allowance, and NSSF bases are applied. KHR is the default and recommended input.", "លំហូរគណនា៖ ប្រាក់ខែតាមរូបិយប័ណ្ណដែលបានជ្រើស ត្រូវបានបម្លែងទៅរៀលម្តង បន្ទាប់មកអនុវត្តកម្រិតពន្ធ ការកាត់បន្ថយ ប្រាក់អ្នកក្នុងបន្ទុក និងមូលដ្ឋាន ប.ស.ស. ជារៀលដដែល។ ប្រាក់រៀលជាជម្រើសលំនាំដើម និងត្រូវបានណែនាំ។")}</p>
          <p>{text("Salary tax: resident employee, monthly KHR salary, Sub-Decree 196 thresholds applied from January 2023, with KHR 150,000 per eligible dependent. Benefits, fringe-benefit tax, non-resident tax, and other adjustments are outside this calculator.", "ពន្ធលើប្រាក់ខែ៖ សម្រាប់និយោជិតនិវាសនជន ប្រាក់ខែប្រចាំខែជារៀល តាមកម្រិតនៃអនុក្រឹត្យលេខ ១៩៦ ដែលអនុវត្តពីខែមករា ឆ្នាំ២០២៣ និងការកាត់បន្ថយ ១៥០,០០០ រៀល ក្នុងមួយអ្នកក្នុងបន្ទុកដែលមានសិទ្ធិ។ មិនរាប់បញ្ចូលអត្ថប្រយោជន៍ ពន្ធលើអត្ថប្រយោជន៍បន្ថែម ពន្ធអនិវាសនជន និងការកែតម្រូវផ្សេងៗ។")}</p>
          <p>{text("NSSF: first-phase pension is 2% employee + 2% employer on a KHR 400,000–1,200,000 base. Prakas 449 health (2.6%) and occupational risk (0.8%) use its separate assumed-wage bands from KHR 200,000 to 1,200,000.", "ប.ស.ស.៖ សោធនដំណាក់កាលទី១ គឺនិយោជិត ២% + និយោជក ២% លើមូលដ្ឋាន ៤០០,០០០–១,២០០,០០០ រៀល។ ផ្នែកថែទាំសុខភាព ២.៦% និងហានិភ័យការងារ ០.៨% តាមប្រកាសលេខ ៤៤៩ ប្រើតារាងប្រាក់ឈ្នួលសន្មត់ដាច់ដោយឡែកពី ២០០,០០០ ដល់ ១,២០០,០០០ រៀល។")}</p>
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            <a className="text-[var(--gold)] underline" href="https://taxsummaries.pwc.com/cambodia/individual/taxes-on-personal-income" target="_blank" rel="noreferrer">{text("Current salary-tax summary", "សេចក្តីសង្ខេបពន្ធលើប្រាក់ខែ")}</a>
            <a className="text-[var(--gold)] underline" href="https://www.pwc.com/kh/en/publications/newsbrief/kh-newsbrief-october-2022.pdf" target="_blank" rel="noreferrer">{text("Sub-Decree 196 implementation note", "សេចក្តីពន្យល់អនុវត្តអនុក្រឹត្យលេខ ១៩៦")}</a>
            <a className="text-[var(--gold)] underline" href="https://www.nssf.gov.kh/wp-content/uploads/2023/02/10.-prkas-449.pdf" target="_blank" rel="noreferrer">{text("NSSF Prakas 449", "ប្រកាស ប.ស.ស. លេខ ៤៤៩")}</a>
            <a className="text-[var(--gold)] underline" href="https://www.ssa.gov/policy/docs/progdesc/intl_update/2022-09/index.html" target="_blank" rel="noreferrer">{text("Pension phase reference", "យោងដំណាក់កាលសោធន")}</a>
          </p>
        </div>
        <Row>
          <Field label={`2. Gross monthly salary (${salaryCurrency})`} labelKm={`២. ប្រាក់ខែសរុបប្រចាំខែ (${salaryCurrency})`} hint={salaryCurrency === "KHR" ? "Enter the salary in riel" : `Enter the salary in ${salaryCurrency}; the KHR equivalent is shown above`} hintKm={salaryCurrency === "KHR" ? "បញ្ចូលប្រាក់ខែជារៀល" : `បញ្ចូលប្រាក់ខែជា ${salaryCurrency}; តម្លៃស្មើជារៀលបង្ហាញខាងលើ`}><TextInput type="number" min="0.01" step="any" value={salary.gross} onChange={(event) => setSalary({ ...salary, gross: event.target.value })} /></Field>
          <Field label="Eligible dependents" labelKm="អ្នកក្នុងបន្ទុកដែលមានសិទ្ធិ" hint="Whole number, 0–100" hintKm="ចំនួនគត់ ០–១០០"><TextInput type="number" min="0" max="100" step="1" value={salary.dependents} onChange={(event) => setSalary({ ...salary, dependents: event.target.value })} /></Field>
        </Row>
        <Output
          label={text("Cambodian resident salary tax", "ពន្ធលើប្រាក់ខែនិវាសនជនកម្ពុជា")}
          error={!salaryResult}
          value={salaryResult ? `${text("Gross salary", "ប្រាក់ខែសរុប")}: ${formatSalary(salaryResult.gross)}\n${text("Dependent allowance", "ការកាត់បន្ថយអ្នកក្នុងបន្ទុក")}: ${formatKhr(salaryResult.dependentAllowance)}\n${text("Taxable salary", "ប្រាក់ខែជាប់ពន្ធ")}: ${formatKhr(salaryResult.taxable)}\n${text("Marginal rate", "អត្រាកម្រិតខ្ពស់បំផុត")}: ${salaryResult.marginalRate}%\n${text("Salary tax", "ពន្ធលើប្រាក់ខែ")}: ${formatKhr(salaryResult.tax)}\n${text("Effective rate on gross", "អត្រាជាក់ស្តែងលើប្រាក់ខែសរុប")}: ${salaryResult.effectiveRate.toFixed(2)}%\n${text("Net after salary tax", "ប្រាក់សុទ្ធក្រោយពន្ធលើប្រាក់ខែ")}: ${formatSalary(salaryResult.netAfterTax)}` : text("Enter a positive salary amount in the selected currency, a valid exchange rate when needed, and 0–100 eligible dependents.", "បញ្ចូលប្រាក់ខែវិជ្ជមានតាមរូបិយប័ណ្ណដែលបានជ្រើស អត្រាប្តូរប្រាក់ត្រឹមត្រូវនៅពេលចាំបាច់ និងអ្នកក្នុងបន្ទុកដែលមានសិទ្ធិពី ០–១០០ នាក់។")}
        />
        <Output
          label={text("NSSF contribution breakdown", "បំណែងចែកវិភាគទាន ប.ស.ស.")}
          error={!salaryResult}
          value={salaryResult ? `${text("Pension contribution base", "មូលដ្ឋានវិភាគទានសោធន")}: ${formatKhr(salaryResult.pensionBase)}\n${text("Health/risk assumed wage", "ប្រាក់ឈ្នួលសន្មត់សុខភាព/ហានិភ័យ")}: ${formatKhr(salaryResult.healthRiskBase)}\n${text("Employee pension (2%)", "សោធននិយោជិត (២%)")}: ${formatKhr(salaryResult.employeePension)}\n${text("Employer pension (2%)", "សោធននិយោជក (២%)")}: ${formatKhr(salaryResult.employerPension)}\n${text("Employer health (2.6%)", "ថែទាំសុខភាពនិយោជក (២.៦%)")}: ${formatKhr(salaryResult.employerHealth)}\n${text("Employer occupational risk (0.8%)", "ហានិភ័យការងារនិយោជក (០.៨%)")}: ${formatKhr(salaryResult.employerRisk)}\n${text("Employer NSSF subtotal", "វិភាគទាន ប.ស.ស. សរុបរបស់និយោជក")}: ${formatKhr(salaryResult.employerNssf)}\n${text("Combined NSSF total", "វិភាគទាន ប.ស.ស. សរុបរួម")}: ${formatKhr(salaryResult.totalNssf)}\n${text("Net after salary tax + employee pension", "ប្រាក់សុទ្ធក្រោយពន្ធ + សោធននិយោជិត")}: ${formatSalary(salaryResult.netAfterTaxAndPension)}\n${text("Employer cost including NSSF", "ចំណាយនិយោជករួម ប.ស.ស.")}: ${formatKhr(salaryResult.employerCost)}` : text("Enter valid salary inputs above.", "សូមបញ្ចូលទិន្នន័យប្រាក់ខែត្រឹមត្រូវខាងលើ។")}
        />
      </section>}
    </ToolShell>
  );
}
