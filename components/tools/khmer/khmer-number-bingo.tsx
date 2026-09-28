"use client";
import { useEffect, useState } from "react";
import { Printer, RefreshCw, Volume2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { STORAGE_KEYS, useLocalStorage, useToolState } from "@/lib/storage";
import { BINGO_COLUMNS, BINGO_FREE, bingoLines, drawBingoNumber, makeBingoCard } from "@/lib/khmer-games";
import { convertUnder100, toKhmerNumerals } from "@/lib/khmer-number-words";

const MAX = 75;
const LETTERS = ["B", "I", "N", "G", "O"];
const kh = (n: number) => toKhmerNumerals(String(n));
const letterFor = (n: number) => LETTERS[BINGO_COLUMNS.findIndex(([lo, hi]) => n >= lo && n <= hi)];

export default function KhmerNumberBingo() {
  const { text: t } = useLanguage();
  const [called, setCalled] = useToolState<number[]>("khmer-number-bingo:called", []);
  const [showArabic, setShowArabic] = useToolState("khmer-number-bingo:arabic", false);
  const { value: cards, setValue: setCards, hydrated } = useLocalStorage<number[][][]>(STORAGE_KEYS.toolState("khmer-number-bingo:cardset"), []);
  const [khmerVoice, setKhmerVoice] = useState<SpeechSynthesisVoice | null>(null);

  const dealCards = (count: number) => setCards(Array.from({ length: count }, () => makeBingoCard(Math.random)));

  useEffect(() => {
    // Cards are random, so the first set is dealt after the saved game has loaded (no SSR mismatch).
    if (hydrated && cards.length === 0) dealCards(2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, cards.length]);

  useEffect(() => {
    // Offer "Speak" only when the device actually has a Khmer voice.
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const pick = () => setKhmerVoice(window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("km")) ?? null);
    pick();
    window.speechSynthesis.addEventListener("voiceschanged", pick);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", pick);
  }, []);

  const last = called.at(-1);
  const speak = (n: number) => {
    if (!khmerVoice) return;
    const u = new SpeechSynthesisUtterance(convertUnder100(n));
    u.voice = khmerVoice;
    u.lang = khmerVoice.lang;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };
  const callNext = () => {
    const n = drawBingoNumber(called, MAX, Math.random);
    if (n == null) return;
    setCalled([...called, n]);
    speak(n);
  };
  const newGame = () => {
    setCalled([]);
    dealCards(cards.length || 2);
  };
  const numeral = (n: number) => (showArabic ? `${kh(n)} (${n})` : kh(n));

  return (
    <ToolShell
      title="Khmer Number Bingo"
      khmerTitle="ល្បែងប៊ីងហ្គោលេខខ្មែរ"
      description="A 75-ball bingo caller and cards that use Khmer numerals and number words — a fun way for a class or family to practise reading ១–៧៥. Each call shows the numeral and how it is said in Khmer (read aloud if your device has a Khmer voice); cards mark themselves and highlight a completed line."
      descriptionKm="កម្មវិធីហៅលេខប៊ីងហ្គោ ៧៥ គ្រាប់ និងកាតដែលប្រើលេខខ្មែរ និងពាក្យលេខ — ជាមធ្យោបាយសប្បាយសម្រាប់ថ្នាក់រៀន ឬគ្រួសារ ដើម្បីហាត់អានលេខ ១–៧៥។ ការហៅនីមួយៗបង្ហាញលេខ និងរបៀបអានជាភាសាខ្មែរ (អានឮៗ ប្រសិនបើឧបករណ៍មានសំឡេងខ្មែរ) កាតគូសដោយខ្លួនឯង ហើយបន្លិចជួរដែលពេញ។"
    >
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-center" role="status" aria-live="polite">
        {last != null ? (
          <>
            <p className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">{t(`Call ${called.length} of ${MAX}`, `ការហៅទី ${kh(called.length)} ក្នុងចំណោម ${kh(MAX)}`)}</p>
            <p className="font-khmer text-7xl leading-[1.5] text-[var(--gold)]"><span className="mr-2 font-display text-3xl text-[var(--ink-faint)]">{letterFor(last)}</span><span lang="km">{kh(last)}</span></p>
            <p lang="km" className="font-khmer text-2xl text-[var(--ink)]">{convertUnder100(last)}</p>
            {showArabic && <p className="text-sm text-[var(--ink-faint)]">{last}</p>}
          </>
        ) : (
          <p className="py-6 text-sm text-[var(--ink-dim)]">{t("Press “Call number” to draw the first ball.", "ចុច «ហៅលេខ» ដើម្បីចាប់គ្រាប់ដំបូង។")}</p>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button onClick={callNext} disabled={called.length >= MAX}>{t("Call number", "ហៅលេខ")}</Button>
          {khmerVoice && last != null && <PillAction onClick={() => speak(last)}><Volume2 size={13} />{t("Say again", "អានម្តងទៀត")}</PillAction>}
          <PillAction onClick={newGame}><RefreshCw size={13} />{t("New game", "ល្បែងថ្មី")}</PillAction>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Called numbers", "លេខដែលបានហៅ")}</p>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[20rem] border-separate border-spacing-1 text-center">
            <tbody>
              {BINGO_COLUMNS.map(([lo, hi], c) => (
                <tr key={c}>
                  <th scope="row" className="w-6 font-display text-sm text-[var(--ink-faint)]">{LETTERS[c]}</th>
                  {Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).map((n) => (
                    <td key={n} lang="km" className={`rounded font-khmer text-xs leading-7 ${called.includes(n) ? (n === last ? "bg-[var(--gold)] text-[#0a0c0d]" : "bg-[var(--gold)]/20 text-[var(--ink)]") : "text-[var(--ink-faint)]"}`}>{kh(n)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 print:hidden">
        <PillGroup label={t("Cards", "កាត")}>
          {[1, 2, 4, 6].map((n) => <Pill key={n} active={cards.length === n} onClick={() => dealCards(n)}>{t(String(n), kh(n))}</Pill>)}
        </PillGroup>
        <PillGroup label={t("Numbers", "លេខ")}>
          <Pill active={!showArabic} onClick={() => setShowArabic(false)}>{t("Khmer only", "ខ្មែរតែប៉ុណ្ណោះ")}</Pill>
          <Pill active={showArabic} onClick={() => setShowArabic(true)}>{t("Khmer + 0–9", "ខ្មែរ + 0–9")}</Pill>
        </PillGroup>
        <PillAction onClick={() => window.print()}><Printer size={13} />{t("Print cards", "បោះពុម្ពកាត")}</PillAction>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card, ci) => {
          const lines = bingoLines(card, called);
          const inLine = (r: number, c: number) => lines.some((l) => l === `row-${r}` || l === `col-${c}` || (l === "diag-0" && r === c) || (l === "diag-1" && r === 4 - c));
          return (
            <div key={ci} className="break-inside-avoid rounded-md border border-[var(--ground-line)] p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-[var(--ink-faint)]">
                <span>{t(`Card ${ci + 1}`, `កាតទី ${kh(ci + 1)}`)}</span>
                {lines.length > 0 && <span className="rounded bg-[var(--gold)] px-2 py-0.5 font-medium text-[#0a0c0d]">{t("BINGO!", "ប៊ីងហ្គោ!")}</span>}
              </div>
              <div className="grid grid-cols-5 gap-1 text-center">
                {LETTERS.map((l) => <div key={l} className="font-display text-sm font-semibold text-[var(--gold)]">{l}</div>)}
                {card.flatMap((row, r) => row.map((n, c) => {
                  const hit = n === BINGO_FREE || called.includes(n);
                  return (
                    <div key={`${r}-${c}`} lang="km" className={`flex aspect-square items-center justify-center rounded border font-khmer text-lg ${inLine(r, c) ? "border-[var(--gold)] bg-[var(--gold)] text-[#0a0c0d]" : hit ? "border-[var(--gold-dim)] bg-[var(--gold)]/20 text-[var(--ink)]" : "border-[var(--ground-line)] text-[var(--ink)]"}`}>
                      {n === BINGO_FREE ? t("FREE", "ឥតគិត") : <span className="leading-tight">{numeral(n)}</span>}
                    </div>
                  );
                }))}
              </div>
            </div>
          );
        })}
      </div>

      <SourceCredits>
        <p>{t(
          "Number words come from the app's shared Khmer number engine (lib/khmer-number-words.ts), also used by Number Spell-out. The card layout follows the common 75-ball game (columns B 1–15, I 16–30, N 31–45, G 46–60, O 61–75, free centre). Speech uses your device's own Khmer text-to-speech voice when one is installed; nothing is sent to a server. The current game is saved in this browser only. Original Tools123 implementation.",
          "ពាក្យលេខមកពីម៉ាស៊ីនលេខខ្មែររួមរបស់កម្មវិធី (lib/khmer-number-words.ts) ដែលប្រើដោយឧបករណ៍អានលេខជាពាក្យដែរ។ ប្លង់កាតធ្វើតាមល្បែង ៧៥ គ្រាប់ទូទៅ (ជួរ B ១–១៥, I ១៦–៣០, N ៣១–៤៥, G ៤៦–៦០, O ៦១–៧៥ និងកណ្តាលឥតគិត)។ ការអានប្រើសំឡេងខ្មែររបស់ឧបករណ៍អ្នកផ្ទាល់ នៅពេលដែលមាន ហើយគ្មានអ្វីត្រូវបានផ្ញើទៅម៉ាស៊ីនមេទេ។ ល្បែងបច្ចុប្បន្នរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
