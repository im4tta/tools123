"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, RefreshCw, Sparkles, Trash2, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/Output";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { STATIC_DATABASE } from "@/lib/khmer-lexicon-db";

interface AutoFixRule {
  wrong: string;
  correct: string;
  reason: string;
}

// Words that must never be split by the homophone scanner.
const SAFE_COMPOUND_WORDS = [
  "កាំបិត", "សិតសក់", "ស្លៀកពង់", "ស្លៀកពាក់", "ចិត្តល្អ", "ភាន់ច្រឡំ", "ដើរចេញ",
  "តម្លៃ", "ប៉ុន្តែ", "ឧស្សាហ៍", "ភាគី", "ផ្លែឈើ", "ដោយសារ", "ពីព្រោះ", "យ៉ាងណា",
  "ទូរទស្សន៍", "បទពិសោធន៍", "ព័ត៌មាន", "រង់ចាំ", "ឥឡូវ", "សិទ្ធិ", "សន្តិភាព",
  "ប្រៀបធៀប", "កេរ្តិ៍ឈ្មោះ", "ព្រះភ័ក្ត្រ", "ក្បាច់គុន", "អក្សរ", "ដប់យ័ន", "យន្តហោះ",
  "សាលាខេត្ត", "សុខភាព", "អត្តសញ្ញាណ", "សេរីភាព", "សម្បូរសប្បាយ", "សួរសុខទុក្ខ",
  "ទឹកចិត្ត", "ទឹកទន្លេ", "កំពង់ផែ", "កំពង់ចាម", "អង្គរវត្ត", "សេចក្តីសុខ", "ព្រះពុទ្ធ",
  "ថ្ងៃពុធ", "ថ្ងៃសុក្រ", "ទ្វារបិទ", "លាក់បាំង", "រង្វង់", "រាជធានី", "សព្វថ្ងៃ",
  "រាជវង្ស", "អាចម៍ផ្កាយ", "បិទផ្លូវ", "ទុក្ខព្រួយ", "មិត្តភក្តិ", "អត្ថន័យ",
  "កាតទូរស័ព្ទ", "កាត់សក់", "ថ្ងៃចន្ទ", "ថ្នាក់ខណ្ឌ", "ខណ្ឌរដ្ឋបាល",
  "ប្រជាជន", "រដ្ឋាភិបាល", "នយោបាយ", "សេដ្ឋកិច្ច", "វប្បធម៌", "ប្រវត្តិសាស្ត្រ", "អប់រំ",
  "សង្គម", "គ្រួសារ", "បច្ចេកវិទ្យា", "កុំព្យូទ័រ", "ទូរស័ព្ទ", "អ៊ិនធឺណិត", "អភិវឌ្ឍន៍",
  "ប្រកួតប្រជែង", "ទំនាក់ទំនង", "សហប្រតិបត្តិការ", "អន្តរជាតិ", "បរិស្ថាន", "ទេសចរណ៍",
  "សំណង់", "កសិកម្ម", "ឧស្សាហកម្ម", "សេវាកម្ម", "សុវត្ថិភាព", "យុត្តិធម៌", "តម្លាភាព",
  "គណនេយ្យភាព", "ប្រសិទ្ធភាព", "គុណភាព", "ចំណេះដឹង", "ជំនាញ", "បទពិសោធ", "ការងារ",
  "ប្រាក់ខែ", "ចំណូល", "ចំណាយ", "ថវិកា", "សន្សំ", "វិនិយោគ", "អាជីវកម្ម", "ក្រុមហ៊ុន",
  "អតិថិជន", "ផលិតផល", "ទីផ្សារ", "ការលក់", "ការទិញ", "ការដឹកជញ្ជូន", "ការផ្គត់ផ្គង់",
  "តម្រូវការ", "គុណសម្បត្តិ", "គុណវិបត្តិ", "ឱកាស", "បញ្ហា", "ដំណោះស្រាយ",
  "គម្រោង", "ផែនការ", "គោលដៅ", "លទ្ធផល", "ជោគជ័យ", "បរាជ័យ", "មោទនភាព", "ការខិតខំ",
  "ការព្យាយាម", "ការអត់ធ្មត់", "ការតស៊ូ", "ការលះបង់", "ការចូលរួម", "ការគាំទ្រ",
  "ការលើកទឹកចិត្ត", "ការសរសើរ", "ការរិះគន់", "ការវាយតម្លៃ", "ការស្រាវជ្រាវ", "ការសិក្សា",
  "ការរៀនសូត្រ", "ការបង្រៀន", "ការបណ្តុះបណ្តាល", "អំណោយផល", "ព្រៃឈើ", "សត្វព្រៃ",
  "ទឹកជំនន់", "គ្រោះរាំងស្ងួត", "ការប្រែប្រួលអាកាសធាតុ", "ការបំពុលបរិស្ថាន", "ការការពារ",
  "ការអភិរក្ស", "ការស្តារនីតិសម្បទា", "គណៈកម្មការ", "គណបក្ស",
];

const AUTO_FIX_RULES: AutoFixRule[] = [
  { wrong: "កំពង់ញ៉ាំ", correct: "កំពុងញ៉ាំ", reason: "កំពុង (កិរិយាសព្ទបន្ត)" },
  { wrong: "កំពង់ដើរ", correct: "កំពុងដើរ", reason: "កំពុង (កិរិយាសព្ទបន្ត)" },
  { wrong: "កំពង់ធ្វើ", correct: "កំពុងធ្វើ", reason: "កំពុង (កិរិយាសព្ទបន្ត)" },
  { wrong: "កំពុងផែ", correct: "កំពង់ផែ", reason: "កំពង់ (ទីកន្លែង)" },
  { wrong: "ចិត្តផ្លែឈើ", correct: "ចិតផ្លែឈើ", reason: "ចិត (កាត់សំបក)" },
  { wrong: "អង្ករវត្ត", correct: "អង្គរវត្ត", reason: "អង្គរ (ទីក្រុងបុរាណ)" },
  { wrong: "ថ្ងៃសុខ", correct: "ថ្ងៃសុក្រ", reason: "សុក្រ (ថ្ងៃទី៦)" },
  { wrong: "សេចក្តីសុក្រ", correct: "សេចក្តីសុខ", reason: "សុខ (សេចក្តីសុខ)" },
  { wrong: "ថ្ងៃពុទ្ធ", correct: "ថ្ងៃពុធ", reason: "ពុធ (ថ្ងៃ)" },
  { wrong: "ថ្ងៃពុត", correct: "ថ្ងៃពុធ", reason: "ពុធ (ថ្ងៃ)" },
  { wrong: "ព្រះពុធ", correct: "ព្រះពុទ្ធ", reason: "ពុទ្ធ (ព្រះត្រាស់ដឹង)" },
  { wrong: "ព្រះពុត", correct: "ព្រះពុទ្ធ", reason: "ពុទ្ធ (ព្រះត្រាស់ដឹង)" },
  { wrong: "ញាំបាយ", correct: "ញ៉ាំបាយ", reason: "ញ៉ាំ (បរិភោគ)" },
  { wrong: "ញាំអី", correct: "ញ៉ាំអី", reason: "ញ៉ាំ (បរិភោគ)" },
  { wrong: "អាចម៍ធ្វើបាន", correct: "អាចធ្វើបាន", reason: "អាច (មានលទ្ធភាព)" },
  { wrong: "ទុក្ខលុយ", correct: "ទុកលុយ", reason: "ទុក (រក្សា)" },
  { wrong: "ទ្វារបិត", correct: "ទ្វារបិទ", reason: "បិទ (ខ្ទប់)" },
  { wrong: "សំគាល់", correct: "សម្គាល់", reason: "សម្គាល់ (ការកត់ចំណាំ)" },
  { wrong: "កំសាន្ត", correct: "កម្សាន្ត", reason: "កម្សាន្ត (ការលេងសប្បាយ)" },
  { wrong: "សំពោធ", correct: "សម្ពោធ", reason: "សម្ពោធ (បើកឲ្យប្រើប្រាស់)" },
  { wrong: "អគុណ", correct: "អរគុណ", reason: "អរគុណ (ការដឹងគុណ)" },
  { wrong: "ឪកាស", correct: "ឱកាស", reason: "ឱកាស (ពេលវេលា ឬកាលៈទេសៈល្អ)" },
  { wrong: "តំណើរ", correct: "ដំណើរ", reason: "ដំណើរ (ការដើរ, ការទៅ)" },
  { wrong: "ចំងាយ", correct: "ចម្ងាយ", reason: "ចម្ងាយ (ប្រវែងពីកន្លែងមួយទៅកន្លែងមួយ)" },
  { wrong: "ចំនុច", correct: "ចំណុច", reason: "ចំណុច (ទីកន្លែង, គោល)" },
  { wrong: "ជំរាបសួរ", correct: "ជម្រាបសួរ", reason: "ជម្រាបសួរ (ការសំពះសួរទុក្ខ)" },
  { wrong: "អោយ", correct: "ឱ្យ", reason: "ឱ្យ (ផ្តល់, យល់ព្រមតាមវចនានុក្រមជួន ណាត)" },
  { wrong: "សោរ", correct: "សោ", reason: "សោ (ប្រដាប់សម្រាប់ចាក់បិទ មិនមាន រ ទេ)" },
  { wrong: "ពត៌មាន", correct: "ព័ត៌មាន", reason: "ព័ត៌មាន (ដំណឹងផ្សេងៗ)" },
  { wrong: "ម៉ត់ចត់", correct: "ហ្មត់ចត់", reason: "ហ្មត់ចត់ (ល្អិតល្អន់, ត្រឹមត្រូវ)" },
  { wrong: "ប្រត្តិបត្តិ", correct: "ប្រតិបត្តិ", reason: "ប្រតិបត្តិ (ការធ្វើតាម)" },
];

const SAMPLES = [
  { name: "Extended Homophones (Original)", text: "ថ្ងៃនេះជាថ្ងៃពុទ្ធ។ គាត់បានទៅទស្សនាអង្ករវត្ត។ សូមឲ្យមានសេចក្តីសុក្រ។ គាត់ចូលចិត្តញាំបាយនៅទីនេះ។ យើងមិនអាចម៍ធ្វើបែបនេះទេ ព្រោះទ្វារបិតហើយ។" },
  { name: "Common Spelling Mistakes (New Fixes)", text: "សូស្តី! សូម អោយ ខ្ញុំ ជំរាបសួរ។ គាត់មាន ឪកាស ល្អ ក្នុង តំណើរ កំសាន្ត នេះ។ ចំនុច នេះ សំខាន់ ណាស់ សម្រាប់ ពត៌មាន ទូទៅ។ សូម អគុណ ដែលបាន សំគាល់ កំហុសនេះ។" },
  { name: "Interactive Confusion (New Dictionaries)", text: "រដ្ឋាភិបាល មាន គណៈ កម្មការ និង គណ បក្ស ជាច្រើន។ គាត់ ដុស សក់ ព្រោះសក់ ដុះ វែង។ គាត់មាន ទូរ ដាក់សំលៀកបំពាក់ក្បែរ ទូ ទស្សន៍។ ក្មេងៗលេងទឹក ស្រៈ និងរៀន ស្រះ ភាសាខ្មែរ។ ចាក់ សោរ ទ្វារហើយ។" },
  { name: "Business & Formal Text", text: "សូម អាន ព័ត៌មាន នេះ។ គាត់ មាន សិទ្ធិ ពេញលេញ ក្នុង ការ សម្រេចចិត្ត។ ក្រុមហ៊ុន បាន ព័ទ្ធ របង ជុំវិញ ដី។ គាត់ វ៉ៃ តម្លៃ ខ្ពស់ ណាស់។ សូម រង់ចាំ បន្តិច។" },
];

interface SegmentToken {
  id: string;
  original: string;
  current: string;
  kind: "auto" | "homophone";
  reason?: string;
  choices: { word: string; definition: string }[];
}

interface DiffPiece {
  text: string;
  token?: SegmentToken;
}

// Build a lookup of homophone entries once: any word that belongs to a group with >1 member.
const HOMOPHONE_MAP = new Map<string, { word: string; definition: string; homophones: { word: string; definition: string }[] }>();
for (const key of Object.keys(STATIC_DATABASE)) {
  const entry = STATIC_DATABASE[key];
  const homophones = entry.homophones ?? [];
  if (homophones.length > 1) {
    HOMOPHONE_MAP.set(key, { word: entry.word, definition: entry.definition, homophones: homophones.map((h) => ({ word: h.word, definition: h.definition })) });
    for (const h of homophones) {
      if (!HOMOPHONE_MAP.has(h.word)) {
        HOMOPHONE_MAP.set(h.word, { word: h.word, definition: h.definition, homophones: homophones.map((x) => ({ word: x.word, definition: x.definition })) });
      }
    }
  }
}

function supportsSegmenter() {
  return typeof Intl !== "undefined" && "Segmenter" in Intl;
}

export default function KhmerHomophoneCorrector() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khc:input", SAMPLES[0].text);
  const [sampleIndex, setSampleIndex] = useToolState("khc:sample", 0);
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [pieces, setPieces] = useState<DiffPiece[]>([]);
  const [openToken, setOpenToken] = useState<SegmentToken | null>(null);
  const [copied, setCopied] = useState(false);
  const nextId = useRef(0);

  const finalText = useMemo(() => pieces.map((p) => (p.token ? p.token.current : p.text)).join(""), [pieces]);
  const matchCount = useMemo(() => pieces.filter((p) => p.token).length, [pieces]);

  function analyze(text: string) {
    if (!text.trim()) return;
    setAnalyzing(true);
    setOpenToken(null);
    // Let the UI show the loading state.
    window.setTimeout(() => {
      nextId.current = 0;
      const newPieces: DiffPiece[] = [];
      let chunks: (string | { type: "auto"; rule: AutoFixRule } | { type: "safe"; word: string })[] = [text];

      // 1. Auto-fix rules.
      for (const rule of AUTO_FIX_RULES) {
        const nextChunks: (string | { type: "auto"; rule: AutoFixRule } | { type: "safe"; word: string })[] = [];
        for (const chunk of chunks) {
          if (typeof chunk === "string") {
            const parts = chunk.split(rule.wrong);
            for (let i = 0; i < parts.length; i++) {
              if (parts[i]) nextChunks.push(parts[i]);
              if (i < parts.length - 1) nextChunks.push({ type: "auto", rule });
            }
          } else {
            nextChunks.push(chunk);
          }
        }
        chunks = nextChunks;
      }

      // 2. Protect safe compound words.
      for (const word of SAFE_COMPOUND_WORDS) {
        const nextChunks: (string | { type: "auto"; rule: AutoFixRule } | { type: "safe"; word: string })[] = [];
        for (const chunk of chunks) {
          if (typeof chunk === "string") {
            const parts = chunk.split(word);
            for (let i = 0; i < parts.length; i++) {
              if (parts[i]) nextChunks.push(parts[i]);
              if (i < parts.length - 1) nextChunks.push({ type: "safe", word });
            }
          } else {
            nextChunks.push(chunk);
          }
        }
        chunks = nextChunks;
      }

      // 3. Segment the remaining plain strings and flag homophones.
      const segmenter = supportsSegmenter() ? new Intl.Segmenter("km-KH", { granularity: "word" }) : null;
      for (const chunk of chunks) {
        if (typeof chunk === "object") {
          if (chunk.type === "auto") {
            const token: SegmentToken = { id: `t${nextId.current++}`, original: chunk.rule.wrong, current: chunk.rule.correct, kind: "auto", reason: chunk.rule.reason, choices: [] };
            newPieces.push({ text: "", token });
          } else {
            newPieces.push({ text: chunk.word });
          }
          continue;
        }
        if (!segmenter) {
          newPieces.push({ text: chunk });
          continue;
        }
        for (const seg of segmenter.segment(chunk)) {
          const word = seg.segment;
          if (seg.isWordLike && HOMOPHONE_MAP.has(word)) {
            const entry = HOMOPHONE_MAP.get(word)!;
            const token: SegmentToken = { id: `t${nextId.current++}`, original: word, current: word, kind: "homophone", choices: entry.homophones };
            newPieces.push({ text: "", token });
          } else {
            newPieces.push({ text: word });
          }
        }
      }

      setPieces(newPieces);
      setAnalyzed(true);
      setAnalyzing(false);
    }, 450);
  }

  function chooseWord(tokenId: string, word: string) {
    setPieces((prev) => prev.map((piece) => piece.token?.id === tokenId ? { text: "", token: { ...piece.token, current: word } } : piece));
    setOpenToken(null);
  }

  function loadSample() {
    const next = (sampleIndex + 1) % SAMPLES.length;
    setSampleIndex(next);
    setInput(SAMPLES[next].text);
    setAnalyzed(false);
    setPieces([]);
    setOpenToken(null);
  }

  function clearAll() {
    setInput("");
    setAnalyzed(false);
    setPieces([]);
    setOpenToken(null);
  }

  async function copyResult() {
    if (!finalText) return;
    try {
      await navigator.clipboard.writeText(finalText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenToken(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const actionClass = "inline-flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:bg-[var(--ground-raised-hi)] hover:text-[var(--ink)]";

  return (
    <ToolShell
      title="Khmer Homophone Corrector"
      khmerTitle="អក្ខរាវិរុទ្ធ និងសទិសសូរ"
      description="Paste Khmer text to detect homophone conflicts and common spelling mistakes. Auto-fixes common errors, flags words with homophone alternatives, and lets you pick the correct word with one tap."
      descriptionKm="បិទភ្ជាប់អត្ថបទខ្មែរដើម្បីរកសទិសសូរ និងកំហុសអក្ខរាវិរុទ្ធ។ កែដោយស្វ័យប្រវត្តិនូវកំហុសទូទៅ សម្គាល់ពាក្យដែលមានសទិសសូរ និងអនុញ្ញាតឲ្យអ្នកជ្រើសរើសពាក្យត្រឹមត្រូវដោយចុចម្តង។"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Input */}
        <div className="flex flex-col rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)]/40">
          <div className="flex items-center justify-between border-b border-[var(--ground-line)] px-4 py-3">
            <span className="text-sm font-semibold text-[var(--ink)]">{t("Original Text", "អត្ថបទដើម")}</span>
            <div className="flex gap-2">
              <button type="button" className={actionClass} onClick={loadSample}><RefreshCw size={13} />{t("Load Test Case", "ផ្ទុកគំរូ")}</button>
              <button type="button" className={`${actionClass} !text-[var(--danger)]`} onClick={clearAll}><Trash2 size={13} />{t("Clear", "សម្អាត")}</button>
            </div>
          </div>
          <Field label="" labelKm="">
            <TextArea rows={9} value={input} onChange={(e) => setInput(e.target.value)} className="font-khmer rounded-none border-0 !bg-transparent text-base leading-loose" placeholder={t("Paste your Khmer text here…", "បិទភ្ជាប់អត្ថបទខ្មែរនៅទីនេះ…")} />
          </Field>
          <div className="border-t border-[var(--ground-line)] p-3">
            <Button type="button" onClick={() => analyze(input)} disabled={analyzing || !input.trim()} className="w-full">
              <Sparkles size={16} /> {t(analyzing ? "Analyzing…" : "Smart Analyze Text", analyzing ? "កំពុងវិភាគ…" : "វិភាគអត្ថបទឆ្លាតវៃ")}
            </Button>
          </div>
        </div>

        {/* Output */}
        <div className="flex flex-col gap-4">
          {!analyzed && !analyzing && (
            <div className="flex min-h-[16rem] flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--ground-line)] p-8 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ground-raised)] text-[var(--ink-faint)]"><Sparkles size={26} /></div>
              <h3 className="mb-1 font-semibold text-[var(--ink)]">{t("Result will appear here", "លទ្ធផលនឹងបង្ហាញទីនេះ")}</h3>
              <p className="max-w-sm text-sm text-[var(--ink-dim)]">{t("Click the analyze button to run the contextual homophone engine.", "ចុចប៊ូតុងវិភាគដើម្បីដំណើរការម៉ាស៊ីនសទិសសូរតាមបរិបទ។")}</p>
            </div>
          )}
          {analyzing && (
            <div className="flex min-h-[16rem] flex-1 flex-col items-center justify-center rounded-xl bg-[var(--ground-raised)]/40 p-8 text-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--ground-line)] border-t-[var(--gold)]" />
              <p className="font-medium text-[var(--gold)]">{t("Analyzing text…", "កំពុងវិភាគអត្ថបទ…")}</p>
            </div>
          )}
          {analyzed && !analyzing && (
            <>
              <div className="flex flex-col rounded-xl border border-[var(--gold-dim)]/30 bg-[var(--ground-raised)]/40">
                <div className="flex items-center justify-between border-b border-[var(--ground-line)] px-4 py-2.5">
                  <span className="text-xs font-semibold text-[var(--gold)]">{t("Interactive Analysis", "ការវិភាគអន្តរកម្ម")}</span>
                  <span className="rounded-full bg-[var(--gold)]/15 px-2.5 py-0.5 text-xs font-bold text-[var(--gold)]">{t(`${matchCount} item(s)`, `${matchCount} ធាតុ`)}</span>
                </div>
                <div className="max-h-72 overflow-y-auto p-4 font-khmer text-lg leading-loose text-[var(--ink)]">
                  {pieces.map((piece, i) =>
                    piece.token ? (
                      <button
                        key={`${piece.token.id}-${i}`}
                        type="button"
                        onClick={() => { if (piece.token) setOpenToken(piece.token); }}
                        title={piece.token.kind === "auto" ? `${piece.token.original} → ${piece.token.current}` : t("Click to choose a word", "ចុចដើម្បីជ្រើសរើសពាក្យ")}
                        className={
                          piece.token.kind === "auto"
                            ? "mx-0.5 cursor-pointer rounded border-b-2 border-[var(--slate-accent)] bg-[var(--slate-accent)]/15 px-1 font-semibold text-[var(--slate-accent)] hover:bg-[var(--slate-accent)]/25"
                            : piece.token.current !== piece.token.original
                              ? "mx-0.5 cursor-pointer rounded border-b-2 border-[var(--success)] bg-[var(--success)]/10 px-1 font-semibold text-[var(--success)] hover:bg-[var(--success)]/20"
                              : "mx-0.5 cursor-pointer rounded border-b-2 border-dashed border-[var(--gold)] bg-[var(--gold)]/10 px-1 font-semibold text-[var(--gold)] hover:bg-[var(--gold)]/20"
                        }
                      >
                        {piece.token.current}
                      </button>
                    ) : (
                      <span key={i}>{piece.text}</span>
                    )
                  )}
                </div>
                <div className="flex gap-4 border-t border-[var(--ground-line)] px-4 py-2 text-[10px] text-[var(--ink-faint)]">
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded border border-[var(--gold)] bg-[var(--gold)]/20" />{t("Needs Review", "ត្រូវពិនិត្យ")}</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded border border-[var(--success)] bg-[var(--success)]/20" />{t("User Fixed", "អ្នកកែ")}</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded border border-[var(--slate-accent)] bg-[var(--slate-accent)]/20" />{t("Auto-Fixed", "កែដោយស្វ័យប្រវត្តិ")}</span>
                </div>
              </div>

              <div className="flex flex-col rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)]/40">
                <div className="flex items-center justify-between border-b border-[var(--ground-line)] px-4 py-2.5">
                  <span className="text-xs font-semibold text-[var(--success)]">{t("Final Corrected Text", "អត្ថបទដែលបានកែ")}</span>
                  <button type="button" className={actionClass} onClick={() => void copyResult()}>
                    {copied ? <Check size={13} className="text-[var(--success)]" /> : <Copy size={13} />}
                    {t(copied ? "Copied!" : "Copy", copied ? "បានចម្លង!" : "ចម្លង")}
                  </button>
                </div>
                <Field label="" labelKm="">
                  <TextArea rows={5} value={finalText} readOnly className="font-khmer rounded-none border-0 !bg-transparent text-base leading-loose" />
                </Field>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Homophone picker modal */}
      {openToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpenToken(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] shadow-[var(--shadow-elev)]">
            <div className="flex items-center justify-between border-b border-[var(--ground-line)] px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-faint)]">{t("Select Correct Word", "ជ្រើសរើសពាក្យត្រឹមត្រូវ")}</span>
              <button type="button" onClick={() => setOpenToken(null)} className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ground-line)] text-[var(--ink-faint)] hover:text-[var(--ink)]"><X size={13} /></button>
            </div>
            <div className="max-h-[20rem] space-y-2 overflow-y-auto p-3">
              {openToken.kind === "auto" && (
                <div className="rounded-lg border border-[var(--slate-accent)]/30 bg-[var(--slate-accent)]/10 p-3">
                  <p className="mb-1 text-sm font-bold text-[var(--slate-accent)]">{t("Auto-Fix Applied", "ការកែដោយស្វ័យប្រវត្តិ")}</p>
                  <p className="text-sm text-[var(--ink)]"><s className="text-[var(--danger)]">{openToken.original}</s> → <strong className="text-[var(--success)]">{openToken.current}</strong></p>
                  {openToken.reason && <p className="mt-2 text-xs italic text-[var(--ink-dim)]">{t("Reason", "ហេតុផល")}: {openToken.reason}</p>}
                </div>
              )}
              {openToken.kind === "homophone" && (
                <>
                  <p className="px-1 text-xs text-[var(--ink-dim)]">{t("Choose the correct spelling for", "ជ្រើសរើសអក្ខរាវិរុទ្ធត្រឹមត្រូវសម្រាប់")} <strong className="font-khmer text-[var(--ink)]">{openToken.original}</strong></p>
                  {openToken.choices.map((choice, i) => {
                    const selected = choice.word === openToken.current;
                    return (
                      <button key={i} type="button" onClick={() => chooseWord(openToken.id, choice.word)} className={`flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition ${selected ? "border-[var(--gold)] bg-[var(--gold)]/10" : "border-[var(--ground-line)] bg-[var(--ground)] hover:bg-[var(--ground-raised-hi)]"}`}>
                        <span className="flex items-center justify-between font-khmer text-lg font-bold text-[var(--ink)]">
                          {choice.word}
                          {selected && <Check size={16} className="text-[var(--gold)]" />}
                        </span>
                        <span className="text-xs leading-relaxed text-[var(--ink-dim)]">{choice.definition}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
