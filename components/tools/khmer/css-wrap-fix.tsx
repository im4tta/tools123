"use client";
import { useMemo, useState } from "react";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

type Strategy = "anywhere" | "break-all" | "manual-zwsp";

const SAMPLE =
  "ក្រុមហ៊ុនសាងសង់និងវិនិយោគស៊ីអិនអូគឺជាក្រុមហ៊ុនឈានមុខគេមួយនៅកម្ពុជាដែលផ្តល់សេវាកម្មសាងសង់អគារខ្ពស់ៗ";

export default function CssWrapFix() {
  const [text, setText] = useToolState("css-wrap-fix:text", SAMPLE);
  const [width, setWidth] = useToolState("css-wrap-fix:width", 220);
  const [strategy, setStrategy] = useState<Strategy>("anywhere");

  const css = useMemo(() => {
    // Khmer script has no spaces between "words," so the browser's default
    // word-based line wrapping has nothing to break on and lets long runs of
    // Khmer text overflow their container instead of wrapping. These are the
    // three practical fixes, in order of how much they preserve syllable
    // shape: overflow-wrap:anywhere (best — only breaks when a line
    // genuinely has nowhere else to go), word-break:break-all (blunter, can
    // split mid-glyph-cluster), or inserting zero-width spaces at syllable
    // boundaries yourself so the browser has real wrap points to use.
    if (strategy === "anywhere") {
      return `.khmer-text {\n  font-family: "Noto Sans Khmer", sans-serif;\n  overflow-wrap: anywhere;\n  word-break: normal;\n  line-break: auto;\n}`;
    }
    if (strategy === "break-all") {
      return `.khmer-text {\n  font-family: "Noto Sans Khmer", sans-serif;\n  word-break: break-all;\n  overflow-wrap: break-word;\n}`;
    }
    return `.khmer-text {\n  font-family: "Noto Sans Khmer", sans-serif;\n  white-space: pre-wrap; /* respects the inserted \\u200b breakpoints */\n}`;
  }, [strategy]);

  // A crude syllable-boundary heuristic for the manual-ZWSP option: insert a
  // zero-width space after each independent consonant that isn't followed by
  // a subscript (coeng) marker, which approximates syllable starts without
  // needing a full segmentation dictionary.
  const zwspText = useMemo(() => {
    if (strategy !== "manual-zwsp") return text;
    let out = "";
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      out += ch;
      const cp = ch.codePointAt(0)!;
      const isConsonant = cp >= 0x1780 && cp <= 0x17a2;
      const nextIsCoeng = text.codePointAt(i + 1) === 0x17d2;
      if (isConsonant && !nextIsCoeng && i < text.length - 1) out += "\u200b";
    }
    return out;
  }, [text, strategy]);

  return (
    <ToolShell
      title="Khmer Line-Wrap CSS Fix"
      khmerTitle="ជួសជុលការបំបែកបន្ទាត់"
      description="Khmer script has no spaces between words, so a long run of Khmer text just overflows its box instead of wrapping — pick a strategy and preview it against a fixed-width container before shipping the CSS."
    >
      <Field label="Sample Khmer text"><TextArea rows={3} value={text} onChange={(e) => setText(e.target.value)} className="font-khmer" /></Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Strategy">
          <Select value={strategy} onChange={(e) => setStrategy(e.target.value as Strategy)}>
            <option value="anywhere">overflow-wrap: anywhere (recommended)</option>
            <option value="break-all">word-break: break-all</option>
            <option value="manual-zwsp">Insert zero-width spaces (ZWSP)</option>
          </Select>
        </Field>
        <Field label={`Preview width: ${width}px`}>
          <input
            type="range"
            min={80}
            max={400}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="w-full"
          />
        </Field>
      </div>

      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Live preview</div>
        <div
          className="font-khmer overflow-hidden rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-base leading-relaxed"
          style={{
            width,
            overflowWrap: strategy === "anywhere" ? "anywhere" : strategy === "break-all" ? "break-word" : "normal",
            wordBreak: strategy === "break-all" ? "break-all" : "normal",
            whiteSpace: strategy === "manual-zwsp" ? "pre-wrap" : "normal",
          }}
        >
          {zwspText}
        </div>
      </div>

      <Output label="CSS" value={css} />
      {strategy === "manual-zwsp" && <Output label="Text with ZWSP inserted (copy into your content)" value={zwspText} />}
    </ToolShell>
  );
}
