"use client";
import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { classifyKhmerChar, type KhmerCharClass } from "@/lib/khmer-orthography";

// Display groups (coeng marker is folded into "subscript").
type Group = "consonant" | "subscript" | "vowel" | "independent" | "diacritic" | "digit" | "other";

const GROUP_OF: Record<KhmerCharClass, Group> = {
  consonant: "consonant",
  subscript: "subscript",
  coeng: "subscript",
  vowel: "vowel",
  independent: "independent",
  diacritic: "diacritic",
  digit: "digit",
  punctuation: "other",
  latin: "other",
  space: "other",
  other: "other",
};

const META: Record<Group, { color: string; en: string; km: string }> = {
  consonant: { color: "#2563eb", en: "Consonant", km: "ព្យញ្ជនៈ" },
  subscript: { color: "#db2777", en: "Subscript (coeng)", km: "ជើង (្)" },
  vowel: { color: "#059669", en: "Vowel sign", km: "ស្រៈ" },
  independent: { color: "#7c3aed", en: "Independent vowel", km: "ស្រៈពេញតួ" },
  diacritic: { color: "#d97706", en: "Diacritic", km: "វណ្ណយុត្ត" },
  digit: { color: "#0891b2", en: "Digit", km: "លេខ" },
  other: { color: "var(--ink-faint)", en: "Other", km: "ផ្សេងៗ" },
};

const LEGEND_ORDER: Group[] = ["consonant", "subscript", "vowel", "independent", "diacritic", "digit"];
const SAMPLE = "ខ្ញុំទៅសាលារៀននៅម៉ោង ៧ ព្រឹក។";

export default function KhmerScriptHighlighter() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-highlighter:input", "");

  const { runs, counts } = useMemo(() => {
    const chars = [...input];
    const counts: Record<Group, number> = { consonant: 0, subscript: 0, vowel: 0, independent: 0, diacritic: 0, digit: 0, other: 0 };
    const runs: { group: Group; text: string }[] = [];
    let prev: string | undefined;
    for (const ch of chars) {
      const group = GROUP_OF[classifyKhmerChar(ch, prev)];
      counts[group]++;
      const last = runs[runs.length - 1];
      if (last && last.group === group) last.text += ch;
      else runs.push({ group, text: ch });
      prev = ch;
    }
    return { runs, counts };
  }, [input]);

  const hasKhmer = LEGEND_ORDER.some((g) => counts[g] > 0);

  return (
    <ToolShell
      title="Khmer Script Highlighter"
      khmerTitle="ឧបករណ៍បំណះពណ៌អក្សរខ្មែរ"
      description="Paste Khmer text and see every part of the script colour-coded: base consonants, subscripts (coeng ្), vowel signs, independent vowels, diacritics, and digits. A visual aid for learners, teachers, and font designers to see exactly how a Khmer word is built up from its pieces. Everything runs in your browser."
      descriptionKm="បិទភ្ជាប់អត្ថបទខ្មែរ ហើយមើលឃើញគ្រប់ផ្នែកនៃអក្សរដាក់ពណ៌៖ ព្យញ្ជនៈ ជើង (្) ស្រៈ ស្រៈពេញតួ វណ្ណយុត្ត និងលេខ។ ជាជំនួយមើលឃើញសម្រាប់អ្នករៀន គ្រូ និងអ្នករចនាពុម្ពអក្សរ ដើម្បីមើលពីរបៀបដែលពាក្យខ្មែរបង្កើតឡើងពីផ្នែកនីមួយៗ។ អ្វីៗដំណើរការក្នុងកម្មវិធីរុករក។"
    >
      <Field label="Khmer text" labelKm="អត្ថបទខ្មែរ">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={4} lang="km" className="font-khmer" placeholder={t("Paste or type Khmer text…", "បិទភ្ជាប់ ឬវាយអត្ថបទខ្មែរ…")} />
      </Field>

      <button
        type="button"
        onClick={() => setInput(SAMPLE)}
        className="w-fit rounded-md border border-[var(--ground-line)] px-2.5 py-1 text-xs text-[var(--ink-dim)] transition hover:border-[var(--ink-faint)]"
      >
        {t("Try a sample", "សាកគំរូ")}
      </button>

      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {LEGEND_ORDER.map((g) => (
          <span key={g} className="flex items-center gap-1.5 text-xs text-[var(--ink-dim)]">
            <span className="h-3 w-3 rounded-sm" style={{ background: META[g].color }} />
            {t(META[g].en, META[g].km)}
            <span className="text-[var(--ink-faint)]">{counts[g]}</span>
          </span>
        ))}
      </div>

      <div className="min-h-[3rem] rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-3">
        {input ? (
          <p lang="km" className="whitespace-pre-wrap break-words font-khmer text-2xl leading-loose">
            {runs.map((r, i) => (
              <span key={i} style={{ color: META[r.group].color }}>{r.text}</span>
            ))}
          </p>
        ) : (
          <p className="text-sm text-[var(--ink-faint)]">{t("Your colour-coded text will appear here.", "អត្ថបទដាក់ពណ៌របស់អ្នកនឹងបង្ហាញនៅទីនេះ។")}</p>
        )}
      </div>

      {input && !hasKhmer && (
        <p className="text-xs text-[var(--ink-faint)]">{t("No Khmer letters detected in this text.", "រកមិនឃើញអក្សរខ្មែរក្នុងអត្ថបទនេះទេ។")}</p>
      )}

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Each character is classified by its Khmer Unicode range (base consonants U+1780–U+17A2, dependent vowels U+17B6–U+17C5, the coeng subscript marker U+17D2, and so on) following the Unicode Standard. A consonant right after a coeng is shown as a subscript. Classification runs in your browser.",
          "តួអក្សរនីមួយៗត្រូវបានចាត់ថ្នាក់តាមជួរ Unicode ខ្មែរ (ព្យញ្ជនៈ U+1780–U+17A2, ស្រៈ U+17B6–U+17C5, សញ្ញាជើង U+17D2 ។ល។) តាមស្តង់ដារ Unicode។ ព្យញ្ជនៈបន្ទាប់ពីជើងត្រូវបង្ហាញជាអក្សរជើង។ ការចាត់ថ្នាក់ដំណើរការក្នុងកម្មវិធីរុករក។",
        )}</p>
      </section>
    </ToolShell>
  );
}
