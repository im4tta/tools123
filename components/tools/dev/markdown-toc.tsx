"use client";
import { useMemo, useState } from "react";
import { ToolShell, TextArea, TextInput, Field } from "@/components/ui/Shell";
import { CopyButton } from "@/components/CopyButton";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface Heading {
  level: number;
  text: string;
  slug: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s+/g, "-");
}

function parseHeadings(markdown: string): Heading[] {
  const inCode = { active: false };
  const counts = new Map<string, number>();
  const headings: Heading[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    if (/^```/.test(line.trim())) {
      inCode.active = !inCode.active;
      continue;
    }
    if (inCode.active) continue;
    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const text = m[2].replace(/`([^`]*)`/g, "$1").replace(/\*\*([^*]*)\*\*/g, "$1").replace(/\*([^*]*)\*/g, "$1");
    let slug = slugify(text);
    const seen = counts.get(slug) ?? 0;
    counts.set(slug, seen + 1);
    if (seen > 0) slug = `${slug}-${seen}`;
    headings.push({ level: m[1].length, text, slug });
  }
  return headings;
}

export default function MarkdownToc() {
  const { text: t } = useLanguage();
  const [markdown, setMarkdown] = useToolState("markdown-toc:input", "# Getting started\n\n## Installation\n\n### Requirements\n\n## Usage\n\n### Basic example\n\n## FAQ");
  const [maxLevel, setMaxLevel] = useState("3");
  const [numbered, setNumbered] = useState(false);

  const toc = useMemo(() => {
    const max = Number(maxLevel) || 3;
    const headings = parseHeadings(markdown).filter((h) => h.level <= max);
    const minLevel = Math.min(...headings.map((h) => h.level), 99);
    return headings
      .map((h) => {
        const indent = "  ".repeat(h.level - minLevel);
        return numbered ? `${indent}1. [${h.text}](#${h.slug})` : `${indent}- [${h.text}](#${h.slug})`;
      })
      .join("\n");
  }, [markdown, maxLevel, numbered]);

  return (
    <ToolShell
      title="Markdown TOC Generator"
      khmerTitle="បង្កើតតារាងមាតិកា Markdown"
      description="Generate a table of contents with GitHub-style anchors from your Markdown headings."
      descriptionKm="បង្កើតតារាងមាតិកាជាមួយអង់គ័របែប GitHub ពីចំណងជើង Markdown របស់អ្នក។"
    >
      <div className="space-y-4">
        <Field label={t("Markdown input", "Markdown បញ្ចូល")}>
          <TextArea rows={9} value={markdown} onChange={(e) => setMarkdown(e.target.value)} className="font-mono-ui" />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t("Max heading depth", "កម្រិតចំណងជើងអតិបរមា")}>
            <TextInput inputMode="numeric" value={maxLevel} onChange={(e) => setMaxLevel(e.target.value)} className="font-mono-ui" />
          </Field>
          <label className="flex cursor-pointer items-end gap-2 pb-2 text-sm text-[var(--ink-dim)]">
            <input type="checkbox" checked={numbered} onChange={(e) => setNumbered(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
            {t("Numbered list", "បញ្ជីលេខ")}
          </label>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Table of contents", "តារាងមាតិកា")}</span>
            <CopyButton text={toc} compact />
          </div>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-4 font-mono-ui text-xs text-[var(--ink)]">{toc || "—"}</pre>
        </div>

        <p className="text-xs text-[var(--ink-faint)]">{t("Anchors follow GitHub's slugging rules and work on github.com and most Markdown renderers.", "អង់គ័រធ្វើតាមក្បួន GitHub ហើយដំណើរការលើ github.com និងកម្មវិធីបង្ហាញ Markdown ភាគច្រើន។")}</p>
      </div>
    </ToolShell>
  );
}