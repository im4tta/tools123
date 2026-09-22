"use client";
import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextInput, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { segmentWords, KHMER_ANY } from "@/lib/khmer-nlp";

const CONTEXT = 5; // words of context on each side

export default function KhmerConcordance() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState(
    "khmer-concordance:input",
    "ទឹកគឺជាធនធានធម្មជាតិដ៏សំខាន់។ ប្រជាជនត្រូវការទឹកស្អាតដើម្បីផឹក។ កសិករប្រើទឹកសម្រាប់ដំណាំ។ ការគ្រប់គ្រងទឹកឲ្យបានល្អ ជួយការពារគ្រោះរាំងស្ងួត។ រដ្ឋាភិបាលកំពុងសាងសង់ប្រព័ន្ធធារាសាស្ត្រ ដើម្បីផ្គត់ផ្គង់ទឹក។",
  );
  const [query, setQuery] = useToolState("khmer-concordance:query", "ទឹក");

  const lines = useMemo(() => {
    const q = query.trim();
    if (!q || !KHMER_ANY.test(input)) return [];
    const words = segmentWords(input);
    const hits: { left: string; match: string; right: string }[] = [];
    for (let i = 0; i < words.length; i++) {
      if (words[i] === q || (q.length > 1 && words[i].includes(q))) {
        hits.push({
          left: words.slice(Math.max(0, i - CONTEXT), i).join(" "),
          match: words[i],
          right: words.slice(i + 1, i + 1 + CONTEXT).join(" "),
        });
      }
      if (hits.length >= 200) break;
    }
    return hits;
  }, [input, query]);

  return (
    <ToolShell
      title="Khmer Concordance"
      khmerTitle="ឧបករណ៍បង្ហាញពាក្យក្នុងបរិបទ"
      description="See every place a word appears in a Khmer text, each with the words around it (a “keyword in context” or KWIC view). It segments the text with split-khmer, then lines up every occurrence so you can study how a word is used, compare senses, or check consistency — handy for students, translators, and editors."
      descriptionKm="មើលគ្រប់កន្លែងដែលពាក្យមួយលេចឡើងក្នុងអត្ថបទខ្មែរ ជាមួយពាក្យនៅជុំវិញ (ទិដ្ឋភាព «ពាក្យក្នុងបរិបទ» ឬ KWIC)។ វាបំបែកអត្ថបទដោយ split-khmer រួចរៀបរាល់ការលេចឡើង ដើម្បីឲ្យអ្នកសិក្សាពីរបៀបប្រើពាក្យ ប្រៀបធៀបន័យ ឬពិនិត្យភាពស៊ីសង្វាក់ — មានប្រយោជន៍សម្រាប់សិស្ស អ្នកបកប្រែ និងអ្នកកែសម្រួល។"
    >
      <Field label="Khmer text" labelKm="អត្ថបទខ្មែរ">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={5} placeholder={t("Paste Khmer text…", "បិទភ្ជាប់អត្ថបទខ្មែរ…")} />
      </Field>
      <Field label="Word to find" labelKm="ពាក្យត្រូវរក">
        <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("e.g. ទឹក", "ឧ. ទឹក")} autoComplete="off" />
      </Field>

      <p className="text-xs text-[var(--ink-faint)]">
        {query.trim()
          ? t(`${lines.length}${lines.length === 200 ? "+" : ""} occurrence${lines.length === 1 ? "" : "s"}`, `រកឃើញ ${lines.length}${lines.length === 200 ? "+" : ""} កន្លែង`)
          : t("Type a word to see it in context.", "វាយពាក្យមួយ ដើម្បីមើលក្នុងបរិបទ។")}
      </p>

      {lines.length > 0 && (
        <div className="overflow-hidden rounded-md border border-[var(--ground-line)]">
          <div className="max-h-[28rem] divide-y divide-[var(--ground-line)] overflow-auto">
            {lines.map((l, i) => (
              <div key={i} className="flex items-center gap-1 px-3 py-1.5 font-khmer text-sm leading-relaxed">
                <span className="flex-1 truncate text-right text-[var(--ink-faint)]" dir="ltr">{l.left}</span>
                <span className="shrink-0 rounded bg-[var(--gold)]/15 px-1.5 py-0.5 font-medium text-[var(--gold)]">{l.match}</span>
                <span className="flex-1 truncate text-[var(--ink-faint)]">{l.right}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] leading-5 text-[var(--ink-faint)]">
        {t(
          "Context shows up to five words on each side, using the automatic word boundaries — these may differ slightly from a human's segmentation. A short word may also appear inside longer words when matched loosely.",
          "បរិបទបង្ហាញរហូតដល់ប្រាំពាក្យនៅសងខាង ដោយប្រើព្រំដែនពាក្យស្វ័យប្រវត្តិ — ដែលអាចខុសបន្តិចពីមនុស្ស។ ពាក្យខ្លីក៏អាចលេចនៅក្នុងពាក្យវែងជាងផងដែរ ពេលផ្គូផ្គងបែបទូលាយ។",
        )}
      </p>

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Word segmentation by split-khmer (Seanghay Yath, MIT); normalisation by khmer-nlp-toolkit (github:vengmony, MIT). Everything runs in your browser.",
          "ការបំបែកពាក្យដោយ split-khmer (Seanghay Yath, MIT)។ ការធ្វើឲ្យធម្មតាដោយ khmer-nlp-toolkit (github:vengmony, MIT)។ ដំណើរការទាំងអស់ក្នុងកម្មវិធីរុករករបស់អ្នក។",
        )}</p>
      </section>
    </ToolShell>
  );
}
