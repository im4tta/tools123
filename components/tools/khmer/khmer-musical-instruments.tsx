"use client";
import { useMemo } from "react";
import { ToolShell, Field, Select, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Category = "Strings" | "Percussion" | "Wind";

interface Instrument {
  en: string;
  km: string;
  category: Category;
  descEn: string;
  descKm: string;
}

const INSTRUMENTS: Instrument[] = [
  { en: "Roneat Ek", km: "រនាតឯក", category: "Percussion", descEn: "Lead bamboo-keyed xylophone of the pinpeat orchestra.", descKm: "រនាតឯក ជារនាតមានសន្ទះឬស្សី ដឹកនាំបទភ្លេងក្នុងវង់ពិណពាទ្យ។" },
  { en: "Roneat Thung", km: "រនាតធុង", category: "Percussion", descEn: "Lower-register bamboo xylophone that answers the roneat ek.", descKm: "រនាតធុង ជារនាតសម្លេងធំ បំពេញភ្លេងជាមួយរនាតឯក។" },
  { en: "Roneat Dek", km: "រនាតដែក", category: "Percussion", descEn: "Xylophone with metal keys for a bright, carrying tone.", descKm: "រនាតដែក ជារនាតមានគ្រាប់ដែក សម្លេងភ្លឺឮឆ្ងាយ។" },
  { en: "Kong Vong Thom", km: "គងវង់ធំ", category: "Percussion", descEn: "Large circle of tuned gongs; bass voice of the pinpeat.", descKm: "គងវង់ធំ ជាវង់គងសម្លេងធំ ដាក់លើរនាន់រាងមូល។" },
  { en: "Kong Vong Touch", km: "គងវង់តូច", category: "Percussion", descEn: "Smaller, higher-pitched gong circle.", descKm: "គងវង់តូច ជាវង់គងតូច សម្លេងខ្ពស់។" },
  { en: "Chhing", km: "ឈិង", category: "Percussion", descEn: "Small brass finger cymbals that mark the beat.", descKm: "ឈិង ជាគងតូចពីរផ្គួប សម្រាប់សម្គាល់ចង្វាក់។" },
  { en: "Skor Thom", km: "ស្គរធំ", category: "Percussion", descEn: "Large barrel drums struck with sticks at both heads.", descKm: "ស្គរធំ ជាស្គរមាត្រធំ វាយដោយដំបងទាំងពីរខាង។" },
  { en: "Samphor", km: "សំភោរ (ស្គរសំភោរ)", category: "Percussion", descEn: "Double-headed barrel drum played with the hands; leads the pinpeat rhythm.", descKm: "សំភោរ ជាស្គរស្បែកពីរខាង វាយដោយដៃ ដឹកនាំចង្វាក់វង់ពិណពាទ្យ។" },
  { en: "Skor", km: "ស្គរ", category: "Percussion", descEn: "General Khmer word for drum; many sizes serve ceremonies and ensembles.", descKm: "ស្គរ ជាពាក្យទូទៅសម្រាប់ស្គរខ្មែរ មានច្រើនទំហំ ប្រើក្នុងពិធី និងវង់ភ្លេងផ្សេងៗ។" },
  { en: "Skor Arak", km: "ស្គរអារក្ស", category: "Percussion", descEn: "Ritual drum used in arak (spirit) ceremonies.", descKm: "ស្គរអារក្ស ជាស្គរសម្រាប់ពិធីបុណ្យអារក្ស។" },
  { en: "Tro", km: "ត្រុំ", category: "Strings", descEn: "Family of bowed string instruments (tro sau, tro che, tro khmer…).", descKm: "ត្រុំ ជាក្រុមឧបករណ៍ខ្សែទាញធ្នូ (ដូចជា ត្រុំសែ ត្រុំឆេ ត្រុំខ្មែរ…)។" },
  { en: "Tro Sau", km: "ត្រុំសែ", category: "Strings", descEn: "Two-stringed upright fiddle; a core voice of the mahori ensemble.", descKm: "ត្រុំសែ ជាត្រុំពីរខ្សែ ជាសម្លេងស្នូលក្នុងវង់មហោរី។" },
  { en: "Khim", km: "គិម", category: "Strings", descEn: "Hammered dulcimer with many strings, played with two bamboo beaters.", descKm: "គិម ជាឧបករណ៍ខ្សែច្រើន វាយដោយឈើពីរ។" },
  { en: "Takhe (Krapeu)", km: "តាខេ (ក្រាប់)", category: "Strings", descEn: "Three-stringed crocodile-shaped zither, plucked while lying flat.", descKm: "តាខេ ឬក្រាប់ ជាឧបករណ៍ខ្សែបី រាងដូចក្រពើ ដេកផ្ដេក ហើយគក់ខ្សែ។" },
  { en: "Chapei Dong Veng", km: "ចាប៉ីដងវែង", category: "Strings", descEn: "Long-necked two-stringed lute tied to Khmer storytelling.", descKm: "ចាប៉ីដងវែង ជាឧបករណ៍ខ្សែពីរ កវែង ជាប់ទាក់ទងនឹងការនិទានរឿងខ្មែរ។" },
  { en: "Pei Oak", km: "ប៉ីអក", category: "Wind", descEn: "Double-reed woodwind with a strong tone, used in pinpeat.", descKm: "ប៉ីអក ជាឧបករណ៍ខ្យល់ សម្លេងខ្លាំង ប្រើក្នុងវង់ពិណពាទ្យ។" },
  { en: "Sralai", km: "ស្រឡៃ", category: "Wind", descEn: "Conical oboe that carries the melody in pinpeat.", descKm: "ស្រឡៃ ជាឧបករណ៍ខ្យល់រាងកោណ ប្រគំភ្លេងមេក្នុងវង់ពិណពាទ្យ។" },
  { en: "Khloy", km: "ខ្លុយ", category: "Wind", descEn: "Bamboo flute used in mahori and folk music.", descKm: "ខ្លុយ ជាឧបករណ៍ខ្យល់ធ្វើពីឫស្សី ប្រើក្នុងវង់មហោរី និងភ្លេងប្រជាប្រិយ។" },
];

export default function KhmerMusicalInstruments() {
  const { text: t } = useLanguage();
  const [cat, setCat] = useToolState<Category | "All">("khmer-instruments:cat", "All");
  const [query, setQuery] = useToolState("khmer-instruments:query", "");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INSTRUMENTS.filter((i) => {
      const matchesCat = cat === "All" || i.category === cat;
      const matchesQuery = !q || i.en.toLowerCase().includes(q) || i.km.includes(q) || i.descEn.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [cat, query]);

  return (
    <ToolShell
      title="Khmer Musical Instruments"
      khmerTitle="ឧបករណ៍ភ្លេងប្រពៃណីខ្មែរ"
      description="Browse well-known traditional Khmer instruments used in pinpeat, mahori, and folk ensembles, grouped by family. Curated reference — descriptions are brief summaries, not scholarly entries."
      descriptionKm="ស្វែងរកឧបករណ៍ភ្លេងប្រពៃណីខ្មែរដ៏ល្បី ដែលប្រើក្នុងវង់ពិណពាទ្យ មហោរី និងភ្លេងប្រជាប្រិយ ដោយចាត់ជាក្រុមតាមប្រភេទ។ ឯកសារយោងដែលរើសរួច — ការពិពណ៌នាគ្រាន់តែជាសេចក្តីសង្ខេបខ្លីៗប៉ុណ្ណោះ។"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Category" labelKm="ប្រភេទ">
          <Select value={cat} onChange={(e) => setCat(e.target.value as Category | "All")}>
            <option value="All" label={t("All", "ទាំងអស់")} />
            <option value="Strings" label={t("Strings", "ខ្សែ")} />
            <option value="Percussion" label={t("Percussion", "គ្រឿងវាយ")} />
            <option value="Wind" label={t("Wind", "ខ្យល់")} />
          </Select>
        </Field>
        <Field label="Search" labelKm="ស្វែងរក">
          <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search English or Khmer..." />
        </Field>
      </div>

      <p className="text-xs text-[var(--ink-dim)]">
        {results.length} {t("instruments", "ឧបករណ៍ភ្លេង")}
      </p>

      <div className="space-y-1.5">
        {results.length === 0 && (
          <div className="py-8 text-center text-sm text-[var(--ink-dim)]">{t("No instruments match that filter.", "គ្មានឧបករណ៍ភ្លេងត្រូវនឹងការត្រងនេះទេ។")}</div>
        )}
        {results.map((i) => (
          <div key={i.en} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <div>
                <span className="font-khmer text-base font-semibold text-[var(--ink)]">{i.km}</span>
                <span className="ml-2 text-sm text-[var(--ink-dim)]">{i.en}</span>
              </div>
              <span className="rounded border border-[var(--ground-line)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--gold)]">
                {t(i.category, i.category === "Strings" ? "ខ្សែ" : i.category === "Percussion" ? "គ្រឿងវាយ" : "ខ្យល់")}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[var(--ink-dim)]">{i.descEn}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-dim)]">{i.descKm}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-[var(--ink-dim)]">
        {t("Curated reference — descriptions are brief summaries and not an authoritative catalogue.", "ឯកសារយោងដែលរើសរួច — ការពិពណ៌នាជាសេចក្តីសង្ខេបខ្លីៗ មិនមែនជាបញ្ជីផ្លូវការទេ។")}
      </p>
    </ToolShell>
  );
}
