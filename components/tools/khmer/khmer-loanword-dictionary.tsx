"use client";

import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Row, Select, TextInput, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const ORIGINS = [
  { id: "sanskrit-pali", en: "Sanskrit / Pali", km: "សំស្ក្រឹត / បាលី" },
  { id: "french", en: "French", km: "បារាំង" },
  { id: "english", en: "English", km: "អង់គ្លេស" },
  { id: "chinese", en: "Chinese", km: "ចិន" },
  { id: "thai", en: "Thai", km: "ថៃ" },
  { id: "portuguese", en: "Portuguese", km: "ព័រទុយហ្គាល់" },
] as const;

type OriginId = (typeof ORIGINS)[number]["id"];

type Loanword = {
  word: string;
  origin: OriginId;
  meaningEn: string;
  meaningKm: string;
  exampleKm: string;
  exampleEn: string;
};

// Curated, meaning-focused list of common Khmer loanwords (ពាក្យកម្ចី).
// Origin attributions follow common Khmer linguistic references (e.g. Chuon
// Nath dictionary and the loanword literature); meanings/examples approximate.
const LOANWORDS: Loanword[] = [
  // ——— Sanskrit / Pali ———
  { word: "កម្ម", origin: "sanskrit-pali", meaningEn: "deed, action, karma", meaningKm: "អំពើ, សកម្មភាព, កម្មផល", exampleKm: "ធ្វើកម្មល្អ បានផលល្អ", exampleEn: "Do good deeds and you will reap good results." },
  { word: "ធម៌", origin: "sanskrit-pali", meaningEn: "dharma, doctrine, law, virtue", meaningKm: "ព្រះធម៌, ច្បាប់, ក្រមសីលធម៌", exampleKm: "ព្រឹកនេះ លោកតាទៅស្ដាប់ធម៌នៅវត្ត", exampleEn: "This morning Grandfather went to listen to the dharma at the pagoda." },
  { word: "ភាសា", origin: "sanskrit-pali", meaningEn: "language, speech", meaningKm: "ភាសានិយាយ, ការទំនាក់ទំនង", exampleKm: "គាត់ចេះនិយាយបីភាសា", exampleEn: "He can speak three languages." },
  { word: "សាលា", origin: "sanskrit-pali", meaningEn: "school, hall, building", meaningKm: "សាលារៀន, សាលាប្រជុំ", exampleKm: "ក្មេងៗទៅសាលារៀនរាល់ថ្ងៃ", exampleEn: "The children go to school every day." },
  { word: "ប្រទេស", origin: "sanskrit-pali", meaningEn: "country, nation", meaningKm: "រដ្ឋ, ដែនដី", exampleKm: "កម្ពុជាជាប្រទេសស្អាតមួយ", exampleEn: "Cambodia is a beautiful country." },
  { word: "សន្តិភាព", origin: "sanskrit-pali", meaningEn: "peace, harmony", meaningKm: "សេចក្ដីស្ងប់, ការគ្មានសង្គ្រាម", exampleKm: "យើងទាំងអស់គ្នាចង់បានសន្តិភាព", exampleEn: "We all want peace." },
  { word: "គ្រូ", origin: "sanskrit-pali", meaningEn: "teacher, master", meaningKm: "អ្នកបង្រៀន, អ្នកប្រដៅ", exampleKm: "គ្រូបង្រៀនសិស្សឲ្យចេះអាន", exampleEn: "The teacher teaches the students to read." },
  { word: "មនុស្ស", origin: "sanskrit-pali", meaningEn: "human being, person", meaningKm: "មនុស្សលោក, បុគ្គល", exampleKm: "មនុស្សគ្រប់រូបត្រូវគោរពច្បាប់", exampleEn: "Every person must respect the law." },
  { word: "ទេវតា", origin: "sanskrit-pali", meaningEn: "deity, angel, celestial being", meaningKm: "ទេព, អ្នកសួគ៌", exampleKm: "រឿងនេះនិយាយអំពីទេវតាសួគ៌", exampleEn: "This story is about heavenly deities." },
  { word: "សង្ឃ", origin: "sanskrit-pali", meaningEn: "monkhood, community of monks", meaningKm: "ព្រះសង្ឃ, អ្នកបួស", exampleKm: "ព្រឹកនេះសង្ឃរង់ចាំទទួលទាន", exampleEn: "This morning the monks waited to receive alms." },
  { word: "បញ្ញា", origin: "sanskrit-pali", meaningEn: "wisdom, intelligence", meaningKm: "ចំណេះឈ្លាសវៃ", exampleKm: "បញ្ញាប្រសើរជាងទ្រព្យសម្បត្តិ", exampleEn: "Wisdom is better than wealth." },
  { word: "មេត្តា", origin: "sanskrit-pali", meaningEn: "loving-kindness, goodwill", meaningKm: "សេចក្ដីស្រឡាញ់រាប់អាន", exampleKm: "ចូរមានមេត្តាចំពោះសត្វលោក", exampleEn: "Show kindness to all beings." },
  { word: "បាប", origin: "sanskrit-pali", meaningEn: "sin, evil deed", meaningKm: "អំពើអាក្រក់, កំហុស", exampleKm: "គាត់ខ្លាចបាប មិនហ៊ានធ្វើអំពើអាក្រក់", exampleEn: "He fears sin and dares not do wrong." },
  { word: "សុខ", origin: "sanskrit-pali", meaningEn: "happiness, well-being, comfort", meaningKm: "សេចក្ដីសប្បាយ, ការមានផាសុកភាព", exampleKm: "សូមជូនពរឲ្យបានសុខចម្រើន", exampleEn: "Wishing you happiness and prosperity." },
  { word: "ទុក្ខ", origin: "sanskrit-pali", meaningEn: "suffering, sorrow, pain", meaningKm: "សេចក្ដីឈឺចាប់, ទុក្ខព្រួយ", exampleKm: "ជីវិតមានទុក្ខ ក៏មានសុខដែរ", exampleEn: "Life has suffering, but also happiness." },
  { word: "រាជ", origin: "sanskrit-pali", meaningEn: "royal, kingly (prefix)", meaningKm: "របស់ស្ដេច, រាជវង្ស", exampleKm: "ព្រះរាជពិធីបុណ្យអុំទូក", exampleEn: "The royal boat-racing festival." },
  { word: "ប្រាសាទ", origin: "sanskrit-pali", meaningEn: "temple, palace, sanctuary", meaningKm: "អារាមថ្ម, វិមាន", exampleKm: "ប្រាសាទអង្គរវត្តល្បីពេញពិភពលោក", exampleEn: "The Angkor Wat temple is famous worldwide." },
  { word: "អក្សរ", origin: "sanskrit-pali", meaningEn: "letter, script, writing", meaningKm: "តួអក្សរ, អក្ខរាវិរុទ្ធ", exampleKm: "គាត់សរសេរអក្សរខ្មែរស្អាតណាស់", exampleEn: "He writes Khmer script very beautifully." },
  // ——— French ———
  { word: "កាហ្វេ", origin: "french", meaningEn: "coffee", meaningKm: "ភេសជ្ជៈពីគ្រាប់កាហ្វេ", exampleKm: "ព្រឹកៗ គាត់ផឹកកាហ្វេមួយកែវ", exampleEn: "Every morning he drinks a cup of coffee." },
  { word: "ម៉ាស៊ីន", origin: "french", meaningEn: "machine, engine", meaningKm: "គ្រឿងយន្ត, ម៉ូទ័រ", exampleKm: "ម៉ាស៊ីនបោកគក់ខូចហើយ", exampleEn: "The washing machine is broken." },
  { word: "ប៊ូតុង", origin: "french", meaningEn: "button (clothing or switch)", meaningKm: "ឡេវអាវ, ប៊ូតុងចុច", exampleKm: "ប៊ូតុងអាវរបស់គាត់របូត", exampleEn: "His shirt button came off." },
  { word: "ម៉ូតូ", origin: "french", meaningEn: "motorcycle, motorbike", meaningKm: "ទោចក្រយានយន្ត", exampleKm: "គាត់ជិះម៉ូតូទៅធ្វើការ", exampleEn: "He rides a motorcycle to work." },
  { word: "កាដូ", origin: "french", meaningEn: "gift, present", meaningKm: "អំណោយ", exampleKm: "នេះជាកាដូសម្រាប់ថ្ងៃកំណើតរបស់អ្នក", exampleEn: "This is a gift for your birthday." },
  { word: "ហ្វ្រាំង", origin: "french", meaningEn: "brake", meaningKm: "គ្រឿងទប់ល្បឿនយានយន្ត", exampleKm: "សូមពិនិត្យហ្វ្រាំងម៉ូតូមុនធ្វើដំណើរ", exampleEn: "Please check the motorcycle brakes before the trip." },
  { word: "ស៊ីម៉ង់ត៍", origin: "french", meaningEn: "cement", meaningKm: "ស៊ីម៉ង់ត៍សំណង់", exampleKm: "គេកំពុងចាក់ស៊ីម៉ង់ត៍ក្រាលទីធ្លា", exampleEn: "They are pouring cement for the yard." },
  { word: "វ៉ាក់សាំង", origin: "french", meaningEn: "vaccine", meaningKm: "ថ្នាំបង្ការជំងឺ", exampleKm: "កុមារទទួលវ៉ាក់សាំងការពារជំងឺ", exampleEn: "Children receive vaccines to prevent disease." },
  { word: "រ៉ូប", origin: "french", meaningEn: "dress, gown", meaningKm: "សម្លៀកបំពាក់នារី", exampleKm: "នាងស្លៀករ៉ូបពណ៌សទៅពិធី", exampleEn: "She wore a white dress to the ceremony." },
  { word: "ហ្គាស", origin: "french", meaningEn: "gas, cooking gas", meaningKm: "ឧស្ម័នសម្រាប់ចម្អិនអាហារ", exampleKm: "ផ្ទះបាយប្រើហ្គាសសម្រាប់ចម្អិនអាហារ", exampleEn: "The kitchen uses gas for cooking." },
  { word: "ប៊ិក", origin: "french", meaningEn: "pen, ballpoint pen", meaningKm: "ឧបករណ៍សរសេរ", exampleKm: "សូមខ្ចីប៊ិកមួយដើមមកសរសេរ", exampleEn: "Please lend me a pen to write with." },
  { word: "កៅស៊ូ", origin: "french", meaningEn: "rubber, elastic", meaningKm: "ជ័រកៅស៊ូ", exampleKm: "កម្ពុជាមានចម្ការកៅស៊ូច្រើន", exampleEn: "Cambodia has many rubber plantations." },
  { word: "ប៊ីយ៉ា", origin: "french", meaningEn: "beer", meaningKm: "ភេសជ្ជៈធ្វើពីគ្រាប់ស្រូវបាឡេ", exampleKm: "គាត់ផឹកប៊ីយ៉ាមួយកំប៉ុង", exampleEn: "He drank a can of beer." },
  // ——— English ———
  { word: "កុំព្យូទ័រ", origin: "english", meaningEn: "computer", meaningKm: "ម៉ាស៊ីនគណនាអេឡិចត្រូនិក", exampleKm: "គាត់ប្រើកុំព្យូទ័រយួរដៃសម្រាប់ធ្វើការ", exampleEn: "He uses a laptop computer for work." },
  { word: "អ៊ីនធឺណិត", origin: "english", meaningEn: "internet", meaningKm: "បណ្ដាញទំនាក់ទំនងសកល", exampleKm: "ភូមិខ្ញុំឥឡូវមានអ៊ីនធឺណិតហើយ", exampleEn: "My village now has internet." },
  { word: "ស្មាតហ្វូន", origin: "english", meaningEn: "smartphone", meaningKm: "ទូរស័ព្ទដៃឆ្លាតវៃ", exampleKm: "គាត់ទិញស្មាតហ្វូនថ្មីមួយ", exampleEn: "He bought a new smartphone." },
  { word: "អ៊ីមែល", origin: "english", meaningEn: "email", meaningKm: "សារអេឡិចត្រូនិក", exampleKm: "សូមផ្ញើឯកសារតាមអ៊ីមែលមកខ្ញុំ", exampleEn: "Please send the documents to me by email." },
  { word: "វេបសាយ", origin: "english", meaningEn: "website", meaningKm: "គេហទំព័រ", exampleKm: "វេបសាយនេះផ្ដល់ព័ត៌មានថ្មីៗ", exampleEn: "This website provides the latest news." },
  { word: "ហ្គេម", origin: "english", meaningEn: "game", meaningKm: "ល្បែងកម្សាន្តអេឡិចត្រូនិក", exampleKm: "ក្មេងៗចូលចិត្តលេងហ្គេមតាមទូរស័ព្ទ", exampleEn: "Children like playing games on their phones." },
  { word: "វីដេអូ", origin: "english", meaningEn: "video", meaningKm: "រូបភាពមានចលនា", exampleKm: "គ្រូបង្ហាញវីដេអូអប់រំដល់សិស្ស", exampleEn: "The teacher shows educational videos to the students." },
  { word: "កូពី", origin: "english", meaningEn: "to copy, photocopy", meaningKm: "ថតចម្លង", exampleKm: "សូមថតកូពីឯកសារនេះពីរច្បាប់", exampleEn: "Please make two copies of this document." },
  // ——— Chinese ———
  { word: "គុយទាវ", origin: "chinese", meaningEn: "flat rice-noodle soup", meaningKm: "ម្ហូបសរសៃអង្ករ", exampleKm: "ព្រឹកនេះខ្ញុំញ៉ាំគុយទាវមួយចាន", exampleEn: "This morning I had a bowl of kuyteav." },
  { word: "តៅហ៊ូ", origin: "chinese", meaningEn: "tofu, bean curd", meaningKm: "តៅហ៊ូធ្វើពីសណ្ដែកសៀង", exampleKm: "គាត់ចូលចិត្តតៅហ៊ូចៀន", exampleEn: "He likes fried tofu." },
  { word: "ឆា", origin: "chinese", meaningEn: "to stir-fry", meaningKm: "ចំអិនដោយកូរក្នុងខ្ទះក្ដៅ", exampleKm: "ម្ដាយខ្ញុំឆាបន្លែជាមួយសាច់គោ", exampleEn: "My mother stir-fries vegetables with beef." },
  { word: "មី", origin: "chinese", meaningEn: "wheat noodles", meaningKm: "សរសៃមីធ្វើពីម្សៅសាលី", exampleKm: "មីឆាជាអាហារពេញនិយម", exampleEn: "Fried noodles are a popular dish." },
  { word: "ហាង", origin: "chinese", meaningEn: "shop, store", meaningKm: "ផ្ទះលក់ដូរ", exampleKm: "ហាងនេះបើកពីព្រឹកដល់ល្ងាច", exampleEn: "This shop is open from morning to evening." },
  { word: "កៅអី", origin: "chinese", meaningEn: "chair, seat", meaningKm: "កន្លែងអង្គុយ", exampleKm: "សូមអង្គុយលើកៅអីនេះ", exampleEn: "Please sit on this chair." },
  // ——— Thai ———
  { word: "ឆ័ត្រ", origin: "thai", meaningEn: "umbrella, parasol", meaningKm: "ឆ័ត្របាំងថ្ងៃភ្លៀង", exampleKm: "ភ្លៀងធ្លាក់ហើយ សូមយកឆ័ត្រទៅជាមួយ", exampleEn: "It is raining, please take an umbrella." },
  { word: "ល្ខោន", origin: "thai", meaningEn: "theater, drama, ballet", meaningKm: "សិល្បៈសម្ដែងរឿង", exampleKm: "ល្ងាចនេះមានល្ខោននៅភូមិ", exampleEn: "There is a theatrical performance in the village tonight." },
  { word: "កាពិ", origin: "thai", meaningEn: "shrimp paste", meaningKm: "គ្រឿងផ្សំធ្វើពីកូនក្រឹមត្រាំអំបិល", exampleKm: "កាពិជាគ្រឿងផ្សំសំខាន់ក្នុងម្ហូបខ្មែរ", exampleEn: "Shrimp paste is a key ingredient in Khmer cooking." },
  { word: "ខ្នើយ", origin: "thai", meaningEn: "pillow, cushion", meaningKm: "ខ្នើយកល់ក្បាល", exampleKm: "គាត់ទិញខ្នើយថ្មីសម្រាប់គេង", exampleEn: "He bought a new pillow for sleeping." },
  { word: "បាទ", origin: "thai", meaningEn: "polite \u201cyes\u201d (male speaker)", meaningKm: "ពាក្យទទួលយកគួរសមរបស់បុរស", exampleKm: "បាទ ខ្ញុំយល់ហើយ", exampleEn: "Yes, I understand." },
  // ——— Portuguese ———
  { word: "ក្រដាស", origin: "portuguese", meaningEn: "paper", meaningKm: "វត្ថុស្ដើងសម្រាប់សរសេរ", exampleKm: "សូមឲ្យក្រដាសមួយសន្លឹកមកខ្ញុំ", exampleEn: "Please give me a sheet of paper." },
  { word: "នំប៉័ង", origin: "portuguese", meaningEn: "bread", meaningKm: "នំប៉័ងធ្វើពីម្សៅសាលី", exampleKm: "ព្រឹកនេះគាត់ញ៉ាំនំប៉័ងជាមួយទឹកដោះគោ", exampleEn: "This morning he ate bread with milk." },
  { word: "សាប៊ូ", origin: "portuguese", meaningEn: "soap", meaningKm: "គ្រឿងសម្អាតខ្លួនប្រាណ", exampleKm: "សូមទិញសាប៊ូមួយដុំ", exampleEn: "Please buy a bar of soap." },
  { word: "ឡៃឡុង", origin: "portuguese", meaningEn: "clearance sale, auction", meaningKm: "ការលក់បញ្ចុះតម្លៃទម្លាក់ស្តុក", exampleKm: "ហាងនេះកំពុងលក់ឡៃឡុង", exampleEn: "This shop is having a clearance sale." },
];

export default function KhmerLoanwordDictionary() {
  const { text: t } = useLanguage();
  const [query, setQuery] = useToolState("khmer-loanword-dictionary:query", "");
  const [origin, setOrigin] = useToolState("khmer-loanword-dictionary:origin", "all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LOANWORDS.filter((w) => {
      if (origin !== "all" && w.origin !== origin) return false;
      if (!q) return true;
      const originEn = ORIGINS.find((o) => o.id === w.origin)?.en.toLowerCase() ?? "";
      const originKm = ORIGINS.find((o) => o.id === w.origin)?.km ?? "";
      return (
        w.word.includes(q) ||
        w.meaningEn.toLowerCase().includes(q) ||
        w.meaningKm.includes(q) ||
        w.exampleKm.includes(q) ||
        w.exampleEn.toLowerCase().includes(q) ||
        originEn.includes(q) ||
        originKm.includes(q) ||
        w.origin.includes(q)
      );
    });
  }, [query, origin]);

  return (
    <ToolShell
      title="Khmer Loanword Dictionary"
      khmerTitle="វចនានុក្រមពាក្យកម្ចីខ្មែរ"
      description="Search a curated dictionary of common Khmer loanwords from Sanskrit/Pali, French, English, Chinese, Thai, and Portuguese, with meanings in English and Khmer and usage examples."
      descriptionKm="ស្វែងរកវចនានុក្រមដកស្រង់នៃពាក្យកម្ចីខ្មែរទូទៅពីសំស្ក្រឹត/បាលី បារាំង អង់គ្លេស ចិន ថៃ និងព័រទុយហ្គាល់ ជាមួយអត្ថន័យអង់គ្លេស និងខ្មែរ ព្រមទាំងឧទាហរណ៍ប្រើប្រាស់។"
    >
      <Row>
        <Field label="Search" labelKm="ស្វែងរក" hint="Word, origin, or meaning" hintKm="ពាក្យ ប្រភព ឬអត្ថន័យ">
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search loanwords…", "ស្វែងរកពាក្យកម្ចី…")}
            className="font-khmer"
          />
        </Field>
        <Field label="Origin language" labelKm="ភាសាប្រភព">
          <Select value={origin} onChange={(e) => setOrigin(e.target.value)}>
            <option value="all">{t("All origins", "គ្រប់ប្រភព")}</option>
            {ORIGINS.map((o) => (
              <option key={o.id} value={o.id}>
                {t(o.en, o.km)}
              </option>
            ))}
          </Select>
        </Field>
      </Row>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">
          {t(`${filtered.length} words`, `ពាក្យចំនួន ${filtered.length}`)}
        </h2>
        {filtered.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--ground-line)] p-6 text-sm text-[var(--ink-dim)]">
            {t("No loanwords match your search.", "រកមិនឃើញពាក្យកម្ចីត្រូវនឹងការស្វែងរកទេ។")}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((w) => {
              const originLabel = ORIGINS.find((o) => o.id === w.origin);
              return (
                <article key={w.word} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h3 lang="km" className="font-khmer text-lg font-semibold leading-relaxed text-[var(--ink)]">
                      {w.word}
                    </h3>
                    <span className="text-[10px] uppercase tracking-wide text-[var(--gold)]">
                      {t(originLabel?.en ?? w.origin, originLabel?.km ?? "")}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-dim)]">
                    {t("Meaning", "អត្ថន័យ")}: {w.meaningEn}
                  </p>
                  <p lang="km" className="mt-0.5 text-sm leading-relaxed text-[var(--ink-dim)]">
                    {t("អត្ថន័យ", "Meaning")}: {w.meaningKm}
                  </p>
                  <p className="mt-2 border-t border-[var(--ground-line)] pt-2 text-sm italic leading-relaxed text-[var(--ink-dim)]">
                    {t("Example", "ឧទាហរណ៍")}:{" "}
                    <span lang="km" className="font-khmer not-italic">
                      {w.exampleKm}
                    </span>{" "}
                    — {w.exampleEn}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Curated reference list of common Khmer loanwords (ពាក្យកម្ចី) for learning — not exhaustive and not an official dictionary. Origin attributions follow common Khmer linguistic references; meanings and examples are approximate. Verify with a standard dictionary for academic use.",
          "ជាបញ្ជីឯកសារយោងដកស្រង់នៃពាក្យកម្ចីខ្មែរទូទៅសម្រាប់ការរៀន — មិនមែនជាបញ្ជីពេញលេញ និងមិនមែនជាវចនានុក្រមផ្លូវការទេ។ ការកំណត់ប្រភពតាមឯកសារយោងភាសាខ្មែរទូទៅ; អត្ថន័យ និងឧទាហរណ៍គឺប្រហាក់ប្រហែល។ សម្រាប់ការប្រើប្រាស់ក្នុងការសិក្សា សូមផ្ទៀងផ្ទាត់ជាមួយវចនានុក្រមស្ដង់ដារ។"
        )}
      </p>
    </ToolShell>
  );
}
