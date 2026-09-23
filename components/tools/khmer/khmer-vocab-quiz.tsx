"use client";
import { useMemo, useState } from "react";
import { Check, RefreshCw, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { STATIC_DATABASE } from "@/lib/khmer-lexicon-db";
import { buildOptions } from "@/lib/khmer-learning";

type Direction = "word-to-meaning" | "meaning-to-word";
interface Entry { word: string; definition: string }

// Unique headwords with a usable definition (first sentence, trimmed).
const ENTRIES: Entry[] = (() => {
  const seen = new Set<string>();
  const out: Entry[] = [];
  for (const e of Object.values(STATIC_DATABASE)) {
    const def = e.definition.split(/[។\n]/)[0].trim();
    if (!e.word || !def || def.length < 4 || seen.has(e.word) || def.includes(e.word)) continue;
    seen.add(e.word);
    out.push({ word: e.word, definition: def });
  }
  return out;
})();

interface Question { answer: Entry; options: Entry[] }

function makeQuestion(): Question {
  const answer = ENTRIES[Math.floor(Math.random() * ENTRIES.length)];
  const options = buildOptions(answer, ENTRIES, 4, Math.random, (e) => e.definition);
  return { answer, options };
}

const KH = "០១២៣៤៥៦៧៨៩";
const kh = (n: number) => String(n).replace(/\d/g, (d) => KH[Number(d)]);

export default function KhmerVocabQuiz() {
  const { text: t } = useLanguage();
  const [direction, setDirection] = useToolState<Direction>("khmer-vocab-quiz:direction", "word-to-meaning");
  const [best, setBest] = useToolState("khmer-vocab-quiz:best", 0);
  const [q, setQ] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0, streak: 0 });

  const next = () => { setQ(makeQuestion()); setPicked(null); };
  const restart = () => { setScore({ right: 0, total: 0, streak: 0 }); next(); };

  const choose = (opt: Entry) => {
    if (!q || picked) return;
    setPicked(opt.word);
    const ok = opt.word === q.answer.word;
    const streak = ok ? score.streak + 1 : 0;
    setScore({ right: score.right + (ok ? 1 : 0), total: score.total + 1, streak });
    if (streak > best) setBest(streak);
  };

  const pct = useMemo(() => (score.total ? Math.round((score.right / score.total) * 100) : 0), [score]);

  return (
    <ToolShell
      title="Khmer Vocabulary Quiz"
      khmerTitle="ល្បែងសំណួរវាក្យសព្ទខ្មែរ"
      description="Test your Khmer vocabulary with quick multiple-choice questions: see a word and pick its meaning, or read a meaning and pick the word. Questions come from the app's offline Khmer dictionary, with a running score and your best streak. Good for students, teachers, and anyone keeping their Khmer sharp."
      descriptionKm="សាកល្បងវាក្យសព្ទខ្មែររបស់អ្នកជាមួយសំណួរពហុជម្រើសរហ័ស៖ មើលពាក្យ ហើយជ្រើសន័យ ឬអានន័យ ហើយជ្រើសពាក្យ។ សំណួរមកពីវចនានុក្រមខ្មែរក្រៅបណ្តាញរបស់កម្មវិធី មានពិន្ទុ និងចំនួនត្រូវជាប់ៗគ្នាល្អបំផុតរបស់អ្នក។ ល្អសម្រាប់សិស្ស គ្រូ និងអ្នកដែលចង់រក្សាភាសាខ្មែរឱ្យស្ទាត់។"
    >
      <PillGroup label={t("Question type", "ប្រភេទសំណួរ")}>
        <Pill active={direction === "word-to-meaning"} onClick={() => setDirection("word-to-meaning")}>{t("Word → meaning", "ពាក្យ → ន័យ")}</Pill>
        <Pill active={direction === "meaning-to-word"} onClick={() => setDirection("meaning-to-word")}>{t("Meaning → word", "ន័យ → ពាក្យ")}</Pill>
      </PillGroup>

      {!q ? (
        <Button onClick={restart}>{t("Start quiz", "ចាប់ផ្តើម")}</Button>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--ink-dim)]">
            <span>{t(`Score: ${score.right}/${score.total} (${pct}%)`, `ពិន្ទុ៖ ${kh(score.right)}/${kh(score.total)} (${kh(pct)}%)`)}</span>
            <span>{t(`Streak: ${score.streak}`, `ត្រូវជាប់ៗ៖ ${kh(score.streak)}`)}</span>
            <span>{t(`Best streak: ${best}`, `ល្អបំផុត៖ ${kh(best)}`)}</span>
          </div>

          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-center">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
              {direction === "word-to-meaning" ? t("What does this word mean?", "តើពាក្យនេះមានន័យថាអ្វី?") : t("Which word has this meaning?", "តើពាក្យណាមានន័យនេះ?")}
            </p>
            <p lang="km" className={`font-khmer text-[var(--ink)] ${direction === "word-to-meaning" ? "text-4xl" : "text-lg leading-relaxed"}`}>
              {direction === "word-to-meaning" ? q.answer.word : q.answer.definition}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((o) => {
              const isAnswer = o.word === q.answer.word;
              const state = !picked ? "idle" : isAnswer ? "right" : picked === o.word ? "wrong" : "idle";
              return (
                <button
                  key={o.word}
                  type="button"
                  lang="km"
                  disabled={!!picked}
                  onClick={() => choose(o)}
                  className={`flex items-start gap-2 rounded-md border p-3 text-left font-khmer transition ${state === "right" ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--ink)]" : state === "wrong" ? "border-[var(--danger)]/60 bg-[var(--danger)]/10 text-[var(--ink)]" : "border-[var(--ground-line)] text-[var(--ink)] hover:border-[var(--ink-faint)]"}`}
                >
                  {state === "right" && <Check size={16} className="mt-1 shrink-0 text-[var(--gold)]" />}
                  {state === "wrong" && <X size={16} className="mt-1 shrink-0 text-[var(--danger)]" />}
                  <span className={direction === "meaning-to-word" ? "text-xl" : "text-sm leading-relaxed"}>{direction === "word-to-meaning" ? o.definition : o.word}</span>
                </button>
              );
            })}
          </div>

          {picked && (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-[var(--ink-dim)]" role="status">
                {picked === q.answer.word ? t("Correct!", "ត្រឹមត្រូវ!") : t("Not quite — the correct answer is highlighted.", "មិនទាន់ត្រូវ — ចម្លើយត្រឹមត្រូវត្រូវបានបន្លិច។")}
              </p>
              <Button onClick={next}>{t("Next question", "សំណួរបន្ទាប់")}</Button>
            </div>
          )}
          <PillAction onClick={restart}><RefreshCw size={13} />{t("Restart", "ចាប់ផ្តើមឡើងវិញ")}</PillAction>
        </div>
      )}

      <SourceCredits>
        <p>{t(
          `Questions are drawn from the app's offline Khmer lexicon (${ENTRIES.length} headwords with definitions, compiled from Chuon Nath & Headley dictionary data). Definitions are shortened to their first sentence and are monolingual Khmer. The lexicon is not exhaustive, and a distractor can occasionally be close in meaning — treat it as practice, not an exam. Your best streak is saved in this browser only.`,
          `សំណួរដកស្រង់ពីវចនានុក្រមខ្មែរក្រៅបណ្តាញរបស់កម្មវិធី (ពាក្យគោល ${kh(ENTRIES.length)} ដែលមាននិយមន័យ ចងក្រងពីទិន្នន័យវចនានុក្រមជួន ណាត និង Headley)។ និយមន័យត្រូវកាត់ខ្លីត្រឹមប្រយោគទីមួយ ហើយជាភាសាខ្មែរសុទ្ធ។ វចនានុក្រមនេះមិនពេញលេញទេ ហើយជម្រើសខុសពេលខ្លះអាចមានន័យជិតគ្នា — សូមចាត់ទុកជាការអនុវត្ត មិនមែនការប្រឡងទេ។ ពិន្ទុជាប់ៗល្អបំផុតរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះប៉ុណ្ណោះ។`,
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
