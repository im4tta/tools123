"use client";
import { useMemo, useState } from "react";
import { Printer, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { CopyButton } from "@/components/CopyButton";
import { useToolState } from "@/lib/storage";
import { splitWords } from "@/lib/khmer-syllables";
import { isContentWord } from "@/lib/khmer-nlp";
import { mulberry32 } from "@/lib/prng";
import { pickClozeBlanks, shuffle, type ClozeMode } from "@/lib/khmer-learning";

const KH_DIGITS = "០១២៣៤៥៦៧៨៩";
const toKh = (n: number) => String(n).replace(/\d/g, (d) => KH_DIGITS[Number(d)]);
const KHMER_LETTER = /[ក-ឳ]/;

const SAMPLE = "ប្រទេសកម្ពុជាមានខេត្តជាច្រើន។ រាជធានីភ្នំពេញស្ថិតនៅកន្លែងដែលទន្លេមេគង្គ និងទន្លេសាបជួបគ្នា។ ប្រជាជនខ្មែរជាច្រើនប្រកបរបរធ្វើស្រែ ហើយអង្ករជាអាហារចម្បង។ ប្រាសាទអង្គរវត្តស្ថិតនៅខេត្តសៀមរាប។";

export default function KhmerClozeGenerator() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-cloze:input", "");
  const [mode, setMode] = useToolState<ClozeMode>("khmer-cloze:mode", "nth");
  const [nth, setNth] = useToolState("khmer-cloze:nth", 5);
  const [percent, setPercent] = useToolState("khmer-cloze:percent", 20);
  const [contentOnly, setContentOnly] = useToolState("khmer-cloze:content", true);
  const [wordBank, setWordBank] = useToolState("khmer-cloze:bank", true);
  const [showAnswers, setShowAnswers] = useToolState("khmer-cloze:answers", false);
  const [seed, setSeed] = useState(1);

  const exercise = useMemo(() => {
    const tokens = splitWords(input);
    const candidates: number[] = [];
    tokens.forEach((tok, i) => {
      if (!tok.isWord || !KHMER_LETTER.test(tok.text)) return;
      if (contentOnly && !isContentWord(tok.text)) return;
      candidates.push(i);
    });
    const rand = mulberry32(seed * 7919 + input.length);
    const blanks = pickClozeBlanks(candidates, mode, nth, percent, rand);
    const blankNo = new Map(blanks.map((idx, k) => [idx, k + 1]));
    const answers = blanks.map((idx) => tokens[idx].text);
    const bank = shuffle(answers, mulberry32(seed * 104729 + answers.length));
    return { tokens, candidates: candidates.length, blankNo, answers, bank };
  }, [input, mode, nth, percent, contentOnly, seed]);

  const plainText = useMemo(() => {
    const body = exercise.tokens.map((tok, i) => {
      const n = exercise.blankNo.get(i);
      return n ? `(${toKh(n)}) ________` : tok.text;
    }).join("");
    const bank = wordBank && exercise.bank.length ? `\n\n${t("Word bank", "បញ្ជីពាក្យ")}: ${exercise.bank.join(" · ")}` : "";
    const key = `\n\n${t("Answers", "ចម្លើយ")}: ${exercise.answers.map((a, i) => `(${toKh(i + 1)}) ${a}`).join("  ")}`;
    return body + bank + key;
  }, [exercise, wordBank, t]);

  const hasBlanks = exercise.answers.length > 0;

  return (
    <ToolShell
      title="Khmer Cloze Exercise Generator"
      khmerTitle="ឧបករណ៍បង្កើតលំហាត់បំពេញចន្លោះ"
      description="Turn any Khmer passage into a printable fill-in-the-blank (cloze) reading exercise. Blank every Nth word or a random share of words, optionally skip small grammar words so only meaningful vocabulary is tested, add a shuffled word bank, and flip to the answer key. Made for Khmer teachers and self-learners; runs in your browser."
      descriptionKm="បម្លែងអត្ថបទខ្មែរណាមួយទៅជាលំហាត់អានបំពេញចន្លោះសម្រាប់បោះពុម្ព។ លុបពាក្យរៀងរាល់ពាក្យទី N ឬភាគរយចៃដន្យ ជាជម្រើសរំលងពាក្យវេយ្យាករណ៍តូចៗ ដើម្បីសាកតែវាក្យសព្ទមានន័យ បន្ថែមបញ្ជីពាក្យច្របល់ ហើយបើកមើលចម្លើយ។ ធ្វើសម្រាប់គ្រូភាសាខ្មែរ និងអ្នករៀនដោយខ្លួនឯង ដំណើរការក្នុងកម្មវិធីរុករក។"
    >
      <Field label="Khmer passage" labelKm="អត្ថបទខ្មែរ">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={6} lang="km" className="font-khmer" placeholder="Paste a Khmer reading passage…" />
      </Field>
      <div className="flex flex-wrap gap-2">
        <PillAction onClick={() => setInput(SAMPLE)}>{t("Try a sample", "សាកគំរូ")}</PillAction>
      </div>

      <PillGroup label={t("Which words to blank", "ពាក្យណាដែលត្រូវលុប")}>
        <Pill active={mode === "nth"} onClick={() => setMode("nth")}>{t("Every Nth word", "រៀងរាល់ពាក្យទី N")}</Pill>
        <Pill active={mode === "random"} onClick={() => setMode("random")}>{t("Random share", "ភាគរយចៃដន្យ")}</Pill>
      </PillGroup>
      {mode === "nth" ? (
        <PillGroup label={t("N", "N")}>
          {[3, 4, 5, 6, 7].map((v) => <Pill key={v} active={nth === v} onClick={() => setNth(v)}>{t(String(v), toKh(v))}</Pill>)}
        </PillGroup>
      ) : (
        <PillGroup label={t("Share of words", "ភាគរយពាក្យ")}>
          {[10, 20, 30, 40].map((v) => <Pill key={v} active={percent === v} onClick={() => setPercent(v)}>{t(`${v}%`, `${toKh(v)}%`)}</Pill>)}
        </PillGroup>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Pill active={contentOnly} onClick={() => setContentOnly((v) => !v)}>{t("Skip grammar words", "រំលងពាក្យវេយ្យាករណ៍")}</Pill>
        <Pill active={wordBank} onClick={() => setWordBank((v) => !v)}>{t("Word bank", "បញ្ជីពាក្យ")}</Pill>
        <Pill active={showAnswers} onClick={() => setShowAnswers((v) => !v)}>{t("Show answers", "បង្ហាញចម្លើយ")}</Pill>
        <PillAction onClick={() => setSeed((s) => s + 1)}><RefreshCw size={13} />{t("Shuffle", "ច្របល់ឡើងវិញ")}</PillAction>
        <PillAction onClick={() => window.print()} disabled={!hasBlanks}><Printer size={13} />{t("Print", "បោះពុម្ព")}</PillAction>
        {hasBlanks && <CopyButton text={plainText} compact />}
      </div>

      {!input.trim() ? (
        <p className="text-xs text-[var(--ink-faint)]">{t("Paste a passage to build the exercise.", "បិទភ្ជាប់អត្ថបទដើម្បីបង្កើតលំហាត់។")}</p>
      ) : !hasBlanks ? (
        <p className="text-sm text-[var(--ink-faint)]">{t("Not enough Khmer words to blank. Use a longer passage, a smaller N, or turn off “Skip grammar words”.", "ពាក្យខ្មែរមិនគ្រប់គ្រាន់ដើម្បីលុប។ ប្រើអត្ថបទវែងជាងនេះ N តូចជាងនេះ ឬបិទ «រំលងពាក្យវេយ្យាករណ៍»។")}</p>
      ) : (
        <div id="khmer-cloze-print" className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-[var(--ground-line)] pb-3 text-xs text-[var(--ink-dim)]">
            <span>{t("Name", "ឈ្មោះ")}: ____________________</span>
            <span>{t("Date", "កាលបរិច្ឆេទ")}: __________</span>
          </div>
          <p lang="km" className="font-khmer text-lg leading-[2.4] text-[var(--ink)]">
            {exercise.tokens.map((tok, i) => {
              const n = exercise.blankNo.get(i);
              if (!n) return <span key={i}>{tok.text}</span>;
              return (
                <span key={i} className="mx-0.5 inline-flex items-baseline gap-1">
                  <sup className="text-xs text-[var(--ink-faint)]">{toKh(n)}</sup>
                  {showAnswers
                    ? <span className="border-b border-[var(--gold)] px-1 font-semibold text-[var(--gold)]">{tok.text}</span>
                    : <span className="inline-block min-w-[4.5rem] border-b border-[var(--ink-faint)]">&nbsp;</span>}
                </span>
              );
            })}
          </p>
          {wordBank && (
            <div className="mt-5 rounded-md border border-dashed border-[var(--ground-line)] p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Word bank", "បញ្ជីពាក្យ")}</p>
              <div className="flex flex-wrap gap-2">
                {exercise.bank.map((w, i) => <span key={i} lang="km" className="rounded border border-[var(--ground-line)] px-2 py-0.5 font-khmer text-[var(--ink)]">{w}</span>)}
              </div>
            </div>
          )}
          <p className="mt-3 text-xs text-[var(--ink-faint)]">{t(`${exercise.answers.length} blanks from ${exercise.candidates} eligible words`, `ចន្លោះ ${toKh(exercise.answers.length)} ពីពាក្យដែលអាចប្រើបាន ${toKh(exercise.candidates)}`)}</p>
        </div>
      )}
      <style jsx global>{`@media print { body * { visibility: hidden !important; } #khmer-cloze-print, #khmer-cloze-print * { visibility: visible !important; } #khmer-cloze-print { position: absolute; inset: 0; width: 100%; border: none; background: #fff; color: #000; padding: 10mm; } @page { size: A4 portrait; margin: 12mm; } }`}</style>

      <SourceCredits>
        <p>{t(
          "Word boundaries come from the browser's Unicode (ICU) Khmer word segmenter, and “grammar words” are skipped using the stop-word list in the app's shared Khmer NLP helpers (built on split-khmer by Seanghay Yath and khmer-nlp-toolkit, both MIT). Segmentation is approximate — check the blanks before handing the sheet out. The cloze procedure itself is a long-established reading-comprehension technique (W. L. Taylor, 1953); this is an original Tools123 implementation.",
          "ព្រំដែនពាក្យមកពីកម្មវិធីបំបែកពាក្យខ្មែរ Unicode (ICU) របស់កម្មវិធីរុករក ហើយ «ពាក្យវេយ្យាករណ៍» ត្រូវរំលងដោយប្រើបញ្ជីពាក្យឈប់ក្នុងជំនួយ NLP ខ្មែររួមរបស់កម្មវិធី (បង្កើតលើ split-khmer របស់ Seanghay Yath និង khmer-nlp-toolkit ទាំងពីរ MIT)។ ការបំបែកជាការប៉ាន់ស្មាន — សូមពិនិត្យចន្លោះមុនចែកសន្លឹក។ វិធីសាស្ត្របំពេញចន្លោះ (cloze) ខ្លួនឯងជាបច្ចេកទេសវាយតម្លៃការអានដែលមានយូរមកហើយ (W. L. Taylor, ១៩៥៣) នេះជាការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
