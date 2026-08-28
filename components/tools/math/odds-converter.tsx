"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Source = "decimal" | "fractional" | "american" | "prob";

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** Finds the simplest fraction num/den (den <= maxDen) that approximates x. */
function toFraction(x: number, maxDen = 99): { num: number; den: number } {
  if (!Number.isFinite(x) || x <= 0) return { num: 0, den: 1 };
  let best = { num: 0, den: 1 };
  let bestErr = Infinity;
  for (let den = 1; den <= maxDen; den++) {
    const num = Math.round(x * den);
    const err = Math.abs(num / den - x);
    if (err < bestErr) {
      bestErr = err;
      best = { num, den };
    }
  }
  const g = gcd(best.num, best.den) || 1;
  return { num: best.num / g, den: best.den / g };
}

const trimNum = (n: number) => (Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(4))));

export default function OddsConverter() {
  const { text: t } = useLanguage();
  const [source, setSource] = useToolState<Source>("odds:source", "decimal");
  const [value, setValue] = useToolState("odds:value", "2.00");
  const [stake, setStake] = useToolState("odds:stake", "10");

  const calc = useMemo(() => {
    let decimal: number | null = null;
    const v = value.trim();

    if (source === "decimal") {
      const d = Number(v);
      if (Number.isFinite(d) && d >= 1) decimal = d;
    } else if (source === "fractional") {
      const m = v.match(/^(\d+)\s*\/\s*(\d+)$/);
      if (m) {
        const den = Number(m[2]);
        if (den > 0) decimal = (Number(m[1]) + den) / den;
      }
    } else if (source === "american") {
      const a = Number(v);
      if (Number.isFinite(a) && a !== 0) {
        decimal = a > 0 ? a / 100 + 1 : 1 + 100 / Math.abs(a);
      }
    } else {
      const p = Number(v);
      if (Number.isFinite(p) && p > 0 && p < 100) decimal = 100 / p;
    }

    if (decimal === null || decimal < 1) return null;

    const frac = toFraction(decimal - 1);
    const fracText = decimal === 1 ? "0/1" : `${frac.num}/${frac.den}`;
    const american =
      decimal >= 2
        ? `+${Math.round((decimal - 1) * 100)}`
        : decimal > 1.001
          ? `-${Math.round(100 / (decimal - 1))}`
          : "-";
    const prob = (1 / decimal) * 100;
    const s = Number(stake);
    const stakeValid = Number.isFinite(s) && s > 0;

    return {
      decimal: trimNum(decimal),
      fractional: fracText,
      american,
      prob: trimNum(prob),
      stakeValid,
      payout: stakeValid ? s * decimal : null,
      profit: stakeValid ? s * decimal - s : null,
    };
  }, [source, value, stake]);

  const setFrom = (nextSource: Source, nextValue: string) => {
    setSource(nextSource);
    setValue(nextValue);
  };

  return (
    <ToolShell
      title="Odds Converter"
      khmerTitle="បម្លែងសមាមាត្រភ្នាល់"
      description="Convert between decimal odds, fractional odds, American (+/-) odds and implied probability, and compute payout for a stake."
      descriptionKm="បម្លែងរវាងសមាមាត្រភ្នាល់ទសភាគ ប្រភាគ អាមេរិក (+/-) និងប្រូបាប៊ីលីតេបង្កប់ ហើយគណនាប្រាក់ទទួលសម្រាប់ចំនួនភ្នាល់។"
    >
      <Row>
        <Field label={t("Decimal odds", "សមាមាត្រទសភាគ")}>
          <TextInput inputMode="decimal" value={source === "decimal" ? value : calc?.decimal ?? ""} onChange={(e) => setFrom("decimal", e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Fractional odds (n/d)", "សមាមាត្រប្រភាគ (n/d)")}>
          <TextInput inputMode="text" value={source === "fractional" ? value : calc?.fractional ?? ""} onChange={(e) => setFrom("fractional", e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("American odds (+/-)", "សមាមាត្រអាមេរិក (+/-)")}>
          <TextInput inputMode="text" value={source === "american" ? value : calc?.american ?? ""} onChange={(e) => setFrom("american", e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Implied probability (%)", "ប្រូបាប៊ីលីតេបង្កប់ (%)")}>
          <TextInput inputMode="decimal" value={source === "prob" ? value : calc?.prob ?? ""} onChange={(e) => setFrom("prob", e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>

      <Row>
        <Field label={t("Stake", "ចំនួនភ្នាល់")}>
          <TextInput inputMode="decimal" value={stake} onChange={(e) => setStake(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>

      {calc ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Output label={t("Total payout", "ប្រាក់ទទួលសរុប")} value={calc.stakeValid ? trimNum(calc.payout as number) : t("Enter a valid stake", "បញ្ចូលចំនួនភ្នាល់ឱ្យបានត្រឹមត្រូវ")} />
          <Output label={t("Profit", "ប្រាក់ចំណេញ")} value={calc.stakeValid ? trimNum(calc.profit as number) : t("Enter a valid stake", "បញ្ចូលចំនួនភ្នាល់ឱ្យបានត្រឹមត្រូវ")} />
        </div>
      ) : (
        <p className="text-sm font-medium text-[var(--gold)]">
          {t(
            "Enter valid odds: decimal ≥ 1, fractional like 5/2, American like +250 or -150, or probability between 0 and 100.",
            "សូមបញ្ចូលសមាមាត្រឱ្យបានត្រឹមត្រូវ៖ ទសភាគ ≥ 1, ប្រភាគដូចជា 5/2, អាមេរិកដូចជា +250 ឬ -150, ឬប្រូបាប៊ីលីតេចន្លោះ 0 និង 100។"
          )}
        </p>
      )}

      {/* Source & Credits */}
      <div className="mt-6 rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
        <h3 className="mb-3 font-semibold text-[var(--ink)]">{t("Formulas", "រូបមន្ត")}</h3>
        <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
          {t(
            "Decimal → implied probability: p = 1 / decimal. Fractional n/d → decimal = (n + d) / d. American +a → decimal = a/100 + 1; American −a → decimal = 1 + 100/a. Payout = stake × decimal; profit = payout − stake. These are standard bookmaker odds conversions; the calculator is an original implementation.",
            "ទសភាគ → ប្រូបាប៊ីលីតេបង្កប់៖ p = 1 / decimal។ ប្រភាគ n/d → decimal = (n + d) / d។ អាមេរិក +a → decimal = a/100 + 1; អាមេរិក −a → decimal = 1 + 100/a។ ប្រាក់ទទួល = ភ្នាល់ × decimal; ប្រាក់ចំណេញ = ប្រាក់ទទួល − ភ្នាល់។ ទាំងនេះជារូបមន្តស្ដង់ដារនៃការបម្លែងសមាមាត្រភ្នាល់។"
          )}
        </p>
      </div>
    </ToolShell>
  );
}
