"use client";
import { useMemo } from "react";
import { Tags } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { segmentWords, isContentWord, STOPWORDS, KHMER_ANY } from "@/lib/khmer-nlp";

export default function KhmerKeywordExtractor() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState(
    "khmer-keyword-extractor:input",
    "បច្ចេកវិទ្យាព័ត៌មាន កំពុងផ្លាស់ប្តូរ សេដ្ឋកិច្ចកម្ពុជា។ រដ្ឋាភិបាលកម្ពុជា គាំទ្រ ការអភិវឌ្ឍ បច្ចេកវិទ្យា និងការច្នៃប្រឌិត។ យុវជនកម្ពុជាជាច្រើន កំពុងរៀន ជំនាញ បច្ចេកវិទ្យា ដើម្បីអភិវឌ្ឍ សេដ្ឋកិច្ចឌីជីថល។",
  );

  const { keywords, phrases } = useMemo(() => {
    const words = segmentWords(input);

    // Single-word keywords: content words by frequency.
    const single = new Map<string, number>();
    for (const w of words) if (isContentWord(w)) single.set(w, (single.get(w) ?? 0) + 1);

    // Two-word phrases: adjacent content-word pairs (both meaningful).
    const bi = new Map<string, number>();
    for (let i = 0; i < words.length - 1; i++) {
      const a = words[i], b = words[i + 1];
      if (isContentWord(a) && isContentWord(b) && !STOPWORDS.has(a) && !STOPWORDS.has(b)) {
        const key = `${a} ${b}`;
        bi.set(key, (bi.get(key) ?? 0) + 1);
      }
    }

    const rank = (m: Map<string, number>) => [...m.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0], "km")).slice(0, 15);
    return { keywords: rank(single), phrases: rank(bi).filter(([, c]) => c > 1).slice(0, 10) };
  }, [input]);

  const maxKw = keywords[0]?.[1] ?? 1;
  const copyText = keywords.map(([w, c]) => `${w}\t${c}`).join("\n");

  const hasText = KHMER_ANY.test(input);

  return (
    <ToolShell
      title="Khmer Keyword Extractor"
      khmerTitle="ឧបករណ៍ស្រង់ពាក្យគន្លឹះខ្មែរ"
      description="Find what a Khmer text is about. It segments the text with split-khmer, drops grammatical function words (particles, prepositions, pronouns…), and ranks the remaining content words by how often they appear — plus the most frequent two-word phrases. Useful for tags, SEO, indexing, and getting the gist at a glance."
      descriptionKm="ស្វែងយល់ថាអត្ថបទខ្មែរនិយាយអំពីអ្វី។ វាបំបែកអត្ថបទដោយ split-khmer លុបពាក្យវេយ្យាករណ៍ (និបាតសព្ទ ធ្នាក់ សព្វនាម។ល។) ហើយតម្រៀបពាក្យខ្លឹមសារដែលនៅសល់តាមចំនួនលេចឡើង — ព្រមទាំងឃ្លាពីរពាក្យញឹកញាប់បំផុត។ មានប្រយោជន៍សម្រាប់ស្លាក SEO ការធ្វើលិបិក្រម និងការយល់ខ្លឹមសាររហ័ស។"
    >
      <Field label="Khmer text" labelKm="អត្ថបទខ្មែរ">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={5} placeholder={t("Paste Khmer text to analyse…", "បិទភ្ជាប់អត្ថបទខ្មែរដើម្បីវិភាគ…")} autoFocus />
      </Field>

      {hasText && keywords.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]"><Tags size={14} className="text-[var(--gold)]" />{t("Top keywords", "ពាក្យគន្លឹះ")}</span>
              <CopyButton text={copyText} compact />
            </div>
            <ul className="space-y-1.5">
              {keywords.map(([w, c]) => (
                <li key={w} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 truncate font-khmer text-sm text-[var(--ink)]" title={w}>{w}</span>
                  <span className="h-2 rounded-full bg-[var(--gold)]" style={{ width: `${Math.max(6, (c / maxKw) * 100)}%` }} />
                  <span className="ml-auto text-xs tabular-nums text-[var(--ink-faint)]">{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Top phrases (2 words)", "ឃ្លាញឹកញាប់ (ពីរពាក្យ)")}</span>
            {phrases.length ? (
              <ul className="space-y-1.5">
                {phrases.map(([p, c]) => (
                  <li key={p} className="flex items-center justify-between gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5">
                    <span className="truncate font-khmer text-sm text-[var(--ink)]">{p}</span>
                    <span className="text-xs tabular-nums text-[var(--ink-faint)]">×{c}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--ink-faint)]">{t("No repeated two-word phrases found.", "រកមិនឃើញឃ្លាពីរពាក្យដែលកើតឡើងដដែលៗទេ។")}</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-[var(--ink-faint)]">{t("Enter Khmer text to extract keywords.", "សូមបញ្ចូលអត្ថបទខ្មែរ ដើម្បីស្រង់ពាក្យគន្លឹះ។")}</p>
      )}

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Word segmentation by split-khmer (Seanghay Yath, MIT); normalisation by khmer-nlp-toolkit (github:vengmony, MIT). Function words are identified from an offline common-word lexicon (khmer-nlp-toolkit + Chuon Nath & Headley). All counting happens in your browser.",
          "ការបំបែកពាក្យដោយ split-khmer (Seanghay Yath, MIT)។ ការធ្វើឲ្យធម្មតាដោយ khmer-nlp-toolkit (github:vengmony, MIT)។ ពាក្យវេយ្យាករណ៍កំណត់ពីវចនានុក្រមពាក្យធម្មតាក្រៅបណ្តាញ (khmer-nlp-toolkit + ជួន ណាត និង Headley)។ ការរាប់ទាំងអស់ធ្វើក្នុងកម្មវិធីរុករករបស់អ្នក។",
        )}</p>
      </section>
    </ToolShell>
  );
}
