"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { halfLife } from "@/lib/calc/science";

const TIME_UNITS = [
  { id: "s", en: "seconds", km: "វិនាទី" },
  { id: "min", en: "minutes", km: "នាទី" },
  { id: "h", en: "hours", km: "ម៉ោង" },
  { id: "d", en: "days", km: "ថ្ងៃ" },
  { id: "y", en: "years", km: "ឆ្នាំ" },
];

export default function HalfLifeCalculator() {
  const { text: t } = useLanguage();
  const [initial, setInitial] = useToolState("half-life:initial", "100");
  const [halfLifeValue, setHalfLifeValue] = useToolState("half-life:tl", "5");
  const [timeUnit, setTimeUnit] = useToolState("half-life:unit", "d");
  const [elapsed, setElapsed] = useToolState("half-life:elapsed", "12");

  const result = useMemo(() => {
    const n0 = Number(initial);
    const th = Number(halfLifeValue);
    const dt = Number(elapsed);
    return halfLife(n0, th, dt);
  }, [initial, halfLifeValue, elapsed]);

  const fmt = (v: number, digits = 6) => {
    if (v !== 0 && (Math.abs(v) < 1e-6 || Math.abs(v) >= 1e12)) return v.toExponential(4);
    return v.toLocaleString(undefined, { maximumFractionDigits: digits });
  };
  const unitLabel = TIME_UNITS.find((u) => u.id === timeUnit);
  const unitText = unitLabel ? t(unitLabel.en, unitLabel.km) : "";

  return (
    <ToolShell
      title="Half-Life Calculator"
      khmerTitle="គណនារយៈពេលពាក់កណ្តាល"
      description="Exponential decay: remaining quantity after a given time, decay constant, mean lifetime, and half-lives elapsed."
      descriptionKm="ការធ្លាក់ចុះលំដាប់លំដោយ៖ បរិមាណសល់ក្រោយពេលកំណត់ ស្ថិរភាពថេរខ្ទេច (λ) អាយុកាលមធ្យម និងចំនួនរយៈពេលពាក់កណ្តាល។"
    >
      <Row>
        <Field label={t("Initial quantity N₀", "បរិមាណដើម N₀")}>
          <TextInput type="number" step="any" value={initial} onChange={(e) => setInitial(e.target.value)} />
        </Field>
        <Field label={t("Half-life T½", "រយៈពេលពាក់កណ្តាល T½")}>
          <TextInput type="number" step="any" min="0" value={halfLifeValue} onChange={(e) => setHalfLifeValue(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label={t("Time unit", "ឯកតាពេលវេលា")}>
          <Select value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)} className="w-48">
            {TIME_UNITS.map((u) => <option key={u.id} value={u.id}>{t(u.en, u.km)}</option>)}
          </Select>
        </Field>
        <Field label={t("Elapsed time", "ពេលកន្លងទៅ")}>
          <TextInput type="number" step="any" value={elapsed} onChange={(e) => setElapsed(e.target.value)} />
        </Field>
      </Row>

      {result ? (
        <div className="space-y-2">
          <Output label={t("Remaining quantity", "បរិមាណសល់")} value={fmt(result.remaining)} />
          <Output label={t("Fraction remaining", "សមាមាត្រសល់")} value={`${(result.fraction * 100).toLocaleString(undefined, { maximumFractionDigits: 4 })}%`} />
          <Output label={t("Half-lives elapsed", "ចំនួនរយៈពេលពាក់កណ្តាល")} value={fmt(result.halfLives, 4)} />
          <Output label={t("Decay constant λ (per time unit)", "ស្ថិរភាពថេរខ្ទេច λ (ក្នុងមួយឯកតា)")} value={fmt(result.lambda, 8)} />
          <Output label={t("Mean lifetime τ", "អាយុកាលមធ្យម τ")} value={`${fmt(result.meanLifetime, 6)} ${unitText}`} />
        </div>
      ) : (
        <Output label={t("Status", "ស្ថានភាព")} value={t("Half-life must be a positive number.", "រយៈពេលពាក់កណ្តាលត្រូវតែជាលេខវិជ្ជមាន។")} error />
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t("Formula: N = N₀ × (1/2)^(t/T½), with decay constant λ = ln 2 / T½ and mean lifetime τ = 1/λ (standard exponential decay). A negative elapsed time computes the quantity before the start.", "រូបមន្ត៖ N = N₀ × (½)^(t/T½) ដោយ λ = ln 2 / T½ និង τ = ១/λ (ការធ្លាក់ចុះលំដាប់លំដោយស្តង់ដារ)។ ពេលអវិជ្ជមានគណនាបរិមាណមុនពេលចាប់ផ្តើម។")}
      </p>
    </ToolShell>
  );
}
