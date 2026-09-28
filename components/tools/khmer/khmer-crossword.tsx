"use client";
import { useMemo, useState } from "react";
import { Eye, EyeOff, Printer, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { STATIC_DATABASE } from "@/lib/khmer-lexicon-db";
import { splitClusters } from "@/lib/khmer-syllables";
import { bestCrossword, type CrosswordEntry } from "@/lib/khmer-games";
import { shuffle } from "@/lib/khmer-learning";
import { mulberry32 } from "@/lib/prng";
import { toKhmerNumerals } from "@/lib/khmer-number-words";

const GRID = 11;
const CLUE_MAX = 110;
const ATTEMPTS = 12;
type Source = "lexicon" | "custom";
const SAMPLE_CUSTOM = "ទឹក = sample clue: what we drink\nទឹកដោះ = sample clue: milk\nដោះស្រាយ = sample clue: to solve";

/** A lexicon definition as a clue: the answer itself is blanked out and long text is shortened. */
function clueFrom(word: string, definition: string): string {
  const masked = definition.split(word).join("＿");
  const chars = [...masked];
  return chars.length > CLUE_MAX ? `${chars.slice(0, CLUE_MAX).join("")}…` : masked;
}

function lexiconEntries(seed: number): CrosswordEntry[] {
  const rand = mulberry32(seed);
  const pool = Object.values(STATIC_DATABASE)
    .map((e) => ({ answer: e.word, clusters: splitClusters(e.word), clue: clueFrom(e.word, e.definition) }))
    .filter((e) => e.clusters.length >= 2 && e.clusters.length <= 5 && e.clue.trim());
  return shuffle(pool, rand);
}

function customEntries(text: string): CrosswordEntry[] {
  return text.split("\n").map((line) => {
    const [answer, ...rest] = line.split(/[=|]/);
    const word = (answer ?? "").trim().replace(/\s+/g, "");
    return { answer: word, clusters: splitClusters(word), clue: rest.join("=").trim() };
  }).filter((e) => e.answer);
}

export default function KhmerCrossword() {
  const { text: t } = useLanguage();
  const [source, setSource] = useToolState<Source>("khmer-crossword:source", "lexicon");
  const [count, setCount] = useToolState("khmer-crossword:count", 12);
  const [custom, setCustom] = useToolState("khmer-crossword:custom", SAMPLE_CUSTOM);
  const [seed, setSeed] = useToolState("khmer-crossword:seed", 1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [reveal, setReveal] = useState(false);

  const puzzle = useMemo(() => {
    const rand = mulberry32(seed + 7);
    // Whole-syllable crossings are rare, so the lexicon mode offers every candidate word and keeps
    // the best of several layouts, stopping at the requested number of words.
    return source === "lexicon"
      ? bestCrossword(lexiconEntries(seed), GRID, ATTEMPTS, rand, count)
      : bestCrossword(customEntries(custom), GRID, ATTEMPTS, rand);
  }, [source, count, custom, seed]);

  const regenerate = () => { setSeed(seed + 1); setAnswers({}); setChecked(false); setReveal(false); };
  const numberAt = new Map(puzzle.placements.map((p) => [`${p.row}-${p.col}`, p.number]));
  const across = puzzle.placements.filter((p) => p.across);
  const down = puzzle.placements.filter((p) => !p.across);
  const filled = puzzle.grid.flat().filter(Boolean).length;
  const correct = puzzle.grid.flatMap((line, r) => line.map((cell, c) => (cell && answers[`${r}-${c}`]?.trim() === cell ? 1 : 0))).reduce<number>((a, b) => a + b, 0);

  const clueList = (title: string, list: typeof across) => (
    <div>
      <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{title}</h3>
      <ol className="space-y-1.5 text-sm">
        {list.map((p) => (
          <li key={`${p.number}-${p.across}`} className="flex gap-2">
            <span className="w-6 shrink-0 text-right font-medium text-[var(--gold)]">{t(String(p.number), toKhmerNumerals(String(p.number)))}</span>
            <span className="min-w-0">
              <span lang="km" className="font-khmer leading-relaxed text-[var(--ink)]">{p.clue || t("(no clue)", "(គ្មានតម្រុយ)")}</span>{" "}
              <span className="text-xs text-[var(--ink-faint)]">{t(`(${p.clusters.length})`, `(${toKhmerNumerals(String(p.clusters.length))})`)}</span>
              {reveal && <span lang="km" className="ml-1 font-khmer text-[var(--teal)]">{p.answer}</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );

  return (
    <ToolShell
      title="Khmer Crossword Maker"
      khmerTitle="ឧបករណ៍បង្កើតល្បែងពាក្យខ្វែង"
      description="Make and solve Khmer crosswords where each square holds one syllable cluster. Build one from the offline lexicon (its Khmer definitions become the clues) or from your own word = clue list, solve it on screen, check your answers, and print it for class."
      descriptionKm="បង្កើត និងដោះស្រាយល្បែងពាក្យខ្វែងខ្មែរ ដែលប្រអប់នីមួយៗមានមួយព្យាង្គ។ បង្កើតពីវចនានុក្រមក្រៅបណ្តាញ (និយមន័យខ្មែររបស់វាក្លាយជាតម្រុយ) ឬពីបញ្ជីពាក្យ = តម្រុយ របស់អ្នកផ្ទាល់ ដោះស្រាយលើអេក្រង់ ពិនិត្យចម្លើយ ហើយបោះពុម្ពសម្រាប់ថ្នាក់រៀន។"
    >
      <div className="space-y-4 print:hidden">
        <PillGroup label={t("Words from", "ពាក្យពី")}>
          <Pill active={source === "lexicon"} onClick={() => { setSource("lexicon"); setAnswers({}); }}>{t("Khmer lexicon", "វចនានុក្រមខ្មែរ")}</Pill>
          <Pill active={source === "custom"} onClick={() => { setSource("custom"); setAnswers({}); }}>{t("My word list", "បញ្ជីពាក្យរបស់ខ្ញុំ")}</Pill>
        </PillGroup>
        {source === "lexicon" ? (
          <PillGroup label={t("Number of words", "ចំនួនពាក្យ")}>
            {[8, 12, 16].map((n) => <Pill key={n} active={count === n} onClick={() => { setCount(n); setAnswers({}); }}>{t(String(n), toKhmerNumerals(String(n)))}</Pill>)}
          </PillGroup>
        ) : (
          <Field label="One word per line: word = clue" labelKm="មួយពាក្យក្នុងមួយបន្ទាត់៖ ពាក្យ = តម្រុយ" hint="The lines below are only a sample — replace them with your own." hintKm="បន្ទាត់ខាងក្រោមគ្រាន់តែជាគំរូ — សូមជំនួសដោយពាក្យរបស់អ្នក។">
            <TextArea rows={6} value={custom} onChange={(e) => { setCustom(e.target.value); setAnswers({}); }} className="font-khmer" />
          </Field>
        )}
        <div className="flex flex-wrap gap-2">
          <PillAction onClick={regenerate}><RefreshCw size={13} />{t("New layout", "ប្លង់ថ្មី")}</PillAction>
          <PillAction onClick={() => setChecked(!checked)}>{checked ? t("Hide check", "លាក់ការពិនិត្យ") : t("Check answers", "ពិនិត្យចម្លើយ")}</PillAction>
          <PillAction onClick={() => setReveal(!reveal)}>{reveal ? <EyeOff size={13} /> : <Eye size={13} />}{reveal ? t("Hide answers", "លាក់ចម្លើយ") : t("Show answers", "បង្ហាញចម្លើយ")}</PillAction>
          <PillAction onClick={() => window.print()}><Printer size={13} />{t("Print", "បោះពុម្ព")}</PillAction>
        </div>
      </div>

      {puzzle.placements.length === 0 ? (
        <p className="text-sm text-[var(--ink-faint)]">{t("Add at least two words of two or more syllable clusters that share a cluster.", "បន្ថែមយ៉ាងហោចណាស់ពាក្យពីរ ដែលមានពីរព្យាង្គឡើងទៅ និងមានព្យាង្គដូចគ្នា។")}</p>
      ) : (
        <>
          {checked && <p className="text-sm text-[var(--ink-dim)] print:hidden" role="status">{t(`${correct} of ${filled} squares correct.`, `ប្រអប់ត្រឹមត្រូវ ${toKhmerNumerals(String(correct))} ក្នុងចំណោម ${toKhmerNumerals(String(filled))}។`)}</p>}
          <div className="relative overflow-x-auto">
            <div className="mx-auto grid w-max gap-0.5" style={{ gridTemplateColumns: `repeat(${puzzle.cols}, clamp(1.5rem, calc((100vw - 3rem - ${(puzzle.cols - 1) * 0.125}rem) / ${puzzle.cols}), 2.5rem))` }}>
              {puzzle.grid.flatMap((line, r) => line.map((cell, c) => {
                const key = `${r}-${c}`;
                if (!cell) return <div key={key} className="aspect-square" aria-hidden="true" />;
                const value = reveal ? cell : answers[key] ?? "";
                const state = checked && value ? (value.trim() === cell ? "border-[var(--teal)]" : "border-[var(--danger)]") : "border-[var(--ink-faint)]";
                return (
                  <div key={key} className={`relative aspect-square border bg-[var(--ground-raised)] ${state}`}>
                    {numberAt.has(key) && <span className="pointer-events-none absolute left-0.5 top-0 text-[9px] leading-none text-[var(--ink-faint)]">{numberAt.get(key)}</span>}
                    <input
                      value={value}
                      readOnly={reveal}
                      onChange={(e) => setAnswers({ ...answers, [key]: e.target.value })}
                      lang="km"
                      aria-label={t(`Row ${r + 1}, column ${c + 1}`, `ជួរដេក ${toKhmerNumerals(String(r + 1))} ជួរឈរ ${toKhmerNumerals(String(c + 1))}`)}
                      className="h-full w-full bg-transparent pt-1 text-center font-khmer text-base text-[var(--ink)] outline-none focus:bg-[var(--gold)]/15"
                    />
                  </div>
                );
              }))}
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {clueList(t("Across", "ផ្តេក"), across)}
            {clueList(t("Down", "បញ្ឈរ"), down)}
          </div>
          {puzzle.skipped.length > 0 && source === "custom" && (
            <p className="text-xs text-[var(--ink-faint)] print:hidden">
              {t("Could not fit:", "ដាក់មិនចូល៖")} <span lang="km" className="font-khmer">{puzzle.skipped.map((e) => e.answer).join(", ")}</span>
            </p>
          )}
        </>
      )}

      <SourceCredits>
        <p>{t(
          "Lexicon words and their clue definitions come from the app's offline Khmer lexicon (lib/khmer-lexicon-db.ts, compiled from Chuon Nath and Headley dictionary data); the answer is blanked out of its own clue and long definitions are shortened. Words are split into syllable clusters with the browser's Intl.Segmenter and laid out by a greedy crossing algorithm, so some words may not fit. Your answers stay on this page. Original Tools123 implementation.",
          "ពាក្យ និងនិយមន័យតម្រុយពីវចនានុក្រម មកពីវចនានុក្រមខ្មែរក្រៅបណ្តាញរបស់កម្មវិធី (lib/khmer-lexicon-db.ts ចងក្រងពីទិន្នន័យវចនានុក្រមជួន ណាត និង Headley) ចម្លើយត្រូវបានលាក់ចេញពីតម្រុយរបស់វា ហើយនិយមន័យវែងៗត្រូវបានកាត់ខ្លី។ ពាក្យត្រូវបានបំបែកជាព្យាង្គដោយ Intl.Segmenter របស់កម្មវិធីរុករក ហើយរៀបចំដោយក្បួនខ្វែងគ្នាបែបលោភលន់ ដូច្នេះពាក្យខ្លះអាចដាក់មិនចូល។ ចម្លើយរបស់អ្នកនៅតែលើទំព័រនេះ។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
