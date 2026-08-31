"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface Dish {
  en: string;
  km: string;
  descEn: string;
}

const DISHES: Dish[] = [
  { en: "Amok", km: "អាម៉ុក", descEn: "Steamed fish (or chicken) curry in coconut milk, served in a banana-leaf bowl." },
  { en: "Bai Cha (fried rice)", km: "បាយឆា", descEn: "Classic Khmer fried rice, often with garlic, vegetables, and egg." },
  { en: "Bai Sach Chrouk", km: "បាយសាច់ជ្រូក", descEn: "Grilled pork over rice, a popular breakfast." },
  { en: "Bai S'ek (sticky rice)", km: "បាយស្អិត", descEn: "Sticky rice, a staple at festivals and ceremonies." },
  { en: "Borbor (rice porridge)", km: "បបរ", descEn: "Rice porridge, commonly eaten for breakfast or when ill." },
  { en: "Prahok", km: "ប្រហុក", descEn: "Fermented fish paste; a cornerstone of Khmer cooking." },
  { en: "Prahok Ktiss", km: "ប្រហុកខ្ទិះ", descEn: "Prahok dip simmered with coconut milk, served with fresh vegetables." },
  { en: "Prahok Cha", km: "ប្រហុកឆា", descEn: "Stir-fried prahok with pork, eggs, and chilies." },
  { en: "Kroeung", km: "គ្រឿង", descEn: "Aromatic herb-and-spice paste used to season many Khmer dishes." },
  { en: "Chha Kroeung", km: "ឆាគ្រឿង", descEn: "Stir-fry seasoned with kroeung paste, typically chicken or beef." },
  { en: "Samlor Korkor", km: "សម្លរកកូរ", descEn: "Thick, earthy soup with prahok and assorted vegetables." },
  { en: "Samlor Machu", km: "សម្លរម្ជូរ", descEn: "Sour soup, often with fish and tamarind or lime." },
  { en: "Samlor Ktis", km: "សម្លរខ្ទិះដូង", descEn: "Chicken curry simmered in coconut cream." },
  { en: "Samlor Kari", km: "សម្លរការី", descEn: "Khmer red curry, often with chicken and sweet potatoes." },
  { en: "Samlor Proher", km: "សម្លរប្រហើរ", descEn: "Aromatic mixed-vegetable soup scented with herbs." },
  { en: "Num Banh Chok", km: "នំបញ្ចុក", descEn: "Fresh rice noodles topped with fish gravy; 'Khmer noodles'." },
  { en: "Kuyteav", km: "គុយទាវ", descEn: "Rice-noodle soup with pork, seafood, or beef broth." },
  { en: "Kuyteav Cha", km: "គុយទាវឆា", descEn: "Stir-fried rice noodles with egg and vegetables." },
  { en: "Mee Cha", km: "មីឆា", descEn: "Fried egg noodles with meat and vegetables." },
  { en: "Mee Kola", km: "មីកុឡែ", descEn: "Cold stir-fried rice noodles with pickled vegetables, from the Khmer community of the Mekong delta." },
  { en: "Lok Lak", km: "ឡូកឡាក់", descEn: "Cubed beef stir-fry served with a lime-pepper dip and rice." },
  { en: "Pleah Sach Ko", km: "ព្លាចសាច់គោ", descEn: "Raw beef salad dressed with lime and fish sauce." },
  { en: "Kdam Chha (Kampot pepper crab)", km: "ក្តាមឆាម្រេចកំពត", descEn: "Stir-fried crab with Kampot pepper, a coastal specialty." },
  { en: "Ngam Nguv", km: "ង៉ាំងញូវ", descEn: "Pickled pork-hock soup with a sour, garlicky broth." },
  { en: "Trey Ngeat", km: "ត្រីងៀត", descEn: "Dried and smoked fish, grilled and served with rice and vegetables." },
  { en: "Trey Ang", km: "ត្រីអាំង", descEn: "Grilled whole fish, often served with fresh herbs and a dipping sauce." },
  { en: "Num Pao", km: "នំប៉ាវ", descEn: "Steamed bun with a savory filling, a popular snack." },
  { en: "Banh Chheov", km: "បាញ់ឆែវ", descEn: "Crispy fried chive-and-rice cake, served with pickled vegetables." },
  { en: "Banh Chao", km: "បាញ់ឆៅ", descEn: "Khmer savory crepe filled with pork, shrimp, and bean sprouts." },
  { en: "Num Ansom", km: "នំអន្សម", descEn: "Banana-leaf-wrapped sticky-rice cake with pork and mung bean." },
  { en: "Ansom Chek", km: "នំអន្សមចេក", descEn: "Sweet banana version of the sticky-rice cake." },
  { en: "Num Kralan", km: "នំក្រឡាន", descEn: "Sticky rice and coconut steamed inside bamboo tubes." },
  { en: "Num Pong Tea", km: "នំពងទា", descEn: "Steamed duck-egg cake, a popular street food." },
  { en: "Num Pang (baguette)", km: "នំប៉័ង", descEn: "French-style baguette, the base for sandwiches and street snacks." },
  { en: "Chek Aing", km: "ចេកអាំង", descEn: "Grilled bananas with coconut cream." },
  { en: "Skor Tnaot (palm sugar)", km: "ស្ករត្នោត", descEn: "Palm sugar made from the sap of sugar-palm flowers." },
  { en: "Tuk Tnaot (palm juice)", km: "ទឹកត្នោត", descEn: "Fresh sugar-palm sap, a seasonal drink." },
  { en: "Tuk Doung (coconut water)", km: "ទឹកដូង", descEn: "Fresh coconut water, sold chilled by street vendors." },
  { en: "Tuk Ampov (sugarcane juice)", km: "ទឹកអំពៅ", descEn: "Freshly pressed sugarcane juice with ice." },
  { en: "Tuk Trey (fish sauce)", km: "ទឹកត្រី", descEn: "Khmer fish sauce, the everyday seasoning of Khmer kitchens." },
];

export default function KhmerDishGlossary() {
  const { text: t } = useLanguage();
  const [query, setQuery] = useToolState("khmer-dishes:query", "");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DISHES.filter((d) => !q || d.en.toLowerCase().includes(q) || d.km.includes(q));
  }, [query]);

  return (
    <ToolShell
      title="Khmer Dish Glossary"
      khmerTitle="វចនានុក្រមម្ហូបខ្មែរ"
      description="Bilingual English–Khmer glossary of well-known Khmer dishes, snacks, and drinks. Search in either script — English or Khmer. Curated glossary — descriptions are brief."
      descriptionKm="វចនានុក្រមពីរភាសា អង់គ្លេស–ខ្មែរ នៃម្ហូប អាហារសម្រន់ និងភេសជ្ជៈខ្មែរដ៏ល្បី។ អាចស្វែងរកជាអក្សរអង់គ្លេស ឬអក្សរខ្មែរ។ វចនានុក្រមដែលរើសរួច — ការពិពណ៌នាខ្លីៗប៉ុណ្ណោះ។"
    >
      <Field label="Search" labelKm="ស្វែងរក">
        <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search English or Khmer..." />
      </Field>

      <p className="text-xs text-[var(--ink-dim)]">
        {results.length} {t("dishes and drinks", "មុខម្ហូប និងភេសជ្ជៈ")}
      </p>

      <div className="space-y-1.5">
        {results.length === 0 && (
          <div className="py-8 text-center text-sm text-[var(--ink-dim)]">{t("No dishes match that search.", "គ្មានម្ហូបត្រូវនឹងការស្វែងរកនេះទេ។")}</div>
        )}
        {results.map((d) => (
          <div key={d.en} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <div>
                <span className="font-khmer text-base font-semibold text-[var(--ink)]">{d.km}</span>
                <span className="ml-2 text-sm text-[var(--ink-dim)]">{d.en}</span>
              </div>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[var(--ink-dim)]">{d.descEn}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-[var(--ink-dim)]">
        {t("Curated glossary — descriptions are brief; recipes and spellings vary by region and family.", "វចនានុក្រមដែលរើសរួច — ការពិពណ៌នាខ្លីៗ រូបមន្ត និងការសរសេរអាចខុសគ្នាតាមតំបន់ និងគ្រួសារ។")}
      </p>
    </ToolShell>
  );
}
