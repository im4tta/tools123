"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function inline(tag: string, attr: string, content: string): string {
  const inner = content.replace(/<[^>]+>/g, "").trim();
  if (tag === "strong" || tag === "b") return `**${inner}**`;
  if (tag === "em" || tag === "i") return `*${inner}*`;
  if (tag === "code") return `\`${inner}\``;
  if (tag === "a") {
    const href = attr.match(/href="([^"]+)"/)?.[1] ?? "";
    return `[${inner}](${href})`;
  }
  return inner;
}

function htmlToMd(html: string): string {
  const lines = html.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    const text = line.trim();
    if (!text) continue;
    const h = text.match(/^<h([1-6])[^>]*>(.*?)<\/h\1>$/i);
    if (h) {
      out.push("#".repeat(Number(h[1])) + " " + h[2].replace(/<[^>]+>/g, ""));
      continue;
    }
    if (/^<li[^>]*>/i.test(text)) {
      const items = text.split(/(?=<\/li>)/i).filter((x) => /<li/i.test(x));
      items.forEach((it) => {
        const body = it.replace(/<\/?li[^>]*>/gi, "").replace(/<[^>]+>/g, "").trim();
        if (body) out.push("- " + body);
      });
      continue;
    }
    if (/^<(ul|ol)[^>]*>/i.test(text)) {
      out.push(text.replace(/<\/?(ul|ol)[^>]*>/gi, ""));
      continue;
    }
    if (/^<table/i.test(text)) continue;
    if (/^<\/?table[^>]*>/i.test(text)) continue;
    if (/^<tr/i.test(text)) {
      const cells = text.split(/(?=<\/t[hd]>)/i).filter((x) => /<t[hd]/i.test(x)).map((c) => c.replace(/<\/?t[hd][^>]*>/gi, "").replace(/<[^>]+>/g, "").trim());
      out.push("| " + cells.join(" | ") + " |");
      continue;
    }
    const img = text.match(/^<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/i);
    if (img) {
      out.push(`![${img[2]}](${img[1]})`);
      continue;
    }
    const bold = text.match(/^<(strong|b)[^>]*>(.*?)<\/\1>$/i);
    if (bold) {
      out.push(inline("strong", "", bold[2]));
      continue;
    }
    const para = text.match(/^<p[^>]*>(.*?)<\/p>$/i);
    if (para) {
      out.push(para[1].replace(/<[^>]+>/g, ""));
      continue;
    }
    out.push(text.replace(/<[^>]+>/g, ""));
  }
  return out.join("\n");
}

export default function HtmlToMarkdown() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("html-to-md:input", "<h2>Hello</h2>\n<p>This is a <strong>bold</strong> paragraph.</p>\n<ul>\n  <li>One</li>\n  <li>Two</li>\n</ul>");

  const output = useMemo(() => (input.trim() ? htmlToMd(input) : ""), [input]);

  return (
    <ToolShell
      title="HTML → Markdown"
      khmerTitle="បម្លែង HTML → Markdown"
      description="Convert HTML source to clean Markdown for blogs, docs, and notes."
      descriptionKm="បម្លែងកូដ HTML ទៅជា Markdown ស្អាត សម្រាប់ប្លុក ឯកសារ និងកំណត់ចំណាំ។"
    >
      <Field label={t("HTML", "HTML")}>
        <TextArea rows={10} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      <Output label={t("Markdown", "Markdown")} value={output} />
    </ToolShell>
  );
}