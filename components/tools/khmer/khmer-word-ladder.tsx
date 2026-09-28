"use client";
import { useMemo, useState } from "react";
import { Lightbulb, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { splitClusters } from "@/lib/khmer-syllables";
import { buildLadderIndex, findLadder, isLadderStep, pickLadderPuzzle, type LadderIndex } from "@/lib/khmer-games";
import { toKhmerNumerals } from "@/lib/khmer-number-words";
import khmerWords from "@/data/khmer-words.json";

let cachedIndex: LadderIndex | null = null;
function ladderIndex(): LadderIndex {
  cachedIndex ??= buildLadderIndex((khmerWords as string[]).map((w) => splitClusters(w)));
  return cachedIndex;
}

type Mode = "play" | "solve";
const kh = (n: number) => toKhmerNumerals(String(n));

function Chain({ words, target }: { words: string[]; target?: string }) {
  return (
    <ol className="flex flex-wrap items-center gap-1.5">
      {words.map((w, i) => (
        <li key={`${w}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden="true" className="text-[var(--ink-faint)]">→</span>}
          <span lang="km" className={`rounded-md border px-2.5 py-1 font-khmer text-2xl leading-[1.6] ${w === target ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]" : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink)]"}`}>{w}</span>
        </li>
      ))}
    </ol>
  );
}

export default function KhmerWordLadder() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState<Mode>("khmer-word-ladder:mode", "play");
  const [length, setLength] = useToolState<2 | 3>("khmer-word-ladder:length", 2);
  const [puzzle, setPuzzle] = useState<string[] | null>(null);
  const [chain, setChain] = useState<string[]>([]);
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState("");
  const [gaveUp, setGaveUp] = useState(false);
  const [from, setFrom] = useToolState("khmer-word-ladder:from", "");
  const [to, setTo] = useToolState("khmer-word-ladder:to", "");

  const newPuzzle = (len: 2 | 3 = length) => {
    const p = pickLadderPuzzle(ladderIndex(), len, len === 2 ? 3 : 2, len === 2 ? 5 : 4, Math.random);
    setPuzzle(p);
    setChain(p ? [p[0]] : []);
    setGuess("");
    setMessage(p ? "" : t("Could not find a puzzle this time — try again.", "រកល្បែងមិនឃើញលើកនេះទេ — សូមសាកម្តងទៀត។"));
    setGaveUp(false);
  };

  const target = puzzle?.at(-1) ?? "";
  const current = chain.at(-1) ?? "";
  const won = Boolean(puzzle) && current === target && chain.length > 1;

  const submit = () => {
    const word = guess.trim();
    if (!word || !puzzle || won) return;
    const index = ladderIndex();
    const clusters = index.words.get(word);
    if (!clusters) { setMessage(t("That word is not in the offline word list.", "ពាក្យនេះមិនមាននៅក្នុងបញ្ជីពាក្យក្រៅបណ្តាញទេ។")); return; }
    if (!isLadderStep(index.words.get(current)!, clusters)) { setMessage(t("Change exactly one syllable cluster, keeping the rest in place.", "ប្តូរតែមួយព្យាង្គប៉ុណ្ណោះ ហើយរក្សាផ្នែកផ្សេងនៅដដែល។")); return; }
    if (chain.includes(word)) { setMessage(t("You have already used that word.", "អ្នកបានប្រើពាក្យនេះរួចហើយ។")); return; }
    setChain([...chain, word]);
    setGuess("");
    setMessage("");
  };

  const hint = () => {
    if (!puzzle || won) return;
    const path = findLadder(current, target, ladderIndex());
    setMessage(path && path.length > 1 ? t(`Try: ${path[1]}`, `សាក៖ ${path[1]}`) : t("No path from here — undo a step.", "គ្មានផ្លូវពីទីនេះទេ — សូមថយក្រោយមួយជំហាន។"));
  };

  const solved = useMemo(() => {
    if (mode !== "solve" || !from.trim() || !to.trim()) return null;
    const index = ladderIndex();
    const a = from.trim(), b = to.trim();
    if (!index.words.has(a) || !index.words.has(b)) return { error: t("Both words must be in the offline word list.", "ពាក្យទាំងពីរត្រូវតែមាននៅក្នុងបញ្ជីពាក្យក្រៅបណ្តាញ។") };
    if (index.words.get(a)!.length !== index.words.get(b)!.length) return { error: t("Both words need the same number of syllable clusters.", "ពាក្យទាំងពីរត្រូវមានចំនួនព្យាង្គដូចគ្នា។") };
    const path = findLadder(a, b, index);
    return path ? { path } : { error: t("No ladder connects these words in the word list.", "គ្មានជណ្ដើរភ្ជាប់ពាក្យទាំងនេះក្នុងបញ្ជីពាក្យទេ។") };
  }, [mode, from, to, t]);

  return (
    <ToolShell
      title="Khmer Word Ladder"
      khmerTitle="ល្បែងជណ្ដើរពាក្យខ្មែរ"
      description="Climb from one Khmer word to another by changing one syllable cluster at a time, where every step must be a real word from the offline word list. Play a random puzzle with hints, or use the solver to find the shortest ladder between two words."
      descriptionKm="ឡើងពីពាក្យខ្មែរមួយទៅពាក្យមួយទៀត ដោយប្តូរតែមួយព្យាង្គម្តងៗ ហើយជំហាននីមួយៗត្រូវតែជាពាក្យពិតពីបញ្ជីពាក្យក្រៅបណ្តាញ។ លេងល្បែងចៃដន្យដែលមានជំនួយ ឬប្រើកម្មវិធីដោះស្រាយដើម្បីរកជណ្ដើរខ្លីបំផុតរវាងពាក្យពីរ។"
    >
      <PillGroup label={t("Mode", "របៀប")}>
        <Pill active={mode === "play"} onClick={() => setMode("play")}>{t("Play", "លេង")}</Pill>
        <Pill active={mode === "solve"} onClick={() => setMode("solve")}>{t("Solver", "ដោះស្រាយ")}</Pill>
      </PillGroup>

      {mode === "play" ? (
        <div className="space-y-4">
          <PillGroup label={t("Word length", "ប្រវែងពាក្យ")}>
            {([2, 3] as const).map((n) => (
              <Pill key={n} active={length === n} onClick={() => { setLength(n); newPuzzle(n); }}>{t(`${n} clusters`, `${kh(n)} ព្យាង្គ`)}</Pill>
            ))}
          </PillGroup>
          {!puzzle ? (
            <div className="space-y-2">
              <Button onClick={() => newPuzzle()}>{t("New puzzle", "ល្បែងថ្មី")}</Button>
              {message && <p className="text-sm text-[var(--danger)]" role="alert">{message}</p>}
            </div>
          ) : (
            <>
              <p className="text-sm text-[var(--ink-dim)]">
                {t("From", "ពី")} <span lang="km" className="font-khmer text-lg text-[var(--ink)]">{puzzle[0]}</span> {t("to", "ទៅ")}{" "}
                <span lang="km" className="font-khmer text-lg text-[var(--gold)]">{target}</span>{" "}
                · {t(`shortest: ${puzzle.length - 1} steps`, `ខ្លីបំផុត៖ ${kh(puzzle.length - 1)} ជំហាន`)}
              </p>
              <Chain words={chain} target={target} />
              {won ? (
                <p className="rounded-md border border-[var(--gold)] p-3 text-sm text-[var(--ink)]" role="status">
                  {t(`Solved in ${chain.length - 1} steps (shortest ${puzzle.length - 1}).`, `ដោះស្រាយបានក្នុង ${kh(chain.length - 1)} ជំហាន (ខ្លីបំផុត ${kh(puzzle.length - 1)})។`)}
                </p>
              ) : gaveUp ? (
                <div className="space-y-2" role="status">
                  <p className="text-xs uppercase tracking-wide text-[var(--ink-dim)]">{t("One shortest ladder", "ជណ្ដើរខ្លីបំផុតមួយ")}</p>
                  <Chain words={puzzle} target={target} />
                </div>
              ) : (
                <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
                  <div className="min-w-0 flex-1">
                    <TextInput value={guess} onChange={(e) => setGuess(e.target.value)} lang="km" aria-label={t("Next word", "ពាក្យបន្ទាប់")} placeholder={t("Next word…", "ពាក្យបន្ទាប់…")} className="font-khmer text-lg" />
                  </div>
                  <Button type="submit">{t("Add", "បន្ថែម")}</Button>
                </form>
              )}
              {message && !won && <p className="text-sm text-[var(--ink-dim)]" role="status">{message}</p>}
              <div className="flex flex-wrap gap-2">
                {!won && !gaveUp && <PillAction onClick={hint}><Lightbulb size={13} />{t("Hint", "ជំនួយ")}</PillAction>}
                {!won && !gaveUp && chain.length > 1 && <PillAction onClick={() => { setChain(chain.slice(0, -1)); setMessage(""); }}>{t("Undo", "ថយក្រោយ")}</PillAction>}
                {!won && !gaveUp && <PillAction onClick={() => setGaveUp(true)}>{t("Show answer", "បង្ហាញចម្លើយ")}</PillAction>}
                <PillAction onClick={() => newPuzzle()}><RefreshCw size={13} />{t("New puzzle", "ល្បែងថ្មី")}</PillAction>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Row>
            <Field label="Start word" labelKm="ពាក្យចាប់ផ្តើម"><TextInput value={from} onChange={(e) => setFrom(e.target.value)} lang="km" className="font-khmer text-lg" placeholder="e.g. កង" /></Field>
            <Field label="End word" labelKm="ពាក្យបញ្ចប់"><TextInput value={to} onChange={(e) => setTo(e.target.value)} lang="km" className="font-khmer text-lg" placeholder="e.g. ចង" /></Field>
          </Row>
          {solved && ("path" in solved && solved.path ? (
            <div className="space-y-2" role="status">
              <p className="text-xs uppercase tracking-wide text-[var(--ink-dim)]">{t(`Shortest ladder: ${solved.path.length - 1} steps`, `ជណ្ដើរខ្លីបំផុត៖ ${kh(solved.path.length - 1)} ជំហាន`)}</p>
              <Chain words={solved.path} target={solved.path.at(-1)} />
            </div>
          ) : (
            <p className="text-sm text-[var(--ink-dim)]" role="status">{"error" in solved ? solved.error : ""}</p>
          ))}
        </div>
      )}

      <SourceCredits>
        <p>{t(
          "Words come from the app's offline Khmer word list (built from Chuon Nath & Headley dictionary data and the common-word lexicon), split into syllable clusters with the browser's Intl.Segmenter, so a step swaps one whole cluster (consonant with its vowel and signs). Shortest ladders are found by breadth-first search. The word-ladder puzzle comes from Lewis Carroll’s “Doublets” (published 1879); this is an independent Tools123 implementation for Khmer.",
          "ពាក្យមកពីបញ្ជីពាក្យខ្មែរក្រៅបណ្តាញរបស់កម្មវិធី (បង្កើតពីទិន្នន័យវចនានុក្រមជួន ណាត និង Headley និងវចនានុក្រមពាក្យធម្មតា) បំបែកជាព្យាង្គដោយ Intl.Segmenter របស់កម្មវិធីរុករក ដូច្នេះជំហានមួយប្តូរព្យាង្គមួយទាំងមូល (ព្យញ្ជនៈជាមួយស្រៈ និងសញ្ញា)។ ជណ្ដើរខ្លីបំផុតរកឃើញដោយការស្វែងរកតាមទទឹង (BFS)។ ល្បែងជណ្ដើរពាក្យមកពី «Doublets» របស់ Lewis Carroll (បោះពុម្ពឆ្នាំ ១៨៧៩) នេះជាការអនុវត្តឯករាជ្យរបស់ Tools123 សម្រាប់ភាសាខ្មែរ។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
