"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "";
  return String(Number(n.toPrecision(10)));
}

export default function InflationCalculator() {
  const { text: t } = useLanguage();
  const [amountStr, setAmount] = useToolState("inflation:amount", "100");
  const [startStr, setStart] = useToolState("inflation:start", "2000");
  const [endStr, setEnd] = useToolState("inflation:end", "2026");
  const [rateStr, setRate] = useToolState("inflation:rate", "2.5");

  const amount = Number(amountStr);
  const start = Number(startStr);
  const end = Number(endStr);
  const rate = Number(rateStr);
  const valid = !isNaN(amount) && !isNaN(start) && !isNaN(end) && !isNaN(rate) && amount >= 0 && rate >= 0 && start >= 1900 && end >= 1900;

  const years = valid ? end - start : NaN;
  const factor = valid ? Math.pow(1 + rate / 100, years) : NaN;
  const equivalent = valid ? amount * factor : NaN;
  const totalPct = valid ? (factor - 1) * 100 : NaN;

  return (
    <ToolShell
      title="Inflation Calculator"
      description="Estimate how the purchasing power of an amount changes over time at a given annual inflation rate."
    >
      <div className="space-y-4">
        <Row>
          <Field label="Amount">
            <TextInput inputMode="decimal" value={amountStr} onChange={(e) => setAmount(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label="Start year">
            <TextInput inputMode="numeric" value={startStr} onChange={(e) => setStart(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label="End year">
            <TextInput inputMode="numeric" value={endStr} onChange={(e) => setEnd(e.target.value)} className="font-mono-ui" />
          </Field>
        </Row>
        <Field label="Annual inflation rate (%)">
          <TextInput inputMode="decimal" value={rateStr} onChange={(e) => setRate(e.target.value)} className="font-mono-ui" />
        </Field>

        <Output label="Equivalent value" value={valid ? `${fmt(equivalent)} · ${t("in", "ក្នុង")} ${Number.isInteger(end) ? end : endStr}` : ""} error={!valid} />
        <Output label="Total inflation over period" value={valid ? `${fmt(totalPct)}%` : ""} error={!valid} />

        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
          {t("This uses a fixed annual rate you provide and is an estimate only. Actual inflation varies by year and is measured with official price indices.", "ការគណនានេះប្រើអត្រាប្រចាំឆ្នាំថេរដែលអ្នកផ្តល់ ហើយគ្រាន់តែជាការប៉ាន់ប្រមាណប៉ុណ្ណោះ។ អតិផរណាជាក់ស្តែងប្រែប្រួលតាមឆ្នាំ ហើយត្រូវវាស់ដោយសន្ទស្សន៍តម្លៃផ្លូវការ។")}
        </p>
      </div>
    </ToolShell>
  );
}