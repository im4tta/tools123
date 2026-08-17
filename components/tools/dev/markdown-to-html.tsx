"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function mdToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inCode = false;
  let inList = false;

  for (const raw of lines) {
    const line = raw;
    if (/^```/.test(line.trim())) {
      if (inCode) { out.push("</code></pre>"); inCode = false; }
      else { out.push("<pre><code>"); inCode = true; }
      continue;
    }
    if (inCode) { out.push(escapeHtml(line)); continue; }

    const h = line.match(/^(#{1,6})\s+(.*)/);
    if (h) {
      if (inList) { out.push("</ul>"); inList = false; }
      const level = h[1].length;
      out.push(`<h${level}>${inline(escapeHtml(h[2]))}</h${level}>`);
      continue;
    }
    const li = line.match(/^\s*[-*+]\s+(.*)/);
    if (li) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${inline(escapeHtml(li[1]))}</li>`);
      continue;
    }
    if (line.trim() === "") {
      if (inList) { out.push("</ul>"); inList = false; }
      continue;
    }
    if (inList) { out.push("</ul>"); inList = false; }
    out.push(`<p>${inline(escapeHtml(line))}</p>`);
  }
  if (inList) out.push("</ul>");
  if (inCode) out.push("</code></pre>");
  return out.join("\n");
}

export default function MarkdownToHtml() {
  const { text: t } = useLanguage();
  const [md, setMd] = useToolState("markdown-to-html:input", "# Hello\n\nThis is **bold** and *italic* with a [link](https://example.com).\n\n- item one\n- item two");

  const html = useMemo(() => (md.trim() ? mdToHtml(md) : ""), [md]);

  return (
    <ToolShell
      title="Markdown → HTML"
      khmerTitle="បម្លែង Markdown → HTML"
      description="Convert Markdown text into clean HTML source you can copy or embed."
      descriptionKm="បម្លែងអត្ថបទ Markdown ទៅជា HTML ស្អាត ដែលអ្នកអាចចម្លង ឬបញ្ចូលក្នុងទំព័របាន។"
    >
      <Field label={t("Markdown", "Markdown")}>
        <TextArea rows={10} value={md} onChange={(e) => setMd(e.target.value)} />
      </Field>
      <Output label={t("HTML", "HTML")} value={html} />
    </ToolShell>
  );
}
