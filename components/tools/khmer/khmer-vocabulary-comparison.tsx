"use client";
import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { CopyButton } from "@/components/CopyButton";
import { Field, Row, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { segmentWords, isContentWord } from "@/lib/khmer-nlp";

function wordSet(text: string, contentOnly: boolean): Set<string> {
  const words = segmentWords(text).filter((w) => (contentOnly ? isContentWord(w) : true));
  return new Set(words);
}

export default function KhmerVocabularyComparison() {
  const { text: t } = useLanguage();
  const [a, setA] = useToolState("khmer-vocab-cmp:a", "");
  const [b, setB] = useToolState("khmer-vocab-cmp:b", "");
  const [contentOnly, setContentOnly] = useToolState("khmer-vocab-cmp:content", false);

  const { shared, onlyA, onlyB, setA: sa, setB: sb } = useMemo(() => {
    const sa = wordSet(a, contentOnly);
    const sb = wordSet(b, contentOnly);
    const shared: string[] = [];
    const onlyA: string[] = [];
    const onlyB: string[] = [];
    for (const w of sa) (sb.has(w) ? shared : onlyA).push(w);
    for (const w of sb) if (!sa.has(w)) onlyB.push(w);
    const col = (x: string, y: string) => x.localeCompare(y);
    return { shared: shared.sort(col), onlyA: onlyA.sort(col), onlyB: onlyB.sort(col), setA: sa, setB: sb };
  }, [a, b, contentOnly]);

  const both = a.trim() && b.trim();

  return (
    <ToolShell
      title="Khmer Vocabulary Comparison"
      khmerTitle="ឧបករណ៍ប្រៀបធៀបវាក្យសព្ទខ្មែរ"
      description="Paste two Khmer texts and compare the words they use: which words they share, which appear only in the first, and which appear only in the second. Useful for comparing two drafts, checking how much a translation overlaps, grading vocabulary, or seeing what a rewrite added or dropped. Word-splitting and comparison run in your browser."
      descriptionKm="បិទភ្ជាប់អត្ថបទខ្មែរពីរ ហើយប្រៀបធៀបពាក្យដែលពួកវាប្រើ៖ ពាក្យណាដែលរួមគ្នា ពាក្យណាដែលមានតែក្នុងទីមួយ និងពាក្យណាដែលមានតែក្នុងទីពីរ។ មានប្រយោជន៍សម្រាប់ប្រៀបធៀបព្រាងពីរ ពិនិត្យការត្រួតស៊ីនៃការបកប្រែ វាយតម្លៃវាក្យសព្ទ ឬមើលអ្វីដែលការសរសេរឡើងវិញបានបន្ថែម ឬដក។ ការបំបែកពាក្យ និងការប្រៀបធៀបដំណើរការក្នុងកម្មវិធីរុករក។"
    >
      <Row>
        <Field label="Text A" labelKm="អត្ថបទ ក">
          <TextArea value={a} onChange={(e) => setA(e.target.value)} rows={5} lang="km" className="font-khmer" placeholder={t("Paste the first text…", "បិទភ្ជាប់អត្ថបទទីមួយ…")} />
        </Field>
        <Field label="Text B" labelKm="អត្ថបទ ខ">
          <TextArea value={b} onChange={(e) => setB(e.target.value)} rows={5} lang="km" className="font-khmer" placeholder={t("Paste the second text…", "បិទភ្ជាប់អត្ថបទទីពីរ…")} />
        </Field>
      </Row>

      <button
        type="button"
        onClick={() => setContentOnly((v) => !v)}
        className={`w-fit rounded-md border px-3 py-1.5 text-xs font-medium transition ${contentOnly ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}
      >
        {t("Content words only (skip particles)", "ពាក្យខ្លឹមសារតែប៉ុណ្ណោះ (រំលងពាក្យវេយ្យាករណ៍)")}
      </button>

      {both ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <VocabColumn title={t("Only in A", "មានតែក្នុង ក")} words={onlyA} accent="var(--teal)" />
          <VocabColumn title={t("Shared", "រួមគ្នា")} words={shared} accent="var(--gold)" />
          <VocabColumn title={t("Only in B", "មានតែក្នុង ខ")} words={onlyB} accent="var(--danger)" />
        </div>
      ) : (
        <p className="text-xs text-[var(--ink-faint)]">{t("Paste text into both boxes to compare their vocabularies.", "បិទភ្ជាប់អត្ថបទក្នុងប្រអប់ទាំងពីរ ដើម្បីប្រៀបធៀបវាក្យសព្ទ។")}</p>
      )}

      {both && (
        <p className="text-xs text-[var(--ink-faint)]">
          {t(
            `${sa.size} unique words in A · ${sb.size} in B · ${shared.length} shared (${sa.size + sb.size - shared.length > 0 ? Math.round((shared.length / (sa.size + sb.size - shared.length)) * 100) : 0}% overlap)`,
            `ពាក្យផ្សេងគ្នា ${sa.size} ក្នុង ក · ${sb.size} ក្នុង ខ · រួមគ្នា ${shared.length} (ត្រួតស៊ី ${sa.size + sb.size - shared.length > 0 ? Math.round((shared.length / (sa.size + sb.size - shared.length)) * 100) : 0}%)`,
          )}
        </p>
      )}

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Words are segmented with split-khmer (Seanghay Yath, MIT) helped by the offline common-word lexicon, then compared as sets. \"Overlap\" is the shared words as a share of all distinct words across both texts (Jaccard similarity). Segmentation is heuristic, so proofread for edge cases. Everything runs in your browser.",
          "ពាក្យត្រូវបានបំបែកដោយ split-khmer (Seanghay Yath, MIT) ដោយមានជំនួយពីវចនានុក្រមពាក្យធម្មតាក្រៅបណ្តាញ រួចប្រៀបធៀបជាសំណុំ។ «ការត្រួតស៊ី» គឺជាពាក្យរួមគ្នាធៀបនឹងពាក្យផ្សេងគ្នាទាំងអស់ក្នុងអត្ថបទទាំងពីរ (Jaccard similarity)។ ការបំបែកពាក្យជាការប៉ាន់ស្មាន សូមអានឡើងវិញសម្រាប់ករណីពិសេស។ អ្វីៗដំណើរការក្នុងកម្មវិធីរុករក។",
        )}</p>
      </section>
    </ToolShell>
  );
}

function VocabColumn({ title, words, accent }: { title: string; words: string[]; accent: string }) {
  return (
    <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--ink-dim)]">
          <span className="h-2 w-2 rounded-full" style={{ background: accent }} />{title}
          <span className="text-[var(--ink-faint)]">{words.length}</span>
        </span>
        {words.length > 0 && <CopyButton text={words.join("\n")} compact />}
      </div>
      {words.length > 0 ? (
        <div className="flex max-h-64 flex-wrap gap-1.5 overflow-y-auto">
          {words.map((w) => (
            <span key={w} lang="km" className="rounded border border-[var(--ground-line)] bg-[var(--ground)] px-1.5 py-0.5 font-khmer text-xs text-[var(--ink)]">{w}</span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--ink-faint)]">—</p>
      )}
    </div>
  );
}
