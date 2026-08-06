"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Keyboard, RotateCcw, Target, Timer, Trash2, Trophy, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const PHRASES = [
  "សួស្តីកម្ពុជា", "អរគុណច្រើន", "សូមស្វាគមន៍មកកាន់ប្រទេសកម្ពុជា", "ភាសាខ្មែរជាភាសាជាតិ",
  "ខ្ញុំចូលចិត្តរៀនអក្សរខ្មែរ", "ទីក្រុងភ្នំពេញជារាជធានីនៃព្រះរាជាណាចក្រកម្ពុជា",
  "ធ្វើស្រែទាន់ក្តៅដី", "ពេលវេលាជាមាសប្រាក់", "សាមគ្គីគឺជាកម្លាំង", "ការសិក្សាគឺជាគន្លឹះនៃភាពជោគជ័យ",
  "ប្រទេសកម្ពុជាមានប្រាសាទអង្គរវត្តដ៏ល្បីល្បាញ", "យើងត្រូវចូលរួមថែរក្សាបរិស្ថានទាំងអស់គ្នា",
  "អ្នកចេះដប់មិនស្មើអ្នកប្រសប់មួយ", "សុខភាពគឺជាទ្រព្យសម្បត្តិដ៏មានតម្លៃបំផុត",
  "មិត្តល្អតែងតែជួយគ្នាក្នុងគ្រាមានអាសន្ន", "ការអានសៀវភៅផ្តល់នូវចំណេះដឹងទូលំទូលាយ",
  "បច្ចេកវិទ្យាទំនើបធ្វើឲ្យពិភពលោកកាន់តែតូច", "ភាពស្មោះត្រង់គឺជាស្ពាននៃការទុកចិត្ត",
];

interface Score { id: number; wpm: number; accuracy: number; errors: number; time: number; phrase: string; date: string; }
interface Mistake { id: number; phrase: string; position: number; expected: string; typed: string; date: string; }

function wpm(chars: number, seconds: number) { return seconds > 0 ? Math.round((chars / 5) / (seconds / 60)) : 0; }
function accuracy(correct: number, errors: number) { const total = correct + errors; return total ? Math.round((correct / total) * 1000) / 10 : 100; }

export default function KhmerTypingTraining() {
  const { text: t, mode } = useLanguage();
  const [phrase, setPhrase] = useToolState("ktt:phrase", PHRASES[0]);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "playing" | "finished">("idle");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [errors, setErrors] = useState(0);
  const [scores, setScores] = useToolState<Score[]>("ktt:scores", []);
  const [mistakes, setMistakes] = useToolState<Mistake[]>("ktt:mistakes", []);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastMistakeKey = useRef("");

  useEffect(() => {
    if (status !== "playing" || startedAt === null) return;
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 250);
    return () => clearInterval(timer);
  }, [startedAt, status]);

  function reset() {
    const next = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    setPhrase(next); setValue(""); setStatus("idle"); setStartedAt(null); setSeconds(0); setErrors(0);
    lastMistakeKey.current = "";
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function onInput(next: string) {
    if (status === "finished") return;
    if (status === "idle" && next.length > 0) { setStatus("playing"); setStartedAt(Date.now()); }
    let correct = 0;
    for (let i = 0; i < next.length && next[i] === phrase[i]; i++) correct++;
    if (next.length > value.length && !phrase.startsWith(next)) {
      setErrors((n) => n + 1);
      const expected = Array.from(phrase)[correct] ?? "∅";
      const typed = Array.from(next)[correct] ?? "∅";
      const mistakeKey = `${phrase}:${correct}:${typed}`;
      if (lastMistakeKey.current !== mistakeKey) {
        lastMistakeKey.current = mistakeKey;
        setMistakes((prev) => [{ id: Date.now(), phrase, position: correct + 1, expected, typed, date: new Date().toISOString() }, ...prev].slice(0, 100));
      }
    } else if (phrase.startsWith(next)) {
      lastMistakeKey.current = "";
    }
    setValue(next);
    if (next === phrase) {
      const time = Math.max((Date.now() - (startedAt ?? Date.now())) / 1000, 1);
      const score: Score = { id: Date.now(), wpm: wpm(correct, time), accuracy: accuracy(correct, errors), errors, time: Math.round(time), phrase, date: new Date().toISOString() };
      setScores((prev) => [...prev, score].sort((a, b) => b.wpm - a.wpm).slice(0, 10));
      setSeconds(Math.round(time)); setStatus("finished");
    }
  }

  const correctChars = [...value].filter((char, i) => char === phrase[i]).length;
  const currentWpm = wpm(correctChars, seconds);
  const currentAccuracy = accuracy(correctChars, errors);
  const percent = phrase ? Math.min(100, (correctChars / [...phrase].length) * 100) : 0;
  const localizedDate = (value: string) => new Date(value).toLocaleDateString(mode === "km" ? "km-KH" : "en-US", { month: "short", day: "numeric" });

  return <ToolShell title="Khmer Typing Training" khmerTitle="ល្បែងហ្វឹកហាត់វាយអក្សរខ្មែរ" description="Improve Khmer typing speed and accuracy with timed practice phrases and a local leaderboard." descriptionKm="ពង្រឹងល្បឿន និងភាពសុក្រឹតនៃការវាយអក្សរខ្មែរ ជាមួយអត្ថបទហ្វឹកហាត់ និងតារាងពិន្ទុក្នុងម៉ាស៊ីន។">
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([
          [Zap, t("WPM", "ពាក្យ/នាទី"), status === "finished" ? scores[0]?.wpm ?? 0 : currentWpm, "text-[var(--gold)]"],
          [Target, t("Accuracy", "ភាពសុក្រឹត"), `${status === "finished" ? scores.find((s) => s.phrase === phrase)?.accuracy ?? currentAccuracy : currentAccuracy}%`, "text-[var(--success)]"],
          [Timer, t("Time", "ពេលវេលា"), `${seconds}s`, "text-[var(--teal)]"],
          [AlertCircle, t("Errors", "កំហុស"), errors, "text-[var(--danger)]"],
        ] as Array<[LucideIcon, string, string | number, string]>).map(([Icon, label, value, color]) => <div key={label} className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-center"><Icon size={15} className={`mx-auto mb-1 ${color}`} /><div className="text-[10px] text-[var(--ink-faint)]">{label}</div><div className={`mt-1 font-mono-ui text-2xl font-bold ${color}`}>{value}</div></div>)}
      </div>

      <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 sm:p-8">
        {status === "finished" ? <div className="py-8 text-center"><Trophy size={42} className="mx-auto mb-3 text-[var(--gold)]" /><h2 className="text-xl font-bold text-[var(--ink)]">{t("Training Complete!", "ការហ្វឹកហាត់បានបញ្ចប់!")}</h2><p className="mt-2 text-sm text-[var(--ink-dim)]">{t("Great work. Try another phrase to improve your score.", "ពូកែណាស់។ សាកអត្ថបទថ្មីដើម្បីបង្កើនពិន្ទុ។")}</p><button onClick={reset} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[#0a0c0d]"><RotateCcw size={15} />{t("Play Again", "លេងម្តងទៀត")}</button></div> : <div className="space-y-6"><div><div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--ink-faint)]">{status === "idle" ? t("Start typing to begin the timer…", "ចាប់ផ្តើមវាយអក្សរដើម្បីចាប់ផ្តើមម៉ោង…") : ""}</div><div className="font-khmer text-2xl leading-relaxed text-[var(--ink-faint)] sm:text-4xl">{phrase}</div></div><textarea ref={inputRef} value={value} onChange={(e) => onInput(e.target.value)} onPaste={(e) => e.preventDefault()} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()} onDrop={(e) => e.preventDefault()} onContextMenu={(e) => e.preventDefault()} placeholder={t("Type the phrase here…", "វាយអត្ថបទនៅទីនេះ…")} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" className={`h-24 w-full resize-none border-b-4 bg-transparent font-khmer text-2xl leading-relaxed text-[var(--ink)] outline-none sm:text-4xl ${value && !phrase.startsWith(value) ? "border-[var(--danger)]" : "border-[var(--gold)]"}`} /><div className="h-2 overflow-hidden rounded-full bg-[var(--ground-line)]"><div className="h-full bg-[var(--gold)] transition-all" style={{ width: `${percent}%` }} /></div><div className="flex justify-end"><button onClick={reset} className="flex items-center gap-1 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]"><RotateCcw size={12} />{t("Skip phrase", "រំលងអត្ថបទ")}</button></div></div>}
      </div>

      <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] overflow-hidden"><div className="flex items-center justify-between border-b border-[var(--ground-line)] bg-[var(--ground)] px-4 py-3 text-sm font-semibold text-[var(--ink)]"><span>{t("Mistake History", "ប្រវត្តិកំហុស")}</span><button type="button" onClick={() => setMistakes([])} className="flex items-center gap-1 text-[11px] font-medium text-[var(--ink-faint)] hover:text-[var(--danger)]"><Trash2 size={12} />{t("Clear", "សម្អាត")}</button></div>{mistakes.length === 0 ? <p className="p-5 text-center text-xs text-[var(--ink-faint)]">{t("No mistakes recorded yet.", "មិនទាន់មានកំហុសត្រូវបានកត់ត្រាទេ។")}</p> : <div className="max-h-60 overflow-y-auto"><table className="w-full text-left text-xs"><thead className="border-b border-[var(--ground-line)] text-[var(--ink-faint)]"><tr><th className="p-3">{t("Expected", "រំពឹង")}</th><th className="p-3">{t("Typed", "វាយ")}</th><th className="p-3">{t("Position", "ទីតាំង")}</th><th className="p-3">{t("Phrase", "អត្ថបទ")}</th></tr></thead><tbody className="divide-y divide-[var(--ground-line)]">{mistakes.slice(0, 30).map((mistake) => <tr key={mistake.id}><td className="p-3 font-khmer font-bold text-[var(--success)]">{mistake.expected}</td><td className="p-3 font-khmer font-bold text-[var(--danger)]">{mistake.typed}</td><td className="p-3 font-mono-ui text-[var(--ink-faint)]">#{mistake.position}</td><td className="max-w-xs truncate p-3 font-khmer text-[var(--ink-dim)]">{mistake.phrase}</td></tr>)}</tbody></table></div>}</div>

      <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] overflow-hidden"><div className="flex items-center gap-2 border-b border-[var(--ground-line)] bg-[var(--ground)] px-4 py-3 text-sm font-semibold text-[var(--ink)]"><Trophy size={16} className="text-[var(--gold)]" />{t("Local Leaderboard", "តារាងពិន្ទុក្នុងម៉ាស៊ីន")}</div>{scores.length === 0 ? <p className="p-6 text-center text-xs text-[var(--ink-faint)]">{t("No records yet. Play a game to save your score!", "មិនទាន់មានកំណត់ត្រាទេ។ លេងដើម្បីរក្សាទុកពិន្ទុ!")}</p> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b border-[var(--ground-line)] text-[var(--ink-faint)]"><tr><th className="p-3">#</th><th className="p-3">{t("Phrase", "អត្ថបទ")}</th><th className="p-3">{t("Speed", "ល្បឿន")}</th><th className="p-3">{t("Accuracy", "ភាពសុក្រឹត")}</th><th className="p-3">{t("Date", "កាលបរិច្ឆេទ")}</th></tr></thead><tbody className="divide-y divide-[var(--ground-line)]">{scores.map((score, i) => <tr key={score.id}><td className="p-3 text-[var(--ink-faint)]">#{i + 1}</td><td className="max-w-xs truncate p-3 font-khmer text-[var(--ink)]">{score.phrase}</td><td className="p-3 font-mono-ui font-bold text-[var(--gold)]">{score.wpm}</td><td className="p-3 text-[var(--success)]">{score.accuracy}%</td><td className="p-3 text-[var(--ink-faint)]">{localizedDate(score.date)}</td></tr>)}</tbody></table></div>}</div>
    </div>
  </ToolShell>;
}
