"use client";
import { useMemo } from "react";
import { ToolShell, Field, Select, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

interface Term {
  en: string;
  km: string;
  category: "Correspondence & Contract" | "Procurement & BOQ" | "Irrigation & Hydraulic" | "Site & Structures" | "Environmental & Social Safeguards";
  note?: string;
}

const TERMS: Term[] = [
  { en: "Letter / Correspondence", km: "លិខិត", category: "Correspondence & Contract" },
  { en: "Notice to Proceed", km: "លិខិតជូនដំណឹងឱ្យចាប់ផ្តើមការងារ", category: "Correspondence & Contract" },
  { en: "Contract", km: "កិច្ចសន្យា", category: "Correspondence & Contract" },
  { en: "Variation Order", km: "លិខិតបញ្ជាការផ្លាស់ប្ដូរ", category: "Correspondence & Contract", note: "Change order to the original scope/cost" },
  { en: "Extension of Time", km: "ការពន្យារពេល", category: "Correspondence & Contract" },
  { en: "Certificate of Completion", km: "វិញ្ញាបនបត្របញ្ជាក់ការបញ្ចប់ការងារ", category: "Correspondence & Contract" },
  { en: "Defects Liability Period", km: "រយៈពេលទទួលខុសត្រូវលើគម្លាត", category: "Correspondence & Contract" },
  { en: "Employer / Client", km: "និយោជក", category: "Correspondence & Contract" },
  { en: "Contractor", km: "អ្នកម៉ៅការ", category: "Correspondence & Contract" },
  { en: "Consultant / Engineer", km: "ទីប្រឹក្សា / វិស្វករ", category: "Correspondence & Contract" },
  { en: "Bill of Quantities (BOQ)", km: "បញ្ជីបរិមាណ", category: "Procurement & BOQ" },
  { en: "Price Adjustment", km: "ការកែសម្រួលតម្លៃ", category: "Procurement & BOQ" },
  { en: "Unit Price", km: "តម្លៃឯកតា", category: "Procurement & BOQ" },
  { en: "Tender / Bidding", km: "ការដេញថ្លៃ", category: "Procurement & BOQ" },
  { en: "Bid Security", km: "ការធានាដេញថ្លៃ", category: "Procurement & BOQ" },
  { en: "Performance Security", km: "ការធានាការអនុវត្តកិច្ចសន្យា", category: "Procurement & BOQ" },
  { en: "Advance Payment", km: "ការបង់ប្រាក់មុន", category: "Procurement & BOQ" },
  { en: "Interim Payment Certificate", km: "វិញ្ញាបនបត្របង់ប្រាក់ជាដំណាក់កាល", category: "Procurement & BOQ" },
  { en: "Canal", km: "ប្រឡាយ", category: "Irrigation & Hydraulic" },
  { en: "Main canal", km: "ប្រឡាយចម្បង", category: "Irrigation & Hydraulic" },
  { en: "Secondary / branch canal", km: "ប្រឡាយបន្ទាប់បន្សំ", category: "Irrigation & Hydraulic" },
  { en: "Irrigation", km: "ប្រព័ន្ធធារាសាស្ត្រ", category: "Irrigation & Hydraulic" },
  { en: "Drainage", km: "ការបង្ហូរទឹក", category: "Irrigation & Hydraulic" },
  { en: "Reservoir", km: "អាងស្តុកទឹក", category: "Irrigation & Hydraulic" },
  { en: "Dam / Weir", km: "ទំនប់", category: "Irrigation & Hydraulic" },
  { en: "Sluice gate", km: "ទ្វារទឹក", category: "Irrigation & Hydraulic" },
  { en: "Water gate structure", km: "សំណង់ទ្វារទឹក", category: "Irrigation & Hydraulic" },
  { en: "Spillway", km: "ច្រកបញ្ចេញទឹកលើស", category: "Irrigation & Hydraulic" },
  { en: "Culvert", km: "លូបង្ហូរទឹក", category: "Irrigation & Hydraulic" },
  { en: "Watershed / catchment", km: "អាងទឹក", category: "Irrigation & Hydraulic" },
  { en: "Water level gauge", km: "ឧបករណ៍វាស់កម្ពស់ទឹក", category: "Irrigation & Hydraulic" },
  { en: "Command area", km: "តំបន់ទទួលផលប្រព័ន្ធធារាសាស្ត្រ", category: "Irrigation & Hydraulic" },
  { en: "Embankment / dyke", km: "ជាំពង", category: "Site & Structures" },
  { en: "Earthworks", km: "ការងារជីកលើកដី", category: "Site & Structures" },
  { en: "Compaction", km: "ការបង្រួមដី", category: "Site & Structures" },
  { en: "Reinforced concrete", km: "បេតុងសាំង", category: "Site & Structures" },
  { en: "Formwork", km: "គំរូបេតុង / ស្លាកបេតុង", category: "Site & Structures" },
  { en: "Site survey", km: "ការស្ទង់មតិទីតាំង", category: "Site & Structures" },
  { en: "As-built drawing", km: "ប្លង់សំណង់ជាក់ស្តែង", category: "Site & Structures" },
  { en: "Progress report", km: "របាយការណ៍វឌ្ឍនភាព", category: "Site & Structures" },
  { en: "Weather report / rainfall record", km: "កំណត់ត្រាអាកាសធាតុ / ទឹកភ្លៀង", category: "Site & Structures" },
  { en: "Environmental and Social Management Plan (ESMP)", km: "ផែនការគ្រប់គ្រងបរិស្ថាន និងសង្គម", category: "Environmental & Social Safeguards" },
  { en: "Resettlement", km: "ការតាំងទីលំនៅឡើងវិញ", category: "Environmental & Social Safeguards" },
  { en: "Grievance Redress Mechanism", km: "យន្តការដោះស្រាយបណ្តឹង", category: "Environmental & Social Safeguards" },
  { en: "Stakeholder consultation", km: "ការពិគ្រោះយោបល់ភាគីពាក់ព័ន្ធ", category: "Environmental & Social Safeguards" },
  { en: "Safeguard compliance", km: "ការគោរពតាមវិធានការការពារ", category: "Environmental & Social Safeguards" },
];

const CATEGORIES = ["All", "Correspondence & Contract", "Procurement & BOQ", "Irrigation & Hydraulic", "Site & Structures", "Environmental & Social Safeguards"] as const;

export default function ConstructionWaterGlossary() {
  const [cat, setCat] = useToolState<(typeof CATEGORIES)[number]>("construction-water-glossary:cat", "All");
  const [query, setQuery] = useToolState("construction-water-glossary:query", "");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TERMS.filter((t) => {
      const matchesCat = cat === "All" || t.category === cat;
      const matchesQuery = !q || t.en.toLowerCase().includes(q) || t.km.includes(q);
      return matchesCat && matchesQuery;
    });
  }, [cat, query]);

  return (
    <ToolShell
      title="Construction & Water Resources Glossary"
      khmerTitle="វចនានុក្រមសំណង់ និងធនធានទឹក"
      description="Khmer-English terminology for construction contracts, procurement/BOQ documents, irrigation infrastructure, and environmental & social safeguards — the everyday vocabulary of correspondence registers, contract admin, and canal works. Aimed at practical project documents, not a legal translation authority."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Category">
          <Select value={cat} onChange={(e) => setCat(e.target.value as (typeof CATEGORIES)[number])}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Search">
          <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="English or Khmer term…" />
        </Field>
      </div>
      <div className="space-y-1.5">
        {results.length === 0 && (
          <div className="py-8 text-center text-sm text-[var(--ink-faint)]">No terms match that filter.</div>
        )}
        {results.map((t) => (
          <div key={t.en} className="flex items-start justify-between gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm">
            <div>
              <div className="font-medium text-[var(--ink)]">{t.en}</div>
              {t.note && <div className="mt-0.5 text-xs text-[var(--ink-dim)]">{t.note}</div>}
              <div className="mt-1 text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{t.category}</div>
            </div>
            <div className="shrink-0 whitespace-nowrap font-medium text-[var(--gold)]">{t.km}</div>
          </div>
        ))}
      </div>
    </ToolShell>
  );
}
