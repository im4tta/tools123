"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea, Select, Row } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const ENGLISH_STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "for", "with",
  "is", "are", "was", "were", "be", "been", "being", "am", "i", "you", "he", "she",
  "it", "we", "they", "me", "him", "her", "us", "them", "my", "your", "his", "its",
  "our", "their", "this", "that", "these", "those", "not", "no", "yes", "do", "does",
  "did", "have", "has", "had", "will", "would", "can", "could", "should", "so", "if",
  "then", "than", "as", "from", "by", "about", "into", "over", "after", "before",
]);

export default function NgramFinder() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState(
    "ngram:input",
    "the quick brown fox jumps over the lazy dog and the quick brown fox runs home"
  );
  const [n, setN] = useToolState("ngram:n", "2");
  const [topN, setTopN] = useToolState("ngram:top", "10");
  const [ignoreCase, setIgnoreCase] = useToolState("ngram:ignoreCase", true);
  const [skipStop, setSkipStop] = useToolState("ngram:skipStop", false);

  const grams = useMemo(() => {
    const size = Number(n);
    if (!Number.isInteger(size) || size < 1 || size > 5) return [];
    let tokens: string[] = input.match(/[\p{L}\p{N}']+/gu) ?? [];
    if (ignoreCase) tokens = tokens.map((token) => token.toLowerCase());
    if (skipStop) tokens = tokens.filter((token) => !ENGLISH_STOPWORDS.has(token.toLowerCase()));
    if (tokens.length < size) return [];

    const counts = new Map<string, number>();
    for (let i = 0; i <= tokens.length - size; i++) {
      const gram = tokens.slice(i, i + size).join(" ");
      counts.set(gram, (counts.get(gram) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [input, n, ignoreCase, skipStop]);

  const top = grams.slice(0, Number(topN) || 10);
  const csv = top.map(([gram, count]) => `"${gram.replace(/"/g, '""')}",${count}`).join("\n");

  const copyCsv = () => {
    if (!csv) return;
    void navigator.clipboard?.writeText(csv);
  };

  const max = top[0]?.[1] ?? 1;

  return (
    <ToolShell
      title="N-gram Finder"
      khmerTitle="ស្វែងរក N-gram"
      description="Extract word n-grams (size 1–5) with frequency counts from pasted text, with options to ignore case, skip stopwords and copy the results as CSV."
      descriptionKm="ទាញយក n-gram ពាក្យ (ទំហំ 1–5) ជាមួយចំនួនដងពីអត្ថបទដែលបានបិទភ្ជាប់ ជាមួយជម្រើសមិនគិតអក្សរធំតូច រំលងពាក្យបញ្ឈប់ និងចម្លងលទ្ធផលជា CSV។"
    >
      <Field label={t("Text", "អត្ថបទ")}>
        <TextArea rows={6} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      <Row>
        <Field label={t("N-gram size", "ទំហំ N-gram")}>
          <Select value={n} onChange={(e) => setN(e.target.value)}>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </Select>
        </Field>
        <Field label={t("Show top", "បង្ហាញកំពូល")}>
          <Select value={topN} onChange={(e) => setTopN(e.target.value)}>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Select>
        </Field>
      </Row>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <label className="flex items-center gap-2 text-sm text-[var(--ink-dim)]">
          <input type="checkbox" checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
          {t("Ignore case", "មិនគិតអក្សរធំតូច")}
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--ink-dim)]">
          <input type="checkbox" checked={skipStop} onChange={(e) => setSkipStop(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
          {t("Skip English stopwords", "រំលងពាក្យបញ្ឈប់អង់គ្លេស")}
        </label>
      </div>

      {top.length > 0 ? (
        <>
          <div className="space-y-1">
            {top.map(([gram, count]) => (
              <div key={gram} className="flex items-center gap-3 text-sm">
                <span className="min-w-0 flex-1 break-words font-mono-ui text-[var(--ink)]">{gram}</span>
                <div className="h-2 w-24 shrink-0 overflow-hidden rounded bg-[var(--ground-raised)] sm:w-40">
                  <div className="h-full rounded bg-[var(--gold)]" style={{ width: `${(count / max) * 100}%` }} />
                </div>
                <span className="w-10 shrink-0 text-right font-mono-ui text-[var(--ink-dim)]">{count}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={copyCsv}>{t("Copy CSV", "ចម្លង CSV")}</Button>
            <span className="text-xs text-[var(--ink-dim)]">
              {t(`${grams.length} distinct ${n}-grams found.`, `${grams.length} n-gram ផ្សេងៗគ្នាត្រូវបានរកឃើញ។`)}
            </span>
          </div>
          <Output label={t("CSV (gram,count)", "CSV (gram,count)")} value={csv} />
        </>
      ) : (
        <p className="text-sm font-medium text-[var(--gold)]">
          {t("Not enough words for the chosen n-gram size.", "មិនមានពាក្យគ្រប់គ្រាន់សម្រាប់ទំហំ n-gram ដែលបានជ្រើសរើសទេ។")}
        </p>
      )}
    </ToolShell>
  );
}
