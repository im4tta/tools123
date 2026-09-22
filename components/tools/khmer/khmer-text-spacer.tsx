"use client";
import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { splitWords } from "@/lib/khmer-syllables";

const KHMER_LETTER = /[ក-ឳ]/;

function graphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return [...new Intl.Segmenter("km", { granularity: "grapheme" }).segment(text)].map((s) => s.segment);
  }
  return [...text];
}

// Insert `sep` between adjacent Khmer words, keeping spaces and punctuation.
function spaceByWord(text: string, sep: string): string {
  let out = "";
  let prevWord = false;
  for (const { text: seg, isWord } of splitWords(text)) {
    const khmerWord = isWord && KHMER_LETTER.test(seg);
    if (khmerWord && prevWord) out += sep;
    out += seg;
    prevWord = khmerWord;
  }
  return out;
}

// Insert `sep` between adjacent Khmer orthographic syllables (grapheme clusters).
function spaceBySyllable(text: string, sep: string): string {
  let out = "";
  let prevKhmer = false;
  for (const g of graphemes(text)) {
    const khmer = KHMER_LETTER.test(g[0] ?? "");
    if (khmer && prevKhmer) out += sep;
    out += g;
    prevKhmer = khmer;
  }
  return out;
}

const SEPARATORS: { id: string; value: string; en: string; km: string }[] = [
  { id: "space", value: " ", en: "Space", km: "ចន្លោះ" },
  { id: "dot", value: "·", en: "Middle dot ·", km: "ចំណុច ·" },
  { id: "bullet", value: "•", en: "Bullet •", km: "ចំណុចមូល •" },
  { id: "pipe", value: " | ", en: "Bar |", km: "បន្ទាត់ |" },
];

export default function KhmerTextSpacer() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-spacer:input", "");
  const [mode, setMode] = useToolState<"word" | "syllable">("khmer-spacer:mode", "word");
  const [sepId, setSepId] = useToolState("khmer-spacer:sep", "space");

  const output = useMemo(() => {
    const sep = SEPARATORS.find((s) => s.id === sepId)?.value ?? " ";
    if (!input) return "";
    return mode === "word" ? spaceByWord(input, sep) : spaceBySyllable(input, sep);
  }, [input, mode, sepId]);

  return (
    <ToolShell
      title="Khmer Text Spacer"
      khmerTitle="ឧបករណ៍ដកឃ្លាអត្ថបទខ្មែរ"
      description="Khmer is written without spaces between words, which makes it hard for beginners to read and for computers to search. This inserts a visible separator between each word — or between each syllable, as a reading aid for new readers — while keeping your punctuation and line breaks. Choose a space, dot, bullet, or bar. Runs in your browser."
      descriptionKm="ភាសាខ្មែរសរសេរដោយគ្មានចន្លោះរវាងពាក្យ ដែលធ្វើឱ្យអ្នកចាប់ផ្តើមអានពិបាក និងកុំព្យូទ័រស្វែងរកពិបាក។ ឧបករណ៍នេះបញ្ចូលសញ្ញាបំបែកមើលឃើញរវាងពាក្យនីមួយៗ — ឬរវាងព្យាង្គនីមួយៗ ជាជំនួយអានសម្រាប់អ្នកអានថ្មី — ដោយរក្សាសញ្ញាវណ្ណយុត្ត និងការចុះបន្ទាត់។ ជ្រើសរើសចន្លោះ ចំណុច ចំណុចមូល ឬបន្ទាត់។ ដំណើរការក្នុងកម្មវិធីរុករក។"
    >
      <Field label="Khmer text" labelKm="អត្ថបទខ្មែរ">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={4} lang="km" className="font-khmer" placeholder={t("Paste Khmer text with no spaces…", "បិទភ្ជាប់អត្ថបទខ្មែរដែលគ្មានចន្លោះ…")} />
      </Field>

      <div className="flex flex-wrap items-center gap-2">
        {([["word", "Between words", "រវាងពាក្យ"], ["syllable", "Between syllables", "រវាងព្យាង្គ"]] as const).map(([id, en, km]) => (
          <button key={id} type="button" onClick={() => setMode(id)} className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${mode === id ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}>
            {t(en, km)}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-[var(--ground-line)]" />
        {SEPARATORS.map((s) => (
          <button key={s.id} type="button" onClick={() => setSepId(s.id)} className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${sepId === s.id ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}>
            {t(s.en, s.km)}
          </button>
        ))}
      </div>

      <Output label="Spaced text" value={output || " "} mono={false} />

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Word boundaries come from the browser's built-in Unicode (ICU) Khmer dictionary segmenter; syllable boundaries are the browser's Khmer grapheme clusters. Both are approximate — Khmer word-breaking is genuinely ambiguous — so proofread before using in print. Everything runs in your browser. For invisible word-break spaces that only affect line-wrapping, see the Soft Line-break Helper.",
          "ព្រំដែនពាក្យមកពីកម្មវិធីបំបែកពាក្យខ្មែរ Unicode (ICU) ដែលភ្ជាប់មកក្នុងកម្មវិធីរុករក ព្រំដែនព្យាង្គគឺក្រុមអក្សរខ្មែររបស់កម្មវិធីរុករក។ ទាំងពីរជាការប៉ាន់ស្មាន — ការបំបែកពាក្យខ្មែរមានភាពមិនច្បាស់លាស់ — សូមអានឡើងវិញមុនប្រើក្នុងការបោះពុម្ព។ អ្វីៗដំណើរការក្នុងកម្មវិធីរុករក។ សម្រាប់ចន្លោះបំបែកពាក្យមើលមិនឃើញ សូមមើលឧបករណ៍ចន្លោះខណ្ឌ។",
        )}</p>
      </section>
    </ToolShell>
  );
}
