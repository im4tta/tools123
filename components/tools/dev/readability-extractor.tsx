"use client";
import { useMemo, useState } from "react";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const NOISE_TAGS = new Set([
  "script", "style", "nav", "header", "footer", "aside", "form",
  "button", "svg", "noscript", "iframe", "template",
]);
const NOISE_HINT = /(nav|menu|sidebar|footer|header|comment|share|social|ad-|advert|promo|related|widget|cookie|subscribe|newsletter|popup)/i;

interface Block {
  text: string;
  tag: string;
  score: number;
}

function extract(html: string): { title: string; blocks: Block[] } {
  if (typeof window === "undefined" || !html.trim()) return { title: "", blocks: [] };
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Strip obvious chrome/noise before scoring, mirroring what tools like
  // Readability.js / trafilatura / jusText do as a first pass.
  doc.querySelectorAll("*").forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const cls = `${el.getAttribute("class") ?? ""} ${el.getAttribute("id") ?? ""}`;
    if (NOISE_TAGS.has(tag) || NOISE_HINT.test(cls)) el.remove();
  });

  const title = doc.querySelector("title")?.textContent?.trim() || doc.querySelector("h1")?.textContent?.trim() || "";

  const candidates = Array.from(doc.querySelectorAll("p, li, blockquote"));
  const blocks: Block[] = candidates
    .map((el) => {
      const text = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (text.length < 40) return null;
      // Simple density heuristic: longer, punctuation-bearing text blocks
      // with a reasonable link density score higher — the same signal
      // boilerpipe / dragnet / jusText use to separate content from chrome.
      const linkChars = Array.from(el.querySelectorAll("a")).reduce((n, a) => n + (a.textContent?.length || 0), 0);
      const linkDensity = linkChars / text.length;
      const punctBonus = (text.match(/[.!?,]/g) || []).length;
      const score = text.length + punctBonus * 2 - linkDensity * text.length * 1.5;
      return { text, tag: el.tagName.toLowerCase(), score };
    })
    .filter((b): b is Block => b !== null && b.score > 20);

  return { title, blocks };
}

export default function ReadabilityExtractor() {
  const [html, setHtml] = useToolState(
    "readability-extractor:html",
    `<article>\n  <nav>Home | About</nav>\n  <h1>Sample Article</h1>\n  <p class="byline">By a Correspondent, 2 hours ago</p>\n  <p>This is the real opening paragraph of the article, long enough to score as content rather than as chrome.</p>\n  <aside class="related">You might also like: five other stories</aside>\n  <p>A second solid paragraph continues the argument, again well past the short-snippet threshold used for scoring.</p>\n  <footer>© 2026 Example</footer>\n</article>`
  );
  const [format, setFormat] = useState<"text" | "markdown">("text");

  const { title, blocks } = useMemo(() => extract(html), [html]);

  const output = useMemo(() => {
    if (!blocks.length) return "";
    const body = blocks
      .map((b) => (format === "markdown" && b.tag === "li" ? `- ${b.text}` : format === "markdown" && b.tag === "blockquote" ? `> ${b.text}` : b.text))
      .join("\n\n");
    if (format === "markdown" && title) return `# ${title}\n\n${body}`;
    return title ? `${title}\n\n${body}` : body;
  }, [blocks, title, format]);

  return (
    <ToolShell
      title="Article / HTML Content Extractor"
      description="Paste a page's HTML and pull out just the article text — strips nav, ads, and boilerplate the way readability-style extractors do, entirely in your browser."
    >
      <Field label="Source HTML" hint="View source / inspect on any page and paste the relevant markup">
        <TextArea rows={10} value={html} onChange={(e) => setHtml(e.target.value)} placeholder="<html>…</html>" />
      </Field>
      <Field label="Output format">
        <Select value={format} onChange={(e) => setFormat(e.target.value as "text" | "markdown")}>
          <option value="text">Plain text</option>
          <option value="markdown">Markdown-ish</option>
        </Select>
      </Field>
      <Output label={`Extracted content${blocks.length ? ` (${blocks.length} block${blocks.length === 1 ? "" : "s"})` : ""}`} value={output} mono={false} />
    </ToolShell>
  );
}
