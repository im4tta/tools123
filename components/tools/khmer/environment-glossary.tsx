"use client";
import { ToolShell } from "@/components/ui/Shell";
import { Lexicon, type LexiconItem } from "@/components/ui/Lexicon";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useLanguage } from "@/components/LanguageProvider";
import { MOE_ENV_NOTES, MOE_ENV_TERMS } from "@/lib/data/moe-env-lexicon";
import { MOE_ENV_LEXICON_PROVENANCE } from "@/lib/data/moe-env-lexicon-provenance";

const ITEMS: LexiconItem[] = MOE_ENV_TERMS.map((m) => {
  const note = MOE_ENV_NOTES[m.no];
  return {
    id: String(m.no),
    term: m.en,
    termKm: m.km,
    defKm: m.defKm,
    extras: [
      { label: "Lexicon No.", labelKm: "លេខរៀង", value: String(m.no) },
      ...(note ? [{ label: "Note on the source text", labelKm: "កំណត់សម្គាល់លើអត្ថបទប្រភព", value: `${note.en} / ${note.km}` }] : []),
    ],
  };
});

export default function EnvironmentGlossary() {
  const { text: t } = useLanguage();
  const [sourceUrl] = MOE_ENV_LEXICON_PROVENANCE.sources;

  return (
    <ToolShell
      title="Environment & Natural Resources Glossary"
      khmerTitle="វចនានុក្រមបរិស្ថាន និងធនធានធម្មជាតិ"
      description="Khmer–English terms from the Lexicon of the Code of Environment and Natural Resources (Ministry of Environment, Cambodia), with the Khmer definition of each term. For practical reference, not a legal text."
      descriptionKm="ពាក្យខ្មែរ-អង់គ្លេសពីវចនានុក្រមនៃក្រមបរិស្ថាន និងធនធានធម្មជាតិ (ក្រសួងបរិស្ថាន) ព្រមទាំងនិយមន័យជាភាសាខ្មែរនៃពាក្យនីមួយៗ។ សម្រាប់ជាឯកសារយោងជាក់ស្តែង មិនមែនជាអត្ថបទច្បាប់ទេ។"
    >
      <Lexicon
        items={ITEMS}
        storagePrefix="environment-glossary"
        name="Glossary"
        nameKm="វចនានុក្រម"
        searchPlaceholder="English or Khmer…"
        searchPlaceholderKm="អង់គ្លេស ឬខ្មែរ…"
        toolId="environment-glossary"
        cardTitle="Environment & Natural Resources Glossary"
        cardTitleKm="វចនានុក្រមបរិស្ថាន និងធនធានធម្មជាតិ"
        credit={() => "Source: Lexicon of the Code of Environment and Natural Resources, Ministry of Environment (via Open Development Cambodia)"}
      />
      <SourceCredits>
        <p>
          {t(
            `All ${MOE_ENV_TERMS.length} terms and Khmer definitions come from the `,
            `ពាក្យ និងនិយមន័យខ្មែរទាំង ${MOE_ENV_TERMS.length} មកពី `,
          )}
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--gold-text)] underline-offset-2 hover:underline">
            {t("Lexicon of the Code of Environment and Natural Resources", "វចនានុក្រមនៃក្រមបរិស្ថាន និងធនធានធម្មជាតិ")}
          </a>
          {t(
            " — Ministry of Environment, Cambodia, via the Open Development Cambodia library. Reproduced as supplied; duplicate entries are kept and known problems are noted on the entry. Not endorsed by the Ministry or Open Development Cambodia.",
            " — ក្រសួងបរិស្ថាន តាមរយៈបណ្ណាល័យ Open Development Cambodia។ ចម្លងតាមអត្ថបទដែលបានផ្តល់ រក្សាធាតុស្ទួន និងមានកំណត់សម្គាល់លើបញ្ហាដែលបានដឹង។ មិនមែនជាការគាំទ្រពីក្រសួង ឬ Open Development Cambodia ទេ។",
          )}
        </p>
        {MOE_ENV_LEXICON_PROVENANCE.license === undefined && (
          <p>{t("Reuse terms not yet confirmed (Provenance Pending).", "លក្ខខណ្ឌប្រើប្រាស់ឡើងវិញមិនទាន់បានបញ្ជាក់ (Provenance Pending)។")}</p>
        )}
      </SourceCredits>
    </ToolShell>
  );
}
