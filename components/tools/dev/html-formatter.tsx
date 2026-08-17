"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

function formatHtml(html: string, unit: string): string {
  const tokens = html.match(/<[^>]+>|[^<]+/g) ?? [];
  let out = "";
  let level = 0;
  for (let token of tokens) {
    token = token.trim();
    if (!token) continue;
    if (token.startsWith("<!--")) { out += unit.repeat(level) + token + "\n"; continue; }
    if (/^<\//.test(token)) {
      level = Math.max(0, level - 1);
      out += unit.repeat(level) + token + "\n";
    } else if (/^<!DOCTYPE/i.test(token)) {
      out += token + "\n";
    } else if (/^<[^/].*\/>$/.test(token) || VOID.has((token.match(/^<([a-zA-Z0-9]+)/)?.[1] ?? "").toLowerCase())) {
      out += unit.repeat(level) + token + "\n";
    } else if (/^<[^/]/.test(token)) {
      out += unit.repeat(level) + token + "\n";
      level++;
    } else {
      out += unit.repeat(level) + token + "\n";
    }
  }
  return out.trim();
}

export default function HtmlFormatter() {
  const { text: t } = useLanguage();
  const [html, setHtml] = useToolState("html-formatter:input", "<div><h1>Hello</h1><p>World</p></div>");
  const [indent, setIndent] = useToolState("html-formatter:indent", "2");

  const unit = indent === "1" ? "\t" : " ".repeat(Number(indent) || 2);
  const formatted = useMemo(() => (html.trim() ? formatHtml(html, unit) : ""), [html, unit]);

  return (
    <ToolShell
      title="HTML Formatter"
      khmerTitle="រៀបចំទម្រង់ HTML"
      description="Pretty-print minified or messy HTML with proper indentation."
      descriptionKm="រៀបចំ HTML ដែលច្របូកច្របល់ ឬ minified ឱ្យមានការចូលបន្ទាត់ត្រឹមត្រូវ។"
    >
      <Field label={t("HTML", "HTML")}>
        <TextArea rows={10} value={html} onChange={(e) => setHtml(e.target.value)} />
      </Field>
      <Field label={t("Indent", "ចន្លោះចូលបន្ទាត់")}>
        <Select value={indent} onChange={(e) => setIndent(e.target.value)} className="w-40">
          <option value="2">2 spaces</option>
          <option value="4">4 spaces</option>
          <option value="1">Tab</option>
        </Select>
      </Field>
      <Output label={t("Formatted", "រៀបចំរួច")} value={formatted} />
    </ToolShell>
  );
}
