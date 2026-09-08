"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { CopyButton } from "@/components/CopyButton";
import { Field, Select, TextInput, ToolShell } from "@/components/ui/Shell";

// Deterministic contract-time arithmetic (calendar days):
//   totalDuration   = max(0, durationDays + eotDays)
//   completionDate  = startDate + totalDuration
//   elapsedDays     = round((cutoff − start) / dayMs)   [standard]
//                     or that + 1                        [inclusive]
//   remainingDays   = max(0, totalDuration − elapsedDays)
//   elapsedPercent  = elapsedDays / totalDuration × 100
// Month-by-month counting is standard (start day excluded, cut-off day
// included) so the ledger sums back to the standard elapsed figure.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const BLANK = {
  startDate: "",
  cutoffDate: "",
  durationDays: "",
  eotDays: "",
  acceptanceDate: "",
  contractAmount: "",
  countingMode: "standard" as "standard" | "inclusive",
};

// Editable sample values only — NOT an official or real contract.
const SAMPLE = {
  startDate: "2026-02-01",
  cutoffDate: "2026-08-31",
  durationDays: "600",
  eotDays: "0",
  acceptanceDate: "2026-01-15",
  contractAmount: "8830491.60",
  countingMode: "standard" as const,
};

/** Parses a YYYY-MM-DD string as a local date, avoiding timezone shift. */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date: Date | null): string | null {
  if (!date || Number.isNaN(date.getTime())) return null;
  const day = String(date.getDate()).padStart(2, "0");
  return `${day} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function isoDate(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return "—";
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

interface LedgerRow {
  monthYear: string;
  daysInMonth: number;
  countedDays: number;
  cumulativeDays: number;
}

export default function ContractTimeProgressCalculator() {
  const { text } = useLanguage();
  const [data, setData] = useState(BLANK);

  const set = <K extends keyof typeof BLANK>(key: K, value: (typeof BLANK)[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const setTodayCutoff = () => {
    const t = new Date();
    const m = String(t.getMonth() + 1).padStart(2, "0");
    const d = String(t.getDate()).padStart(2, "0");
    set("cutoffDate", `${t.getFullYear()}-${m}-${d}`);
  };

  const calc = useMemo(() => {
    const start = parseDate(data.startDate);
    const cutoff = parseDate(data.cutoffDate);
    const durationNum = data.durationDays === "" ? null : Number(data.durationDays);
    const eotNum = data.eotDays === "" ? 0 : Number(data.eotDays);

    const hasStart = Boolean(start);
    const hasCutoff = Boolean(cutoff);
    const hasDuration = durationNum !== null && Number.isFinite(durationNum);

    const totalDuration = hasDuration ? Math.max(0, (durationNum as number) + (Number.isFinite(eotNum) ? eotNum : 0)) : null;

    let completionDate: Date | null = null;
    if (start && totalDuration !== null) {
      completionDate = new Date(start);
      completionDate.setDate(completionDate.getDate() + totalDuration);
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    let elapsedDays: number | null = null;
    if (start && cutoff) {
      const diff = Math.round((cutoff.getTime() - start.getTime()) / msPerDay);
      elapsedDays = data.countingMode === "inclusive" ? Math.max(0, diff + 1) : diff;
    }

    let remainingDays: number | null = null;
    let elapsedPercent: number | null = null;
    if (totalDuration !== null && elapsedDays !== null) {
      remainingDays = Math.max(0, totalDuration - elapsedDays);
      elapsedPercent = totalDuration > 0 ? (elapsedDays / totalDuration) * 100 : 0;
    }

    const totalMonths = totalDuration !== null ? (totalDuration / 30.4375).toFixed(1) : null;

    const ledger: LedgerRow[] = [];
    if (start && cutoff && start <= cutoff) {
      let cur = new Date(start.getFullYear(), start.getMonth(), 1);
      const end = new Date(cutoff.getFullYear(), cutoff.getMonth(), 1);
      let cumulative = 0;
      while (cur <= end) {
        const y = cur.getFullYear();
        const m = cur.getMonth();
        const daysInM = new Date(y, m + 1, 0).getDate();
        const isStartMonth = y === start.getFullYear() && m === start.getMonth();
        const isCutoffMonth = y === cutoff.getFullYear() && m === cutoff.getMonth();
        const counted = isStartMonth
          ? daysInM - start.getDate()
          : isCutoffMonth
            ? cutoff.getDate()
            : daysInM;
        cumulative += counted;
        ledger.push({ monthYear: `${MONTHS[m]} ${y}`, daysInMonth: daysInM, countedDays: counted, cumulativeDays: cumulative });
        cur = new Date(y, m + 1, 1);
      }
    }

    return {
      hasStart, hasCutoff, hasDuration,
      totalDuration, completionDate, elapsedDays, remainingDays,
      elapsedPercent: elapsedPercent !== null ? Math.min(100, Math.max(0, elapsedPercent)) : null,
      totalMonths, ledger,
    };
  }, [data]);

  const formattedAmount = data.contractAmount
    ? `US$ ${Number(data.contractAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : "—";

  const contractRows: [string, string][] = [
    [text("Contract Amount", "តម្លៃកិច្ចសន្យា"), formattedAmount],
    [text("Date of Letter of Acceptance", "កាលបរិច្ឆេទនៃលិខិតទទួលយក"), formatDate(parseDate(data.acceptanceDate)) ?? "—"],
    [text("Start Date", "កាលបរិច្ឆេទចាប់ផ្តើម"), formatDate(parseDate(data.startDate)) ?? "—"],
    [
      text("Expected Completion Date", "កាលបរិច្ឆេទបញ្ចប់រំពឹងទុក"),
      calc.completionDate ? `${formatDate(calc.completionDate)} (${calc.totalMonths} ${text("months from Start Date", "ខែ គិតពីកាលបរិច្ឆេទចាប់ផ្តើម")})` : "—",
    ],
    [text("Duration", "រយៈពេល"), calc.totalDuration !== null ? `${calc.totalDuration} ${text("Days", "ថ្ងៃ")}` : "—"],
    [text("Time Elapsed", "ពេលកន្លងផុត"), calc.elapsedDays !== null ? `${calc.elapsedDays} ${text("Days", "ថ្ងៃ")}` : "—"],
    [text("Time Remaining", "ពេលនៅសល់"), calc.remainingDays !== null ? `${calc.remainingDays} ${text("Days", "ថ្ងៃ")}` : "—"],
  ];
  const contractTsv = contractRows.map((r) => r.join("\t")).join("\n");

  const cardClass = "rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4";
  const cellHead = "border-r border-[var(--ground-line)] bg-[var(--ground-raised-hi)] p-3 text-left align-top font-medium text-[var(--ink-dim)]";
  const cell = "p-3 align-top text-[var(--ink)]";

  return (
    <ToolShell
      title="Contract Time Progress Calculator"
      khmerTitle="ម៉ាស៊ីនគណនាវឌ្ឍនភាពពេលវេលាកិច្ចសន្យា"
      description="Track elapsed time, remaining time, and the expected completion date of a construction contract from your own start date, duration, and reporting cut-off."
      descriptionKm="តាមដានពេលកន្លងផុត ពេលនៅសល់ និងកាលបរិច្ឆេទបញ្ចប់រំពឹងទុកនៃកិច្ចសន្យាសំណង់ ដោយផ្អែកលើកាលបរិច្ឆេទចាប់ផ្តើម រយៈពេល និងកាលកំណត់រាយការណ៍ផ្ទាល់ខ្លួនរបស់អ្នក។"
    >
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setData(SAMPLE)}
          className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)]"
        >
          {text("Fill sample", "បំពេញគំរូ")}
        </button>
        <button
          type="button"
          onClick={() => setData(BLANK)}
          className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)]"
        >
          {text("Reset", "កំណត់ឡើងវិញ")}
        </button>
      </div>

      {/* Date parameters */}
      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <h2 className="font-medium text-[var(--ink)]">{text("Date parameters", "ប៉ារ៉ាម៉ែត្រកាលបរិច្ឆេទ")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Start date (commencement)" labelKm="កាលបរិច្ឆេទចាប់ផ្តើម (ចាប់ផ្តើមការងារ)">
            <TextInput type="date" value={data.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </Field>
          <Field label="Reporting cut-off date" labelKm="កាលបរិច្ឆេទកំណត់រាយការណ៍">
            <TextInput type="date" value={data.cutoffDate} onChange={(e) => set("cutoffDate", e.target.value)} />
          </Field>
          <Field label="Duration (days)" labelKm="រយៈពេល (ថ្ងៃ)">
            <TextInput type="number" min="0" placeholder="e.g. 600" value={data.durationDays} onChange={(e) => set("durationDays", e.target.value)} />
          </Field>
          <Field label="Extension of time — EOT (days)" labelKm="ការបន្ថែមពេលវេលា — EOT (ថ្ងៃ)">
            <TextInput type="number" placeholder="0" value={data.eotDays} onChange={(e) => set("eotDays", e.target.value)} />
          </Field>
          <Field label="Counting rule" labelKm="ក្បួនរាប់">
            <Select value={data.countingMode} onChange={(e) => set("countingMode", e.target.value as typeof BLANK.countingMode)}>
              <option value="standard">{text("Standard (cut-off − start)", "ស្តង់ដារ (កំណត់ − ចាប់ផ្តើម)")}</option>
              <option value="inclusive">{text("Inclusive (+1 day)", "រាប់បញ្ចូល (+១ ថ្ងៃ)")}</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={setTodayCutoff}
              className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)]"
            >
              {text("Set cut-off to today", "កំណត់ថ្ងៃកំណត់ជាថ្ងៃនេះ")}
            </button>
          </div>
        </div>
      </section>

      {/* Optional document details */}
      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <h2 className="font-medium text-[var(--ink)]">{text("Optional document details", "ព័ត៌មានលម្អិតឯកសារ (ស្រេចចិត្ត)")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date of letter of acceptance" labelKm="កាលបរិច្ឆេទនៃលិខិតទទួលយក">
            <TextInput type="date" value={data.acceptanceDate} onChange={(e) => set("acceptanceDate", e.target.value)} />
          </Field>
          <Field label="Contract amount (US$)" labelKm="តម្លៃកិច្ចសន្យា (US$)">
            <TextInput type="number" step="0.01" min="0" placeholder="e.g. 8830491.60" value={data.contractAmount} onChange={(e) => set("contractAmount", e.target.value)} />
          </Field>
        </div>
      </section>

      {!data.startDate && (
        <p role="status" className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
          {text("Add a start date and duration to calculate contract progress.", "សូមបញ្ចូលកាលបរិច្ឆេទចាប់ផ្តើម និងរយៈពេល ដើម្បីគណនាវឌ្ឍនភាពកិច្ចសន្យា។")}
        </p>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className={`${cardClass} sm:col-span-2`}>
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
            {text("Expected completion date", "កាលបរិច្ឆេទបញ្ចប់រំពឹងទុក")}
          </div>
          <div className="mt-1 text-xl font-semibold text-[var(--ink)]">
            {calc.completionDate ? formatDate(calc.completionDate) : "—"}
          </div>
          <div className="mt-1 text-xs text-[var(--ink-dim)]">
            {calc.totalDuration !== null
              ? `${calc.totalDuration} ${text("days", "ថ្ងៃ")} (${calc.totalMonths} ${text("months from start date", "ខែ គិតពីកាលបរិច្ឆេទចាប់ផ្តើម")})`
              : text("Awaiting start date and duration", "កំពុងរង់ចាំកាលបរិច្ឆេទចាប់ផ្តើម និងរយៈពេល")}
          </div>
        </div>
        <div className={cardClass}>
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{text("Time elapsed", "ពេលកន្លងផុត")}</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--gold)]">
            {calc.elapsedDays !== null ? `${calc.elapsedDays} ${text("d", "ថ្ងៃ")}` : "—"}
          </div>
          <div className="mt-1 text-xs text-[var(--ink-dim)]">
            {calc.elapsedPercent !== null ? `${calc.elapsedPercent.toFixed(1)}% ${text("elapsed", "កន្លងផុត")}` : text("Cut-off date needed", "ត្រូវការកាលបរិច្ឆេទកំណត់")}
          </div>
        </div>
        <div className={cardClass}>
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{text("Time remaining", "ពេលនៅសល់")}</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--ink)]">
            {calc.remainingDays !== null ? `${calc.remainingDays} ${text("d", "ថ្ងៃ")}` : "—"}
          </div>
          <div className="mt-1 text-xs text-[var(--ink-dim)]">
            {calc.elapsedPercent !== null ? `${(100 - calc.elapsedPercent).toFixed(1)}% ${text("remaining", "នៅសល់")}` : text("Cut-off date needed", "ត្រូវការកាលបរិច្ឆេទកំណត់")}
          </div>
        </div>
      </div>

      {/* Timeline progress bar */}
      <div className={`${cardClass} space-y-2.5`}>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[var(--ink)]">{text("Timeline progress", "វឌ្ឍនភាពពេលវេលា")}</span>
          <span className="font-mono-ui text-[var(--ink-dim)]">{calc.elapsedPercent !== null ? `${calc.elapsedPercent.toFixed(1)}%` : "0%"}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--ground-line)]">
          <div className="h-full rounded-full bg-[var(--gold)] transition-all" style={{ width: `${calc.elapsedPercent ?? 0}%` }} />
        </div>
        <div className="flex flex-wrap justify-between gap-x-4 text-[11px] text-[var(--ink-dim)]">
          <span>{text("Start", "ចាប់ផ្តើម")}: {data.startDate || "—"}</span>
          <span>{text("Cut-off", "កំណត់")}: {data.cutoffDate || "—"}</span>
          <span>{text("End", "បញ្ចប់")}: {isoDate(calc.completionDate)}</span>
        </div>
      </div>

      {/* Official contract table */}
      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-medium text-[var(--ink)]">{text("Contract table output", "តារាងលទ្ធផលកិច្ចសន្យា")}</h2>
            <p className="text-xs text-[var(--ink-dim)]">{text("Mirrors the structure used in contract documents.", "ឆ្លុះបញ្ចាំងរចនាសម្ព័ន្ធដែលប្រើក្នុងឯកសារកិច្ចសន្យា។")}</p>
          </div>
          <CopyButton text={contractTsv} />
        </div>
        <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {contractRows.map(([label, value], i) => (
                <tr key={i} className={i < contractRows.length - 1 ? "border-b border-[var(--ground-line)]" : ""}>
                  <th scope="row" className={`w-1/2 ${cellHead}`}>{label}</th>
                  <td className={`w-1/2 font-mono-ui ${cell}`}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Month-by-month ledger */}
      {calc.ledger.length > 0 && (
        <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
          <div>
            <h2 className="font-medium text-[var(--ink)]">{text("Month-by-month day-count verification", "ការផ្ទៀងផ្ទាត់ការរាប់ថ្ងៃ ខែម្តងៗ")}</h2>
            <p className="text-xs text-[var(--ink-dim)]">
              {text(
                "Standard count: the start day is excluded and the cut-off day included, so the total matches the standard elapsed figure.",
                "ការរាប់ស្តង់ដារ៖ ថ្ងៃចាប់ផ្តើមមិនរាប់ ហើយថ្ងៃកំណត់រាប់បញ្ចូល ដូច្នេះសរុបស្មើនឹងចំនួនថ្ងៃកន្លងផុតស្តង់ដារ។"
              )}
            </p>
          </div>
          <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--ground-line)] bg-[var(--ground-raised-hi)] text-[var(--ink-dim)]">
                  <th className="p-2.5 font-medium">{text("Month & year", "ខែ និងឆ្នាំ")}</th>
                  <th className="p-2.5 font-medium">{text("Days in month", "ថ្ងៃក្នុងខែ")}</th>
                  <th className="p-2.5 font-medium">{text("Days counted", "ថ្ងៃដែលរាប់")}</th>
                  <th className="p-2.5 font-medium">{text("Cumulative days", "ថ្ងៃប្រមូលផ្តុំ")}</th>
                </tr>
              </thead>
              <tbody className="font-mono-ui text-[var(--ink)]">
                {calc.ledger.map((row, i) => (
                  <tr key={i} className="border-b border-[var(--ground-line)]">
                    <td className="p-2.5">{row.monthYear}</td>
                    <td className="p-2.5 text-[var(--ink-dim)]">{row.daysInMonth}</td>
                    <td className="p-2.5 text-[var(--gold)]">+{row.countedDays}</td>
                    <td className="p-2.5 font-semibold">{row.cumulativeDays}</td>
                  </tr>
                ))}
                <tr className="bg-[var(--ground-raised-hi)] font-semibold">
                  <td className="p-2.5">{text("Total elapsed", "សរុបកន្លងផុត")}</td>
                  <td className="p-2.5">—</td>
                  <td className="p-2.5 text-[var(--gold)]">{calc.elapsedDays ?? 0}</td>
                  <td className="p-2.5">{calc.elapsedDays ?? 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {text(
          "All figures are calendar-day arithmetic from the values you enter and do not account for public holidays or non-working days. Sample values are editable and not an official contract.",
          "តួលេខទាំងអស់គណនាតាមថ្ងៃប្រតិទិនពីតម្លៃដែលអ្នកបញ្ចូល ហើយមិនគិតបញ្ចូលថ្ងៃឈប់សម្រាក ឬថ្ងៃឈប់ធ្វើការទេ។ តម្លៃគំរូអាចកែបាន និងមិនមែនជាកិច្ចសន្យាផ្លូវការឡើយ។"
        )}
      </p>
    </ToolShell>
  );
}
