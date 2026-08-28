"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Proverb = {
  text: string;
  meaning: string;
  translation: string;
  category: string;
};

const CATEGORIES = [
  { id: "conduct", en: "Conduct & virtue", km: "អាកប្បកិរិយា និងសីលធម៌" },
  { id: "family", en: "Family", km: "គ្រួសារ" },
  { id: "study", en: "Study & work", km: "ការសិក្សា និងការងារ" },
  { id: "speech", en: "Words & speech", km: "ពាក្យសម្ដី" },
  { id: "life", en: "Life & time", km: "ជីវិត និងពេលវេលា" },
  { id: "nature", en: "Nature & animals", km: "ធម្មជាតិ និងសត្វ" },
] as const;

// Curated sample of well-known traditional Khmer proverbs (សុភាសិត).
// Community folk sayings (public domain); translations are approximate.
const PROVERBS: Proverb[] = [
  {
    text: "ដំរីស្លាប់ ទុកភ្លុក ខ្លាស្លាប់ ទុកស្បែក មនុស្សស្លាប់ ទុកឈ្មោះ",
    meaning: "មនុស្សស្លាប់បាត់រូប តែឈ្មោះល្អ ឬអាក្រក់នៅតែគង់វង្ស។",
    translation: "An elephant leaves its tusks, a tiger leaves its skin, but a person leaves their reputation behind.",
    category: "life",
  },
  {
    text: "ក្រពើលិចទឹក មនុស្សលិចពាក្យ",
    meaning: "ពាក្យសម្ដីអាចធ្វើឲ្យខូចអ្នកដទៃ ដូចទឹកលិចក្រពើដែរ។",
    translation: "A crocodile drowns in water; a person drowns in their own words.",
    category: "speech",
  },
  {
    text: "អ្នកណាសាបព្រោះអ្វី អ្នកនោះច្រូតនូវអ្វីនោះ",
    meaning: "ធ្វើល្អ បានល្អ ធ្វើអាក្រក់ បានអាក្រក់។",
    translation: "Whatever you sow, that is what you reap.",
    category: "life",
  },
  {
    text: "ធ្វើល្អ បានល្អ ធ្វើអាក្រក់ បានអាក្រក់",
    meaning: "អំពើល្អផ្ដល់ផលល្អ អំពើអាក្រក់ផ្ដល់ផលអាក្រក់។",
    translation: "Do good and receive good; do evil and receive evil.",
    category: "conduct",
  },
  {
    text: "ស្រឡាញ់កូន ឲ្យកូនរៀន ស្អប់កូន ឲ្យកូនលេង",
    meaning: "ឪពុកម្ដាយស្រឡាញ់កូនពិត ត្រូវឲ្យកូនទៅរៀនសូត្រ។",
    translation: "Love your child — make them study; hate your child — let them play.",
    category: "family",
  },
  {
    text: "អណ្ដាតមនុស្ស មុតជាងដាវ",
    meaning: "ពាក្យសម្ដីអាចធ្វើឲ្យឈឺចាប់ខ្លាំងជាងដាវ។",
    translation: "The human tongue is sharper than a sword.",
    category: "speech",
  },
  {
    text: "អណ្ដាតគ្មានឆ្អឹង",
    meaning: "មនុស្សអាចនិយាយអ្វីក៏បាន កុំជឿពាក្យណាមួយភ្លាមៗ។",
    translation: "The tongue has no bone — people can say anything.",
    category: "speech",
  },
  {
    text: "ពូជអ្វី ផ្លែនោះ",
    meaning: "កូនតែងប្រហាក់ប្រហែលនឹងឪពុកម្ដាយ ខាងទង្វើ ឬចរិត។",
    translation: "As the seed, so the fruit (like parent, like child).",
    category: "life",
  },
  {
    text: "អត់ធ្មត់ ជាទង់ជ័យ",
    meaning: "ការអត់ធ្មត់នាំឲ្យមានជ័យជំនះ។",
    translation: "Patience is the flag of victory.",
    category: "conduct",
  },
  {
    text: "សាមគ្គី ជាកម្លាំង",
    meaning: "ការរួបរួមគ្នា បង្កើតបានកម្លាំងខ្លាំងក្លា។",
    translation: "Unity is strength.",
    category: "conduct",
  },
  {
    text: "ត្រីធំ ស៊ីត្រីតូច",
    meaning: "អ្នកមានអំណាច ឬអ្នកខ្លាំង តែងសង្កត់សង្កិនអ្នកទន់ខ្សោយ។",
    translation: "Big fish eat small fish.",
    category: "nature",
  },
  {
    text: "ដំរីជល់គ្នា ស្មៅត្រូវបាក់",
    meaning: "មនុស្សមានអំណាចឈ្លោះគ្នា អ្នកទន់ខ្សោយត្រូវទទួលរងគ្រោះ។",
    translation: "When elephants fight, the grass gets crushed.",
    category: "nature",
  },
  {
    text: "ពាក្យចាស់ ពាក្យពិត",
    meaning: "សម្ដីដែលចាស់ទុំពោលទុក ច្រើនតែពិតប្រាកដ។",
    translation: "Old sayings hold true.",
    category: "speech",
  },
  {
    text: "ស្វាមិនឃើញកន្ទុយខ្លួនឯង",
    meaning: "មនុស្សច្រើនតែឃើញកំហុសអ្នកដទៃ តែមិនឃើញកំហុសខ្លួនឯង។",
    translation: "The monkey cannot see its own tail (one's own faults stay invisible).",
    category: "nature",
  },
  {
    text: "មានគេ មានយើង",
    meaning: "មនុស្សត្រូវការគ្នាទៅវិញទៅមក មិនអាចនៅតែម្នាក់ឯងបាន។",
    translation: "Where there is 'them', there is 'us' — people need each other.",
    category: "life",
  },
  {
    text: "ដើមឈើ ត្រូវការស្លឹក មនុស្ស ត្រូវការកិត្តិយស",
    meaning: "កិត្តិយសជារបស់សំខាន់សម្រាប់មនុស្ស ដូចស្លឹកសម្រាប់ដើមឈើ។",
    translation: "A tree needs its leaves; a person needs their honor.",
    category: "nature",
  },
  {
    text: "ទឹកជ្រៅ វាស់បាន ចិត្តមនុស្ស វាស់មិនបាន",
    meaning: "គេអាចវាស់ជម្រៅទឹកបាន តែវាស់ចិត្តមនុស្សពុំបានឡើយ។",
    translation: "Deep water can be measured; the human heart cannot.",
    category: "life",
  },
  {
    text: "ភ្លើងតូច ឆេះព្រៃធំ",
    meaning: "រឿងតូច ឬកំហុសតូច អាចបង្កគ្រោះធំបាន។",
    translation: "A small fire can burn a whole forest.",
    category: "nature",
  },
  {
    text: "ឆ្កែព្រុស មិនខាំ ខាំ មិនព្រុស",
    meaning: "អ្នកដែលគំរាមខ្លាំងៗ ច្រើនតែមិនធ្វើអ្វីពិតប្រាកដ។",
    translation: "A barking dog doesn't bite; a biting dog doesn't bark.",
    category: "nature",
  },
  {
    text: "គោយឺត ទឹកឆ្អិន",
    meaning: "អ្នកយឺតយ៉ាវ ច្រើនតែខកខានឱកាស។",
    translation: "The slow ox arrives when the water is already boiling (too late).",
    category: "nature",
  },
  {
    text: "ពស់ចឹក ខ្លាចខ្សែក្រវាត់",
    meaning: "ធ្លាប់ជួបគ្រោះម្ដង ក៏ខ្លាចសូម្បីរបស់ដែលប្រហាក់ប្រហែល។",
    translation: "Once bitten by a snake, one fears even a belt.",
    category: "nature",
  },
  {
    text: "កង្កែបក្នុងអណ្ដូង មិនដឹងទឹកសមុទ្រធំ",
    meaning: "អ្នកដែលឃើញតែអ្វីដែលនៅជុំវិញខ្លួន មិនដឹងថាពិភពលោកធំទូលាយប៉ុនណា។",
    translation: "A frog in a well knows nothing of the vast ocean.",
    category: "nature",
  },
  {
    text: "ខឹងច្រើន អាយុខ្លី",
    meaning: "ការខឹងច្រើន ធ្វើឲ្យប៉ះពាល់សុខភាព។",
    translation: "Getting angry too often shortens your life.",
    category: "conduct",
  },
  {
    text: "មាត់ផ្អែម ចិត្តជូរ",
    meaning: "មនុស្សដែលនិយាយផ្អែមល្ហែម បែរជាមានចិត្តអាក្រក់ក៏មាន។",
    translation: "A sweet mouth can hide a sour heart.",
    category: "speech",
  },
  {
    text: "និយាយតិច ធ្វើច្រើន",
    meaning: "ការធ្វើការច្រើន ប្រសើរជាងនិយាយច្រើន។",
    translation: "Speak little, do much.",
    category: "conduct",
  },
  {
    text: "ទ្រព្យស្ថិតក្នុងផ្ទះ ចំណេះស្ថិតក្នុងក្បាល",
    meaning: "ទ្រព្យអាចបាត់បង់ តែចំណេះដែលរៀនហើយ នៅជាមួយខ្លួនជានិច្ច។",
    translation: "Wealth stays in the house; knowledge stays in the head.",
    category: "study",
  },
  {
    text: "ចំណេះវិជ្ជា មិនដែលខាតបង់",
    meaning: "ចំណេះដឹងមិនដែលរលួយ ឬបាត់បង់ឡើយ។",
    translation: "Knowledge is never lost.",
    category: "study",
  },
  {
    text: "ពេលវេលា ជាមាសប្រាក់",
    meaning: "ពេលវេលាមានតម្លៃណាស់ កុំឲ្យខ្ជះខ្ជាយ។",
    translation: "Time is gold and silver.",
    category: "life",
  },
  {
    text: "សុខភាពល្អ ប្រសើរជាងទ្រព្យសម្បត្តិ",
    meaning: "គ្មានទ្រព្យណាស្មើនឹងសុខភាពល្អឡើយ។",
    translation: "Good health is worth more than wealth.",
    category: "life",
  },
  {
    text: "ដើមឈើកោង ត្រង់លំបាក",
    meaning: "ទម្លាប់អាក្រក់ដែលតាំងពីក្មេង កែឲ្យត្រង់វិញពិបាក។",
    translation: "A crooked tree is hard to straighten (bad habits formed young are hard to fix).",
    category: "nature",
  },
  {
    text: "ពាក្យកុហក គ្មានជើង តែរត់លឿន",
    meaning: "ពាក្យកុហកផ្សព្វផ្សាយបានលឿនណាស់។",
    translation: "A lie has no legs but travels fast.",
    category: "speech",
  },
  {
    text: "ជីវិត មានឡើង មានចុះ",
    meaning: "ជីវិតមនុស្សមានសុខ មានទុក្ខ ដូចជាតម្កើង តម្កាល។",
    translation: "Life has its ups and downs.",
    category: "life",
  },
  {
    text: "ប្រាជ្ញា ប្រសើរជាងកម្លាំង",
    meaning: "ការចេះគិតពិចារណា ប្រសើរជាងកម្លាំងកាយ។",
    translation: "Wisdom is better than brute strength.",
    category: "study",
  },
  {
    text: "សៀវភៅ ជាមិត្តល្អ",
    meaning: "ការអានសៀវភៅ ផ្ដល់ចំណេះ និងកម្សាន្ត ដូចជាមិត្តល្អ។",
    translation: "A book is a good friend.",
    category: "study",
  },
  {
    text: "ពូកែ ដោយរៀន ឆ្លាត ដោយគិត",
    meaning: "ការខំរៀន ធ្វើឲ្យពូកែ ការចេះគិត ធ្វើឲ្យឆ្លាត។",
    translation: "You excel by studying and become wise by thinking.",
    category: "study",
  },
  {
    text: "ការឲ្យ ប្រសើរជាងការទទួល",
    meaning: "ការចែករំលែកដល់អ្នកដទៃ ជាអំពើល្អប្រសើរជាងការទទួល។",
    translation: "Giving is better than receiving.",
    category: "conduct",
  },
  {
    text: "ពេញពោះ កុំភ្លេចអ្នកឃ្លាន",
    meaning: "កាលយើងមានសុខ កុំភ្លេចអ្នកកំពុងលំបាក។",
    translation: "When your stomach is full, don't forget the hungry.",
    category: "conduct",
  },
  {
    text: "អ្នកមាន កុំភ្លេចអ្នកក្រ",
    meaning: "កាលយើងក្លាយជាអ្នកមាន កុំភ្លេចជីវិតលំបាក និងអ្នកក្រ។",
    translation: "When you become rich, don't forget the poor.",
    category: "conduct",
  },
  {
    text: "ម្ដាយឪពុក ជាទេវតាប្រចាំផ្ទះ",
    meaning: "ឪពុកម្ដាយមានគុណធំ ប្រៀបដូចទេវតារក្សាផ្ទះ។",
    translation: "Parents are the guardian angels of the home.",
    category: "family",
  },
  {
    text: "គុណឪពុកម្ដាយ ដូចភ្នំ ដូចសមុទ្រ",
    meaning: "គុណូបការៈរបស់ឪពុកម្ដាយធំធេង ដូចភ្នំ និងសមុទ្រ។",
    translation: "The kindness of parents is as vast as mountains and seas.",
    category: "family",
  },
];

export default function KhmerProverbs() {
  const { text: t } = useLanguage();
  const [query, setQuery] = useToolState("kp:query", "");
  const [category, setCategory] = useToolState("kp:category", "all");
  const [dayIndex, setDayIndex] = useState(() => Math.floor(Math.random() * PROVERBS.length));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROVERBS.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        (!q || p.text.toLowerCase().includes(q) || p.meaning.includes(q) || p.translation.toLowerCase().includes(q))
    );
  }, [query, category]);

  const dayProverb = PROVERBS[dayIndex];

  return (
    <ToolShell
      title="Khmer Proverbs"
      khmerTitle="សុភាសិតខ្មែរ"
      description="Browse, search, and discover well-known Khmer proverbs (សុភាសិត) with short Khmer meanings and English translations. A curated sample for learning — not an official dictionary."
      descriptionKm="រកមើល ស្វែងរក និងស្វែងយល់អំពីសុភាសិតខ្មែរដ៏ល្បីល្បាញ ជាមួយអត្ថន័យខ្លីជាភាសាខ្មែរ និងការបកប្រែជាភាសាអង់គ្លេស។ ជាគំរូដកស្រង់សម្រាប់ការរៀន — មិនមែនជាវចនានុក្រមផ្លូវការទេ។"
    >
      <Row>
        <Field label={t("Search", "ស្វែងរក")}>
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search proverbs…", "ស្វែងរកសុភាសិត…")}
          />
        </Field>
        <Field label={t("Category", "ប្រភេទ")}>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">{t("All categories", "គ្រប់ប្រភេទ")}</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {t(c.en, c.km)}
              </option>
            ))}
          </Select>
        </Field>
      </Row>

      <section className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">
            {t("Proverb of the day", "សុភាសិតប្រចាំថ្ងៃ")}
          </h2>
          <Button type="button" onClick={() => setDayIndex(Math.floor(Math.random() * PROVERBS.length))}>
            {t("Shuffle", "ផ្លាស់ប្ដូរ")}
          </Button>
        </div>
        <p lang="km" className="font-khmer text-lg font-semibold leading-relaxed text-[var(--ink)]">
          {dayProverb.text}
        </p>
        <p lang="km" className="mt-1 text-sm leading-relaxed text-[var(--ink-dim)]">
          {dayProverb.meaning}
        </p>
        <p className="mt-1 text-sm italic leading-relaxed text-[var(--ink-dim)]">{dayProverb.translation}</p>
      </section>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">
          {t(`${filtered.length} proverbs`, `សុភាសិតចំនួន ${filtered.length}`)}
        </h2>
        {filtered.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--ground-line)] p-6 text-sm text-[var(--ink-dim)]">
            {t("No proverbs match your search.", "រកមិនឃើញសុភាសិតត្រូវនឹងការស្វែងរកទេ។")}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => (
              <article key={p.text} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <p lang="km" className="font-khmer font-semibold leading-relaxed text-[var(--ink)]">
                    {p.text}
                  </p>
                  <span className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">
                    {t(CATEGORIES.find((c) => c.id === p.category)?.en ?? p.category, CATEGORIES.find((c) => c.id === p.category)?.km ?? "")}
                  </span>
                </div>
                <p lang="km" className="mt-1 text-sm leading-relaxed text-[var(--ink-dim)]">
                  {t("Meaning", "អត្ថន័យ")}: {p.meaning}
                </p>
                <p className="mt-0.5 text-sm italic leading-relaxed text-[var(--ink-dim)]">{p.translation}</p>
              </article>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Curated sample for learning — not an official dictionary. These are traditional community sayings (public domain); the Khmer meanings and English translations are approximate.",
          "ជាគំរូដកស្រង់សម្រាប់ការរៀន — មិនមែនជាវចនានុក្រមផ្លូវការទេ។ ទាំងនេះជាសម្ដីប្រពៃណីរបស់សហគមន៍ (សាធារណៈ); អត្ថន័យខ្មែរ និងការបកប្រែជាភាសាអង់គ្លេសគឺប្រហាក់ប្រហែល។"
        )}
      </p>
    </ToolShell>
  );
}
