"use client";

import { useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { CopyButton } from "@/components/CopyButton";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";

// FIDIC advance-payment amortisation (Sub-Clause 14.2). The advance is repaid
// by percentage deductions from Interim Payment Certificates once cumulative
// certified work passes a start threshold, finishing by a completion threshold.
// Recovery rate = advance / (finishValue − startValue); each period repays that
// rate applied to the certified amount falling inside the recovery band, capped
// so the total repaid never exceeds the advance. Thresholds and amounts are
// user-supplied per the contract's Particular Conditions.

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function money(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Ipc {
  id: number;
  label: string;
  certified: string;
}

export default function AdvancePaymentRecovery() {
  const { text: t } = useLanguage();
  const nextId = useRef(3);
  const [contractPrice, setContractPrice] = useState("");
  const [advancePct, setAdvancePct] = useState("10");
  const [startPct, setStartPct] = useState("10");
  const [finishPct, setFinishPct] = useState("90");
  const [ipcs, setIpcs] = useState<Ipc[]>([
    { id: 1, label: "IPC 1", certified: "" },
    { id: 2, label: "IPC 2", certified: "" },
    { id: 3, label: "IPC 3", certified: "" },
  ]);

  const update = (id: number, key: keyof Ipc, value: string) =>
    setIpcs((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const addIpc = () => setIpcs((prev) => [...prev, { id: (nextId.current += 1), label: `IPC ${prev.length + 1}`, certified: "" }]);
  const removeIpc = (id: number) => setIpcs((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  const calc = useMemo(() => {
    const price = toNumber(contractPrice);
    const advance = (toNumber(advancePct) / 100) * price;
    const startValue = (toNumber(startPct) / 100) * price;
    const finishValue = (toNumber(finishPct) / 100) * price;
    const band = finishValue - startValue;
    const validThresholds = price > 0 && band > 0 && toNumber(finishPct) > toNumber(startPct);
    const rate = validThresholds ? advance / band : 0;

    let cum = 0;
    let recoveredToDate = 0;
    const rows: {
      id: number; label: string; certified: number; cumulative: number;
      cumulativePct: number; recovery: number; recoveredToDate: number;
      outstanding: number; netPayable: number;
    }[] = [];
    for (const r of ipcs) {
      const certified = toNumber(r.certified);
      const prevCum = cum;
      cum += certified;
      const overlap = Math.max(0, Math.min(cum, finishValue) - Math.max(prevCum, startValue));
      let recovery = rate * overlap;
      if (recoveredToDate + recovery > advance) recovery = Math.max(0, advance - recoveredToDate);
      recoveredToDate += recovery;
      rows.push({
        id: r.id,
        label: r.label,
        certified,
        cumulative: cum,
        cumulativePct: price > 0 ? (cum / price) * 100 : 0,
        recovery,
        recoveredToDate,
        outstanding: Math.max(0, advance - recoveredToDate),
        netPayable: certified - recovery,
      });
    }
    return { price, advance, startValue, finishValue, validThresholds, rows, recoveredToDate };
  }, [contractPrice, advancePct, startPct, finishPct, ipcs]);

  const tsv = useMemo(() => {
    const header = ["IPC", "Certified", "Cumulative", "Cumulative %", "Recovery", "Recovered to date", "Advance outstanding", "Net payable"].join("\t");
    const body = calc.rows.map((r) =>
      [r.label, money(r.certified), money(r.cumulative), `${r.cumulativePct.toFixed(1)}%`, money(r.recovery), money(r.recoveredToDate), money(r.outstanding), money(r.netPayable)].join("\t")
    );
    return [header, ...body].join("\n");
  }, [calc]);

  return (
    <ToolShell
      title="Advance Payment Recovery Schedule"
      khmerTitle="តារាងសងប្រាក់បុរេប្រទាន"
      description="Model how a FIDIC advance payment is recovered from interim payment certificates, showing per-IPC deductions, the running balance, and net amount payable."
      descriptionKm="គណនាការសងប្រាក់បុរេប្រទានតាម FIDIC ពីវិញ្ញាបនបត្របង់ប្រាក់អន្តរកាល ដោយបង្ហាញការកាត់ក្នុង IPC នីមួយៗ សមតុល្យនៅសល់ និងចំនួនត្រូវបង់សុទ្ធ។"
    >
      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <h2 className="font-medium text-[var(--ink)]">{t("Contract & advance terms", "លក្ខខណ្ឌកិច្ចសន្យា និងបុរេប្រទាន")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Contract price" labelKm="តម្លៃកិច្ចសន្យា">
            <TextInput type="number" min="0" step="0.01" placeholder="e.g. 8830491.60" value={contractPrice} onChange={(e) => setContractPrice(e.target.value)} />
          </Field>
          <Field label="Advance payment (% of contract)" labelKm="ប្រាក់បុរេប្រទាន (% នៃកិច្ចសន្យា)" hint="typical 10–20%" hintKm="ធម្មតា ១០–២០%">
            <TextInput type="number" min="0" max="100" step="0.01" value={advancePct} onChange={(e) => setAdvancePct(e.target.value)} />
          </Field>
          <Field label="Start recovery at (% certified)" labelKm="ចាប់ផ្តើមសងនៅ (% បានបញ្ជាក់)" hint="often equals advance %" hintKm="ជាញឹកញាប់ស្មើ % បុរេប្រទាន">
            <TextInput type="number" min="0" max="100" step="0.01" value={startPct} onChange={(e) => setStartPct(e.target.value)} />
          </Field>
          <Field label="Finish recovery by (% certified)" labelKm="សងឲ្យរួចនៅ (% បានបញ្ជាក់)" hint="often 90%" hintKm="ជាញឹកញាប់ ៩០%">
            <TextInput type="number" min="0" max="100" step="0.01" value={finishPct} onChange={(e) => setFinishPct(e.target.value)} />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-[var(--ink-dim)]">
          <span>{t("Advance amount", "ចំនួនបុរេប្រទាន")}: <strong className="font-mono-ui text-[var(--ink)]">{money(calc.advance)}</strong></span>
          <span>{t("Recovery band", "ចន្លោះសង")}: <strong className="font-mono-ui text-[var(--ink)]">{money(calc.startValue)} → {money(calc.finishValue)}</strong></span>
        </div>
      </section>

      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-[var(--ink)]">{t("Certified per IPC (gross)", "ចំនួនបញ្ជាក់ក្នុង IPC នីមួយៗ (ដុល)")}</h2>
          <div className="flex items-center gap-2">
            <CopyButton text={tsv} />
            <button type="button" onClick={addIpc}
              className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)]">
              + {t("Add IPC", "បន្ថែម IPC")}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {ipcs.map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-2 sm:items-end">
              <label className="col-span-4 sm:col-span-3">
                <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("IPC", "IPC")}</span>
                <TextInput value={r.label} onChange={(e) => update(r.id, "label", e.target.value)} />
              </label>
              <label className="col-span-6 sm:col-span-8">
                <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Gross certified", "បញ្ជាក់ដុល")}</span>
                <TextInput type="number" min="0" step="0.01" value={r.certified} onChange={(e) => update(r.id, "certified", e.target.value)} />
              </label>
              <div className="col-span-2 flex items-end sm:col-span-1">
                <button type="button" onClick={() => removeIpc(r.id)} disabled={ipcs.length <= 1}
                  aria-label={t("Remove IPC", "លុប IPC")}
                  className="w-full rounded-md border border-[var(--ground-line)] px-2 py-2 text-xs text-[var(--ink-faint)] transition hover:border-[var(--danger)]/50 hover:text-[var(--danger)] disabled:opacity-40">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {!calc.validThresholds && (
        <p role="status" className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
          {t("Enter a contract price and ensure the finish threshold is greater than the start threshold.", "សូមបញ្ចូលតម្លៃកិច្ចសន្យា និងធានាថាកម្រិតបញ្ចប់ធំជាងកម្រិតចាប់ផ្តើម។")}
        </p>
      )}

      {calc.validThresholds && (
        <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
          <h2 className="font-medium text-[var(--ink)]">{t("Recovery schedule", "តារាងសង")}</h2>
          <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--ground-line)] bg-[var(--ground-raised-hi)] text-[var(--ink-dim)]">
                  <th className="p-2.5 font-medium">{t("IPC", "IPC")}</th>
                  <th className="p-2.5 font-medium text-right">{t("Certified", "បញ្ជាក់")}</th>
                  <th className="p-2.5 font-medium text-right">{t("Cumulative %", "សរុប %")}</th>
                  <th className="p-2.5 font-medium text-right">{t("Recovery", "ការសង")}</th>
                  <th className="p-2.5 font-medium text-right">{t("Outstanding", "នៅសល់")}</th>
                  <th className="p-2.5 font-medium text-right">{t("Net payable", "ត្រូវបង់សុទ្ធ")}</th>
                </tr>
              </thead>
              <tbody className="font-mono-ui text-[var(--ink)]">
                {calc.rows.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--ground-line)]">
                    <td className="p-2.5 font-sans">{r.label}</td>
                    <td className="p-2.5 text-right">{money(r.certified)}</td>
                    <td className="p-2.5 text-right text-[var(--ink-dim)]">{r.cumulativePct.toFixed(1)}%</td>
                    <td className="p-2.5 text-right text-red-500">{r.recovery > 0 ? `−${money(r.recovery)}` : "—"}</td>
                    <td className="p-2.5 text-right">{money(r.outstanding)}</td>
                    <td className="p-2.5 text-right font-semibold text-[var(--gold)]">{money(r.netPayable)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--ink-dim)]">
            {t("Advance recovered to date", "បុរេប្រទានបានសងរហូតមកដល់")}: <strong className="font-mono-ui text-[var(--ink)]">{money(calc.recoveredToDate)}</strong> / {money(calc.advance)}
          </p>
        </section>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Model of FIDIC Sub-Clause 14.2: recovery is proportional to certified work inside the start–finish band and is capped at the advance amount. Confirm the exact percentages and method in your contract's Particular Conditions.",
          "គំរូនៃមាត្រា 14.2 របស់ FIDIC៖ ការសងសមាមាត្រនឹងការងារបញ្ជាក់ក្នុងចន្លោះចាប់ផ្តើម–បញ្ចប់ ហើយកំណត់ត្រឹមចំនួនបុរេប្រទាន។ សូមផ្ទៀងផ្ទាត់ភាគរយ និងវិធីសាស្ត្រពិតប្រាកដក្នុងលក្ខខណ្ឌពិសេសនៃកិច្ចសន្យារបស់អ្នក។"
        )}
      </p>
    </ToolShell>
  );
}
