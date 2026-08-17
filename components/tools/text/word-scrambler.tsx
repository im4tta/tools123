"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function WordScrambler() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("word-scrambler:input", "Hello world");
  const [mode, setMode] = useToolState("word-scrambler:mode", "words");
  const [seed, setSeed] = useToolState("word-scrambler:seed", "1");

  const output = useMemo(() => {
    if (!input.trim()) return "";
    const s = Number(seed) || 0;
    // Deterministic shuffle by seed (mulberry32).
    function rng() {
      let a = s;
      return function () {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    const rand = rng();
    const shuffle = (w: string) => {
      const letters = [...w];
      for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
      }
      if (letters.join("") === w && letters.length > 1) {
        [letters[0], letters[letters.length - 1]] = [letters[letters.length - 1], letters[0]];
      }
      return letters.join("");
    };

    if (mode === "words") {
      return input.split(/\s+/).map((w) => shuffle(w)).join(" ");
    }
    // mode === "letters": shuffle all characters (keep spaces)
    const chars = [...input].filter((c) => c !== " ");
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    let idx = 0;
    return [...input].map((c) => (c === " " ? " " : chars[idx++])).join("");
  }, [input, mode, seed]);

  return (
    <ToolShell
      title="Word Scrambler"
      khmerTitle="លាយអក្សរ"
      description="Shuffle the letters of words — either each word's letters, or all letters mixed together."
      descriptionKm="លាយអក្សរនៃពាក្យ — លាយអក្សរក្នុងពាក្យនីមួយៗ ឬលាយអក្សរទាំងអស់ចូលគ្នា។"
    >
      <Field label={t("Text", "អត្ថបទ")}>
        <TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      <Field label={t("Mode", "របៀប")}>
        <Select value={mode} onChange={(e) => setMode(e.target.value)} className="w-48">
          <option value="words">{t("Shuffle per word", "លាយក្នុងពាក្យនីមួយៗ")}</option>
          <option value="letters">{t("Shuffle all letters", "លាយអក្សរទាំងអស់")}</option>
        </Select>
      </Field>
      <Field label={t("Seed (optional)", "គ្រាប់ចៃដន្យ (ស្រេចចិត្ត)")}>
        <Select value={seed} onChange={(e) => setSeed(e.target.value)} className="w-48">
          {["0", "1", "2", "3", "4", "5"].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </Select>
      </Field>
      <Output label={t("Scrambled", "លាយរួច")} value={output} />
    </ToolShell>
  );
}
