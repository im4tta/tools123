"use client";
import { useEffect, useMemo, useState } from "react";
import { ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { toKhmerDigits } from "@/lib/khmer-date";
import { useLanguage } from "@/components/LanguageProvider";
import momentkh from "@thyrith/momentkh";

const ANIMALS = [
  ["ជូត", "Rat"], ["ឆ្លូវ", "Ox"], ["ខាល", "Tiger"], ["ថោះ", "Rabbit"],
  ["រោង", "Dragon"], ["ម្សាញ់", "Snake"], ["មមី", "Horse"], ["មមែ", "Goat"],
  ["វក", "Monkey"], ["រកា", "Rooster"], ["ច", "Dog"], ["កុរ", "Pig"],
];

export default function KhmerNewYearCountdown() {
  const { text: t } = useLanguage();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const target = useMemo(() => {
    try {
      const year = now.getFullYear();
      let info = momentkh.getNewYear(year);
      let date = new Date(info.year, info.month - 1, info.day, info.hour, info.minute);
      if (date.getTime() <= now.getTime()) {
        info = momentkh.getNewYear(year + 1);
        date = new Date(info.year, info.month - 1, info.day, info.hour, info.minute);
      }
      return { info, date };
    } catch {
      return null;
    }
  }, [now]);

  const zodiac = useMemo(() => {
    try {
      const k = momentkh.fromGregorian(now.getFullYear(), now.getMonth() + 1, now.getDate(), 12, 0, 0).khmer;
      return { km: k.animalYearName, en: ANIMALS[k.animalYear % 12][1] };
    } catch {
      return null;
    }
  }, [now]);

  const diff = target ? Math.max(0, target.date.getTime() - now.getTime()) : 0;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const targetLine = target
    ? `${toKhmerDigits(target.info.day)}/${toKhmerDigits(target.info.month)}/${toKhmerDigits(target.info.year)} — ${toKhmerDigits(String(target.info.hour).padStart(2, "0"))}:${toKhmerDigits(String(target.info.minute).padStart(2, "0"))}`
    : "";

  const units = [
    { label: t("Days", "ថ្ងៃ"), value: toKhmerDigits(String(days).padStart(2, "0")) },
    { label: t("Hours", "ម៉ោង"), value: toKhmerDigits(String(hours).padStart(2, "0")) },
    { label: t("Minutes", "នាទី"), value: toKhmerDigits(String(minutes).padStart(2, "0")) },
    { label: t("Seconds", "វិនាទី"), value: toKhmerDigits(String(seconds).padStart(2, "0")) },
  ];

  return (
    <ToolShell
      title="Khmer New Year Countdown"
      khmerTitle="រាប់ថយក្រោយចូលឆ្នាំខ្មែរ"
      description="Live countdown to the next Khmer New Year (Moha Songkran). Songkran commonly falls around April 13–16, but the exact date and time vary every year and are announced officially — the moment shown below is an astronomical estimate, not the official announcement."
      descriptionKm="រាប់ថយក្រោយផ្ទាល់ដល់ពេលចូលឆ្នាំខ្មែរបន្ទាប់ (មហាសង្រ្កាន្ត)។ សង្រ្កាន្តច្រើនធ្លាក់នៅថ្ងៃទី ១៣–១៦ មេសា ប៉ុន្តែកាលបរិច្ឆេទ និងម៉ោងពិតប្រាកដប្រែប្រួលរាល់ឆ្នាំ ហើយត្រូវប្រកាសជាផ្លូវការ — ពេលវេលាដែលបង្ហាញខាងក្រោមគ្រាន់តែជាការប៉ាន់ស្មានតាមតារាសាស្ត្រ មិនមែនជាសេចក្តីប្រកាសផ្លូវការទេ។"
    >
      <div className="rounded-md border border-[var(--gold)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--gold)]">
        {t("Khmer New Year falls around mid-April each year (commonly April 13–16). The exact Songkran moment is announced officially — treat this countdown as an approximation.", "ចូលឆ្នាំខ្មែរធ្លាក់នៅពាក់កណ្ដាលខែមេសារាល់ឆ្នាំ (ជាទូទៅថ្ងៃទី ១៣–១៦ មេសា)។ ពេលសង្រ្កាន្តពិតប្រាកដត្រូវប្រកាសជាផ្លូវការ — សូមចាត់ទុកការរាប់នេះជាការប៉ាន់ស្មាន។")}
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {units.map((u) => (
          <div key={u.label} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2 py-4 text-center">
            <div className="font-khmer text-2xl font-bold leading-none text-[var(--ink)] sm:text-4xl">{u.value}</div>
            <div className="mt-2 text-[10px] uppercase tracking-wide text-[var(--ink-dim)]">{u.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
            {t("Next Moha Songkran (estimate)", "សង្រ្កាន្តបន្ទាប់ (ការប៉ាន់ស្មាន)")}
          </div>
          <Output value={targetLine} mono error={!target} />
        </div>
        <div>
          <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
            {t("Current Khmer zodiac year", "ឆ្នាំសត្វខ្មែរបច្ចុប្បន្ន")}
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5">
            {zodiac ? (
              <span className="font-khmer text-sm text-[var(--ink)]">
                {toKhmerDigits(now.getFullYear())} — {zodiac.km} ({zodiac.en})
              </span>
            ) : (
              <span className="text-sm text-[var(--danger)]">{t("Unavailable", "មិនអាចគណនាបាន")}</span>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-[var(--ink-dim)]">
        {t("The animal year and Songkran moment follow the traditional Khmer lunisolar calendar (same calculation as the Khmer Full Lunar Date tool). The exact holiday dates are announced officially by the authorities each year.", "ឆ្នាំសត្វ និងពេលសង្រ្កាន្ត អនុវត្តតាមប្រតិទិនចន្ទគតិខ្មែរ (ក្បួនគណនាដូចគ្នានឹងឧបករណ៍ប្រតិទិនចន្ទគតិខ្មែរពេញលេញ)។ កាលបរិច្ឆេទបុណ្យផ្លូវការត្រូវប្រកាសដោយអាជ្ញាធររាល់ឆ្នាំ។")}
      </p>
    </ToolShell>
  );
}
