"use client";

// Loan Amortization Schedule — month-by-month principal/interest breakdown for
// a loan, using either the reducing-balance (standard amortizing) or flat
// method. All figures are user-entered; nothing about any lender's real rates
// is assumed. Fully client-side.

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { ToolShell, Field, TextInput, Select } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";
import { recordExport } from "@/lib/export";

type Method = "reducing" | "flat";

interface Row { period: number; date: string; payment: number; principal: number; interest: number; balance: number }

function buildSchedule(principal: number, annualRatePct: number, months: number, method: Method, startISO: string): { rows: Row[]; monthly: number; totalInterest: number; totalPaid: number } {
  const rows: Row[] = [];
  const start = startISO ? new Date(startISO) : null;
  const dateFor = (i: number) => {
    if (!start || Number.isNaN(start.getTime())) return "";
    const d = new Date(start.getFullYear(), start.getMonth() + i, start.getDate());
    return d.toISOString().slice(0, 10);
  };
  if (principal <= 0 || months <= 0) return { rows, monthly: 0, totalInterest: 0, totalPaid: 0 };

  if (method === "flat") {
    const totalInterest = principal * (annualRatePct / 100) * (months / 12);
    const principalPart = principal / months;
    const interestPart = totalInterest / months;
    const monthly = principalPart + interestPart;
    let balance = principal;
    for (let i = 1; i <= months; i++) {
      balance -= principalPart;
      rows.push({ period: i, date: dateFor(i - 1), payment: monthly, principal: principalPart, interest: interestPart, balance: Math.max(0, balance) });
    }
    return { rows, monthly, totalInterest, totalPaid: principal + totalInterest };
  }

  const r = annualRatePct / 100 / 12;
  const monthly = r === 0 ? principal / months : (principal * r) / (1 - Math.pow(1 + r, -months));
  let balance = principal;
  let totalInterest = 0;
  for (let i = 1; i <= months; i++) {
    const interest = balance * r;
    let principalPart = monthly - interest;
    if (i === months) principalPart = balance; // absorb rounding on the final payment
    balance = Math.max(0, balance - principalPart);
    totalInterest += interest;
    rows.push({ period: i, date: dateFor(i - 1), payment: principalPart + interest, principal: principalPart, interest, balance });
  }
  return { rows, monthly, totalInterest, totalPaid: principal + totalInterest };
}

export default function LoanAmortization() {
  const { text: t } = useLanguage();
  const [principal, setPrincipal] = useState("10000");
  const [rate, setRate] = useState("12");
  const [termValue, setTermValue] = useState("24");
  const [termUnit, setTermUnit] = useState<"months" | "years">("months");
  const [method, setMethod] = useState<Method>("reducing");
  const [currency, setCurrency] = useState("USD");
  const [startDate, setStartDate] = useState("");

  const months = termUnit === "years" ? Math.round((Number(termValue) || 0) * 12) : Math.round(Number(termValue) || 0);
  const schedule = useMemo(
    () => buildSchedule(Number(principal.replace(/,/g, "")) || 0, Number(rate) || 0, months, method, startDate),
    [principal, rate, months, method, startDate],
  );

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: currency === "KHR" ? 0 : 2, maximumFractionDigits: currency === "KHR" ? 0 : 2 });
  const cur = (n: number) => (currency === "KHR" ? `${fmt(n)} ៛` : `$${fmt(n)}`);

  const exportCsv = () => {
    const header = ["Period", "Date", "Payment", "Principal", "Interest", "Balance"];
    const lines = [header.join(",")].concat(
      schedule.rows.map((r) => [r.period, r.date, r.payment.toFixed(2), r.principal.toFixed(2), r.interest.toFixed(2), r.balance.toFixed(2)].join(",")),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "amortization-schedule.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    recordExport();
  };

  return (
    <ToolShell
      title="Loan Amortization Schedule"
      khmerTitle="តារាងសងប្រាក់កម្ចី"
      description="See a month-by-month breakdown of principal and interest for a loan — reducing-balance (standard amortizing) or flat method — with the monthly payment, total interest, and a downloadable CSV. All figures are yours; no lender rates are assumed."
      descriptionKm="មើលការបំបែកប្រាក់ដើម និងការប្រាក់ជារៀងរាល់ខែសម្រាប់ប្រាក់កម្ចី — វិធីបញ្ចុះសមតុល្យ (ស្តង់ដារ) ឬវិធីថេរ — ជាមួយការបង់ប្រចាំខែ ការប្រាក់សរុប និង CSV ទាញយកបាន។ តួលេខជារបស់អ្នក; គ្មានការសន្មតអត្រាកម្ចីណាមួយ។"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t("Loan amount", "ចំនួនកម្ចី")}><TextInput value={principal} inputMode="decimal" onChange={(e) => setPrincipal(e.target.value)} /></Field>
          <Field label={t("Annual interest rate (%)", "អត្រាការប្រាក់ប្រចាំឆ្នាំ (%)")}><TextInput value={rate} inputMode="decimal" onChange={(e) => setRate(e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label={t("Term", "រយៈពេល")}><TextInput value={termValue} inputMode="numeric" onChange={(e) => setTermValue(e.target.value)} /></Field>
            <Field label={t("Unit", "ឯកតា")}>
              <Select value={termUnit} onChange={(e) => setTermUnit(e.target.value as "months" | "years")}>
                <option value="months">{t("months", "ខែ")}</option>
                <option value="years">{t("years", "ឆ្នាំ")}</option>
              </Select>
            </Field>
          </div>
          <Field label={t("Method", "វិធីសាស្ត្រ")}>
            <Select value={method} onChange={(e) => setMethod(e.target.value as Method)}>
              <option value="reducing">{t("Reducing balance", "បញ្ចុះសមតុល្យ")}</option>
              <option value="flat">{t("Flat rate", "អត្រាថេរ")}</option>
            </Select>
          </Field>
          <Field label={t("Currency", "រូបិយប័ណ្ណ")}>
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="USD">USD ($)</option>
              <option value="KHR">KHR (៛)</option>
            </Select>
          </Field>
          <Field label={t("First payment date (optional)", "កាលបរិច្ឆេទបង់ដំបូង (ស្រេចចិត្ត)")}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { en: "Monthly payment", km: "បង់ប្រចាំខែ", v: cur(schedule.monthly), accent: true },
            { en: "Payments", km: "ចំនួនដង", v: `${schedule.rows.length}` },
            { en: "Total interest", km: "ការប្រាក់សរុប", v: cur(schedule.totalInterest) },
            { en: "Total paid", km: "សរុបត្រូវបង់", v: cur(schedule.totalPaid) },
          ].map((s) => (
            <div key={s.en} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <div className="text-[11px] text-[var(--ink-faint)]">{t(s.en, s.km)}</div>
              <div className={`mt-1 font-mono-ui text-lg font-bold ${s.accent ? "text-[var(--gold)]" : "text-[var(--ink)]"}`}>{s.v}</div>
            </div>
          ))}
        </div>

        {method === "flat" && (
          <p className="text-[11px] text-[var(--ink-faint)]">{t("Flat-rate interest is charged on the original amount for the whole term — the effective (reducing-balance) rate is higher. Compare both methods before deciding.", "ការប្រាក់អត្រាថេរគិតលើប្រាក់ដើមពេញរយៈពេល — អត្រាពិត (បញ្ចុះសមតុល្យ) ខ្ពស់ជាង។ សូមប្រៀបធៀបវិធីទាំងពីរមុននឹងសម្រេច។")}</p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">{t("Schedule", "តារាង")}</span>
          <button onClick={exportCsv} disabled={schedule.rows.length === 0} className="inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40"><Download size={13} />{t("Download CSV", "ទាញយក CSV")}</button>
        </div>

        <div className="max-h-[460px] overflow-auto rounded-xl border border-[var(--ground-line)]">
          <table className="w-full border-collapse text-right font-mono-ui text-[13px]">
            <thead className="sticky top-0 bg-[var(--ground-raised-hi)] text-[var(--ink-dim)]">
              <tr>
                <th className="px-3 py-2 text-left font-medium">#</th>
                {startDate && <th className="px-3 py-2 text-left font-medium">{t("Date", "កាលបរិច្ឆេទ")}</th>}
                <th className="px-3 py-2 font-medium">{t("Payment", "បង់")}</th>
                <th className="px-3 py-2 font-medium">{t("Principal", "ប្រាក់ដើម")}</th>
                <th className="px-3 py-2 font-medium">{t("Interest", "ការប្រាក់")}</th>
                <th className="px-3 py-2 font-medium">{t("Balance", "សមតុល្យ")}</th>
              </tr>
            </thead>
            <tbody>
              {schedule.rows.map((r) => (
                <tr key={r.period} className="border-t border-[var(--ground-line)] text-[var(--ink)]">
                  <td className="px-3 py-1.5 text-left text-[var(--ink-dim)]">{r.period}</td>
                  {startDate && <td className="px-3 py-1.5 text-left text-[var(--ink-dim)]">{r.date}</td>}
                  <td className="px-3 py-1.5">{fmt(r.payment)}</td>
                  <td className="px-3 py-1.5">{fmt(r.principal)}</td>
                  <td className="px-3 py-1.5 text-[var(--ink-dim)]">{fmt(r.interest)}</td>
                  <td className="px-3 py-1.5">{fmt(r.balance)}</td>
                </tr>
              ))}
              {schedule.rows.length === 0 && (
                <tr><td colSpan={startDate ? 6 : 5} className="px-3 py-10 text-center text-[var(--ink-faint)]">{t("Enter a loan amount and term.", "សូមបញ្ចូលចំនួនកម្ចី និងរយៈពេល។")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ToolShell>
  );
}
