"use client";

import { ExternalLink, Info, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const DEFAULT_INPUT = "កម្ពុជាកំពុងអភិវឌ្ឍបច្ចេកវិទ្យាឌីជីថលយ៉ាងឆាប់រហ័ស";

function restorePunctuation(input: string) {
  const original = input.trim();
  if (!original) return { corrected: "", differences: [], confidence: 0 };
  // Keep this fallback conservative: punctuation restoration must not invent
  // word boundaries. The original khmerpunctuate model combines tokenization
  // and punctuation prediction; this local fallback only edits spacing around
  // existing punctuation and adds a sentence stop.
  let corrected = original.replace(/[ \t]+/gu, " ").replace(/\s+([។៕!?៖])/gu, "$1").trim();
  const differences: string[] = [];
  if (corrected !== original) differences.push("Normalized existing whitespace");
  if (!/[។៕!?]$/u.test(corrected)) {
    corrected += "។";
    differences.push("Added Khmer full stop");
  }
  return { corrected, differences, confidence: differences.length ? 0.62 : 0.98 };
}

export default function KhmerPunctuationRestorer() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-punctuation-restorer:input", DEFAULT_INPUT);
  const result = useMemo(() => restorePunctuation(input), [input]);

  return <ToolShell title="Khmer Sentence Punctuation Restorer" khmerTitle="កែសម្រួលវណ្ណយុត្តិប្រយោគខ្មែរ" description="Restore spacing and Khmer sentence punctuation for OCR, ASR, scraped web text, and older documents. This browser fallback is deterministic and heuristic; it is not the original neural khmerpunctuate model." descriptionKm="កែសម្រួលចន្លោះ និងវណ្ណយុត្តិប្រយោគខ្មែរ សម្រាប់ OCR, ASR, អត្ថបទពី Web និងឯកសារចាស់ៗ។ ឧបករណ៍ក្នុង Browser នេះប្រើច្បាប់ Heuristic មិនមែនជាម៉ូដែល Neural ដើមរបស់ khmerpunctuate ទេ។">
    <div className="space-y-5">
      <Field label={t("Original", "អត្ថបទដើម")} hint={t("OCR / ASR / scraped text", "OCR / ASR / អត្ថបទពី Web")}>
        <TextArea rows={6} value={input} onChange={(event) => setInput(event.target.value)} className="font-khmer text-lg leading-relaxed" placeholder={t("Paste unpunctuated Khmer text…", "បិទភ្ជាប់អត្ថបទខ្មែរដែលមិនទាន់មានវណ្ណយុត្តិ…")} />
      </Field>
      <section className="rounded-2xl border border-[var(--success)]/30 bg-[var(--success)]/5 p-4"><div className="mb-2 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-display text-lg font-semibold text-[var(--ink)]"><Sparkles size={16} className="text-[var(--success)]" />{t("Corrected", "អត្ថបទដែលបានកែ")}</h2><CopyButton text={result.corrected} compact /></div><p className="font-khmer text-lg leading-loose text-[var(--ink)]">{result.corrected || "—"}</p></section>
      <section className="grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><h2 className="mb-2 font-display font-semibold text-[var(--ink)]">{t("Differences", "ភាពខុសគ្នា")}</h2>{result.differences.length ? <ul className="space-y-2 text-sm text-[var(--ink-dim)]">{result.differences.map((difference) => <li key={difference} className="flex items-start gap-2"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]" />{t(difference, difference === "Added Khmer full stop" ? "បានបន្ថែមសញ្ញាខណ្ឌខ្មែរ" : "បានបន្ថែមចន្លោះព្រំដែនពាក្យ")}</li>)}</ul> : <p className="text-sm text-[var(--success)]">{t("No changes needed.", "មិនចាំបាច់កែប្រែទេ។")}</p>}</div><div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><h2 className="mb-2 font-display font-semibold text-[var(--ink)]">{t("Confidence", "កម្រិតជឿជាក់")}</h2><p className="font-mono-ui text-3xl font-bold text-[var(--gold)]">{Math.round(result.confidence * 100)}%</p><p className="mt-1 text-xs leading-relaxed text-[var(--ink-faint)]">{t("Heuristic estimate only. Review before publishing or using as official text.", "ជាការប៉ាន់ស្មានតាមច្បាប់ប៉ុណ្ណោះ។ សូមពិនិត្យមុនបោះពុម្ពផ្សាយ ឬប្រើជាអត្ថបទផ្លូវការ។")}</p></div></section>
      <section className="rounded-xl border border-[var(--slate-accent)]/30 bg-[var(--slate-accent)]/10 p-4"><h2 className="flex items-center gap-2 font-display font-semibold text-[var(--ink)]"><Info size={15} className="text-[var(--slate-accent)]" />{t("Practical use", "ការប្រើប្រាស់ជាក់ស្តែង")}</h2><p className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]">{t("Useful as a first cleanup pass for OCR, ASR, scraped web text, and old documents. The original khmerpunctuate project uses a neural ONNX model for punctuation, whitespace, sentence, and number-entity prediction.", "មានប្រយោជន៍ជាជំហានសម្អាតដំបូងសម្រាប់ OCR, ASR, អត្ថបទពី Web និងឯកសារចាស់ៗ។ គម្រោង khmerpunctuate ដើមប្រើម៉ូដែល Neural ONNX ដើម្បីព្យាករវណ្ណយុត្តិ ចន្លោះ ប្រយោគ និងលេខ។")}</p></section>
      <aside className="rounded-xl border border-[var(--gold-dim)]/40 bg-[var(--gold)]/10 p-4 text-xs leading-relaxed text-[var(--ink-dim)]"><p className="font-semibold text-[var(--ink)]">{t("Important note", "ចំណាំសំខាន់")}</p><p className="mt-1">{t("Exact output with inferred word boundaries requires the original khmerpunctuate neural model. This browser fallback restores punctuation conservatively and does not claim the model's accuracy.", "លទ្ធផលពេញលេញដែលមានការសន្និដ្ឋានព្រំដែនពាក្យ តម្រូវឱ្យប្រើម៉ូដែល Neural ដើមរបស់ khmerpunctuate។ ឧបករណ៍បម្រុងក្នុង Browser នេះកែវណ្ណយុត្តិតាមបែបប្រុងប្រយ័ត្ន ហើយមិនអះអាងថាមានភាពត្រឹមត្រូវដូចម៉ូដែលដើមទេ។")}</p></aside>
      <aside className="rounded-xl border border-[var(--gold)]/25 bg-[var(--gold)]/5 p-4 text-xs leading-relaxed text-[var(--ink-dim)]"><p className="font-semibold text-[var(--ink)]">{t("Source reference", "ប្រភពយោង")}</p><p className="mt-1">{t("This local fallback is independently implemented. The original khmerpunctuate project is credited here for the model design and reference workflow.", "ឧបករណ៍បម្រុងក្នុង Browser នេះត្រូវបានអនុវត្តដោយឯករាជ្យ។ គម្រោង khmerpunctuate ដើមត្រូវបានទទួលស្គាល់សម្រាប់ការរចនាម៉ូដែល និងលំហូរការងារយោង។")}</p><div className="mt-2 flex flex-wrap gap-4"><a href="https://github.com/seanghay/khmerpunctuate" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--gold)] underline"><ExternalLink size={12} />khmerpunctuate</a><a href="https://huggingface.co/seanghay/khmer-punctuation-restore" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--gold)] underline"><ExternalLink size={12} />{t("Model", "ម៉ូដែល")}</a></div><p className="mt-2">MIT License · Seanghay Yath</p></aside>
    </div>
  </ToolShell>;
}
