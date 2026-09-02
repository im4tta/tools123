"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { segmentSyllables, isKhmerChar } from "@/lib/data/khmer-romanization";
import { AlertCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// Structural checker only. Khmer kâp (កាព្យ) has many traditional metres
// (បទពាក្យ៧, បទពាក្យ៨…) with strict syllable counts and interlocking
// rhyme rules. This tool only counts syllables (orthographic approximation,
// via segmentSyllables from lib/data/khmer-romanization) and characters per
// line, and compares each line's written ending pattern with the previous
// line — a simple consecutive-rhyme check, not a full literary analysis.
// ---------------------------------------------------------------------------

const SAMPLE_RHYMED = [
  "ផ្ការីកពេញសួនច្បារ ក្លិនក្រអូបសាយទៅឆ្ងាយ",
  "សត្វស្លាបហើរលើមេឃ សំឡេងពិរោះឮឆ្ងាយ",
  "ដើមឈើដុះតម្រង់ ម្លប់ត្រជាក់ក្រោមសួន",
  "ស្រះទឹកថ្លាឈ្វេង ផ្កាឈូករីកពេញសួន",
].join("\n");

const SAMPLE_BROKEN = [
  "ផ្ការីកពេញសួនច្បារ ក្លិនក្រអូបសាយទៅឆ្ងាយ",
  "សត្វស្លាបហើរលើមេឃ សំឡេងពិរោះឮឆ្ងាយ",
  "ខ្ញុំដើរលេងក្រោមដើមឈើ សប្បាយណាស់នៅថ្ងៃនេះ",
  "ពេលល្ងាចជួយកិច្ចការផ្ទះ រួចក៏រៀនសូត្រមេរៀនថ្មី",
].join("\n");

function splitClusters(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter("km", { granularity: "grapheme" });
    return [...seg.segment(text)].map((s) => s.segment);
  }
  return [...text];
}

// Khmer consonants U+1780–U+17A2 plus the coeng U+17D2 (used as a stack).
const CONSONANT_STACK = /^[\u1780-\u17A2\u17D2]+/u;
const TRAILING_PUNCT = /[\u17D4-\u17D9\u200b.,;:!?…'"“”()\-]+$/u;

/**
 * Written ending pattern of a line, derived from its final grapheme clusters.
 * Rhyme in Khmer is carried by the last syllable: its vowel sign plus any
 * final consonant (e.g. ឆ្ងាយ and បាយ both key to "ាយ"). If the last
 * cluster is a bare final consonant, the vowel is taken from the cluster
 * before it (ឆ្ងា + យ → "ាយ"). Approximate — see footnote.
 */
function endingOf(line: string): { key: string; letter: string } {
  const core = line.replace(TRAILING_PUNCT, "").trim();
  const clusters = splitClusters(core).filter((c) => c.trim() !== "");
  if (clusters.length === 0) return { key: "", letter: "" };
  const last = clusters[clusters.length - 1];
  const tail = last.replace(CONSONANT_STACK, "");
  if (tail) return { key: tail, letter: last };
  const prev = clusters[clusters.length - 2] ?? "";
  const key = prev.replace(CONSONANT_STACK, "") + last;
  return { key, letter: last };
}

type RowStat = {
  idx: number;
  text: string;
  syllables: number;
  letters: number;
  endKey: string;
  endLetter: string;
  group: number; // -1 when the line has no recognisable ending pattern
  mismatch: boolean;
};

type Analysis = { rows: RowStat[]; groups: { key: string; count: number }[] };

function analyse(input: string): Analysis {
  const rows: RowStat[] = [];
  const keyToGroup = new Map<string, number>();
  const groupKeys: string[] = [];

  input.split("\n").forEach((raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const syllables = segmentSyllables(trimmed).filter((s) => isKhmerChar(s[0])).length;
    const letters = [...trimmed].filter((c) => !/\s/.test(c)).length;
    const { key, letter } = endingOf(trimmed);
    let group = -1;
    if (key) {
      if (!keyToGroup.has(key)) {
        keyToGroup.set(key, groupKeys.length);
        groupKeys.push(key);
      }
      group = keyToGroup.get(key) ?? -1;
    }
    const prev = rows[rows.length - 1];
    const mismatch = Boolean(key && prev && prev.endKey !== key);
    rows.push({ idx: rows.length + 1, text: trimmed, syllables, letters, endKey: key, endLetter: letter, group, mismatch });
  });

  const groups = groupKeys.map((key) => ({ key, count: rows.filter((r) => r.endKey === key).length }));
  return { rows, groups };
}

const GROUP_CLASSES = [
  "border-[var(--gold)]/50 bg-[var(--gold)]/10 text-[var(--gold)]",
  "border-[var(--teal)]/50 bg-[var(--teal)]/10 text-[var(--teal)]",
  "border-[var(--success)]/50 bg-[var(--success)]/10 text-[var(--success)]",
  "border-[var(--danger)]/50 bg-[var(--danger)]/10 text-[var(--danger)]",
];
const groupClass = (group: number) => GROUP_CLASSES[((group % GROUP_CLASSES.length) + GROUP_CLASSES.length) % GROUP_CLASSES.length];
const groupLetter = (group: number) => (group >= 0 ? String.fromCharCode(65 + group) : "·");

export default function KhmerPoemMetreChecker() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-poem-metre-checker:input", SAMPLE_RHYMED);

  const analysis = useMemo(() => analyse(input), [input]);

  const totalSyllables = analysis.rows.reduce((s, r) => s + r.syllables, 0);
  const totalLetters = analysis.rows.reduce((s, r) => s + r.letters, 0);
  const mismatchCount = analysis.rows.filter((r) => r.mismatch).length;

  return (
    <ToolShell
      title="Khmer Poem Metre Checker"
      khmerTitle="ពិនិត្យចង្វាក់កាព្យខ្មែរ"
      description="Paste a Khmer poem (កាព្យ) and see, per line: an approximate syllable count, a character count, the line's written ending, and a colour-coded rhyme-pattern group. Lines whose ending pattern differs from the line above are flagged, and the detected pattern (A A B B …) is visualised with chips."
      descriptionKm="បិទភ្ជាប់កាព្យខ្មែរមួយ រួចមើលតាមបន្ទាត់នីមួយៗ៖ ចំនួនព្យាង្គប្រហាក់ប្រហែល ចំនួនតួអក្សរ សំណេរចុងបន្ទាត់ និងក្រុមលំនាំចង្វាក់ដែលមានពណ៌ខុសៗគ្នា។ បន្ទាត់ដែលលំនាំចុងខុសពីបន្ទាត់ខាងលើ នឹងត្រូវគួសចំណាំ ហើយលំនាំដែលរកឃើញ (A A B B …) ត្រូវបង្ហាញជាបន្ទះពណ៌។"
    >
      <Field label={t("Poem text", "អត្ថបទកាព្យ")}>
        <TextArea rows={8} value={input} onChange={(e) => setInput(e.target.value)} className="font-khmer text-lg leading-relaxed" />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => setInput(SAMPLE_RHYMED)}>
          <>{t("Load rhymed sample", "ផ្ទុកគំរូមានចង្វាក់")}</>
        </Button>
        <Button type="button" onClick={() => setInput(SAMPLE_BROKEN)}>
          <>{t("Load broken-rhyme sample", "ផ្ទុកគំរូចង្វាក់ខុស")}</>
        </Button>
      </div>

      {analysis.rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-[var(--ground-line)] px-4 py-8 text-center text-sm text-[var(--ink-dim)]">
          {t("Paste a poem above to analyse it.", "សូមបិទភ្ជាប់កាព្យខាងលើ ដើម្បីវិភាគ។")}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCell label={t("Lines", "បន្ទាត់")} value={analysis.rows.length} />
            <SummaryCell label={t("Syllables", "ព្យាង្គ")} value={totalSyllables} />
            <SummaryCell label={t("Characters", "តួអក្សរ")} value={totalLetters} />
            <SummaryCell label={t("Rhyme groups", "ក្រុមចង្វាក់")} value={analysis.groups.length} danger={mismatchCount > 0} />
          </div>

          {analysis.groups.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {analysis.groups.map((g, gi) => (
                <span key={g.key} className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${groupClass(gi)}`}>
                  {t("pattern", "លំនាំ")} “{g.key}” · {t(`${g.count} line(s)`, `${g.count} បន្ទាត់`)}
                </span>
              ))}
            </div>
          )}

          <div className="overflow-hidden rounded-md border border-[var(--ground-line)]">
            <div className="border-b border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
              {t(
                `${analysis.rows.length} line(s) · detected pattern: ${analysis.rows.map((r) => groupLetter(r.group)).join(" ")}`,
                `បន្ទាត់ចំនួន ${analysis.rows.length} · លំនាំរកឃើញ៖ ${analysis.rows.map((r) => groupLetter(r.group)).join(" ")}`
              )}
            </div>
            <div className="divide-y divide-[var(--ground-line)]">
              {analysis.rows.map((r) => (
                <div key={r.idx} className="bg-[var(--ground-raised)] px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
                      <span className="font-mono-ui text-xs text-[var(--ink-faint)]">{r.idx}</span>
                      <span className={`rounded border px-1.5 text-[10px] font-bold ${r.group >= 0 ? groupClass(r.group) : "border-[var(--ground-line)] text-[var(--ink-faint)]"}`}>
                        {groupLetter(r.group)}
                      </span>
                    </div>
                    <p lang="km" className="min-w-0 flex-1 font-khmer text-base leading-relaxed text-[var(--ink)]">
                      {r.text}
                    </p>
                    {r.mismatch && (
                      <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-2 py-1 text-[10px] font-medium text-[var(--danger)]">
                        <AlertCircle size={11} />
                        {t("rhyme break", "ចង្វាក់ខុស")}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 pl-9 text-xs text-[var(--ink-dim)]">
                    <span>
                      {t("Syllables", "ព្យាង្គ")}: <b className="text-[var(--ink)]">{r.syllables}</b>
                    </span>
                    <span>
                      {t("Letters", "អក្សរ")}: <b className="text-[var(--ink)]">{r.letters}</b>
                    </span>
                    <span>
                      {t("Ends with", "បញ្ចប់ដោយ")}:{" "}
                      <b lang="km" className="font-khmer text-[var(--ink)]">
                        {r.endLetter || "—"}
                      </b>
                    </span>
                    <span>
                      {t("Pattern", "លំនាំ")}:{" "}
                      <b lang="km" className="font-khmer text-[var(--gold)]">
                        {r.endKey || "—"}
                      </b>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Simple structural checker: syllable counts are an orthographic approximation (Khmer syllable clusters via the romanization helper), letter counts count non-space characters including vowel signs and diacritics, and rhyme is compared only by the written ending pattern of consecutive lines (e.g. ឆ្ងាយ / បាយ both end with “ាយ”). Traditional kâp metres also use internal (interlocking) rhyme and fixed per-line syllable rules, which this tool does not validate — it is not a full literary metre analysis.",
          "ឧបករណ៍ពិនិត្យតាមរចនាសម្ព័ន្ធសាមញ្ញ៖ ចំនួនព្យាង្គជាតម្លៃប្រហាក់ប្រហែលតាមការសរសេរ (រាប់ចង្កោមព្យាង្គខ្មែរ តាមកម្មវិធីជំនួយ romanization) ចំនួនអក្សររាប់តួអក្សរដែលមិនមែនដកឃ្លា រួមទាំងស្រៈនិស្ស័យ និងវណ្ណយុត្តិ ហើយចង្វាក់ប្រៀបធៀបតែតាមលំនាំសំណេរចុងបន្ទាត់ជាប់គ្នាប៉ុណ្ណោះ (ឧ. ឆ្ងាយ / បាយ បញ្ចប់ដូចគ្នាដោយ «ាយ»)។ កាព្យបុរាណក៏ប្រើចង្វាក់ខាងក្នុង (ឃ្លោង) និងវិធានចំនួនព្យាង្គក្នុងបន្ទាត់ថេរដែរ ដែលឧបករណ៍នេះមិនបានពិនិត្យ — មិនមែនជាការវិភាគចង្វាក់អក្សរសិល្ប៍ពេញលេញទេ។"
        )}
      </p>
    </ToolShell>
  );
}

function SummaryCell({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5 text-center">
      <div className={`text-2xl font-semibold ${danger ? "text-[var(--danger)]" : "text-[var(--gold)]"}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{label}</div>
    </div>
  );
}
