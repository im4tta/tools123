"use client";
import { useMemo } from "react";
import { ListChecks } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { segmentWords, splitSentences, KHMER_ANY } from "@/lib/khmer-nlp";

// Word-count bands for a sentence. Long sentences are the ones an editor should
// consider splitting; the thresholds are a plain guide, not a rule.
function band(words: number): { key: string; km: string; color: string } {
  if (words <= 12) return { key: "Short", km: "ខ្លី", color: "#16a34a" };
  if (words <= 22) return { key: "Medium", km: "មធ្យម", color: "#d97706" };
  return { key: "Long", km: "វែង", color: "#dc2626" };
}

export default function KhmerSentenceComplexity() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState(
    "khmer-sentence-complexity:input",
    "ភាសាខ្មែរងាយស្រួលរៀន។ ទោះបីជាភាសាខ្មែរមានអក្សរច្រើន និងមានក្បួនអក្ខរាវិរុទ្ធស្មុគស្មាញ ដែលធ្វើឲ្យសិស្សមួយចំនួនពិបាកចងចាំ ប៉ុន្តែបើមានការអនុវត្តជាប្រចាំ និងមានគ្រូល្អ ណែនាំត្រឹមត្រូវ សិស្សគ្រប់រូបនឹងអាចសរសេរ និងអានបានយ៉ាងស្ទាត់ជំនាញ។ ការអានសៀវភៅច្រើនក៏ជួយបានដែរ។",
  );

  const { rows, stats } = useMemo(() => {
    const sentences = splitSentences(input);
    const rows = sentences.map((sentence) => {
      const words = segmentWords(sentence).length;
      return { sentence, words, band: band(words) };
    });
    const total = rows.length;
    const avg = total ? rows.reduce((s, r) => s + r.words, 0) / total : 0;
    const longest = rows.reduce((m, r) => Math.max(m, r.words), 0);
    const longCount = rows.filter((r) => r.words > 22).length;
    return { rows, stats: { total, avg, longest, longCount } };
  }, [input]);

  const hasText = KHMER_ANY.test(input) && rows.length > 0;

  return (
    <ToolShell
      title="Khmer Sentence Complexity"
      khmerTitle="ឧបករណ៍វិភាគភាពស្មុគស្មាញប្រយោគខ្មែរ"
      description="Spot the sentences that are too long to read comfortably. It splits your Khmer text into sentences, counts the words in each, and colours them green, amber, or red so you can find and shorten the heavy ones. A practical editing aid for clear, readable Khmer writing."
      descriptionKm="រកប្រយោគដែលវែងពេកពិបាកអាន។ វាបំបែកអត្ថបទខ្មែររបស់អ្នកជាប្រយោគ រាប់ចំនួនពាក្យក្នុងប្រយោគនីមួយៗ ហើយដាក់ពណ៌បៃតង លឿង ឬក្រហម ដើម្បីឲ្យអ្នករកឃើញ និងបង្រួញប្រយោគធ្ងន់។ ជាឧបករណ៍កែសម្រួលជាក់ស្តែងសម្រាប់ការសរសេរខ្មែរច្បាស់ និងងាយអាន។"
    >
      <Field label="Khmer text" labelKm="អត្ថបទខ្មែរ">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={5} placeholder={t("Paste Khmer text to check…", "បិទភ្ជាប់អត្ថបទខ្មែរដើម្បីពិនិត្យ…")} autoFocus />
      </Field>

      {hasText && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: t("Sentences", "ប្រយោគ"), value: String(stats.total) },
              { label: t("Avg words", "ពាក្យមធ្យម"), value: stats.avg.toFixed(1) },
              { label: t("Longest", "វែងបំផុត"), value: String(stats.longest) },
              { label: t("Long sentences", "ប្រយោគវែង"), value: String(stats.longCount) },
            ].map((c) => (
              <div key={c.label} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
                <div className="text-[11px] text-[var(--ink-faint)]">{c.label}</div>
                <div className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--ink)]">{c.value}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]"><ListChecks size={14} className="text-[var(--gold)]" />{t("Sentence by sentence", "ប្រយោគម្តងមួយៗ")}</div>
            {rows.map((r, i) => (
              <div key={i} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3" style={{ borderLeftColor: r.band.color, borderLeftWidth: 3 }}>
                <div className="flex items-start justify-between gap-3">
                  <p lang="km" className="font-khmer text-sm leading-relaxed text-[var(--ink)]">{r.sentence}</p>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold tabular-nums" style={{ color: r.band.color }}>{r.words}</span>
                    <span className="block text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{t(r.band.key, r.band.km)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] leading-5 text-[var(--ink-faint)]">
            {t(
              "Bands are a guide from word count (≤12 short, ≤22 medium, longer = long), using automatic word boundaries. Long sentences are not wrong — but breaking them up often makes Khmer easier to follow.",
              "ពណ៌ជាការណែនាំតាមចំនួនពាក្យ (≤១២ ខ្លី, ≤២២ មធ្យម, វែងជាង = វែង) ដោយប្រើព្រំដែនពាក្យស្វ័យប្រវត្តិ។ ប្រយោគវែងមិនមែនខុសទេ — ប៉ុន្តែការបំបែកវាឲ្យខ្លី ជួយឲ្យខ្មែរងាយតាមដានជាង។",
            )}
          </p>
        </>
      )}

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Word segmentation by split-khmer (Seanghay Yath, MIT); normalisation by khmer-nlp-toolkit (github:vengmony, MIT). Counts are computed from your text in the browser.",
          "ការបំបែកពាក្យដោយ split-khmer (Seanghay Yath, MIT)។ ការធ្វើឲ្យធម្មតាដោយ khmer-nlp-toolkit (github:vengmony, MIT)។ ការរាប់គណនាពីអត្ថបទរបស់អ្នកក្នុងកម្មវិធីរុករក។",
        )}</p>
      </section>
    </ToolShell>
  );
}
