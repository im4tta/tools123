"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

function renderMarkdown(md: string): string {
  let html = md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .split(/\n{2,}/)
    .map((block) => (/^<h[1-3]>|^<ul>/.test(block) ? block : `<p>${block}</p>`))
    .join("\n");
  return html;
}

export default function MarkdownPreview() {
  const [md, setMd] = useToolState("markdown-preview:md", "# Roeuh temple map\n\nTracking **oral heritage** sites across Kandal.\n\n- Wat inventory\n- Song archive\n- [khlyrics](https://tmeta.blog)");
  const html = useMemo(() => renderMarkdown(md), [md]);

  return (
    <ToolShell title="Markdown Previewer" description="A lightweight local Markdown renderer — headings, bold, italic, inline code, lists and links.">
      <Field label="Markdown">
        <TextArea rows={10} value={md} onChange={(e) => setMd(e.target.value)} />
      </Field>
      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Preview</div>
        <div
          className="prose prose-invert max-w-none rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-sm [&_a]:text-[var(--gold)] [&_code]:rounded [&_code]:bg-black/40 [&_code]:px-1 [&_h1]:font-display [&_h2]:font-display [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </ToolShell>
  );
}
