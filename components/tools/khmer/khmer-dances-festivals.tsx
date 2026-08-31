"use client";
import { useMemo } from "react";
import { ToolShell, Field, Select, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Type = "Classical dance" | "Folk dance" | "Festival";

interface Entry {
  en: string;
  km: string;
  type: Type;
  timingEn: string;
  timingKm: string;
  descEn: string;
  descKm: string;
}

const ENTRIES: Entry[] = [
  { en: "Apsara Dance", km: "របាំអប្សរា", type: "Classical dance", timingEn: "Ancient court tradition (Angkor era)", timingKm: "ប្រពៃណីរាជវាំងតាំងពីសម័យអង្គរ", descEn: "The celestial-nymph dance carved on Angkor Wat; a signature of the royal ballet.", descKm: "របាំទេពធីតាអប្សរា ដែលឆ្លាក់លើប្រាសាទអង្គរវត្ត ជារបាំដ៏ល្បីនៃរបាំព្រះរាជទ្រព្យ។" },
  { en: "Robam Kbach Boran", km: "របាំក្បាច់បូរាណ", type: "Classical dance", timingEn: "Ancient court tradition", timingKm: "ប្រពៃណីរាជវាំងពីបុរាណ", descEn: "The codified classical dance style of the royal ballet, with bent fingers and slow symbolic gestures.", descKm: "របាំក្បាច់បុរាណ ជារបៀបរបាំរបស់របាំព្រះរាជទ្រព្យ មានម្រាមដៃកោង និងកាយវិការយឺតៗប្រកបដោយន័យ។" },
  { en: "Royal Ballet (Robam Preah Reachtroap)", km: "របាំព្រះរាជទ្រព្យ", type: "Classical dance", timingEn: "Royal court tradition", timingKm: "ប្រពៃណីរាជវាំង", descEn: "The Royal Ballet of Cambodia, recognized by UNESCO in 2003 as a masterpiece of intangible heritage.", descKm: "របាំព្រះរាជទ្រព្យ ជារបាំរបស់ព្រះរាជវាំងកម្ពុជា ដែលយូណេស្កូបានទទួលស្គាល់ក្នុងឆ្នាំ ២០០៣ ជាស្នាដៃអរូបីរបស់មនុស្សជាតិ។" },
  { en: "Trot Dance", km: "របាំត្រុដិ", type: "Folk dance", timingEn: "Khmer New Year (mid-April)", timingKm: "ពិធីចូលឆ្នាំខ្មែរ (ពាក់កណ្ដាលខែមេសា)", descEn: "Comic folk dance where performers imitate buffaloes and farmers; a staple of New Year games.", descKm: "របាំត្រុដិ ជារបាំប្រជាប្រិយលេងសើច ធ្វើត្រាប់តាមគោ និងកសិករ ជារបាំសំខាន់ក្នុងពិធីចូលឆ្នាំខ្មែរ។" },
  { en: "Robam Kandob Ses", km: "របាំកណ្ដូបសេះ", type: "Folk dance", timingEn: "Village festivals and weddings (Svay Rieng)", timingKm: "បុណ្យភូមិ និងពិធីមង្គលការ (ខេត្តស្វាយរៀង)", descEn: "Praying-mantis dance from Svay Rieng; dancers tap coconut shells tied to their hands.", descKm: "របាំកណ្ដូបសេះ ជារបាំប្រជាប្រិយពីខេត្តស្វាយរៀង ធ្វើត្រាប់តាមសត្វកណ្ដូបសេះ អ្នករាំគោះសំបកដូងដែលចងនឹងដៃ។" },
  { en: "Robam Nesat", km: "របាំនេសាទ", type: "Folk dance", timingEn: "Coastal and Tonlé Sap fishing communities", timingKm: "សហគមន៍នេសាទតាមឆ្នេរ និងបឹងទន្លេសាប", descEn: "Fishermen dance mimicking casting nets and rowing boats.", descKm: "របាំនេសាទ ជារបាំធ្វើត្រាប់តាមការបោះសំណាញ់ និងចែវទូករបស់អ្នកនេសាទ។" },
  { en: "Pailin Peacock Dance", km: "របាំក្ងោកប៉ៃលិន", type: "Folk dance", timingEn: "Pailin (Kula community)", timingKm: "ខេត្តប៉ៃលិន (ជនជាតិកុឡា)", descEn: "Peacock dance portraying the Kula people of Pailin amusing themselves with peafowl.", descKm: "របាំក្ងោកប៉ៃលិន ជារបាំបង្ហាញពីជនជាតិកុឡានៅប៉ៃលិន លេងសប្បាយជាមួយសត្វក្ងោក។" },
  { en: "Chhayam", km: "ចៃយ៉ាំ", type: "Folk dance", timingEn: "Weddings, pagoda festivals, New Year", timingKm: "ពិធីមង្គលការ បុណ្យវត្ត និងចូលឆ្នាំ", descEn: "Comic troupe entertainment with drums, acrobatics, and improvised jokes.", descKm: "ចៃយ៉ាំ ជាក្រុមលេងសប្បាយមានស្គរ កាយវិការ និងរឿងកំប្លែង សម្ដែងក្នុងពិធីមង្គលការ បុណ្យវត្ត និងចូលឆ្នាំ។" },
  { en: "Khmer New Year", km: "ចូលឆ្នាំខ្មែរ", type: "Festival", timingEn: "Mid-April (about April 13–16; announced officially each year)", timingKm: "ពាក់កណ្ដាលខែមេសា (ប្រហែលថ្ងៃទី ១៣–១៦ មេសា ប្រកាសជាផ្លូវការរាល់ឆ្នាំ)", descEn: "Three-day national holiday (Moha Songkran) marking the solar new year with games, music, and family gatherings.", descKm: "បុណ្យជាតិបីថ្ងៃ (មហាសង្រ្កាន្ត) ជាថ្ងៃចូលឆ្នាំថ្មីតាមព្រះអាទិត្យ មានល្បែងកម្សាន្ត ភ្លេង និងការជួបជុំគ្រួសារ។" },
  { en: "Pchum Ben", km: "ភ្ជុំបិណ្ឌ", type: "Festival", timingEn: "September–October (15 days; ends on the new moon of Phatrobot)", timingKm: "ខែកញ្ញា–តុលា (១៥ ថ្ងៃ បញ្ចប់នៅថ្ងៃ ១ រោច ខែភទ្របទ)", descEn: "Ancestors festival when food offerings are made for the dead at pagodas.", descKm: "បុណ្យដូនតា ១៥ ថ្ងៃ ថ្វាយបង្គុំដល់វិញ្ញាណក្ខន្ធអ្នកស្លាប់នៅវត្ត។" },
  { en: "Bon Om Touk", km: "បុណ្យអុំទូក", type: "Festival", timingEn: "November (full moon of Kadeuk)", timingKm: "ខែវិច្ឆិកា (ពេញបូរមីខែកត្តិក)", descEn: "Water Festival: boat races on the Tonlé Sap, illuminated floats, and fireworks in Phnom Penh.", descKm: "បុណ្យអុំទូក៖ ការប្រណាំងទូកលើទន្លេសាប ទូកភ្លើង និងកាំជ្រួចនៅភ្នំពេញ។" },
  { en: "Visak Bochea", km: "បុណ្យវិសាខបូជា", type: "Festival", timingEn: "April–May (full moon of Visakh)", timingKm: "ខែមេសា–ឧសភា (ពេញបូរមីខែពិសាខ)", descEn: "Buddhist observance of the Buddha's birth, enlightenment, and passing.", descKm: "បុណ្យរំឭកដល់ការប្រសូត ត្រាស់ដឹង និងចូលបរិនិព្វានរបស់ព្រះពុទ្ធ។" },
  { en: "Meak Bochea", km: "បុណ្យមាឃបូជា", type: "Festival", timingEn: "January–February (full moon of Meak)", timingKm: "ខែមករា–កុម្ភៈ (ពេញបូរមីខែមាឃ)", descEn: "Buddhist homage on the full moon of Meak, recalling a gathering of the Buddha's disciples.", descKm: "បុណ្យគោរពព្រះពុទ្ធនៅថ្ងៃពេញបូរមីខែមាឃ នឹកដល់ការជួបជុំរបស់ព្រះសាវ័ក។" },
  { en: "Chol Vossa (Buddhist Lent)", km: "បុណ្យចូលព្រះវស្សា", type: "Festival", timingEn: "July (first waning day of Asath)", timingKm: "ខែកក្កដា (ថ្ងៃ ១ រោច ខែអាសាឍ)", descEn: "Entrance of the three-month Buddhist rains retreat for monks.", descKm: "បុណ្យចូលវស្សាបីខែរបស់ព្រះសង្ឃ។" },
  { en: "Kathina", km: "បុណ្យកឋិន", type: "Festival", timingEn: "October–November (after Buddhist Lent)", timingKm: "ខែតុលា–វិច្ឆិកា (បន្ទាប់ពីចេញវស្សា)", descEn: "Robe-offering ceremony held after the rains retreat ends.", descKm: "ពិធីប្រគេនចីវរកឋិន ធ្វើបន្ទាប់ពីចេញវស្សា។" },
  { en: "Bon Phum", km: "បុណ្យភូមិ", type: "Festival", timingEn: "Varies by village (often after the harvest)", timingKm: "ប្រែប្រួលតាមភូមិ (ច្រើនធ្វើក្រោយរដូវច្រូតកាត់)", descEn: "Local village festival with games, music, and food honoring the village guardian spirits.", descKm: "បុណ្យប្រចាំភូមិ មានល្បែង ភ្លេង និងម្ហូប ដើម្បីគោរពអ្នកតាក្នុងភូមិ។" },
];

export default function KhmerDancesFestivals() {
  const { text: t } = useLanguage();
  const [type, setType] = useToolState<Type | "All">("khmer-dances:type", "All");
  const [query, setQuery] = useToolState("khmer-dances:query", "");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ENTRIES.filter((e) => {
      const matchesType = type === "All" || e.type === type;
      const matchesQuery = !q || e.en.toLowerCase().includes(q) || e.km.includes(q) || e.descEn.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [type, query]);

  const typeKm = (ty: Type) =>
    ty === "Classical dance" ? "របាំក្បាច់បុរាណ" : ty === "Folk dance" ? "របាំប្រជាប្រិយ" : "ពិធីបុណ្យ";

  return (
    <ToolShell
      title="Khmer Dances & Festivals"
      khmerTitle="របាំ និងពិធីបុណ្យខ្មែរ"
      description="Browse well-known Khmer classical and folk dances and the main festivals of the year, with approximate timing and a short description. Curated reference — dates and customs vary by year and region; verify official dates before planning."
      descriptionKm="ស្វែងរករបាំបុរាណ របាំប្រជាប្រិយ និងពិធីបុណ្យសំខាន់ៗរបស់កម្ពុជា ជាមួយពេលវេលាប្រហាក់ប្រហែល និងការពិពណ៌នាខ្លីៗ។ ឯកសារយោងដែលរើសរួច — កាលបរិច្ឆេទ និងទំនៀមទម្លាប់ប្រែប្រួលតាមឆ្នាំ និងតំបន់ សូមផ្ទៀងផ្ទាត់កាលបរិច្ឆេទផ្លូវការមុនរៀបចំផែនការ។"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Category" labelKm="ប្រភេទ">
          <Select value={type} onChange={(e) => setType(e.target.value as Type | "All")}>
            <option value="All" label={t("All", "ទាំងអស់")} />
            <option value="Classical dance" label={t("Classical dance", "របាំក្បាច់បុរាណ")} />
            <option value="Folk dance" label={t("Folk dance", "របាំប្រជាប្រិយ")} />
            <option value="Festival" label={t("Festival", "ពិធីបុណ្យ")} />
          </Select>
        </Field>
        <Field label="Search" labelKm="ស្វែងរក">
          <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search English or Khmer..." />
        </Field>
      </div>

      <p className="text-xs text-[var(--ink-dim)]">
        {results.length} {t("entries", "ធាតុ")}
      </p>

      <div className="space-y-1.5">
        {results.length === 0 && (
          <div className="py-8 text-center text-sm text-[var(--ink-dim)]">{t("No dances or festivals match that filter.", "គ្មានរបាំ ឬពិធីបុណ្យត្រូវនឹងការត្រងនេះទេ។")}</div>
        )}
        {results.map((e) => (
          <div key={e.en} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <div>
                <span className="font-khmer text-base font-semibold text-[var(--ink)]">{e.km}</span>
                <span className="ml-2 text-sm text-[var(--ink-dim)]">{e.en}</span>
              </div>
              <span className="rounded border border-[var(--ground-line)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--gold)]">
                {t(e.type, typeKm(e.type))}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[var(--ink-dim)]">
              <span className="font-medium text-[var(--gold)]">{t("When", "ពេលវេលា")}: </span>
              {t(e.timingEn, e.timingKm)}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-dim)]">{e.descEn}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-dim)]">{e.descKm}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-[var(--ink-dim)]">
        {t("Curated reference — descriptions are brief summaries; festival dates follow the Buddhist lunar calendar and are announced officially each year.", "ឯកសារយោងដែលរើសរួច — ការពិពណ៌នាជាសេចក្តីសង្ខេបខ្លីៗ កាលបរិច្ឆេទបុណ្យតាមប្រតិទិនចន្ទគតិ ហើយត្រូវប្រកាសជាផ្លូវការរាល់ឆ្នាំ។")}
      </p>
    </ToolShell>
  );
}
