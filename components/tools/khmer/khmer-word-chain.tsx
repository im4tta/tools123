"use client";
import { useMemo, useState } from "react";
import { Lightbulb, RefreshCw } from "lucide-react";
import khmerWords from "@/data/khmer-words.json";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { splitClusters } from "@/lib/khmer-syllables";
import { chainKey, continuesChain, type ChainRule } from "@/lib/khmer-learning";

const KHMER_BASE = /^[ក-ឳ]/;
// Dictionary words of 2+ clusters, pre-split once.
const WORDS: { word: string; clusters: string[] }[] = (khmerWords as string[])
  .map((word) => ({ word, clusters: splitClusters(word) }))
  .filter((w) => w.clusters.length >= 2 && KHMER_BASE.test(w.clusters[0]));
const BY_WORD = new Map(WORDS.map((w) => [w.word, w]));

type Turn = { word: string; by: "you" | "cpu" };
type Status = "idle" | "playing" | "you-won" | "cpu-won";

function candidates(prev: string[], rule: ChainRule, used: Set<string>) {
  return WORDS.filter((w) => !used.has(w.word) && continuesChain(prev, w.clusters, rule));
}

const KH = "០១២៣៤៥៦៧៨៩";
const kh = (n: number) => String(n).replace(/\d/g, (d) => KH[Number(d)]);

export default function KhmerWordChain() {
  const { text: t } = useLanguage();
  const [rule, setRule] = useToolState<ChainRule>("khmer-word-chain:rule", "letter");
  const [wins, setWins] = useToolState("khmer-word-chain:wins", 0);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");

  const used = useMemo(() => new Set(turns.map((x) => x.word)), [turns]);
  const last = turns[turns.length - 1];
  const lastClusters = last ? BY_WORD.get(last.word)?.clusters ?? splitClusters(last.word) : [];
  const key = last ? chainKey(lastClusters, rule) : "";

  const start = () => {
    // Open with a word the player can actually answer.
    const openers = WORDS.filter((w) => candidates(w.clusters, rule, new Set([w.word])).length > 0);
    const first = openers[Math.floor(Math.random() * openers.length)];
    setTurns([{ word: first.word, by: "cpu" }]);
    setStatus("playing");
    setInput(""); setError(""); setHint("");
  };

  const play = () => {
    const word = input.trim();
    if (!word || status !== "playing") return;
    const entry = BY_WORD.get(word);
    if (!entry) { setError(t("That word isn't in the game dictionary (2+ syllables). Try another.", "ពាក្យនោះមិនមានក្នុងវចនានុក្រមល្បែង (២ ព្យាង្គឡើងទៅ)។ សូមសាកពាក្យផ្សេង។")); return; }
    if (used.has(word)) { setError(t("That word was already used.", "ពាក្យនោះត្រូវបានប្រើរួចហើយ។")); return; }
    if (!continuesChain(lastClusters, entry.clusters, rule)) { setError(t(`Your word must start with “${key}”.`, `ពាក្យរបស់អ្នកត្រូវចាប់ផ្តើមដោយ «${key}»។`)); return; }
    const afterYou = [...turns, { word, by: "you" as const }];
    const usedNow = new Set(afterYou.map((x) => x.word));
    const options = candidates(entry.clusters, rule, usedNow);
    setInput(""); setError(""); setHint("");
    if (options.length === 0) {
      setTurns(afterYou);
      setStatus("you-won");
      setWins(wins + 1);
      return;
    }
    const reply = options[Math.floor(Math.random() * options.length)];
    const afterCpu = [...afterYou, { word: reply.word, by: "cpu" as const }];
    setTurns(afterCpu);
    // If you now have no possible move, the computer wins.
    if (candidates(reply.clusters, rule, new Set(afterCpu.map((x) => x.word))).length === 0) setStatus("cpu-won");
  };

  const showHint = () => {
    const options = candidates(lastClusters, rule, used);
    if (options.length) setHint(options[Math.floor(Math.random() * options.length)].word);
  };

  const yourMoves = turns.filter((x) => x.by === "you").length;

  return (
    <ToolShell
      title="Khmer Word Chain Game"
      khmerTitle="ល្បែងតពាក្យខ្មែរ"
      description="Play the classic word-chain game in Khmer against the computer: each new word must begin where the last word ended — with its last syllable, or (the easier rule) the same first letter as that syllable. No repeats. Run the computer out of words to win. Great for building vocabulary with friends, students, or on your own."
      descriptionKm="លេងល្បែងតពាក្យជាភាសាខ្មែរជាមួយកុំព្យូទ័រ៖ ពាក្យថ្មីនីមួយៗត្រូវចាប់ផ្តើមនៅកន្លែងដែលពាក្យមុនបញ្ចប់ — ដោយព្យាង្គចុងក្រោយរបស់វា ឬ (ច្បាប់ងាយជាង) អក្សរដំបូងដូចព្យាង្គនោះ។ មិនអាចប្រើពាក្យដដែលៗ។ ធ្វើឱ្យកុំព្យូទ័រអស់ពាក្យដើម្បីឈ្នះ។ ល្អសម្រាប់ពង្រីកវាក្យសព្ទជាមួយមិត្តភក្តិ សិស្ស ឬលេងម្នាក់ឯង។"
    >
      <PillGroup label={t("Rule", "ច្បាប់")}>
        <Pill active={rule === "letter"} onClick={() => setRule("letter")}>{t("Same first letter (easier)", "អក្សរដំបូងដូចគ្នា (ងាយជាង)")}</Pill>
        <Pill active={rule === "cluster"} onClick={() => setRule("cluster")}>{t("Same syllable (harder)", "ព្យាង្គដូចគ្នា (ពិបាកជាង)")}</Pill>
      </PillGroup>

      {status === "idle" ? (
        <Button onClick={start}>{t("Start game", "ចាប់ផ្តើមល្បែង")}</Button>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" aria-live="polite">
            {turns.map((x, i) => (
              <span key={i} lang="km" className={`rounded-md border px-2.5 py-1 font-khmer text-lg ${x.by === "you" ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--ink)]" : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink)]"}`}>
                {x.word}
              </span>
            ))}
          </div>

          {status === "playing" && (
            <>
              <p className="text-sm text-[var(--ink-dim)]">
                {t("Your turn — start your word with", "វេនអ្នក — ចាប់ផ្តើមពាក្យរបស់អ្នកដោយ")} <span lang="km" className="font-khmer text-2xl font-semibold text-[var(--gold)]">{key}</span>
              </p>
              <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); play(); }}>
                <div className="min-w-0 flex-1">
                  <Field label="Your word" labelKm="ពាក្យរបស់អ្នក">
                    <TextInput value={input} onChange={(e) => setInput(e.target.value)} lang="km" className="font-khmer text-lg" autoComplete="off" />
                  </Field>
                </div>
                <Button type="submit">{t("Play", "លេង")}</Button>
              </form>
              {error && <p className="text-sm text-[var(--danger)]" role="alert">{error}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <PillAction onClick={showHint}><Lightbulb size={13} />{t("Hint", "ជំនួយ")}</PillAction>
                {hint && <span lang="km" className="font-khmer text-[var(--ink-dim)]">{t("Try:", "សាក៖")} {hint}</span>}
              </div>
            </>
          )}

          {status !== "playing" && (
            <p className={`rounded-md border p-4 text-sm ${status === "you-won" ? "border-[var(--gold)] text-[var(--ink)]" : "border-[var(--ground-line)] text-[var(--ink-dim)]"}`} role="status">
              {status === "you-won"
                ? t(`You win! The computer has no word left. You played ${yourMoves} words.`, `អ្នកឈ្នះ! កុំព្យូទ័រអស់ពាក្យ។ អ្នកបានលេង ${kh(yourMoves)} ពាក្យ។`)
                : t(`The computer wins — no dictionary word is left for “${key}”. You played ${yourMoves} words.`, `កុំព្យូទ័រឈ្នះ — គ្មានពាក្យក្នុងវចនានុក្រមសម្រាប់ «${key}» ទៀតទេ។ អ្នកបានលេង ${kh(yourMoves)} ពាក្យ។`)}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <PillAction onClick={start}><RefreshCw size={13} />{t("New game", "ល្បែងថ្មី")}</PillAction>
            <span className="text-xs text-[var(--ink-faint)]">{t(`Games won: ${wins}`, `ឈ្នះ៖ ${kh(wins)} ដង`)}</span>
          </div>
        </div>
      )}

      <SourceCredits>
        <p>{t(
          `Words are checked against the app's offline Khmer word list (${WORDS.length} words of two or more syllables, built from Chuon Nath & Headley dictionary data and the common-word POS lexicon) and split into syllables with the browser's Intl.Segmenter. A real word that isn't in the list will be rejected — the list is not exhaustive. Word chain is a widely played word game; this is an original Tools123 implementation. Wins are saved in this browser only.`,
          `ពាក្យត្រូវផ្ទៀងផ្ទាត់នឹងបញ្ជីពាក្យខ្មែរក្រៅបណ្តាញរបស់កម្មវិធី (${kh(WORDS.length)} ពាក្យដែលមានពីរព្យាង្គឡើងទៅ បង្កើតពីទិន្នន័យវចនានុក្រមជួន ណាត និង Headley និងវចនានុក្រមពាក្យធម្មតា) ហើយបំបែកជាព្យាង្គដោយ Intl.Segmenter របស់កម្មវិធីរុករក។ ពាក្យពិតដែលមិនមានក្នុងបញ្ជីនឹងត្រូវបដិសេធ — បញ្ជីនេះមិនពេញលេញទេ។ ល្បែងតពាក្យជាល្បែងពាក្យដែលគេលេងទូទៅ នេះជាការអនុវត្តដើមរបស់ Tools123។ ចំនួនឈ្នះរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។`,
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
