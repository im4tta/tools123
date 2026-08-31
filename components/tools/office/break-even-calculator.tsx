"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Calc =
  | { error: true; reason: "invalid" | "margin" }
  | {
      error: false;
      contribution: number;
      units: number;
      revenue: number;
      profit: number | null;
      margin: number | null;
      targetProvided: boolean;
    };

export default function BreakEvenCalculator() {
  const { text: t } = useLanguage();
  const [fixed, setFixed] = useToolState("break-even:fixed", "1000000");
  const [varCost, setVarCost] = useToolState("break-even:var-cost", "2500");
  const [price, setPrice] = useToolState("break-even:price", "5000");
  const [target, setTarget] = useToolState("break-even:target", "800");

  const calc = useMemo<Calc>(() => {
    const f = Number(fixed);
    const v = Number(varCost);
    const p = Number(price);
    if ([f, v, p].some((n) => Number.isNaN(n) || n < 0)) return { error: true, reason: "invalid" };
    if (p <= v) return { error: true, reason: "margin" };
    const contribution = p - v;
    const units = f / contribution;
    const revenue = units * p;
    const q = target.trim() === "" ? null : Number(target);
    if (q !== null && (Number.isNaN(q) || q < 0)) return { error: true, reason: "invalid" };
    const profit = q === null ? null : contribution * q - f;
    const margin = q !== null && q > 0 ? ((q - units) / q) * 100 : null;
    return { error: false, contribution, units, revenue, profit, margin, targetProvided: q !== null };
  }, [fixed, varCost, price, target]);

  const fmt = (n: number, decimals = 0) =>
    n.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: 0 });

  return (
    <ToolShell
      title="Break-even Calculator"
      khmerTitle="គណនាចំណុចដាច់"
      description="Find how many units you must sell to cover fixed costs, the revenue at that point, and profit at any target volume."
      descriptionKm="ស្វែងរកចំនួនគ្រឿងដែលត្រូវលក់ដើម្បីគ្របដណ្តប់ថ្លៃដើមថេរ ចំណូលនៅត្រង់ចំណុចនោះ និងប្រាក់ចំណេញនៅបរិមាណគោលដៅណាមួយ។"
    >
      <Row>
        <Field label={t("Fixed costs", "ថ្លៃដើមថេរ")} hint={t("per period", "ក្នុងមួយរយៈពេល")}>
          <TextInput inputMode="decimal" value={fixed} onChange={(e) => setFixed(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Variable cost per unit", "ថ្លៃដើមប្រែប្រួលក្នុងមួយគ្រឿង")}>
          <TextInput inputMode="decimal" value={varCost} onChange={(e) => setVarCost(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Selling price per unit", "តម្លៃលក់ក្នុងមួយគ្រឿង")}>
          <TextInput inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Target volume (optional)", "បរិមាណគោលដៅ (ស្រេចចិត្ត)")} hint={t("units", "គ្រឿង")}>
          <TextInput inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>

      {calc.error ? (
        <p className="text-sm text-[var(--danger)]">
          {calc.reason === "margin"
            ? t("Selling price must be higher than variable cost per unit.", "តម្លៃលក់ត្រូវតែខ្ពស់ជាងថ្លៃដើមប្រែប្រួលក្នុងមួយគ្រឿង។")
            : t("Enter valid non-negative numbers.", "សូមបញ្ចូលលេខត្រឹមត្រូវដែលមិនអវិជ្ជមាន។")}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Contribution margin / unit", "រឹមចំណេញក្នុងមួយគ្រឿង")}</div>
              <div className="mt-1 text-xl font-semibold text-[var(--ink)]">{fmt(calc.contribution, 2)}</div>
              <div className="mt-0.5 text-[10px] text-[var(--ink-dim)]">{t("price − variable cost", "តម្លៃលក់ − ថ្លៃដើមប្រែប្រួល")}</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Break-even units", "ចំនួនគ្រឿងដាច់")}</div>
              <div className="mt-1 text-xl font-semibold text-[var(--gold)]">{fmt(Math.ceil(calc.units))}</div>
              <div className="mt-0.5 text-[10px] text-[var(--ink-dim)]">{t("exact", "ពិតប្រាកដ")}: {fmt(calc.units, 1)}</div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Break-even revenue", "ចំណូលដាច់")}</div>
              <div className="mt-1 text-xl font-semibold text-[var(--ink)]">{fmt(calc.revenue)}</div>
              <div className="mt-0.5 text-[10px] text-[var(--ink-dim)]">{t("units × price", "គ្រឿង × តម្លៃលក់")}</div>
            </div>
          </div>

          {calc.targetProvided && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Profit at target volume", "ប្រាក់ចំណេញនៅបរិមាណគោលដៅ")}</div>
                <div className={`mt-1 text-xl font-semibold ${(calc.profit ?? 0) < 0 ? "text-[var(--danger)]" : "text-[var(--ink)]"}`}>
                  {fmt(calc.profit ?? 0, 2)}
                </div>
              </div>
              <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Margin of safety", "រឹមសុវត្ថិភាព")}</div>
                <div className={`mt-1 text-xl font-semibold ${(calc.margin ?? 0) < 0 ? "text-[var(--danger)]" : "text-[var(--gold)]"}`}>
                  {calc.margin === null ? "—" : `${fmt(calc.margin, 1)}%`}
                </div>
                <div className="mt-0.5 text-[10px] text-[var(--ink-dim)]">
                  {(calc.margin ?? 0) < 0
                    ? t("below break-even — at risk", "ក្រោមចំណុចដាច់ — មានហានិភ័យ")
                    : t("above break-even", "លើសចំណុចដាច់")}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-sm leading-relaxed text-[var(--ink-dim)]">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink)]">{t("Formulas", "រូបមន្ត")}</div>
            <ul className="list-inside list-disc space-y-1 font-mono-ui text-xs">
              <li>{t("Break-even units = Fixed costs ÷ (Price − Variable cost per unit)", "គ្រឿងដាច់ = ថ្លៃដើមថេរ ÷ (តម្លៃលក់ − ថ្លៃដើមប្រែប្រួលក្នុងមួយគ្រឿង)")}</li>
              <li>{t("Break-even revenue = Break-even units × Price", "ចំណូលដាច់ = គ្រឿងដាច់ × តម្លៃលក់")}</li>
              <li>{t("Profit = (Price − Variable cost) × Volume − Fixed costs", "ប្រាក់ចំណេញ = (តម្លៃលក់ − ថ្លៃដើមប្រែប្រួល) × បរិមាណ − ថ្លៃដើមថេរ")}</li>
              <li>{t("Margin of safety = (Volume − Break-even units) ÷ Volume × 100%", "រឹមសុវត្ថិភាព = (បរិមាណ − គ្រឿងដាច់) ÷ បរិមាណ × 100%")}</li>
            </ul>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
