"use client";
import { useMemo } from "react";
import { GitCompare } from "lucide-react";
import khmerWords from "@/data/khmer-words.json";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { splitClusters } from "@/lib/khmer-syllables";

const WORDS = khmerWords as string[];
const WORD_CLUSTERS: { word: string; clusters: string[] }[] = WORDS.map((word) => ({ word, clusters: splitClusters(word) }));

type Pair = { word: string; from: string; to: string; index: number };

export default function KhmerMinimalPairs() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-minimal-pairs:input", "");

  const { pairs, base, active } = useMemo(() => {
    const base = splitClusters(input.trim());
    const active = base.length > 0;
    if (!active) return { pairs: [] as Pair[], base, active };
    const out: Pair[] = [];
    for (const { word, clusters } of WORD_CLUSTERS) {
      if (clusters.length !== base.length) continue;
      if (word === input.trim()) continue;
      let diffs = 0;
      let index = -1;
      for (let i = 0; i < base.length; i++) {
        if (clusters[i] !== base[i]) { diffs++; index = i; if (diffs > 1) break; }
      }
      if (diffs === 1) out.push({ word, from: base[index], to: clusters[index], index });
    }
    out.sort((a, b) => a.index - b.index || a.word.localeCompare(b.word));
    return { pairs: out, base, active };
  }, [input]);

  return (
    <ToolShell
      title="Khmer Minimal Pairs Finder"
      khmerTitle="ឧបករណ៍ស្វែងរកគូពាក្យប្រហែល"
      description="Type a Khmer word and find real words that differ from it by exactly one letter (orthographic cluster) in the same position — its minimal pairs. A classic teaching aid for spelling and pronunciation drills: ដឹង / ដង, ខ្មៅ / ខ្លៅ, and so on. Searches ~1,850 common Khmer words in your browser."
      descriptionKm="វាយពាក្យខ្មែរ ហើយស្វែងរកពាក្យពិតដែលខុសគ្នាត្រឹមតែមួយអក្សរ (ក្រុមអក្សរ) នៅទីតាំងដូចគ្នា — គូពាក្យប្រហែលរបស់វា។ ជាឧបករណ៍បង្រៀនបុរាណសម្រាប់លំហាត់អក្ខរាវិរុទ្ធ និងការបញ្ចេញសំឡេង៖ ដឹង / ដង, ខ្មៅ / ខ្លៅ ជាដើម។ ស្វែងរកក្នុងពាក្យខ្មែរធម្មតាប្រមាណ ១,៨៥០ ក្នុងកម្មវិធីរុករក។"
    >
      <Field label="Word" labelKm="ពាក្យ" hint="one Khmer word" hintKm="ពាក្យខ្មែរមួយ">
        <TextInput value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("e.g. ដឹង", "ឧ. ដឹង")} lang="km" className="font-khmer" autoComplete="off" />
      </Field>

      {active ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-xs text-[var(--ink-faint)]">
              <GitCompare size={13} className="text-[var(--gold)]" />
              {t(`${pairs.length} minimal pair${pairs.length === 1 ? "" : "s"} (${base.length} clusters)`, `គូពាក្យប្រហែល ${pairs.length} (${base.length} ក្រុមអក្សរ)`)}
            </span>
            {pairs.length > 0 && <CopyButton text={pairs.map((p) => p.word).join("\n")} compact />}
          </div>
          {pairs.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {pairs.map((p) => (
                <span key={p.word} lang="km" title={t(`${p.from} → ${p.to}`, `${p.from} → ${p.to}`)} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2.5 py-1 font-khmer text-sm text-[var(--ink)]">
                  {splitClusters(p.word).map((c, i) => (
                    <span key={i} className={i === p.index ? "text-[var(--gold)] font-semibold" : ""}>{c}</span>
                  ))}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--ink-faint)]">{t("No minimal pairs found in the word list. Longer or rarer words often have none.", "រកមិនឃើញគូពាក្យប្រហែលក្នុងបញ្ជីពាក្យទេ។ ពាក្យវែង ឬកម្រ ច្រើនតែគ្មាន។")}</p>
          )}
        </>
      ) : (
        <p className="text-xs text-[var(--ink-faint)]">{t("Enter one Khmer word to find its minimal pairs.", "បញ្ចូលពាក្យខ្មែរមួយដើម្បីស្វែងរកគូពាក្យប្រហែល។")}</p>
      )}

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Words are split into Khmer orthographic clusters with the browser's Intl.Segmenter and compared position-by-position against the offline word list bundled in this app (~1,850 words, from Chuon Nath & Headley dictionary data and the common-word POS lexicon). The highlighted cluster is the one that changed. Not an exhaustive dictionary.",
          "ពាក្យត្រូវបានបំបែកជាក្រុមអក្សរខ្មែរដោយ Intl.Segmenter ហើយប្រៀបធៀបទីតាំងម្តងមួយៗនឹងបញ្ជីពាក្យក្រៅបណ្តាញដែលភ្ជាប់មកជាមួយកម្មវិធីនេះ (~១,៨៥០ ពាក្យ ពីទិន្នន័យវចនានុក្រមជួន ណាត និង Headley និងវចនានុក្រមពាក្យធម្មតា)។ ក្រុមអក្សរដែលបន្លិចពណ៌ គឺជាក្រុមដែលបានផ្លាស់ប្តូរ។ មិនមែនជាវចនានុក្រមពេញលេញទេ។",
        )}</p>
      </section>
    </ToolShell>
  );
}
