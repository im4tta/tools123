"use client";
import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import khmerWords from "@/data/khmer-words.json";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { splitClusters } from "@/lib/khmer-syllables";
import { scoreGuess, type ClusterScore } from "@/lib/khmer-learning";

const KHMER_BASE = /^[ក-ឳ]/;
const MAX_TRIES = 6;
const ALL: { word: string; clusters: string[] }[] = (khmerWords as string[])
  .map((word) => ({ word, clusters: splitClusters(word) }))
  .filter((w) => w.clusters.every((c) => KHMER_BASE.test(c)));
const BY_WORD = new Map(ALL.map((w) => [w.word, w]));

const TILE: Record<ClusterScore, string> = {
  hit: "border-[var(--gold)] bg-[var(--gold)] text-[#0a0c0d]",
  near: "border-[var(--teal)] bg-[var(--teal)]/80 text-[#0a0c0d]",
  base: "border-[var(--slate-accent)] bg-[var(--slate-accent)]/25 text-[var(--ink)]",
  miss: "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-faint)]",
};

const KH = "០១២៣៤៥៦៧៨៩";
const kh = (n: number) => String(n).replace(/\d/g, (d) => KH[Number(d)]);

export default function KhmerWordle() {
  const { text: t } = useLanguage();
  const [length, setLength] = useToolState("khmer-wordle:length", 2);
  const [stats, setStats] = useToolState("khmer-wordle:stats", { played: 0, won: 0 });
  const [answer, setAnswer] = useState<{ word: string; clusters: string[] } | null>(null);
  const [guesses, setGuesses] = useState<{ word: string; clusters: string[]; score: ClusterScore[] }[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const pool = useMemo(() => ALL.filter((w) => w.clusters.length === length), [length]);
  const won = !!answer && guesses.some((g) => g.word === answer.word);
  const lost = !!answer && !won && guesses.length >= MAX_TRIES;
  const over = won || lost;

  const newGame = () => {
    setAnswer(pool[Math.floor(Math.random() * pool.length)]);
    setGuesses([]); setInput(""); setError("");
  };

  const submit = () => {
    if (!answer || over) return;
    const word = input.trim();
    const entry = BY_WORD.get(word);
    if (!entry) { setError(t("Not in the word list — try another real word.", "មិនមានក្នុងបញ្ជីពាក្យ — សូមសាកពាក្យពិតផ្សេង។")); return; }
    if (entry.clusters.length !== answer.clusters.length) { setError(t(`Use a word with exactly ${answer.clusters.length} syllables.`, `ប្រើពាក្យដែលមាន ${kh(answer.clusters.length)} ព្យាង្គគត់។`)); return; }
    const next = [...guesses, { ...entry, score: scoreGuess(entry.clusters, answer.clusters) }];
    setGuesses(next); setInput(""); setError("");
    const nowWon = entry.word === answer.word;
    if (nowWon || next.length >= MAX_TRIES) setStats({ played: stats.played + 1, won: stats.won + (nowWon ? 1 : 0) });
  };

  const rows = answer ? Array.from({ length: MAX_TRIES }, (_, i) => guesses[i] ?? null) : [];

  return (
    <ToolShell
      title="Khmer Word Guess (Wordle-style)"
      khmerTitle="ល្បែងទាយពាក្យខ្មែរ"
      description="Guess the hidden Khmer word in six tries. Each square is a whole syllable (like ក្រ or សា), and colours tell you how close you are: gold = right syllable in the right place, teal = in the word but elsewhere, blue outline = same first letter as the syllable here. Choose 2- to 4-syllable words. A Khmer take on the popular word-guessing game."
      descriptionKm="ទាយពាក្យខ្មែរដែលលាក់ក្នុងការសាកប្រាំមួយដង។ ប្រអប់នីមួយៗជាព្យាង្គពេញ (ដូចជា ក្រ ឬ សា) ហើយពណ៌ប្រាប់ថាអ្នកជិតត្រូវប៉ុណ្ណា៖ មាស = ព្យាង្គត្រូវ នៅកន្លែងត្រូវ, បៃតង = មានក្នុងពាក្យ តែនៅកន្លែងផ្សេង, ស៊ុមខៀវ = អក្សរដំបូងដូចព្យាង្គនៅទីនេះ។ ជ្រើសពាក្យ ២ ដល់ ៤ ព្យាង្គ។ ល្បែងទាយពាក្យដ៏ពេញនិយមក្នុងទម្រង់ខ្មែរ។"
    >
      <PillGroup label={t("Word length", "ប្រវែងពាក្យ")}>
        {[2, 3, 4].map((n) => (
          <Pill key={n} active={length === n} onClick={() => { setLength(n); setAnswer(null); setGuesses([]); }}>{t(`${n} syllables`, `${kh(n)} ព្យាង្គ`)}</Pill>
        ))}
      </PillGroup>

      {!answer ? (
        <Button onClick={newGame} disabled={pool.length === 0}>{t("Start game", "ចាប់ផ្តើមល្បែង")}</Button>
      ) : (
        <div className="space-y-4">
          <div className="mx-auto w-fit space-y-1.5" lang="km">
            {rows.map((g, r) => (
              <div key={r} className="flex gap-1.5">
                {answer.clusters.map((_, c) => (
                  <div key={c} className={`flex h-14 w-14 items-center justify-center rounded-md border-2 font-khmer text-xl sm:h-16 sm:w-16 sm:text-2xl ${g ? TILE[g.score[c]] : "border-[var(--ground-line)]"}`}>
                    {g?.clusters[c] ?? ""}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {!over && (
            <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <div className="min-w-0 flex-1">
                <Field label="Your guess" labelKm="ការទាយរបស់អ្នក">
                  <TextInput value={input} onChange={(e) => setInput(e.target.value)} lang="km" className="font-khmer text-lg" autoComplete="off" />
                </Field>
              </div>
              <Button type="submit">{t("Guess", "ទាយ")}</Button>
            </form>
          )}
          {error && <p className="text-sm text-[var(--danger)]" role="alert">{error}</p>}

          {over && (
            <p className="rounded-md border border-[var(--ground-line)] p-4 text-sm text-[var(--ink)]" role="status">
              {won ? t(`You got it in ${guesses.length}!`, `អ្នកទាយត្រូវក្នុង ${kh(guesses.length)} ដង!`) : t("Out of tries. The word was", "អស់ការសាកហើយ។ ពាក្យនោះគឺ")}{" "}
              {!won && <span lang="km" className="font-khmer text-lg font-semibold text-[var(--gold)]">{answer.word}</span>}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <PillAction onClick={newGame}><RefreshCw size={13} />{t("New word", "ពាក្យថ្មី")}</PillAction>
            <span className="text-xs text-[var(--ink-faint)]">{t(`Played ${stats.played} · won ${stats.won}`, `លេង ${kh(stats.played)} · ឈ្នះ ${kh(stats.won)}`)}</span>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-[var(--ink-dim)]">
            {(["hit", "near", "base", "miss"] as const).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={`inline-block h-4 w-4 rounded border-2 ${TILE[k]}`} />
                {k === "hit" ? t("Right place", "កន្លែងត្រូវ") : k === "near" ? t("In the word", "មានក្នុងពាក្យ") : k === "base" ? t("Same first letter", "អក្សរដំបូងដូចគ្នា") : t("Not in the word", "មិនមានក្នុងពាក្យ")}
              </span>
            ))}
          </div>
        </div>
      )}

      <SourceCredits>
        <p>{t(
          "Answers and allowed guesses come from the app's offline Khmer word list (built from Chuon Nath & Headley dictionary data and the common-word POS lexicon), split into syllable clusters with the browser's Intl.Segmenter. Scoring follows the usual rules of the word-guessing genre popularised by Wordle (Josh Wardle, 2021) — repeated syllables are counted only as often as they appear — plus a Khmer-specific “same first letter” hint. Independent Tools123 implementation, not affiliated with Wordle or The New York Times. Stats are saved in this browser only.",
          "ចម្លើយ និងពាក្យដែលអាចទាយបានមកពីបញ្ជីពាក្យខ្មែរក្រៅបណ្តាញរបស់កម្មវិធី (បង្កើតពីទិន្នន័យវចនានុក្រមជួន ណាត និង Headley និងវចនានុក្រមពាក្យធម្មតា) បំបែកជាព្យាង្គដោយ Intl.Segmenter របស់កម្មវិធីរុករក។ ការដាក់ពិន្ទុធ្វើតាមច្បាប់ធម្មតានៃល្បែងទាយពាក្យដែល Wordle (Josh Wardle, ២០២១) ធ្វើឱ្យល្បី — ព្យាង្គដដែលៗរាប់តែប៉ុន្មានដងដែលវាមាន — បូកនឹងជំនួយ «អក្សរដំបូងដូចគ្នា» សម្រាប់ខ្មែរ។ ការអនុវត្តឯករាជ្យរបស់ Tools123 មិនពាក់ព័ន្ធនឹង Wordle ឬ The New York Times ទេ។ ស្ថិតិរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
