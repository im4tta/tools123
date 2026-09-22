"use client";
import { useMemo } from "react";
import { ScrollText } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Select, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { segmentWords, splitSentences, isContentWord } from "@/lib/khmer-nlp";

type Length = "third" | "half" | "top3";

export default function KhmerSummarizer() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState(
    "khmer-summarizer:input",
    "ភាសាខ្មែរ គឺជាភាសាផ្លូវការរបស់ព្រះរាជាណាចក្រកម្ពុជា។ ភាសាខ្មែរមានអក្សរផ្ទាល់ខ្លួន ដែលមានប្រវត្តិយូរលង់ជាងពីរពាន់ឆ្នាំ។ សព្វថ្ងៃ ប្រជាជនកម្ពុជាជាង ១៦ លាននាក់ ប្រើប្រាស់ភាសាខ្មែរ។ ភាសាខ្មែរក៏ត្រូវបានប្រើនៅក្នុងសហគមន៍ខ្មែរនៅបរទេសផងដែរ។ ការរៀនសរសេរ និងអានភាសាខ្មែរឲ្យបានត្រឹមត្រូវ គឺជាកិច្ចការសំខាន់សម្រាប់សិស្សានុសិស្សគ្រប់រូប។",
  );
  const [length, setLength] = useToolState<Length>("khmer-summarizer:length", "third");

  const result = useMemo(() => {
    const sentences = splitSentences(input);
    if (sentences.length < 2) return null;

    // Term frequency of content words across the whole text.
    const freq = new Map<string, number>();
    for (const w of segmentWords(input)) {
      if (isContentWord(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
    }

    // Score each sentence by the average frequency of its content words, so a
    // sentence is "important" when it is dense with the text's recurring terms.
    const scored = sentences.map((sentence, index) => {
      const words = segmentWords(sentence).filter(isContentWord);
      const score = words.length ? words.reduce((s, w) => s + (freq.get(w) ?? 0), 0) / words.length : 0;
      return { sentence, index, score };
    });

    const keep = length === "top3" ? Math.min(3, sentences.length) : Math.max(1, Math.round(sentences.length * (length === "half" ? 0.5 : 0.34)));
    const chosen = [...scored].sort((a, b) => b.score - a.score).slice(0, keep).map((s) => s.index).sort((a, b) => a - b);
    const summary = chosen.map((i) => sentences[i]).join(" ");

    return { summary, kept: chosen.length, total: sentences.length };
  }, [input, length]);

  return (
    <ToolShell
      title="Khmer Text Summarizer"
      khmerTitle="ឧបករណ៍សង្ខេបអត្ថបទខ្មែរ"
      description="Shorten a long Khmer text to its most important sentences. It segments the text with split-khmer, finds the words that recur most, and keeps the sentences richest in those terms — an extractive summary that selects real sentences from your text rather than rewriting them."
      descriptionKm="បង្រួញអត្ថបទខ្មែរវែងឲ្យនៅតែប្រយោគសំខាន់បំផុត។ វាបំបែកអត្ថបទដោយ split-khmer រកពាក្យដែលលេចឡើងញឹកញាប់បំផុត ហើយរក្សាទុកប្រយោគដែលមានពាក្យទាំងនោះច្រើន — ជាការសង្ខេបបែបជ្រើសរើសប្រយោគពិតពីអត្ថបទរបស់អ្នក មិនមែនការសរសេរឡើងវិញទេ។"
    >
      <Field label="Khmer text" labelKm="អត្ថបទខ្មែរ" hint="A few sentences or more" hintKm="ប្រយោគច្រើន ឬវែងជាងនេះ">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={6} placeholder={t("Paste a Khmer article or passage…", "បិទភ្ជាប់អត្ថបទ ឬកថាខណ្ឌខ្មែរ…")} autoFocus />
      </Field>

      <Field label="Summary length" labelKm="ប្រវែងសង្ខេប">
        <Select value={length} onChange={(e) => setLength(e.target.value as Length)}>
          <option value="third">About one third</option>
          <option value="half">About one half</option>
          <option value="top3">Shortest (top 3 sentences)</option>
        </Select>
      </Field>

      {result ? (
        <>
          <div className="rounded-md border border-[var(--gold-dim)] bg-[var(--ground-raised)] p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                <ScrollText size={14} className="text-[var(--gold)]" />
                {t(`Summary — ${result.kept} of ${result.total} sentences`, `សង្ខេប — ${result.kept} ក្នុងចំណោម ${result.total} ប្រយោគ`)}
              </span>
              <CopyButton text={result.summary} compact />
            </div>
            <p lang="km" className="font-khmer text-base leading-loose text-[var(--ink)]">{result.summary}</p>
          </div>
          <p className="text-[11px] leading-5 text-[var(--ink-faint)]">
            {t(
              "Extractive summary: the sentences are copied unchanged from your text and kept in their original order — nothing is paraphrased or invented. Best on informative writing; for a very short or narrative text the result may not read smoothly.",
              "ការសង្ខេបបែបជ្រើសរើស៖ ប្រយោគត្រូវបានចម្លងដដែលពីអត្ថបទរបស់អ្នក ហើយរក្សាលំដាប់ដើម — គ្មានការកែសម្រួល ឬបង្កើតថ្មីទេ។ ល្អបំផុតសម្រាប់អត្ថបទផ្តល់ព័ត៌មាន។ សម្រាប់អត្ថបទខ្លី ឬរឿងនិទាន លទ្ធផលអាចមិនរលូនទេ។",
            )}
          </p>
        </>
      ) : (
        <p className="text-xs text-[var(--ink-faint)]">{t("Enter at least two Khmer sentences to summarise.", "សូមបញ្ចូលប្រយោគខ្មែរយ៉ាងតិចពីរ ដើម្បីសង្ខេប។")}</p>
      )}

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Word segmentation by split-khmer (Seanghay Yath, MIT); normalisation by khmer-nlp-toolkit (github:vengmony, MIT). Sentence scoring uses simple term-frequency computed from your text in the browser — nothing is sent anywhere or generated by a model.",
          "ការបំបែកពាក្យដោយ split-khmer (Seanghay Yath, MIT)។ ការធ្វើឲ្យធម្មតាដោយ khmer-nlp-toolkit (github:vengmony, MIT)។ ការដាក់ពិន្ទុប្រយោគប្រើប្រេកង់ពាក្យសាមញ្ញគណនាពីអត្ថបទរបស់អ្នកក្នុងកម្មវិធីរុករក គ្មានការបញ្ជូន ឬបង្កើតដោយម៉ូដែលទេ។",
        )}</p>
      </section>
    </ToolShell>
  );
}
