"use client";
import { useState } from "react";
import { Eye, Shuffle, Sparkles, Volume2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { STATIC_DATABASE, type KhmerWordData } from "@/lib/khmer-lexicon-db";

const ENTRIES: KhmerWordData[] = Object.values(STATIC_DATABASE);
// Deterministic "today" index (epoch day number) so server and client agree.
const TODAY_INDEX = Math.floor(Date.now() / 86_400_000) % ENTRIES.length;

function speak(word: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "km-KH";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export default function KhmerWordOfTheDay() {
  const { text: t } = useLanguage();
  const [index, setIndex] = useState(TODAY_INDEX);
  const [revealed, setRevealed] = useState(false);
  const entry = ENTRIES[index];
  const isToday = index === TODAY_INDEX;

  function next() {
    let n = index;
    if (ENTRIES.length > 1) while (n === index) n = Math.floor(Math.random() * ENTRIES.length);
    setIndex(n);
    setRevealed(false);
  }

  return (
    <ToolShell
      title="Khmer Word of the Day"
      khmerTitle="ពាក្យខ្មែរប្រចាំថ្ងៃ"
      description="Learn one Khmer word at a time. See today's word, try to recall its meaning, then reveal the definition, pronunciation, an example sentence, and related words — or shuffle to a new random word for flashcard-style study. Drawn from an offline dictionary of ~620 words; runs entirely in your browser."
      descriptionKm="រៀនពាក្យខ្មែរម្តងមួយ។ មើលពាក្យប្រចាំថ្ងៃ ព្យាយាមនឹកន័យរបស់វា រួចបង្ហាញនិយមន័យ ការបញ្ចេញសំឡេង ឧទាហរណ៍ និងពាក្យពាក់ព័ន្ធ — ឬចាក់ឆ្នោតទៅពាក្យថ្មីសម្រាប់សិក្សាបែបសន្លឹកសំណួរ។ ដកស្រង់ពីវចនានុក្រមក្រៅបណ្តាញប្រមាណ ៦២០ ពាក្យ ដំណើរការទាំងស្រុងក្នុងកម្មវិធីរុករក។"
    >
      <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--gold)]">
          <Sparkles size={13} />{isToday ? t("Today's word", "ពាក្យថ្ងៃនេះ") : t("Random word", "ពាក្យចៃដន្យ")}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <h2 lang="km" className="font-khmer text-4xl font-semibold text-[var(--ink)]">{entry.word}</h2>
          <button type="button" onClick={() => speak(entry.word)} aria-label={t("Listen", "ស្តាប់")} className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--ground-line)] text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)]">
            <Volume2 size={16} />
          </button>
        </div>
        {entry.pronunciation && <p lang="km" className="mt-1 font-khmer text-sm text-[var(--gold)]">/{entry.pronunciation}/</p>}

        {revealed ? (
          <div className="mt-4 space-y-3">
            <p lang="km" className="font-khmer text-base leading-relaxed text-[var(--ink)]">{entry.definition}</p>
            {entry.example && (
              <p lang="km" className="rounded-md border-l-2 border-[var(--gold-dim)] bg-[var(--ground)] px-3 py-2 font-khmer text-sm italic text-[var(--ink-dim)]">{entry.example}</p>
            )}
            {(entry.synonyms?.length > 0 || entry.antonyms?.length > 0 || entry.relatedWords?.length > 0) && (
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                {entry.synonyms?.length > 0 && <ChipRow label={t("Synonyms", "ន័យដូច")} words={entry.synonyms} />}
                {entry.antonyms?.length > 0 && <ChipRow label={t("Antonyms", "ន័យផ្ទុយ")} words={entry.antonyms} />}
                {entry.relatedWords?.length > 0 && <ChipRow label={t("Related", "ពាក់ព័ន្ធ")} words={entry.relatedWords} />}
              </div>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => setRevealed(true)} className="mt-4 flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]">
            <Eye size={15} />{t("Show meaning", "បង្ហាញន័យ")}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={next} className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--ink-faint)]">
          <Shuffle size={13} />{t("Next word", "ពាក្យបន្ទាប់")}
        </button>
        {!isToday && (
          <button type="button" onClick={() => { setIndex(TODAY_INDEX); setRevealed(false); }} className="rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--ink-faint)]">
            {t("Back to today's word", "ត្រឡប់ទៅពាក្យថ្ងៃនេះ")}
          </button>
        )}
      </div>

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Words, definitions and examples come from the offline Khmer lexicon bundled in this app (~620 headwords compiled from Chuon Nath & Robert K. Headley dictionary data). \"Today's word\" is chosen deterministically from the date so everyone sees the same one. Pronunciation uses your device's Khmer text-to-speech voice if one is installed.",
          "ពាក្យ និយមន័យ និងឧទាហរណ៍មកពីវចនានុក្រមខ្មែរក្រៅបណ្តាញដែលភ្ជាប់មកជាមួយកម្មវិធីនេះ (~៦២០ ពាក្យ ចងក្រងពីទិន្នន័យវចនានុក្រមជួន ណាត និង Robert K. Headley)។ «ពាក្យថ្ងៃនេះ» ត្រូវបានជ្រើសតាមកាលបរិច្ឆេទ ដូច្នេះមនុស្សគ្រប់គ្នាឃើញពាក្យដូចគ្នា។ ការបញ្ចេញសំឡេងប្រើសំឡេងអានខ្មែររបស់ឧបករណ៍អ្នក បើមានដំឡើង។",
        )}</p>
      </section>
    </ToolShell>
  );
}

function ChipRow({ label, words }: { label: string; words: string[] }) {
  return (
    <div>
      <span className="mb-1 block font-medium uppercase tracking-wide text-[var(--ink-faint)]">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {words.map((w) => (
          <span key={w} lang="km" className="rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-2 py-0.5 font-khmer text-[var(--ink-dim)]">{w}</span>
        ))}
      </div>
    </div>
  );
}
