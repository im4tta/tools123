"use client";
import { useMemo, useState } from "react";
import { ToolShell } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

const WORDS = [
  "crane", "slice", "brine", "chart", "shade", "plume", "glade", "spice", "prone", "quake",
  "brave", "charm", "draft", "flame", "grain", "haste", "ivory", "jolly", "knack", "latch",
  "moist", "noble", "ocean", "pixel", "query", "raven", "scout", "tramp", "ultra", "vivid",
  "waltz", "xenon", "yield", "zesty", "amber", "bliss", "cider", "dwarf", "ember", "fable",
];

export default function WordleHelper() {
  const { text: t } = useLanguage();
  const [guesses, setGuesses] = useState<{ word: string; feedback: string }[]>([]);
  const [current, setCurrent] = useState("");

  const filter = useMemo(() => {
    const greens: Record<number, string> = {};
    const yellows: string[] = [];
    const grays = new Set<string>();
    const greenCounts: Record<string, number> = {};
    guesses.forEach((g) => {
      const fb = g.feedback.split("");
      fb.forEach((f, i) => {
        const ch = g.word[i];
        if (f === "g") {
          greens[i] = ch;
          greenCounts[ch] = (greenCounts[ch] ?? 0) + 1;
        } else if (f === "y") {
          yellows.push(ch);
        } else {
          grays.add(ch);
        }
      });
    });

    return WORDS.filter((w) => {
      const wordArr = w.split("");
      for (let i = 0; i < 5; i++) {
        if (greens[i] && wordArr[i] !== greens[i]) return false;
        if (grays.has(wordArr[i]) && !(greens[i] === wordArr[i])) return false;
      }
      for (const y of yellows) if (!w.includes(y)) return false;
      for (const [ch, count] of Object.entries(greenCounts)) {
        if ((w.match(new RegExp(ch, "g")) ?? []).length < count) return false;
      }
      return true;
    });
  }, [guesses]);

  const commit = () => {
    const w = current.trim().toLowerCase();
    if (w.length !== 5 || !WORDS.includes(w)) return;
    setGuesses((g) => [...g, { word: w, feedback: "yyyyy" }]);
    setCurrent("");
  };

  const removeGuess = (i: number) => setGuesses((g) => g.filter((_, idx) => idx !== i));

  const COLOR: Record<string, string> = {
    g: "bg-[var(--green)]/20 text-[var(--green)]",
    y: "bg-[var(--gold)]/20 text-[var(--gold)]",
    x: "bg-[var(--ground-line)] text-[var(--ink-faint)]",
  };

  return (
    <ToolShell
      title="Wordle Solver Helper"
      khmerTitle="អ្នកជំនួយ Wordle"
      description="Filter a 5-letter word list by your green / yellow / gray Wordle feedback."
      descriptionKm="ច្រោះបញ្ជីពាក្យ ៥ តួអក្សរតាមពណ៌បៃតង / លឿង / ប្រផេះរបស់ Wordle។"
    >
      <div className="flex flex-wrap gap-2">
        <input
          value={current}
          onChange={(e) => setCurrent(e.target.value.toLowerCase().replace(/[^a-z]/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
          maxLength={5}
          placeholder={t("Your guess", "ពាក្យស្មានរបស់អ្នក")}
          className="w-40 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 font-mono-ui text-lg uppercase tracking-[0.3em] text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]"
        />
        <button
          type="button"
          onClick={commit}
          disabled={current.length !== 5 || !WORDS.includes(current)}
          className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[var(--ground-base)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("Add guess", "បន្ថែមពាក្យ")}
        </button>
      </div>

      <div className="space-y-2">
        {guesses.map((g, gi) => (
          <div key={gi} className="flex items-center gap-2">
            <div className="flex gap-1">
              {g.word.split("").map((ch, ci) => (
                <button
                  key={ci}
                  type="button"
                  title={t("Tap to cycle feedback", "ប៉ះដើម្បីប្ដូរពណ៌")}
                  onClick={() =>
                    setGuesses((gs) =>
                      gs.map((gg, idx) => {
                        if (idx !== gi) return gg;
                        const cycle: Record<string, string> = { g: "y", y: "x", x: "g" };
                        const fb = gg.feedback.split("");
                        fb[ci] = cycle[fb[ci]];
                        return { ...gg, feedback: fb.join("") };
                      }),
                    )
                  }
                  className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded font-mono-ui text-sm font-semibold uppercase transition hover:scale-110 ${COLOR[g.feedback[ci]]}`}
                >
                  {ch}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => removeGuess(gi)} className="text-xs text-[var(--danger)] hover:underline">
              {t("remove", "លុប")}
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
          {t("Possible words", "ពាក្យដែលអាច")} — {filter.length}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {filter.map((w) => (
            <span key={w} className="rounded bg-[var(--ground-line)]/60 px-2 py-1 font-mono-ui text-sm uppercase text-[var(--ink)]">
              {w}
            </span>
          ))}
          {filter.length === 0 && <span className="text-sm text-[var(--danger)]">{t("No matching words.", "គ្មានពាក្យដែលត្រូវគ្នាទេ។")}</span>}
        </div>
      </div>
      <p className="text-xs text-[var(--ink-faint)]">{t("Tip: add each guess, then tap the letters to cycle 🟩 🟨 ⬜ feedback.", "គន្លឹះ៖ បន្ថែមពាក្យនីមួយៗ រួចប៉ះអក្សរដើម្បីប្ដូរពណ៌ 🟩 🟨 ⬜។")}</p>
    </ToolShell>
  );
}