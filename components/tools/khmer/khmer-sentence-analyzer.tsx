"use client";
import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { split as splitKhmer } from "split-khmer";
import { normalize } from "khmer-nlp-toolkit";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { KHMER_POS, KHMER_POS_COUNT } from "@/lib/khmer-pos-lexicon";

// Part-of-speech metadata: Khmer grammar name + a distinct accent colour that
// reads on both light and dark backgrounds. English names are localised by the
// shell/i18n. Khmer grammar terms are the standard ones taught in schools.
const POS_META: Record<string, { km: string; color: string }> = {
  Noun: { km: "នាម", color: "#2563eb" },
  Verb: { km: "កិរិយាសព្ទ", color: "#16a34a" },
  Adjective: { km: "គុណនាម", color: "#d97706" },
  Adverb: { km: "កិរិយាវិសេសន៍", color: "#0d9488" },
  Pronoun: { km: "សព្វនាម", color: "#7c3aed" },
  Preposition: { km: "ធ្នាក់", color: "#db2777" },
  Conjunction: { km: "ឈ្នាប់", color: "#0891b2" },
  Particle: { km: "និបាតសព្ទ", color: "#64748b" },
  Numeral: { km: "សំខ្យា", color: "#4f46e5" },
  Number: { km: "លេខ", color: "#4f46e5" },
  Interjection: { km: "ឧទានសព្ទ", color: "#e11d48" },
  Latin: { km: "អក្សរឡាតាំង", color: "#6b7280" },
  Punctuation: { km: "វណ្ណយុត្តិ", color: "#9ca3af" },
  Unknown: { km: "មិនស្គាល់", color: "#94a3b8" },
};

// Tokens that carry a real dictionary part of speech (vs. shape/unknown), used
// for the "recognised" coverage figure.
const CONTENT_POS = new Set(["Noun", "Verb", "Adjective", "Adverb", "Pronoun", "Preposition", "Conjunction", "Particle", "Numeral", "Interjection"]);

const SEP = /(\s+|[។៕៖ៗ៚៙‘’“”"'`.,!?;:()[\]{}«»…%៛@#*+=<>/\\|~—–\-])/u;

// Longest key length in the lexicon, for the decomposition fallback below.
const MAX_WORD_LEN = Object.keys(KHMER_POS).reduce((m, w) => Math.max(m, [...w].length), 1);

type Token = { text: string; pos: string; space: boolean };

function classify(tok: string): string {
  if (/^\s+$/.test(tok)) return "Space";
  if (/^[0-9]+(?:[.,][0-9]+)?$/.test(tok)) return "Number";
  if (/^[០-៩]+$/.test(tok)) return "Numeral";
  if (/^[A-Za-z][A-Za-z.'’\-]*$/.test(tok)) return "Latin";
  if (/^[។៕៖ៗ៚៙‘’“”"'`.,!?;:()[\]{}«»…%៛@#*+=<>/\\|~—–\-]+$/u.test(tok)) return "Punctuation";
  return KHMER_POS[tok] ?? "Unknown";
}

// The segmenter sometimes glues two known words into one chunk (e.g. ចង់+ទៅ).
// When a chunk isn't itself a dictionary word, try to cover it exactly with a
// longest-match over the lexicon; only accept a split that fully decomposes it
// into two-or-more known words, so we never guess boundaries inside a genuinely
// unknown word.
function decompose(tok: string): string[] | null {
  const chars = [...tok];
  const out: string[] = [];
  let i = 0;
  while (i < chars.length) {
    let matched: string | null = null;
    for (let L = Math.min(MAX_WORD_LEN, chars.length - i); L >= 1; L--) {
      const cand = chars.slice(i, i + L).join("");
      if (KHMER_POS[cand]) { matched = cand; break; }
    }
    if (!matched) return null;
    out.push(matched);
    i += [...matched].length;
  }
  return out.length > 1 ? out : null;
}

function tokenize(text: string): Token[] {
  const clean = normalize(text);
  if (!clean.trim()) return [];
  const out: Token[] = [];
  for (const chunk of splitKhmer(clean)) {
    for (const piece of chunk.split(SEP)) {
      if (piece === "") continue;
      if (/^\s+$/.test(piece)) { out.push({ text: piece, pos: "Space", space: true }); continue; }
      const pos = classify(piece);
      if (pos === "Unknown") {
        const parts = decompose(piece);
        if (parts) { for (const p of parts) out.push({ text: p, pos: KHMER_POS[p], space: false }); continue; }
      }
      out.push({ text: piece, pos, space: false });
    }
  }
  return out;
}

const EXAMPLES = ["ខ្ញុំចង់ទៅផ្សារ។", "គាត់ជាគ្រូនៅសាលា។", "សៀវភៅនេះល្អណាស់។", "យើងស្រឡាញ់ប្រទេសខ្មែរ។"];

export default function KhmerSentenceAnalyzer() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-sentence-analyzer:input", "ខ្ញុំចង់ទៅផ្សារនៅថ្ងៃនេះ។");

  const tokens = useMemo(() => tokenize(input), [input]);

  const { words, recognized, dist } = useMemo(() => {
    const words = tokens.filter((tk) => !tk.space && tk.pos !== "Punctuation");
    const recognized = words.filter((tk) => CONTENT_POS.has(tk.pos)).length;
    const dist = new Map<string, number>();
    for (const tk of tokens) {
      if (tk.space) continue;
      dist.set(tk.pos, (dist.get(tk.pos) ?? 0) + 1);
    }
    return { words, recognized, dist };
  }, [tokens]);

  const copyText = useMemo(
    () => tokens.filter((tk) => !tk.space).map((tk) => `${tk.text}\t${tk.pos} / ${POS_META[tk.pos]?.km ?? tk.pos}`).join("\n"),
    [tokens],
  );

  // Legend rows: only the parts of speech actually present, most frequent first.
  const legendRows = useMemo(
    () => [...dist.entries()].sort((a, b) => b[1] - a[1]).filter(([pos]) => POS_META[pos]),
    [dist],
  );

  return (
    <ToolShell
      title="Khmer Sentence Analyzer"
      khmerTitle="ឧបករណ៍វិភាគប្រយោគខ្មែរ"
      description="Break a Khmer sentence into words and label each word's part of speech — noun, verb, adjective, and so on. Word boundaries come from the split-khmer segmenter; parts of speech are looked up in an offline lexicon of common Khmer vocabulary. A learning and analysis aid, not a full grammatical parser."
      descriptionKm="បំបែកប្រយោគខ្មែរជាពាក្យៗ ហើយដាក់ស្លាកថ្នាក់ពាក្យ (នាម កិរិយាសព្ទ គុណនាម ។ល។) សម្រាប់ពាក្យនីមួយៗ។ ព្រំដែនពាក្យបានមកពី split-khmer ឯថ្នាក់ពាក្យរកពីវចនានុក្រមពាក្យខ្មែរធម្មតាក្រៅបណ្តាញ។ ជាឧបករណ៍សិក្សា និងវិភាគ មិនមែនជាកម្មវិធីវិភាគវេយ្យាករណ៍ពេញលេញទេ។"
    >
      <Field label="Khmer text" labelKm="អត្ថបទខ្មែរ" hint="A sentence or short paragraph" hintKm="ប្រយោគ ឬកថាខណ្ឌខ្លី">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={3} placeholder={t("Type or paste Khmer text…", "វាយ ឬបិទភ្ជាប់អត្ថបទខ្មែរ…")} autoFocus />
      </Field>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--ink-faint)]">{t("Try:", "សាកល្បង៖")}</span>
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" onClick={() => setInput(ex)} className="rounded-full border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1 font-khmer text-xs text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)]">
            {ex}
          </button>
        ))}
      </div>

      {words.length > 0 && (
        <>
          {/* Coverage summary */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--ink-faint)]">
            <span className="inline-flex items-center gap-1.5 text-[var(--ink-dim)]"><Sparkles size={13} className="text-[var(--gold)]" />{t(`${words.length} word${words.length === 1 ? "" : "s"}`, `${words.length} ពាក្យ`)}</span>
            <span>{t(`${recognized} recognised (${words.length ? Math.round((100 * recognized) / words.length) : 0}%)`, `ស្គាល់ ${recognized} (${words.length ? Math.round((100 * recognized) / words.length) : 0}%)`)}</span>
          </div>

          {/* Colour-coded analysed sentence */}
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="flex flex-wrap items-end gap-x-1 gap-y-3 font-khmer text-lg leading-loose">
                {tokens.map((tk, i) => {
                  if (tk.space) return <span key={i}>&nbsp;</span>;
                  const meta = POS_META[tk.pos] ?? POS_META.Unknown;
                  if (tk.pos === "Punctuation") return <span key={i} className="text-[var(--ink-faint)]">{tk.text}</span>;
                  return (
                    <span key={i} className="inline-flex flex-col items-center">
                      <span style={{ borderColor: meta.color }} className={`border-b-2 pb-0.5 text-[var(--ink)] ${tk.pos === "Unknown" ? "border-dashed" : ""}`}>{tk.text}</span>
                      <span style={{ color: meta.color }} className="mt-1 font-sans text-[9px] uppercase tracking-wide">{t(tk.pos, meta.km)}</span>
                    </span>
                  );
                })}
              </p>
              <CopyButton text={copyText} compact />
            </div>
          </div>

          {/* Legend + distribution */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Parts of speech in this text", "ថ្នាក់ពាក្យក្នុងអត្ថបទនេះ")}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {legendRows.map(([pos, count]) => {
                const meta = POS_META[pos];
                return (
                  <div key={pos} className="flex items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2">
                    <span style={{ backgroundColor: meta.color }} className="h-3 w-3 shrink-0 rounded-full" />
                    <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink)]">{t(pos, meta.km)}</span>
                    <span className="text-xs tabular-nums text-[var(--ink-faint)]">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] leading-5 text-[var(--ink-faint)]">
            {t(
              `Automated, dictionary-based analysis over ${KHMER_POS_COUNT} common Khmer words plus digit/Latin/punctuation rules. Words outside the lexicon are marked “Unknown” rather than guessed. Best on everyday sentences; verify before relying on it for teaching or research.`,
              `ការវិភាគស្វ័យប្រវត្តិផ្អែកលើវចនានុក្រមពាក្យខ្មែរធម្មតា ${KHMER_POS_COUNT} ពាក្យ បូកនឹងច្បាប់លេខ/ឡាតាំង/វណ្ណយុត្តិ។ ពាក្យក្រៅវចនានុក្រមត្រូវសម្គាល់ថា «មិនស្គាល់» ជំនួសឲ្យការទាយ។ ល្អបំផុតសម្រាប់ប្រយោគធម្មតា សូមផ្ទៀងផ្ទាត់មុនប្រើសម្រាប់ការបង្រៀន ឬការស្រាវជ្រាវ។`,
            )}
          </p>
        </>
      )}

      {/* Source & Credits */}
      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>
          {t(
            "Word segmentation by split-khmer (Seanghay Yath, MIT). Text normalisation and the base part-of-speech dictionary come from khmer-nlp-toolkit (github:vengmony, MIT). Additional parts of speech were derived from the offline Chuon Nath & Headley dictionary data bundled in this app. Built on the work of the Khmer open-source community.",
            "ការបំបែកពាក្យដោយ split-khmer (Seanghay Yath, MIT)។ ការធ្វើឲ្យអត្ថបទធម្មតា និងវចនានុក្រមថ្នាក់ពាក្យមូលដ្ឋានមកពី khmer-nlp-toolkit (github:vengmony, MIT)។ ថ្នាក់ពាក្យបន្ថែមបានមកពីទិន្នន័យវចនានុក្រមជួន ណាត និង Headley ដែលភ្ជាប់មកជាមួយកម្មវិធីនេះ។ ស្ថាបនាឡើងលើស្នាដៃរបស់សហគមន៍ប្រភពបើកចំហខ្មែរ។",
          )}
        </p>
      </section>
    </ToolShell>
  );
}
