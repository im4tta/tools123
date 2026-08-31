"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface Activity {
  id: string;
  label: [string, string];
  met: number;
}

// MET values below are rounded approximations of common reference values
// (e.g. the Compendium of Physical Activities, Ainsworth et al.). They are
// NOT official figures — actual burn varies with intensity, terrain, and
// body composition. Each value is editable so users can match their effort.
const ACTIVITIES: Activity[] = [
  { id: "walk-slow", label: ["Walking (slow, 2 mph)", "ដើរយឺត (២ ម៉ាយ/ម៉ោង)"], met: 2.8 },
  { id: "walk-moderate", label: ["Walking (moderate, 3.5 mph)", "ដើរកម្រិតមធ្យម (៣.៥ ម៉ាយ/ម៉ោង)"], met: 4.3 },
  { id: "run-5", label: ["Running (5 mph)", "រត់ (៥ ម៉ាយ/ម៉ោង)"], met: 8.3 },
  { id: "run-6", label: ["Running (6 mph)", "រត់ (៦ ម៉ាយ/ម៉ោង)"], met: 9.8 },
  { id: "cycle-leisure", label: ["Cycling (leisurely)", "ជិះកង់កម្សាន្ត"], met: 4.0 },
  { id: "cycle-moderate", label: ["Cycling (moderate)", "ជិះកង់កម្រិតមធ្យម"], met: 8.0 },
  { id: "swim-leisure", label: ["Swimming (leisurely)", "ហែលទឹកកម្សាន្ត"], met: 6.0 },
  { id: "swim-vigorous", label: ["Swimming (vigorous)", "ហែលទឹកខ្លាំង"], met: 9.8 },
  { id: "cleaning-light", label: ["Cleaning (light)", "សម្អាតស្រាល"], met: 3.3 },
  { id: "cleaning-vigorous", label: ["Cleaning (vigorous)", "សម្អាតខ្លាំង"], met: 4.3 },
  { id: "cooking", label: ["Cooking / food prep", "ចំអិន / រៀបចំម្ហូប"], met: 2.5 },
  { id: "gardening", label: ["Gardening", "ថែសួន"], met: 4.0 },
  { id: "yoga", label: ["Yoga / stretching", "យូហ្គា / លាតសាច់ដុំ"], met: 2.5 },
  { id: "desk", label: ["Desk work (sitting)", "ការងារតុ (អង្គុយ)"], met: 1.3 },
];

export default function CaloriesBurned() {
  const { text: t } = useLanguage();
  const [activityId, setActivityId] = useToolState("calories-burned:activity", "walk-moderate");
  const [met, setMet] = useToolState("calories-burned:met", "4.3");
  const [weight, setWeight] = useToolState("calories-burned:weight", "60");
  const [minutes, setMinutes] = useToolState("calories-burned:minutes", "30");

  function selectActivity(id: string) {
    setActivityId(id);
    const activity = ACTIVITIES.find((x) => x.id === id);
    if (activity) setMet(String(activity.met));
  }

  const calc = useMemo(() => {
    const m = Number(met);
    const w = Number(weight);
    const min = Number(minutes);
    if ([m, w, min].some((n) => Number.isNaN(n) || n <= 0)) return null;
    const hours = min / 60;
    const kcal = m * w * hours;
    return { kcal, perHour: m * w, hours };
  }, [met, weight, minutes]);

  return (
    <ToolShell
      title="Calories Burned by Activity"
      khmerTitle="កាឡូរីដុតតាមសកម្មភាព"
      description="Estimate calories burned from an activity's MET value, your weight, and the time spent. Every figure here is approximate."
      descriptionKm="ប៉ាន់ស្មានកាឡូរីដុតពីតម្លៃ MET នៃសកម្មភាព ទម្ងន់របស់អ្នក និងរយៈពេល។ រាល់លេខនៅទីនេះគ្រាន់តែប្រហាក់ប្រហែលប៉ុណ្ណោះ។"
    >
      <Row>
        <Field label={t("Activity", "សកម្មភាព")}>
          <Select value={activityId} onChange={(e) => selectActivity(e.target.value)}>
            {ACTIVITIES.map((act) => (
              <option key={act.id} value={act.id}>
                {t(act.label[0], act.label[1])}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("MET value (editable)", "តម្លៃ MET (កែបាន)")} hint={t("approx.", "ប្រហាក់ប្រហែល")}>
          <TextInput inputMode="decimal" value={met} onChange={(e) => setMet(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Weight", "ទម្ងន់")} hint={t("kg", "គីឡូក្រាម")}>
          <TextInput inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Duration", "រយៈពេល")} hint={t("minutes", "នាទី")}>
          <TextInput inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>

      {calc ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Estimated calories burned", "កាឡូរីដុតប៉ាន់ស្មាន")}</div>
              <div className="mt-1 text-2xl font-semibold text-[var(--gold)]">
                {Math.round(calc.kcal)} <span className="text-xs font-normal text-[var(--ink-dim)]">kcal</span>
              </div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Per hour rate", "អត្រាក្នុងមួយម៉ោង")}</div>
              <div className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                {Math.round(calc.perHour)} <span className="text-xs font-normal text-[var(--ink-dim)]">kcal/h</span>
              </div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Time spent", "ពេលវេលាចំណាយ")}</div>
              <div className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                {calc.hours.toFixed(2)} <span className="text-xs font-normal text-[var(--ink-dim)]">h</span>
              </div>
              <div className="mt-0.5 text-[10px] text-[var(--ink-dim)]">
                {t("MET × weight kg × hours", "MET × ទម្ងន់ គីឡូក្រាម × ម៉ោង")}
              </div>
            </div>
          </div>

          <p className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
            {t(
              "MET values are rounded approximations drawn from common references such as the Compendium of Physical Activities (Ainsworth et al.). Actual calories depend on intensity, terrain, body composition and fitness — treat every result here as an estimate, not an official figure.",
              "តម្លៃ MET គឺជាតម្លៃប្រហាក់ប្រហែល យកពីឯកសារយោងទូទៅដូចជា Compendium of Physical Activities (Ainsworth et al.)។ កាឡូរីពិតប្រាកដអាស្រ័យលើកម្រិតខ្លាំង ផ្លូវដី សមាសភាពរាងកាយ និងកាយសម្បទា — សូមចាត់ទុករាល់លទ្ធផលនៅទីនេះជាការប៉ាន់ស្មាន មិនមែនតួលេខផ្លូវការទេ។"
            )}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">
          {t("Enter a positive MET value, weight and duration.", "សូមបញ្ចូលតម្លៃ MET ទម្ងន់ និងរយៈពេលដែលវិជ្ជមាន។")}
        </p>
      )}
    </ToolShell>
  );
}
