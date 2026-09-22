"use client";
import { useMemo } from "react";
import { Search } from "lucide-react";
import khmerWords from "@/data/khmer-words.json";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextInput, Row, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const WORDS = khmerWords as string[];

function clusterCount(word: string): number {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return [...new Intl.Segmenter("km", { granularity: "grapheme" }).segment(word)].length;
  }
  return [...word].length;
}

export default function KhmerWordPattern() {
  const { text: t } = useLanguage();
  const [starts, setStarts] = useToolState("khmer-word-pattern:starts", "");
  const [contains, setContains] = useToolState("khmer-word-pattern:contains", "");
  const [ends, setEnds] = useToolState("khmer-word-pattern:ends", "");
  const [length, setLength] = useToolState("khmer-word-pattern:length", "");

  const { results, active } = useMemo(() => {
    const s = starts.trim(), c = contains.trim(), e = ends.trim();
    const lenNum = Number(length.trim());
    const hasLen = length.trim() !== "" && Number.isFinite(lenNum) && lenNum > 0;
    const active = !!(s || c || e || hasLen);
    if (!active) return { results: [] as string[], active };
    const out: string[] = [];
    for (const w of WORDS) {
      if (s && !w.startsWith(s)) continue;
      if (e && !w.endsWith(e)) continue;
      if (c && !w.includes(c)) continue;
      if (hasLen && clusterCount(w) !== lenNum) continue;
      out.push(w);
      if (out.length >= 200) break;
    }
    return { results: out, active };
  }, [starts, contains, ends, length]);

  return (
    <ToolShell
      title="Khmer Word Pattern Finder"
      khmerTitle="ឧបករណ៍ស្វែងរកពាក្យតាមលំនាំ"
      description="Find real Khmer words that match a pattern — starting with, containing, or ending with certain letters, and/or a set number of syllables (clusters). Handy for crosswords, writing poems with a fixed metre, word games, and learners hunting for the right word. Searches a list of ~1,850 common Khmer words."
      descriptionKm="ស្វែងរកពាក្យខ្មែរពិតដែលត្រូវនឹងលំនាំ — ចាប់ផ្តើមដោយ មានផ្ទុក ឬបញ្ចប់ដោយតួអក្សរជាក់លាក់ និង/ឬចំនួនព្យាង្គ (ក្រុមអក្សរ) ជាក់លាក់។ មានប្រយោជន៍សម្រាប់ល្បែងផ្គុំពាក្យ ការតែងកំណាព្យតាមចង្វាក់ ល្បែងពាក្យ និងអ្នករៀនដែលកំពុងរកពាក្យត្រឹមត្រូវ។ ស្វែងរកក្នុងបញ្ជីពាក្យខ្មែរធម្មតាប្រមាណ ១,៨៥០។"
    >
      <Row>
        <Field label="Starts with" labelKm="ចាប់ផ្តើមដោយ"><TextInput value={starts} onChange={(e) => setStarts(e.target.value)} placeholder={t("e.g. ស", "ឧ. ស")} autoComplete="off" /></Field>
        <Field label="Ends with" labelKm="បញ្ចប់ដោយ"><TextInput value={ends} onChange={(e) => setEnds(e.target.value)} placeholder={t("e.g. ណ៍", "ឧ. ណ៍")} autoComplete="off" /></Field>
      </Row>
      <Row>
        <Field label="Contains" labelKm="មានផ្ទុក"><TextInput value={contains} onChange={(e) => setContains(e.target.value)} placeholder={t("e.g. ការ", "ឧ. ការ")} autoComplete="off" /></Field>
        <Field label="Syllables (clusters)" labelKm="ចំនួនព្យាង្គ (ក្រុមអក្សរ)" hint="leave blank for any" hintKm="ទុកទទេសម្រាប់ទាំងអស់"><TextInput value={length} onChange={(e) => setLength(e.target.value)} inputMode="numeric" placeholder={t("e.g. 3", "ឧ. ៣")} autoComplete="off" /></Field>
      </Row>

      {active && (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-xs text-[var(--ink-faint)]"><Search size={13} className="text-[var(--gold)]" />{t(`${results.length}${results.length === 200 ? "+" : ""} word${results.length === 1 ? "" : "s"}`, `រកឃើញ ${results.length}${results.length === 200 ? "+" : ""} ពាក្យ`)}</span>
            {results.length > 0 && <CopyButton text={results.join("\n")} compact />}
          </div>
          {results.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {results.map((w) => (
                <span key={w} lang="km" className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2.5 py-1 font-khmer text-sm text-[var(--ink)]">{w}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--ink-faint)]">{t("No words match — try loosening the pattern.", "គ្មានពាក្យត្រូវគ្នា — សូមសាកបន្ធូរលំនាំ។")}</p>
          )}
        </>
      )}
      {!active && <p className="text-xs text-[var(--ink-faint)]">{t("Fill in at least one field to search.", "សូមបំពេញយ៉ាងតិចមួយប្រអប់ដើម្បីស្វែងរក។")}</p>}

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "The word list is built from the offline Chuon Nath & Headley dictionary data and the common-word POS lexicon bundled in this app (~1,850 words). Matching runs in your browser; syllables are counted as Khmer orthographic clusters. It is not an exhaustive dictionary.",
          "បញ្ជីពាក្យបង្កើតពីទិន្នន័យវចនានុក្រមជួន ណាត និង Headley និងវចនានុក្រមពាក្យធម្មតា ដែលភ្ជាប់មកជាមួយកម្មវិធីនេះ (~១,៨៥០ ពាក្យ)។ ការផ្គូផ្គងដំណើរការក្នុងកម្មវិធីរុករក ព្យាង្គរាប់ជាក្រុមអក្សរខ្មែរ។ វាមិនមែនជាវចនានុក្រមពេញលេញទេ។",
        )}</p>
      </section>
    </ToolShell>
  );
}
