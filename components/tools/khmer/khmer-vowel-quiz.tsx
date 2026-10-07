"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { PillAction } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { KHMER_CONSONANTS, KHMER_VOWELS } from "@/lib/data/khmer-romanization";
import { buildOptions, shuffle } from "@/lib/khmer-learning";
import { toKhmerNumerals } from "@/lib/khmer-number-words";

const ROUND = 12;
const kh = (n: number) => toKhmerNumerals(String(n));
const VOWELS = Object.keys(KHMER_VOWELS);
// អ is left out: the table romanizes it as a glottal "q", which reads oddly in a vowel drill.
const CONSONANTS = Object.keys(KHMER_CONSONANTS).filter((c) => c !== "អ");

interface Question { consonant: string; vowel: string; answer: string; options: string[] }

const reading = (consonant: string, vowel: string) => {
  const c = KHMER_CONSONANTS[consonant], v = KHMER_VOWELS[vowel];
  return { roman: c.roman + (c.series === 1 ? v.s1 : v.s2), ipa: c.series === 1 ? v.ipa1 : v.ipa2 };
};

/** One question: the options are the right reading, the other series' reading of the same vowel, and other vowels. */
function makeQuestion(rand: () => number): Question {
  const consonant = CONSONANTS[Math.floor(rand() * CONSONANTS.length)];
  const vowel = VOWELS[Math.floor(rand() * VOWELS.length)];
  const c = KHMER_CONSONANTS[consonant], v = KHMER_VOWELS[vowel];
  const answer = reading(consonant, vowel).roman;
  const otherSeries = c.roman + (c.series === 1 ? v.s2 : v.s1);
  const pool = [otherSeries, ...shuffle(VOWELS.filter((x) => x !== vowel), rand).map((x) => reading(consonant, x).roman)];
  return { consonant, vowel, answer, options: buildOptions(answer, pool, 4, rand) };
}

export default function KhmerVowelQuiz() {
  const { text: t } = useLanguage();
  const [best, setBest] = useToolState("khmer-vowel-quiz:best", 0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [right, setRight] = useState(0);

  const start = () => { setQuestions(Array.from({ length: ROUND }, () => makeQuestion(Math.random))); setIndex(0); setAnswer(null); setRight(0); };
  const q = questions[index];
  const done = questions.length > 0 && index >= questions.length;

  const choose = (opt: string) => {
    if (!q || answer) return;
    setAnswer(opt);
    if (opt === q.answer) setRight(right + 1);
  };
  const next = () => {
    setAnswer(null);
    const ni = index + 1;
    setIndex(ni);
    if (ni >= questions.length && right > best) setBest(right);
  };

  return (
    <ToolShell
      title="Khmer Vowel Reading Quiz"
      khmerTitle="ល្បែងសំណួរអានស្រៈខ្មែរ"
      description="Practise how a Khmer vowel sign changes with the consonant's series: see a syllable such as កា or គា and pick its reading. One wrong option is always the same vowel read in the other series, so you learn the rule rather than guess. Readings are the app's approximate romanization."
      descriptionKm="ហាត់របៀបដែលស្រៈខ្មែរប្រែប្រួលតាមស៊េរីរបស់ព្យញ្ជនៈ៖ មើលព្យាង្គដូចជា កា ឬ គា ហើយជ្រើសរបៀបអានរបស់វា។ ជម្រើសខុសមួយតែងតែជាស្រៈដដែលអានតាមស៊េរីផ្សេង ដូច្នេះអ្នករៀនច្បាប់ ជាជាងទាយ។ ការអានជាការបកជាអក្សរឡាតាំងប្រហាក់ប្រហែលរបស់កម្មវិធី។"
    >
      {questions.length === 0 ? (
        <Button onClick={start}>{t("Start quiz", "ចាប់ផ្តើម")}</Button>
      ) : done ? (
        <div className="space-y-3 rounded-md border border-[var(--gold)] p-4" role="status">
          <p className="text-sm text-[var(--ink)]">{t(`You got ${right} of ${questions.length} right. Best: ${Math.max(best, right)}.`, `អ្នកឆ្លើយត្រូវ ${kh(right)} ក្នុងចំណោម ${kh(questions.length)}។ ល្អបំផុត៖ ${kh(Math.max(best, right))}។`)}</p>
          <PillAction onClick={start}><RefreshCw size={13} />{t("Play again", "លេងម្តងទៀត")}</PillAction>
        </div>
      ) : q && (
        <div className="space-y-4">
          <p className="text-xs text-[var(--ink-faint)]">{t(`Question ${index + 1} of ${questions.length} · score ${right}`, `សំណួរទី ${kh(index + 1)} ក្នុងចំណោម ${kh(questions.length)} · ពិន្ទុ ${kh(right)}`)}</p>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 text-center">
            <p lang="km" className="font-khmer text-7xl leading-[1.6] text-[var(--ink)]">{q.consonant + q.vowel}</p>
            <p className="mt-1 text-xs text-[var(--ink-faint)]">
              {KHMER_CONSONANTS[q.consonant].series === 1 ? t("1st-series consonant", "ព្យញ្ជនៈស៊េរីទី១") : t("2nd-series consonant", "ព្យញ្ជនៈស៊េរីទី២")} · {KHMER_VOWELS[q.vowel].name}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt) => {
              const state = !answer ? "idle" : opt === q.answer ? "right" : opt === answer ? "wrong" : "idle";
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={Boolean(answer)}
                  onClick={() => choose(opt)}
                  className={`ui-touch rounded-md border px-3 py-3 font-mono-ui text-lg transition ${state === "right" ? "border-[var(--gold)] bg-[var(--gold)]/15" : state === "wrong" ? "border-[var(--danger)]/60 bg-[var(--danger)]/10" : "border-[var(--ground-line)] hover:border-[var(--ink-faint)]"}`}
                >
                  <span className="text-[var(--ink)]">{opt}</span>
                </button>
              );
            })}
          </div>
          {answer && (
            <div className="flex flex-wrap items-center gap-3" role="status">
              <p className="text-sm text-[var(--ink-dim)]">
                {answer === q.answer ? t("Correct.", "ត្រឹមត្រូវ។") : t("Not quite.", "មិនទាន់ត្រូវ។")}{" "}
                <span lang="km" className="font-khmer">{q.consonant + q.vowel}</span> → {q.answer} /{reading(q.consonant, q.vowel).ipa}/
              </p>
              <Button onClick={next}>{index + 1 >= questions.length ? t("See results", "មើលលទ្ធផល") : t("Next", "បន្ទាប់")}</Button>
            </div>
          )}
        </div>
      )}

      <SourceCredits>
        <p>{t(
          "Consonant series and the 1st/2nd-series vowel readings and IPA come from the app's shared Khmer romanization table (lib/data/khmer-romanization.ts), the same one behind the Romanizer, Consonant Series Quiz and Syllable Builder. Romanization is approximate and spellings vary between systems; the IPA shows the vowel sound only. Best score is saved in this browser only. Original Tools123 implementation.",
          "ស៊េរីព្យញ្ជនៈ ការអានស្រៈតាមស៊េរីទី១/ទី២ និង IPA មកពីតារាងបម្លែងអក្សរខ្មែររួមរបស់កម្មវិធី (lib/data/khmer-romanization.ts) ដូចគ្នានឹងឧបករណ៍បម្លែងអក្សរ ល្បែងសំណួរស៊េរីព្យញ្ជនៈ និងឧបករណ៍ផ្គុំព្យាង្គ។ ការបកជាអក្សរឡាតាំងជាការប្រហាក់ប្រហែល ហើយការប្រកបខុសគ្នាតាមប្រព័ន្ធ IPA បង្ហាញតែសំឡេងស្រៈប៉ុណ្ណោះ។ ពិន្ទុល្អបំផុតរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
