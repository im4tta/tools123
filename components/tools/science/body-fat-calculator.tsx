"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface Category {
  lo: number;
  hi: number;
  label: [string, string];
}

// General reference ranges commonly cited by fitness organisations (e.g. ACE).
// They are approximate guides, not medical thresholds.
const MALE_CATS: Category[] = [
  { lo: 0, hi: 5, label: ["Essential fat", "ខ្លាញ់សំខាន់"] },
  { lo: 6, hi: 13, label: ["Athletes", "អត្តពលិក"] },
  { lo: 14, hi: 17, label: ["Fitness", "កម្រិតសម្បទា"] },
  { lo: 18, hi: 24, label: ["Average", "មធ្យម"] },
  { lo: 25, hi: 100, label: ["Obese", "ធាត់លើសកម្រិត"] },
];

const FEMALE_CATS: Category[] = [
  { lo: 0, hi: 13, label: ["Essential fat", "ខ្លាញ់សំខាន់"] },
  { lo: 14, hi: 20, label: ["Athletes", "អត្តពលិក"] },
  { lo: 21, hi: 24, label: ["Fitness", "កម្រិតសម្បទា"] },
  { lo: 25, hi: 31, label: ["Average", "មធ្យម"] },
  { lo: 32, hi: 100, label: ["Obese", "ធាត់លើសកម្រិត"] },
];

function toInches(value: number, unit: string): number {
  return unit === "in" ? value : value / 2.54;
}

export default function BodyFatCalculator() {
  const { text: t } = useLanguage();
  const [sex, setSex] = useToolState("body-fat:sex", "male");
  const [unit, setUnit] = useToolState("body-fat:unit", "cm");
  const [height, setHeight] = useToolState("body-fat:height", "170");
  const [neck, setNeck] = useToolState("body-fat:neck", "38");
  const [waist, setWaist] = useToolState("body-fat:waist", "85");
  const [hip, setHip] = useToolState("body-fat:hip", "95");

  const calc = useMemo(() => {
    const h = Number(height);
    const n = Number(neck);
    const w = Number(waist);
    const hp = Number(hip);
    if ([h, n, w].some((v) => Number.isNaN(v) || v <= 0)) return null;
    if (sex === "female" && (Number.isNaN(hp) || hp <= 0)) return null;
    const H = toInches(h, unit);
    const N = toInches(n, unit);
    const W = toInches(w, unit);
    if (W <= N) return null;
    // US Navy circumference method (Hodgdon & Beckett).
    let bf: number;
    if (sex === "male") {
      bf = 495 / (1.0324 - 0.19077 * Math.log10(W - N) + 0.15456 * Math.log10(H)) - 450;
    } else {
      const Hip = toInches(hp, unit);
      bf = 495 / (1.29579 - 0.35004 * Math.log10(W + Hip - N) + 0.221 * Math.log10(H)) - 450;
    }
    const clamped = Math.max(0, Math.min(bf, 70));
    const cats = sex === "male" ? MALE_CATS : FEMALE_CATS;
    const cat = cats.find((c) => clamped >= c.lo && clamped <= c.hi) ?? cats[cats.length - 1];
    return { bf: clamped, cat };
  }, [sex, unit, height, neck, waist, hip]);

  return (
    <ToolShell
      title="Body Fat Calculator (US Navy)"
      khmerTitle="គណនាភាគរយខ្លាញ់ក្នុងខ្លួន (US Navy)"
      description="Estimate body fat percentage with the US Navy circumference method using height, neck, waist (and hip for women). This is an estimate, not a medical measurement."
      descriptionKm="ប៉ាន់ស្មានភាគរយខ្លាញ់ក្នុងខ្លួន ដោយវិធីសាស្ត្ររង្វាស់រង្វង់ US Navy ដោយប្រើកម្ពស់ ក ចង្កេះ (និងត្រគាកសម្រាប់ស្ត្រី)។ នេះជាការប៉ាន់ស្មាន មិនមែនជាការវាស់វែងផ្នែកវេជ្ជសាស្ត្រទេ។"
    >
      <Row>
        <Field label={t("Sex", "ភេទ")}>
          <Select value={sex} onChange={(e) => setSex(e.target.value)}>
            <option value="male">{t("Male", "ប្រុស")}</option>
            <option value="female">{t("Female", "ស្រី")}</option>
          </Select>
        </Field>
        <Field label={t("Units", "ឯកតា")}>
          <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="cm">{t("Centimetres", "សង់ទីម៉ែត្រ")}</option>
            <option value="in">{t("Inches", "អ៊ីញ")}</option>
          </Select>
        </Field>
        <Field label={t("Height", "កម្ពស់")} hint={unit}>
          <TextInput inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Neck", "ក")} hint={unit}>
          <TextInput inputMode="decimal" value={neck} onChange={(e) => setNeck(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Waist", "ចង្កេះ")} hint={unit}>
          <TextInput inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} className="font-mono-ui" />
        </Field>
        {sex === "female" && (
          <Field label={t("Hip", "ត្រគាក")} hint={unit}>
            <TextInput inputMode="decimal" value={hip} onChange={(e) => setHip(e.target.value)} className="font-mono-ui" />
          </Field>
        )}
      </Row>

      {calc ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                {t("Estimated body fat", "ភាគរយខ្លាញ់ប៉ាន់ស្មាន")}
              </div>
              <div className="mt-1 text-2xl font-semibold text-[var(--gold)]">
                {calc.bf.toFixed(1)}%
              </div>
              <div className="mt-0.5 text-[10px] text-[var(--ink-dim)]">
                {t("US Navy circumference method", "វិធីសាស្ត្ររង្វាស់រង្វង់ US Navy")}
              </div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                {t("Reference category", "កម្រិតយោង")}
              </div>
              <div className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                {t(calc.cat.label[0], calc.cat.label[1])}
              </div>
              <div className="mt-0.5 text-[10px] text-[var(--ink-dim)]">
                {calc.cat.lo}–{calc.cat.hi}% {t("general range", "ជួរទូទៅ")}
              </div>
            </div>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                {t("Healthy range note", "កំណត់សម្គាល់ជួរសុខភាព")}
              </div>
              <div className="mt-1 text-sm leading-relaxed text-[var(--ink)]">
                {sex === "male"
                  ? t("≈ 10–20% is a commonly cited healthy range for men.", "ប្រហែល ១០–២០% ជាជួរសុខភាពដែលគេលើកឡើងញឹកញាប់សម្រាប់បុរស។")
                  : t("≈ 20–30% is a commonly cited healthy range for women.", "ប្រហែល ២០–៣០% ជាជួរសុខភាពដែលគេលើកឡើងញឹកញាប់សម្រាប់ស្ត្រី។")}
              </div>
              <div className="mt-0.5 text-[10px] text-[var(--ink-faint)]">
                {t("ideal varies with age and fitness", "កម្រិតល្អបំផុតប្រែប្រួលតាមអាយុ និងសម្បទា")}
              </div>
            </div>
          </div>

          <p className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
            {t(
              "This is an estimate based on circumference measurements — the US Navy method is approximate and can differ from laboratory measurements by several percentage points. Category and healthy ranges are general references, not medical advice. Consult a healthcare professional for health decisions.",
              "នេះជាការប៉ាន់ស្មានផ្អែកលើការវាស់រង្វង់ — វិធីសាស្ត្រ US Navy គឺប្រហាក់ប្រហែល ហើយអាចខុសពីការវាស់ក្នុងមន្ទីរពិសោធន៍ច្រើនភាគរយ។ កម្រិត និងជួរសុខភាពគ្រាន់តែជាឯកសារយោងទូទៅ មិនមែនជាដំបូន្មានផ្នែកវេជ្ជសាស្ត្រទេ។ សូមពិគ្រោះជាមួយអ្នកជំនាញសុខាភិបាល សម្រាប់ការសម្រេចចិត្តផ្នែកសុខភាព។"
            )}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">
          {t(
            "Enter valid measurements (waist must be larger than neck).",
            "សូមបញ្ចូលការវាស់ឱ្យបានត្រឹមត្រូវ (ចង្កេះត្រូវធំជាងក)។"
          )}
        </p>
      )}
    </ToolShell>
  );
}
