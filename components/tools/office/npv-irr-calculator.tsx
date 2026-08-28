"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { npv, irr, paybackYears } from "@/lib/calc/finance";

export default function NpvIrrCalculator() {
  const { text: t } = useLanguage();
  const [flows, setFlows] = useToolState("npv-irr:flows", "-1000\n300\n400\n500\n200");
  const [rate, setRate] = useToolState("npv-irr:rate", "10");

  const result = useMemo(() => {
    const lines = flows.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
    if (lines.length === 0) return { error: "empty" as const };
    const values = lines.map((s) => Number(s.replace(/,/g, "")));
    if (values.some((v) => !isFinite(v))) return { error: "invalid" as const };
    const rateValue = Number(rate.replace(/,/g, ""));
    if (!isFinite(rateValue) || rateValue <= -100) return { error: "rate" as const };
    const r = rateValue / 100;
    return {
      error: null,
      npv: npv(r, values),
      irrPct: irr(values),
      payback: paybackYears(values),
    };
  }, [flows, rate]);

  const fmt = (v: number | null | undefined, digits = 2) =>
    v === null || v === undefined ? "—" : v.toLocaleString(undefined, { maximumFractionDigits: digits });

  return (
    <ToolShell
      title="NPV & IRR Calculator"
      khmerTitle="គណនា NPV និង IRR"
      description="Discounted cash-flow analysis: net present value, internal rate of return, and simple payback from a pasted cash-flow list."
      descriptionKm="ការវិភាគចរន្តសាច់ប្រាក់៖ តម្លៃបច្ចុប្បន្នសុទ្ធ (NPV) អត្រាត្រឡប់មូលធនផ្ទៃក្នុង (IRR) និងរយៈពេលសងសរុប ពីបញ្ជីចរន្តសាច់ប្រាក់។"
    >
      <Field
        label={t("Cash flows (one per year, year 0 first)", "ចរន្តសាច់ប្រាក់ (មួយក្នុងមួយឆ្នាំ ចាប់ពីឆ្នាំ ០)")}
        hintKm={t("Investment is negative", "ការវិនិយោគជាលេខអវិជ្ជមាន")}
      >
        <TextArea rows={7} value={flows} onChange={(e) => setFlows(e.target.value)} placeholder={"-1000\n300\n400\n500"} />
      </Field>
      <Field label={t("Discount rate (% per year)", "អត្រាបញ្ចុះ (% ក្នុងមួយឆ្នាំ)")}>
        <TextInput type="number" step="any" value={rate} onChange={(e) => setRate(e.target.value)} className="w-48" />
      </Field>

      {result.error === "empty" && <Output label={t("Status", "ស្ថានភាព")} value={t("Enter at least one cash flow.", "សូមបញ្ចូលចរន្តសាច់ប្រាក់យ៉ាងតិចមួយ។")} error />}
      {result.error === "invalid" && <Output label={t("Status", "ស្ថានភាព")} value={t("Some rows are not valid numbers.", "មានជួរដែលមិនមែនជាលេខត្រឹមត្រូវ។")} error />}
      {result.error === "rate" && <Output label={t("Status", "ស្ថានភាព")} value={t("Discount rate must be a number greater than −100.", "អត្រាបញ្ចុះត្រូវតែជាលេខធំជាង −១០០។")} error />}

      {result.error === null && (
        <div className="space-y-2">
          <Output label={t("Net present value (NPV)", "តម្លៃបច្ចុប្បន្នសុទ្ធ (NPV)")} value={fmt(result.npv)} />
          <Output label={t("Internal rate of return (IRR)", "អត្រាត្រឡប់មូលធនផ្ទៃក្នុង (IRR)")} value={result.irrPct === null ? t("No IRR found between −90% and 1000%", "រកមិនឃើញ IRR ក្នុងចន្លោះ −៩០% និង ១០០០%") : `${(result.irrPct * 100).toLocaleString(undefined, { maximumFractionDigits: 3 })}%`} />
          <Output label={t("Simple payback period", "រយៈពេលសងសរុបសាមញ្ញ")} value={result.payback === null ? t("Outlay never recovered", "មិនអាចសងសរុបវិញទេ") : t(`${fmt(result.payback, 2)} years`, `${fmt(result.payback, 2)} ឆ្នាំ`)} />
          <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
            {t("Formulas: NPV = Σ CFₜ/(1+r)ᵗ; IRR is the rate where NPV = 0 (bisection, −90%…1000%); payback is undiscounted. Figures are model outputs, not investment advice.", "រូបមន្ត៖ NPV = Σ CFₜ/(1+r)ᵗ; IRR គឺជាអត្រាដែល NPV = ០ (វិធីបែងចែក, −៩០%…១០០០%); រយៈពេលសងសរុបមិនបញ្ចូលការបញ្ចុះទេ។ លទ្ធផលជាគំរូគណនា មិនមែនជាដំបូន្មានវិនិយោគទេ។")}
          </p>
        </div>
      )}
    </ToolShell>
  );
}
