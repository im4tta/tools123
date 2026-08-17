"use client";
import { ToolShell } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

const ROWS: [string, string][] = [
  ["Heading", "# H1\n## H2\n### H3"],
  ["Bold", "**bold text**"],
  ["Italic", "*italic text*"],
  ["Strikethrough", "~~struck~~"],
  ["Link", "[text](https://example.com)"],
  ["Image", "![alt](image.png)"],
  ["Inline code", "`code`"],
  ["Code block", "```js\nconst x = 1;\n```"],
  ["Blockquote", "> quoted text"],
  ["Unordered list", "- item\n- item"],
  ["Ordered list", "1. first\n2. second"],
  ["Table", "| A | B |\n|---|---|\n| 1 | 2 |"],
  ["Horizontal rule", "---"],
  ["Task list", "- [x] done\n- [ ] todo"],
];

export default function MarkdownCheatsheet() {
  const { text: t } = useLanguage();

  return (
    <ToolShell
      title="Markdown Cheat Sheet"
      khmerTitle="សន្លឹកយោង Markdown"
      description="Quick reference for the most common Markdown syntax."
      descriptionKm="ឯកសារយោងរហ័សសម្រាប់វាក្យសម្ព័ន្ធ Markdown ទូទៅ។"
    >
      <div className="overflow-hidden rounded-md border border-[var(--ground-line)]">
        {ROWS.map(([label, code]) => (
          <div key={label} className="grid grid-cols-1 gap-2 border-b border-[var(--ground-line)] p-3 last:border-0 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t(label, "")}</div>
              <pre className="mt-1 whitespace-pre-wrap font-mono-ui text-sm text-[var(--ink)]">{code}</pre>
            </div>
          </div>
        ))}
      </div>
    </ToolShell>
  );
}