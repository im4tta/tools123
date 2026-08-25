"use client";
import { useMemo } from "react";
import { Users, Info } from "lucide-react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// NSSF (National Social Security Fund) contribution percentages — the DEFAULT
// values are SAMPLE placeholders only, not official. Edit them before use.
interface RateSet { label: string; labelKm: string; employee: number; employer: number }
const DEFAULT_RATES: RateSet[] = [
  { label: "Pension (sample)", labelKm: "សោធន (គំរូ)", employee: 2, employer: 4 },
  { label: "Health (sample)", labelKm: "សុខភាព (គំរូ)", employee: 0, employer: 2.6 },
  { label: "Occupational risk (sample)", labelKm: "ហានិភ័យការងារ (គំរូ)", employee: 0, employer: 1 },
  { label: "Unemployment (sample)", labelKm: "គ្មានការងារធ្វើ (គំរូ)", employee: 0.75, employer: 0.75 },
];

function toNum(v: string) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function khr(n: number) { return `${Math.round(n).toLocaleString("en-US")} ៛`; }
function usd(n: number) { return `$${n.toFixed(2)}`; }

export default function NssfPayrollCalculator() {
  const { text: t } = useLanguage();
  const [salary, setSalary] = useToolState("nssf:salary", "500");
  const [count, setCount] = useToolState("nssf:count", "1");
  const [ceiling, setCeiling] = useToolState("nssf:ceiling", "12000");
  const [exchange, setExchange] = useToolState("nssf:exchange", "4100");
  const [rates, setRates] = useToolState<RateSet[]>("nssf:rates", DEFAULT_RATES);

  const monthly = toNum(salary);
  const n = Math.max(1, Math.round(toNum(count)) || 1);
  const cap = toNum(ceiling);
  const ex = toNum(exchange) || 1;

  const result = useMemo(() => {
    const base = Math.max(0, monthly);
    const cappedBase = cap > 0 ? Math.min(base, cap) : base; // NSSF contribution ceiling
    let empKhr = 0, erKhr = 0;
    for (const r of rates) {
      empKhr += cappedBase * (toNum(String(r.employee)) / 100);
      erKhr += cappedBase * (toNum(String(r.employer)) / 100);
    }
    const perEmp = { empKhr, erKhr, totalKhr: empKhr + erKhr };
    return {
      base,
      cappedBase,
      perEmp,
      all: { empKhr: empKhr * n, erKhr: erKhr * n, totalKhr: (empKhr + erKhr) * n },
    };
  }, [monthly, cap, rates, n]);

  function setRate(i: number, field: "employee" | "employer", v: string) {
    setRates((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: toNum(v) } : r)));
  }

  const empUsd = result.perEmp.empKhr / ex;
  const erUsd = result.perEmp.erKhr / ex;

  return (
    <ToolShell
      title="NSSF Payroll Calculator"
      khmerTitle="គណនាការរួមចំណែក NSSF"
      description="Estimate NSSF (National Social Security Fund) contributions — employee and employer shares — using editable percentages. The default percentages are sample placeholders; replace them with the current official rates."
      descriptionKm="ប៉ាន់ស្មានការរួមចំណែកមូលនិធិសន្តិសុខសង្គម (NSSF) — ចំណែកបុគ្គលិក និងនិយោជក — ដោយប្រើភាគរយដែលអាចកែបាន។ តម្លៃលំនាំដើមគឺជាគំរូ សូមជំនួសដោយអត្រាផ្លូវការបច្ចុប្បន្ន។"
    >
      <Row>
        <Field label={t("Base salary (USD)", "ប្រាក់ខែមូលដ្ឋាន (ដុល្លារ)")}>
          <TextInput type="number" min="0" step="10" value={salary} onChange={(e) => setSalary(e.target.value)} />
        </Field>
        <Field label={t("Number of employees", "ចំនួនបុគ្គលិក")}>
          <TextInput type="number" min="1" step="1" value={count} onChange={(e) => setCount(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label={t("Salary ceiling (USD, 0 = none)", "ដែនកំណត់ប្រាក់ខែ (ដុល្លារ, 0 = គ្មាន)")}>
          <TextInput type="number" min="0" step="100" value={ceiling} onChange={(e) => setCeiling(e.target.value)} />
        </Field>
        <Field label={t("Exchange rate", "អត្រាប្តូរប្រាក់")} hint={`$1 = ${Math.round(ex).toLocaleString("en-US")} ៛`}>
          <TextInput type="number" min="1" step="1" value={exchange} onChange={(e) => setExchange(e.target.value)} />
        </Field>
      </Row>

      <div className="space-y-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{t("Contribution rates (%) — sample, editable", "អត្រារួមចំណែក (%) — គំរូ អាចកែបាន")}</div>
        </div>
        {rates.map((r, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
            <span className="min-w-32 flex-1 text-[var(--ink)]">{t(r.label, r.labelKm)}</span>
            <label className="flex items-center gap-1">
              <span className="text-[var(--ink-faint)]">{t("Employee", "បុគ្គលិក")}</span>
              <TextInput type="number" min="0" step="0.1" value={String(r.employee)} onChange={(e) => setRate(i, "employee", e.target.value)} className="w-20" />
            </label>
            <label className="flex items-center gap-1">
              <span className="text-[var(--ink-faint)]">{t("Employer", "និយោជក")}</span>
              <TextInput type="number" min="0" step="0.1" value={String(r.employer)} onChange={(e) => setRate(i, "employer", e.target.value)} className="w-20" />
            </label>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{t("Employee share", "ចំណែកបុគ្គលិក")}</div>
          <div className="mt-1 text-xl font-bold text-[var(--ink)]">{khr(result.perEmp.empKhr)}</div>
          <div className="text-[11px] text-[var(--ink-faint)]">{usd(empUsd)} / {t("person·mo", "នាក់·ខែ")}</div>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{t("Employer share", "ចំណែកនិយោជក")}</div>
          <div className="mt-1 text-xl font-bold text-[var(--ink)]">{khr(result.perEmp.erKhr)}</div>
          <div className="text-[11px] text-[var(--ink-faint)]">{usd(erUsd)} / {t("person·mo", "នាក់·ខែ")}</div>
        </div>
        <div className="rounded-md border border-[var(--success)]/40 bg-[var(--success)]/10 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--success)]">{t("Total (both)", "សរុប (ទាំងពីរ)")}</div>
          <div className="mt-1 text-xl font-bold text-[var(--success)]">{khr(result.perEmp.totalKhr)}</div>
          <div className="text-[11px] font-semibold text-[var(--success)]">{usd(empUsd + erUsd)} / {t("person·mo", "នាក់·ខែ")}</div>
        </div>
      </div>

      {n > 1 && (
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <Users size={15} className="text-[var(--gold)]" />
            {t("Payroll total", "សរុបការបើកខែវិញ្ញាណ")} · {n} {t("employees", "នាក់")}
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div>{t("Employee", "បុគ្គលិក")}: <b>{khr(result.all.empKhr)}</b></div>
            <div>{t("Employer", "និយោជក")}: <b>{khr(result.all.erKhr)}</b></div>
            <div>{t("Total", "សរុប")}: <b className="text-[var(--success)]">{khr(result.all.totalKhr)}</b></div>
          </div>
          <p className="mt-1 text-xs text-[var(--ink-faint)]">≈ ${(result.all.totalKhr / ex).toFixed(2)} USD / {t("month", "ខែ")}</p>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <Info size={14} className="mt-0.5 shrink-0 text-[var(--gold)]" />
        <span>
          {t("The contribution percentages shown are sample placeholders only, not official NSSF values. Replace them with the current rates from the official NSSF schedule before relying on the numbers. The salary ceiling is also editable.", "ភាគរយរួមចំណែកដែលបង្ហាញគឺជាគំរូតែប៉ុណ្ណោះ មិនមែនជាតម្លៃផ្លូវការរបស់ NSSF ទេ។ សូមជំនួសដោយអត្រាបច្ចុប្បន្នពីកាលវិភាគផ្លូវការ NSSF មុនពេលពឹងផ្អែក។ ដែនកំណត់ប្រាក់ខែក៏អាចកែបានដែរ។")}
        </span>
      </div>
    </ToolShell>
  );
}
