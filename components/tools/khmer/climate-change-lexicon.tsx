"use client";
import { ToolShell } from "@/components/ui/Shell";
import { Lexicon, type LexiconItem, type LexiconTab } from "@/components/ui/Lexicon";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useLanguage } from "@/components/LanguageProvider";
import { CLIMATE_LEXICON_TERMS } from "@/lib/data/climate-lexicon";
import { CLIMATE_LEXICON_PROVENANCE } from "@/lib/data/climate-lexicon-provenance";

const TABS: LexiconTab[] = [
  { id: "defined", label: "With definition", labelKm: "មាននិយមន័យ" },
  { id: "index", label: "Index only", labelKm: "តែក្នុងបញ្ជីពាក្យ" },
];

const ITEMS: LexiconItem[] = CLIMATE_LEXICON_TERMS.map((term, i) => {
  const indexOnly = term.page.startsWith("idx");
  return {
    id: String(i + 1),
    term: term.en,
    termKm: term.km,
    tag: indexOnly ? "index" : "defined",
    defKm: term.def || undefined,
    extras: indexOnly
      ? [
          {
            label: "Note",
            labelKm: "កំណត់សម្គាល់",
            value: "From the book's English–Khmer index. Its definition is on a page not added yet. / មកពីបញ្ជីពាក្យអង់គ្លេស-ខ្មែររបស់សៀវភៅ។ និយមន័យរបស់វានៅលើទំព័រដែលមិនទាន់បានបញ្ចូល។",
          },
        ]
      : undefined,
  };
});

const DEFINED = CLIMATE_LEXICON_TERMS.filter((term) => !term.page.startsWith("idx")).length;
const INDEX_ONLY = CLIMATE_LEXICON_TERMS.length - DEFINED;

export default function ClimateChangeLexicon() {
  const { text: t } = useLanguage();

  return (
    <ToolShell
      title="Climate Change Lexicon"
      khmerTitle="សទ្ទានុក្រមការប្រែប្រួលអាកាសធាតុ"
      description="Khmer–English climate change terms with Khmer definitions, from the Lexicon of Climate Change (Ministry of Environment, NCSD and the National Council of Khmer Language, 2017) — adaptation, mitigation, carbon markets, the Kyoto Protocol and more."
      descriptionKm="បច្ចេកសព្ទការប្រែប្រួលអាកាសធាតុខ្មែរ-អង់គ្លេស ជាមួយនិយមន័យជាភាសាខ្មែរ ពីសទ្ទានុក្រមការប្រែប្រួលអាកាសធាតុ (ក្រសួងបរិស្ថាន ក្រុមប្រឹក្សាជាតិអភិវឌ្ឍន៍ដោយចីរភាព និងក្រុមប្រឹក្សាជាតិភាសាខ្មែរ ឆ្នាំ២០១៧) — បន្ស៊ាំ ការកាត់បន្ថយ ទីផ្សារកាបូន ពិធីសារក្យូតូ និងច្រើនទៀត។"
    >
      <Lexicon
        items={ITEMS}
        storagePrefix="climate-change-lexicon"
        name="Climate change"
        nameKm="ការប្រែប្រួលអាកាសធាតុ"
        searchPlaceholder="English or Khmer…"
        searchPlaceholderKm="អង់គ្លេស ឬខ្មែរ…"
        tabs={INDEX_ONLY > 0 ? TABS : undefined}
        toolId="climate-change-lexicon"
        cardTitle="Climate Change Lexicon"
        cardTitleKm="សទ្ទានុក្រមការប្រែប្រួលអាកាសធាតុ"
        credit={() => "Source: Lexicon of Climate Change (MoE, NCSD & National Council of Khmer Language, 2017)"}
      />
      <SourceCredits>
        <p>
          {t(
            `Terms and Khmer definitions come from the Lexicon of Climate Change (សទ្ទានុក្រមការប្រែប្រួលអាកាសធាតុ), 1st edition, 2017, by the Climate Change Department of the National Council for Sustainable Development (NCSD) and the Ministry of Environment, with the National Council of Khmer Language. Its foreword says it was compiled from the IPCC glossary.`,
            `ពាក្យ និងនិយមន័យខ្មែរ មកពីសទ្ទានុក្រមការប្រែប្រួលអាកាសធាតុ បោះពុម្ពលើកទី១ ឆ្នាំ២០១៧ របស់នាយកដ្ឋានប្រែប្រួលអាកាសធាតុនៃអគ្គលេខាធិការដ្ឋានក្រុមប្រឹក្សាជាតិអភិវឌ្ឍន៍ដោយចីរភាព និងក្រសួងបរិស្ថាន រួមជាមួយក្រុមប្រឹក្សាជាតិភាសាខ្មែរ។ បុព្វកថារបស់សៀវភៅបញ្ជាក់ថា វាត្រូវបានចងក្រងដោយផ្អែកលើសទ្ទានុក្រមរបស់ IPCC។`,
          )}
        </p>
        <p>
          {t(
            `Added so far: ${DEFINED} defined terms from the Khmer–English section (pages 11–140)${INDEX_ONLY > 0 ? ` and ${INDEX_ONLY} more terms from the English–Khmer index` : ""}. The abbreviations section is not added yet. Reproduced as supplied. Not endorsed by the Ministry, NCSD or the National Council of Khmer Language.`,
            `បានបញ្ចូលរួច៖ ពាក្យមាននិយមន័យចំនួន ${DEFINED} ពីផ្នែកខ្មែរ-អង់គ្លេស (ទំព័រ ១១–១៤០)${INDEX_ONLY > 0 ? ` និងពាក្យចំនួន ${INDEX_ONLY} ទៀតពីបញ្ជីពាក្យអង់គ្លេស-ខ្មែរ` : ""}។ ផ្នែកអក្សរកាត់មិនទាន់បានបញ្ចូលទេ។ ចម្លងតាមដែលបានផ្តល់។ មិនមែនជាការគាំទ្រពីក្រសួង ក្រុមប្រឹក្សាជាតិអភិវឌ្ឍន៍ដោយចីរភាព ឬក្រុមប្រឹក្សាជាតិភាសាខ្មែរទេ។`,
          )}
        </p>
        {CLIMATE_LEXICON_PROVENANCE.license === undefined && (
          <p>{t("The book is marked “all rights reserved”; permission to reproduce it here is not yet confirmed (Provenance Pending).", "សៀវភៅនេះមានសម្គាល់ «រក្សាសិទ្ធិ» ការអនុញ្ញាតឱ្យចម្លងនៅទីនេះមិនទាន់បានបញ្ជាក់ (Provenance Pending)។")}</p>
        )}
      </SourceCredits>
    </ToolShell>
  );
}
