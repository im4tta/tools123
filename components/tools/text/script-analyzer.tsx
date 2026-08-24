"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ShieldAlert, Sparkles } from "lucide-react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";

interface ScriptHit {
  script: string;
  count: number;
}

interface Finding {
  char: string;
  code: string;
  name: string;
  looksLike: string;
  context: string;
}

const SCRIPT_RANGES: [string, RegExp][] = [
  ["Latin", /[A-Za-z\u00C0-\u024F]/],
  ["Khmer", /[\u1780-\u17FF\u19E0-\u19FF]/],
  ["Cyrillic", /[\u0400-\u04FF]/],
  ["Greek", /[\u0370-\u03FF]/],
  ["Han", /[\u4E00-\u9FFF\u3400-\u4DBF]/],
  ["Hiragana/Katakana", /[\u3040-\u30FF]/],
  ["Hangul", /[\uAC00-\uD7AF\u1100-\u11FF]/],
  ["Arabic", /[\u0600-\u06FF\u0750-\u077F]/],
  ["Thai", /[\u0E00-\u0E7F]/],
  ["Lao", /[\u0E80-\u0EFF]/],
  ["Hebrew", /[\u0590-\u05FF]/],
  ["Devanagari", /[\u0900-\u097F]/],
  ["Bengali", /[\u0980-\u09FF]/],
  ["Myanmar", /[\u1000-\u109F]/],
];

// Common homoglyphs: character → the Latin letter it impersonates.
const CONFUSABLES: Record<string, string> = {
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "х": "x", "у": "y", "і": "i", "ѕ": "s",
  "ԁ": "d", "ɡ": "g", "ј": "j", "қ": "k", "һ": "h", "ӏ": "i", "Ƅ": "b", "ϲ": "c", "ո": "n",
  "ο": "o", "α": "a", "ε": "e", "ι": "i", "ν": "v", "ρ": "p", "τ": "t", "υ": "u", "κ": "k",
  "Ａ": "A", "Ｂ": "B", "Ｃ": "C", "Ｅ": "E", "Ｏ": "O", "Ｐ": "P", "Ｘ": "X", "Ｙ": "Y",
  "ａ": "a", "ｂ": "b", "ｃ": "c", "ｏ": "o", "ｐ": "p", "ｅ": "e", "ｘ": "x", "ｙ": "y",
  "𝐚": "a", "𝐞": "e", "𝗈": "o", "𝓪": "a", "𝔀": "w",
};

const INVISIBLES: Record<string, { name: string }> = {
  "\u200B": { name: "zero-width space" },
  "\u200C": { name: "zero-width non-joiner" },
  "\u200D": { name: "zero-width joiner" },
  "\u200E": { name: "left-to-right mark" },
  "\u200F": { name: "right-to-left mark" },
  "\uFEFF": { name: "byte-order mark" },
  "\u00AD": { name: "soft hyphen" },
  "\u2060": { name: "word joiner" },
  "\u202A": { name: "LRE embedding" },
  "\u202B": { name: "RLE embedding" },
  "\u202C": { name: "pop directional" },
  "\u202D": { name: "LRO override" },
  "\u202E": { name: "RLO override (reverses text!)" },
};

function codeHex(ch: string): string {
  return "U+" + ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0");
}

function analyze(text: string): { scripts: ScriptHit[]; findings: Finding[]; invisibles: Finding[]; letters: number } {
  const scripts = new Map<string, number>();
  const findings: Finding[] = [];
  const invisibles: Finding[] = [];
  let letters = 0;

  const chars = Array.from(text);
  chars.forEach((ch, i) => {
    if (/\s/.test(ch)) return;

    if (INVISIBLES[ch]) {
      const before = chars.slice(Math.max(0, i - 6), i).join("");
      const after = chars.slice(i + 1, i + 7).join("");
      invisibles.push({ char: ch, code: codeHex(ch), name: INVISIBLES[ch].name, looksLike: "", context: `${before}[HERE]${after}` });
      return;
    }

    if (/[0-9\u17E0-\u17E9]/.test(ch)) return; // digits (incl. Khmer)

    let matched = false;
    for (const [script, re] of SCRIPT_RANGES) {
      if (re.test(ch)) {
        scripts.set(script, (scripts.get(script) ?? 0) + 1);
        if (script === "Latin") letters++;
        matched = true;
        break;
      }
    }
    if (!matched) {
      scripts.set("Other/Symbols", (scripts.get("Other/Symbols") ?? 0) + 1);
      return;
    }

    const lookalike = CONFUSABLES[ch];
    if (lookalike && scriptOf(ch) !== "Latin") {
      const before = chars.slice(Math.max(0, i - 6), i).join("");
      const after = chars.slice(i + 1, i + 7).join("");
      findings.push({
        char: ch,
        code: codeHex(ch),
        name: scriptOf(ch),
        looksLike: lookalike,
        context: `${before}${ch}${after}`,
      });
    }
  });

  function scriptOf(ch: string): string {
    for (const [script, re] of SCRIPT_RANGES) if (re.test(ch)) return script;
    return "Other";
  }

  const scriptList: ScriptHit[] = [...scripts.entries()]
    .map(([script, count]) => ({ script, count }))
    .sort((a, b) => b.count - a.count);

  return { scripts: scriptList, findings, invisibles, letters };
}

export default function ScriptAnalyzer() {
  const { text: t } = useLanguage();
  const [input, setInput] = useState("https://аpple.com — តើអ្នកឃើញអ្វីខុសប្រក្រតី?");

  const result = useMemo(() => analyze(input), [input]);
  const total = Math.max(1, result.scripts.reduce((s, h) => s + h.count, 0));
  const cleaned = useMemo(() => {
    let out = "";
    for (const ch of input) if (!INVISIBLES[ch]) out += ch;
    return out;
  }, [input]);

  // Keep a ref-free copy button target fresh without extra state churn.
  const cleanedRef = useRef(cleaned);

  useEffect(() => {
    cleanedRef.current = cleaned;
  }, [cleaned]);

  const suspiciousDomainLike = result.findings.length > 0;

  return (
    <ToolShell
      title="Script & Homoglyph Analyzer"
      khmerTitle="វិភាគអក្សរ និងអក្សរស្រដៀងគ្នា"
      description="Break text down by Unicode script, expose mixed-script homoglyph tricks like Cyrillic 'а' in 'аpple', and strip invisible characters."
      descriptionKm="វិភាគអត្ថបទតាមយូនីកូដ បង្ហាញអក្សរក្លែងក្លាយ ហើយសម្អាតតួអក្សរក្រឡេកមិនឃើញ។"
    >
      <div className="space-y-4">
        <Field label={t("Text to analyze", "អត្ថបទត្រូវវិភាគ")}>
          <TextArea rows={5} value={input} onChange={(e) => setInput(e.target.value)} />
        </Field>

        {/* Script breakdown */}
        <div className="space-y-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-faint)]">
            <Sparkles size={13} className="text-[var(--gold)]" />
            {t("Script breakdown", "ការបែងចែកអក្សរ")}
          </div>
          {result.scripts.length === 0 && (
            <p className="text-sm text-[var(--ink-faint)]">{t("Nothing to analyze yet.", "គ្មានអ្វីធ្វើការវិភាគទេ។")}</p>
          )}
          {result.scripts.map((hit) => (
            <div key={hit.script}>
              <div className="mb-0.5 flex items-center justify-between text-xs">
                <span className="text-[var(--ink-dim)]">{hit.script}</span>
                <span className="font-mono-ui text-[var(--ink-faint)]">
                  {hit.count} · {Math.round((hit.count / Math.max(total, 1)) * 100)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ground-line)]">
                <div className="h-full rounded-full bg-[var(--teal)]" style={{ width: `${Math.max(3, (hit.count / Math.max(total, 1)) * 100)}%` }} />
              </div>
            </div>
          ))}
          {result.scripts.filter((s) => s.script !== "Latin").length > 0 && result.letters > 0 && result.findings.length === 0 && (
            <p className="pt-1 text-xs text-[var(--ink-faint)]">
              {t("Mixed scripts present but no Latin-lookalike homoglyphs detected.", "មានអក្សរចម្រុះ ប៉ុន្តែរកមិនឃើញអក្សរក្លែងក្លាយទេ។")}
            </p>
          )}
        </div>

        {/* Homoglyph findings */}
        {(result.findings.length > 0 || suspiciousDomainLike) && (
          <div className="space-y-2 rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--danger)]">
              <ShieldAlert size={14} />
              {t("Homoglyph alerts", "ការព្រមានអក្សរក្លែងក្លាយ")} ({result.findings.length})
            </div>
            <ul className="space-y-1.5 text-sm text-[var(--ink)]">
              {result.findings.map((f, i) => (
                <li key={i} className="font-mono-ui text-xs">
                  “{f.context}” — <strong>{f.char}</strong> ({f.code}, {f.name}) {t("looks like", "ដូចជា")} <strong>{f.looksLike}</strong>
                </li>
              ))}
            </ul>
            <p className="text-xs text-[var(--ink-dim)]">
              {t("Mixed-script lookalikes inside domain names or brand words are a classic phishing trick.", "អក្សរក្លែងក្លាយក្នុងឈ្មោះដូមេន ឬពាក្យម៉ាកយីហោ ជាកលភីស៊ីងដ៏ចំណេះ។")}
            </p>
          </div>
        )}

        {/* Invisible characters */}
        {result.invisibles.length > 0 && (
          <div className="space-y-2 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--gold)]">
              {t("Invisible characters found", "រកឃើញតួអក្សរក្រឡេកមិនឃើញ")} ({result.invisibles.length})
            </div>
            <ul className="space-y-1 font-mono-ui text-xs text-[var(--ink-dim)]">
              {result.invisibles.slice(0, 12).map((f, i) => (
                <li key={i}>
                  {f.code} · {f.name}
                  <span className="ml-2 opacity-60">“{f.context.length > 40 ? f.context.slice(0, 40) + "…" : f.context}”</span>
                </li>
              ))}
            </ul>
            <div className="flex items-start gap-2 pt-1">
              <div className="min-w-0 flex-1 rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{t("Cleaned text", "អត្ថបទស្អាត")}</div>
                <div className="mt-1 break-all text-sm text-[var(--ink)]">{cleaned || "—"}</div>
              </div>
              <CopyButton text={cleaned} compact />
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}