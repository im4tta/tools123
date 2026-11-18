"use client";
import { ToolShell } from "@/components/ui/Shell";
import { Lexicon, type LexiconItem } from "@/components/ui/Lexicon";
import { MPTC_TERMS } from "@/lib/data/mptc-lexicon";

const ITEMS: LexiconItem[] = MPTC_TERMS.map((term, i) => ({
  id: `${term.km}::${term.en}::${i}`,
  term: term.en,
  termKm: term.km,
  defKm: term.def || undefined,
  extras: term.fr ? [{ label: "French", labelKm: "បារាំង", value: term.fr }] : undefined,
  search: [term.fr, term.def],
}));

export default function DigitalTerminology() {
  return (
    <ToolShell
      title="Khmer Digital Terminology"
      khmerTitle="វាក្យស័ព្ទឌីជីថល"
      description={`The full official MPTC (Ministry of Posts and Telecommunications of Cambodia) Digital Terminology Lexicon — ${MPTC_TERMS.length} standardized terms with English, French, and Khmer definitions, from the ministry's 2025/2026 published update. Search by English, French, or Khmer; tap a term to open its definition.`}
    >
      <Lexicon
        items={ITEMS}
        storagePrefix="digital-terminology"
        queryKey="digital-terminology:q"
        name="Digital terminology"
        nameKm="វាក្យស័ព្ទឌីជីថល"
        searchPlaceholder="Search English, French, or Khmer..."
        searchPlaceholderKm="ស្វែងរកជាអង់គ្លេស បារាំង ឬខ្មែរ..."
        toolId="digital-terminology"
        cardTitle="Khmer Digital Terminology"
        cardTitleKm="វាក្យស័ព្ទឌីជីថល"
        credit={() => "Source: MPTC Digital Terminology Lexicon"}
      />
      <p className="text-xs text-[var(--ink-faint)]">
        Source: Ministry of Posts and Telecommunications of Cambodia, Digital Terminology Lexicon.
      </p>
    </ToolShell>
  );
}
