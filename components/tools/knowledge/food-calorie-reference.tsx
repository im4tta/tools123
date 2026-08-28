"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Food = {
  name: string;
  km: string;
  per100: number;
  serving: string;
  servingKcal: number;
};

type Group = {
  title: string;
  titleKm: string;
  items: Food[];
};

const GROUPS: Group[] = [
  {
    title: "Fruits",
    titleKm: "ផ្លែឈើ",
    items: [
      { name: "Apple", km: "ផ្លែប៉ោម", per100: 52, serving: "1 medium (182 g)", servingKcal: 95 },
      { name: "Banana", km: "ចេក", per100: 89, serving: "1 medium (118 g)", servingKcal: 105 },
      { name: "Orange", km: "ក្រូច", per100: 47, serving: "1 medium (131 g)", servingKcal: 62 },
      { name: "Mango", km: "ស្វាយ", per100: 60, serving: "1 cup (165 g)", servingKcal: 99 },
      { name: "Watermelon", km: "ឪឡឹក", per100: 30, serving: "1 cup (152 g)", servingKcal: 46 },
      { name: "Pineapple", km: "ម្នាស់", per100: 50, serving: "1 cup (165 g)", servingKcal: 82 },
      { name: "Papaya", km: "ល្ហុង", per100: 43, serving: "1 cup (145 g)", servingKcal: 62 },
      { name: "Grapes", km: "ទំពាំងបាយជូរ", per100: 69, serving: "1 cup (151 g)", servingKcal: 104 },
      { name: "Strawberries", km: "ស្ត្របឺរី", per100: 32, serving: "1 cup (152 g)", servingKcal: 49 },
      { name: "Avocado", km: "ផ្លែបឺរ", per100: 160, serving: "half fruit (100 g)", servingKcal: 160 },
      { name: "Durian", km: "ទុរេន", per100: 147, serving: "1 cup (243 g)", servingKcal: 357 },
      { name: "Dragon fruit (pitaya)", km: "ផ្លែភីតាយ៉ា", per100: 60, serving: "1 fruit (200 g)", servingKcal: 120 },
      { name: "Rambutan", km: "សាវម៉ាវ", per100: 82, serving: "1 cup (150 g)", servingKcal: 123 },
      { name: "Lychee", km: "លីឈី", per100: 66, serving: "1 cup (190 g)", servingKcal: 125 },
      { name: "Coconut (fresh meat)", km: "សាច់ដូងស្រស់", per100: 354, serving: "1 cup (80 g)", servingKcal: 283 },
    ],
  },
  {
    title: "Vegetables",
    titleKm: "បន្លែ",
    items: [
      { name: "Cabbage", km: "ស្ពៃក្ដោប", per100: 25, serving: "1 cup shredded (70 g)", servingKcal: 17 },
      { name: "Carrot", km: "ការ៉ុត", per100: 41, serving: "1 medium (61 g)", servingKcal: 25 },
      { name: "Tomato", km: "ប៉េងប៉ោះ", per100: 18, serving: "1 medium (123 g)", servingKcal: 22 },
      { name: "Cucumber", km: "ត្រសក់", per100: 15, serving: "1 cup (104 g)", servingKcal: 16 },
      { name: "Broccoli", km: "ផ្កាខាត់ណាខៀវ", per100: 34, serving: "1 cup (91 g)", servingKcal: 31 },
      { name: "Spinach", km: "ស្ពៃស្ពីណាច", per100: 23, serving: "1 cup raw (30 g)", servingKcal: 7 },
      { name: "Potato (boiled)", km: "ដំឡូងបារាំងស្ងោរ", per100: 87, serving: "1 medium (173 g)", servingKcal: 150 },
      { name: "Sweet potato", km: "ដំឡូងជ្វា", per100: 86, serving: "1 medium (130 g)", servingKcal: 112 },
      { name: "Sweet corn", km: "ពោតផ្អែម", per100: 86, serving: "1 ear (90 g)", servingKcal: 77 },
      { name: "Onion", km: "ខ្ទឹមបារាំង", per100: 40, serving: "1 medium (110 g)", servingKcal: 44 },
      { name: "Mushroom", km: "ផ្សិត", per100: 22, serving: "1 cup (70 g)", servingKcal: 15 },
      { name: "Pumpkin", km: "ល្ពៅ", per100: 26, serving: "1 cup (116 g)", servingKcal: 30 },
      { name: "Eggplant", km: "ត្រប់", per100: 25, serving: "1 cup (99 g)", servingKcal: 25 },
      { name: "Bell pepper", km: "ម្ទេសកណ្ដឹង", per100: 31, serving: "1 medium (119 g)", servingKcal: 37 },
    ],
  },
  {
    title: "Grains & starches",
    titleKm: "ធញ្ញជាតិ និងម្សៅ",
    items: [
      { name: "White rice (cooked)", km: "បាយស", per100: 130, serving: "1 cup (158 g)", servingKcal: 205 },
      { name: "Brown rice (cooked)", km: "បាយសំរូប", per100: 111, serving: "1 cup (195 g)", servingKcal: 216 },
      { name: "Rice noodles (cooked)", km: "គុយទាវឆ្អិន", per100: 109, serving: "1 cup (176 g)", servingKcal: 192 },
      { name: "White bread", km: "នំប៉័ងស", per100: 265, serving: "1 slice (25 g)", servingKcal: 66 },
      { name: "Whole-wheat bread", km: "នំប៉័ងស្រូវសាលីទាំងមូល", per100: 247, serving: "1 slice (28 g)", servingKcal: 69 },
      { name: "Instant noodles (cooked)", km: "មីស្ងោរ", per100: 138, serving: "1 cup (135 g)", servingKcal: 186 },
      { name: "Oatmeal (cooked)", km: "បបរស្រូវសាលី", per100: 71, serving: "1 cup (234 g)", servingKcal: 166 },
      { name: "Pasta (cooked)", km: "ប៉ាស្តាឆ្អិន", per100: 131, serving: "1 cup (140 g)", servingKcal: 183 },
    ],
  },
  {
    title: "Proteins",
    titleKm: "ប្រូតេអ៊ីន",
    items: [
      { name: "Chicken breast (skinless, cooked)", km: "សាច់មាន់ដងខ្លួន (គ្មានស្បែក)", per100: 165, serving: "100 g", servingKcal: 165 },
      { name: "Chicken thigh (cooked)", km: "សាច់ភ្លៅមាន់", per100: 184, serving: "1 thigh (86 g)", servingKcal: 158 },
      { name: "Beef (lean, cooked)", km: "សាច់គោគ្មានខ្លាញ់", per100: 250, serving: "100 g", servingKcal: 250 },
      { name: "Pork (lean, cooked)", km: "សាច់ជ្រូកគ្មានខ្លាញ់", per100: 242, serving: "100 g", servingKcal: 242 },
      { name: "Egg", km: "ស៊ុត", per100: 155, serving: "1 large (50 g)", servingKcal: 78 },
      { name: "Tofu (firm)", km: "តៅហ៊ូរឹង", per100: 144, serving: "100 g", servingKcal: 144 },
      { name: "White fish (steamed)", km: "ត្រីសស្ងោរ", per100: 105, serving: "100 g", servingKcal: 105 },
      { name: "Salmon (cooked)", km: "ត្រីសាម៉ុងឆ្អិន", per100: 206, serving: "100 g", servingKcal: 206 },
      { name: "Tuna (canned in water)", km: "ត្រីធូណាកំប៉ុង (ក្នុងទឹក)", per100: 116, serving: "100 g", servingKcal: 116 },
      { name: "Shrimp (cooked)", km: "បង្គាឆ្អិន", per100: 99, serving: "100 g", servingKcal: 99 },
      { name: "Pork belly", km: "សាច់ជ្រូកខ្លាញ់", per100: 518, serving: "100 g", servingKcal: 518 },
    ],
  },
  {
    title: "Dairy",
    titleKm: "ផលិតផលទឹកដោះ",
    items: [
      { name: "Milk (whole)", km: "ទឹកដោះគោទាំងមូល", per100: 61, serving: "1 cup (244 g)", servingKcal: 149 },
      { name: "Milk (skim)", km: "ទឹកដោះគោគ្មានខ្លាញ់", per100: 34, serving: "1 cup (245 g)", servingKcal: 83 },
      { name: "Yogurt (plain, whole)", km: "ទឹកដោះគោជូរ", per100: 61, serving: "1 cup (245 g)", servingKcal: 149 },
      { name: "Cheddar cheese", km: "ឈីសឆេដដារ", per100: 403, serving: "1 slice (28 g)", servingKcal: 113 },
      { name: "Butter", km: "ប៊ឺ", per100: 717, serving: "1 tbsp (14 g)", servingKcal: 100 },
      { name: "Ice cream", km: "ការ៉េម", per100: 207, serving: "1 cup (132 g)", servingKcal: 273 },
      { name: "Sweetened condensed milk", km: "ទឹកដោះគោខាប់ផ្អែម", per100: 321, serving: "2 tbsp (38 g)", servingKcal: 122 },
    ],
  },
  {
    title: "Snacks",
    titleKm: "អាហារសម្រន់",
    items: [
      { name: "Potato chips", km: "បន្ទះសៀគ្វីដំឡូង", per100: 536, serving: "small bag (28 g)", servingKcal: 150 },
      { name: "Dark chocolate (70–85%)", km: "សូកូឡាខ្មៅ", per100: 598, serving: "1 square (10 g)", servingKcal: 60 },
      { name: "Milk chocolate", km: "សូកូឡាទឹកដោះគោ", per100: 535, serving: "1 bar (44 g)", servingKcal: 235 },
      { name: "Roasted peanuts", km: "សណ្ដែកដីអាំង", per100: 587, serving: "handful (28 g)", servingKcal: 164 },
      { name: "Almonds", km: "អាល់ម៉ុន", per100: 579, serving: "handful (28 g)", servingKcal: 162 },
      { name: "Cashews", km: "គ្រាប់ស្វាយចន្ទី", per100: 553, serving: "handful (28 g)", servingKcal: 155 },
      { name: "Popcorn (air-popped)", km: "ពោតលីង", per100: 387, serving: "1 cup (8 g)", servingKcal: 31 },
      { name: "Fried spring roll", km: "នំចៀន", per100: 210, serving: "1 roll (40 g)", servingKcal: 84 },
    ],
  },
  {
    title: "Drinks",
    titleKm: "ភេសជ្ជៈ",
    items: [
      { name: "Cola (soda)", km: "ទឹកកូឡា", per100: 42, serving: "1 can (330 ml)", servingKcal: 139 },
      { name: "Orange juice", km: "ទឹកក្រូចច្របាច់", per100: 45, serving: "1 glass (250 ml)", servingKcal: 113 },
      { name: "Beer", km: "ស្រាបៀរ", per100: 43, serving: "1 bottle (330 ml)", servingKcal: 142 },
      { name: "Coconut water", km: "ទឹកដូង", per100: 19, serving: "1 cup (240 ml)", servingKcal: 46 },
      { name: "Black coffee (no sugar)", km: "កាហ្វេខ្មៅ (គ្មានស្ករ)", per100: 2, serving: "1 cup (240 ml)", servingKcal: 5 },
      { name: "Thai milk tea", km: "តែទឹកដោះគោថៃ", per100: 54, serving: "1 glass (240 ml)", servingKcal: 130 },
      { name: "Sugarcane juice", km: "ទឹកអំពៅ", per100: 75, serving: "1 glass (240 ml)", servingKcal: 180 },
    ],
  },
  {
    title: "Khmer dishes (rough estimates)",
    titleKm: "ម្ហូបខ្មែរ (ការប៉ាន់ស្មាន)។",
    items: [
      { name: "Fish amok", km: "អាម៉ុកត្រី", per100: 180, serving: "1 bowl (~300 g)", servingKcal: 540 },
      { name: "Chicken curry (Khmer style)", km: "ការីមាន់", per100: 180, serving: "1 serving (~250 g)", servingKcal: 450 },
      { name: "Beef lok lak", km: "ឡុកឡាក់", per100: 220, serving: "1 plate (~250 g)", servingKcal: 550 },
      { name: "Chicken fried rice", km: "បាយឆាមាន់", per100: 150, serving: "1 plate (~300 g)", servingKcal: 450 },
      { name: "Kuyteav (noodle soup)", km: "គុយទាវ", per100: 90, serving: "1 bowl (~500 g)", servingKcal: 450 },
      { name: "Samlor machu (sour soup)", km: "សម្លម្ជូរ", per100: 40, serving: "1 bowl (~450 g)", servingKcal: 180 },
      { name: "Nom banh chok (fish gravy)", km: "នំបញ្ចុក", per100: 95, serving: "1 bowl (~400 g)", servingKcal: 380 },
      { name: "Bok lahong (papaya salad)", km: "បុកល្ហុង", per100: 55, serving: "1 cup (~200 g)", servingKcal: 110 },
      { name: "Mango sticky rice", km: "បាយដំណើបស្វាយ", per100: 200, serving: "1 serving (~200 g)", servingKcal: 400 },
      { name: "Grilled pork skewers", km: "សាច់ជ្រូកអាំង", per100: 250, serving: "1 skewer (~60 g)", servingKcal: 150 },
      { name: "Prahok ktis (coconut dip)", km: "ប្រហុកខ្ទិះ", per100: 200, serving: "2 tbsp (~30 g)", servingKcal: 60 },
      { name: "Num pang (Khmer sandwich)", km: "នំប៉័ងសាំងវិច", per100: 225, serving: "1 sandwich (~200 g)", servingKcal: 450 },
      { name: "Stir-fried vegetables", km: "ឆាបន្លែ", per100: 90, serving: "1 plate (~250 g)", servingKcal: 225 },
    ],
  },
];

export default function FoodCalorieReference() {
  const { text: t } = useLanguage();
  const [query, setQuery] = useToolState("food-calories:query", "");

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GROUPS;
    return GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
        (f) => f.name.toLowerCase().includes(q) || f.km.toLowerCase().includes(q)
      ),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  const total = filteredGroups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <ToolShell
      title="Food Calorie Reference"
      khmerTitle="ឯកសារយោងកាឡូរីអាហារ"
      description="Approximate calorie values for common foods per 100 g and per typical serving, grouped by category. Values are estimates from general public nutrition references — always verify with the product label."
      descriptionKm="តម្លៃកាឡូរីប្រហាក់ប្រហែលនៃអាហារទូទៅក្នុង ១០០ ក្រាម និងក្នុងមួយចំណែកធម្មតា ចែកតាមប្រភេទ។ តម្លៃគឺជាការប៉ាន់ស្មានពីឯកសារយោងអាហារូបត្ថម្ភទូទៅ — សូមផ្ទៀងផ្ទាត់ជាមួយស្លាកផលិតផលជានិច្ច។"
    >
      <Field label={t("Search food", "ស្វែងរកអាហារ")}>
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("e.g. rice, mango, amok", "ឧ. បាយ, ស្វាយ, អាម៉ុក")}
        />
      </Field>

      {filteredGroups.map((group) => (
        <section key={group.title}>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--gold)]">
            {t(group.title, group.titleKm)}
          </h2>
          <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-[var(--ground-raised)] text-xs text-[var(--ink-dim)]">
                <tr>
                  <th className="px-3 py-2">{t("Food", "អាហារ")}</th>
                  <th className="px-3 py-2">{t("kcal / 100 g", "កាឡូរី / ១០០ ក្រាម")}</th>
                  <th className="px-3 py-2">{t("Common serving", "ចំណែកធម្មតា")}</th>
                  <th className="px-3 py-2">{t("kcal / serving", "កាឡូរី / ចំណែក")}</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((f) => (
                  <tr key={f.name} className="border-t border-[var(--ground-line)]">
                    <td className="px-3 py-2 text-[var(--ink)]">{t(f.name, f.km)}</td>
                    <td className="px-3 py-2 font-mono-ui font-semibold text-[var(--gold)]">≈ {f.per100}</td>
                    <td className="px-3 py-2 text-[var(--ink-dim)]">{f.serving}</td>
                    <td className="px-3 py-2 font-mono-ui text-[var(--ink)]">≈ {f.servingKcal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {!filteredGroups.length && (
        <p className="rounded-md border border-[var(--ground-line)] p-6 text-center text-sm text-[var(--ink-dim)]">
          {t("No foods match your search.", "រកមិនឃើញអាហារដែលត្រូវនឹងការស្វែងរករបស់អ្នកទេ។")}
        </p>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          `${total} foods shown. All values are APPROXIMATE — compiled from general public nutrition references (e.g. USDA FoodData Central-style tables); calories vary with variety, ripeness, cooking method, and portion size. Khmer-dish values are rough estimates based on typical ingredient compositions. Always verify with the product label.`,
          `បង្ហាញអាហារ ${total} មុខ។ រាល់តម្លៃគឺប្រហាក់ប្រហែល — ចងក្រងពីឯកសារយោងអាហារូបត្ថម្ភទូទៅ (ឧ. តារាងបែប USDA FoodData Central); កាឡូរីប្រែប្រួលតាមពូជ ភាពទុំ របៀបចម្អិន និងទំហំចំណែក។ តម្លៃម្ហូបខ្មែរគឺជាការប៉ាន់ស្មានពីសមាសធាតុទូទៅ។ សូមផ្ទៀងផ្ទាត់ជាមួយស្លាកផលិតផលជានិច្ច។`
        )}
      </p>
    </ToolShell>
  );
}
