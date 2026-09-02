"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface Substitution {
  id: string;
  ingredient: [string, string];
  swap: [string, string];
  note: [string, string];
}

// Curated general-purpose cooking and baking substitutions. Ratios are common
// starting points used by cooks and bakers — results vary by recipe, so this
// is a reference guide, not a guarantee.
const SUBSTITUTIONS: Substitution[] = [
  {
    id: "buttermilk",
    ingredient: ["Buttermilk (1 cup)", "ទឹកដោះជូរ (១ ពែង)"],
    swap: ["1 cup milk + 1 tbsp lemon juice or white vinegar; rest 5–10 min", "ទឹកដោះគោ ១ ពែង + ទឹកក្រូចឆ្មារ ឬទឹកខ្មេះ ១ ស្លាបព្រា ទុក ៥–១០ នាទី"],
    note: ["Use the curdled mixture for baking; texture is slightly different.", "ប្រើល្បាយដែលខាប់នេះសម្រាប់ដុតនំ វាយនភាពខុសបន្តិច។"],
  },
  {
    id: "brown-sugar",
    ingredient: ["Brown sugar (1 cup)", "ស្ករត្នោត (១ ពែង)"],
    swap: ["1 cup white sugar + 1–2 tbsp molasses (mix well)", "ស្ករស ១ ពែង + ទឹកអំពៅខ្មៅ ១–២ ស្លាបព្រា (កូរឱ្យសព្វ)"],
    note: ["Closest match for cookies and cakes.", "ត្រូវគ្នាជាងគេសម្រាប់នំគុក និងនំខេក។"],
  },
  {
    id: "egg",
    ingredient: ["Egg (1 large, in baking)", "ស៊ុត (១ គ្រាប់ធំ ក្នុងការដុតនំ)"],
    swap: ["¼ cup applesauce, ¼ cup mashed banana, or 1 tbsp ground flaxseed + 3 tbsp water (flax egg)", "ទឹកផ្លែប៉ោម ¼ ពែង ចេកកិន ¼ ពែង ឬគ្រាប់ flax ម្សៅ ១ ស្លាបព្រា + ទឹក ៣ ស្លាបព្រា"],
    note: ["Changes moisture and texture; flax egg works best in muffins and pancakes.", "ប្រែប្រួលសំណើម និងវាយនភាព ស៊ុត flax ល្អសម្រាប់ muffin និងនំផេនខេក។"],
  },
  {
    id: "baking-powder",
    ingredient: ["Baking powder (1 tsp)", "ម្សៅដុតនំប្រភេទ baking powder (១ ស្លាបព្រាកាហ្វេ)"],
    swap: ["¼ tsp baking soda + ½ tsp cream of tartar (add with dry ingredients)", "baking soda ¼ ស្លាបព្រាកាហ្វេ + cream of tartar ½ ស្លាបព្រាកាហ្វេ (លាយជាមួយគ្រឿងស្ងួត)"],
    note: ["Use immediately; needs an acid already in the recipe.", "ប្រើភ្លាមៗ ត្រូវមានជាតិអាស៊ីតក្នុងរូបមន្តរួចហើយ។"],
  },
  {
    id: "baking-soda",
    ingredient: ["Baking soda (1 tsp)", "baking soda (១ ស្លាបព្រាកាហ្វេ)"],
    swap: ["3 tsp baking powder (reduce or omit other acid in the recipe)", "baking powder ៣ ស្លាបព្រាកាហ្វេ (កាត់បន្ថយ ឬដកជាតិអាស៊ីតផ្សេងទៀតក្នុងរូបមន្ត)"],
    note: ["May slightly change flavour and browning.", "អាចប្រែប្រួលរសជាតិ និងពណ៌ត្នោតបន្តិចបន្តួច។"],
  },
  {
    id: "cornstarch",
    ingredient: ["Cornstarch (1 tbsp, thickener)", "ម្សៅពោត (១ ស្លាបព្រា សម្រាប់ធ្វើឱ្យខាប់)"],
    swap: ["2 tbsp all-purpose flour, or 1 tbsp arrowroot / tapioca starch", "ម្សៅស្រូវសាលី ២ ស្លាបព្រា ឬម្សៅ arrowroot/tapioca ១ ស្លាបព្រា"],
    note: ["Flour needs longer cooking; arrowroot gives a glossier result.", "ម្សៅស្រូវត្រូវចំអិនយូរជាង រីឯ arrowroot ឱ្យភាពភ្លឺជាង។"],
  },
  {
    id: "heavy-cream",
    ingredient: ["Heavy cream (1 cup, for cooking)", "ក្រែមខ្លាញ់ខ្ពស់ (១ ពែង សម្រាប់ចំអិន)"],
    swap: ["¾ cup milk + ¼ cup melted butter", "ទឹកដោះគោ ¾ ពែង + ប៊ឺរលាយ ¼ ពែង"],
    note: ["For cooking and sauces, not for whipping.", "សម្រាប់ចំអិន និងទឹកជ្រលក់ មិនមែនសម្រាប់វាយជាពពុះទេ។"],
  },
  {
    id: "sour-cream",
    ingredient: ["Sour cream (1 cup)", "ក្រែមជូរ (១ ពែង)"],
    swap: ["1 cup plain yogurt (Greek for a thicker texture)", "ទឹកដោះគោជូរធម្មតា ១ ពែង (ប្រភេទ Greek សម្រាប់វាយនភាពខាប់ជាង)"],
    note: ["Use full-fat yogurt for the closest result.", "ប្រើទឹកដោះគោជូរមានជាតិខ្លាញ់ពេញ ដើម្បីលទ្ធផលជិតបំផុត។"],
  },
  {
    id: "vegetable-oil",
    ingredient: ["Vegetable oil (1 cup, baking)", "ប្រេងបន្លែ (១ ពែង ក្នុងការដុតនំ)"],
    swap: ["1 cup applesauce (reduce sugar slightly) or 1 cup melted butter/coconut oil (cooled)", "ទឹកផ្លែប៉ោម ១ ពែង (កាត់ស្ករបន្តិច) ឬប៊ឺ/ប្រេងដូងរលាយ ១ ពែង (ឱ្យត្រជាក់)"],
    note: ["Applesauce makes a moister, less rich crumb.", "ទឹកផ្លែប៉ោមធ្វើឱ្យនំសើមជាង ប៉ុន្តែមិនសូវសម្បូរខ្លាញ់។"],
  },
  {
    id: "honey",
    ingredient: ["Honey (1 cup)", "ទឹកឃ្មុំ (១ ពែង)"],
    swap: ["1¼ cups white sugar + ¼ cup water (reduce other liquids a little)", "ស្ករស ១¼ ពែង + ទឹក ¼ ពែង (កាត់បន្ថយវត្ថុរាវផ្សេងទៀតបន្តិច)"],
    note: ["Maple syrup can replace honey 1:1 with a milder flavour.", "សុីរ៉ូដើមម៉េផលអាចជំនួសទឹកឃ្មុំ ១:១ ដោយរសជាតិស្រាលជាង។"],
  },
  {
    id: "garlic",
    ingredient: ["Garlic (1 clove)", "ខ្ទឹមស (១ កំពឹស)"],
    swap: ["¼ tsp garlic powder or ½ tsp garlic flakes", "ម្សៅខ្ទឹមស ¼ ស្លាបព្រាកាហ្វេ ឬខ្ទឹមសស្ងួត ½ ស្លាបព្រាកាហ្វេ"],
    note: ["Fresh garlic is stronger — adjust to taste.", "ខ្ទឹមសស្រស់ខ្លាំងជាង — កែតាមរសជាតិ។"],
  },
  {
    id: "onion",
    ingredient: ["Onion (1 medium)", "ខ្ទឹមបារាំង (១ មធ្យម)"],
    swap: ["1 tbsp onion powder or 3 tbsp dried minced onion (rehydrated)", "ម្សៅខ្ទឹមបារាំង ១ ស្លាបព្រា ឬខ្ទឹមបារាំងស្ងួត ៣ ស្លាបព្រា (ត្រាំទឹក)"],
    note: ["Gives a milder onion flavour.", "ផ្ដល់រសជាតិខ្ទឹមបារាំងស្រាលជាង។"],
  },
  {
    id: "fresh-herbs",
    ingredient: ["Fresh herbs (1 tbsp chopped)", "ស្លឹកឈើក្រអូបស្រស់ (១ ស្លាបព្រា ហាន់)"],
    swap: ["1 tsp dried herbs", "ស្លឹកឈើក្រអូបស្ងួត ១ ស្លាបព្រាកាហ្វេ"],
    note: ["Add dried herbs earlier in cooking so they rehydrate.", "ដាក់ស្លឹកស្ងួតមុនក្នុងការចំអិន ដើម្បីឱ្យវាស្រូបទឹកវិញ។"],
  },
  {
    id: "lemon-juice",
    ingredient: ["Lemon juice (1 tsp)", "ទឹកក្រូចឆ្មារ (១ ស្លាបព្រាកាហ្វេ)"],
    swap: ["½ tsp white wine or apple cider vinegar", "ទឹកខ្មេះស្រាស ឬទឹកខ្មេះផ្លែប៉ោម ½ ស្លាបព្រាកាហ្វេ"],
    note: ["Slightly different tang; use in dressings and sauces.", "ជូរខុសបន្តិច ប្រើក្នុងទឹកសាឡាត់ និងទឹកជ្រលក់។"],
  },
  {
    id: "cooking-wine",
    ingredient: ["Cooking wine (1 cup)", "ស្រាសម្រាប់ចំអិន (១ ពែង)"],
    swap: ["1 cup broth + 1 tbsp vinegar or lemon juice", "ទឹកស៊ុប ១ ពែង + ទឹកខ្មេះ ឬទឹកក្រូចឆ្មារ ១ ស្លាបព្រា"],
    note: ["Adds liquid and acidity without alcohol.", "ផ្ដល់វត្ថុរាវ និងជាតិអាស៊ីត ដោយគ្មានជាតិអាល់កុល។"],
  },
  {
    id: "soy-sauce",
    ingredient: ["Soy sauce (1 tbsp)", "ទឹកស៊ីអ៊ីវ (១ ស្លាបព្រា)"],
    swap: ["1 tbsp tamari (gluten-free) or 1 tsp fish sauce + a little extra liquid", "tamari ១ ស្លាបព្រា (គ្មាន gluten) ឬទឹកត្រី ១ ស្លាបព្រាកាហ្វេ + ទឹកបន្តិចបន្ថែម"],
    note: ["Fish sauce is much stronger and saltier — use less.", "ទឹកត្រីខ្លាំង និងប្រៃជាងច្រើន — ប្រើតិច។"],
  },
  {
    id: "dairy-free-milk",
    ingredient: ["Milk (1 cup, dairy-free)", "ទឹកដោះគោ (១ ពែង គ្មានជាតិទឹកដោះសត្វ)"],
    swap: ["1 cup soy, oat or almond milk", "ទឹកសណ្ដែកសៀង ទឹកដោះគ្រាប់ oat ឬអាល់ម៉ុន ១ ពែង"],
    note: ["Soy milk is closest to cow's milk for baking.", "ទឹកសណ្ដែកសៀងជិតបំផុតនឹងទឹកដោះគោសម្រាប់ដុតនំ។"],
  },
  {
    id: "butter",
    ingredient: ["Butter (1 cup, baking)", "ប៊ឺ (១ ពែង ក្នុងការដុតនំ)"],
    swap: ["¾ cup vegetable oil (or 1 cup coconut oil, cooled)", "ប្រេងបន្លែ ¾ ពែង (ឬប្រេងដូង ១ ពែង ឱ្យត្រជាក់)"],
    note: ["Oil makes a moister, slightly denser crumb.", "ប្រេងធ្វើឱ្យនំសើម និងខាប់បន្តិច។"],
  },
  {
    id: "self-raising-flour",
    ingredient: ["Self-raising flour (1 cup)", "ម្សៅដុតនំដែលមានម្សៅដំបែស្រាប់ (១ ពែង)"],
    swap: ["1 cup all-purpose flour + 1½ tsp baking powder + ¼ tsp salt", "ម្សៅស្រូវសាលី ១ ពែង + baking powder ១½ ស្លាបព្រាកាហ្វេ + អំបិល ¼ ស្លាបព្រាកាហ្វេ"],
    note: ["Whisk well before measuring.", "កូរឱ្យសព្វមុនវាស់។"],
  },
];

export default function IngredientSubstitutionGuide() {
  const { text: t } = useLanguage();
  const [query, setQuery] = useToolState("ingredient-substitution:query", "");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUBSTITUTIONS;
    return SUBSTITUTIONS.filter(
      (s) =>
        s.ingredient[0].toLowerCase().includes(q) ||
        s.ingredient[1].includes(q) ||
        s.swap[0].toLowerCase().includes(q) ||
        s.swap[1].includes(q)
    );
  }, [query]);

  return (
    <ToolShell
      title="Ingredient Substitution Guide"
      khmerTitle="មគ្គុទ្ទេសក៍ជំនួសគ្រឿងផ្សំ"
      description="Search a curated reference of common cooking and baking substitutions. Ratios are common starting points — results vary by recipe."
      descriptionKm="ស្វែងរកក្នុងឯកសារយោងដែលបានជ្រើសរើស នៃការជំនួសគ្រឿងផ្សំក្នុងការធ្វើម្ហូប និងដុតនំទូទៅ។ សមាមាត្រជាចំណុចចាប់ផ្ដើមទូទៅ — លទ្ធផលអាចប្រែប្រួលតាមរូបមន្តនីមួយៗ។"
    >
      <Field
        label={t("Search", "ស្វែងរក")}
        hint={t("ingredient or substitute", "គ្រឿងផ្សំ ឬការជំនួស")}
      >
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("e.g. buttermilk or eggs", "ឧ. ទឹកដោះជូរ ឬស៊ុត")}
        />
      </Field>

      <div className="divide-y divide-[var(--ground-line)] rounded-md border border-[var(--ground-line)]">
        {results.map((s) => (
          <div key={s.id} className="px-3 py-2.5">
            <div className="text-sm font-medium text-[var(--gold)]">{t(s.ingredient[0], s.ingredient[1])}</div>
            <div className="mt-0.5 text-sm text-[var(--ink)]">{t(s.swap[0], s.swap[1])}</div>
            <div className="mt-0.5 text-xs text-[var(--ink-faint)]">{t(s.note[0], s.note[1])}</div>
          </div>
        ))}
        {results.length === 0 && (
          <div className="px-3 py-4 text-center text-sm text-[var(--ink-faint)]">
            {t("No match", "រកមិនឃើញទេ")}
          </div>
        )}
      </div>

      <p className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Curated reference only — these are common starting ratios, not guarantees. Taste and texture can change, especially in baking.",
          "ឯកសារយោងដែលបានជ្រើសរើសប៉ុណ្ណោះ — ទាំងនេះជាសមាមាត្រចាប់ផ្ដើមទូទៅ មិនមែនជាការធានាទេ។ រសជាតិ និងវាយនភាពអាចប្រែប្រួល ជាពិសេសក្នុងការដុតនំ។"
        )}
      </p>
    </ToolShell>
  );
}
