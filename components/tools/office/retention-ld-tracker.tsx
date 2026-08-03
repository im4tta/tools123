"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Output } from "@/components/ui/Output";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";

function toNumber(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function daysBetween(a: string, b: string) {
  if (!a || !b) return 0;
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.round((end - start) / 86400000);
}

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RetentionLdTracker() {
  const { text } = useLanguage();

  const [contractValue, setContractValue] = useState("");
  const [certifiedToDate, setCertifiedToDate] = useState("");
  const [retentionPct, setRetentionPct] = useState("10");
  const [retentionCapPct, setRetentionCapPct] = useState("5");

  const [plannedCompletion, setPlannedCompletion] = useState("");
  const [actualCompletion, setActualCompletion] = useState("");
  const [ldRatePctPerDay, setLdRatePctPerDay] = useState("0.05");
  const [ldCapPct, setLdCapPct] = useState("10");

  const result = useMemo(() => {
    const cv = toNumber(contractValue);
    const certified = toNumber(certifiedToDate);
    const retPct = toNumber(retentionPct) / 100;
    const retCapPct = toNumber(retentionCapPct) / 100;
    const ldRate = toNumber(ldRatePctPerDay) / 100;
    const ldCap = toNumber(ldCapPct) / 100;

    const retentionCapAmount = cv * retCapPct;
    const retentionRaw = certified * retPct;
    const retentionHeld = Math.min(retentionRaw, retentionCapAmount);
    const releaseAtTakingOver = retentionHeld / 2;
    const releaseAtDlpEnd = retentionHeld / 2;

    const delayDays = Math.max(0, daysBetween(plannedCompletion, actualCompletion));
    const ldRaw = delayDays * ldRate * cv;
    const ldCapAmount = cv * ldCap;
    const ldAmount = Math.min(ldRaw, ldCapAmount);
    const ldCapped = ldRaw > ldCapAmount && ldCapAmount > 0;

    const totalWithheld = retentionHeld + ldAmount;

    return {
      retentionCapAmount,
      retentionHeld,
      releaseAtTakingOver,
      releaseAtDlpEnd,
      delayDays,
      ldAmount,
      ldCapped,
      totalWithheld,
      cv,
    };
  }, [contractValue, certifiedToDate, retentionPct, retentionCapPct, plannedCompletion, actualCompletion, ldRatePctPerDay, ldCapPct]);

  const output = useMemo(() => {
    const line = "─".repeat(52);
    return [
      text("RETENTION & LIQUIDATED DAMAGES SUMMARY", "សេចក្តីសង្ខេបប្រាក់តម្កល់ទុក និងសំណងការយឺតយ៉ាវ"),
      line,
      `${text("Contract Value", "តម្លៃកិច្ចសន្យា")}: ${money(result.cv)}`,
      `${text("Certified to Date", "ចំនួនប្រាក់បានបញ្ជាក់រហូតដល់ពេលនេះ")}: ${money(toNumber(certifiedToDate))}`,
      "",
      text("RETENTION", "ប្រាក់តម្កល់ទុក"),
      line,
      `${text("Retention held (capped)", "ប្រាក់តម្កល់ទុកកាន់ទុក (កម្រិតកំពូល)")}: ${money(result.retentionHeld)}`,
      `${text("Retention cap", "កម្រិតកំពូលប្រាក់តម្កល់ទុក")}: ${money(result.retentionCapAmount)}`,
      `${text("Release at Taking-Over (50%)", "ការដោះលែងនៅពេលប្រគល់ទទួលការងារ (៥០%)")}: ${money(result.releaseAtTakingOver)}`,
      `${text("Release at end of DLP (50%)", "ការដោះលែងនៅចុងបញ្ចប់រយៈពេលធានា (៥០%)")}: ${money(result.releaseAtDlpEnd)}`,
      "",
      text("LIQUIDATED DAMAGES", "សំណងការយឺតយ៉ាវ"),
      line,
      `${text("Delay days", "ចំនួនថ្ងៃយឺតយ៉ាវ")}: ${result.delayDays}`,
      `${text("LD amount", "ចំនួនសំណងការយឺតយ៉ាវ")}: ${money(result.ldAmount)}${result.ldCapped ? ` (${text("capped", "កម្រិតកំពូល")})` : ""}`,
      "",
      text("TOTAL CURRENTLY WITHHELD", "ចំនួនសរុបដែលកាន់ទុកបច្ចុប្បន្ន"),
      line,
      money(result.totalWithheld),
      "",
      text(
        "Note: Retention/LD rates and caps vary by contract — confirm the figures above against your specific contract conditions before relying on them.",
        "កំណត់ចំណាំ៖ អត្រា និងកម្រិតកំពូលនៃប្រាក់តម្កល់ទុក/សំណងការយឺតយ៉ាវប្រែប្រួលទៅតាមកិច្ចសន្យា សូមផ្ទៀងផ្ទាត់តម្លៃខាងលើជាមួយលក្ខខណ្ឌកិច្ចសន្យារបស់អ្នកជាមុនសិន។"
      ),
    ].join("\n");
  }, [result, certifiedToDate, text]);

  return (
    <ToolShell
      title="Retention & Liquidated Damages Tracker"
      khmerTitle="តាមដានប្រាក់តម្កល់ទុក និងសំណងការយឺតយ៉ាវ"
      description="Estimate retention held and liquidated damages accrued on a construction contract based on your own rates and dates."
      descriptionKm="ប៉ាន់ស្មានប្រាក់តម្កល់ទុកកាន់ទុក និងសំណងការយឺតយ៉ាវលើកិច្ចសន្យាសំណង់ ដោយផ្អែកលើអត្រា និងកាលបរិច្ឆេទផ្ទាល់ខ្លួនរបស់អ្នក។"
    >
      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <h2 className="font-medium text-[var(--ink)]">{text("Contract & retention", "កិច្ចសន្យា និងប្រាក់តម្កល់ទុក")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Contract value (USD)" labelKm="តម្លៃកិច្ចសន្យា (USD)">
            <TextInput type="number" min="0" value={contractValue} onChange={(e) => setContractValue(e.target.value)} />
          </Field>
          <Field label="Certified payment to date (USD)" labelKm="ចំនួនប្រាក់បានបញ្ជាក់រហូតដល់ពេលនេះ (USD)">
            <TextInput type="number" min="0" value={certifiedToDate} onChange={(e) => setCertifiedToDate(e.target.value)} />
          </Field>
          <Field label="Retention rate (%)" labelKm="អត្រាប្រាក់តម្កល់ទុក (%)" hint="typical 10%" hintKm="ធម្មតា ១០%">
            <TextInput type="number" min="0" max="100" value={retentionPct} onChange={(e) => setRetentionPct(e.target.value)} />
          </Field>
          <Field label="Retention cap (% of contract)" labelKm="កម្រិតកំពូលប្រាក់តម្កល់ទុក (% នៃកិច្ចសន្យា)" hint="typical 5%" hintKm="ធម្មតា ៥%">
            <TextInput type="number" min="0" max="100" value={retentionCapPct} onChange={(e) => setRetentionCapPct(e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <h2 className="font-medium text-[var(--ink)]">{text("Delay & liquidated damages", "ការយឺតយ៉ាវ និងសំណង")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Planned completion date" labelKm="កាលបរិច្ឆេទបញ្ចប់ដែលបានគ្រោងទុក">
            <TextInput type="date" value={plannedCompletion} onChange={(e) => setPlannedCompletion(e.target.value)} />
          </Field>
          <Field label="Actual / expected completion date" labelKm="កាលបរិច្ឆេទបញ្ចប់ជាក់ស្តែង / ការគ្រោងទុក">
            <TextInput type="date" value={actualCompletion} onChange={(e) => setActualCompletion(e.target.value)} />
          </Field>
          <Field label="LD rate (% of contract value / day)" labelKm="អត្រាសំណង (% នៃតម្លៃកិច្ចសន្យា / ថ្ងៃ)">
            <TextInput type="number" min="0" step="0.01" value={ldRatePctPerDay} onChange={(e) => setLdRatePctPerDay(e.target.value)} />
          </Field>
          <Field label="LD cap (% of contract value)" labelKm="កម្រិតកំពូលសំណង (% នៃតម្លៃកិច្ចសន្យា)" hint="typical 10%" hintKm="ធម្មតា ១០%">
            <TextInput type="number" min="0" max="100" value={ldCapPct} onChange={(e) => setLdCapPct(e.target.value)} />
          </Field>
        </div>
      </section>

      <Output label={text("Retention & LD summary", "សេចក្តីសង្ខេបប្រាក់តម្កល់ទុក និងសំណង")} value={output} mono={false} />
    </ToolShell>
  );
}
