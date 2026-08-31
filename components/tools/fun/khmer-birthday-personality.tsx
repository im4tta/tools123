"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface DayInfo {
  weekdayEn: string;
  weekdayKm: string;
  planetEn: string;
  planetKm: string;
  colorEn: string;
  colorKm: string;
  descEn: string;
  descKm: string;
}

// Indexed by Date.prototype.getDay(): 0 = Sunday … 6 = Saturday.
const DAYS: DayInfo[] = [
  {
    weekdayEn: "Sunday", weekdayKm: "ថ្ងៃអាទិត្យ", planetEn: "Sun", planetKm: "ព្រះអាទិត្យ",
    colorEn: "Red", colorKm: "ក្រហម",
    descEn: "Associated with the Sun: warm, confident, and drawn to leading — people notice you when you walk in.",
    descKm: "ជាប់ទាក់ទងនឹងព្រះអាទិត្យ៖ មានភាពកក់ក្ដៅ ជឿជាក់លើខ្លួនឯង ចូលចិត្តដឹកនាំ — មនុស្សចាប់អារម្មណ៍អ្នកពេលអ្នកចូលមក។",
  },
  {
    weekdayEn: "Monday", weekdayKm: "ថ្ងៃច័ន្ទ", planetEn: "Moon", planetKm: "ព្រះចន្ទ",
    colorEn: "Light yellow", colorKm: "លឿងស្រាល",
    descEn: "Associated with the Moon: gentle, calm, caring, and family-minded — a loyal friend and listener.",
    descKm: "ជាប់ទាក់ទងនឹងព្រះចន្ទ៖ ស្លូតបូត ស្ងប់ស្ងាត់ ចេះខ្វល់ខ្វាយ ស្រឡាញ់គ្រួសារ — ជាមិត្តស្មោះត្រង់ និងអ្នកស្ដាប់ល្អ។",
  },
  {
    weekdayEn: "Tuesday", weekdayKm: "ថ្ងៃអង្គារ", planetEn: "Mars", planetKm: "អង្គារ",
    colorEn: "Pink", colorKm: "ផ្កាឈូក",
    descEn: "Associated with Mars: brave, energetic, and quick to act — passionate, though sometimes impatient.",
    descKm: "ជាប់ទាក់ទងនឹងភពអង្គារ៖ ក្លាហាន ស្វាហាប់ រហ័សរហួន — មានចិត្តក្លៀវក្លា ប៉ុន្តែពេលខ្លះអន្ទះអន្ទែង។",
  },
  {
    weekdayEn: "Wednesday", weekdayKm: "ថ្ងៃពុធ", planetEn: "Mercury", planetKm: "ពុធ",
    colorEn: "Green", colorKm: "បៃតង",
    descEn: "Associated with Mercury: clever, curious, quick-minded, and good at learning, trade, and words.",
    descKm: "ជាប់ទាក់ទងនឹងភពពុធ៖ ឆ្លាត ចេះចង់ដឹង គំនិតលឿន ពូកែរៀន ជំនួញ និងការនិយាយ។",
  },
  {
    weekdayEn: "Thursday", weekdayKm: "ថ្ងៃព្រហស្បតិ៍", planetEn: "Jupiter", planetKm: "ព្រហស្បតិ៍",
    colorEn: "Orange", colorKm: "ទឹកក្រូច",
    descEn: "Associated with Jupiter: wise, calm, and respected — a natural teacher and adviser others trust.",
    descKm: "ជាប់ទាក់ទងនឹងភពព្រហស្បតិ៍៖ ឈ្លាសវៃ ស្ងប់ស្ងាត់ គេគោរព — ជាអ្នកបង្រៀន និងទីប្រឹក្សាដែលគេទុកចិត្ត។",
  },
  {
    weekdayEn: "Friday", weekdayKm: "ថ្ងៃសុក្រ", planetEn: "Venus", planetKm: "សុក្រ",
    colorEn: "Blue", colorKm: "ខៀវ",
    descEn: "Associated with Venus: sociable, artistic, charming, and expressive — the heart of any gathering.",
    descKm: "ជាប់ទាក់ទងនឹងភពសុក្រ៖ រួសរាយ មានសិល្បៈ មានមន្តស្នេហ៍ ចេះបញ្ចេញមតិ — ជាទីសប្បាយរីករាយក្នុងពិធីជួបជុំ។",
  },
  {
    weekdayEn: "Saturday", weekdayKm: "ថ្ងៃសៅរ៍", planetEn: "Saturn", planetKm: "សៅរ៍",
    colorEn: "Dark blue", colorKm: "ខៀវចាស់",
    descEn: "Associated with Saturn: hardworking, patient, serious, and dependable — steady through any storm.",
    descKm: "ជាប់ទាក់ទងនឹងភពសៅរ៍៖ ឧស្សាហ៍ព្យាយាម អត់ធ្មត់ ធ្ងន់ធ្ងរ គួរទុកចិត្ត — រឹងមាំឆ្លងកាត់គ្រប់ព្យុះ។",
  },
];

export default function KhmerBirthdayPersonality() {
  const { text: t } = useLanguage();
  const [date, setDate] = useToolState("khmer-birthday:date", "");

  const result = useMemo(() => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!match) return null;
    const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const dt = new Date(y, m - 1, d, 12);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return DAYS[dt.getDay()];
  }, [date]);

  return (
    <ToolShell
      title="Khmer Birthday Personality"
      khmerTitle="លក្ខណៈបុគ្គលតាមថ្ងៃកំណើត"
      description="Enter a birth date to find its Khmer weekday name and a short personality reading for each of the seven days, based on traditional Khmer belief. Traditional belief, for fun — not scientific."
      descriptionKm="បញ្ចូលថ្ងៃខែឆ្នាំកំណើត ដើម្បីស្វែងរកឈ្មោះថ្ងៃជាភាសាខ្មែរ និងការពិពណ៌នាខ្លីៗអំពីបុគ្គលិកលក្ខណៈសម្រាប់ទាំងប្រាំពីរថ្ងៃ តាមជំនឿប្រពៃណីខ្មែរ។ ជំនឿប្រពៃណី សម្រាប់កម្សាន្ត — មិនមែនជាវិទ្យាសាស្ត្រទេ។"
    >
      <div className="rounded-md border border-[var(--gold)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--gold)]">
        {t("Traditional belief, for fun — not scientific.", "ជំនឿប្រពៃណី សម្រាប់កម្សាន្ត — មិនមែនជាវិទ្យាសាស្ត្រទេ។")}
      </div>

      <Field label="Birth date" labelKm="ថ្ងៃខែឆ្នាំកំណើត">
        <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-48 font-mono-ui" />
      </Field>

      {result ? (
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h2 className="font-khmer text-xl font-semibold text-[var(--ink)]">{result.weekdayKm}</h2>
            <span className="text-sm text-[var(--ink-dim)]">{result.weekdayEn}</span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded border border-[var(--ground-line)] px-2.5 py-1.5">
              <div className="text-[10px] uppercase tracking-wide text-[var(--ink-dim)]">{t("Planet", "ភព")}</div>
              <div className="text-sm font-medium text-[var(--ink)]">{t(result.planetEn, result.planetKm)}</div>
            </div>
            <div className="rounded border border-[var(--ground-line)] px-2.5 py-1.5">
              <div className="text-[10px] uppercase tracking-wide text-[var(--ink-dim)]">{t("Traditional color", "ពណ៌តំណាង")}</div>
              <div className="text-sm font-medium text-[var(--ink)]">{t(result.colorEn, result.colorKm)}</div>
            </div>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-dim)]">{result.descEn}</p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--ink-dim)]">{result.descKm}</p>
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter a valid birth date.", "សូមបញ្ចូលថ្ងៃខែឆ្នាំកំណើតឱ្យបានត្រឹមត្រូវ។")}</p>
      )}

      <p className="text-xs text-[var(--ink-dim)]">
        {t("Based on traditional Khmer belief — the seven weekdays each carry a planet and character in folk astrology. Curated reference; not a claim about any person.", "តាមជំនឿប្រពៃណីខ្មែរ — ថ្ងៃទាំងប្រាំពីរនៃសប្តាហ៍ នីមួយៗមានភព និងចរិតលក្ខណៈក្នុងហោរាសាស្ត្រប្រជាប្រិយ។ ឯកសារយោងដែលរើសរួច មិនមែនជាការបញ្ជាក់ពីបុគ្គលណាម្នាក់ទេ។")}
      </p>
    </ToolShell>
  );
}
