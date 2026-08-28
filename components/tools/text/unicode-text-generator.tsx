"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// ---- Unicode block mappings (original tables for this tool) ----

/** Fullwidth forms: U+FF01–U+FF5E mirror ASCII U+0021–U+007E (offset +0xFEE0). */
function fullwidth(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0) as number;
    out += code >= 0x21 && code <= 0x7e ? String.fromCodePoint(code + 0xfee0) : ch;
  }
  return out;
}

/** Small capital letters (IPA extensions / Latin Extended-D). Unmapped letters pass through. */
const SMALL_CAPS: Record<string, number | null> = {
  a: 0x1d00, b: 0x0299, c: 0x1d04, d: 0x1d05, e: 0x1d07, f: 0xa730, g: 0x0262,
  h: 0x029c, i: 0x026a, j: 0x1d0a, k: 0x1d0b, l: 0x029f, m: 0x1d0d, n: 0x0274,
  o: 0x1d0f, p: 0x1d18, q: 0x01eb, r: 0x0280, s: 0xa731, t: 0x1d1b, u: 0x1d1c,
  v: 0x1d20, w: 0x1d21, x: null, y: 0x028f, z: 0x1d22,
};

function smallCaps(s: string): string {
  let out = "";
  for (const ch of s) {
    const mapped = SMALL_CAPS[ch.toLowerCase()];
    out += mapped === null || mapped === undefined ? ch : String.fromCodePoint(mapped);
  }
  return out;
}

function scriptUpper(): Record<string, number> {
  return {
    A: 0x1d49c, B: 0x212c, C: 0x1d49e, D: 0x1d49f, E: 0x2130, F: 0x2131,
    G: 0x1d4a0, H: 0x210b, I: 0x2110, J: 0x1d4a1, K: 0x1d4a2, L: 0x2112,
    M: 0x2133, N: 0x1d4a3, O: 0x1d4a4, P: 0x1d4a5, Q: 0x1d4a6, R: 0x211b,
    S: 0x1d4a7, T: 0x1d4a8, U: 0x1d4a9, V: 0x1d4aa, W: 0x1d4ab, X: 0x1d4ac,
    Y: 0x1d4ad, Z: 0x1d4ae,
  };
}

const SCRIPT_UP = scriptUpper();

/** Mathematical Alphanumeric Symbols: bold, italic, script. */
function mapMath(s: string, style: "bold" | "italic" | "script"): string {
  const SCRIPT_SMALL_BASE = 0x1d4b6;
  const base: Record<"bold" | "italic" | "script", { up: number; low: number; digits: number | null }> = {
    bold: { up: 0x1d400, low: 0x1d41a, digits: 0x1d7ce },
    italic: { up: 0x1d434, low: 0x1d44e, digits: null },
    script: { up: 0, low: SCRIPT_SMALL_BASE, digits: null },
  };
  const b = base[style];
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0) as number;
    let mapped: number | null = null;
    if (style === "script" && code >= 0x41 && code <= 0x5a) {
      mapped = SCRIPT_UP[ch] ?? null;
    } else if (style === "script" && code >= 0x61 && code <= 0x7a) {
      mapped = SCRIPT_SMALL_BASE + (code - 0x61);
    } else if (code >= 0x41 && code <= 0x5a) {
      mapped = b.up + (code - 0x41);
    } else if (code >= 0x61 && code <= 0x7a) {
      mapped = b.low + (code - 0x61);
    } else if (code >= 0x30 && code <= 0x39 && b.digits !== null) {
      mapped = b.digits + (code - 0x30);
    }
    out += mapped === null ? ch : String.fromCodePoint(mapped);
  }
  return out;
}

/** Combining long stroke overlay after every non-space character. */
function strikethrough(s: string): string {
  let out = "";
  for (const ch of s) out += ch === " " ? ch : ch + "\u0336";
  return out;
}

const SUPERSCRIPT: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷",
  "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
  a: "ᵃ", b: "ᵇ", c: "ᶜ", d: "ᵈ", e: "ᵉ", f: "ᶠ", g: "ᵍ", h: "ʰ", i: "ⁱ", j: "ʲ",
  k: "ᵏ", l: "ˡ", m: "ᵐ", n: "ⁿ", o: "ᵒ", p: "ᵖ", r: "ʳ", s: "ˢ", t: "ᵗ", u: "ᵘ",
  v: "ᵛ", w: "ʷ", x: "ˣ", y: "ʸ", z: "ᶻ",
};

const SUBSCRIPT: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇",
  "8": "₈", "9": "₉", "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
  a: "ₐ", e: "ₑ", h: "ₕ", i: "ᵢ", j: "ⱼ", k: "ₖ", l: "ₗ", m: "ₘ", n: "ₙ", o: "ₒ",
  p: "ₚ", r: "ᵣ", s: "ₛ", t: "ₜ", u: "ᵤ", v: "ᵥ", x: "ₓ", y: "ᵧ",
};

function mapTable(s: string, table: Record<string, string>): string {
  let out = "";
  for (const ch of s) out += table[ch] ?? ch;
  return out;
}

/** Combining marks used by the zalgo style (U+0300–U+036F subset, minus strikethrough). */
const ZALGO_MARKS = [
  "\u0300", "\u0301", "\u0302", "\u0303", "\u0304", "\u0306", "\u0307", "\u0308",
  "\u030a", "\u030b", "\u030c", "\u0311", "\u0313", "\u0315", "\u031b", "\u0334",
  "\u0335", "\u0337", "\u0338", "\u0342", "\u0345", "\u0488",
];

/** Adds 1–3 random combining marks after each character (deterministic per seed). */
function zalgo(s: string, seed: number): string {
  let state = seed || 1;
  const rnd = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  let out = "";
  for (const ch of s) {
    if (ch === " " || ch === "\n") {
      out += ch;
      continue;
    }
    out += ch;
    const count = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < count; i++) {
      out += ZALGO_MARKS[Math.floor(rnd() * ZALGO_MARKS.length)];
    }
  }
  return out;
}

const EXAMPLES = ["Hello World!", "Keep Calm", "អក្សរ khmer 123"];

export default function UnicodeTextGenerator() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("unicode:input", "Hello World!");
  const [seed, setSeed] = useState(0);

  const outputs = useMemo(() => {
    const list: { key: string; label: string; labelKm: string; value: string }[] = [
      { key: "zalgo", label: "Zalgo / creepy", labelKm: "ហ្សាល់ហ្គោ / គួរឱ្យខ្លាច", value: zalgo(input, seed) },
      { key: "fullwidth", label: "Fullwidth", labelKm: "ពេញទទឹង", value: fullwidth(input) },
      { key: "smallcaps", label: "Small caps", labelKm: "អក្សរតូចធំ", value: smallCaps(input) },
      { key: "bold", label: "Bold", labelKm: "ដិត", value: mapMath(input, "bold") },
      { key: "italic", label: "Italic", labelKm: "ទ្រេត", value: mapMath(input, "italic") },
      { key: "script", label: "Script", labelKm: "អក្សរសរសេរ", value: mapMath(input, "script") },
      { key: "strike", label: "Strikethrough", labelKm: "គូសកាត់", value: strikethrough(input) },
      { key: "sup", label: "Superscript", labelKm: "អក្សរលើ", value: mapTable(input, SUPERSCRIPT) },
      { key: "sub", label: "Subscript", labelKm: "អក្សរក្រោម", value: mapTable(input, SUBSCRIPT) },
    ];
    return list;
  }, [input, seed]);

  return (
    <ToolShell
      title="Unicode Text Generator"
      khmerTitle="បង្កើតអត្ថបទ Unicode"
      description="Transform text into zalgo, fullwidth, small caps, bold/italic/script, strikethrough, superscript and subscript styles using Unicode blocks and combining marks."
      descriptionKm="បម្លែងអត្ថបទទៅជារចនាប័ទ្ម zalgo, ពេញទទឹង, អក្សរតូចធំ, ដិត/ទ្រេត/សរសេរ, គូសកាត់, អក្សរលើ និងអក្សរក្រោម ដោយប្រើប្លុក Unicode និងសញ្ញាផ្សំ។"
    >
      <Field label={t("Text", "អត្ថបទ")}>
        <TextArea rows={3} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>

      <div className="flex flex-wrap items-center gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setInput(example)}
            className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1 text-sm text-[var(--ink)] hover:border-[var(--gold-dim)]"
          >
            {example}
          </button>
        ))}
        <Button onClick={() => setSeed((v) => v + 1)}>{t("Re-roll zalgo", "បង្កើត zalgo ថ្មី")}</Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {outputs.map((out) => (
          <Output key={out.key} label={t(out.label, out.labelKm)} value={out.value || " "} />
        ))}
      </div>

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Mapping tables are original work based on public Unicode blocks: Mathematical Alphanumeric Symbols (U+1D400), Fullwidth Forms (U+FF00), IPA Extensions, and Combining Diacritical Marks.",
          "តារាងបម្លែងជាការងារដើមដោយផ្អែកលើប្លុក Unicode សាធារណៈ៖ Mathematical Alphanumeric Symbols (U+1D400), Fullwidth Forms (U+FF00), IPA Extensions និង Combining Diacritical Marks។"
        )}
      </p>
    </ToolShell>
  );
}
