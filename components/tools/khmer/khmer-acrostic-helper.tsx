"use client";
import { useMemo } from "react";
import khmerWords from "@/data/khmer-words.json";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { splitClusters } from "@/lib/khmer-syllables";

const WORDS = khmerWords as string[];
const KHMER_BASE = /^[ក-ឳ]/;
const MAX_SUGGESTIONS = 40;

type Match = "cluster" | "initial";

// Index each dictionary word by its first cluster and its first letter once.
const BY_CLUSTER = new Map<string, string[]>();
const BY_INITIAL = new Map<string, string[]>();
for (const w of WORDS) {
  const first = splitClusters(w)[0];
  if (!first || !KHMER_BASE.test(first)) continue;
  for (const [map, key] of [[BY_CLUSTER, first], [BY_INITIAL, first[0]]] as const) {
    const list = map.get(key);
    if (list) list.push(w);
    else map.set(key, [w]);
  }
}

export default function KhmerAcrosticHelper() {
  const { text: t } = useLanguage();
  const [word, setWord] = useToolState("khmer-acrostic:word", "");
  const [match, setMatch] = useToolState<Match>("khmer-acrostic:match", "initial");
  const [picks, setPicks] = useToolState<Record<string, string>>("khmer-acrostic:picks", {});

  const rows = useMemo(() => {
    return splitClusters(word.trim())
      .filter((c) => KHMER_BASE.test(c))
      .map((cluster, i) => {
        const list = (match === "cluster" ? BY_CLUSTER.get(cluster) : BY_INITIAL.get(cluster[0])) ?? [];
        // Longer words first — they make fuller poem lines.
        const sorted = [...list].sort((a, b) => b.length - a.length || a.localeCompare(b, "km"));
        return { key: `${i}:${cluster}`, cluster, words: sorted.slice(0, MAX_SUGGESTIONS), total: list.length };
      });
  }, [word, match]);

  const composed = rows.map((r) => picks[r.key] || `${r.cluster}…`).join("\n");

  const pick = (key: string, w: string) => setPicks((p) => ({ ...p, [key]: p[key] === w ? "" : w }));

  return (
    <ToolShell
      title="Khmer Acrostic Helper"
      khmerTitle="ជំនួយការសរសេរកំណាព្យអក្សរផ្តើម"
      description="Write an acrostic in Khmer: type a name or word (សុខា, កម្ពុជា, …) and each of its syllable clusters becomes the start of a line. For every line you get real Khmer words from the offline dictionary that begin with that cluster — or, more loosely, with the same first letter — to click into place and build on. Great for birthday cards, wedding verses, school poems, and name art."
      descriptionKm="សរសេរកំណាព្យអក្សរផ្តើមជាភាសាខ្មែរ៖ វាយឈ្មោះ ឬពាក្យ (សុខា កម្ពុជា …) ហើយក្រុមអក្សរនីមួយៗក្លាយជាការចាប់ផ្តើមនៃបន្ទាត់មួយ។ សម្រាប់បន្ទាត់នីមួយៗ អ្នកទទួលបានពាក្យខ្មែរពិតពីវចនានុក្រមក្រៅបណ្តាញដែលចាប់ផ្តើមដោយក្រុមអក្សរនោះ — ឬទូលាយជាងនេះ ដោយអក្សរដំបូងដូចគ្នា — សម្រាប់ចុចដាក់ ហើយសរសេរបន្ត។ ល្អសម្រាប់កាតខួបកំណើត កំណាព្យមង្គលការ កំណាព្យសាលា និងសិល្បៈឈ្មោះ។"
    >
      <Field label="Name or word" labelKm="ឈ្មោះ ឬពាក្យ">
        <TextInput value={word} onChange={(e) => setWord(e.target.value)} lang="km" className="font-khmer" placeholder="e.g. កម្ពុជា" autoComplete="off" />
      </Field>
      <div className="flex flex-wrap gap-2">
        <PillAction onClick={() => setWord("កម្ពុជា")}>{t("Try a sample", "សាកគំរូ")}</PillAction>
        <PillAction onClick={() => setPicks({})} disabled={Object.keys(picks).length === 0}>{t("Clear picks", "សម្អាតការជ្រើស")}</PillAction>
      </div>
      <PillGroup label={t("Suggest words that start with", "ណែនាំពាក្យដែលចាប់ផ្តើមដោយ")}>
        <Pill active={match === "initial"} onClick={() => setMatch("initial")}>{t("The same first letter", "អក្សរដំបូងដូចគ្នា")}</Pill>
        <Pill active={match === "cluster"} onClick={() => setMatch("cluster")}>{t("The exact cluster", "ក្រុមអក្សរដូចបេះបិទ")}</Pill>
      </PillGroup>

      {rows.length === 0 ? (
        <p className="text-xs text-[var(--ink-faint)]">{t("Type a Khmer name or word to see line starters.", "វាយឈ្មោះ ឬពាក្យខ្មែរដើម្បីមើលពាក្យចាប់ផ្តើមបន្ទាត់។")}</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.key} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <div className="mb-2 flex items-baseline gap-3">
                <span lang="km" className="font-khmer text-2xl font-semibold text-[var(--gold)]">{r.cluster}</span>
                <span className="text-xs text-[var(--ink-faint)]">
                  {r.total === 0
                    ? t("No dictionary words — write this line freely.", "គ្មានពាក្យក្នុងវចនានុក្រម — សរសេរបន្ទាត់នេះដោយសេរី។")
                    : t(`${r.total} word${r.total === 1 ? "" : "s"}${r.total > MAX_SUGGESTIONS ? `, showing ${MAX_SUGGESTIONS}` : ""}`, `${r.total} ពាក្យ${r.total > MAX_SUGGESTIONS ? ` បង្ហាញ ${MAX_SUGGESTIONS}` : ""}`)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.words.map((w) => (
                  <button
                    key={w}
                    type="button"
                    lang="km"
                    aria-pressed={picks[r.key] === w}
                    onClick={() => pick(r.key, w)}
                    className={`rounded border px-2 py-0.5 font-khmer text-sm transition ${picks[r.key] === w ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink)] hover:border-[var(--ink-faint)]"}`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {rows.length > 0 && <Output label="Your acrostic (starter words)" value={composed} mono={false} />}

      <SourceCredits>
        <p>{t(
          "Clusters come from the browser's Intl.Segmenter, and suggestions are drawn from the app's offline Khmer word list (~1,850 words, built from Chuon Nath & Headley dictionary data and the common-word POS lexicon). The list is not exhaustive and only offers starter words — the poetry is yours. Original Tools123 implementation.",
          "ក្រុមអក្សរមកពី Intl.Segmenter របស់កម្មវិធីរុករក ហើយការណែនាំយកពីបញ្ជីពាក្យខ្មែរក្រៅបណ្តាញរបស់កម្មវិធី (~១,៨៥០ ពាក្យ បង្កើតពីទិន្នន័យវចនានុក្រមជួន ណាត និង Headley និងវចនានុក្រមពាក្យធម្មតា)។ បញ្ជីនេះមិនពេញលេញ ហើយផ្តល់តែពាក្យចាប់ផ្តើមប៉ុណ្ណោះ — កំណាព្យជារបស់អ្នក។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
