"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// Max heart rate: HRmax ≈ 220 − age (the classic Fox & Haskell "220-age"
// formula — a rough population estimate; true max varies by individual).
// Karvonen formula (Karvonen et al., 1957) for reserve-based zones:
//   target HR = (HRmax − HRrest) × intensity% + HRrest
// Zone intensity ranges below follow common 5-zone training models.

interface Zone {
  id: string;
  label: [string, string];
  maxLo: number;
  maxHi: number;
  hrrLo: number;
  hrrHi: number;
}

const ZONES: Zone[] = [
  { id: "Z1", label: ["Very light — warm-up & recovery", "ស្រាលខ្លាំង — កម្តៅសាច់ដុំ និងសម្រាក"], maxLo: 50, maxHi: 60, hrrLo: 30, hrrHi: 40 },
  { id: "Z2", label: ["Light — endurance base", "ស្រាល — មូលដ្ឋានការស៊ូទ្រាំ"], maxLo: 60, maxHi: 70, hrrLo: 40, hrrHi: 60 },
  { id: "Z3", label: ["Moderate — aerobic / tempo", "មធ្យម — អេរ៉ូប៊ិក / តេមប៉ូ"], maxLo: 70, maxHi: 80, hrrLo: 60, hrrHi: 70 },
  { id: "Z4", label: ["Hard — threshold", "ខ្លាំង — កម្រិតកំណត់"], maxLo: 80, maxHi: 90, hrrLo: 70, hrrHi: 85 },
  { id: "Z5", label: ["Maximum — sprint", "អតិបរមា — រត់ប្រញាប់"], maxLo: 90, maxHi: 100, hrrLo: 85, hrrHi: 100 },
];

export default function HeartRateZones() {
  const { text: t } = useLanguage();
  const [age, setAge] = useToolState("heart-rate:age", "30");
  const [rest, setRest] = useToolState("heart-rate:rest", "");

  const data = useMemo(() => {
    const a = Number(age);
    if (Number.isNaN(a) || a < 1 || a > 120) return null;
    const maxHR = 220 - a;
    const restHR = rest.trim() === "" ? null : Number(rest);
    if (restHR !== null && (Number.isNaN(restHR) || restHR < 30 || restHR > 150)) return null;
    const zones = ZONES.map((z) => ({
      ...z,
      maxBpm: [Math.round((maxHR * z.maxLo) / 100), Math.round((maxHR * z.maxHi) / 100)] as [number, number],
      hrrBpm:
        restHR === null
          ? null
          : ([Math.round(restHR + ((maxHR - restHR) * z.hrrLo) / 100), Math.round(restHR + ((maxHR - restHR) * z.hrrHi) / 100)] as [number, number]),
    }));
    return { maxHR, restHR, zones };
  }, [age, rest]);

  return (
    <ToolShell
      title="Heart Rate Zones"
      khmerTitle="តំបន់ចង្វាក់បេះដូង"
      description="Find your heart-rate training zones from age, with optional resting heart rate for Karvonen-based zones."
      descriptionKm="ស្វែងរកតំបន់ចង្វាក់បេះដូងសម្រាប់ហាត់ប្រាណ ពីអាយុ និងចង្វាក់បេះដូងពេលសម្រាក (ស្រេចចិត្ត) តាមរូបមន្តខាវ៉ូណេន។"
    >
      <Row>
        <Field label={t("Age", "អាយុ")} hint={t("years", "ឆ្នាំ")}>
          <TextInput inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Resting heart rate (optional)", "ចង្វាក់បេះដូងពេលសម្រាក (ស្រេចចិត្ត)")} hint={t("bpm", "ចង្វាក់/នាទី")}>
          <TextInput
            inputMode="numeric"
            value={rest}
            onChange={(e) => setRest(e.target.value)}
            className="font-mono-ui"
            placeholder={t("e.g. 60", "ឧ. ៦០")}
          />
        </Field>
      </Row>

      {data ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                {t("Estimated max HR (220 − age)", "ចង្វាក់អតិបរមាប៉ាន់ស្មាន (២២០ − អាយុ)")}
              </div>
              <div className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                {data.maxHR} <span className="text-xs font-normal text-[var(--ink-dim)]">bpm</span>
              </div>
            </div>
            {data.restHR !== null && (
              <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                  {t("Heart rate reserve (HRmax − HRrest)", "ទុនចង្វាក់បេះដូង (អតិបរមា − ពេលសម្រាក)")}
                </div>
                <div className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                  {data.maxHR - data.restHR} <span className="text-xs font-normal text-[var(--ink-dim)]">bpm</span>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--ground-line)] bg-[var(--ground-raised)] text-left text-xs uppercase tracking-wide text-[var(--ink-faint)]">
                  <th className="px-3 py-2">{t("Zone", "តំបន់")}</th>
                  <th className="px-3 py-2">{t("Intensity", "កម្រិតខ្លាំង")}</th>
                  <th className="px-3 py-2">{t("% of max HR", "% នៃចង្វាក់អតិបរមា")}</th>
                  <th className="px-3 py-2">{t("BPM (of max)", "ចង្វាក់/នាទី (តាមអតិបរមា)")}</th>
                  {data.restHR !== null && <th className="px-3 py-2">{t("BPM (Karvonen)", "ចង្វាក់/នាទី (ខាវ៉ូណេន)")}</th>}
                </tr>
              </thead>
              <tbody>
                {data.zones.map((z) => (
                  <tr key={z.id} className="border-b border-[var(--ground-line)] last:border-0">
                    <td className="px-3 py-2 font-mono-ui font-semibold text-[var(--gold)]">{z.id}</td>
                    <td className="px-3 py-2 text-[var(--ink)]">{t(z.label[0], z.label[1])}</td>
                    <td className="px-3 py-2 font-mono-ui text-[var(--ink-dim)]">{z.maxLo}–{z.maxHi}%</td>
                    <td className="px-3 py-2 font-mono-ui text-[var(--ink)]">{z.maxBpm[0]}–{z.maxBpm[1]}</td>
                    {z.hrrBpm && <td className="px-3 py-2 font-mono-ui text-[var(--ink)]">{z.hrrBpm[0]}–{z.hrrBpm[1]}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
            {t("220 − age is a rough population estimate (Fox & Haskell); your true max may differ. Reserve-based zones use the Karvonen formula. Stop exercising and see a doctor if you feel chest pain, dizziness, or unusual shortness of breath.", "រូបមន្ត ២២០ − អាយុ គ្រាន់តែជាការប៉ាន់ស្មានតាមប្រជាជន (Fox & Haskell)។ តំបន់តាមចង្វាក់ពេលសម្រាក ប្រើរូបមន្តខាវ៉ូណេន។ សូមឈប់ហាត់ និងទៅជួបគ្រូពេទ្យ បើឈឺទ្រូង វិលមុខ ឬដកដង្ហើមខ្លីខុសប្រក្រតី។")}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">
          {t("Enter a valid age (and a resting heart rate between 30–150 if provided).", "សូមបញ្ចូលអាយុឱ្យបានត្រឹមត្រូវ (និងចង្វាក់ពេលសម្រាក ៣០–១៥០ បើមាន)។")}
        </p>
      )}
    </ToolShell>
  );
}
