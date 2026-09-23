"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { convertModernBanking, convertTraditional, toKhmerNumerals } from "@/lib/khmer-number-words";
import { numberDistractors, shuffle } from "@/lib/khmer-learning";

type Mode = "digits-to-words" | "words-to-digits";
type Style = "modern" | "traditional";
type Level = 20 | 100 | 1000 | 100000;

const LEVELS: { id: Level; en: string; km: string }[] = [
  { id: 20, en: "0–20", km: "០–២០" },
  { id: 100, en: "0–100", km: "០–១០០" },
  { id: 1000, en: "0–1,000", km: "០–១,០០០" },
  { id: 100000, en: "0–100,000", km: "០–១០០,០០០" },
];

const KH = "០១២៣៤៥៦៧៨៩";
const kh = (n: number) => String(n).replace(/\d/g, (d) => KH[Number(d)]);
const withCommas = (n: number) => n.toLocaleString("en-US");

interface Question { n: number; options: number[] }

function makeQuestion(max: number): Question {
  const n = Math.floor(Math.random() * (max + 1));
  const options = shuffle([n, ...numberDistractors(n, 3, Math.random)], Math.random);
  return { n, options };
}

export default function KhmerNumberQuiz() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState<Mode>("khmer-number-quiz:mode", "digits-to-words");
  const [style, setStyle] = useToolState<Style>("khmer-number-quiz:style", "modern");
  const [level, setLevel] = useToolState<Level>("khmer-number-quiz:level", 100);
  const [q, setQ] = useState<Question | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });

  const words = (n: number) => (style === "modern" ? convertModernBanking(String(n)) : convertTraditional(String(n)));
  const digits = (n: number) => toKhmerNumerals(withCommas(n));

  const next = () => { setQ(makeQuestion(level)); setPicked(null); };
  const restart = () => { setScore({ right: 0, total: 0 }); next(); };
  const choose = (o: number) => {
    if (!q || picked !== null) return;
    setPicked(o);
    setScore({ right: score.right + (o === q.n ? 1 : 0), total: score.total + 1 });
  };

  return (
    <ToolShell
      title="Khmer Number Reading Quiz"
      khmerTitle="ល្បែងសំណួរអានលេខខ្មែរ"
      description="Practise reading numbers in Khmer. See a number in Khmer numerals and pick how it's said in words, or read the words and pick the number. Choose the range (up to 100,000) and the modern style (ដប់ពាន់) or the traditional place names (មួយម៉ឺន). Wrong options are near-misses — swapped or changed digits — so you really have to read. Useful for learners, kids, and anyone writing cheques or contracts."
      descriptionKm="អនុវត្តការអានលេខជាភាសាខ្មែរ។ មើលលេខជាលេខខ្មែរ ហើយជ្រើសរបៀបនិយាយជាពាក្យ ឬអានពាក្យ ហើយជ្រើសលេខ។ ជ្រើសជួរ (រហូតដល់ ១០០,០០០) និងរបៀបទំនើប (ដប់ពាន់) ឬឈ្មោះខ្ទង់បែបប្រពៃណី (មួយម៉ឺន)។ ជម្រើសខុសជាលេខជិតៗ — ប្តូរ ឬផ្លាស់ខ្ទង់ — ដូច្នេះអ្នកត្រូវអានពិតៗ។ មានប្រយោជន៍សម្រាប់អ្នករៀន កុមារ និងអ្នកសរសេរមូលប្បទានបត្រ ឬកិច្ចសន្យា។"
    >
      <PillGroup label={t("Question type", "ប្រភេទសំណួរ")}>
        <Pill active={mode === "digits-to-words"} onClick={() => setMode("digits-to-words")}>{t("Number → words", "លេខ → ពាក្យ")}</Pill>
        <Pill active={mode === "words-to-digits"} onClick={() => setMode("words-to-digits")}>{t("Words → number", "ពាក្យ → លេខ")}</Pill>
      </PillGroup>
      <PillGroup label={t("Range", "ជួរ")}>
        {LEVELS.map((l) => <Pill key={l.id} active={level === l.id} onClick={() => { setLevel(l.id); setQ(null); }}>{t(l.en, l.km)}</Pill>)}
      </PillGroup>
      <PillGroup label={t("Word style", "របៀបពាក្យ")}>
        <Pill active={style === "modern"} onClick={() => setStyle("modern")}>{t("Modern (ដប់ពាន់)", "ទំនើប (ដប់ពាន់)")}</Pill>
        <Pill active={style === "traditional"} onClick={() => setStyle("traditional")}>{t("Traditional (មួយម៉ឺន)", "ប្រពៃណី (មួយម៉ឺន)")}</Pill>
      </PillGroup>

      {!q ? (
        <Button onClick={restart}>{t("Start quiz", "ចាប់ផ្តើម")}</Button>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-[var(--ink-dim)]">{t(`Score: ${score.right}/${score.total}`, `ពិន្ទុ៖ ${kh(score.right)}/${kh(score.total)}`)}</p>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-center">
            <p lang="km" className={`font-khmer text-[var(--ink)] ${mode === "digits-to-words" ? "text-5xl" : "text-2xl leading-relaxed"}`}>
              {mode === "digits-to-words" ? digits(q.n) : words(q.n)}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((o) => {
              const state = picked === null ? "idle" : o === q.n ? "right" : o === picked ? "wrong" : "idle";
              return (
                <button
                  key={o}
                  type="button"
                  lang="km"
                  disabled={picked !== null}
                  onClick={() => choose(o)}
                  className={`rounded-md border p-3 font-khmer transition ${mode === "digits-to-words" ? "text-base" : "text-2xl"} ${state === "right" ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--ink)]" : state === "wrong" ? "border-[var(--danger)]/60 bg-[var(--danger)]/10 text-[var(--ink)]" : "border-[var(--ground-line)] text-[var(--ink)] hover:border-[var(--ink-faint)]"}`}
                >
                  {mode === "digits-to-words" ? words(o) : digits(o)}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="flex flex-wrap items-center gap-3" role="status">
              <p className="text-sm text-[var(--ink-dim)]">
                {picked === q.n ? t("Correct!", "ត្រឹមត្រូវ!") : t("Not quite.", "មិនទាន់ត្រូវ។")}{" "}
                <span lang="km" className="font-khmer">{digits(q.n)} = {words(q.n)}</span>{" "}
                <span className="text-[var(--ink-faint)]">({withCommas(q.n)})</span>
              </p>
              <Button onClick={next}>{t("Next", "បន្ទាប់")}</Button>
            </div>
          )}
          <PillAction onClick={restart}><RefreshCw size={13} />{t("Restart", "ចាប់ផ្តើមឡើងវិញ")}</PillAction>
        </div>
      )}

      <SourceCredits>
        <p>{t(
          "Number words come from the same engine as the Khmer Number Spell-out tool (lib/khmer-number-words.ts): the modern style groups by thousands (ពាន់, លាន) and the traditional style uses the place names ម៉ឺន (10,000) and សែន (100,000). Spoken Khmer has more informal shortenings than shown here. Original Tools123 implementation.",
          "ពាក្យលេខមកពីម៉ាស៊ីនដូចគ្នានឹងឧបករណ៍សរសេរលេខជាអក្សរខ្មែរ (lib/khmer-number-words.ts)៖ របៀបទំនើបដាក់ជាក្រុមពាន់ (ពាន់ លាន) ហើយរបៀបប្រពៃណីប្រើឈ្មោះខ្ទង់ ម៉ឺន (១០,០០០) និង សែន (១០០,០០០)។ ភាសានិយាយមានការនិយាយកាត់ច្រើនជាងអ្វីដែលបង្ហាញនៅទីនេះ។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
