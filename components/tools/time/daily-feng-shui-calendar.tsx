"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Button, Output } from "@/components/ui/Output";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";

type Officer = { en: string; km: string; focusEn: string; focusKm: string; avoidEn: string; avoidKm: string };

const OFFICERS: Officer[] = [
  { en: "Establish", km: "បង្កើត", focusEn: "Set intentions and begin routine work", focusKm: "កំណត់បំណង និងចាប់ផ្តើមការងារប្រចាំ", avoidEn: "Overcommitting", avoidKm: "ការទទួលបន្ទុកលើសកម្រិត" },
  { en: "Remove", km: "ដកចេញ", focusEn: "Declutter, review, and resolve", focusKm: "រៀបចំ សើរើ និងដោះស្រាយ", avoidEn: "Unnecessary expansion", avoidKm: "ការពង្រីកដែលមិនចាំបាច់" },
  { en: "Full", km: "ពេញ", focusEn: "Complete and appreciate progress", focusKm: "បញ្ចប់ និងទទួលស្គាល់វឌ្ឍនភាព", avoidEn: "Taking on excess", avoidKm: "ការទទួលការងារច្រើនពេក" },
  { en: "Balance", km: "តុល្យភាព", focusEn: "Negotiate and rebalance plans", focusKm: "ចរចា និងធ្វើឱ្យផែនការមានតុល្យភាព", avoidEn: "One-sided decisions", avoidKm: "ការសម្រេចចិត្តម្ខាង" },
  { en: "Stable", km: "ស្ថិរភាព", focusEn: "Maintain systems and commitments", focusKm: "ថែរក្សាប្រព័ន្ធ និងការប្តេជ្ញា", avoidEn: "Abrupt changes", avoidKm: "ការផ្លាស់ប្តូរភ្លាមៗ" },
  { en: "Initiate", km: "ផ្តួចផ្តើម", focusEn: "Start a modest practical task", focusKm: "ចាប់ផ្តើមការងារជាក់ស្តែងតូចមួយ", avoidEn: "Irreversible choices", avoidKm: "ជម្រើសដែលមិនអាចត្រឡប់ក្រោយ" },
  { en: "Destruction", km: "បំបែក", focusEn: "End stale tasks and simplify", focusKm: "បញ្ចប់ការងារចាស់ និងធ្វើឱ្យសាមញ្ញ", avoidEn: "Major launches", avoidKm: "ការចាប់ផ្តើមគម្រោងធំ" },
  { en: "Danger", km: "ប្រុងប្រយ័ត្ន", focusEn: "Check risks and proceed carefully", focusKm: "ពិនិត្យហានិភ័យ និងធ្វើដោយប្រុងប្រយ័ត្ន", avoidEn: "Rushed commitments", avoidKm: "ការប្តេជ្ញាដោយប្រញាប់" },
  { en: "Success", km: "ជោគជ័យ", focusEn: "Finish visible, achievable work", focusKm: "បញ្ចប់ការងារដែលអាចសម្រេចបាន", avoidEn: "Assuming outcomes are guaranteed", avoidKm: "ការសន្មតថាលទ្ធផលត្រូវតែបាន" },
  { en: "Receive", km: "ទទួល", focusEn: "Gather information and resources", focusKm: "ប្រមូលព័ត៌មាន និងធនធាន", avoidEn: "Unclear obligations", avoidKm: "កាតព្វកិច្ចមិនច្បាស់" },
  { en: "Open", km: "បើក", focusEn: "Communicate and explore options", focusKm: "ទំនាក់ទំនង និងស្វែងរកជម្រើស", avoidEn: "Sharing sensitive details", avoidKm: "ការចែករំលែកព័ត៌មានរសើប" },
  { en: "Close", km: "បិទ", focusEn: "Conclude, archive, and rest", focusKm: "បញ្ចប់ រក្សាទុក និងសម្រាក", avoidEn: "Starting complex projects", avoidKm: "ការចាប់ផ្តើមគម្រោងស្មុគស្មាញ" },
];

const DAY_MS = 86_400_000;
const ANCHOR_UTC = Date.UTC(2000, 0, 7);
const localIso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function parseDate(value: string) {
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return null;
  const local = new Date(parts[0], parts[1] - 1, parts[2]);
  return localIso(local) === value ? local : null;
}

export default function DailyFengShuiCalendar() {
  const { text } = useLanguage();
  const [date, setDate] = useState(() => localIso(new Date()));
  const result = useMemo(() => {
    const parsed = parseDate(date);
    if (!parsed) return null;
    const utc = Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    const index = ((Math.round((utc - ANCHOR_UTC) / DAY_MS) % OFFICERS.length) + OFFICERS.length) % OFFICERS.length;
    return { parsed, officer: OFFICERS[index], position: index + 1 };
  }, [date]);

  function move(days: number) {
    const parsed = parseDate(date);
    if (!parsed) return;
    parsed.setDate(parsed.getDate() + days);
    setDate(localIso(parsed));
  }

  return (
    <ToolShell title="Daily Feng Shui Calendar" khmerTitle="ប្រតិទិនហុងស៊ុយប្រចាំថ្ងៃ" description="A transparent, date-based cultural planning prompt using a simplified 12-day cycle." descriptionKm="ឯកសារយោងផែនការវប្បធម៌តាមកាលបរិច្ឆេទ ដោយប្រើវដ្ត ១២ ថ្ងៃសាមញ្ញ។">
      <div className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-[var(--ink)]">
        <p className="font-semibold">{text("General cultural reference only. Traditions vary. This is not an authoritative almanac or professional advice.", "សម្រាប់ជាឯកសារយោងវប្បធម៌ទូទៅប៉ុណ្ណោះ។ ប្រពៃណីអាចខុសគ្នា។ នេះមិនមែនជាប្រតិទិនផ្លូវការ ឬដំបូន្មានវិជ្ជាជីវៈទេ។")}</p>
        <p><strong>{text("Rule / source basis:", "ក្បួន / មូលដ្ឋាន៖")}</strong> {text("A software-defined simplification cycles consecutive Gregorian dates through the 12 Day Officer labels. The fixed code anchor is 7 Jan 2000 = Establish; the result is date ordinal modulo 12. It does not calculate solar terms, lunar dates, birth data, directions, or a traditional almanac.", "ក្បួនសាមញ្ញដែលកំណត់ក្នុងកម្មវិធី បង្វិលកាលបរិច្ឆេទគ្រិស្តសករាជជាប់គ្នាតាមឈ្មោះថ្ងៃទាំង ១២។ ចំណុចយោងថេរក្នុងកូដគឺ ៧ មករា ២០០០ = បង្កើត ហើយលទ្ធផលគឺលំដាប់ថ្ងៃចែកសំណល់នឹង ១២។ វាមិនគណនារដូវព្រះអាទិត្យ ចន្ទគតិ ទិន្នន័យកំណើត ទិសដៅ ឬប្រតិទិនបុរាណទេ។")}</p>
      </div>
      <Field label="Local date" labelKm="កាលបរិច្ឆេទក្នុងតំបន់"><TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => move(-1)}>{text("Previous day", "ថ្ងៃមុន")}</Button>
        <Button type="button" onClick={() => setDate(localIso(new Date()))}>{text("Today", "ថ្ងៃនេះ")}</Button>
        <Button type="button" onClick={() => move(1)}>{text("Next day", "ថ្ងៃបន្ទាប់")}</Button>
      </div>
      <Output
        label={text("Cultural planning prompt", "គំនិតសម្រាប់ផែនការវប្បធម៌")}
        error={!result}
        mono={false}
        value={result ? `${new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(result.parsed)}\n${text("Cycle label", "ឈ្មោះក្នុងវដ្ត")}: ${text(result.officer.en, result.officer.km)} (${result.position}/12)\n${text("Planning focus", "ចំណុចផ្តោត")}: ${text(result.officer.focusEn, result.officer.focusKm)}\n${text("Consider avoiding", "គួរពិចារណាជៀសវាង")}: ${text(result.officer.avoidEn, result.officer.avoidKm)}` : text("Choose a valid local date.", "សូមជ្រើសរើសកាលបរិច្ឆេទក្នុងតំបន់ដែលត្រឹមត្រូវ។")}
      />
      <p className="text-xs text-[var(--ink-dim)]">{text("Use this as a reflective planning prompt, not as a prediction or a basis for medical, legal, financial, safety, or other consequential decisions.", "ប្រើវាជាគំនិតសម្រាប់ឆ្លុះបញ្ចាំងលើផែនការ មិនមែនជាការទស្សន៍ទាយ ឬមូលដ្ឋានសម្រាប់សេចក្តីសម្រេចផ្នែកវេជ្ជសាស្ត្រ ច្បាប់ ហិរញ្ញវត្ថុ សុវត្ថិភាព ឬការសម្រេចសំខាន់ផ្សេងទៀតទេ។")}</p>
    </ToolShell>
  );
}
