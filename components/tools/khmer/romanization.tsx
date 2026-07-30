"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileJson, FileSpreadsheet, Globe, Keyboard, BookOpen, Search, Volume2, Trash2, ChevronDown } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { useClipboard } from "@/components/ClipboardProvider";
import { useToolState } from "@/lib/storage";
import {
  KHMER_CONSONANTS, KHMER_VOWELS, KHMER_SUBSCRIPTS, KHMER_INDEPENDENT_VOWELS,
  KHMER_DIACRITICS, EXCEPTION_DICT, REVERSE_LOOKUP,
  segmentSyllables, romanizeSyllable, romanizeFull,
  isKhmerChar, RomanStyle, STYLE_LABELS,
} from "@/lib/data/khmer-romanization";

const STYLES: RomanStyle[] = ["phonetic", "ungegn", "linguistic", "unicode", "pinyin", "business"];

type Tab = "workspace" | "reference" | "inspector";

const QUIZ_BANK = [
  { khmer: "កម្ពុជា", choices: ["Kampuchea", "Cambodia", "Sihanouk", "Siem Reap"], correct: "Kampuchea", hint: "UNGEGN name of Cambodia" },
  { khmer: "ខ្មែរ", choices: ["Khmer", "Khmae", "Khmey", "Kham"], correct: "Khmae", hint: "UNGEGN for Khmer" },
  { khmer: "ភ្នំពេញ", choices: ["Phnom Penh", "Phnum Penh", "Sihanoukville", "Battambang"], correct: "Phnum Penh", hint: "UNGEGN for the capital" },
  { khmer: "សៀមរាប", choices: ["Siem Reab", "Siem Reap", "Sihanouk", "Kep"], correct: "Siem Reab", hint: "Home of Angkor Wat" },
  { khmer: "សួស្ដី", choices: ["Suostei", "Sousdei", "Sua Sdei", "Sostey"], correct: "Suostei", hint: "Hello in Khmer" },
  { khmer: "អរគុណ", choices: ["Arkun", "Orkun", "Arakun", "Aun"], correct: "Arkun", hint: "Thank you" },
  { khmer: "សប្បាយ", choices: ["Sabbay", "Sabaay", "Sabay", "Sabai"], correct: "Sabbay", hint: "Happy or fun" },
];

function toast(msg: string) {
  const el = document.createElement("div");
  el.className = "fixed bottom-5 right-5 z-[100] rounded-xl border border-[var(--gold-dim)]/30 bg-[var(--ground-raised)] px-4 py-3 text-xs text-[var(--gold)] shadow-elev shadow-lg animate-[fade-rise_0.22s_ease_both]";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity 0.3s"; setTimeout(() => el.remove(), 300); }, 2500);
}

export default function Romanization() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("romanization:input", "សួស្ដី កម្ពុជា");
  const [style, setStyle] = useToolState<RomanStyle>("romanization:style", "phonetic");
  const [tab, setTab] = useState<Tab>("workspace");
  const [revInput, setRevInput] = useState("");
  const [kbOpen, setKbOpen] = useState(false);
  const [kbCat, setKbCat] = useState("consonants");
  const [refCat, setRefCat] = useState("consonants");
  const [inspectChar, setInspectChar] = useState("ក");
  const [history, setHistory] = useState<{ input: string; output: string; style: RomanStyle }[]>([]);
  const [quizScreen, setQuizScreen] = useState<"lobby" | "game" | "results">("lobby");
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStreak, setQuizStreak] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<typeof QUIZ_BANK>([]);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { copyText } = useClipboard();

  const output = useMemo(() => romanizeFull(input, style), [input, style]);

  const syllables = useMemo(() => {
    if (!input.trim()) return [];
    return segmentSyllables(input).filter((s) => isKhmerChar(s[0]));
  }, [input]);

  useEffect(() => {
    if (!input.trim() || !output) return;
    setHistory((prev) => {
      if (prev[0]?.input === input) return prev;
      const next = [{ input, output, style }, ...prev].slice(0, 10);
      return next;
    });
  }, [input, output, style]);

  function handleCopy() {
    copyText(output);
    setCopied(true);
    toast(t("Copied output", "បានចម្លងលទ្ធផល"));
    setTimeout(() => setCopied(false), 1500);
  }

  function exportJSON() {
    if (!input.trim()) return;
    const data = { sourceText: input, romanizedText: output, style, charCount: input.length };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "khmer-romanization.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    if (!input.trim()) return;
    const csv = `Khmer,Romanized,Style\n"${input.replace(/"/g, '""')}","${output.replace(/"/g, '""')}","${style}"`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "khmer-romanization.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function speak() {
    if (!input.trim() || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(input);
    const v = speechSynthesis.getVoices().find((v2) => v2.lang.includes("km"));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }

  const revResult = useMemo(() => {
    const q = revInput.trim().toLowerCase();
    return REVERSE_LOOKUP[q] || "";
  }, [revInput]);

  function loadExample(text: string) {
    setInput(text);
    inputRef.current?.focus();
  }

  function startQuiz() {
    const qs = [...QUIZ_BANK].sort(() => Math.random() - 0.5).slice(0, 5);
    setQuizQuestions(qs);
    setQuizIdx(0);
    setQuizScore(0);
    setQuizStreak(0);
    setQuizAnswered(false);
    setQuizScreen("game");
  }

  function submitQuiz(selected: string) {
    if (quizAnswered || !quizQuestions[quizIdx]) return;
    setQuizAnswered(true);
    const q = quizQuestions[quizIdx];
    if (selected === q.correct) {
      setQuizScore((s) => s + 10);
      setQuizStreak((s) => s + 1);
    } else {
      setQuizStreak(0);
    }
  }

  function nextQuiz() {
    if (quizIdx >= 4) { setQuizScreen("results"); return; }
    setQuizIdx((i) => i + 1);
    setQuizAnswered(false);
  }

  function insertChar(char: string) {
    const pos = inputRef.current?.selectionStart ?? input.length;
    setInput(input.slice(0, pos) + char + input.slice(pos));
  }

  const activeChar = useMemo(() => {
    const c = inspectChar.trim() || "ក";
    return KHMER_CONSONANTS[c] || KHMER_VOWELS[c] || KHMER_SUBSCRIPTS[c] || KHMER_INDEPENDENT_VOWELS[c] || KHMER_DIACRITICS[c] || null;
  }, [inspectChar]);

  const kbKeys = useMemo(() => {
    const maps: Record<string, Record<string, unknown>> = {
      consonants: KHMER_CONSONANTS, vowels: KHMER_VOWELS, diacritics: KHMER_DIACRITICS,
      subscripts: KHMER_SUBSCRIPTS, independents: KHMER_INDEPENDENT_VOWELS,
    };
    return Object.keys(maps[kbCat] || {});
  }, [kbCat]);

  return (
    <ToolShell title="Khmer Romanization Suite" khmerTitle="កម្មវិធីសរសេរជាអក្សរឡាតាំង" description="6 romanization paradigms with syllable decomposition, reverse lookup, reference tables, and character inspector.">
      {/* Tab bar */}
      <div className="mb-5 flex flex-wrap gap-1.5 border-b border-[var(--ground-line)] pb-3">
        {(["workspace", "reference", "inspector"] as const).map((tabName) => (
          <button key={tabName} onClick={() => setTab(tabName)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${tab === tabName ? "bg-[var(--gold)] text-[#0a0c0d]" : "text-[var(--ink-dim)] hover:text-[var(--ink)]"}`}>
            {tabName === "workspace" && <Globe size={12} />}{tabName === "reference" && <BookOpen size={12} />}{tabName === "inspector" && <Search size={12} />}
            {tabName === "workspace" ? t("Workspace", "កន្លែងធ្វើការ") : tabName === "reference" ? t("Reference", "តារាង") : t("Inspector", "ពិនិត្យតួអក្សរ")}
          </button>
        ))}
      </div>

      {tab === "workspace" && (
        <div className="space-y-5">
          {/* Style selector */}
          <div className="flex flex-wrap gap-1.5">
            {STYLES.map((s) => (
              <button key={s} onClick={() => setStyle(s)} className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${style === s ? "border border-[var(--gold-dim)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border border-[var(--ground-line)] text-[var(--ink-dim)] hover:text-[var(--ink)]"}`}>
                {STYLE_LABELS[s]}
              </button>
            ))}
          </div>

          {/* Input & Output */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label={t("Khmer input", "អត្ថបទខ្មែរ")} hint={`${input.length} ${t("characters", "តួអក្សរ")}`}>
              <div className="relative">
                <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} rows={5} className="w-full resize-none rounded-md border border-[var(--ground-line)] bg-[var(--ground)] p-3 font-khmer text-lg text-[var(--ink)] outline-none transition focus:border-[var(--gold-dim)] placeholder:text-[var(--ink-faint)]" placeholder="បញ្ចូលអត្ថបទខ្មែរ..." />
                <div className="absolute right-2 top-2 flex gap-1">
                  <button onClick={speak} className="rounded p-1 text-[var(--ink-faint)] transition hover:text-[var(--gold)]" title={t("Speak", "បញ្ចេញសំឡេង")}><Volume2 size={14} /></button>
                  <button onClick={() => setInput("")} className="rounded p-1 text-[var(--ink-faint)] transition hover:text-[var(--danger)]" title={t("Clear", "សម្អាត")}><Trash2 size={14} /></button>
                </div>
              </div>
            </Field>

            <Field label={t("Romanized output", "លទ្ធផលឡាតាំង")}>
              <div className="relative rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
                <div className="min-h-[5rem] whitespace-pre-wrap break-all text-lg font-semibold leading-relaxed tracking-wide text-[var(--ink)]">{output || <span className="text-[var(--ink-faint)] italic text-sm">…</span>}</div>
                {output && (
                  <div className="absolute right-2 top-2 flex gap-1">
                    <CopyButton text={output} compact className="border-0 bg-transparent" />
                    <button onClick={exportJSON} className="rounded p-1 text-[var(--ink-faint)] transition hover:text-[var(--gold)]" title="Export JSON"><FileJson size={13} /></button>
                    <button onClick={exportCSV} className="rounded p-1 text-[var(--ink-faint)] transition hover:text-[var(--gold)]" title="Export CSV"><FileSpreadsheet size={13} /></button>
                  </div>
                )}
                <div className="mt-2 border-t border-[var(--ground-line)] pt-2 text-[10px] text-[var(--ink-faint)]">
                  {t("Style", "របៀប")}: <span className="font-semibold text-[var(--gold)]">{STYLE_LABELS[style]}</span>
                </div>
              </div>
            </Field>
          </div>

          {/* Sample buttons */}
          <div className="flex flex-wrap gap-1.5">
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">{t("Try", "សាកល្បង")}:</span>
            {["ភាសាខ្មែរ", "ភ្នំពេញ", "អង្គរវត្ត", "សួស្ដីឆ្នាំថ្មី", "សៀមរាប"].map((ex) => (
              <button key={ex} onClick={() => loadExample(ex)} className="rounded-md border border-[var(--ground-line)] px-2 py-1 text-xs font-khmer text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)]">{ex}</button>
            ))}
          </div>

          {/* Virtual keyboard toggle */}
          <div className="rounded-md border border-[var(--ground-line)]">
            <button onClick={() => setKbOpen(!kbOpen)} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--ink-dim)] transition hover:text-[var(--gold)]">
              <Keyboard size={13} />{kbOpen ? t("Hide keyboard", "លាក់ក្តារចុច") : t("Show keyboard", "បង្ហាញក្តារចុច")}<ChevronDown size={12} className={`ml-auto transition ${kbOpen ? "rotate-180" : ""}`} />
            </button>
            {kbOpen && (
              <div className="border-t border-[var(--ground-line)] p-3">
                <div className="mb-2 flex flex-wrap gap-1">
                  {["consonants", "vowels", "subscripts", "independents", "diacritics"].map((cat) => (
                    <button key={cat} onClick={() => setKbCat(cat)} className={`rounded px-2 py-0.5 text-[10px] font-semibold transition ${kbCat === cat ? "bg-[var(--gold)] text-[#0a0c0d]" : "bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:text-[var(--ink)]"}`}>
                      {t(cat, cat)}
                    </button>
                  ))}
                </div>
                <div className="flex max-h-40 flex-wrap gap-1 overflow-y-auto">
                  {kbKeys.map((key) => (
                    <button key={key} onClick={() => insertChar(key)} className="flex flex-col items-center rounded border border-[var(--ground-line)] bg-[var(--ground)] px-2 py-1 font-khmer text-lg text-[var(--ink)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)]">
                      <span>{key}</span>
                      <span className="text-[8px] font-mono uppercase text-[var(--ink-faint)]">
                        {(KHMER_CONSONANTS[key]?.roman || KHMER_VOWELS[key]?.s1 || KHMER_SUBSCRIPTS[key]?.roman || "")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Syllable breakdown */}
          <div className="rounded-md border border-[var(--ground-line)]">
            <div className="border-b border-[var(--ground-line)] px-3 py-2 text-xs font-semibold text-[var(--ink-dim)]">
              {t("Syllable breakdown", "ការបំបែកព្យាង្គ")} ({syllables.length})
            </div>
            <div className="max-h-60 space-y-1.5 overflow-y-auto p-3">
              {syllables.length === 0 && <p className="py-4 text-center text-xs italic text-[var(--ink-faint)]">{t("No Khmer syllables detected", "រកមិនឃើញព្យាង្គខ្មែរ")}</p>}
              {syllables.map((syl, i) => {
                let base = "", sub = "", vowel = "", diac: string[] = [];
                for (let j = 0; j < syl.length; j++) {
                  const c = syl[j];
                  if (c === "\u17D2" && j + 1 < syl.length) { sub = syl[j + 1]; j++; }
                  else if (c in KHMER_CONSONANTS && !base) base = c;
                  else if (c in KHMER_CONSONANTS) sub = c;
                  else if (c in KHMER_VOWELS) vowel = c;
                  else if (c in KHMER_DIACRITICS) diac.push(c);
                }
                const cd = KHMER_CONSONANTS[base];
                return (
                  <div key={i} className="flex items-start gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground)] font-khmer text-lg text-[var(--gold)]">{syl}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="font-semibold text-[var(--ink)]">{t("Syllable", "ព្យាង្គ")} {i + 1}</span>
                        {cd && <span className="rounded bg-[var(--ground-line)] px-1 text-[9px] text-[var(--ink-faint)]">{t("Series", "ស៊េរី")} {cd.series}</span>}
                      </div>
                      <div className="mt-0.5 text-[10px] text-[var(--ink-dim)]">
                        {base && <span>{t("Base", "តួ")}: {base} ({cd?.name || "?"}){sub ? ` + ${t("Sub", "ជើង")}: ${sub}` : ""}{vowel ? ` + ${t("Vowel", "ស្រៈ")}: ${vowel}` : ""}{diac.length ? ` + ${diac.join("")}` : ""}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-[11px]">
                      <div className="text-[var(--ink-faint)]">UNGEGN</div>
                      <div className="font-semibold text-[var(--ink)]">{romanizeSyllable(syl, "ungegn")}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reverse romanization */}
          <div className="rounded-md border border-[var(--ground-line)] p-3">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-dim)]">
              <Globe size={12} className="text-[var(--teal)]" />{t("Reverse: Latin to Khmer", "បំប្លែងត្រឡប់៖ ឡាតាំងទៅខ្មែរ")}
            </h3>
            <input value={revInput} onChange={(e) => setRevInput(e.target.value)} placeholder={t("Type romanized text...", "វាយអត្ថបទឡាតាំង...")} className="mb-2 w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--teal)] placeholder:text-[var(--ink-faint)]" />
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <div className="font-khmer text-2xl font-bold text-[var(--teal)]">{revResult || <span className="text-sm font-normal italic text-[var(--ink-faint)]">—</span>}</div>
            </div>
          </div>

          {/* Quiz */}
          <div className="rounded-md border border-[var(--ground-line)] p-3">
            {quizScreen === "lobby" && (
              <div className="py-4 text-center">
                <p className="mb-3 text-xs text-[var(--ink-dim)]">{t("Test your Khmer romanization skills", "សាកល្បងជំនាញសរសេរឡាតាំងរបស់អ្នក")}</p>
                <button onClick={startQuiz} className="rounded-md bg-[var(--gold)] px-4 py-2 text-xs font-bold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]">{t("Start Quiz", "ចាប់ផ្តើមសំណួរ")}</button>
              </div>
            )}
            {quizScreen === "game" && quizQuestions[quizIdx] && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] text-[var(--ink-faint)]">
                  <span>{t("Question", "សំណួរ")} {quizIdx + 1}/{quizQuestions.length}</span>
                  <span>{t("Score", "ពិន្ទុ")}: {quizScore} | {t("Streak", "តម្រង់")}: {quizStreak}</span>
                </div>
                <div className="rounded-md border border-[var(--gold-dim)] bg-[var(--ground-raised)] py-6 text-center">
                  <div className="font-khmer text-4xl font-bold text-[var(--ink)]">{quizQuestions[quizIdx].khmer}</div>
                  <p className="mt-1 text-[10px] italic text-[var(--ink-faint)]">{quizQuestions[quizIdx].hint}</p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {quizQuestions[quizIdx].choices.map((opt) => {
                    const isCorrect = opt === quizQuestions[quizIdx].correct;
                    const isSelected = quizAnswered && opt === quizQuestions[quizIdx].correct;
                    const isWrong = quizAnswered && opt !== quizQuestions[quizIdx].correct;
                    return (
                      <button key={opt} disabled={quizAnswered} onClick={() => submitQuiz(opt)}
                        className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${quizAnswered ? (isCorrect ? "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]" : "border-[var(--ground-line)] text-[var(--ink-faint)] opacity-50") : "border-[var(--ground-line)] text-[var(--ink)] hover:border-[var(--gold-dim)]"}`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {quizAnswered && (
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${quizStreak > 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                      {quizStreak > 0 ? t("Correct! +10", "ត្រឹមត្រូវ! +១០") : t("Incorrect", "មិនត្រឹមត្រូវ")}
                    </span>
                    <button onClick={nextQuiz} className="rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-bold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]">
                      {quizIdx >= 4 ? t("See results", "មើលលទ្ធផល") : t("Next", "បន្ទាប់")}
                    </button>
                  </div>
                )}
              </div>
            )}
            {quizScreen === "results" && (
              <div className="py-4 text-center">
                <p className="text-lg font-bold text-[var(--gold)]">{t("Quiz complete!", "បញ្ចប់!" )}</p>
                <p className="mt-1 text-xs text-[var(--ink-dim)]">{t("Score", "ពិន្ទុ")}: {quizScore}/50</p>
                <button onClick={startQuiz} className="mt-3 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-bold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]">{t("Play again", "លេងម្តងទៀត")}</button>
              </div>
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="rounded-md border border-[var(--ground-line)]">
              <div className="flex items-center justify-between border-b border-[var(--ground-line)] px-3 py-2 text-xs font-semibold text-[var(--ink-dim)]">
                <span>{t("History", "ប្រវត្តិ")}</span>
                <button onClick={() => setHistory([])} className="text-[var(--ink-faint)] hover:text-[var(--danger)]"><Trash2 size={12} /></button>
              </div>
              <div className="max-h-32 space-y-0.5 overflow-y-auto p-2">
                {history.slice(0, 8).map((h, i) => (
                  <button key={i} onClick={() => loadExample(h.input)} className="flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-[11px] text-left text-[var(--ink-dim)] transition hover:bg-[var(--ground-raised)]">
                    <span className="font-khmer font-semibold text-[var(--gold)] truncate">{h.input}</span>
                    <span className="text-[var(--ink-faint)] truncate">{h.output}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "reference" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {["consonants", "vowels", "subscripts", "independents", "diacritics"].map((cat) => (
              <button key={cat} onClick={() => setRefCat(cat)} className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${refCat === cat ? "border border-[var(--gold-dim)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border border-[var(--ground-line)] text-[var(--ink-dim)] hover:text-[var(--ink)]"}`}>
                {t(cat, cat)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {(refCat === "consonants" ? Object.entries(KHMER_CONSONANTS) :
              refCat === "vowels" ? Object.entries(KHMER_VOWELS) :
              refCat === "subscripts" ? Object.entries(KHMER_SUBSCRIPTS) :
              refCat === "independents" ? Object.entries(KHMER_INDEPENDENT_VOWELS) :
              Object.entries(KHMER_DIACRITICS)
            ).map(([glyph, info]) => (
              <button key={glyph} onClick={() => { setInspectChar(glyph); setTab("inspector"); }} className="flex flex-col items-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-center transition hover:border-[var(--gold-dim)]">
                <span className="font-khmer text-2xl text-[var(--gold)]">{glyph}</span>
                <span className="mt-1 text-[10px] font-semibold text-[var(--ink)]">{"name" in info ? (info as { name: string }).name : ""}</span>
                <span className="mt-0.5 text-[9px] text-[var(--ink-faint)] font-mono">
                  {"roman" in info ? (info as { roman: string }).roman : "s1" in info ? (info as { s1: string }).s1 : ""}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "inspector" && (
        <div className="mx-auto max-w-lg space-y-4">
          <input value={inspectChar} onChange={(e) => setInspectChar(e.target.value || "ក")} maxLength={2} className="w-full text-center font-khmer text-5xl rounded-md border border-[var(--ground-line)] bg-[var(--ground)] p-4 text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" />
          <div className="space-y-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-xs">
            {activeChar ? (
              <>
                <div className="flex justify-between border-b border-[var(--ground-line)] pb-1.5"><span className="text-[var(--ink-faint)]">Unicode</span><strong className="font-mono text-[var(--ink)]">U+{inspectChar.charCodeAt(0).toString(16).toUpperCase()}</strong></div>
                {"name" in activeChar && <div className="flex justify-between border-b border-[var(--ground-line)] pb-1.5"><span className="text-[var(--ink-faint)]">{t("Name", "ឈ្មោះ")}</span><strong className="text-[var(--ink)]">{(activeChar as { name: string }).name}</strong></div>}
                {"series" in activeChar && <div className="flex justify-between border-b border-[var(--ground-line)] pb-1.5"><span className="text-[var(--ink-faint)]">{t("Series", "ស៊េរី")}</span><strong className="text-[var(--gold)]">{(activeChar as { series: number }).series}</strong></div>}
                {"roman" in activeChar && <div className="flex justify-between border-b border-[var(--ground-line)] pb-1.5"><span className="text-[var(--ink-faint)]">{t("Romanization", "ឡាតាំង")}</span><strong className="font-mono text-[var(--teal)]">{(activeChar as { roman: string }).roman}</strong></div>}
                {"linguistic" in activeChar && <div className="flex justify-between border-b border-[var(--ground-line)] pb-1.5"><span className="text-[var(--ink-faint)]">Linguistic</span><strong className="font-mono text-[var(--ink)]">{(activeChar as { linguistic: string }).linguistic}</strong></div>}
                {"ipa" in activeChar && <div className="flex justify-between pb-1"><span className="text-[var(--ink-faint)]">IPA</span><strong className="text-[var(--ink)]">{(activeChar as { ipa: string }).ipa}</strong></div>}
              </>
            ) : <p className="py-4 text-center italic text-[var(--ink-faint)]">{t("Type a character above", "វាយតួអក្សរខាងលើ")}</p>}
          </div>
        </div>
      )}
    </ToolShell>
  );
}
