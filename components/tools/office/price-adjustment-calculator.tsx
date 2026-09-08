"use client";

import { useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";

// FIDIC Sub-Clause 13.8 "Adjustments for Changes in Cost" price-adjustment
// formula (Red/Yellow Book, Table of Adjustment Data):
//   Pn = a + b·(Ln/Lo) + c·(Mn/Mo) + …
// where `a` is the fixed (non-adjustable) coefficient and b, c, … are the
// weightings of each cost element, with a + Σweightings = 1. L/M/… are the
// cost indices at the base date (o) and the current payment period (n).
// All indices and weightings are entered by the user; nothing is fabricated.

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function money(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Element {
  id: number;
  label: string;
  weightPct: string;
  baseIndex: string;
  currentIndex: string;
}

export default function PriceAdjustmentCalculator() {
  const { text: t } = useLanguage();
  const nextId = useRef(4);
  const [fixedPct, setFixedPct] = useState("10");
  const [amount, setAmount] = useState("");
  const [elements, setElements] = useState<Element[]>([
    { id: 1, label: "Labour", weightPct: "30", baseIndex: "100", currentIndex: "" },
    { id: 2, label: "Materials", weightPct: "40", baseIndex: "100", currentIndex: "" },
    { id: 3, label: "Fuel / energy", weightPct: "20", baseIndex: "100", currentIndex: "" },
  ]);

  const update = (id: number, key: keyof Element, value: string) =>
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, [key]: value } : el)));
  const addElement = () =>
    setElements((prev) => [...prev, { id: (nextId.current += 1), label: "Element", weightPct: "0", baseIndex: "100", currentIndex: "" }]);
  const removeElement = (id: number) => setElements((prev) => (prev.length > 1 ? prev.filter((el) => el.id !== id) : prev));

  const calc = useMemo(() => {
    const a = toNumber(fixedPct) / 100;
    let weightedSum = 0;
    let ready = true;
    for (const el of elements) {
      const w = toNumber(el.weightPct) / 100;
      const base = toNumber(el.baseIndex);
      const cur = toNumber(el.currentIndex);
      if (el.currentIndex === "" || base <= 0) { ready = false; continue; }
      weightedSum += w * (cur / base);
    }
    const pn = a + weightedSum;
    const weightingTotal = toNumber(fixedPct) + elements.reduce((s, el) => s + toNumber(el.weightPct), 0);
    const amt = amount === "" ? null : toNumber(amount);
    return {
      pn,
      pctChange: (pn - 1) * 100,
      weightingTotal,
      ready,
      adjustment: amt !== null ? (pn - 1) * amt : null,
      adjustedTotal: amt !== null ? amt * pn : null,
    };
  }, [fixedPct, elements, amount]);

  const summary = useMemo(() => {
    const lines = [
      t("PRICE ADJUSTMENT (FIDIC 13.8)", "ការកែតម្រូវតម្លៃ (FIDIC 13.8)"),
      "─".repeat(46),
      `${t("Adjustment factor Pn", "កត្តាកែតម្រូវ Pn")}: ${calc.pn.toFixed(5)}`,
      `${t("Price change", "ការប្រែប្រួលតម្លៃ")}: ${calc.pctChange >= 0 ? "+" : ""}${calc.pctChange.toFixed(3)} %`,
    ];
    if (calc.adjustment !== null && calc.adjustedTotal !== null) {
      lines.push(`${t("Amount for the period", "ចំនួនទឹកប្រាក់សម្រាប់អំឡុងពេល")}: ${money(toNumber(amount))}`);
      lines.push(`${t("Adjustment amount", "ចំនួនកែតម្រូវ")}: ${calc.adjustment >= 0 ? "+" : ""}${money(calc.adjustment)}`);
      lines.push(`${t("Adjusted amount payable", "ចំនួនត្រូវបង់បន្ទាប់ពីកែតម្រូវ")}: ${money(calc.adjustedTotal)}`);
    }
    return lines.join("\n");
  }, [calc, amount, t]);

  return (
    <ToolShell
      title="Price Adjustment Calculator (VOP)"
      khmerTitle="ម៉ាស៊ីនគណនាការកែតម្រូវតម្លៃ (VOP)"
      description="Compute the FIDIC Sub-Clause 13.8 price-adjustment factor (Pn) from your cost-element weightings and base/current indices, and apply it to a payment amount."
      descriptionKm="គណនាកត្តាកែតម្រូវតម្លៃ (Pn) តាមមាត្រា 13.8 របស់ FIDIC ពីទម្ងន់ធាតុថ្លៃ និងសន្ទស្សន៍មូលដ្ឋាន/បច្ចុប្បន្ន ហើយអនុវត្តទៅលើចំនួនទឹកប្រាក់បង់។"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Fixed (non-adjustable) portion (%)" labelKm="ចំណែកថេរ (មិនកែតម្រូវ) (%)" hint="coefficient a" hintKm="មេគុណ a">
          <TextInput type="number" min="0" max="100" step="0.01" value={fixedPct} onChange={(e) => setFixedPct(e.target.value)} />
        </Field>
        <Field label="Amount for the period (optional)" labelKm="ចំនួនទឹកប្រាក់សម្រាប់អំឡុងពេល (ស្រេចចិត្ត)" hint="to compute the money adjustment" hintKm="ដើម្បីគណនាចំនួនកែតម្រូវជាទឹកប្រាក់">
          <TextInput type="number" min="0" step="0.01" placeholder="e.g. 100000" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
      </div>

      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-[var(--ink)]">{t("Cost elements", "ធាតុថ្លៃដើម")}</h2>
          <button type="button" onClick={addElement}
            className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)]">
            + {t("Add element", "បន្ថែមធាតុ")}
          </button>
        </div>
        <div className="space-y-3">
          {elements.map((el) => (
            <div key={el.id} className="grid grid-cols-2 gap-2 rounded-md border border-[var(--ground-line)] p-3 sm:grid-cols-9 sm:items-end">
              <label className="col-span-2 sm:col-span-3">
                <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Element", "ធាតុ")}</span>
                <TextInput value={el.label} onChange={(e) => update(el.id, "label", e.target.value)} />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Weight %", "ទម្ងន់ %")}</span>
                <TextInput type="number" min="0" max="100" step="0.01" value={el.weightPct} onChange={(e) => update(el.id, "weightPct", e.target.value)} />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Base index", "សន្ទស្សន៍មូលដ្ឋាន")}</span>
                <TextInput type="number" min="0" step="0.001" value={el.baseIndex} onChange={(e) => update(el.id, "baseIndex", e.target.value)} />
              </label>
              <label className="sm:col-span-1">
                <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Current", "បច្ចុប្បន្ន")}</span>
                <TextInput type="number" min="0" step="0.001" value={el.currentIndex} onChange={(e) => update(el.id, "currentIndex", e.target.value)} />
              </label>
              <div className="sm:col-span-1 sm:flex sm:justify-end">
                <button type="button" onClick={() => removeElement(el.id)} disabled={elements.length <= 1}
                  aria-label={t("Remove element", "លុបធាតុ")}
                  className="rounded-md border border-[var(--ground-line)] px-2 py-2 text-xs text-[var(--ink-faint)] transition hover:border-[var(--danger)]/50 hover:text-[var(--danger)] disabled:opacity-40">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {Math.abs(calc.weightingTotal - 100) > 0.001 && (
        <p role="status" className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
          {t(
            `Fixed portion + weightings currently total ${calc.weightingTotal.toFixed(2)}%. FIDIC 13.8 requires them to sum to 100%.`,
            `ចំណែកថេរ + ទម្ងន់បច្ចុប្បន្នសរុប ${calc.weightingTotal.toFixed(2)}%។ FIDIC 13.8 តម្រូវឲ្យផលបូកស្មើ 100%។`
          )}
        </p>
      )}
      {!calc.ready && (
        <p className="text-xs text-[var(--ink-faint)]">{t("Enter a current index for each element to complete the calculation.", "សូមបញ្ចូលសន្ទស្សន៍បច្ចុប្បន្នសម្រាប់ធាតុនីមួយៗ ដើម្បីបញ្ចប់ការគណនា។")}</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Adjustment factor Pn", "កត្តាកែតម្រូវ Pn")}</div>
          <div className="mt-1 font-mono-ui text-2xl font-semibold text-[var(--ink)]">{calc.pn.toFixed(5)}</div>
          <div className={`mt-1 font-mono-ui text-xs font-semibold ${calc.pctChange >= 0 ? "text-red-500" : "text-emerald-500"}`}>
            {calc.pctChange >= 0 ? "+" : ""}{calc.pctChange.toFixed(3)} %
          </div>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Adjusted amount payable", "ចំនួនត្រូវបង់បន្ទាប់ពីកែតម្រូវ")}</div>
          <div className="mt-1 font-mono-ui text-2xl font-semibold text-[var(--ink)]">{calc.adjustedTotal !== null ? money(calc.adjustedTotal) : "—"}</div>
          <div className="mt-1 font-mono-ui text-xs text-[var(--ink-dim)]">
            {calc.adjustment !== null ? `${t("adjustment", "កែតម្រូវ")}: ${calc.adjustment >= 0 ? "+" : ""}${money(calc.adjustment)}` : t("enter an amount above", "បញ្ចូលចំនួនទឹកប្រាក់ខាងលើ")}
          </div>
        </div>
      </div>

      <Output label={t("Summary", "សេចក្តីសង្ខេប")} value={summary} mono={false} />

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Formula: Pn = a + Σ(weightᵢ × currentᵢ / baseᵢ), per FIDIC Sub-Clause 13.8. Use the indices and weightings defined in your contract's Table of Adjustment Data; index values are user-supplied, not official.",
          "រូបមន្ត៖ Pn = a + Σ(ទម្ងន់ᵢ × បច្ចុប្បន្នᵢ / មូលដ្ឋានᵢ) តាមមាត្រា 13.8 របស់ FIDIC។ សូមប្រើសន្ទស្សន៍ និងទម្ងន់ដែលកំណត់ក្នុងតារាងទិន្នន័យកែតម្រូវនៃកិច្ចសន្យារបស់អ្នក; តម្លៃសន្ទស្សន៍ជាការបញ្ចូលដោយអ្នកប្រើ មិនមែនផ្លូវការទេ។"
        )}
      </p>
    </ToolShell>
  );
}
