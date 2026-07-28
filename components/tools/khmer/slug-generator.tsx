"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, TextArea, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

// Same approximate character-by-character transliteration as the Romanization
// tool, reused here for a different job: producing an ASCII-safe URL slug
// rather than a readable Latin rendering.
const MAP: Record<string, string> = {
  "ក": "k", "ខ": "kh", "គ": "k", "ឃ": "kh", "ង": "ng", "ច": "ch", "ឆ": "chh", "ជ": "j", "ឈ": "chh", "ញ": "nh",
  "ដ": "d", "ឋ": "th", "ឌ": "d", "ឍ": "th", "ណ": "n", "ត": "t", "ថ": "th", "ទ": "t", "ធ": "th", "ន": "n",
  "ប": "b", "ផ": "ph", "ព": "p", "ភ": "ph", "ម": "m", "យ": "y", "រ": "r", "ល": "l", "វ": "v",
  "ស": "s", "ហ": "h", "ឡ": "l", "អ": "a",
  "ា": "a", "ិ": "i", "ី": "i", "ឹ": "eu", "ឺ": "eu", "ុ": "o", "ូ": "u", "ួ": "uo", "ើ": "aeu",
  "ែ": "ae", "ៃ": "ai", "ោ": "ao", "ៅ": "au", "ំ": "m", "ះ": "h", "ៀ": "ie",
  "០": "0", "១": "1", "២": "2", "៣": "3", "៤": "4", "៥": "5", "៦": "6", "៧": "7", "៨": "8", "៩": "9",
  "្": "", "​": "",
};

function transliterate(s: string) {
  return [...s].map((c) => (c in MAP ? MAP[c] : c)).join("");
}

type Sep = "-" | "_";

export default function SlugGenerator() {
  const [input, setInput] = useToolState("slug-generator:input", "តើលក់ដីនៅភ្នំពេញតម្លៃប៉ុន្មាន?");
  const [sep, setSep] = useToolState<Sep>("slug-generator:sep", "-");

  const { slug, mixedSlug } = useMemo(() => {
    const romanized = transliterate(input);
    const clean = (s: string) =>
      s
        .toLowerCase()
        .replace(/['".,!?։៕៖ៗ]/g, "")
        .trim()
        .replace(/[^a-z0-9]+/g, sep)
        .replace(new RegExp(`\\${sep}+`, "g"), sep)
        .replace(new RegExp(`^\\${sep}+|\\${sep}+$`, "g"), "");

    // Pure-Latin slug from the transliteration, plus a "mixed" fallback that
    // keeps any English/Latin words already in the input untouched and only
    // transliterates the Khmer parts — closer to what a lot of real Khmer
    // sites/URLs (and Next.js dynamic routes) actually ship.
    return { slug: clean(romanized), mixedSlug: clean(input.replace(/[\u1780-\u17ff\u200b]+/g, (m) => transliterate(m))) };
  }, [input, sep]);

  return (
    <ToolShell
      title="Khmer → URL Slug Generator"
      khmerTitle="បង្កើត slug"
      description="Turns a Khmer title into an ASCII-safe URL slug via approximate transliteration — handy for Next.js dynamic routes / static params where Khmer characters would otherwise need percent-encoding."
    >
      <Field label="Khmer title"><TextArea rows={3} value={input} onChange={(e) => setInput(e.target.value)} className="font-khmer" /></Field>
      <Field label="Word separator">
        <Select value={sep} onChange={(e) => setSep(e.target.value as Sep)}>
          <option value="-">Hyphen (-)</option>
          <option value="_">Underscore (_)</option>
        </Select>
      </Field>
      <Output label="Slug" value={slug} />
      <Output label="Mixed slug (keeps existing Latin words as-is)" value={mixedSlug} />
      <Field label="Preview">
        <TextInput readOnly value={`/blog/${slug}`} />
      </Field>
    </ToolShell>
  );
}
