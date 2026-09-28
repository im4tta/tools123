"use client";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { PillAction } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { CopyButton } from "@/components/CopyButton";
import { useToolState } from "@/lib/storage";
import { KHMER_CONSONANTS, KHMER_DIACRITICS, KHMER_SUBSCRIPTS, KHMER_VOWELS, romanizeSyllable } from "@/lib/data/khmer-romanization";
import { COENG, codePoints, composeSyllable } from "@/lib/khmer-games";

const CONSONANTS = Object.keys(KHMER_CONSONANTS);
const SUB_BASES = Object.keys(KHMER_SUBSCRIPTS).map((seq) => seq.slice(COENG.length));
const VOWELS = Object.keys(KHMER_VOWELS);
const SHIFTERS = ["៉", "៊"]; // ៉ muusikatoan, ៊ triisap
const SIGNS = Object.keys(KHMER_DIACRITICS).filter((d) => !SHIFTERS.includes(d));
// Dependent vowels and signs are shown on a dotted circle (U+25CC), the usual placeholder.
const onCircle = (mark: string) => `◌${mark}`;

interface Parts { consonant: string; sub1: string; sub2: string; shifter: string; vowel: string; sign: string }
const START: Parts = { consonant: "ស", sub1: "រ", sub2: "", shifter: "", vowel: "ី", sign: "" };

export default function KhmerSyllableBuilder() {
  const { text: t } = useLanguage();
  const [parts, setParts] = useToolState<Parts>("khmer-syllable-builder:parts", START);
  const [word, setWord] = useToolState<string[]>("khmer-syllable-builder:word", []);
  const set = (patch: Partial<Parts>) => setParts({ ...parts, ...patch });

  const syllable = composeSyllable({ consonant: parts.consonant, subscripts: [parts.sub1, parts.sub1 ? parts.sub2 : ""], shifter: parts.shifter, vowel: parts.vowel, sign: parts.sign });
  const reading = romanizeSyllable(syllable, "ungegn");
  const choice = (active: boolean) =>
    `flex h-12 min-w-12 items-center justify-center rounded-md border px-1 font-khmer text-2xl transition ${active ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink)] hover:border-[var(--ink-faint)]"}`;

  return (
    <ToolShell
      title="Khmer Syllable Builder"
      khmerTitle="ឧបករណ៍ផ្គុំព្យាង្គខ្មែរ"
      description="Build a Khmer syllable piece by piece — consonant, up to two subscripts, a register shifter, a vowel and a final sign — and see it assembled in the correct Unicode order, with its code points and an approximate romanization. Add syllables together to spell a word."
      descriptionKm="ផ្គុំព្យាង្គខ្មែរម្តងមួយផ្នែក — ព្យញ្ជនៈ ជើងរហូតដល់ពីរ សញ្ញាប្តូរស៊េរី ស្រៈ និងសញ្ញាចុងក្រោយ — ហើយមើលវាផ្គុំតាមលំដាប់យូនីកូដត្រឹមត្រូវ ជាមួយលេខកូដ និងការបកជាអក្សរឡាតាំងប្រហាក់ប្រហែល។ បូកព្យាង្គចូលគ្នាដើម្បីប្រកបជាពាក្យ។"
    >
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-center">
        <p lang="km" className="min-h-[1.6em] font-khmer text-7xl leading-[1.6] text-[var(--ink)]">{syllable || "—"}</p>
        {syllable && (
          <>
            <p className="mt-1 text-sm text-[var(--ink-dim)]">{t("Approximate reading (UNGEGN style):", "ការអានប្រហាក់ប្រហែល (រចនាប័ទ្ម UNGEGN)៖")} <span className="font-medium text-[var(--ink)]">{reading || "—"}</span></p>
            <p className="mt-1 break-words font-mono-ui text-xs text-[var(--ink-faint)]">{codePoints(syllable).join(" ")}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <CopyButton text={syllable} />
              <PillAction onClick={() => setWord([...word, syllable])}>{t("Add to word", "បន្ថែមទៅពាក្យ")}</PillAction>
            </div>
          </>
        )}
      </div>

      {word.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--ground-line)] p-3">
          <span className="text-xs uppercase tracking-wide text-[var(--ink-dim)]">{t("Word", "ពាក្យ")}</span>
          <span lang="km" className="font-khmer text-3xl leading-[1.6] text-[var(--ink)]">{word.join("")}</span>
          <span className="ml-auto flex gap-2">
            <CopyButton text={word.join("")} />
            <PillAction onClick={() => setWord(word.slice(0, -1))}>{t("Remove last syllable", "លុបព្យាង្គចុងក្រោយ")}</PillAction>
            <PillAction onClick={() => setWord([])}>{t("Clear", "សម្អាត")}</PillAction>
          </span>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("1. Consonant", "១. ព្យញ្ជនៈ")}</p>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
          {CONSONANTS.map((c) => (
            <button key={c} type="button" aria-pressed={parts.consonant === c} aria-label={KHMER_CONSONANTS[c].name} onClick={() => set({ consonant: c })} className={choice(parts.consonant === c)}>
              <span lang="km">{c}</span>
            </button>
          ))}
        </div>
      </div>

      <Row>
        <Field label="2. Subscript" labelKm="២. ជើង">
          <Select value={parts.sub1} onChange={(e) => set({ sub1: e.target.value, sub2: e.target.value ? parts.sub2 : "" })}>
            <option value="">—</option>
            {SUB_BASES.map((c) => <option key={c} value={c}>{`្${c} (${KHMER_SUBSCRIPTS[COENG + c].name})`}</option>)}
          </Select>
        </Field>
        <Field label="Second subscript" labelKm="ជើងទីពីរ" hint="Rare; e.g. ស្ត្រី" hintKm="កម្រ; ឧ. ស្ត្រី">
          <Select value={parts.sub2} disabled={!parts.sub1} onChange={(e) => set({ sub2: e.target.value })}>
            <option value="">—</option>
            {SUB_BASES.map((c) => <option key={c} value={c}>{`្${c} (${KHMER_SUBSCRIPTS[COENG + c].name})`}</option>)}
          </Select>
        </Field>
      </Row>

      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("3. Register shifter (optional)", "៣. សញ្ញាប្តូរស៊េរី (ស្រេចចិត្ត)")}</p>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" aria-pressed={!parts.shifter} onClick={() => set({ shifter: "" })} className={choice(!parts.shifter)}>—</button>
          {SHIFTERS.map((s) => (
            <button key={s} type="button" aria-pressed={parts.shifter === s} aria-label={KHMER_DIACRITICS[s].name} onClick={() => set({ shifter: s })} className={choice(parts.shifter === s)}>
              <span lang="km">{onCircle(s)}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("4. Vowel (optional)", "៤. ស្រៈ (ស្រេចចិត្ត)")}</p>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9">
          <button type="button" aria-pressed={!parts.vowel} aria-label={t("Inherent vowel", "ស្រៈពេញតួ")} onClick={() => set({ vowel: "" })} className={choice(!parts.vowel)}>—</button>
          {VOWELS.map((v) => (
            <button key={v} type="button" aria-pressed={parts.vowel === v} aria-label={KHMER_VOWELS[v].name} onClick={() => set({ vowel: v })} className={choice(parts.vowel === v)}>
              <span lang="km">{onCircle(v)}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("5. Final sign (optional)", "៥. សញ្ញាចុងក្រោយ (ស្រេចចិត្ត)")}</p>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" aria-pressed={!parts.sign} onClick={() => set({ sign: "" })} className={choice(!parts.sign)}>—</button>
          {SIGNS.map((s) => (
            <button key={s} type="button" aria-pressed={parts.sign === s} aria-label={KHMER_DIACRITICS[s].name} onClick={() => set({ sign: s })} className={choice(parts.sign === s)}>
              <span lang="km">{onCircle(s)}</span>
            </button>
          ))}
        </div>
      </div>

      <SourceCredits>
        <p>{t(
          "Letters, vowel and sign names, and the reading come from the app's shared Khmer romanization table and romanizer (lib/data/khmer-romanization.ts). The reading is a rule-based approximation and can be wrong for irregular words. Parts are stored in the order described in the Khmer section of the Unicode Standard: consonant, Coeng + subscript, register shifter, vowel, sign. Not every combination is a real Khmer syllable. Original Tools123 implementation.",
          "អក្សរ ឈ្មោះស្រៈ និងសញ្ញា ព្រមទាំងការអាន មកពីតារាង និងកម្មវិធីបកអក្សរខ្មែររួមរបស់កម្មវិធី (lib/data/khmer-romanization.ts)។ ការអានជាការប៉ាន់ស្មានតាមច្បាប់ ហើយអាចខុសចំពោះពាក្យមិនទៀងទាត់។ ផ្នែកនានាត្រូវបានរក្សាទុកតាមលំដាប់ដែលពិពណ៌នាក្នុងផ្នែកខ្មែរនៃស្តង់ដារយូនីកូដ៖ ព្យញ្ជនៈ ជើង សញ្ញាប្តូរស៊េរី ស្រៈ សញ្ញា។ មិនមែនគ្រប់បន្សំទាំងអស់សុទ្ធតែជាព្យាង្គខ្មែរពិតប្រាកដនោះទេ។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
