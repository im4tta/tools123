"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { PillAction } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { KHMER_CONSONANTS } from "@/lib/data/khmer-romanization";
import { shuffle } from "@/lib/khmer-learning";

const LETTERS = Object.keys(KHMER_CONSONANTS);
const KH = "០១២៣៤៥៦៧៨៩";
const kh = (n: number) => String(n).replace(/\d/g, (d) => KH[Number(d)]);

export default function KhmerSeriesQuiz() {
  const { text: t } = useLanguage();
  const [best, setBest] = useToolState("khmer-series-quiz:best", 0);
  const [deck, setDeck] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<1 | 2 | null>(null);
  const [right, setRight] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);

  const start = () => { setDeck(shuffle(LETTERS, Math.random)); setIndex(0); setAnswer(null); setRight(0); setMissed([]); };
  const letter = deck[index];
  const data = letter ? KHMER_CONSONANTS[letter] : null;
  const done = deck.length > 0 && index >= deck.length;

  const choose = (series: 1 | 2) => {
    if (!data || answer) return;
    setAnswer(series);
    if (series === data.series) setRight(right + 1);
    else setMissed([...missed, letter]);
  };

  const next = () => {
    setAnswer(null);
    const ni = index + 1;
    setIndex(ni);
    if (ni >= deck.length && right > best) setBest(right);
  };

  return (
    <ToolShell
      title="Khmer Consonant Series Quiz"
      khmerTitle="ល្បែងសំណួរស៊េរីព្យញ្ជនៈខ្មែរ"
      description="Every Khmer consonant belongs to the 1st series (inherent vowel â, as in ក kâ) or the 2nd series (inherent vowel ô, as in គ kô), and the series decides how each vowel sign is read. Go through all 33 modern consonants in random order, pick the series, and see the romanised name and IPA after each answer. Ends with a score and the letters to review."
      descriptionKm="ព្យញ្ជនៈខ្មែរនីមួយៗស្ថិតក្នុងស៊េរីទី១ (សំឡេង អ ដូច ក) ឬស៊េរីទី២ (សំឡេង អូ ដូច គ) ហើយស៊េរីកំណត់របៀបអានស្រៈនីមួយៗ។ ឆ្លងកាត់ព្យញ្ជនៈសម័យទំនើបទាំង ៣៣ តាមលំដាប់ចៃដន្យ ជ្រើសស៊េរី ហើយមើលឈ្មោះជាអក្សរឡាតាំង និង IPA ក្រោយចម្លើយនីមួយៗ។ បញ្ចប់ដោយពិន្ទុ និងអក្សរដែលត្រូវរំលឹក។"
    >
      {deck.length === 0 ? (
        <Button onClick={start}>{t("Start quiz", "ចាប់ផ្តើម")}</Button>
      ) : done ? (
        <div className="space-y-4">
          <p className="rounded-md border border-[var(--gold)] p-4 text-sm text-[var(--ink)]" role="status">
            {t(`You got ${right} of ${deck.length} right. Best: ${Math.max(best, right)}.`, `អ្នកឆ្លើយត្រូវ ${kh(right)} ក្នុងចំណោម ${kh(deck.length)}។ ល្អបំផុត៖ ${kh(Math.max(best, right))}។`)}
          </p>
          {missed.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Review these", "សូមរំលឹកអក្សរទាំងនេះ")}</p>
              <div className="flex flex-wrap gap-2">
                {missed.map((l) => (
                  <span key={l} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-center">
                    <span lang="km" className="block font-khmer text-2xl text-[var(--ink)]">{l}</span>
                    <span className="block text-xs text-[var(--ink-faint)]">{KHMER_CONSONANTS[l].name} · {t(`series ${KHMER_CONSONANTS[l].series}`, `ស៊េរីទី${kh(KHMER_CONSONANTS[l].series)}`)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          <PillAction onClick={start}><RefreshCw size={13} />{t("Play again", "លេងម្តងទៀត")}</PillAction>
        </div>
      ) : data && (
        <div className="space-y-4">
          <p className="text-xs text-[var(--ink-faint)]">{t(`Letter ${index + 1} of ${deck.length} · score ${right}`, `អក្សរទី ${kh(index + 1)} ក្នុងចំណោម ${kh(deck.length)} · ពិន្ទុ ${kh(right)}`)}</p>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 text-center">
            <p lang="km" className="font-khmer text-7xl leading-tight text-[var(--ink)]">{letter}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {([1, 2] as const).map((s) => {
              const state = !answer ? "idle" : s === data.series ? "right" : s === answer ? "wrong" : "idle";
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!!answer}
                  onClick={() => choose(s)}
                  className={`rounded-md border p-4 text-center transition ${state === "right" ? "border-[var(--gold)] bg-[var(--gold)]/15" : state === "wrong" ? "border-[var(--danger)]/60 bg-[var(--danger)]/10" : "border-[var(--ground-line)] hover:border-[var(--ink-faint)]"}`}
                >
                  <span className="block text-sm font-medium text-[var(--ink)]">{s === 1 ? t("1st series", "ស៊េរីទី១") : t("2nd series", "ស៊េរីទី២")}</span>
                  <span className="block text-xs text-[var(--ink-faint)]">{s === 1 ? t("inherent â (like ក)", "សំឡេង អ (ដូច ក)") : t("inherent ô (like គ)", "សំឡេង អូ (ដូច គ)")}</span>
                </button>
              );
            })}
          </div>
          {answer && (
            <div className="flex flex-wrap items-center gap-3" role="status">
              <p className="text-sm text-[var(--ink-dim)]">
                {answer === data.series ? t("Correct.", "ត្រឹមត្រូវ។") : t("Not quite.", "មិនទាន់ត្រូវ។")}{" "}
                <span lang="km" className="font-khmer">{letter}</span> — {data.name}, /{data.ipa}/ · {data.series === 1 ? t("1st series", "ស៊េរីទី១") : t("2nd series", "ស៊េរីទី២")}
              </p>
              <Button onClick={next}>{index + 1 >= deck.length ? t("See results", "មើលលទ្ធផល") : t("Next letter", "អក្សរបន្ទាប់")}</Button>
            </div>
          )}
        </div>
      )}

      <SourceCredits>
        <p>{t(
          "Series, romanised names, and IPA come from the app's shared Khmer romanization table (lib/data/khmer-romanization.ts), which lists the 33 consonants in modern use: 15 in the 1st series (ក ខ ច ឆ ដ ឋ ណ ត ថ ប ផ ស ហ ឡ អ) and 18 in the 2nd (គ ឃ ង ជ ឈ ញ ឌ ឍ ទ ធ ន ព ភ ម យ រ ល វ). The two obsolete letters are left out. Your best score is saved in this browser only. Original Tools123 implementation.",
          "ស៊េរី ឈ្មោះជាអក្សរឡាតាំង និង IPA មកពីតារាងបម្លែងអក្សរខ្មែររួមរបស់កម្មវិធី (lib/data/khmer-romanization.ts) ដែលរាយព្យញ្ជនៈ ៣៣ ដែលប្រើសព្វថ្ងៃ៖ ១៥ ក្នុងស៊េរីទី១ (ក ខ ច ឆ ដ ឋ ណ ត ថ ប ផ ស ហ ឡ អ) និង ១៨ ក្នុងស៊េរីទី២ (គ ឃ ង ជ ឈ ញ ឌ ឍ ទ ធ ន ព ភ ម យ រ ល វ)។ អក្សរលែងប្រើពីរមិនត្រូវបានដាក់បញ្ចូលទេ។ ពិន្ទុល្អបំផុតរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
