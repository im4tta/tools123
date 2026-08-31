"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { localIsoToday } from "@/lib/khmer-date";
import { useLanguage } from "@/components/LanguageProvider";
import momentkh from "@thyrith/momentkh";

const KH = "០១២៣៤៥៦៧៨៩";
const toKh = (n: number) => String(n).split("").map((d) => (KH[Number(d)] ?? d)).join("");

const GREGORIAN_MONTHS = [
  ["January", "មករា"], ["February", "កុម្ភៈ"], ["March", "មីនា"], ["April", "មេសា"],
  ["May", "ឧសភា"], ["June", "មិថុនា"], ["July", "កក្កដា"], ["August", "សីហា"],
  ["September", "កញ្ញា"], ["October", "តុលា"], ["November", "វិច្ឆិកា"], ["December", "ធ្នូ"],
];

const WEEKDAYS = [
  ["Mon", "ចន្ទ"], ["Tue", "អង្គារ"], ["Wed", "ពុធ"], ["Thu", "ព្រហ"],
  ["Fri", "សុក្រ"], ["Sat", "សៅរ៍"], ["Sun", "អាទិត្យ"],
];

interface Cell {
  day: number;
  lunar: string;
  failed: boolean;
}

export default function KhmerLunarCalendar() {
  const { text: t } = useLanguage();
  const [ym, setYm] = useToolState("khmer-lunar-calendar:ym", localIsoToday().slice(0, 7));

  const data = useMemo(() => {
    const match = /^(\d{4})-(\d{2})$/.exec(ym);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]); // 1..12
    if (year < 1900 || year > 2100) return null;

    const daysInMonth = new Date(year, month, 0).getDate();
    const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Monday-first

    const cells: Cell[] = [];
    const monthNames = new Set<string>();
    let animalYearName = "";
    for (let d = 1; d <= daysInMonth; d++) {
      try {
        const k = momentkh.fromGregorian(year, month, d, 12, 0, 0).khmer;
        cells.push({ day: d, lunar: `${toKh(k.day)}${k.moonPhaseName}`, failed: false });
        monthNames.add(k.monthName);
        if (d === 15) animalYearName = k.animalYearName;
      } catch {
        cells.push({ day: d, lunar: "", failed: true });
      }
    }
    return { year, month, daysInMonth, offset, cells, monthNames: [...monthNames], animalYearName };
  }, [ym]);

  const shiftMonth = (delta: number) => {
    if (!data) return;
    const next = new Date(data.year, data.month - 1 + delta, 1);
    const ny = next.getFullYear();
    if (ny < 1900 || ny > 2100) return;
    setYm(`${ny}-${String(next.getMonth() + 1).padStart(2, "0")}`);
  };

  const today = localIsoToday();
  const gregorian = data ? GREGORIAN_MONTHS[data.month - 1] : null;

  return (
    <ToolShell
      title="Khmer Lunar Month Calendar"
      khmerTitle="ប្រតិទិនចន្ទគតិប្រចាំខែ"
      description="Month-grid view that shows the traditional lunar day for every date: កើត (waxing) or រោច (waning) with its day number, the lunar month name, and the zodiac animal year. Uses the same astronomical algorithm as the Khmer Full Lunar Date tool. Approximate — the official calendar is announced separately."
      descriptionKm="ទិដ្ឋភាពសំណាញ់ប្រចាំខែ បង្ហាញថ្ងៃចន្ទគតិសម្រាប់រាល់កាលបរិច្ឆេទ៖ កើត ឬ រោច ជាមួយលេខថ្ងៃ ឈ្មោះខែចន្ទគតិ និងឆ្នាំសត្វ។ ប្រើក្បួនគណនាតារាសាស្ត្រដូចគ្នានឹងឧបករណ៍ប្រតិទិនចន្ទគតិខ្មែរពេញលេញ។ ប្រហាក់ប្រហែល — ប្រតិទិនផ្លូវការត្រូវប្រកាសដោយឡែក។"
    >
      {data && gregorian ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button onClick={() => shiftMonth(-1)}><>{t("Previous month", "ខែមុន")}</></Button>
            <Field label="Month" labelKm="ខែ">
              <TextInput type="month" value={ym} onChange={(e) => setYm(e.target.value)} className="w-44 font-mono-ui" />
            </Field>
            <Button onClick={() => shiftMonth(1)}><>{t("Next month", "ខែបន្ទាប់")}</></Button>
          </div>

          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 className="font-khmer text-lg font-semibold text-[var(--ink)]">
                {t(gregorian[0], gregorian[1])} {toKh(data.year)}
              </h2>
              <div className="text-xs text-[var(--ink-dim)]">
                <span className="font-khmer text-[var(--gold)]">{t("Lunar month", "ខែចន្ទគតិ")}: {data.monthNames.join(" / ")}</span>
              </div>
            </div>
            {data.animalYearName && (
              <div className="mt-0.5 text-xs text-[var(--ink-dim)]">
                {t("Zodiac animal year", "ឆ្នាំសត្វ")}: <span className="font-khmer">{data.animalYearName}</span>{" "}
                <span className="text-[var(--ink-dim)]">({t("approximate — advances at Songkran", "ប្រហាក់ប្រហែល — ប្ដូរនៅពេលសង្រ្កាន្ត")})</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map(([en, km]) => (
              <div key={en} className="px-1 py-1 text-center text-[10px] uppercase tracking-wide text-[var(--ink-dim)]">
                {t(en, km)}
              </div>
            ))}
            {Array.from({ length: data.offset }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {data.cells.map((c) => {
              const iso = `${data.year}-${String(data.month).padStart(2, "0")}-${String(c.day).padStart(2, "0")}`;
              const isToday = iso === today;
              return (
                <div
                  key={c.day}
                  className={`min-h-14 rounded-md border px-1 py-1 text-center ${
                    isToday
                      ? "border-[var(--gold)] bg-[var(--gold)]/15"
                      : "border-[var(--ground-line)] bg-[var(--ground-raised)]"
                  }`}
                >
                  <div className={`text-xs ${isToday ? "font-semibold text-[var(--gold)]" : "text-[var(--ink-dim)]"}`}>
                    {toKh(c.day)}
                  </div>
                  <div className={`font-khmer text-sm leading-tight ${c.failed ? "text-[var(--danger)]" : "text-[var(--ink)]"}`}>
                    {c.lunar || "—"}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-[var(--ink-dim)]">
            {t("កើត = waxing moon (days 1–15) · រោច = waning moon (days 1–14/15).", "កើត = ខែឡើង (ថ្ងៃទី ១–១៥) · រោច = ខែរនោច (ថ្ងៃទី ១–១៤/១៥)។")}
          </p>
        </>
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter a valid month (YYYY-MM).", "សូមបញ្ចូលខែឱ្យបានត្រឹមត្រូវ (ឆ្នាំ-ខែ)។")}</p>
      )}

      <p className="text-xs text-[var(--ink-dim)]">
        {t("Approximate: computed in your browser from the traditional astronomical tables; individual editions of the Khmer calendar can differ by a day, and official holiday dates are announced by the authorities each year.", "ប្រហាក់ប្រហែល៖ គណនាក្នុងឧបករណ៍របស់អ្នកតាមតារាងតារាសាស្ត្រប្រពៃណី ប្រតិទិននីមួយៗអាចខុសមួយថ្ងៃ ហើយកាលបរិច្ឆេទបុណ្យផ្លូវការត្រូវប្រកាសដោយអាជ្ញាធររាល់ឆ្នាំ។")}
      </p>
    </ToolShell>
  );
}
