"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { STATIC_DATABASE } from "@/lib/khmer-lexicon-db";

const KEYS = Object.keys(STATIC_DATABASE).sort();

function splitClusters(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter("km", { granularity: "grapheme" });
    return [...seg.segment(text)].map((s) => s.segment);
  }
  return [...text];
}

/**
 * Approximate rhyme key: the final sound of a word, derived from its written
 * form. Grapheme-aware — the last cluster's vowel signs plus the final
 * consonant cluster (e.g. បាយ and ឆាយ both key to "ាយ").
 */
function rhymeKey(word: string): string {
  const clusters = splitClusters(word).filter((c) => c.trim() !== "");
  if (clusters.length === 0) return "";
  const last = clusters[clusters.length - 1];
  if (last.length > 1) return last; // last cluster already carries vowel sign(s)
  const prev = clusters[clusters.length - 2] ?? "";
  const vowel = prev.replace(/^[\u1780-\u17A2]+/u, ""); // strip leading base consonant
  return vowel + last;
}

const RHYME_INDEX = (() => {
  const byWord = new Map<string, string>();
  const families = new Map<string, string[]>();
  for (const w of KEYS) {
    const k = rhymeKey(w);
    if (!k) continue;
    byWord.set(w, k);
    const fam = families.get(k) ?? [];
    fam.push(w);
    families.set(k, fam);
  }
  const sortedFamilies = [...families.entries()]
    .filter(([, ws]) => ws.length >= 2)
    .sort((a, b) => b[1].length - a[1].length);
  return { byWord, families, sortedFamilies };
})();

export default function KhmerRhymingDictionary() {
  const { text: t } = useLanguage();
  const [query, setQuery] = useToolState("krd:query", "");
  const [selected, setSelected] = useState<string | null>(null);
  const [activeFamily, setActiveFamily] = useState<string | null>(null);

  const matches = useMemo(() => {
    const q = query.trim();
    if (!q) return [] as string[];
    const lower = q.toLowerCase();
    const exact = STATIC_DATABASE[q] ? [q] : [];
    const subs: string[] = [];
    for (const w of KEYS) {
      if (exact.includes(w)) continue;
      if (w.toLowerCase().includes(lower)) {
        subs.push(w);
        if (exact.length + subs.length >= 24) break;
      }
    }
    return [...exact, ...subs];
  }, [query]);

  const selectedKey = selected ? (RHYME_INDEX.byWord.get(selected) ?? null) : null;
  const shownFamily = selectedKey ?? activeFamily;
  const familyWords = shownFamily ? (RHYME_INDEX.families.get(shownFamily) ?? []) : [];
  const shownEntry = selected ? STATIC_DATABASE[selected] : null;

  return (
    <ToolShell
      title="Khmer Rhyming Dictionary"
      khmerTitle="វចនានុក្រមបទភ្លេងខ្មែរ"
      description="Search any Khmer word to see words that share its final sound (its rhyme family), with definitions from the Khmer lexicon. Rhymes are matched by a grapheme-aware key of the word's written final clusters — an approximation for browsing, not phonetic analysis."
      descriptionKm="ស្វែងរកពាក្យខ្មែរណាមួយ ដើម្បីមើលពាក្យដែលមានសូរចុងដូចគ្នា (ក្រុមបទភ្លេងរបស់វា) ជាមួយនិយមន័យពីវចនានុក្រមខ្មែរ។ ការផ្គូផ្គងធ្វើតាមសោដែលគិតតាមចង្កោមចុងនៃទម្រង់សរសេរ — ជាការប្រហាក់ប្រហែលសម្រាប់រកមើល មិនមែនជាការវិភាគសូរសព្ទទេ។"
    >
      <Field label={t("Search a Khmer word", "ស្វែងរកពាក្យខ្មែរ")}>
        <TextInput
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          placeholder={t("Type a word, e.g. បាយ", "វាយពាក្យ ឧ. បាយ")}
        />
      </Field>

      <p className="text-xs text-[var(--ink-faint)]">
        {t(
          `${KEYS.length} words indexed · ${RHYME_INDEX.sortedFamilies.length} rhyme families`,
          `ពាក្យចំនួន ${KEYS.length} · ក្រុមបទភ្លេងចំនួន ${RHYME_INDEX.sortedFamilies.length}`
        )}
      </p>

      {query.trim() && (
        <div className="flex flex-wrap gap-1.5">
          {matches.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setSelected(w)}
              className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2.5 py-1.5 font-khmer text-base text-[var(--ink)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)]"
            >
              {w}
            </button>
          ))}
          {matches.length === 0 && (
            <p className="text-sm text-[var(--ink-dim)]">
              {t("No words found. Try a different spelling.", "រកមិនឃើញពាក្យទេ។ សូមសាកអក្ខរាវិរុទ្ធផ្សេង។")}
            </p>
          )}
        </div>
      )}

      {shownEntry && selectedKey && (
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span lang="km" className="font-khmer text-xl font-bold text-[var(--ink)]">{selected}</span>
            {shownEntry.pronunciation && (
              <span className="font-mono-ui text-[10px] text-[var(--ink-faint)]">({shownEntry.pronunciation})</span>
            )}
            <span className="text-[10px] uppercase tracking-wide text-[var(--gold)]">{selectedKey}</span>
          </div>
          <p lang="km" className="mt-2 font-khmer text-sm leading-relaxed text-[var(--ink-dim)]">
            {shownEntry.definition}
          </p>
        </div>
      )}

      {familyWords.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">
            {t(
              selected ? `Rhyme family of «${selected}»` : "Rhyme family",
              selected ? `ក្រុមបទភ្លេងរបស់ «${selected}»` : "ក្រុមបទភ្លេង"
            )}{" "}
            <span className="text-[var(--ink-faint)]">({t(`${familyWords.length} words`, `ពាក្យ ${familyWords.length}`)})</span>
          </h2>
          <div className="space-y-2">
            {familyWords.map((w) => {
              const entry = STATIC_DATABASE[w];
              const isSelected = w === selected;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => setSelected(w)}
                  className={`block w-full rounded-md border p-3 text-left transition ${
                    isSelected
                      ? "border-[var(--gold-dim)] bg-[var(--gold)]/10"
                      : "border-[var(--ground-line)] bg-[var(--ground-raised)] hover:border-[var(--gold-dim)]"
                  }`}
                >
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span lang="km" className="font-khmer font-semibold text-[var(--ink)]">{w}</span>
                    {entry.pronunciation && (
                      <span className="font-mono-ui text-[10px] text-[var(--ink-faint)]">({entry.pronunciation})</span>
                    )}
                    <span className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{RHYME_INDEX.byWord.get(w) ?? ""}</span>
                  </span>
                  <span lang="km" className="mt-0.5 block text-xs leading-relaxed text-[var(--ink-dim)]">
                    {entry.definition}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {!query.trim() && !selected && !activeFamily && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">
            {t("Largest rhyme families", "ក្រុមបទភ្លេងធំៗ")}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {RHYME_INDEX.sortedFamilies.slice(0, 15).map(([key, words]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveFamily(key);
                  setSelected(null);
                }}
                className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2.5 py-1.5 font-khmer text-base text-[var(--ink)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)]"
              >
                {key} <span className="text-[10px] text-[var(--ink-faint)]">({words.length})</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-[var(--ink-dim)]">
            {t("Pick a word above or type one to see its rhyme family.", "ជ្រើសរើសពាក្យខាងលើ ឬវាយពាក្យមួយ ដើម្បីមើលក្រុមបទភ្លេងរបស់វា។")}
          </p>
        </section>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Rhyme keys are computed from the written form (grapheme-aware final clusters), so they approximate the final sound for browsing — homophones and irregular pronunciations may not match. Definitions come from the app's Khmer lexicon database.",
          "សោបទភ្លេងគណនាពីទម្រង់សរសេរ (ចង្កោមចុងតាម grapheme) ដូច្នេះវាប្រហាក់ប្រហែលនឹងសូរចុងសម្រាប់រកមើល — ពាក្យសទិសសូរ ឬការបញ្ចេញសំឡេងមិនទៀងទាត់ អាចមិនត្រូវគ្នា។ និយមន័យមកពីមូលដ្ឋានទិន្នន័យវចនានុក្រមខ្មែររបស់កម្មវិធី។"
        )}
      </p>

      <aside className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-xs leading-relaxed text-[var(--ink-dim)]">
        <p className="mb-1.5 font-semibold text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងក្រេឌីត")}</p>
        <p>
          {t(
            "Word data: Chuon Nath & Headley dictionaries, via the app's offline Khmer lexicon database (lib/khmer-lexicon-db). Rhyme index: original Tools123 implementation — a grapheme-aware key of written final clusters (approximation).",
            "ទិន្នន័យពាក្យ៖ វចនានុក្រមជួនណាត និងហេដលី តាមរយៈមូលដ្ឋានទិន្នន័យវចនានុក្រមខ្មែរក្រៅបណ្ដាញរបស់កម្មវិធី (lib/khmer-lexicon-db)។ លិបិក្រមបទភ្លេង៖ ការអនុវត្តដើមដោយ Tools123 — សោគិតតាមចង្កោមចុងនៃទម្រង់សរសេរ (ប្រហាក់ប្រហែល)។"
          )}
        </p>
      </aside>
    </ToolShell>
  );
}
