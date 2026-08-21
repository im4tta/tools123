"use client";
import { ToolShell, TextInput, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "";
  return String(Number(n.toPrecision(10)));
}

export default function SavingsGoal() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState<"time" | "payment">("savings-goal:mode", "time");
  const [targetStr, setTarget] = useToolState("savings-goal:target", "10000");
  const [currentStr, setCurrent] = useToolState("savings-goal:current", "1000");
  const [monthlyStr, setMonthly] = useToolState("savings-goal:monthly", "300");
  const [rateStr, setRate] = useToolState("savings-goal:rate", "3");
  const [monthsStr, setMonths] = useToolState("savings-goal:months", "24");

  const target = Number(targetStr);
  const current = Number(currentStr);
  const monthly = Number(monthlyStr);
  const ratePct = Number(rateStr);
  const monthsN = Math.max(1, Math.round(Number(monthsStr) || 1));
  const r = ratePct / 1200;

  let resultLabel = "";
  let resultValue = "";
  let error = false;

  if (isNaN(target) || isNaN(current) || isNaN(monthly) || isNaN(ratePct) || target < 0 || current < 0 || monthly < 0) {
    error = true;
  } else if (target <= current) {
    resultLabel = t("Status", "ស្ថានភាព");
    resultValue = t("Goal already reached!", "បានទៅដល់គោលដៅរួចហើយ!");
  } else if (mode === "time") {
    if (r === 0) {
      if (monthly <= 0) {
        error = true;
      } else {
        const n = Math.ceil((target - current) / monthly);
        resultLabel = t("Months needed", "ចំនួនខែត្រូវការ");
        resultValue = `${n} ${t("months", "ខែ")} (${(n / 12).toFixed(1)} ${t("years", "ឆ្នាំ")})`;
      }
    } else if (monthly <= 0 && current * Math.pow(1 + r, 600) < target) {
      error = true;
    } else {
      let n = 0;
      let balance = current;
      while (balance < target && n < 1200) {
        balance = balance * (1 + r) + monthly;
        n++;
      }
      if (balance >= target) {
        resultLabel = t("Months needed", "ចំនួនខែត្រូវការ");
        resultValue = `${n} ${t("months", "ខែ")} (${(n / 12).toFixed(1)} ${t("years", "ឆ្នាំ")})`;
      } else {
        error = true;
      }
    }
  } else {
    const factor = Math.pow(1 + r, monthsN);
    const pmt = r === 0 ? (target - current) / monthsN : ((target - current * factor) * r) / (factor - 1);
    resultLabel = t("Required monthly deposit", "ការដាក់ប្រាក់ក្នុងមួយខែ");
    resultValue = fmt(Math.max(0, pmt));
    if (pmt < 0) {
      resultLabel = t("Status", "ស្ថានភាព");
      resultValue = t("Goal already reached!", "បានទៅដល់គោលដៅរួចហើយ!");
    }
  }

  return (
    <ToolShell
      title="Savings Goal Calculator"
      khmerTitle="គណនាគោលដៅសន្សំ"
      description="Work out how long it takes to reach a savings goal — or the monthly deposit required to hit it on time."
      descriptionKm="គណនាពេលដែលត្រូវការដើម្បីសម្រេចគោលដៅសន្សំ — ឬការដាក់ប្រាក់ក្នុងមួយខែដែលត្រូវការ។"
    >
      <div className="space-y-4">
        <Field label={t("Mode", "របៀប")}>
          <Select value={mode} onChange={(e) => setMode(e.target.value as "time" | "payment")}>
            <option value="time">{t("Time to reach my goal", "ពេលទៅដល់គោលដៅ")}</option>
            <option value="payment">{t("Monthly deposit for a deadline", "ការដាក់ប្រាក់ក្នុងមួយខែតាមកាលកំណត់")}</option>
          </Select>
        </Field>

        <Field label={t("Goal amount", "ចំនួនគោលដៅ")}>
          <TextInput inputMode="decimal" value={targetStr} onChange={(e) => setTarget(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Current savings", "ប្រាក់សន្សំបច្ចុប្បន្ន")}>
          <TextInput inputMode="decimal" value={currentStr} onChange={(e) => setCurrent(e.target.value)} className="font-mono-ui" />
        </Field>

        {mode === "time" ? (
          <Field label={t("Monthly deposit", "ការដាក់ប្រាក់ក្នុងមួយខែ")}>
            <TextInput inputMode="decimal" value={monthlyStr} onChange={(e) => setMonthly(e.target.value)} className="font-mono-ui" />
          </Field>
        ) : (
          <Field label={t("Deadline (months)", "កាលកំណត់ (ខែ)")}>
            <TextInput inputMode="numeric" value={monthsStr} onChange={(e) => setMonths(e.target.value)} className="font-mono-ui" />
          </Field>
        )}

        <Field label={t("Annual interest rate (%)", "អត្រាការប្រាក់ប្រចាំឆ្នាំ (%)")} hint={t("0 for no interest", "០ បើគ្មានការប្រាក់")}>
          <TextInput inputMode="decimal" value={rateStr} onChange={(e) => setRate(e.target.value)} className="font-mono-ui" />
        </Field>

        <Output label={resultLabel} value={resultValue} error={error} />

        <p className="text-xs text-[var(--ink-faint)]">{t("Estimate with monthly compounding. Actual account terms may differ.", "ជាការប៉ាន់ប្រមាណដោយគិតការប្រាក់ប្រចាំខែ។ លក្ខខណ្ឌពិតប្រាកដអាចខុសគ្នា។")}</p>
      </div>
    </ToolShell>
  );
}