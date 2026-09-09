"use client";

import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Output } from "@/components/ui/Output";
import { Field, Select, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

// Folds Khmer text to a base-consonant "search key" for accent-insensitive
// matching: removes dependent vowel signs, diacritics, the coeng (subscript)
// marker, and zero-width characters, keeping base consonants and independent
// vowels. Deterministic Unicode transform — U+17B4–U+17D3 (vowel signs, signs,
// coeng), U+17DD (atthacan), and zero-widths are stripped.
const STRIP = /[\u17B4-\u17D3\u17DD\u200B-\u200D\uFEFF]/g;

function toSearchKey(line: string): string {
  return line.replace(STRIP, "").replace(/\s+/g, " ").trim();
}

export default function KhmerSearchNormalizer() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-search-normalizer:input", "ស្ត្រី\nសិក្សា\nភ្នំពេញ\nកម្ពុជា");
  const [collapse, setCollapse] = useToolState("khmer-search-normalizer:collapse", "no");

  const result = useMemo(() => {
    const lines = input.split("\n");
    const keys = lines.map((line) => {
      let key = toSearchKey(line);
      if (collapse === "yes") key = key.replace(/\s+/g, "");
      return key;
    });
    const removed = (input.match(STRIP) ?? []).length;
    return { keys, removed };
  }, [input, collapse]);

  return (
    <ToolShell
      title="Khmer Search-Key Normalizer"
      khmerTitle="ឧបករណ៍ធ្វើឲ្យធម្មតាកូនសោស្វែងរកខ្មែរ"
      description="Fold Khmer words to a base-consonant key — stripping vowel signs, diacritics, the coeng marker, and zero-width characters — so search and matching ignore spelling and accent variations."
      descriptionKm="បំបែកពាក្យខ្មែរទៅជាកូនសោព្យញ្ជនៈមូលដ្ឋាន — ដកសញ្ញាស្រៈ សញ្ញាកំណត់ ជើង និងតួអក្សរទទឹងសូន្យ — ដើម្បីឲ្យការស្វែងរក និងការផ្គូផ្គងមិនគិតពីភាពខុសគ្នានៃការសរសេរ។"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Field label="Collapse spaces" labelKm="បង្រួមដកឃ្លា" hint="remove all spaces in the key" hintKm="ដកដកឃ្លាទាំងអស់ក្នុងកូនសោ">
          <Select value={collapse} onChange={(e) => setCollapse(e.target.value)}>
            <option value="no">{t("No — keep word spacing", "ទេ — រក្សាដកឃ្លាពាក្យ")}</option>
            <option value="yes">{t("Yes — one compact key", "បាទ/ចាស — កូនសោបង្រួម")}</option>
          </Select>
        </Field>
        <div className="sm:col-span-3">
          <Field label="Khmer text (one entry per line)" labelKm="អត្ថបទខ្មែរ (មួយធាតុក្នុងមួយបន្ទាត់)">
            <TextArea rows={6} value={input} onChange={(e) => setInput(e.target.value)} className="font-khmer text-base" />
          </Field>
        </div>
      </div>

      <Output label={t("Search keys", "កូនសោស្វែងរក")} value={result.keys.join("\n")} mono={false} />

      <p className="text-xs text-[var(--ink-dim)]">{t("Marks removed", "សញ្ញាបានដក")}: <strong className="font-mono-ui text-[var(--ink)]">{result.removed}</strong></p>

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "The coeng marker is removed, so a subscript consonant becomes a normal one (ស្ត្រី → សតរ). Keys are for indexing and fuzzy matching — they are not readable Khmer and should not be displayed to end users.",
          "សញ្ញាជើងត្រូវបានដក ដូច្នេះព្យញ្ជនៈជើងក្លាយជាព្យញ្ជនៈធម្មតា (ស្ត្រី → សតរ)។ កូនសោសម្រាប់ការធ្វើលិបិក្រម និងការផ្គូផ្គង — វាមិនមែនជាខ្មែរអានបានទេ ហើយមិនគួរបង្ហាញដល់អ្នកប្រើចុងក្រោយ។"
        )}
      </p>
    </ToolShell>
  );
}
