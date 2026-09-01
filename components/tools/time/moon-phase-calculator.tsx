"use client";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const SYNODIC_MONTH = 29.530588853; // days
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // reference mean new moon

const PHASES: [string, string][] = [
  ["New Moon", "ព្រះច័ន្ទថ្មី"],
  ["Waxing Crescent", "ព្រះច័ន្ទអឌ្ឍចន្ទរះ"],
  ["First Quarter", "ព្រះច័ន្ទត្រីមាសទី១"],
  ["Waxing Gibbous", "ព្រះច័ន្ទប៉ោងរះ"],
  ["Full Moon", "ព្រះច័ន្ទពេញវង់"],
  ["Waning Gibbous", "ព្រះច័ន្ទប៉ោងរសាយ"],
  ["Last Quarter", "ព្រះច័ន្ទត្រីមាសទី៣"],
  ["Waning Crescent", "ព្រះច័ន្ទអឌ្ឍចន្ទរសាយ"],
];

export default function MoonPhaseCalculator() {
  const { text: t } = useLanguage();
  const [date, setDate] = useToolState("moon-phase-calculator:date", new Date().toISOString().slice(0, 10));

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const valid = m !== null;
  const dateMs = valid ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : NaN;

  let phaseName: [string, string] | null = null;
  let illumination = 0;
  let age = 0;
  if (valid) {
    const daysSince = (dateMs - KNOWN_NEW_MOON) / 86400000;
    age = ((daysSince % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
    const position = age / SYNODIC_MONTH; // 0 = new, 0.5 = full
    illumination = (1 - Math.cos(2 * Math.PI * position)) / 2;
    phaseName = PHASES[Math.floor(position * 8 + 0.5) % 8];
  }

  return (
    <ToolShell
      title="Moon Phase Calculator"
      khmerTitle="គណនាដំណាក់កាលព្រះច័ន្ទ"
      description="Pick a date and see the approximate moon phase, illuminated fraction and age of the moon."
      descriptionKm="ជ្រើសរើសកាលបរិច្ឆេទ រួចមើលដំណាក់កាលព្រះច័ន្ទ ភាគរយពន្លឺ និងអាយុព្រះច័ន្ទប្រហាក់ប្រហែល។"
    >
      <Field label={t("Date", "កាលបរិច្ឆេទ")}>
        <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} className="font-mono-ui" />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Output
          label={t("Phase", "ដំណាក់កាល")}
          value={phaseName ? t(phaseName[0], phaseName[1]) : ""}
          error={!valid}
        />
        <Output
          label={t("Illumination", "ពន្លឺ")}
          value={valid ? `${(illumination * 100).toFixed(1)}%` : ""}
          error={!valid}
        />
        <Output
          label={t("Age of moon", "អាយុព្រះច័ន្ទ")}
          value={valid ? `${age.toFixed(1)} ${t("days", "ថ្ងៃ")}` : ""}
          error={!valid}
        />
      </div>

      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Approximate, using the standard mean-phase method: age = (days since the mean new moon of 2000-01-06 18:14 UTC) mod the synodic month (29.530588853 days), and illumination = (1 − cos(2π × age/synodic month)) / 2. Real phase times vary by several hours because of the moon's elliptical orbit, so results are not exact and should not be used for religious or calendar purposes. Khmer phase names are descriptive translations.",
          "ជាតម្លៃប្រហាក់ប្រហែល ដោយប្រើវិធីសាស្ត្រដំណាក់កាលមធ្យមស្តង់ដារ៖ អាយុ = (ចំនួនថ្ងៃចាប់ពីព្រះច័ន្ទថ្មីមធ្យមនៃ 2000-01-06 ម៉ោង 18:14 UTC) ម៉ូឌុលខែសុរិយគតិ (29.530588853 ថ្ងៃ) ហើយពន្លឺ = (1 − cos(2π × អាយុ/ខែសុរិយគតិ)) / 2។ ពេលវេលាពិតប្រែក្លាយពីរបីម៉ោង ដោយសារគន្លងរាងពងក្រពើរបស់ព្រះច័ន្ទ ដូច្នេះលទ្ធផលមិនច្បាស់លាស់ ហើយមិនគួរប្រើសម្រាប់កម្មវត្ថុសាសនា ឬប្រតិទិនទេ។ ឈ្មោះដំណាក់កាលជាភាសាខ្មែរជាការបកប្រែពណ៌នា។"
        )}
      </p>
    </ToolShell>
  );
}
