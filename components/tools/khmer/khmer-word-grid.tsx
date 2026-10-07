"use client";
import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Undo2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { splitClusters } from "@/lib/khmer-syllables";
import { buildWordGrid, gridNeighbors, solveWordGrid } from "@/lib/khmer-word-games";
import { toKhmerNumerals } from "@/lib/khmer-number-words";
import khmerWords from "@/data/khmer-words.json";

const N = 4;
const kh = (n: number) => toKhmerNumerals(String(n));
let dictionary: string[][] | null = null;
const dict = () => (dictionary ??= (khmerWords as string[]).map((w) => splitClusters(w)));

type Limit = 0 | 120 | 180;

export default function KhmerWordGrid() {
  const { text: t } = useLanguage();
  const [limit, setLimit] = useToolState<Limit>("khmer-word-grid:limit", 180);
  const [best, setBest] = useToolState("khmer-word-grid:best", 0);
  const [grid, setGrid] = useState<string[] | null>(null);
  const [path, setPath] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [left, setLeft] = useState(0);
  const [ended, setEnded] = useState(false);

  const answers = useMemo(() => (grid ? solveWordGrid(grid, N, dict()) : []), [grid]);
  const playing = Boolean(grid) && !ended;

  useEffect(() => {
    if (!playing || !limit) return;
    const id = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [playing, limit]);

  useEffect(() => {
    if (playing && limit && left === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEnded(true);
      if (found.length > best) setBest(found.length);
    }
  }, [playing, limit, left, found.length, best, setBest]);

  const start = () => {
    const d = dict();
    let g = buildWordGrid(d, N, 6, d.flat(), Math.random);
    // A few retries keep the grid from being too sparse to be fun.
    for (let i = 0; i < 5 && solveWordGrid(g, N, d).length < 8; i++) g = buildWordGrid(d, N, 6, d.flat(), Math.random);
    setGrid(g); setPath([]); setFound([]); setMessage(""); setEnded(false); setLeft(limit);
  };

  const tap = (cell: number) => {
    if (!playing) return;
    if (path.at(-1) === cell) { setPath(path.slice(0, -1)); return; }
    if (path.includes(cell)) return;
    if (path.length && !gridNeighbors(path.at(-1)!, N).includes(cell)) { setPath([cell]); return; }
    setPath([...path, cell]);
  };

  const word = grid ? path.map((i) => grid[i]).join("") : "";
  const submit = () => {
    if (!word) return;
    if (path.length < 2) setMessage(t("Use at least two squares.", "ប្រើយ៉ាងហោចណាស់ពីរប្រអប់។"));
    else if (found.includes(word)) setMessage(t("Already found.", "បានរកឃើញរួចហើយ។"));
    else if (!answers.includes(word)) setMessage(t("Not in the offline word list.", "មិនមានក្នុងបញ្ជីពាក្យក្រៅបណ្តាញទេ។"));
    else { setFound([word, ...found]); setMessage(t("Found!", "រកឃើញ!")); }
    setPath([]);
  };

  const finish = () => { setEnded(true); if (found.length > best) setBest(found.length); };
  const timeText = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <ToolShell
      title="Khmer Word Grid"
      khmerTitle="ល្បែងរកពាក្យក្នុងក្រឡា"
      description="Find Khmer words hidden in a 4×4 grid of syllables by tapping touching squares — sideways, up, down or diagonally — without reusing a square. Play against the clock or untimed; at the end, see every word the grid held."
      descriptionKm="រកពាក្យខ្មែរដែលលាក់ក្នុងក្រឡាព្យាង្គ ៤×៤ ដោយចុចប្រអប់ដែលនៅជាប់គ្នា — ឆ្វេងស្តាំ លើក្រោម ឬទ្រេត — ដោយមិនប្រើប្រអប់ដដែលពីរដង។ លេងប្រកួតនឹងពេលវេលា ឬគ្មានកំណត់ពេល ហើយនៅទីបញ្ចប់ មើលពាក្យទាំងអស់ដែលមានក្នុងក្រឡា។"
    >
      <PillGroup label={t("Time limit", "កំណត់ពេល")}>
        {([120, 180, 0] as const).map((s) => (
          <Pill key={s} active={limit === s} onClick={() => setLimit(s)}>{s ? t(`${s / 60} min`, `${kh(s / 60)} នាទី`) : t("Untimed", "គ្មានកំណត់")}</Pill>
        ))}
      </PillGroup>

      {!grid ? (
        <Button onClick={start}>{t("New grid", "ក្រឡាថ្មី")}</Button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-[var(--ink-dim)]" role="status">
            <span>{t(`${found.length} found · best ${best}`, `រកឃើញ ${kh(found.length)} · ល្អបំផុត ${kh(best)}`)}</span>
            {limit > 0 && !ended && <span className={`font-mono-ui ${left <= 15 ? "text-[var(--danger)]" : ""}`}>{timeText}</span>}
          </div>

          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2 text-center">
            <p lang="km" className="min-h-[2.4rem] font-khmer text-3xl leading-[1.6] text-[var(--ink)]">{word || <span className="text-[var(--ink-faint)]">…</span>}</p>
            {message && <p className="text-sm text-[var(--ink-dim)]">{message}</p>}
          </div>

          <div className="mx-auto grid max-w-xs grid-cols-4 gap-2" aria-label={t("Syllable grid", "ក្រឡាព្យាង្គ")}>
            {grid.map((cell, i) => {
              const at = path.indexOf(i);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!playing}
                  onClick={() => tap(i)}
                  aria-pressed={at >= 0}
                  className={`relative flex aspect-square items-center justify-center rounded-lg border font-khmer text-3xl leading-[1.6] transition active:scale-95 ${at >= 0 ? "border-[var(--gold)] bg-[var(--gold)]/20 text-[var(--ink)]" : "border-[var(--ground-line)] bg-[var(--ground)] text-[var(--ink)]"}`}
                >
                  <span lang="km">{cell}</span>
                  {at >= 0 && <span className="absolute right-1 top-0.5 text-[10px] text-[var(--gold)]">{at + 1}</span>}
                </button>
              );
            })}
          </div>

          {playing && (
            <div className="flex flex-wrap justify-center gap-2">
              <PillAction onClick={() => setPath(path.slice(0, -1))} disabled={!path.length}><Undo2 size={13} />{t("Back", "ថយ")}</PillAction>
              <Button onClick={submit} disabled={path.length === 0}>{t("Submit word", "បញ្ជូនពាក្យ")}</Button>
              <PillAction onClick={finish}>{t("Finish", "បញ្ចប់")}</PillAction>
            </div>
          )}

          {found.length > 0 && (
            <p lang="km" className="flex flex-wrap gap-1.5 font-khmer text-lg">
              {found.map((w) => <span key={w} className="rounded bg-[var(--ground-raised)] px-2 text-[var(--ink)]">{w}</span>)}
            </p>
          )}

          {ended && (
            <div className="space-y-2" role="status">
              <p className="text-sm text-[var(--ink)]">{t(`You found ${found.length} of ${answers.length} words.`, `អ្នករកឃើញ ${kh(found.length)} ក្នុងចំណោម ${kh(answers.length)} ពាក្យ។`)}</p>
              <p lang="km" className="flex flex-wrap gap-1.5 font-khmer text-base">
                {answers.map((w) => <span key={w} className={found.includes(w) ? "text-[var(--teal)]" : "text-[var(--ink-dim)]"}>{w}</span>)}
              </p>
            </div>
          )}
          <PillAction onClick={start}><RefreshCw size={13} />{t("New grid", "ក្រឡាថ្មី")}</PillAction>
        </div>
      )}

      <SourceCredits>
        <p>{t(
          "Words come from the app's offline Khmer word list (built from Chuon Nath & Headley dictionary data and the common-word lexicon), split into syllable clusters with the browser's Intl.Segmenter. Each grid is seeded with a few real words along touching paths and the rest is filled with syllables from the same list; every possible word is found by a depth-first search. Inspired by the classic letter-grid word game; original Tools123 implementation for Khmer. Your best score is saved in this browser only.",
          "ពាក្យមកពីបញ្ជីពាក្យខ្មែរក្រៅបណ្តាញរបស់កម្មវិធី (បង្កើតពីទិន្នន័យវចនានុក្រមជួន ណាត និង Headley និងវចនានុក្រមពាក្យធម្មតា) បំបែកជាព្យាង្គដោយ Intl.Segmenter របស់កម្មវិធីរុករក។ ក្រឡានីមួយៗដាក់ពាក្យពិតមួយចំនួនតាមផ្លូវដែលនៅជាប់គ្នា ហើយប្រអប់ដែលនៅសល់បំពេញដោយព្យាង្គពីបញ្ជីដដែល។ ពាក្យដែលអាចមានទាំងអស់រកឃើញដោយការស្វែងរកតាមជម្រៅ។ បំផុសគំនិតពីល្បែងពាក្យក្រឡាអក្សរបុរាណ។ ការអនុវត្តដើមរបស់ Tools123 សម្រាប់ភាសាខ្មែរ។ ពិន្ទុល្អបំផុតរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
