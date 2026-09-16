"use client";

// Khmer Keyboard Layout Converter — recover text that was typed while the wrong
// keyboard layout was active. If you meant to type Khmer but the English/Latin
// layout was on you get Latin gibberish; if you meant to type English but the
// Khmer (NIIDA) layout was on you get Khmer gibberish. This remaps the keys
// either way, using the shared NIIDA layout table. Best-effort: letters and
// vowels remap reliably, some punctuation is approximate. Runs locally.

import { useMemo } from "react";
import { ArrowLeftRight } from "lucide-react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";
import { useToolState } from "@/lib/storage";
import { convertLatinToKhmer, convertKhmerToLatin } from "@/lib/khmer-keyboard-niida";

type Dir = "latin2khmer" | "khmer2latin";

export default function KhmerLayoutConverter() {
  const { text: t } = useLanguage();
  const [dir, setDir] = useToolState<Dir>("khmer-layout-converter:dir", "latin2khmer");
  const [input, setInput] = useToolState("khmer-layout-converter:input", "");

  const output = useMemo(
    () => (dir === "latin2khmer" ? convertLatinToKhmer(input) : convertKhmerToLatin(input)),
    [dir, input],
  );

  const swap = () => {
    setDir((d) => (d === "latin2khmer" ? "khmer2latin" : "latin2khmer"));
    setInput(output);
  };

  const dirButton = (value: Dir, label: string) => (
    <button
      type="button"
      onClick={() => setDir(value)}
      aria-pressed={dir === value}
      className={`rounded-md border px-3 py-2 text-sm transition ${
        dir === value
          ? "border-[var(--gold-dim)] bg-[var(--gold)]/10 text-[var(--ink)]"
          : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:border-[var(--gold-dim)]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <ToolShell
      title="Khmer Keyboard Layout Converter"
      khmerTitle="បម្លែងអក្សរពីប្លង់ក្ដារចុចខុស"
      description="Fix text typed with the wrong keyboard layout on. Meant to type Khmer but the English layout was active (so you got Latin gibberish), or meant to type English but the Khmer (NIIDA) layout was active (so you got Khmer gibberish)? This remaps the keys to what you intended. Best-effort — letters and vowels remap reliably, some punctuation is approximate. Runs locally."
      descriptionKm="កែអក្សរដែលវាយពេលបើកប្លង់ក្ដារចុចខុស។ ចង់វាយខ្មែរ តែបើកប្លង់អង់គ្លេស (ទទួលបានអក្សរឡាតាំងច្របូកច្របល់) ឬចង់វាយអង់គ្លេស តែបើកប្លង់ខ្មែរ (NIIDA) (ទទួលបានអក្សរខ្មែរច្របូកច្របល់)? ឧបករណ៍នេះបម្លែងគ្រាប់ចុចទៅជាអ្វីដែលអ្នកចង់បាន។ ជាការប៉ាន់ស្មាន — អក្សរ និងស្រៈបម្លែងបានត្រឹមត្រូវ ឯវណ្ណយុត្តិខ្លះប្រហែល។ ដំណើរការក្នុងម៉ាស៊ីន។"
    >
      <Field label="Direction" labelKm="ទិសដៅ">
        <div className="flex flex-col gap-2 sm:flex-row">
          {dirButton("latin2khmer", t("English layout → Khmer", "ប្លង់អង់គ្លេស → ខ្មែរ"))}
          {dirButton("khmer2latin", t("Khmer layout → English", "ប្លង់ខ្មែរ → អង់គ្លេស"))}
          <button
            type="button"
            onClick={swap}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--ink)]"
          >
            <ArrowLeftRight size={14} /> {t("Swap", "ដូរ")}
          </button>
        </div>
      </Field>

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {dir === "latin2khmer"
          ? t(
              "You meant to type Khmer, but the English/Latin keyboard was on. Paste the Latin gibberish below to recover the Khmer.",
              "អ្នកចង់វាយអក្សរខ្មែរ ប៉ុន្តែក្ដារចុចអង់គ្លេស/ឡាតាំងកំពុងបើក។ បិទភ្ជាប់អក្សរឡាតាំងច្របូកច្របល់ខាងក្រោម ដើម្បីទាញយកអក្សរខ្មែរវិញ។",
            )
          : t(
              "You meant to type English, but the Khmer (NIIDA) keyboard was on. Paste the Khmer gibberish below to recover the English.",
              "អ្នកចង់វាយអក្សរអង់គ្លេស ប៉ុន្តែក្ដារចុចខ្មែរ (NIIDA) កំពុងបើក។ បិទភ្ជាប់អក្សរខ្មែរច្របូកច្របល់ខាងក្រោម ដើម្បីទាញយកអក្សរអង់គ្លេសវិញ។",
            )}
      </p>

      <Field label="Input" labelKm="អក្សរបញ្ចូល">
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          className={dir === "khmer2latin" ? "font-khmer" : ""}
        />
      </Field>

      <Output
        label={dir === "latin2khmer" ? t("Khmer output", "លទ្ធផលខ្មែរ") : t("English output", "លទ្ធផលអង់គ្លេស")}
        value={output}
        mono={dir === "khmer2latin"}
      />

      <p className="text-[11px] leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Reference: the standard NIIDA Khmer keyboard layout (base + Shift layers). Layout data follows the Khmer (NIDA) keyboard tables (kbdkni) and Keyman's Khmer Angkor documentation. Punctuation and symbols vary by OS and input method, so proofread the result.",
          "ឯកសារយោង៖ ប្លង់ក្ដារចុចខ្មែរស្ដង់ដារ NIIDA (ស្រទាប់ធម្មតា + Shift)។ ទិន្នន័យប្លង់តាមតារាងក្ដារចុច Khmer (NIDA) (kbdkni) និងឯកសារ Khmer Angkor របស់ Keyman។ វណ្ណយុត្តិ និងនិមិត្តសញ្ញាអាចខុសគ្នាតាមប្រព័ន្ធ និងវិធីបញ្ចូល ដូច្នេះសូមពិនិត្យលទ្ធផលឡើងវិញ។",
        )}
      </p>
    </ToolShell>
  );
}
