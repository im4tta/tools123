"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { KHMER_CONSONANTS, KHMER_SUBSCRIPTS } from "@/lib/data/khmer-romanization";
import { COENG } from "@/lib/khmer-games";
import { buildOptions, shuffle } from "@/lib/khmer-learning";
import { toKhmerNumerals } from "@/lib/khmer-number-words";

// Consonants that have a subscript form in the shared table (every modern consonant except ឡ).
const BASES = Object.keys(KHMER_SUBSCRIPTS).map((seq) => seq.slice(COENG.length)).filter((c) => KHMER_CONSONANTS[c]);
// ្ត and ្ដ are drawn identically in modern fonts, so they are never offered side by side.
const lookAlike = (c: string) => (c === "ដ" ? "ត" : c);
// The subscript is shown under this carrier consonant so it renders in its real stacked position.
const CARRIER = "ស";
const ROUND = 12;

type Mode = "sub-to-base" | "base-to-sub";

export default function KhmerCoengQuiz() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState<Mode>("khmer-coeng-quiz:mode", "sub-to-base");
  const [best, setBest] = useToolState("khmer-coeng-quiz:best", 0);
  const [deck, setDeck] = useState<string[]>([]);
  const [options, setOptions] = useState<string[][]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [right, setRight] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);

  const start = () => {
    const picked = shuffle(BASES, Math.random).slice(0, ROUND);
    setDeck(picked);
    setOptions(picked.map((c) => buildOptions(c, BASES, 4, Math.random, lookAlike)));
    setIndex(0); setAnswer(null); setRight(0); setMissed([]);
  };

  const letter = deck[index];
  const done = deck.length > 0 && index >= deck.length;
  const stacked = (c: string) => CARRIER + COENG + c;

  const choose = (c: string) => {
    if (!letter || answer) return;
    setAnswer(c);
    if (lookAlike(c) === lookAlike(letter)) setRight(right + 1);
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
      title="Khmer Subscript Match Quiz"
      khmerTitle="ល្បែងផ្គូផ្គងជើងអក្សរ"
      description="Practise the subscript (ជើង) forms of Khmer consonants. Either see a subscript stacked under ស and pick the consonant it comes from, or see a consonant and pick its subscript. Twelve questions per round; look-alike subscripts ្ត and ្ដ are never offered together."
      descriptionKm="ហាត់រៀនជើងអក្សរនៃព្យញ្ជនៈខ្មែរ។ មើលជើងដែលដាក់នៅក្រោម ស ហើយជ្រើសព្យញ្ជនៈដែលវាមកពី ឬមើលព្យញ្ជនៈ ហើយជ្រើសជើងរបស់វា។ ដប់ពីរសំណួរក្នុងមួយជុំ ហើយជើង ្ត និង ្ដ ដែលមើលទៅដូចគ្នា មិនដែលបង្ហាញជាមួយគ្នាទេ។"
    >
      <PillGroup label={t("Question type", "ប្រភេទសំណួរ")}>
        <Pill active={mode === "sub-to-base"} onClick={() => { setMode("sub-to-base"); setDeck([]); }}>{t("Subscript → consonant", "ជើង → ព្យញ្ជនៈ")}</Pill>
        <Pill active={mode === "base-to-sub"} onClick={() => { setMode("base-to-sub"); setDeck([]); }}>{t("Consonant → subscript", "ព្យញ្ជនៈ → ជើង")}</Pill>
      </PillGroup>

      {deck.length === 0 ? (
        <Button onClick={start}>{t("Start quiz", "ចាប់ផ្តើម")}</Button>
      ) : done ? (
        <div className="space-y-4">
          <p className="rounded-md border border-[var(--gold)] p-4 text-sm text-[var(--ink)]" role="status">
            {t(`You got ${right} of ${deck.length} right. Best: ${Math.max(best, right)}.`, `អ្នកឆ្លើយត្រូវ ${toKhmerNumerals(String(right))} ក្នុងចំណោម ${toKhmerNumerals(String(deck.length))}។ ល្អបំផុត៖ ${toKhmerNumerals(String(Math.max(best, right)))}។`)}
          </p>
          {missed.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Review these", "សូមរំលឹកអក្សរទាំងនេះ")}</p>
              <div className="flex flex-wrap gap-2">
                {missed.map((c) => (
                  <span key={c} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-center">
                    <span lang="km" className="block font-khmer text-2xl text-[var(--ink)]">{c} → {stacked(c)}</span>
                    <span className="block text-xs text-[var(--ink-faint)]">{KHMER_SUBSCRIPTS[COENG + c].name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          <PillAction onClick={start}><RefreshCw size={13} />{t("Play again", "លេងម្តងទៀត")}</PillAction>
        </div>
      ) : letter && (
        <div className="space-y-4">
          <p className="text-xs text-[var(--ink-faint)]">{t(`Question ${index + 1} of ${deck.length} · score ${right}`, `សំណួរទី ${toKhmerNumerals(String(index + 1))} ក្នុងចំណោម ${toKhmerNumerals(String(deck.length))} · ពិន្ទុ ${toKhmerNumerals(String(right))}`)}</p>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 text-center">
            <p className="mb-2 text-xs text-[var(--ink-faint)]">
              {mode === "sub-to-base" ? t(`Which consonant is written under ${CARRIER}?`, `ព្យញ្ជនៈណាដែលសរសេរនៅក្រោម ${CARRIER}?`) : t("Which is this consonant's subscript?", "តើជើងរបស់ព្យញ្ជនៈនេះមួយណា?")}
            </p>
            <p lang="km" className="font-khmer text-7xl leading-[1.6] text-[var(--ink)]">{mode === "sub-to-base" ? stacked(letter) : letter}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {options[index].map((c) => {
              const isRight = lookAlike(c) === lookAlike(letter);
              const state = !answer ? "idle" : isRight ? "right" : c === answer ? "wrong" : "idle";
              return (
                <button
                  key={c}
                  type="button"
                  disabled={Boolean(answer)}
                  onClick={() => choose(c)}
                  className={`min-h-20 rounded-md border p-3 text-center font-khmer text-4xl leading-[1.6] transition ${state === "right" ? "border-[var(--gold)] bg-[var(--gold)]/15" : state === "wrong" ? "border-[var(--danger)]/60 bg-[var(--danger)]/10" : "border-[var(--ground-line)] hover:border-[var(--ink-faint)]"}`}
                >
                  <span lang="km">{mode === "sub-to-base" ? c : stacked(c)}</span>
                </button>
              );
            })}
          </div>
          {answer && (
            <div className="flex flex-wrap items-center gap-3" role="status">
              <p className="text-sm text-[var(--ink-dim)]">
                {lookAlike(answer) === lookAlike(letter) ? t("Correct.", "ត្រឹមត្រូវ។") : t("Not quite.", "មិនទាន់ត្រូវ។")}{" "}
                <span lang="km" className="font-khmer">{letter} → {stacked(letter)}</span> — {KHMER_SUBSCRIPTS[COENG + letter].name}
              </p>
              <Button onClick={next}>{index + 1 >= deck.length ? t("See results", "មើលលទ្ធផល") : t("Next", "បន្ទាប់")}</Button>
            </div>
          )}
        </div>
      )}

      <SourceCredits>
        <p>{t(
          "Subscript names come from the app's shared subscript table (lib/data/khmer-romanization.ts), also used by the Subscript (Coeng) Chart. Each subscript is typed as the invisible Coeng sign U+17D2 followed by the consonant, and its stacked shape is drawn by your Khmer font, so shapes can differ slightly between fonts. Best score is saved in this browser only. Original Tools123 implementation.",
          "ឈ្មោះជើងអក្សរមកពីតារាងជើងអក្សររួមរបស់កម្មវិធី (lib/data/khmer-romanization.ts) ដែលប្រើដោយតារាងជើងអក្សរដែរ។ ជើងនីមួយៗវាយជាសញ្ញាជើង U+17D2 (មើលមិនឃើញ) បន្តដោយព្យញ្ជនៈ ហើយរាងរបស់វាត្រូវបានគូរដោយពុម្ពអក្សរខ្មែររបស់អ្នក ដូច្នេះរាងអាចខុសគ្នាបន្តិចតាមពុម្ពអក្សរ។ ពិន្ទុល្អបំផុតរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
