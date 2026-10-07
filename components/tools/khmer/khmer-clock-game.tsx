"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { clockDistractors, handAngles, randomClockTime, type ClockTime } from "@/lib/khmer-word-games";
import { khmerTimePhrase, khmerTimePhraseWords, partOfHour } from "@/lib/khmer-time-words";
import { shuffle } from "@/lib/khmer-learning";
import { toKhmerNumerals } from "@/lib/khmer-number-words";

const ROUND = 10;
const kh = (n: number) => toKhmerNumerals(String(n));
type Level = 15 | 5 | 1;
interface Question { time: ClockTime; options: ClockTime[] }

function AnalogClock({ time, label }: { time: ClockTime; label: string }) {
  const { hour, minute } = handAngles(time);
  const hand = (deg: number, len: number) => ({ x2: 50 + len * Math.sin((deg * Math.PI) / 180), y2: 50 - len * Math.cos((deg * Math.PI) / 180) });
  return (
    <svg viewBox="0 0 100 100" className="mx-auto h-56 w-56" role="img" aria-label={label}>
      <circle cx="50" cy="50" r="47" fill="var(--ground-raised)" stroke="var(--ink-faint)" strokeWidth="1.5" />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i * 6 * Math.PI) / 180, r1 = i % 5 ? 43 : 40;
        return <line key={i} x1={50 + r1 * Math.sin(a)} y1={50 - r1 * Math.cos(a)} x2={50 + 45 * Math.sin(a)} y2={50 - 45 * Math.cos(a)} stroke="var(--ink-faint)" strokeWidth={i % 5 ? 0.4 : 1.2} />;
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1, a = (n * 30 * Math.PI) / 180;
        return <text key={n} x={50 + 33 * Math.sin(a)} y={50 - 33 * Math.cos(a) + 3.5} textAnchor="middle" fontSize="9" fill="var(--ink)" className="font-khmer">{kh(n)}</text>;
      })}
      <line x1="50" y1="50" {...hand(hour, 22)} stroke="var(--ink)" strokeWidth="3.2" strokeLinecap="round" />
      <line x1="50" y1="50" {...hand(minute, 34)} stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="50" cy="50" r="2.2" fill="var(--gold)" />
    </svg>
  );
}

function makeQuestion(level: Level): Question {
  const time = randomClockTime(level, Math.random);
  return { time, options: shuffle([time, ...clockDistractors(time, level, 3, Math.random)], Math.random) };
}

export default function KhmerClockGame() {
  const { text: t } = useLanguage();
  const [level, setLevel] = useToolState<Level>("khmer-clock-game:level", 5);
  const [useWords, setUseWords] = useToolState("khmer-clock-game:words", false);
  const [best, setBest] = useToolState("khmer-clock-game:best", 0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<ClockTime | null>(null);
  const [right, setRight] = useState(0);

  const start = (lv: Level = level) => {
    setQuestions(Array.from({ length: ROUND }, () => makeQuestion(lv)));
    setIndex(0); setAnswer(null); setRight(0);
  };
  const q = questions[index];
  const done = questions.length > 0 && index >= questions.length;
  const same = (a: ClockTime, b: ClockTime) => a.h24 === b.h24 && a.m === b.m;
  const phrase = (time: ClockTime) => (useWords ? khmerTimePhraseWords(time.h24, time.m) : khmerTimePhrase(time.h24, time.m));

  const choose = (opt: ClockTime) => {
    if (!q || answer) return;
    setAnswer(opt);
    if (same(opt, q.time)) setRight(right + 1);
  };
  const next = () => {
    setAnswer(null);
    const ni = index + 1;
    setIndex(ni);
    if (ni >= questions.length && right > best) setBest(right);
  };

  return (
    <ToolShell
      title="Khmer Clock Reading Game"
      khmerTitle="ល្បែងមើលនាឡិកាជាភាសាខ្មែរ"
      description="Read the clock face and pick how that time is said in Khmer — ម៉ោង ៣ រសៀល និង ២០ នាទី. The day part (morning, afternoon, evening, night) is shown under the clock so 3 a.m. and 3 p.m. can be told apart. Ten questions per round, with 15-, 5- or 1-minute steps."
      descriptionKm="មើលនាឡិកា ហើយជ្រើសរបៀបនិយាយម៉ោងនោះជាភាសាខ្មែរ — ម៉ោង ៣ រសៀល និង ២០ នាទី។ ផ្នែកនៃថ្ងៃ (ព្រឹក រសៀល ល្ងាច យប់) បង្ហាញនៅក្រោមនាឡិកា ដើម្បីបែងចែកម៉ោង ៣ ព្រឹក និង ៣ រសៀល។ ដប់សំណួរក្នុងមួយជុំ ជាមួយជំហាន ១៥ ៥ ឬ ១ នាទី។"
    >
      <PillGroup label={t("Minute steps", "ជំហាននាទី")}>
        {([15, 5, 1] as const).map((lv) => <Pill key={lv} active={level === lv} onClick={() => { setLevel(lv); start(lv); }}>{t(`${lv} min`, `${kh(lv)} នាទី`)}</Pill>)}
      </PillGroup>
      <PillGroup label={t("Answers as", "ចម្លើយជា")}>
        <Pill active={!useWords} onClick={() => setUseWords(false)}>{t("Khmer numerals", "លេខខ្មែរ")}</Pill>
        <Pill active={useWords} onClick={() => setUseWords(true)}>{t("Number words", "ពាក្យលេខ")}</Pill>
      </PillGroup>

      {questions.length === 0 ? (
        <Button onClick={() => start()}>{t("Start", "ចាប់ផ្តើម")}</Button>
      ) : done ? (
        <div className="space-y-3 rounded-md border border-[var(--gold)] p-4" role="status">
          <p className="text-sm text-[var(--ink)]">{t(`You got ${right} of ${questions.length} right. Best: ${Math.max(best, right)}.`, `អ្នកឆ្លើយត្រូវ ${kh(right)} ក្នុងចំណោម ${kh(questions.length)}។ ល្អបំផុត៖ ${kh(Math.max(best, right))}។`)}</p>
          <PillAction onClick={() => start()}><RefreshCw size={13} />{t("Play again", "លេងម្តងទៀត")}</PillAction>
        </div>
      ) : q && (
        <div className="space-y-4">
          <p className="text-xs text-[var(--ink-faint)]">{t(`Question ${index + 1} of ${questions.length} · score ${right}`, `សំណួរទី ${kh(index + 1)} ក្នុងចំណោម ${kh(questions.length)} · ពិន្ទុ ${kh(right)}`)}</p>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground)] p-4 text-center">
            <AnalogClock time={q.time} label={t("Analog clock", "នាឡិកាមានទ្រនិច")} />
            <p className="mt-2 text-sm text-[var(--ink-dim)]">{t(partOfHour(q.time.h24).en, partOfHour(q.time.h24).km)}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((opt) => {
              const isRight = same(opt, q.time);
              const state = !answer ? "idle" : isRight ? "right" : same(opt, answer) ? "wrong" : "idle";
              return (
                <button
                  key={`${opt.h24}:${opt.m}`}
                  type="button"
                  disabled={Boolean(answer)}
                  onClick={() => choose(opt)}
                  className={`ui-touch rounded-md border px-3 py-3 text-left font-khmer text-lg leading-relaxed transition ${state === "right" ? "border-[var(--gold)] bg-[var(--gold)]/15" : state === "wrong" ? "border-[var(--danger)]/60 bg-[var(--danger)]/10" : "border-[var(--ground-line)] hover:border-[var(--ink-faint)]"}`}
                >
                  <span lang="km" className="text-[var(--ink)]">{phrase(opt)}</span>
                </button>
              );
            })}
          </div>
          {answer && (
            <div className="flex flex-wrap items-center gap-3" role="status">
              <p className="text-sm text-[var(--ink-dim)]">{same(answer, q.time) ? t("Correct.", "ត្រឹមត្រូវ។") : t("Not quite.", "មិនទាន់ត្រូវ។")} <span className="font-mono-ui">{String(q.time.h24).padStart(2, "0")}:{String(q.time.m).padStart(2, "0")}</span></p>
              <Button onClick={next}>{index + 1 >= questions.length ? t("See results", "មើលលទ្ធផល") : t("Next", "បន្ទាប់")}</Button>
            </div>
          )}
        </div>
      )}

      <SourceCredits>
        <p>{t(
          "Phrases use the same rules as the app's Khmer Time in Words tool (lib/khmer-time-words.ts): the hour on a 12-hour clock, a day-part word from common time buckets, then the minutes. The buckets are a guide; real usage varies by region and speaker, and shorter forms such as “កន្លះ” (half past) are also common. Best score is saved in this browser only. Original Tools123 implementation.",
          "ឃ្លាប្រើច្បាប់ដូចគ្នានឹងឧបករណ៍ម៉ោងជាពាក្យខ្មែររបស់កម្មវិធី (lib/khmer-time-words.ts)៖ ម៉ោងតាមនាឡិកា ១២ ម៉ោង ពាក្យផ្នែកថ្ងៃតាមចន្លោះពេលធម្មតា បន្ទាប់មកនាទី។ ចន្លោះពេលទាំងនេះជាមគ្គុទ្ទេសក៍ ការប្រើពិតប្រែប្រួលតាមតំបន់ និងអ្នកនិយាយ ហើយទម្រង់ខ្លីដូចជា «កន្លះ» ក៏ប្រើញឹកញាប់ដែរ។ ពិន្ទុល្អបំផុតរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
