"use client";
import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { classifyKhmerChar } from "@/lib/khmer-orthography";

const SAMPLE = "សម្រាប់ការសិក្សា";

export default function KhmerConsonantSkeleton() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-skeleton:input", "");
  const [includeIndependent, setIncludeIndependent] = useToolState("khmer-skeleton:indep", true);

  const output = useMemo(() => {
    let out = "";
    for (const ch of input) {
      const cls = classifyKhmerChar(ch);
      if (cls === "vowel" || cls === "diacritic" || cls === "coeng") continue;
      if (cls === "independent" && !includeIndependent) continue;
      out += ch;
    }
    return out;
  }, [input, includeIndependent]);

  return (
    <ToolShell
      title="Khmer Consonant Skeleton Extractor"
      khmerTitle="ឧបករណ៍ស្រង់គ្រោងព្យញ្ជនៈ"
      description="Strip the vowels, subscripts (coeng), and diacritics from Khmer text to leave just the bare consonant skeleton — the 'bones' of each word. Useful for studying how words are built, generating simplified keys for fuzzy search or indexing, and comparing words that sound alike but are spelled differently. Everything runs in your browser."
      descriptionKm="ដកស្រៈ ជើង (coeng) និងវណ្ណយុត្តចេញពីអត្ថបទខ្មែរ ទុកតែគ្រោងព្យញ្ជនៈសុទ្ធ — «ឆ្អឹង» នៃពាក្យនីមួយៗ។ មានប្រយោជន៍សម្រាប់សិក្សារបៀបផ្គុំពាក្យ បង្កើតកូនសោសាមញ្ញសម្រាប់ស្វែងរកប្រហាក់ប្រហែល ឬធ្វើលិបិក្រម និងប្រៀបធៀបពាក្យដែលស្តាប់ទៅដូចគ្នាតែសរសេរខុសគ្នា។ អ្វីៗដំណើរការក្នុងកម្មវិធីរុករក។"
    >
      <Field label="Khmer text" labelKm="អត្ថបទខ្មែរ">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={4} lang="km" className="font-khmer" placeholder={t("Paste or type Khmer text…", "បិទភ្ជាប់ ឬវាយអត្ថបទខ្មែរ…")} />
      </Field>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setInput(SAMPLE)} className="rounded-md border border-[var(--ground-line)] px-2.5 py-1 text-xs text-[var(--ink-dim)] transition hover:border-[var(--ink-faint)]">
          {t("Try a sample", "សាកគំរូ")}
        </button>
        <button type="button" onClick={() => setIncludeIndependent((v) => !v)} className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${includeIndependent ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}>
          {t("Keep independent vowels", "រក្សាស្រៈពេញតួ")}
        </button>
      </div>

      <Output label="Consonant skeleton" value={output || " "} mono={false} />

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Characters are classified by their Khmer Unicode range following the Unicode Standard: dependent vowel signs (U+17B6–U+17C5), the coeng subscript marker (U+17D2), and diacritics (U+17C6–U+17DD) are removed, while base and subscript consonants are kept. Independent vowels are optional. Spaces, digits, and non-Khmer characters pass through unchanged.",
          "តួអក្សរត្រូវបានចាត់ថ្នាក់តាមជួរ Unicode ខ្មែរតាមស្តង់ដារ Unicode៖ ស្រៈ (U+17B6–U+17C5) សញ្ញាជើង (U+17D2) និងវណ្ណយុត្ត (U+17C6–U+17DD) ត្រូវបានដក ចំណែកព្យញ្ជនៈគោល និងព្យញ្ជនៈជើងត្រូវរក្សាទុក។ ស្រៈពេញតួជាជម្រើស។ ចន្លោះ លេខ និងតួអក្សរមិនមែនខ្មែរ ឆ្លងកាត់ដោយមិនប្រែប្រួល។",
        )}</p>
      </section>
    </ToolShell>
  );
}
