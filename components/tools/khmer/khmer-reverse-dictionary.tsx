"use client";
import { useMemo } from "react";
import { Search } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { STATIC_DATABASE, type KhmerWordData } from "@/lib/khmer-lexicon-db";

const ENTRIES: KhmerWordData[] = Object.values(STATIC_DATABASE);

export default function KhmerReverseDictionary() {
  const { text: t } = useLanguage();
  const [query, setQuery] = useToolState("khmer-reverse-dict:query", "");

  const { results, active } = useMemo(() => {
    const q = query.trim();
    const active = q.length > 0;
    if (!active) return { results: [] as KhmerWordData[], active };
    const out = ENTRIES.filter((e) => {
      if (e.word === q) return false; // that's forward lookup, not reverse
      const hay = [e.definition, e.example, ...(e.synonyms ?? []), ...(e.relatedWords ?? [])].join(" ");
      return hay.includes(q);
    });
    // Rank definition matches above example-only matches.
    out.sort((a, b) => Number(b.definition.includes(q)) - Number(a.definition.includes(q)) || a.word.localeCompare(b.word));
    return { results: out.slice(0, 60), active };
  }, [query]);

  return (
    <ToolShell
      title="Khmer Reverse Dictionary"
      khmerTitle="វចនានុក្រមបញ្ច្រាស"
      description="Know the meaning but not the word? Type a Khmer keyword that describes what you mean, and this searches inside the definitions and example sentences of the offline dictionary to find matching words. The opposite of a normal lookup — meaning first, word second. Runs in your browser over ~620 headwords."
      descriptionKm="ដឹងន័យ តែមិនដឹងពាក្យ? វាយពាក្យគន្លឹះខ្មែរដែលពណ៌នាអំពីអ្វីដែលអ្នកចង់និយាយ ហើយឧបករណ៍នេះនឹងស្វែងរកក្នុងនិយមន័យ និងឧទាហរណ៍នៃវចនានុក្រមក្រៅបណ្តាញ ដើម្បីរកពាក្យត្រូវគ្នា។ ផ្ទុយពីការស្វែងរកធម្មតា — ន័យមុន ពាក្យក្រោយ។ ដំណើរការក្នុងកម្មវិធីរុករកលើពាក្យប្រមាណ ៦២០។"
    >
      <Field label="Describe the meaning" labelKm="ពណ៌នាន័យ" hint="a Khmer keyword" hintKm="ពាក្យគន្លឹះខ្មែរ">
        <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("e.g. ទឹក, រីករាយ, ធំ", "ឧ. ទឹក, រីករាយ, ធំ")} lang="km" className="font-khmer" autoComplete="off" />
      </Field>

      {active ? (
        results.length > 0 ? (
          <>
            <span className="flex items-center gap-2 text-xs text-[var(--ink-faint)]"><Search size={13} className="text-[var(--gold)]" />{t(`${results.length}${results.length === 60 ? "+" : ""} matching word${results.length === 1 ? "" : "s"}`, `រកឃើញ ${results.length}${results.length === 60 ? "+" : ""} ពាក្យ`)}</span>
            <div className="space-y-2">
              {results.map((e) => (
                <div key={e.word} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5">
                  <div className="flex items-baseline gap-2">
                    <span lang="km" className="font-khmer text-base font-semibold text-[var(--ink)]">{e.word}</span>
                    {e.pronunciation && <span lang="km" className="font-khmer text-xs text-[var(--gold)]">/{e.pronunciation}/</span>}
                  </div>
                  <p lang="km" className="mt-0.5 font-khmer text-sm text-[var(--ink-dim)]">{e.definition}</p>
                  {e.example && <p lang="km" className="mt-1 font-khmer text-xs italic text-[var(--ink-faint)]">{e.example}</p>}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--ink-faint)]">{t("No word found whose definition mentions that. Try a simpler or more common keyword.", "រកមិនឃើញពាក្យដែលនិយមន័យរបស់វានិយាយអំពីរឿងនោះទេ។ សូមសាកពាក្យគន្លឹះសាមញ្ញ ឬធម្មតាជាង។")}</p>
        )
      ) : (
        <p className="text-xs text-[var(--ink-faint)]">{t("Type a Khmer keyword describing the word you want.", "វាយពាក្យគន្លឹះខ្មែរដែលពណ៌នាពាក្យដែលអ្នកចង់បាន។")}</p>
      )}

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Searches the offline Khmer lexicon bundled in this app (~620 headwords with definitions, examples, and synonyms compiled from Chuon Nath & Robert K. Headley dictionary data). It matches your keyword inside those definitions and examples, entirely in your browser. It is a curated subset, not a complete dictionary.",
          "ស្វែងរកក្នុងវចនានុក្រមខ្មែរក្រៅបណ្តាញដែលភ្ជាប់មកជាមួយកម្មវិធីនេះ (~៦២០ ពាក្យ ជាមួយនិយមន័យ ឧទាហរណ៍ និងពាក្យមានន័យដូច ចងក្រងពីទិន្នន័យវចនានុក្រមជួន ណាត និង Robert K. Headley)។ វាផ្គូផ្គងពាក្យគន្លឹះរបស់អ្នកក្នុងនិយមន័យ និងឧទាហរណ៍ ទាំងស្រុងក្នុងកម្មវិធីរុករក។ វាជាផ្នែករងដែលបានជ្រើសរើស មិនមែនវចនានុក្រមពេញលេញទេ។",
        )}</p>
      </section>
    </ToolShell>
  );
}
